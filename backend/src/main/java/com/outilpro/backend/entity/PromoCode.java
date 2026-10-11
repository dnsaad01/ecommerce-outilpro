package com.outilpro.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "promo_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(of = "id")
public class PromoCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeReduction typeReduction;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valeur;

    @Column(precision = 10, scale = 2)
    private BigDecimal montantMinimum;

    private Integer utilisationsMax;

    @Builder.Default
    @Column(nullable = false)
    private Integer utilisationsActuelles = 0;

    private LocalDate dateExpiration;

    @Builder.Default
    @Column(nullable = false)
    private Boolean actif = true;
}