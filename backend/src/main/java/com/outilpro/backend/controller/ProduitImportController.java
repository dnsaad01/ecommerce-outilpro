package com.outilpro.backend.controller;

import com.outilpro.backend.dto.ImportProduitsResultat;
import com.outilpro.backend.service.ProduitImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Import en masse de produits (+ creation automatique des categories/marques
 * manquantes) depuis un fichier Excel, et telechargement du modele a remplir.
 * Reserve a ADMIN, comme le reste de la gestion du catalogue (voir ProduitController).
 */
@RestController
@RequestMapping("/api/produits/import")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ProduitImportController {

    private final ProduitImportService produitImportService;

    @PostMapping
    public ResponseEntity<ImportProduitsResultat> importer(@RequestParam("file") MultipartFile fichier) throws IOException {
        if (fichier.isEmpty()) {
            throw new IllegalArgumentException("Aucun fichier reçu");
        }
        return ResponseEntity.ok(produitImportService.importerDepuisExcel(fichier));
    }

    @GetMapping("/modele")
    public ResponseEntity<byte[]> telechargerModele() throws IOException {
        byte[] contenu = produitImportService.genererModele();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"modele-import-produits.xlsx\"")
                .body(contenu);
    }
}
