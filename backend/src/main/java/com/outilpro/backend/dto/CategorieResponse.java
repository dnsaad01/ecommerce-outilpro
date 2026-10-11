package com.outilpro.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CategorieResponse {
    private Long id;
    private String nom;
    private String slug;
    private String imageUrl;
}