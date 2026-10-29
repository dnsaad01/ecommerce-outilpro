package com.outilpro.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Configuration publique exposee au frontend (aucune donnee sensible ici --
 * cet endpoint n'est volontairement pas protege par authentification).
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfigPublicResponse {
    private boolean maintenanceMode;
}
