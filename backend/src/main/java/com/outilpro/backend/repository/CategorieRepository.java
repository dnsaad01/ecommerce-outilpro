package com.outilpro.backend.repository;

import com.outilpro.backend.entity.Categorie;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategorieRepository extends JpaRepository<Categorie, Long> {
    Optional<Categorie> findBySlug(String slug);
    boolean existsBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, Long id);

    // Recherche exacte (insensible a la casse) par nom -- utilisee par l'import Excel
    // pour retrouver une categorie existante avant d'en creer une nouvelle en doublon.
    Optional<Categorie> findByNomIgnoreCase(String nom);
}