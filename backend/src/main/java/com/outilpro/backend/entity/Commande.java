package com.outilpro.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    // Snapshot de la ville au moment de la commande
    private Long villeId;

    @Column(nullable = false)
    private String villeNom;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fraisLivraison;

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

    @Column(length = 1000)
    private String notes;

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
