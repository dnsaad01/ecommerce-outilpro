package com.outilpro.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class ProduitResponse {
    private Long id;
    private String nom;
    private String description;
    private BigDecimal prix;
    private BigDecimal prixPromotionnel;
    private BigDecimal prixEffectif; // prix réellement facturé (= prixPromotionnel si actif, sinon prix)
    private boolean enPromotion;
    private Integer stock;
    private String imageUrl;
    private List<String> imagesSupplementaires;
    private String sku;
    private Long categorieId;
    private String categorieNom;
    private Long marqueId;
    private String marqueNom;
}