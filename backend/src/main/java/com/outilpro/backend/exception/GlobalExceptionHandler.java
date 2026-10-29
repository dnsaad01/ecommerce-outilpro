package com.outilpro.backend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    // Levée par @PreAuthorize (Rôles & Permissions) quand un EMPLOYE appelle un endpoint
    // réservé à ADMIN. Sans ce handler explicite, elle serait absorbée par le catch-all
    // générique ci-dessous et renverrait une 500 trompeuse au lieu d'une 403 claire.
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccesRefuse(AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "Accès refusé : votre rôle ne permet pas cette action.");
    }

    // Déclenché quand on essaie de supprimer une ligne encore référencée ailleurs
    // (ex: une Catégorie ou une Marque encore utilisée par des Produits) —
    // sans ce handler, Spring renverrait une 500 brute avec la trace SQL exposée au client.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleIntegrity(DataIntegrityViolationException ex) {
        return buildResponse(HttpStatus.CONFLICT,
                "Impossible d'effectuer cette action : cet élément est encore utilisé ailleurs dans l'application.");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> erreurs = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            erreurs.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("erreurs", erreurs);
        return ResponseEntity.badRequest().body(body);
    }

    // Fichier envoyé plus lourd que spring.servlet.multipart.max-file-size (5MB) — sans ce
    // handler, cette exception n'est pas interceptée par le catch-all générique ci-dessous
    // (elle est levée trop tôt dans le traitement de la requête) et remonte comme une erreur
    // brute peu claire pour l'utilisateur qui essaie d'uploader une photo prise au téléphone.
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleUploadTropVolumineux(MaxUploadSizeExceededException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Le fichier est trop volumineux (5 Mo maximum).");
    }

    // Filet de sécurité : toute exception non prévue ci-dessus (bug, coupure DB, etc.) est
    // journalisée en détail côté serveur pour le diagnostic, mais le client ne reçoit jamais
    // le message technique ni la stack trace — juste un message générique dans le même format
    // JSON que les autres erreurs, pour que le frontend (qui lit err.response?.data?.message)
    // ait toujours quelque chose de cohérent à afficher plutôt qu'une page d'erreur brute.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenerique(Exception ex) {
        log.error("Erreur inattendue", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "Une erreur inattendue est survenue. Merci de réessayer dans un instant.");
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
