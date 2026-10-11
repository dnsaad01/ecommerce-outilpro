package com.outilpro.backend.repository;

import com.outilpro.backend.entity.Ville;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VilleRepository extends JpaRepository<Ville, Long> {
    boolean existsByNom(String nom);
    boolean existsByNomAndIdNot(String nom, Long id);
}