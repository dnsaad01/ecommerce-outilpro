package com.outilpro.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Une erreur rencontree sur une ligne precise du fichier Excel importe --
 * le numero correspond exactement a la ligne telle qu'affichee dans Excel
 * (en-tete = ligne 1), pour que l'admin puisse corriger facilement.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportErreurLigne {
    private int ligne;
    private String message;
}
