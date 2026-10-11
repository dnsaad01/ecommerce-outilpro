package com.outilpro.backend.controller;

import com.outilpro.backend.dto.ProduitRequest;
import com.outilpro.backend.dto.ProduitResponse;
import com.outilpro.backend.service.ProduitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produits")
@RequiredArgsConstructor
public class ProduitController {

    private final ProduitService produitService;

    // Catalogue public : categorieId, marqueId, recherche et enStock sont tous combinables
    // (auparavant categorieId et recherche s'excluaient mutuellement, et marqueId n'existait
    // pas côté backend — filtré à la main côté frontend). tri accepte "nom_asc" (par défaut),
    // "prix_asc" ou "prix_desc".
    @GetMapping
    public ResponseEntity<List<ProduitResponse>> findAll(
            @RequestParam(required = false) Long categorieId,
            @RequestParam(required = false) Long marqueId,
            @RequestParam(required = false) String recherche,
            @RequestParam(required = false, defaultValue = "false") boolean enStock,
            @RequestParam(required = false, defaultValue = "nom_asc") String tri) {
        return ResponseEntity.ok(produitService.rechercherCatalogue(categorieId, marqueId, recherche, enStock, tri));
    }

    // Endpoint dédié à l'admin (dashboard), séparé de GET /api/produits qui sert le
    // catalogue public et dont le contrat (liste simple, pas de pagination) ne doit
    // pas changer pour ne pas casser la page Catalogue déjà en prod.
    @GetMapping("/page")
    public ResponseEntity<Page<ProduitResponse>> findAllPagine(
            @RequestParam(required = false) String recherche,
            @PageableDefault(size = 10, sort = "nom", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(produitService.findAllPagine(recherche, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProduitResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(produitService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ProduitResponse> create(@Valid @RequestBody ProduitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(produitService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProduitResponse> update(@PathVariable Long id, @Valid @RequestBody ProduitRequest request) {
        return ResponseEntity.ok(produitService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        produitService.delete(id);
        return ResponseEntity.noContent().build();
    }
}