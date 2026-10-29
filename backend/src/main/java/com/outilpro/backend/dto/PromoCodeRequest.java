package com.outilpro.backend.dto;

import com.outilpro.backend.entity.TypeReduction;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PromoCodeRequest {

    @NotBlank(message = "Le code est obligatoire")
    @Size(max = 50, message = "Le code ne peut pas dépasser 50 caractères")
    private String code;

    @NotNull(message = "Le type de réduction est obligatoire")
    private TypeReduction typeReduction;

    @NotNull(message = "La valeur de réduction est obligatoire")
    @DecimalMin(value = "0.0", inclusive = false, message = "La valeur doit être supérieure à 0")
    private BigDecimal valeur;

    private BigDecimal montantMinimum;

    private Integer utilisationsMax;

    private LocalDate dateExpiration;

    private Boolean actif;
}