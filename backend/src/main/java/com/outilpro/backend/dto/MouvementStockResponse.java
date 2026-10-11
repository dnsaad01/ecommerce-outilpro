package com.outilpro.backend.dto;

import com.outilpro.backend.entity.MotifMouvementStock;
import com.outilpro.backend.entity.TypeMouvementStock;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MouvementStockResponse {
    private Long id;
    private Long produitId;
    private String produitNom;
    private String produitSku;
    private TypeMouvementStock type;
    private MotifMouvementStock motif;
    private String commentaire;
    private Integer quantite;
    private Integer stockAvant;
    private Integer stockApres;
    private LocalDateTime dateCreation;
}
