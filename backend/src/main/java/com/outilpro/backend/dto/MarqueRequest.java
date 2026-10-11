package com.outilpro.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarqueRequest {

    @NotBlank(message = "Le nom de la marque est obligatoire")
    private String nom;

    private String pays;

    private String logoUrl;
}