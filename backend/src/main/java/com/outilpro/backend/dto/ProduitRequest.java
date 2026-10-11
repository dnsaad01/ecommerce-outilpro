package com.outilpro.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProduitRequest {

    @NotBlank(message = "Le nom du produit est obligatoire")
    private String nom;

    private String description;

    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "0.0", inclusive = false, message = "Le prix doit être supérieur à 0")
    private BigDecimal prix;

    // Optionnel : si renseigné, doit être inférieur à prix (vérifié dans le service,
    // une contrainte inter-champs n'est pas exprimable proprement avec les annotations seules).
    @DecimalMin(value = "0.0", inclusive = false, message = "Le prix promotionnel doit être supérieur à 0")
    private BigDecimal prixPromotionnel;

    @NotNull(message = "Le stock est obligatoire")
    @PositiveOrZero(message = "Le stock ne peut pas être négatif")
    private Integer stock;

    private String imageUrl;

    @NotBlank(message = "Le SKU est obligatoire")
    private String sku;

    @NotNull(message = "La catégorie est obligatoire")
    private Long categorieId;

    @NotNull(message = "La marque est obligatoire")
    private Long marqueId;
}