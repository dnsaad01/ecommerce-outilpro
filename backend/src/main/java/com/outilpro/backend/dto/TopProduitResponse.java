package com.outilpro.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

// Agrégat "quantité vendue + chiffre d'affaires" par produit (toutes commandes non annulées),
// utilisé pour le classement "produits les plus vendus" du dashboard admin.
@Getter
@Builder
public class TopProduitResponse {
    private Long produitId;
    private String nom;
    private String sku;
    private long quantiteVendue;
    private BigDecimal chiffreAffaires;
}
