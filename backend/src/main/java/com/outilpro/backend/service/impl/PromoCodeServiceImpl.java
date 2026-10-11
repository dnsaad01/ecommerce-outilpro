package com.outilpro.backend.service.impl;

import com.outilpro.backend.dto.PromoCodeRequest;
import com.outilpro.backend.dto.PromoCodeResponse;
import com.outilpro.backend.dto.PromoPublicResponse;
import com.outilpro.backend.dto.PromoValidationResponse;
import com.outilpro.backend.entity.PromoCode;
import com.outilpro.backend.entity.TypeReduction;
import com.outilpro.backend.exception.ResourceNotFoundException;
import com.outilpro.backend.repository.PromoCodeRepository;
import com.outilpro.backend.service.PromoCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PromoCodeServiceImpl implements PromoCodeService {

    private final PromoCodeRepository promoCodeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PromoCodeResponse> findAll() {
        return promoCodeRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PromoCodeResponse findById(Long id) {
        return toResponse(getPromoCodeOuThrow(id));
    }

    @Override
    public PromoCodeResponse create(PromoCodeRequest request) {
        String code = normaliser(request.getCode());
        if (promoCodeRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Un code promo '" + code + "' existe déjà");
        }
        validerPourcentage(request);

        PromoCode promoCode = PromoCode.builder()
                .code(code)
                .typeReduction(request.getTypeReduction())
                .valeur(request.getValeur())
                .montantMinimum(request.getMontantMinimum())
                .utilisationsMax(request.getUtilisationsMax())
                .dateExpiration(request.getDateExpiration())
                .actif(request.getActif() != null ? request.getActif() : true)
                .build();

        return toResponse(promoCodeRepository.save(promoCode));
    }

    @Override
    public PromoCodeResponse update(Long id, PromoCodeRequest request) {
        PromoCode promoCode = getPromoCodeOuThrow(id);
        String code = normaliser(request.getCode());

        if (promoCodeRepository.existsByCodeAndIdNot(code, id)) {
            throw new IllegalArgumentException("Un autre code promo '" + code + "' existe déjà");
        }
        validerPourcentage(request);

        promoCode.setCode(code);
        promoCode.setTypeReduction(request.getTypeReduction());
        promoCode.setValeur(request.getValeur());
        promoCode.setMontantMinimum(request.getMontantMinimum());
        promoCode.setUtilisationsMax(request.getUtilisationsMax());
        promoCode.setDateExpiration(request.getDateExpiration());
        if (request.getActif() != null) {
            promoCode.setActif(request.getActif());
        }

        return toResponse(promoCodeRepository.save(promoCode));
    }

    @Override
    public void delete(Long id) {
        promoCodeRepository.delete(getPromoCodeOuThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PromoValidationResponse verifier(String code, BigDecimal sousTotal) {
        // Simple aperçu (page panier) : pas besoin de verrou, on ne modifie rien.
        PromoCode promoCode = getPromoCodeValideOuThrow(code, promoCodeRepository::findByCode);
        BigDecimal reduction = calculerReduction(promoCode, sousTotal);
        return PromoValidationResponse.builder()
                .code(promoCode.getCode())
                .reductionMontant(reduction)
                .build();
    }

    @Override
    public BigDecimal appliquer(String code, BigDecimal sousTotal) {
        // Consommation réelle (création de commande) : verrou pessimiste indispensable, voir
        // le commentaire sur PromoCodeRepository.findByCodePourApplication().
        PromoCode promoCode = getPromoCodeValideOuThrow(code, promoCodeRepository::findByCodePourApplication);
        BigDecimal reduction = calculerReduction(promoCode, sousTotal);

        promoCode.setUtilisationsActuelles(promoCode.getUtilisationsActuelles() + 1);
        promoCodeRepository.save(promoCode);

        return reduction;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromoPublicResponse> findActifs() {
        return promoCodeRepository.findActifs(LocalDate.now()).stream()
                .map(this::toPublicResponse)
                .collect(Collectors.toList());
    }

    // Récupère le code promo via la stratégie de lecture fournie (verrouillée ou non), puis
    // applique les mêmes règles de validité (actif / expiration / plafond d'utilisations)
    // quel que soit l'appelant — pour ne jamais avoir deux implémentations de cette logique
    // qui pourraient diverger entre l'aperçu et l'application réelle.
    private PromoCode getPromoCodeValideOuThrow(String code, Function<String, Optional<PromoCode>> recherche) {
        PromoCode promoCode = recherche.apply(normaliser(code))
                .orElseThrow(() -> new ResourceNotFoundException("Code promo introuvable : " + code));

        if (!Boolean.TRUE.equals(promoCode.getActif())) {
            throw new IllegalArgumentException("Ce code promo n'est plus actif");
        }
        if (promoCode.getDateExpiration() != null && promoCode.getDateExpiration().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Ce code promo a expiré");
        }
        if (promoCode.getUtilisationsMax() != null
                && promoCode.getUtilisationsActuelles() >= promoCode.getUtilisationsMax()) {
            throw new IllegalArgumentException("Ce code promo a atteint son nombre maximum d'utilisations");
        }
        return promoCode;
    }

    private BigDecimal calculerReduction(PromoCode promoCode, BigDecimal sousTotal) {
        if (promoCode.getMontantMinimum() != null && sousTotal.compareTo(promoCode.getMontantMinimum()) < 0) {
            throw new IllegalArgumentException(
                    "Ce code promo nécessite un minimum d'achat de " + promoCode.getMontantMinimum() + " DH");
        }

        BigDecimal reduction;
        if (promoCode.getTypeReduction() == TypeReduction.POURCENTAGE) {
            reduction = sousTotal.multiply(promoCode.getValeur())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            reduction = promoCode.getValeur();
        }

        if (reduction.compareTo(sousTotal) > 0) {
            reduction = sousTotal;
        }

        return reduction.setScale(2, RoundingMode.HALF_UP);
    }

    private void validerPourcentage(PromoCodeRequest request) {
        if (request.getTypeReduction() == TypeReduction.POURCENTAGE
                && request.getValeur().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Un pourcentage de réduction ne peut pas dépasser 100");
        }
    }

    private String normaliser(String code) {
        return code.trim().toUpperCase();
    }

    private PromoCode getPromoCodeOuThrow(Long id) {
        return promoCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Code promo introuvable, id=" + id));
    }

    private PromoPublicResponse toPublicResponse(PromoCode promoCode) {
        return PromoPublicResponse.builder()
                .code(promoCode.getCode())
                .typeReduction(promoCode.getTypeReduction())
                .valeur(promoCode.getValeur())
                .montantMinimum(promoCode.getMontantMinimum())
                .dateExpiration(promoCode.getDateExpiration())
                .build();
    }

    private PromoCodeResponse toResponse(PromoCode promoCode) {
        return PromoCodeResponse.builder()
                .id(promoCode.getId())
                .code(promoCode.getCode())
                .typeReduction(promoCode.getTypeReduction())
                .valeur(promoCode.getValeur())
                .montantMinimum(promoCode.getMontantMinimum())
                .utilisationsMax(promoCode.getUtilisationsMax())
                .utilisationsActuelles(promoCode.getUtilisationsActuelles())
                .dateExpiration(promoCode.getDateExpiration())
                .actif(promoCode.getActif())
                .build();
    }
}
