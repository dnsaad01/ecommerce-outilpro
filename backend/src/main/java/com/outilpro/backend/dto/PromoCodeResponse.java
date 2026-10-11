package com.outilpro.backend.dto;

import com.outilpro.backend.entity.TypeReduction;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class PromoCodeResponse {
    private Long id;
    private String code;
    private TypeReduction typeReduction;
    private BigDecimal valeur;
    private BigDecimal montantMinimum;
    private Integer utilisationsMax;
    private Integer utilisationsActuelles;
    private LocalDate dateExpiration;
    private Boolean actif;
}