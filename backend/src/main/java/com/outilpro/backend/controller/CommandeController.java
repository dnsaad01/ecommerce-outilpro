package com.outilpro.backend.controller;

import com.outilpro.backend.dto.ChangerStatutRequest;
import com.outilpro.backend.dto.CommandeRequest;
import com.outilpro.backend.dto.CommandeResponse;
import com.outilpro.backend.entity.StatutCommande;
import com.outilpro.backend.service.CommandeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/commandes")
@RequiredArgsConstructor
public class CommandeController {

    private final CommandeService commandeService;

    // ?page=0&size=10 par défaut, triée par date de création décroissante (les plus récentes en premier)
    @GetMapping
    public ResponseEntity<Page<CommandeResponse>> findAll(
            @RequestParam(required = false) StatutCommande statut,
            @PageableDefault(size = 10, sort = "dateCreation", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(commandeService.findAllPagine(statut, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommandeResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(commandeService.findById(id));
    }

    @PostMapping
    public ResponseEntity<CommandeResponse> create(@Valid @RequestBody CommandeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commandeService.create(request));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<CommandeResponse> changerStatut(@PathVariable Long id,
                                                          @Valid @RequestBody ChangerStatutRequest request) {
        return ResponseEntity.ok(commandeService.changerStatut(id, request.getStatut()));
    }

    // Suppression definitive reservee a ADMIN -- voir le commentaire dans
    // CommandeServiceImpl.delete() : prevue pour nettoyer des commandes de test,
    // le statut ANNULEE (changerStatut ci-dessus) reste la bonne pratique pour une
    // vraie commande client, afin de garder une trace.
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        commandeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
