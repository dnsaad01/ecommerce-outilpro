package com.outilpro.backend.util;

import java.text.Normalizer;
import java.util.regex.Pattern;

/**
 * Portage Java de la fonction slugifier() utilisee cote frontend
 * (voir frontend/src/pages/admin/CategoriesPage.jsx) -- necessaire ici pour que
 * l'import en masse de produits puisse creer automatiquement une Categorie a
 * partir d'un simple nom, sans que l'admin ait a saisir un slug a la main.
 */
public final class Slugifier {

    private Slugifier() {
    }

    private static final Pattern DIACRITIQUES = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
    private static final Pattern NON_ALPHANUM = Pattern.compile("[^a-z0-9]+");
    private static final Pattern TIRETS_BORDS = Pattern.compile("(^-+|-+$)");

    public static String slugifier(String texte) {
        if (texte == null) {
            return "";
        }
        String normalise = Normalizer.normalize(texte, Normalizer.Form.NFD);
        normalise = DIACRITIQUES.matcher(normalise).replaceAll("");
        normalise = normalise.toLowerCase().trim();
        normalise = NON_ALPHANUM.matcher(normalise).replaceAll("-");
        normalise = TIRETS_BORDS.matcher(normalise).replaceAll("");
        return normalise;
    }
}
