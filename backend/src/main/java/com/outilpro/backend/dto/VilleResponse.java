package com.outilpro.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class VilleResponse {
    private Long id;
    private String nom;
    private String codePostal;
    private BigDecimal fraisLivraison;
}