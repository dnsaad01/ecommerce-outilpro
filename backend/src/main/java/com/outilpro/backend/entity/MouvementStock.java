package com.outilpro.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// Journal des mouvements de stock manuels (entrée/sortie hors commande), pour la page
// "Gestion des stocks" de l'admin. Pas de relation JPA vers Produit (même convention que
// LigneCommande) : on garde un simple id + un snapshot du nom/SKU au moment du mouvement,
// pour que l'historique reste lisible même si le produit est renommé ou supprimé plus tard.
@Entity
@Table(name = "mouvements_stock")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(of = "id")
public class MouvementStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long produitId;

    @Column(nullable = false)
    private String produitNom;

    @Column(nullable = false)
    private String produitSku;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeMouvementStock type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MotifMouvementStock motif;

    @Column(length = 500)
    private String commentaire;

    // Quantité toujours positive ; le sens (ajout/retrait) est donné par "type".
    @Column(nullable = false)
    private Integer quantite;

    @Column(nullable = false)
    private Integer stockAvant;

    @Column(nullable = false)
    private Integer stockApres;

    @Column(nullable = false)
    private LocalDateTime dateCreation;
}
