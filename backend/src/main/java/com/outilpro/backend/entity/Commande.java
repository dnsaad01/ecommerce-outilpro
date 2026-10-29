package com.outilpro.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// Livraison toujours gratuite, sans frais selon la ville. La ville est tout de même
// capturée (simple champ texte, pas d'entité/référentiel dédié) car l'admin en a besoin
// pour savoir où expédier la commande.
//
// ville est volontairement NULLABLE côté base (contrairement aux autres champs obligatoires
// ci-dessous) : le formulaire Checkout l'exige déjà (voir @NotBlank sur CommandeRequest.ville),
// donc toute NOUVELLE commande a bien une ville -- mais une colonne NOT NULL sans valeur par
// défaut ne peut pas être ajoutée par ddl-auto=update sur une table "commandes" qui contient
// déjà des lignes (ALTER TABLE échoue silencieusement côté Postgres). Nullable ici correspond
// aussi au fallback "Non renseignée" déjà prévu pour les anciennes commandes dans
// CommandeRepository.repartitionParVille (COALESCE(c.ville, 'Non renseignée')).
@Entity
@Table(name = "commandes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "lignes")
@EqualsAndHashCode(of = "id")
public class Commande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nomClient;

    @Column(nullable = false, length = 20)
    private String telephoneClient;

    @Column(nullable = false, length = 500)
    private String adresseLivraison;

    @Column(length = 100)
    private String ville;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal sousTotal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal reductionMontant;
    private String codePromoUtilise;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutCommande statut;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<LigneCommande> lignes = new ArrayList<>();

    public void ajouterLigne(LigneCommande ligne) {
        lignes.add(ligne);
        ligne.setCommande(this);
    }
}
