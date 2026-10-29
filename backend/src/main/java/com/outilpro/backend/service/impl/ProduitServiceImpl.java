package com.outilpro.backend.service.impl;

import com.outilpro.backend.dto.ProduitRequest;
import com.outilpro.backend.dto.ProduitResponse;
import com.outilpro.backend.entity.Categorie;
import com.outilpro.backend.entity.Marque;
import com.outilpro.backend.entity.Produit;
import com.outilpro.backend.exception.ResourceNotFoundException;
import com.outilpro.backend.repository.CategorieRepository;
import com.outilpro.backend.repository.MarqueRepository;
import com.outilpro.backend.repository.ProduitRepository;
import com.outilpro.backend.service.ProduitService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProduitServiceImpl implements ProduitService {

    private final ProduitRepository produitRepository;
    private final CategorieRepository categorieRepository;
    private final MarqueRepository marqueRepository;

    @Override
    @Transactional(readOnly = true)
    public ProduitResponse findById(Long id) {
        return toResponse(getProduitOuThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProduitResponse> rechercherCatalogue(Long categorieId, Long marqueId, String recherche,
                                                       boolean enStockUniquement, String tri) {
        String rechercheNettoyee = (recherche != null && !recherche.isBlank()) ? "%" + recherche.trim() + "%" : null;
        Sort sort = switch (tri) {
            case "prix_asc" -> Sort.by("p.prix").ascending();
            case "prix_desc" -> Sort.by("p.prix").descending();
            default -> Sort.by("p.nom").ascending();
        };
        return produitRepository.rechercherCatalogue(categorieId, marqueId, rechercheNettoyee, enStockUniquement, sort)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProduitResponse> findAllPagine(String recherche, Pageable pageable) {
        Page<Produit> page = (recherche != null && !recherche.isBlank())
                ? produitRepository.findByNomContainingIgnoreCase(recherche, pageable)
                : produitRepository.findAll(pageable);
        return page.map(this::toResponse);
    }

    @Override
    public ProduitResponse create(ProduitRequest request) {
        if (produitRepository.existsBySku(request.getSku())) {
            throw new IllegalArgumentException("Un produit avec le SKU '" + request.getSku() + "' existe déjà");
        }
        validerPrixPromotionnel(request);
        Categorie categorie = getCategorieOuThrow(request.getCategorieId());
        Marque marque = getMarqueOuThrow(request.getMarqueId());

        Produit produit = Produit.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .prix(request.getPrix())
                .prixPromotionnel(request.getPrixPromotionnel())
                .stock(request.getStock())
                .imageUrl(request.getImageUrl())
                .imagesSupplementaires(request.getImagesSupplementaires() != null
                        ? new ArrayList<>(request.getImagesSupplementaires())
                        : new ArrayList<>())
                .sku(request.getSku())
                .categorie(categorie)
                .marque(marque)
                .build();

        return toResponse(produitRepository.save(produit));
    }

    @Override
    public ProduitResponse update(Long id, ProduitRequest request) {
        Produit produit = getProduitOuThrow(id);

        if (produitRepository.existsBySkuAndIdNot(request.getSku(), id)) {
            throw new IllegalArgumentException("Un autre produit utilise déjà le SKU '" + request.getSku() + "'");
        }
        validerPrixPromotionnel(request);
        Categorie categorie = getCategorieOuThrow(request.getCategorieId());
        Marque marque = getMarqueOuThrow(request.getMarqueId());

        produit.setNom(request.getNom());
        produit.setDescription(request.getDescription());
        produit.setPrix(request.getPrix());
        produit.setPrixPromotionnel(request.getPrixPromotionnel());
        produit.setStock(request.getStock());
        produit.setImageUrl(request.getImageUrl());
        // Remplace le contenu de la collection geree par Hibernate plutot que de reassigner
        // la reference (produit.setImagesSupplementaires(nouvelleListe)) : avec @OrderColumn,
        // reassigner casse le suivi "orphanRemoval" implicite des collections @ElementCollection
        // et peut laisser des lignes orphelines dans produit_images.
        produit.getImagesSupplementaires().clear();
        if (request.getImagesSupplementaires() != null) {
            produit.getImagesSupplementaires().addAll(request.getImagesSupplementaires());
        }
        produit.setSku(request.getSku());
        produit.setCategorie(categorie);
        produit.setMarque(marque);

        return toResponse(produitRepository.save(produit));
    }

    @Override
    public void delete(Long id) {
        produitRepository.delete(getProduitOuThrow(id));
    }

    private void validerPrixPromotionnel(ProduitRequest request) {
        if (request.getPrixPromotionnel() != null
                && request.getPrixPromotionnel().compareTo(request.getPrix()) >= 0) {
            throw new IllegalArgumentException("Le prix promotionnel doit être inférieur au prix normal");
        }
    }

    private Produit getProduitOuThrow(Long id) {
        return produitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable, id=" + id));
    }

    private Categorie getCategorieOuThrow(Long categorieId) {
        return categorieRepository.findById(categorieId)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable, id=" + categorieId));
    }

    private Marque getMarqueOuThrow(Long marqueId) {
        return marqueRepository.findById(marqueId)
                .orElseThrow(() -> new ResourceNotFoundException("Marque introuvable, id=" + marqueId));
    }

    private ProduitResponse toResponse(Produit produit) {
        return ProduitResponse.builder()
                .id(produit.getId())
                .nom(produit.getNom())
                .description(produit.getDescription())
                .prix(produit.getPrix())
                .prixPromotionnel(produit.getPrixPromotionnel())
                .prixEffectif(produit.getPrixEffectif())
                .enPromotion(produit.isEnPromotion())
                .stock(produit.getStock())
                .imageUrl(produit.getImageUrl())
                .imagesSupplementaires(new ArrayList<>(produit.getImagesSupplementaires()))
                .sku(produit.getSku())
                .categorieId(produit.getCategorie().getId())
                .categorieNom(produit.getCategorie().getNom())
                .marqueId(produit.getMarque().getId())
                .marqueNom(produit.getMarque().getNom())
                .build();
    }
}