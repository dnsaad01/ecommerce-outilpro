package com.outilpro.backend.entity;

// Rôles du personnel admin. ADMIN : accès complet (dashboard, statistiques
// financières/Ventes par ville, configuration du catalogue -- catégories, marques,
// promotions, stock, produits). EMPLOYE : accès restreint à la gestion des commandes
// et à la consultation (lecture seule) des produits -- pas de Chiffre d'affaires ni
// de statistiques sensibles, pas de gestion du catalogue/stock/promotions.
// Stocké en base via @Enumerated(EnumType.STRING) sur AdminUser.role, et c'est aussi
// le nom exact posé comme claim "role" dans le JWT (JwtService) puis comme autorité
// Spring Security "ROLE_" + role (JwtAuthenticationFilter) -- d'où hasRole("ADMIN").
public enum RoleAdmin {
    ADMIN,
    EMPLOYE
}
