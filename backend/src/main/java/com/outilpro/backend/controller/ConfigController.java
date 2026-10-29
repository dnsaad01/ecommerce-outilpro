package com.outilpro.backend.controller;

import com.outilpro.backend.dto.ConfigPublicResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Petite configuration publique lue par le frontend a chaque chargement (voir
 * App.jsx) -- sert actuellement uniquement au mode maintenance : active via la
 * variable d'environnement MAINTENANCE_MODE, sans toucher au code ni au frontend.
 * Changer la variable sur Coolify puis redemarrer/redeployer le BACKEND suffit a
 * l'activer ou la desactiver ; le site vitrine affiche alors une page "maintenance"
 * a la place des pages publiques, mais /admin reste pleinement accessible pour
 * continuer a gerer le catalogue pendant ce temps.
 */
@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Value("${app.maintenance-mode:false}")
    private boolean maintenanceMode;

    @GetMapping
    public ResponseEntity<ConfigPublicResponse> getConfig() {
        return ResponseEntity.ok(ConfigPublicResponse.builder()
                .maintenanceMode(maintenanceMode)
                .build());
    }
}
