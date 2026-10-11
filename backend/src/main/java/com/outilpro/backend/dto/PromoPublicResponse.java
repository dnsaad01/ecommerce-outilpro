package com.outilpro.backend.dto;

import com.outilpro.backend.entity.TypeReduction;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Vue publique d'un code promo, exposée sur le site (page /promotions).
 * Volontairement plus restreinte que PromoCodeResponse : pas d'id,
 * pas d'utilisationsMax/utilisationsActuelles, pas de champ actif
 * (cette réponse ne contient déjà que des codes actifs par construction).
 */
@Getter
@Builder
public class PromoPublicResponse {
    private String code;
    private TypeReduction typeReduction;
    private BigDecimal valeur;
    private BigDecimal montantMinimum;
    private LocalDate dateExpiration;
}
