package com.outilpro.backend.service.impl;

import com.outilpro.backend.dto.LoginRequest;
import com.outilpro.backend.dto.LoginResponse;
import com.outilpro.backend.entity.AdminUser;
import com.outilpro.backend.repository.AdminUserRepository;
import com.outilpro.backend.security.JwtService;
import com.outilpro.backend.service.AdminAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminAuthServiceImpl implements AdminAuthService {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    public LoginResponse login(LoginRequest request) {
        AdminUser adminUser = adminUserRepository.findByUsername(request.getUsername())
                .filter(AdminUser::getActif)
                .orElseThrow(() -> new BadCredentialsException("Identifiants invalides"));

        if (!passwordEncoder.matches(request.getPassword(), adminUser.getPasswordHash())) {
            throw new BadCredentialsException("Identifiants invalides");
        }

        String token = jwtService.generateToken(adminUser.getUsername(), adminUser.getRole());

        return LoginResponse.builder()
                .token(token)
                .username(adminUser.getUsername())
                .role(adminUser.getRole())
                .build();
    }
}