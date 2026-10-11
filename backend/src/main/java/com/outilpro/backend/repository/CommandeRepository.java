package com.outilpro.backend.repository;

import com.outilpro.backend.entity.Commande;
import com.outilpro.backend.entity.StatutCommande;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface CommandeRepository extends JpaRepository<Commande, Long> {
    // findAll(Pageable) est déjà fourni par JpaRepository (non paginé + paginé).
    Page<Commande> findByStatut(StatutCommande statut, Pageable pageable);
    List<Commande> findByTelephoneClient(String telephoneClient);

    long countByStatut(StatutCommande statut);

    // Chiffre d'affaires = somme des commandes hors un statut donné (ANNULEE en pratique).
    // COALESCE évite un NULL renvoyé par SUM() quand il n'y a encore aucune commande en base.
    @Query("SELECT COALESCE(SUM(c.total), 0) FROM Commande c WHERE c.statut <> :statutExclu")
    BigDecimal sommeChiffreAffaires(@Param("statutExclu") StatutCommande statutExclu);

    // Projection légère (date + montant) pour construire le graphique d'évolution des ventes
    // en mémoire (regroupement par jour côté service, portable quel que soit le SGBD).
    @Query("SELECT c.dateCreation, c.total FROM Commande c WHERE c.statut <> :statutExclu AND c.dateCreation >= :depuis")
    List<Object[]> ventesDepuis(@Param("statutExclu") StatutCommande statutExclu, @Param("depuis") LocalDateTime depuis);

    // Répartition des ventes par ville de livraison (toutes commandes non annulées), triée
    // par chiffre d'affaires décroissant.
    @Query("SELECT c.villeNom, COUNT(c), SUM(c.total) FROM Commande c " +
            "WHERE c.statut <> :statutExclu GROUP BY c.villeNom ORDER BY SUM(c.total) DESC")
    List<Object[]> repartitionParVille(@Param("statutExclu") StatutCommande statutExclu);
}
