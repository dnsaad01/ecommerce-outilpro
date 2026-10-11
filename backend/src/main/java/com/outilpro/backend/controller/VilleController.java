package com.outilpro.backend.controller;

import com.outilpro.backend.dto.VilleRequest;
import com.outilpro.backend.dto.VilleResponse;
import com.outilpro.backend.service.VilleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/villes")
@RequiredArgsConstructor
public class VilleController {

    private final VilleService villeService;

    @GetMapping
    public ResponseEntity<List<VilleResponse>> findAll() {
        return ResponseEntity.ok(villeService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VilleResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(villeService.findById(id));
    }

    @PostMapping
    public ResponseEntity<VilleResponse> create(@Valid @RequestBody VilleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(villeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VilleResponse> update(@PathVariable Long id, @Valid @RequestBody VilleRequest request) {
        return ResponseEntity.ok(villeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        villeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}