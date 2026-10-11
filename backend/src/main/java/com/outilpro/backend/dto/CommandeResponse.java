package com.outilpro.backend.dto;

import com.outilpro.backend.entity.StatutCommande;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class CommandeResponse {
    private Long id;
    private String nomClient;
    private String telephoneClient;
    private String adresseLivraison;
    private Long villeId;
    private String villeNom;
    private BigDecimal fraisLivraison;
    private BigDecimal sousTotal;
    private BigDecimal reductionMontant;
    private BigDecimal total;
    private StatutCommande statut;
    private String notes;
    private LocalDateTime dateCreation;
    private List<LigneCommandeResponse> lignes;
    private String codePromoUtilise;
}