package com.outilpro.backend.service.impl;

import com.outilpro.backend.dto.MouvementStockRequest;
import com.outilpro.backend.dto.MouvementStockResponse;
import com.outilpro.backend.entity.MouvementStock;
import com.outilpro.backend.entity.Produit;
import com.outilpro.backend.entity.TypeMouvementStock;
import com.outilpro.backend.exception.ResourceNotFoundException;
import com.outilpro.backend.repository.MouvementStockRepository;
import com.outilpro.backend.repository.ProduitRepository;
import com.outilpro.backend.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class StockServiceImpl implements StockService {

    private final ProduitRepository produitRepository;
    private final MouvementStockRepository mouvementStockRepository;

    @Override
    public MouvementStockResponse ajusterStock(MouvementStockRequest request) {
        // Verrou pessimiste : mêmes raisons que dans CommandeServiceImpl.create() — on lit
        // le stock puis on le modifie, donc deux ajustements concurrents sur le même produit
        // (ou un ajustement admin en même temps qu'une commande client) doivent être sérialisés.
        Produit produit = produitRepository.findByIdPourMiseAJourStock(request.getProduitId())
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable, id=" + request.getProduitId()));

        int stockAvant = produit.getStock();
        int stockApres = request.getType() == TypeMouvementStock.ENTREE
                ? stockAvant + request.getQuantite()
                : stockAvant - request.getQuantite();

        if (stockApres < 0) {
            throw new IllegalArgumentException(
                    "Sortie refusée : il ne reste que " + stockAvant + " unité(s) en stock pour \"" + produit.getNom() + "\".");
        }

        produit.setStock(stockApres);
        produitRepository.save(produit);

        MouvementStock mouvement = MouvementStock.builder()
                .produitId(produit.getId())
                .produitNom(produit.getNom())
                .produitSku(produit.getSku())
                .type(request.getType())
                .motif(request.getMotif())
                .commentaire(request.getCommentaire())
                .quantite(request.getQuantite())
                .stockAvant(stockAvant)
                .stockApres(stockApres)
                .dateCreation(LocalDateTime.now())
                .build();

        return toResponse(mouvementStockRepository.save(mouvement));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MouvementStockResponse> lister(Long produitId, Pageable pageable) {
        Page<MouvementStock> page = (produitId != null)
                ? mouvementStockRepository.findByProduitIdOrderByDateCreationDesc(produitId, pageable)
                : mouvementStockRepository.findAllByOrderByDateCreationDesc(pageable);
        return page.map(this::toResponse);
    }

    private MouvementStockResponse toResponse(MouvementStock mouvement) {
        return MouvementStockResponse.builder()
                .id(mouvement.getId())
                .produitId(mouvement.getProduitId())
                .produitNom(mouvement.getProduitNom())
                .produitSku(mouvement.getProduitSku())
                .type(mouvement.getType())
                .motif(mouvement.getMotif())
                .commentaire(mouvement.getCommentaire())
                .quantite(mouvement.getQuantite())
                .stockAvant(mouvement.getStockAvant())
                .stockApres(mouvement.getStockApres())
                .dateCreation(mouvement.getDateCreation())
                .build();
    }
}
