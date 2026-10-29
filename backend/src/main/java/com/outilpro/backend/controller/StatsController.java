package com.outilpro.backend.controller;

import com.outilpro.backend.dto.StatsDashboardResponse;
import com.outilpro.backend.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Chiffre d'affaires, ventes par ville, etc. -- réservé à ADMIN (EMPLOYE n'a accès
// qu'aux commandes et à la consultation des produits, voir cahier des charges Rôles & Permissions).
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/dashboard")
    public ResponseEntity<StatsDashboardResponse> getDashboard() {
        return ResponseEntity.ok(statsService.getDashboard());
    }
}
