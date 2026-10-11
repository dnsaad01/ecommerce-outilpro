package com.outilpro.backend.repository;

import com.outilpro.backend.entity.MouvementStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MouvementStockRepository extends JpaRepository<MouvementStock, Long> {

    Page<MouvementStock> findAllByOrderByDateCreationDesc(Pageable pageable);

    Page<MouvementStock> findByProduitIdOrderByDateCreationDesc(Long produitId, Pageable pageable);
}
