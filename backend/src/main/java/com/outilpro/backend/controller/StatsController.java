package com.outilpro.backend.controller;

import com.outilpro.backend.dto.StatsDashboardResponse;
import com.outilpro.backend.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Non listé dans SecurityConfig -> protégé par défaut (anyRequest().authenticated()), donc admin only.
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/dashboard")
    public ResponseEntity<StatsDashboardResponse> getDashboard() {
        return ResponseEntity.ok(statsService.getDashboard());
    }
}
