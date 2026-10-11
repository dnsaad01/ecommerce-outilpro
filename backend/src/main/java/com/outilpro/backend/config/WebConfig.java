package com.outilpro.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

/**
 * Expose le dossier de stockage des images uploadées (app.upload.dir, ex: "uploads/")
 * sur l'URL publique /uploads/** — nécessaire car ce dossier est en dehors de
 * classpath:/static, donc pas servi automatiquement par Spring Boot.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path cheminAbsolu = Path.of(uploadDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + cheminAbsolu + "/");
    }
}
