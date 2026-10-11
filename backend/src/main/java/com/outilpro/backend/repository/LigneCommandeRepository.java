package com.outilpro.backend.repository;

import com.outilpro.backend.entity.LigneCommande;
import com.outilpro.backend.entity.StatutCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LigneCommandeRepository extends JpaRepository<LigneCommande, Long> {

    // Quantité + chiffre d'affaires cumulés par produit (toutes commandes non annulées),
    // triés par quantité vendue décroissante -> "produits les plus vendus". produitNom/
    // produitSku viennent du snapshot de la ligne (pas d'une relation vers Produit), donc
    // ce classement reste valable même si le produit a depuis été modifié ou supprimé.
    @Query("SELECT l.produitId, l.produitNom, l.produitSku, SUM(l.quantite), SUM(l.sousTotalLigne) " +
            "FROM LigneCommande l WHERE l.commande.statut <> :statutExclu " +
            "GROUP BY l.produitId, l.produitNom, l.produitSku " +
            "ORDER BY SUM(l.quantite) DESC")
    List<Object[]> topProduitsParQuantite(@Param("statutExclu") StatutCommande statutExclu);
}
