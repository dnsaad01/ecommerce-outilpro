package com.outilpro.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

/**
 * Upload d'images (catégories, marques, produits...) depuis le dashboard admin.
 * Réservé à ADMIN : sert uniquement les formulaires de gestion du catalogue
 * (produits, catégories, marques), tous eux-mêmes réservés à ADMIN.
 */
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UploadController {

    // Extension dérivée du Content-Type validé, PAS du nom de fichier fourni par le client :
    // le nom de fichier original n'est jamais fiable (un client pourrait envoyer un
    // Content-Type "image/png" falsifié avec un fichier nommé "x.php" ou "x.html", et se
    // retrouver avec un fichier exécutable/HTML servi publiquement sous /uploads/**).
    // Cette map est la seule source d'extension possible : un type absent d'ici est rejeté.
    private static final Map<String, String> EXTENSIONS_PAR_TYPE = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "image/gif", "gif"
    );

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.base-url}")
    private String baseUrl;

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Aucun fichier reçu");
        }

        String extension = EXTENSIONS_PAR_TYPE.get(file.getContentType());
        if (extension == null) {
            throw new IllegalArgumentException("Format d'image non supporté (jpeg, png, webp ou gif uniquement)");
        }

        Path dossier = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dossier);

        String nomFichier = UUID.randomUUID() + "." + extension;

        Path destination = dossier.resolve(nomFichier);
        file.transferTo(destination);

        String url = baseUrl + "/uploads/" + nomFichier;
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("url", url));
    }
}
