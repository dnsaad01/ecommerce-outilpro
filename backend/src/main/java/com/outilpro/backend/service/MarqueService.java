package com.outilpro.backend.service;

import com.outilpro.backend.dto.MarqueRequest;
import com.outilpro.backend.dto.MarqueResponse;

import java.util.List;

public interface MarqueService {
    List<MarqueResponse> findAll();
    MarqueResponse findById(Long id);
    MarqueResponse create(MarqueRequest request);
    MarqueResponse update(Long id, MarqueRequest request);
    void delete(Long id);
}