package com.outilpro.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

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

    // Photos supplementaires de la galerie (en plus de imageUrl, qui reste la photo de
    // couverture affichee sur les cartes produit et en liste). Table a part generee par
    // JPA (produit_images), ordre preserve via @OrderColumn -- c'est l'ordre d'ajout par
    // defaut, l'admin peut en retirer n'importe laquelle depuis le formulaire.
    @ElementCollection
    @CollectionTable(name = "produit_images", joinColumns = @JoinColumn(name = "produit_id"))
    @OrderColumn(name = "position")
    @Column(name = "url", length = 500)
    @Builder.Default
    private List<String> imagesSupplementaires = new ArrayList<>();

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