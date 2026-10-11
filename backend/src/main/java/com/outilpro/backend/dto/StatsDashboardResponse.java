package com.outilpro.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

// DTO du dashboard admin : volontairement limité aux indicateurs essentiels à la gestion
// quotidienne d'une boutique d'outillage -- chiffre d'affaires, commandes, alertes de
// stock, produits les plus vendus et ventes par ville. Les métriques dérivées (panier
// moyen, articles par commande, performance par catégorie) ont été retirées : elles
// n'apportaient pas de valeur opérationnelle directe et alourdissaient l'interface.
@Getter
@Builder
public class StatsDashboardResponse {
    private BigDecimal chiffreAffairesTotal;   // somme des commandes hors ANNULEE
    private long nombreCommandesTotal;         // toutes commandes, tous statuts confondus
    private Map<String, Long> commandesParStatut; // clé = nom de l'enum StatutCommande
    private int seuilAlerteStock;              // seuil configuré (app.stock.seuil-alerte), pour affichage dynamique
    private long produitsStockFaible;          // nombre de produits avec stock <= seuilAlerteStock
    private List<ProduitRuptureResponse> listeStockFaible; // détail (limité) pour action rapide
    private List<VenteJourResponse> ventesParJour;   // 14 derniers jours, du plus ancien au plus récent
    private List<VenteVilleResponse> ventesParVille; // toutes les villes, triées par CA décroissant
    private List<VenteMoisResponse> ventesParMois;   // 12 derniers mois, du plus ancien au plus récent
    private List<TopProduitResponse> topProduits;    // produits les plus vendus (quantité), triés décroissant
}
