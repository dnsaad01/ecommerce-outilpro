package com.outilpro.backend.service.impl;

import com.outilpro.backend.dto.MarqueRequest;
import com.outilpro.backend.dto.MarqueResponse;
import com.outilpro.backend.entity.Marque;
import com.outilpro.backend.exception.ResourceNotFoundException;
import com.outilpro.backend.repository.MarqueRepository;
import com.outilpro.backend.service.MarqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MarqueServiceImpl implements MarqueService {

    private final MarqueRepository marqueRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MarqueResponse> findAll() {
        return marqueRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MarqueResponse findById(Long id) {
        return toResponse(getMarqueOuThrow(id));
    }

    @Override
    public MarqueResponse create(MarqueRequest request) {
        if (marqueRepository.existsByNom(request.getNom())) {
            throw new IllegalArgumentException("Une marque nommée '" + request.getNom() + "' existe déjà");
        }
        Marque marque = Marque.builder()
                .nom(request.getNom())
                .pays(request.getPays())
                .logoUrl(request.getLogoUrl())
                .build();

        return toResponse(marqueRepository.save(marque));
    }

    @Override
    public MarqueResponse update(Long id, MarqueRequest request) {
        Marque marque = getMarqueOuThrow(id);

        if (marqueRepository.existsByNomAndIdNot(request.getNom(), id)) {
            throw new IllegalArgumentException("Une autre marque utilise déjà le nom '" + request.getNom() + "'");
        }

        marque.setNom(request.getNom());
        marque.setPays(request.getPays());
        marque.setLogoUrl(request.getLogoUrl());

        return toResponse(marqueRepository.save(marque));
    }

    @Override
    public void delete(Long id) {
        marqueRepository.delete(getMarqueOuThrow(id));
    }

    private Marque getMarqueOuThrow(Long id) {
        return marqueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marque introuvable, id=" + id));
    }

    private MarqueResponse toResponse(Marque marque) {
        return MarqueResponse.builder()
                .id(marque.getId())
                .nom(marque.getNom())
                .pays(marque.getPays())
                .logoUrl(marque.getLogoUrl())
                .build();
    }
}