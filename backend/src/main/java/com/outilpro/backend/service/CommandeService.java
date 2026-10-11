package com.outilpro.backend.service;

import com.outilpro.backend.dto.CommandeRequest;
import com.outilpro.backend.dto.CommandeResponse;
import com.outilpro.backend.entity.StatutCommande;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CommandeService {
    Page<CommandeResponse> findAllPagine(StatutCommande statut, Pageable pageable);
    CommandeResponse findById(Long id);
    CommandeResponse create(CommandeRequest request);
    CommandeResponse changerStatut(Long id, StatutCommande nouveauStatut);
}
