package com.outilpro.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "produits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"categorie", "marque"})
@EqualsAndHashCode(of = "id")
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prix;

    // Prix promotionnel optionnel : si défini ET inférieur à prix, le produit est "en promo".
    // Le prix normal (prix) devient alors le prix barré affiché côté vitrine.
    @Column(precision = 10, scale = 2)
    private BigDecimal prixPromotionnel;

    @Column(nullable = false)
    private Integer stock;

    private String imageUrl;

    @Column(nullable = false, unique = true)
    private String sku;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id", nullable = false)
    private Categorie categorie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marque_id", nullable = false)
    private Marque marque;

    /**
     * Prix réellement facturé au client : le prix promotionnel s'il est défini et
     * strictement inférieur au prix normal, sinon le prix normal. Centralisé ici pour
     * que l'affichage (ProduitResponse) et la facturation (CommandeServiceImpl)
     * appliquent exactement la même règle — jamais deux endroits qui pourraient diverger.
     */
    public BigDecimal getPrixEffectif() {
        if (prixPromotionnel != null && prixPromotionnel.compareTo(prix) < 0) {
            return prixPromotionnel;
        }
        return prix;
    }

    public boolean isEnPromotion() {
        return prixPromotionnel != null && prixPromotionnel.compareTo(prix) < 0;
    }
}