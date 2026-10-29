package com.outilpro.backend.service.impl;

import com.outilpro.backend.dto.ProduitRuptureResponse;
import com.outilpro.backend.dto.StatsDashboardResponse;
import com.outilpro.backend.dto.TopProduitResponse;
import com.outilpro.backend.dto.VenteJourResponse;
import com.outilpro.backend.dto.VenteMoisResponse;
import com.outilpro.backend.dto.VenteVilleResponse;
import com.outilpro.backend.entity.Produit;
import com.outilpro.backend.entity.StatutCommande;
import com.outilpro.backend.repository.CommandeRepository;
import com.outilpro.backend.repository.LigneCommandeRepository;
import com.outilpro.backend.repository.ProduitRepository;
import com.outilpro.backend.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// Dashboard admin volontairement resserré sur les indicateurs essentiels à la gestion
// quotidienne d'une quincaillerie en ligne : chiffre d'affaires, commandes, alertes de
// stock, produits les plus vendus et ventes par ville (basée sur le champ texte libre
// Commande.ville, pour suivre d'où viennent les clients -- la livraison reste gratuite,
// cette répartition est purement analytique). Les autres métriques dérivées (panier
// moyen, articles par commande, performance par catégorie) restent retirées.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsServiceImpl implements StatsService {

    private static final int TAILLE_LISTE_STOCK_FAIBLE = 20;
    private static final int NB_JOURS_EVOLUTION_VENTES = 14;
    private static final int NB_MOIS_EVOLUTION_VENTES = 12;
    private static final int TAILLE_TOP_PRODUITS = 20;

    // Seuil d'alerte stock, configurable via app.stock.seuil-alerte (application.properties)
    // ou la variable d'environnement STOCK_SEUIL_ALERTE. Par défaut : 5.
    @Value("${app.stock.seuil-alerte:5}")
    private int seuilAlerteStock;

    private final CommandeRepository commandeRepository;
    private final ProduitRepository produitRepository;
    private final LigneCommandeRepository ligneCommandeRepository;

    @Override
    public StatsDashboardResponse getDashboard() {
        BigDecimal chiffreAffaires = commandeRepository.sommeChiffreAffaires(StatutCommande.ANNULEE);

        Map<String, Long> parStatut = new LinkedHashMap<>();
        for (StatutCommande statut : StatutCommande.values()) {
            parStatut.put(statut.name(), commandeRepository.countByStatut(statut));
        }

        long nombreCommandesTotal = parStatut.values().stream().mapToLong(Long::longValue).sum();

        long produitsStockFaible = produitRepository.countByStockLessThanEqual(seuilAlerteStock);
        var listeStockFaible = produitRepository.findByStockLessThanEqualOrderByStockAscNomAsc(seuilAlerteStock).stream()
                .limit(TAILLE_LISTE_STOCK_FAIBLE)
                .map(this::toRuptureResponse)
                .collect(Collectors.toList());

        return StatsDashboardResponse.builder()
                .chiffreAffairesTotal(chiffreAffaires)
                .nombreCommandesTotal(nombreCommandesTotal)
                .commandesParStatut(parStatut)
                .seuilAlerteStock(seuilAlerteStock)
                .produitsStockFaible(produitsStockFaible)
                .listeStockFaible(listeStockFaible)
                .ventesParJour(calculerVentesParJour())
                .ventesParVille(calculerVentesParVille())
                .ventesParMois(calculerVentesParMois())
                .topProduits(calculerTopProduits())
                .build();
    }

    // Construit la série des NB_JOURS_EVOLUTION_VENTES derniers jours, avec les jours sans
    // vente à zéro (plutôt que simplement absents), pour un graphique d'évolution régulier.
    private List<VenteJourResponse> calculerVentesParJour() {
        LocalDate aujourdHui = LocalDate.now();
        LocalDate premierJour = aujourdHui.minusDays(NB_JOURS_EVOLUTION_VENTES - 1);
        LocalDateTime depuis = premierJour.atStartOfDay();

        Map<LocalDate, BigDecimal> caParJour = new LinkedHashMap<>();
        Map<LocalDate, Long> nbParJour = new LinkedHashMap<>();
        for (int i = 0; i < NB_JOURS_EVOLUTION_VENTES; i++) {
            LocalDate jour = premierJour.plusDays(i);
            caParJour.put(jour, BigDecimal.ZERO);
            nbParJour.put(jour, 0L);
        }

        for (Object[] ligne : commandeRepository.ventesDepuis(StatutCommande.ANNULEE, depuis)) {
            LocalDateTime dateCreation = (LocalDateTime) ligne[0];
            BigDecimal total = (BigDecimal) ligne[1];
            LocalDate jour = dateCreation.toLocalDate();
            caParJour.merge(jour, total, BigDecimal::add);
            nbParJour.merge(jour, 1L, Long::sum);
        }

        List<VenteJourResponse> resultat = new ArrayList<>();
        for (LocalDate jour : caParJour.keySet()) {
            resultat.add(VenteJourResponse.builder()
                    .date(jour)
                    .chiffreAffaires(caParJour.get(jour))
                    .nombreCommandes(nbParJour.get(jour))
                    .build());
        }
        return resultat;
    }

    // Répartition des ventes par ville (telle que saisie par le client), triée par chiffre
    // d'affaires décroissant -- pour analyser d'où proviennent les clients.
    private List<VenteVilleResponse> calculerVentesParVille() {
        List<VenteVilleResponse> resultat = new ArrayList<>();
        for (Object[] ligne : commandeRepository.repartitionParVille(StatutCommande.ANNULEE)) {
            resultat.add(VenteVilleResponse.builder()
                    .ville((String) ligne[0])
                    .nombreCommandes((Long) ligne[1])
                    .chiffreAffaires((BigDecimal) ligne[2])
                    .build());
        }
        return resultat;
    }

    // Construit la série des NB_MOIS_EVOLUTION_VENTES derniers mois (mois courant inclus),
    // avec les mois sans vente à zéro, pour un historique régulier permettant de repérer
    // facilement le mois le plus rentable et la tendance globale sur l'année.
    private List<VenteMoisResponse> calculerVentesParMois() {
        YearMonth moisCourant = YearMonth.now();
        YearMonth premierMois = moisCourant.minusMonths(NB_MOIS_EVOLUTION_VENTES - 1);
        LocalDateTime depuis = premierMois.atDay(1).atStartOfDay();

        Map<YearMonth, BigDecimal> caParMois = new LinkedHashMap<>();
        Map<YearMonth, Long> nbParMois = new LinkedHashMap<>();
        for (int i = 0; i < NB_MOIS_EVOLUTION_VENTES; i++) {
            YearMonth mois = premierMois.plusMonths(i);
            caParMois.put(mois, BigDecimal.ZERO);
            nbParMois.put(mois, 0L);
        }

        for (Object[] ligne : commandeRepository.ventesDepuis(StatutCommande.ANNULEE, depuis)) {
            LocalDateTime dateCreation = (LocalDateTime) ligne[0];
            BigDecimal total = (BigDecimal) ligne[1];
            YearMonth mois = YearMonth.from(dateCreation);
            caParMois.merge(mois, total, BigDecimal::add);
            nbParMois.merge(mois, 1L, Long::sum);
        }

        List<VenteMoisResponse> resultat = new ArrayList<>();
        for (YearMonth mois : caParMois.keySet()) {
            resultat.add(VenteMoisResponse.builder()
                    .mois(mois.atDay(1))
                    .chiffreAffaires(caParMois.get(mois))
                    .nombreCommandes(nbParMois.get(mois))
                    .build());
        }
        return resultat;
    }

    // Classement des produits les plus vendus (quantité cumulée), limité aux
    // TAILLE_TOP_PRODUITS premiers pour rester lisible dans le dashboard.
    private List<TopProduitResponse> calculerTopProduits() {
        List<TopProduitResponse> resultat = new ArrayList<>();
        for (Object[] ligne : ligneCommandeRepository.topProduitsParQuantite(StatutCommande.ANNULEE)) {
            resultat.add(TopProduitResponse.builder()
                    .produitId((Long) ligne[0])
                    .nom((String) ligne[1])
                    .sku((String) ligne[2])
                    .quantiteVendue((Long) ligne[3])
                    .chiffreAffaires((BigDecimal) ligne[4])
                    .build());
        }
        return resultat.stream().limit(TAILLE_TOP_PRODUITS).collect(Collectors.toList());
    }

    private ProduitRuptureResponse toRuptureResponse(Produit produit) {
        return ProduitRuptureResponse.builder()
                .id(produit.getId())
                .nom(produit.getNom())
                .sku(produit.getSku())
                .stock(produit.getStock())
                .build();
    }
}
