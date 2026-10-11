package com.outilpro.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "marques")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(of = "id")
public class Marque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nom;

    private String pays;

    private String logoUrl;
}