package com.outilpro.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

// Agrégat "chiffre d'affaires + nombre de commandes" pour une ville donnée (telle que
// saisie librement par le client à la commande, champ Commande.ville -- pas une entité
// de référence), pour le bloc "Ventes par ville" de la page Statistiques & Analyses.
@Getter
@Builder
public class VenteVilleResponse {
    private String ville;
    private long nombreCommandes;
    private BigDecimal chiffreAffaires;
}
