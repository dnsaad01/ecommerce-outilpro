package com.outilpro.backend.service;

import com.outilpro.backend.dto.LoginRequest;
import com.outilpro.backend.dto.LoginResponse;

public interface AdminAuthService {
    LoginResponse login(LoginRequest request);
}