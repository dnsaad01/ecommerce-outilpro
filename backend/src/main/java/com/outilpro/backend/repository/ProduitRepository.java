package com.outilpro.backend.repository;

import com.outilpro.backend.entity.Produit;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProduitRepository extends JpaRepository<Produit, Long> {

    // Version paginée, utilisée par l'admin (le catalogue public continue d'utiliser
    // les méthodes non paginées ci-dessus, pour ne pas casser son contrat existant).
    Page<Produit> findByNomContainingIgnoreCase(String motCle, Pageable pageable);
    // findAll(Pageable) est déjà fourni par JpaRepository pour le cas "pas de recherche".

    // Alerte stock : tout produit dont le stock est <= au seuil configuré (voir
    // app.stock.seuil-alerte), pas seulement les ruptures totales (stock = 0).
    long countByStockLessThanEqual(Integer seuil);
    List<Produit> findByStockLessThanEqualOrderByStockAscNomAsc(Integer seuil);

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, Long id);

    // Utilise par l'import Excel pour decider si une ligne cree un nouveau produit
    // ou met a jour un produit existant portant deja ce SKU.
    Optional<Produit> findBySku(String sku);

    // Catalogue public : tous les filtres sont combinables (categorieId ET marqueId ET
    // recherche ET enStockUniquement en même temps), contrairement à l'ancienne version qui
    // ne supportait qu'un filtre à la fois. Chaque condition est ignorée quand son paramètre
    // est null (ou false pour enStockUniquement). Le tri est ajouté par Spring Data à partir
    // du Sort fourni ; les propriétés y sont préfixées par l'alias "p." pour éviter toute
    // ambiguïté avec les colonnes "nom" de Categorie/Marque une fois la jointure implicite faite.
    @Query("SELECT p FROM Produit p " +
            "WHERE (:categorieId IS NULL OR p.categorie.id = :categorieId) " +
            "AND (:marqueId IS NULL OR p.marque.id = :marqueId) " +
            "AND (:recherche IS NULL OR LOWER(p.nom) LIKE LOWER(CAST(:recherche AS string))) " +
            "AND (:enStockUniquement = FALSE OR p.stock > 0)")
    List<Produit> rechercherCatalogue(@Param("categorieId") Long categorieId,
                                       @Param("marqueId") Long marqueId,
                                       @Param("recherche") String recherche,
                                       @Param("enStockUniquement") boolean enStockUniquement,
                                       Sort sort);

    // Verrou pessimiste (SELECT ... FOR UPDATE) : à utiliser uniquement quand on s'apprête à
    // lire PUIS modifier le stock (création de commande, ajustement manuel). Sans ce verrou,
    // deux transactions concurrentes peuvent toutes les deux lire le même stock avant que l'une
    // des deux n'ait sauvegardé sa décrémentation ("lost update"), et vendre plus d'unités que
    // ce qui est réellement disponible. La transaction qui arrive en second attend ici que la
    // première ait validé (COMMIT) ou annulé (ROLLBACK) avant de lire à son tour la valeur à jour.
    // Ne PAS utiliser cette méthode pour de la simple lecture (affichage produit, catalogue...),
    // au risque de bloquer inutilement d'autres transactions.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Produit p WHERE p.id = :id")
    Optional<Produit> findByIdPourMiseAJourStock(@Param("id") Long id);
}
