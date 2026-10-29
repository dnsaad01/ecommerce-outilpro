package com.outilpro.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategorieRequest {

    @NotBlank(message = "Le nom de la catégorie est obligatoire")
    @Size(max = 255, message = "Le nom ne peut pas dépasser 255 caractères")
    private String nom;

    @NotBlank(message = "Le slug est obligatoire")
    @Size(max = 255, message = "Le slug ne peut pas dépasser 255 caractères")
    private String slug;

    @Size(max = 500, message = "L'URL de l'image ne peut pas dépasser 500 caractères")
    private String imageUrl;
}