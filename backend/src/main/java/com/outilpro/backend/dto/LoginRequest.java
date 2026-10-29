package com.outilpro.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    @Size(max = 100, message = "Le nom d'utilisateur ne peut pas dépasser 100 caractères")
    private String username;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(max = 100, message = "Le mot de passe ne peut pas dépasser 100 caractères")
    private String password;
}