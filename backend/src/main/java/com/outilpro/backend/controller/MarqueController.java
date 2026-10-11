package com.outilpro.backend.controller;

import com.outilpro.backend.dto.MarqueRequest;
import com.outilpro.backend.dto.MarqueResponse;
import com.outilpro.backend.service.MarqueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marques")
@RequiredArgsConstructor
public class MarqueController {

    private final MarqueService marqueService;

    @GetMapping
    public ResponseEntity<List<MarqueResponse>> findAll() {
        return ResponseEntity.ok(marqueService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MarqueResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(marqueService.findById(id));
    }

    @PostMapping
    public ResponseEntity<MarqueResponse> create(@Valid @RequestBody MarqueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(marqueService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MarqueResponse> update(@PathVariable Long id, @Valid @RequestBody MarqueRequest request) {
        return ResponseEntity.ok(marqueService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        marqueService.delete(id);
        return ResponseEntity.noContent().build();
    }
}