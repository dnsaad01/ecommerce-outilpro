package com.outilpro.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Resume renvoye apres un import Excel : nombres de lignes traitees avec succes
 * (creation ou mise a jour) et liste detaillee des lignes en erreur, pour que
 * l'admin sache exactement quoi corriger et reimporter si besoin.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportProduitsResultat {
    private int lignesTraitees;
    private int produitsCrees;
    private int produitsMisAJour;
    private int categoriesCreees;
    private int marquesCreees;
    private List<ImportErreurLigne> erreurs;
}
