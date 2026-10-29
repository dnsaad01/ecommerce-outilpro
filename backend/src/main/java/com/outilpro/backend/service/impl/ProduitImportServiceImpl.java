package com.outilpro.backend.service.impl;

import com.outilpro.backend.dto.ImportErreurLigne;
import com.outilpro.backend.dto.ImportProduitsResultat;
import com.outilpro.backend.entity.Categorie;
import com.outilpro.backend.entity.Marque;
import com.outilpro.backend.entity.Produit;
import com.outilpro.backend.repository.CategorieRepository;
import com.outilpro.backend.repository.MarqueRepository;
import com.outilpro.backend.repository.ProduitRepository;
import com.outilpro.backend.service.ProduitImportService;
import com.outilpro.backend.util.Slugifier;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Import en masse de produits (avec creation automatique des categories/marques
 * manquantes) depuis un fichier Excel (.xlsx), pour eviter la saisie manuelle
 * produit par produit dans le dashboard admin -- voir genererModele() pour le
 * format exact attendu.
 *
 * Chaque ligne est traitee dans sa propre portion de la transaction : une erreur
 * sur une ligne (champ manquant, nombre invalide, contrainte base violee...) est
 * consignee dans le resultat SANS faire echouer les lignes suivantes, pour que
 * l'admin puisse corriger uniquement les lignes fautives et reimporter le fichier.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProduitImportServiceImpl implements ProduitImportService {

    // Ordre des colonnes attendu dans le fichier Excel (ligne 1 = en-tete, ignoree).
    private static final String[] EN_TETES = {
            "Nom", "Description", "Prix", "PrixPromotionnel", "Stock", "SKU", "Categorie", "Marque", "ImageUrl"
    };

    private static final int COL_NOM = 0;
    private static final int COL_DESCRIPTION = 1;
    private static final int COL_PRIX = 2;
    private static final int COL_PRIX_PROMO = 3;
    private static final int COL_STOCK = 4;
    private static final int COL_SKU = 5;
    private static final int COL_CATEGORIE = 6;
    private static final int COL_MARQUE = 7;
    private static final int COL_IMAGE_URL = 8;

    private final ProduitRepository produitRepository;
    private final CategorieRepository categorieRepository;
    private final MarqueRepository marqueRepository;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public ImportProduitsResultat importerDepuisExcel(MultipartFile fichier) throws IOException {
        int produitsCrees = 0;
        int produitsMisAJour = 0;
        int categoriesCreees = 0;
        int marquesCreees = 0;
        int lignesTraitees = 0;
        List<ImportErreurLigne> erreurs = new ArrayList<>();

        Workbook classeur;
        try (InputStream entree = fichier.getInputStream()) {
            classeur = WorkbookFactory.create(entree);
        } catch (Exception e) {
            throw new IllegalArgumentException("Fichier invalide : veuillez envoyer un fichier Excel (.xlsx) valide, idéalement généré à partir du modèle fourni.");
        }

        try (classeur) {
            if (classeur.getNumberOfSheets() == 0) {
                throw new IllegalArgumentException("Le fichier Excel ne contient aucune feuille");
            }
            Sheet feuille = classeur.getSheetAt(0);
            DataFormatter formateur = new DataFormatter();

            for (Row ligne : feuille) {
                int numeroLigne = ligne.getRowNum() + 1; // 1-indexe comme affiche dans Excel
                if (numeroLigne == 1 || estLigneVide(ligne, formateur)) {
                    continue;
                }
                lignesTraitees++;
                try {
                    String nom = valeur(ligne, COL_NOM, formateur);
                    String description = valeur(ligne, COL_DESCRIPTION, formateur);
                    String prixTexte = valeur(ligne, COL_PRIX, formateur);
                    String prixPromoTexte = valeur(ligne, COL_PRIX_PROMO, formateur);
                    String stockTexte = valeur(ligne, COL_STOCK, formateur);
                    String sku = valeur(ligne, COL_SKU, formateur);
                    String nomCategorie = valeur(ligne, COL_CATEGORIE, formateur);
                    String nomMarque = valeur(ligne, COL_MARQUE, formateur);
                    String imageUrl = valeur(ligne, COL_IMAGE_URL, formateur);

                    validerChampsObligatoires(nom, prixTexte, stockTexte, sku, nomCategorie, nomMarque);

                    BigDecimal prix = parseDecimalCellule(ligne, COL_PRIX, prixTexte, "Prix");
                    BigDecimal prixPromotionnel = prixPromoTexte.isBlank() ? null : parseDecimalCellule(ligne, COL_PRIX_PROMO, prixPromoTexte, "PrixPromotionnel");
                    Integer stock = parseEntierCellule(ligne, COL_STOCK, stockTexte, "Stock");

                    validerValeursMetier(nom, description, sku, prix, prixPromotionnel, stock);

                    CategorieOuCreation resultatCategorie = trouverOuCreerCategorieAvecStatut(nomCategorie);
                    Categorie categorie = resultatCategorie.categorie();
                    if (resultatCategorie.creee()) {
                        categoriesCreees++;
                    }

                    MarqueOuCreation resultatMarque = trouverOuCreerMarqueAvecStatut(nomMarque);
                    Marque marque = resultatMarque.marque();
                    if (resultatMarque.creee()) {
                        marquesCreees++;
                    }

                    Optional<Produit> produitExistant = produitRepository.findBySku(sku);
                    Produit produit = produitExistant.orElseGet(Produit::new);
                    produit.setNom(nom);
                    produit.setDescription(description.isBlank() ? null : description);
                    produit.setPrix(prix);
                    produit.setPrixPromotionnel(prixPromotionnel);
                    produit.setStock(stock);
                    produit.setSku(sku);
                    produit.setCategorie(categorie);
                    produit.setMarque(marque);
                    if (!imageUrl.isBlank()) {
                        produit.setImageUrl(imageUrl);
                    }

                    boolean creation = produitExistant.isEmpty();
                    produitRepository.saveAndFlush(produit);
                    if (creation) {
                        produitsCrees++;
                    } else {
                        produitsMisAJour++;
                    }
                } catch (Exception e) {
                    entityManager.clear();
                    String message;
                    if (e instanceof DataIntegrityViolationException) {
                        // Ne jamais exposer le message SQL brut (contrainte, nom de colonne...) --
                        // meme principe que GlobalExceptionHandler pour le reste de l'application.
                        message = "Donnée invalide ou en conflit avec une autre ligne (SKU en doublon ?)";
                    } else {
                        message = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                    }
                    erreurs.add(ImportErreurLigne.builder().ligne(numeroLigne).message(message).build());
                    log.warn("Import Excel : erreur ligne {} : {}", numeroLigne, e.getMessage());
                }
            }
        }

        return ImportProduitsResultat.builder()
                .lignesTraitees(lignesTraitees)
                .produitsCrees(produitsCrees)
                .produitsMisAJour(produitsMisAJour)
                .categoriesCreees(categoriesCreees)
                .marquesCreees(marquesCreees)
                .erreurs(erreurs)
                .build();
    }

    @Override
    public byte[] genererModele() throws IOException {
        try (Workbook classeur = new XSSFWorkbook(); ByteArrayOutputStream sortie = new ByteArrayOutputStream()) {
            Sheet feuille = classeur.createSheet("Produits");

            CellStyle styleEnTete = classeur.createCellStyle();
            Font policeEnTete = classeur.createFont();
            policeEnTete.setBold(true);
            styleEnTete.setFont(policeEnTete);

            Row enTete = feuille.createRow(0);
            for (int i = 0; i < EN_TETES.length; i++) {
                Cell cellule = enTete.createCell(i);
                cellule.setCellValue(EN_TETES[i]);
                cellule.setCellStyle(styleEnTete);
                feuille.setColumnWidth(i, 22 * 256);
            }

            Object[][] exemples = {
                    {"Perceuse visseuse 18V", "Perceuse sans fil avec 2 batteries et chargeur", 899.0, 749.0, 25, "PERC-001", "Outillage électroportatif", "Bosch", ""},
                    {"Clé à molette 250mm", "Clé à molette chromée, ouverture 0-30mm", 59.9, "", 100, "CLE-250", "Outillage à main", "Stanley", ""}
            };
            int numeroLigne = 1;
            for (Object[] exemple : exemples) {
                Row ligne = feuille.createRow(numeroLigne++);
                for (int i = 0; i < exemple.length; i++) {
                    Cell cellule = ligne.createCell(i);
                    Object v = exemple[i];
                    if (v instanceof Number nombre) {
                        cellule.setCellValue(nombre.doubleValue());
                    } else {
                        cellule.setCellValue(v.toString());
                    }
                }
            }

            classeur.write(sortie);
            return sortie.toByteArray();
        }
    }

    private void validerChampsObligatoires(String nom, String prix, String stock, String sku, String categorie, String marque) {
        List<String> manquants = new ArrayList<>();
        if (nom.isBlank()) manquants.add("Nom");
        if (prix.isBlank()) manquants.add("Prix");
        if (stock.isBlank()) manquants.add("Stock");
        if (sku.isBlank()) manquants.add("SKU");
        if (categorie.isBlank()) manquants.add("Categorie");
        if (marque.isBlank()) manquants.add("Marque");
        if (!manquants.isEmpty()) {
            throw new IllegalArgumentException("Champ(s) obligatoire(s) manquant(s) : " + String.join(", ", manquants));
        }
    }

    // Memes regles metier que ProduitServiceImpl/ProduitRequest (voir validerPrixPromotionnel
    // et les annotations @Size/@DecimalMin/@PositiveOrZero) -- reproduites ici car l'import
    // construit l'entite directement, sans passer par la validation Bean du DTO habituel.
    private void validerValeursMetier(String nom, String description, String sku,
                                       BigDecimal prix, BigDecimal prixPromotionnel, Integer stock) {
        if (nom.length() > 255) {
            throw new IllegalArgumentException("Le nom ne peut pas dépasser 255 caractères");
        }
        if (description.length() > 2000) {
            throw new IllegalArgumentException("La description ne peut pas dépasser 2000 caractères");
        }
        if (sku.length() > 255) {
            throw new IllegalArgumentException("Le SKU ne peut pas dépasser 255 caractères");
        }
        if (prix.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Le prix doit être supérieur à 0");
        }
        if (prixPromotionnel != null) {
            if (prixPromotionnel.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Le prix promotionnel doit être supérieur à 0");
            }
            if (prixPromotionnel.compareTo(prix) >= 0) {
                throw new IllegalArgumentException("Le prix promotionnel doit être inférieur au prix normal");
            }
        }
        if (stock < 0) {
            throw new IllegalArgumentException("Le stock ne peut pas être négatif");
        }
    }

    private record CategorieOuCreation(Categorie categorie, boolean creee) {
    }

    private record MarqueOuCreation(Marque marque, boolean creee) {
    }

    private CategorieOuCreation trouverOuCreerCategorieAvecStatut(String nom) {
        Optional<Categorie> existante = categorieRepository.findByNomIgnoreCase(nom);
        if (existante.isPresent()) {
            return new CategorieOuCreation(existante.get(), false);
        }
        Categorie creee = categorieRepository.save(Categorie.builder()
                .nom(nom)
                .slug(genererSlugUnique(nom))
                .build());
        return new CategorieOuCreation(creee, true);
    }

    private MarqueOuCreation trouverOuCreerMarqueAvecStatut(String nom) {
        Optional<Marque> existante = marqueRepository.findByNomIgnoreCase(nom);
        if (existante.isPresent()) {
            return new MarqueOuCreation(existante.get(), false);
        }
        Marque creee = marqueRepository.save(Marque.builder().nom(nom).build());
        return new MarqueOuCreation(creee, true);
    }

    private String genererSlugUnique(String nom) {
        String base = Slugifier.slugifier(nom);
        if (base.isBlank()) {
            base = "categorie";
        }
        String slug = base;
        int suffixe = 2;
        while (categorieRepository.existsBySlug(slug)) {
            slug = base + "-" + suffixe;
            suffixe++;
        }
        return slug;
    }

    private boolean estLigneVide(Row ligne, DataFormatter formateur) {
        for (int i = 0; i < EN_TETES.length; i++) {
            if (!valeur(ligne, i, formateur).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private String valeur(Row ligne, int colonne, DataFormatter formateur) {
        Cell cellule = ligne.getCell(colonne);
        if (cellule == null) {
            return "";
        }
        return formateur.formatCellValue(cellule).trim();
    }

    // Lit directement la valeur numerique de la cellule quand Excel l'a stockee comme un
    // nombre (cas normal si l'admin tape "899" ou "899,5" dans une cellule) -- evite de
    // dependre du formatage d'affichage (separateurs de milliers, devise...) qui varie selon
    // la configuration regionale d'Excel. Si la cellule est du texte, on retombe sur le texte
    // affiche (utile si l'admin a colle une valeur ou utilise une cellule au format Texte).
    private BigDecimal parseDecimalCellule(Row ligne, int colonne, String texteAffiche, String champ) {
        Cell cellule = ligne.getCell(colonne);
        if (cellule != null && cellule.getCellType() == CellType.NUMERIC) {
            return BigDecimal.valueOf(cellule.getNumericCellValue());
        }
        return parseDecimal(texteAffiche, champ);
    }

    private Integer parseEntierCellule(Row ligne, int colonne, String texteAffiche, String champ) {
        Cell cellule = ligne.getCell(colonne);
        if (cellule != null && cellule.getCellType() == CellType.NUMERIC) {
            return (int) Math.round(cellule.getNumericCellValue());
        }
        return parseEntier(texteAffiche, champ);
    }

    private BigDecimal parseDecimal(String texte, String champ) {
        try {
            return new BigDecimal(texte.replace(",", ".").trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Valeur numérique invalide pour '" + champ + "' : " + texte);
        }
    }

    private Integer parseEntier(String texte, String champ) {
        try {
            return (int) Double.parseDouble(texte.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Valeur entière invalide pour '" + champ + "' : " + texte);
        }
    }
}
