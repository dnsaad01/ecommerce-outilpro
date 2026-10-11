package com.outilpro.backend.controller;

import com.outilpro.backend.dto.MouvementStockRequest;
import com.outilpro.backend.dto.MouvementStockResponse;
import com.outilpro.backend.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Non listé dans SecurityConfig -> protégé par défaut (anyRequest().authenticated()), donc admin only.
@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @GetMapping("/mouvements")
    public ResponseEntity<Page<MouvementStockResponse>> lister(
            @RequestParam(required = false) Long produitId,
            @PageableDefault(size = 15, sort = "dateCreation", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(stockService.lister(produitId, pageable));
    }

    @PostMapping("/mouvements")
    public ResponseEntity<MouvementStockResponse> ajusterStock(@Valid @RequestBody MouvementStockRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockService.ajusterStock(request));
    }
}
