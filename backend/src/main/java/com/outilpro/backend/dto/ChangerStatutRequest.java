package com.outilpro.backend.dto;

import com.outilpro.backend.entity.StatutCommande;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangerStatutRequest {

    @NotNull(message = "Le statut est obligatoire")
    private StatutCommande statut;
}