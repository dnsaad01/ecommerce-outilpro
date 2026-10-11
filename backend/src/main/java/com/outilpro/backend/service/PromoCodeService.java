package com.outilpro.backend.service;

import com.outilpro.backend.dto.PromoCodeRequest;
import com.outilpro.backend.dto.PromoCodeResponse;
import com.outilpro.backend.dto.PromoPublicResponse;
import com.outilpro.backend.dto.PromoValidationResponse;

import java.math.BigDecimal;
import java.util.List;

public interface PromoCodeService {
    List<PromoCodeResponse> findAll();
    PromoCodeResponse findById(Long id);
    PromoCodeResponse create(PromoCodeRequest request);
    PromoCodeResponse update(Long id, PromoCodeRequest request);
    void delete(Long id);
    PromoValidationResponse verifier(String code, BigDecimal sousTotal);
    BigDecimal appliquer(String code, BigDecimal sousTotal);
    List<PromoPublicResponse> findActifs();
}