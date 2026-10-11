package com.outilpro.backend.controller;

import com.outilpro.backend.dto.PromoCodeRequest;
import com.outilpro.backend.dto.PromoCodeResponse;
import com.outilpro.backend.dto.PromoPublicResponse;
import com.outilpro.backend.dto.PromoValidationResponse;
import com.outilpro.backend.service.PromoCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/promos")
@RequiredArgsConstructor
public class PromoCodeController {

    private final PromoCodeService promoCodeService;

    @GetMapping
    public ResponseEntity<List<PromoCodeResponse>> findAll() {
        return ResponseEntity.ok(promoCodeService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PromoCodeResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(promoCodeService.findById(id));
    }

    @PostMapping
    public ResponseEntity<PromoCodeResponse> create(@Valid @RequestBody PromoCodeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(promoCodeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PromoCodeResponse> update(@PathVariable Long id, @Valid @RequestBody PromoCodeRequest request) {
        return ResponseEntity.ok(promoCodeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        promoCodeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/verifier")
    public ResponseEntity<PromoValidationResponse> verifier(@RequestParam String code,
                                                            @RequestParam BigDecimal sousTotal) {
        return ResponseEntity.ok(promoCodeService.verifier(code, sousTotal));
    }

    @GetMapping("/actifs")
    public ResponseEntity<List<PromoPublicResponse>> findActifs() {
        return ResponseEntity.ok(promoCodeService.findActifs());
    }
}