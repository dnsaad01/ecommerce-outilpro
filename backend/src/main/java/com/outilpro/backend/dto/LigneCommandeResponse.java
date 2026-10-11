package com.outilpro.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class LigneCommandeResponse {
    private Long produitId;
    private String produitNom;
    private String produitSku;
    private BigDecimal prixUnitaire;
    private Integer quantite;
    private BigDecimal sousTotalLigne;
}