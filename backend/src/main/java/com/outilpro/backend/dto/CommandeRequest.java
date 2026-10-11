package com.outilpro.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CommandeRequest {

    @NotBlank(message = "Le nom du client est obligatoire")
    @Size(max = 150, message = "Le nom ne peut pas dépasser 150 caractères")
    private String nomClient;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Pattern(
            regexp = "^(?:\\+212|0)[\\s.-]?[5-7](?:[\\s.-]?[0-9]){8}$",
            message = "Numéro de téléphone invalide (format marocain attendu, ex: 0612345678)"
    )
    private String telephoneClient;

    @NotBlank(message = "L'adresse de livraison est obligatoire")
    @Size(max = 500, message = "L'adresse ne peut pas dépasser 500 caractères")
    private String adresseLivraison;

    @NotNull(message = "La ville est obligatoire")
    private Long villeId;

    @Size(max = 1000, message = "Les notes ne peuvent pas dépasser 1000 caractères")
    private String notes;

    private String codePromo; // optionnel, laisse vide ou null si pas de code

    @NotEmpty(message = "La commande doit contenir au moins un produit")
    @Valid
    private List<LigneCommandeRequest> lignes;
}
