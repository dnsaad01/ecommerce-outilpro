package com.outilpro.backend.service;

import com.outilpro.backend.dto.MouvementStockRequest;
import com.outilpro.backend.dto.MouvementStockResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StockService {
    // Enregistre un mouvement (entrée/sortie) et met à jour le stock du produit concerné
    // dans la même transaction.
    MouvementStockResponse ajusterStock(MouvementStockRequest request);

    // Historique paginé, du plus récent au plus ancien. Si produitId est fourni,
    // limité aux mouvements de ce produit (utilisé par une future fiche produit détaillée).
    Page<MouvementStockResponse> lister(Long produitId, Pageable pageable);
}
