package com.outilpro.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LigneCommandeRequest {

    @NotNull(message = "L'id du produit est obligatoire")
    private Long produitId;

    @NotNull(message = "La quantité est obligatoire")
    @Positive(message = "La quantité doit être supérieure à 0")
    private Integer quantite;
}