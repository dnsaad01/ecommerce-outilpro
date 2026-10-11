package com.outilpro.backend.entity;

// Motif d'un mouvement de stock manuel (hors décrément automatique lié à une commande).
public enum MotifMouvementStock {
    REAPPROVISIONNEMENT,
    CORRECTION_INVENTAIRE,
    RETOUR_CLIENT,
    PRODUIT_ENDOMMAGE,
    AUTRE
}
