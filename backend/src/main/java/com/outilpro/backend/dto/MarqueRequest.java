package com.outilpro.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarqueRequest {

    @NotBlank(message = "Le nom de la marque est obligatoire")
    @Size(max = 255, message = "Le nom ne peut pas dépasser 255 caractères")
    private String nom;

    @Size(max = 100, message = "Le pays ne peut pas dépasser 100 caractères")
    private String pays;

    @Size(max = 500, message = "L'URL du logo ne peut pas dépasser 500 caractères")
    private String logoUrl;
}