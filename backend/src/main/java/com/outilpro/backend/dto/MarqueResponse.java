package com.outilpro.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MarqueResponse {
    private Long id;
    private String nom;
    private String pays;
    private String logoUrl;
}