package com.outilpro.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

// Agrégat "chiffre d'affaires + nombre de commandes" pour un mois donné (représenté par son
// premier jour, pour un formatage cohérent côté front), utilisé pour l'historique mensuel
// du dashboard admin (12 derniers mois).
@Getter
@Builder
public class VenteMoisResponse {
    private LocalDate mois;
    private BigDecimal chiffreAffaires;
    private long nombreCommandes;
}
