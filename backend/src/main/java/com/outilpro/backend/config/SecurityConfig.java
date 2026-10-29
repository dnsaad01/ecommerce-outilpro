package com.outilpro.backend.config;

import com.outilpro.backend.security.JwtAuthenticationFilter;
import com.outilpro.backend.security.RateLimitingFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitingFilter rateLimitingFilter;

    // Liste blanche des origines autorisées en CORS, configurable (séparées par des virgules)
    // plutôt que codée en dur -- en local, seul le frontend Vite (localhost:5173) ; en
    // production, la variable d'environnement CORS_ALLOWED_ORIGINS prendrait le relais avec
    // le(s) vrai(s) domaine(s) du site, jamais un joker "*" (incompatible de toute façon avec
    // allowCredentials(true) ci-dessous).
    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String corsAllowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json");
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write("{\"status\":401,\"message\":\"Authentification requise\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setContentType("application/json");
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.getWriter().write("{\"status\":403,\"message\":\"Accès refusé\"}");
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/marques/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/produits/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/commandes").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/promos/verifier").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/promos/actifs").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                        .anyRequest().authenticated()
                )
                .headers(headers -> headers
                        // Site 100% API JSON -- aucune page HTML n'est servie par ce backend
                        // (le frontend React/Vite tourne sur un autre port) : "default-src 'none'"
                        // bloque donc tout, par défaut, sans rien casser de légitime, et élimine
                        // d'emblée toute XSS qui tenterait de faire exécuter du JS ou charger une
                        // ressource externe via une réponse de CE serveur.
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"))
                        // Explicite en plus de la valeur par défaut de Spring Security (défense en
                        // profondeur contre le clickjacking si une page HTML venait un jour à être
                        // servie ici, ex: une page d'erreur).
                        .frameOptions(frame -> frame.deny())
                        // N'envoie jamais l'URL complète (potentiellement avec des paramètres
                        // sensibles) comme Referer vers un site tiers lors d'une navigation sortante.
                        .referrerPolicy(referrer -> referrer
                                .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        // Aucune des API navigateur listées n'est nécessaire à une API JSON --
                        // les bloquer explicitement réduit la surface si jamais un contenu tiers
                        // malveillant finissait par s'exécuter dans le contexte de ce domaine.
                        .addHeaderWriter((request, response) -> response.setHeader(
                                "Permissions-Policy",
                                "camera=(), microphone=(), geolocation=(), payment=()"))
                )
                // Le filtre de rate limiting passe AVANT le filtre JWT : une requête qui dépasse
                // le quota (ex: bombardement de /api/auth/login) est rejetée en 429 sans même
                // déclencher la vérification du token ni, pour /login, le hachage BCrypt du mot
                // de passe (volontairement coûteux en CPU -- un vecteur de déni de service à lui
                // seul si rien ne limite le nombre de tentatives en amont).
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(origine -> !origine.isBlank())
                .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}