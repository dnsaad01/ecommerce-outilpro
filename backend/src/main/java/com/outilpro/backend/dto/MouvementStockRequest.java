package com.outilpro.backend.dto;

import com.outilpro.backend.entity.MotifMouvementStock;
import com.outilpro.backend.entity.TypeMouvementStock;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MouvementStockRequest {

    @NotNull(message = "Le produit est obligatoire")
    private Long produitId;

    @NotNull(message = "Le type de mouvement est obligatoire")
    private TypeMouvementStock type;

    @NotNull(message = "La quantité est obligatoire")
    @Positive(message = "La quantité doit être supérieure à 0")
    private Integer quantite;

    @NotNull(message = "Le motif est obligatoire")
    private MotifMouvementStock motif;

    @Size(max = 500, message = "Le commentaire ne peut pas dépasser 500 caractères")
    private String commentaire;
}
