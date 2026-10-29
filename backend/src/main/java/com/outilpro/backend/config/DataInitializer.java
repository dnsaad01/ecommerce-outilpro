package com.outilpro.backend.config;

import com.outilpro.backend.entity.AdminUser;
import com.outilpro.backend.entity.RoleAdmin;
import com.outilpro.backend.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    // Compte EMPLOYE de démonstration, créé au premier démarrage comme le compte admin,
    // pour pouvoir tester immédiatement les permissions restreintes (gestion des
    // commandes + consultation des produits, sans statistiques ni configuration).
    @Value("${app.employe.username}")
    private String employeUsername;

    @Value("${app.employe.password}")
    private String employePassword;

    @Override
    public void run(String... args) {
        creerSiAbsent(adminUsername, adminPassword, RoleAdmin.ADMIN);
        creerSiAbsent(employeUsername, employePassword, RoleAdmin.EMPLOYE);
    }

    private void creerSiAbsent(String username, String password, RoleAdmin role) {
        if (adminUserRepository.findByUsername(username).isEmpty()) {
            AdminUser utilisateur = AdminUser.builder()
                    .username(username)
                    .passwordHash(passwordEncoder.encode(password))
                    .role(role)
                    .actif(true)
                    .build();
            adminUserRepository.save(utilisateur);
            System.out.println("Compte " + role + " créé : " + username);
        }
    }
}