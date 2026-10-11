package com.outilpro.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProduitRuptureResponse {
    private Long id;
    private String nom;
    private String sku;
    private Integer stock;
}
