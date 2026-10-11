package com.outilpro.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class VilleRequest {

    @NotBlank(message = "Le nom de la ville est obligatoire")
    private String nom;

    private String codePostal;

    @NotNull(message = "Le frais de livraison est obligatoire")
    @DecimalMin(value = "0.0", message = "Le frais de livraison ne peut pas être négatif")
    private BigDecimal fraisLivraison;
}