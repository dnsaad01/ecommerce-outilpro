package com.outilpro.backend.config;

import com.outilpro.backend.entity.AdminUser;
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

    @Override
    public void run(String... args) {
        if (adminUserRepository.findByUsername(adminUsername).isEmpty()) {
            AdminUser admin = AdminUser.builder()
                    .username(adminUsername)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role("ADMIN")
                    .actif(true)
                    .build();
            adminUserRepository.save(admin);
            System.out.println("Compte admin créé : " + adminUsername);
        }
    }
}