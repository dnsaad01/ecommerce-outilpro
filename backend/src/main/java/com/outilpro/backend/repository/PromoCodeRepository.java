package com.outilpro.backend.repository;

import com.outilpro.backend.entity.PromoCode;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PromoCodeRepository extends JpaRepository<PromoCode, Long> {
    Optional<PromoCode> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, Long id);

    // Codes actifs et non expirés (dateExpiration nulle = jamais d'expiration).
    @Query("SELECT p FROM PromoCode p WHERE p.actif = true " +
           "AND (p.dateExpiration IS NULL OR p.dateExpiration >= :aujourdHui)")
    List<PromoCode> findActifs(@Param("aujourdHui") LocalDate aujourdHui);

    // Verrou pessimiste : à utiliser uniquement au moment où le code promo est réellement
    // consommé (création de commande), pas pour la simple vérification/aperçu côté panier.
    // Sans lui, deux commandes passées au même instant avec un code à utilisations limitées
    // pourraient toutes les deux lire "il reste 1 utilisation" avant qu'aucune n'ait
    // sauvegardé — et le code serait donc utilisé plus de fois que sa limite autorisée.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PromoCode p WHERE p.code = :code")
    Optional<PromoCode> findByCodePourApplication(@Param("code") String code);
}
