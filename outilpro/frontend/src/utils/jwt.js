// Décodage JWT côté client, à des fins UNIQUEMENT d'affichage/UX (savoir si le token
// stocké a expiré, pour éviter d'afficher brièvement une page admin avant que le
// premier appel API échoue en 401). La signature n'est jamais vérifiée ici : ce n'est
// pas une preuve de sécurité, seulement la lecture de la date d'expiration ("exp") déjà
// publique dans le payload. La vraie barrière de sécurité reste le backend (Spring
// Security + JwtAuthenticationFilter), qui vérifie la signature et l'expiration sur
// chaque requête protégée.
export function decoderTokenJwt(token) {
    try {
        const [, payloadBase64] = token.split('.');
        if (!payloadBase64) return null;
        // base64url -> base64 standard avant de décoder
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('')
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

// Un token absent, illisible, ou dont la date d'expiration ("exp", en secondes epoch)
// est passée est considéré invalide.
export function tokenEstValide(token) {
    if (!token) return false;
    const payload = decoderTokenJwt(token);
    if (!payload?.exp) return false;
    return payload.exp * 1000 > Date.now();
}
