package com.outilpro.backend.service.impl;

import com.outilpro.backend.dto.CategorieRequest;
import com.outilpro.backend.dto.CategorieResponse;
import com.outilpro.backend.entity.Categorie;
import com.outilpro.backend.exception.ResourceNotFoundException;
import com.outilpro.backend.repository.CategorieRepository;
import com.outilpro.backend.service.CategorieService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CategorieServiceImpl implements CategorieService {

    private final CategorieRepository categorieRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategorieResponse> findAll() {
        return categorieRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategorieResponse findById(Long id) {
        return toResponse(getCategorieOuThrow(id));
    }

    @Override
    public CategorieResponse create(CategorieRequest request) {
        if (categorieRepository.existsBySlug(request.getSlug())) {
            throw new IllegalArgumentException("Une catégorie avec le slug '" + request.getSlug() + "' existe déjà");
        }
        Categorie categorie = Categorie.builder()
                .nom(request.getNom())
                .slug(request.getSlug())
                .imageUrl(request.getImageUrl())
                .build();

        return toResponse(categorieRepository.save(categorie));
    }

    @Override
    public CategorieResponse update(Long id, CategorieRequest request) {
        Categorie categorie = getCategorieOuThrow(id);

        if (categorieRepository.existsBySlugAndIdNot(request.getSlug(), id)) {
            throw new IllegalArgumentException("Une autre catégorie utilise déjà le slug '" + request.getSlug() + "'");
        }

        categorie.setNom(request.getNom());
        categorie.setSlug(request.getSlug());
        categorie.setImageUrl(request.getImageUrl());

        return toResponse(categorieRepository.save(categorie));
    }

    @Override
    public void delete(Long id) {
        categorieRepository.delete(getCategorieOuThrow(id));
    }

    private Categorie getCategorieOuThrow(Long id) {
        return categorieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable, id=" + id));
    }

    private CategorieResponse toResponse(Categorie categorie) {
        return CategorieResponse.builder()
                .id(categorie.getId())
                .nom(categorie.getNom())
                .slug(categorie.getSlug())
                .imageUrl(categorie.getImageUrl())
                .build();
    }
}