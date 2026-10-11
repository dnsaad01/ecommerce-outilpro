package com.outilpro.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

// Agrégat "chiffre d'affaires + nombre de commandes" pour un jour donné,
// utilisé pour le graphique d'évolution des ventes du dashboard admin.
@Getter
@Builder
public class VenteJourResponse {
    private LocalDate date;
    private BigDecimal chiffreAffaires;
    private long nombreCommandes;
}
