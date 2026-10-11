package com.outilpro.backend.service;

import com.outilpro.backend.dto.VilleRequest;
import com.outilpro.backend.dto.VilleResponse;

import java.util.List;

public interface VilleService {
    List<VilleResponse> findAll();
    VilleResponse findById(Long id);
    VilleResponse create(VilleRequest request);
    VilleResponse update(Long id, VilleRequest request);
    void delete(Long id);
}