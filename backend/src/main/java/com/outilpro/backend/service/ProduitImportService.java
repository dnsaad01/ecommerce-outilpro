package com.outilpro.backend.service;

import com.outilpro.backend.dto.ImportProduitsResultat;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface ProduitImportService {

    /**
     * Importe des produits depuis un fichier Excel (.xlsx). Chaque ligne est traitee
     * independamment : categorie/marque sont creees automatiquement si leur nom n'existe
     * pas encore, et le produit est cree (nouveau SKU) ou mis a jour (SKU existant).
     * Une ligne en erreur n'interrompt pas l'import des lignes suivantes.
     */
    ImportProduitsResultat importerDepuisExcel(MultipartFile fichier) throws IOException;

    /** Genere un modele .xlsx vierge (en-tetes + exemples) a remplir par l'admin. */
    byte[] genererModele() throws IOException;
}
