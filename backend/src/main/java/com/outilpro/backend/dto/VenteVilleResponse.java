package com.outilpro.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

// Agrégat "chiffre d'affaires + nombre de commandes" par ville de livraison,
// utilisé pour la répartition géographique des ventes du dashboard admin.
@Getter
@Builder
public class VenteVilleResponse {
    private String ville;
    private long nombreCommandes;
    private BigDecimal chiffreAffaires;
}
