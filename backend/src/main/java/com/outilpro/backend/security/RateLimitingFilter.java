package com.outilpro.backend.security;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Limitation du nombre de requêtes par adresse IP (anti-DDoS / anti-brute-force), sans
 * dépendance externe (Bucket4j, Redis...) : un compteur "fenêtre fixe" en mémoire suffit
 * pour une seule instance de backend comme celle-ci, et évite tout risque lié à la
 * résolution d'une nouvelle dépendance Maven au moment du build.
 * <p>
 * Deux niveaux de protection, cumulatifs (une requête doit passer les DEUX pour être
 * acceptée) :
 * <ul>
 *   <li>une règle GLOBALE, large, sur tout /api/** -- protège contre un flot massif de
 *   requêtes (DDoS applicatif) quelle que soit la route visée ;</li>
 *   <li>des règles DÉDIÉES, nettement plus strictes, sur les routes identifiées comme
 *   des cibles naturelles d'attaque par force brute : la connexion admin, la création
 *   de commandes (spam de commandes par bot) et la vérification de code promo
 *   (devinette de codes par essais successifs).</li>
 * </ul>
 * Toute requête rejetée reçoit une réponse 429 immédiate, AVANT d'atteindre
 * {@link JwtAuthenticationFilter} ou Spring Security -- un script qui bombarde
 * /api/auth/login n'a donc même pas l'occasion de faire travailler la vérification de
 * mot de passe (BCrypt, volontairement coûteux en CPU) à chaque tentative.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    @Value("${app.rate-limit.global.capacity:300}")
    private int capaciteGlobale;

    @Value("${app.rate-limit.global.window-seconds:60}")
    private int fenetreGlobaleSec;

    @Value("${app.rate-limit.login.capacity:5}")
    private int capaciteLogin;

    @Value("${app.rate-limit.login.window-seconds:60}")
    private int fenetreLoginSec;

    @Value("${app.rate-limit.commande.capacity:10}")
    private int capaciteCommande;

    @Value("${app.rate-limit.commande.window-seconds:60}")
    private int fenetreCommandeSec;

    @Value("${app.rate-limit.promo.capacity:15}")
    private int capacitePromo;

    @Value("${app.rate-limit.promo.window-seconds:60}")
    private int fenetrePromoSec;

    private RegleLimitation regleGlobale;
    private RegleLimitation regleLogin;
    private RegleLimitation regleCommande;
    private RegleLimitation reglePromo;

    // Purge périodique des compteurs inactifs : sans ça, chaque IP distincte ayant un
    // jour fait une seule requête laisserait une entrée en mémoire pour toujours --
    // négligeable pour un usage normal, mais un botnet changeant d'IP à chaque requête
    // pourrait sinon transformer le limiteur lui-même en vecteur d'épuisement mémoire.
    private final ScheduledExecutorService purgeExecutor =
            Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "rate-limit-purge");
                t.setDaemon(true);
                return t;
            });

    @PostConstruct
    void initialiser() {
        regleGlobale = new RegleLimitation(capaciteGlobale, fenetreGlobaleSec * 1000L);
        regleLogin = new RegleLimitation(capaciteLogin, fenetreLoginSec * 1000L);
        regleCommande = new RegleLimitation(capaciteCommande, fenetreCommandeSec * 1000L);
        reglePromo = new RegleLimitation(capacitePromo, fenetrePromoSec * 1000L);

        purgeExecutor.scheduleAtFixedRate(() -> {
            long maintenant = System.currentTimeMillis();
            regleGlobale.purgerExpirees(maintenant);
            regleLogin.purgerExpirees(maintenant);
            regleCommande.purgerExpirees(maintenant);
            reglePromo.purgerExpirees(maintenant);
        }, 5, 5, TimeUnit.MINUTES);
    }

    @PreDestroy
    void arreter() {
        purgeExecutor.shutdownNow();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Les pré-vols CORS (OPTIONS) sont émis automatiquement par le navigateur, pas
        // par un utilisateur ou un script -- les compter exposerait à de faux positifs
        // sous usage intensif normal de l'admin (beaucoup d'appels API = beaucoup de
        // préflights). /uploads/** (images statiques) est hors périmètre : une simple
        // page catalogue en charge des dizaines en une fois.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod()) || !request.getRequestURI().startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = extraireIp(request);
        String methode = request.getMethod();
        String chemin = request.getRequestURI();

        RegleLimitation regleSpecifique = null;
        if ("POST".equalsIgnoreCase(methode) && "/api/auth/login".equals(chemin)) {
            regleSpecifique = regleLogin;
        } else if ("POST".equalsIgnoreCase(methode) && "/api/commandes".equals(chemin)) {
            regleSpecifique = regleCommande;
        } else if ("GET".equalsIgnoreCase(methode) && "/api/promos/verifier".equals(chemin)) {
            regleSpecifique = reglePromo;
        }

        if (regleSpecifique != null && !regleSpecifique.autoriser(ip)) {
            rejeter(response);
            return;
        }

        if (!regleGlobale.autoriser(ip)) {
            rejeter(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void rejeter(HttpServletResponse response) throws IOException {
        response.setStatus(429); // HttpServletResponse n'a pas de constante SC_TOO_MANY_REQUESTS avant Servlet 6.1
        response.setContentType("application/json");
        response.setHeader("Retry-After", "60");
        response.getWriter().write("{\"status\":429,\"message\":\"Trop de requêtes. Veuillez réessayer dans un instant.\"}");
    }

    // X-Forwarded-For : utile si un reverse proxy est ajouté devant le backend en
    // production (l'adresse "réelle" du client serait sinon toujours celle du proxy,
    // ce qui rendrait la limitation par IP inopérante -- tout le trafic partagerait un
    // seul compteur). Premier élément de la liste = IP d'origine du client. En
    // développement local (pas de proxy), l'en-tête est absent et on retombe sur
    // request.getRemoteAddr() comme avant.
    private String extraireIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Une règle = un compteur "fenêtre fixe" indépendant par clé (adresse IP). Simple,
     * prévisible, et suffisant pour ce besoin (contrairement à un algorithme "sliding
     * window" ou "token bucket" à débit continu, une fenêtre fixe peut laisser passer
     * jusqu'à 2x la limite nominale pile à la frontière entre deux fenêtres -- un
     * compromis largement acceptable ici face à la simplicité et à l'absence totale de
     * dépendance externe).
     */
    private static final class RegleLimitation {
        private final int limite;
        private final long dureeFenetreMs;
        private final ConcurrentHashMap<String, CompteurFenetre> compteurs = new ConcurrentHashMap<>();

        RegleLimitation(int limite, long dureeFenetreMs) {
            this.limite = limite;
            this.dureeFenetreMs = dureeFenetreMs;
        }

        boolean autoriser(String cle) {
            CompteurFenetre compteur = compteurs.computeIfAbsent(cle, k -> new CompteurFenetre());
            return compteur.essayerConsommer(System.currentTimeMillis(), dureeFenetreMs, limite);
        }

        void purgerExpirees(long maintenant) {
            compteurs.entrySet().removeIf(entry -> entry.getValue().estInactif(maintenant, dureeFenetreMs));
        }
    }

    /**
     * Compteur pour une seule clé (IP) : combien de requêtes depuis le début de la
     * fenêtre courante. "synchronized" sur l'instance -- un verrou par IP, pas un verrou
     * global -- suffisant ici (ce n'est pas un chemin à très haute fréquence par client
     * individuel) et bien plus simple à garantir correct qu'une implémentation
     * lock-free par CAS.
     */
    private static final class CompteurFenetre {
        private long debutFenetreMs;
        private int compte;

        synchronized boolean essayerConsommer(long maintenantMs, long dureeFenetreMs, int limite) {
            if (maintenantMs - debutFenetreMs >= dureeFenetreMs) {
                debutFenetreMs = maintenantMs;
                compte = 0;
            }
            if (compte >= limite) {
                return false;
            }
            compte++;
            return true;
        }

        synchronized boolean estInactif(long maintenantMs, long dureeFenetreMs) {
            // Marge de 2 fenêtres avant purge : une IP qui vient de buter contre la
            // limite ne doit pas voir son compteur disparaître (et donc se réinitialiser
            // gratuitement) avant que sa fenêtre de blocage ne soit réellement terminée.
            return maintenantMs - debutFenetreMs >= dureeFenetreMs * 2;
        }
    }
}
