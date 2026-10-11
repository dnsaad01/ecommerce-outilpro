package com.outilpro.backend.service;

import com.outilpro.backend.dto.CategorieRequest;
import com.outilpro.backend.dto.CategorieResponse;

import java.util.List;

public interface CategorieService {
    List<CategorieResponse> findAll();
    CategorieResponse findById(Long id);
    CategorieResponse create(CategorieRequest request);
    CategorieResponse update(Long id, CategorieRequest request);
    void delete(Long id);
}