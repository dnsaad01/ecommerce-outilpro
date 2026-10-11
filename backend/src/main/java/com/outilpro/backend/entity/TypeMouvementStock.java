package com.outilpro.backend.entity;

// ENTREE : ajoute la quantité au stock (réapprovisionnement, retour client...).
// SORTIE : retire la quantité du stock (correction, produit endommagé/perdu...).
public enum TypeMouvementStock {
    ENTREE,
    SORTIE
}
