package com.outilpro.backend.repository;

import com.outilpro.backend.entity.Marque;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarqueRepository extends JpaRepository<Marque, Long> {
    List<Marque> findByNomContainingIgnoreCase(String motCle);
    boolean existsByNom(String nom);
    boolean existsByNomAndIdNot(String nom, Long id);
}