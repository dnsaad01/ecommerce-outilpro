package com.outilpro.backend.service;

import com.outilpro.backend.dto.ProduitRequest;
import com.outilpro.backend.dto.ProduitResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProduitService {
    ProduitResponse findById(Long id);

    // Catalogue public : tous les filtres (categorie/marque/recherche/stock) sont combinables,
    // et "tri" pilote l'ordre ("nom_asc" par défaut, "prix_asc", "prix_desc").
    List<ProduitResponse> rechercherCatalogue(Long categorieId, Long marqueId, String recherche,
                                               boolean enStockUniquement, String tri);

    Page<ProduitResponse> findAllPagine(String recherche, Pageable pageable);
    ProduitResponse create(ProduitRequest request);
    ProduitResponse update(Long id, ProduitRequest request);
    void delete(Long id);
}