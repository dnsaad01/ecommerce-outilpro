package com.outilpro.backend.service.impl;

import com.outilpro.backend.dto.VilleRequest;
import com.outilpro.backend.dto.VilleResponse;
import com.outilpro.backend.entity.Ville;
import com.outilpro.backend.exception.ResourceNotFoundException;
import com.outilpro.backend.repository.VilleRepository;
import com.outilpro.backend.service.VilleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class VilleServiceImpl implements VilleService {

    private final VilleRepository villeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VilleResponse> findAll() {
        return villeRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public VilleResponse findById(Long id) {
        return toResponse(getVilleOuThrow(id));
    }

    @Override
    public VilleResponse create(VilleRequest request) {
        if (villeRepository.existsByNom(request.getNom())) {
            throw new IllegalArgumentException("Une ville nommée '" + request.getNom() + "' existe déjà");
        }
        Ville ville = Ville.builder()
                .nom(request.getNom())
                .codePostal(request.getCodePostal())
                .fraisLivraison(request.getFraisLivraison())
                .build();

        return toResponse(villeRepository.save(ville));
    }

    @Override
    public VilleResponse update(Long id, VilleRequest request) {
        Ville ville = getVilleOuThrow(id);

        if (villeRepository.existsByNomAndIdNot(request.getNom(), id)) {
            throw new IllegalArgumentException("Une autre ville utilise déjà le nom '" + request.getNom() + "'");
        }

        ville.setNom(request.getNom());
        ville.setCodePostal(request.getCodePostal());
        ville.setFraisLivraison(request.getFraisLivraison());

        return toResponse(villeRepository.save(ville));
    }

    @Override
    public void delete(Long id) {
        villeRepository.delete(getVilleOuThrow(id));
    }

    private Ville getVilleOuThrow(Long id) {
        return villeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ville introuvable, id=" + id));
    }

    private VilleResponse toResponse(Ville ville) {
        return VilleResponse.builder()
                .id(ville.getId())
                .nom(ville.getNom())
                .codePostal(ville.getCodePostal())
                .fraisLivraison(ville.getFraisLivraison())
                .build();
    }
}