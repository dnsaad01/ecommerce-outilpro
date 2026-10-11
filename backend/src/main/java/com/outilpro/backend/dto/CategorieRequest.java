package com.outilpro.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategorieRequest {

    @NotBlank(message = "Le nom de la catégorie est obligatoire")
    private String nom;

    @NotBlank(message = "Le slug est obligatoire")
    private String slug;

    private String imageUrl;
}