import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { authApi } from "../api/auth";
import { decoderTokenJwt, tokenEstValide } from "../utils/jwt";

const AuthContext = createContext(null);
const TOKEN_KEY = "outilpro_admin_token";
const MOTIF_DECONNEXION_KEY = "outilpro_motif_deconnexion";

// "Dans l'espace admin" = une route /admin/* autre que /admin/login : la page de
// connexion elle-même n'est pas considérée comme une zone à protéger (y entrer ou en
// sortir ne doit jamais, à elle seule, déclencher une déconnexion).
function estRouteAdminProtegee(pathname) {
    return pathname.startsWith("/admin") && pathname !== "/admin/login";
}

// Durée max d'inactivité sur l'espace admin (aucune interaction souris/clavier) avant
// déconnexion automatique. Indépendante de la durée de vie du token JWT (app.jwt.expiration-ms
// côté backend, 2h) : les deux bornes s'appliquent, la plus courte des deux déconnecte en
// premier -- un admin actif en continu est quand même éjecté au bout de 2h (token expiré côté
// serveur), un admin inactif l'est bien avant si la session dépasse 30 min sans interaction.
const LIMITE_INACTIVITE_MS = 30 * 60 * 1000;

// Fréquence du contrôle périodique (expiration + inactivité) pendant que l'admin est
// connecté. La vraie barrière de sécurité reste le backend, qui revérifie signature et
// expiration à CHAQUE requête API (voir JwtAuthenticationFilter) -- ce minuteur ne sert
// qu'à détecter l'expiration/l'inactivité pendant les périodes sans aucun appel API,
// pour déconnecter sans attendre que l'admin déclenche une action.
const INTERVALLE_VERIFICATION_MS = 15 * 1000;

const EVENEMENTS_ACTIVITE = ["mousedown", "mousemove", "keydown", "wheel", "scroll", "touchstart"];

// À appeler depuis LoginPage au montage : renvoie le motif d'une déconnexion AUTOMATIQUE
// récente ("expiration" | "inactivite"), ou null si la page a été atteinte autrement (lien
// direct, ou déconnexion manuelle via le bouton -- voir logout() ci-dessous). Le motif est
// retiré du sessionStorage à la lecture : un rafraîchissement ultérieur de /admin/login ne
// réaffiche donc pas indéfiniment le même message.
export function consommerMotifDeconnexion() {
    try {
        const motif = sessionStorage.getItem(MOTIF_DECONNEXION_KEY);
        if (motif) sessionStorage.removeItem(MOTIF_DECONNEXION_KEY);
        return motif;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    // Lecture paresseuse : on ne lit le localStorage qu'une seule fois, au montage.
    // Un token présent mais déjà expiré (ex: onglet resté ouvert plus de 2h) est
    // immédiatement écarté ici, sans attendre l'échec du premier appel API — ProtectedRoute
    // redirige donc vers /admin/login dès le premier rendu, sans afficher la page admin
    // même brièvement.
    const [token, setToken] = useState(() => {
        try {
            const stocke = localStorage.getItem(TOKEN_KEY);
            if (stocke && !tokenEstValide(stocke)) {
                localStorage.removeItem(TOKEN_KEY);
                return null;
            }
            return stocke;
        } catch {
            return null;
        }
    });

    const location = useLocation();

    // Mémorise si l'utilisateur se trouvait dans l'espace admin protégé lors du rendu
    // précédent, pour détecter la TRANSITION "sortie de l'espace admin" (voir l'effet
    // plus bas) plutôt que son seul état courant. Initialisé directement depuis l'URL
    // actuelle au montage, pour ne jamais confondre un premier chargement sur /admin
    // avec une "sortie" fictive.
    const etaitDansEspaceAdminRef = useRef(estRouteAdminProtegee(location.pathname));

    // Horodatage de la dernière activité utilisateur, en ref (pas en state) : un simple
    // mousemove peut se déclencher des dizaines de fois par seconde, et re-render tout le
    // contexte à chaque fois serait coûteux pour rien -- seul le contrôle périodique plus
    // bas a besoin de lire cette valeur, pas question de la rendre réactive.
    const derniereActiviteRef = useRef(Date.now());

    const login = async (username, password) => {
        const data = await authApi.login(username, password);
        setToken(data.token);
        localStorage.setItem(TOKEN_KEY, data.token);
        derniereActiviteRef.current = Date.now();
    };

    // motif=null (défaut) : déconnexion manuelle (bouton "Déconnexion" de la sidebar) --
    // aucun message affiché au retour sur l'écran de connexion, l'utilisateur sait déjà
    // pourquoi il y est. motif="expiration"|"inactivite" : déconnexion automatique (voir
    // le minuteur plus bas et l'écouteur sur l'événement 401), LoginPage affiche alors un
    // message via consommerMotifDeconnexion() pour ne pas laisser l'admin perplexe devant
    // un simple retour silencieux à l'écran de connexion.
    //
    // Dans tous les cas (manuelle ou automatique) : le token quitte IMMÉDIATEMENT le state
    // React (setToken(null) -> isAuthenticated devient false au prochain rendu, ce qui fait
    // rediriger ProtectedRoute) ET le localStorage (aucune réutilisation possible, même en
    // rouvrant un onglet). "motif" doit être une chaîne ou null -- jamais un événement DOM
    // (ex: onClick={logout} passerait l'event lui-même en premier argument) : le garde-fou
    // typeof ci-dessous évite qu'un appel mal câblé ne stocke un motif invalide.
    const logout = (motif = null) => {
        setToken(null);
        try {
            localStorage.removeItem(TOKEN_KEY);
            if (typeof motif === "string" && motif) {
                sessionStorage.setItem(MOTIF_DECONNEXION_KEY, motif);
            }
        } catch {
            // Stockage indisponible (navigation privée restrictive, quota, etc.) : la
            // déconnexion en mémoire (setToken(null)) suffit à bloquer l'accès dans cet
            // onglet, qui est l'essentiel ; seul le message de motif serait perdu.
        }
    };

    // axios.js déclenche cet événement quand une requête revient en 401 (token
    // invalide/expiré/signature rejetée par le backend) : on synchronise l'état React en
    // se déconnectant, pour que ProtectedRoute redirige immédiatement vers /admin/login
    // au lieu de laisser l'admin bloqué sur une page qui semble fonctionner mais dont
    // chaque action échouera silencieusement.
    useEffect(() => {
        const onSessionExpiree = () => logout("expiration");
        window.addEventListener("outilpro:session-expiree", onSessionExpiree);
        return () => window.removeEventListener("outilpro:session-expiree", onSessionExpiree);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sortie de l'espace admin (retour au site public, ou toute navigation hors
    // /admin/*) = fin de session immédiate, MÊME si le token JWT sous-jacent est par
    // ailleurs encore valide (ni expiré, ni inactif). Objectif : empêcher qu'un simple
    // retour en arrière dans l'historique du navigateur (ou une URL /admin retapée)
    // ne redonne accès à l'admin sans repasser par /admin/login. La détection repose
    // sur la TRANSITION (était dans l'admin -> ne l'est plus), pas sur l'état
    // courant seul, pour ne jamais déclencher de déconnexion lors d'une navigation
    // normale ENTRE deux pages admin, ni lors du premier accès à /admin/login.
    // motif=undefined (défaut de logout()) : ce n'est pas une erreur, LoginPage
    // n'affiche donc aucun message -- l'utilisateur sait qu'il vient de quitter l'admin.
    useEffect(() => {
        const dansEspaceAdmin = estRouteAdminProtegee(location.pathname);
        if (etaitDansEspaceAdminRef.current && !dansEspaceAdmin) {
            logout();
        }
        etaitDansEspaceAdminRef.current = dansEspaceAdmin;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // Filet de sécurité pour le bfcache du navigateur : après une navigation complète
    // (ex: URL retapée dans la barre d'adresse), un bouton "précédent"/"suivant" peut
    // restaurer une page admin depuis un instantané JS figé AVANT même que React ne
    // remonte ou ne ré-exécute l'effet ci-dessus -- "pageshow" avec persisted=true se
    // déclenche sur une telle restauration (les écouteurs posés avant la mise en cache
    // restent actifs), on y relit le token DIRECTEMENT depuis localStorage (pas depuis
    // le state React, potentiellement lui aussi figé) et on force un rechargement
    // complet vers /admin/login si la page admin affichée n'est plus valide -- un
    // rechargement complet garantit un état JS entièrement neuf, à l'inverse d'une
    // simple navigation React Router qui resterait dans le même contexte figé.
    useEffect(() => {
        const onPageShow = (event) => {
            if (!event.persisted) return;
            if (!estRouteAdminProtegee(window.location.pathname)) return;
            let tokenActuel = null;
            try {
                tokenActuel = localStorage.getItem(TOKEN_KEY);
            } catch {
                tokenActuel = null;
            }
            if (!tokenActuel || !tokenEstValide(tokenActuel)) {
                try {
                    localStorage.removeItem(TOKEN_KEY);
                } catch {
                    // ignore
                }
                window.location.replace("/admin/login");
            }
        };
        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Suppression PHYSIQUE et inconditionnelle du token dès que le document admin est
    // déchargé -- le filet de sécurité le plus strict des trois. Contrairement à l'effet
    // "sortie de l'espace admin" plus haut (qui ne voit que les navigations gérées par
    // React Router À L'INTÉRIEUR de l'app déjà montée), "pagehide" se déclenche pour
    // TOUTE sortie du document courant, y compris une navigation complète (rechargement
    // réel de la page -- ex: URL /admin/... retapée dans la barre d'adresse, favori,
    // fermeture d'onglet) : dans ce cas l'app React entière est détruite et remontée au
    // prochain chargement, donc AUCUN effet basé sur location.pathname n'a jamais la
    // moindre chance de s'exécuter -- c'est précisément le trou par lequel un retour en
    // arrière du navigateur après une navigation complète pouvait encore repasser.
    // "pagehide" (et non "beforeunload", qui bloque l'éligibilité au bfcache et est peu
    // fiable sur mobile) se déclenche aussi bien pour une destruction complète du
    // document que pour une mise en veille bfcache (event.persisted=true) -- dans les
    // deux cas on supprime le token du localStorage ICI, de façon synchrone et
    // INDÉPENDANTE du state React : que la page soit détruite ou simplement figée en
    // mémoire, le localStorage (stockage disque du navigateur) reste, lui, modifié —
    // donc même un instantané bfcache restauré plus tard par "précédent" retrouvera un
    // token absent (et sera de toute façon rejeté par le filet pageshow ci-dessus, qui
    // relit justement le localStorage, pas un state figé). On ne cible QUE la clé du
    // token (pas un localStorage.clear() aveugle) pour ne jamais effacer le panier ou
    // la langue du site public (CartContext/LanguageContext partagent la même origine,
    // potentiellement ouverts dans un autre onglet pendant que l'admin travaille ici).
    useEffect(() => {
        const onPageHide = () => {
            if (!estRouteAdminProtegee(window.location.pathname)) return;
            try {
                localStorage.removeItem(TOKEN_KEY);
            } catch {
                // Stockage indisponible : rien de plus à faire, le document part de
                // toute façon (destruction ou bfcache).
            }
        };
        window.addEventListener("pagehide", onPageHide);
        return () => window.removeEventListener("pagehide", onPageHide);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Déconnexion automatique proactive, tant qu'un token est présent : (1) par
    // inactivité -- aucune interaction souris/clavier pendant LIMITE_INACTIVITE_MS -- et
    // (2) par expiration du token détectée même sans appel API en cours (sinon un token
    // qui expire pendant que l'admin reste immobile sur une page déjà chargée ne serait
    // remarqué qu'au prochain clic déclenchant un appel API, laissant une fenêtre où
    // l'interface semble active alors que la session ne l'est plus). N'écoute/ne minute
    // que si un token existe : aucun coût sur les pages publiques du site (non-admin).
    useEffect(() => {
        if (!token) return undefined;

        const enregistrerActivite = () => {
            derniereActiviteRef.current = Date.now();
        };
        EVENEMENTS_ACTIVITE.forEach((evt) =>
            window.addEventListener(evt, enregistrerActivite, { passive: true })
        );

        const intervalle = setInterval(() => {
            if (!tokenEstValide(token)) {
                logout("expiration");
                return;
            }
            if (Date.now() - derniereActiviteRef.current > LIMITE_INACTIVITE_MS) {
                logout("inactivite");
            }
        }, INTERVALLE_VERIFICATION_MS);

        return () => {
            EVENEMENTS_ACTIVITE.forEach((evt) => window.removeEventListener(evt, enregistrerActivite));
            clearInterval(intervalle);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // isAuthenticated revérifie l'expiration à chaque rendu (pas seulement au montage) :
    // si le token stocké a expiré pendant que l'onglet était ouvert, ProtectedRoute doit
    // rediriger vers /admin/login même sans action de l'utilisateur qui déclencherait
    // un appel API (et donc le mécanisme de déconnexion sur 401).
    //
    // Rôles & Permissions : le rôle n'est jamais stocké séparément (pas de deuxième entrée
    // localStorage à garder synchronisée) -- il est relu depuis le claim "role" déjà présent
    // dans le payload du token (voir JwtService côté backend), comme tokenEstValide relit "exp".
    const payload = decoderTokenJwt(token);
    const role = payload?.role ?? null;

    const value = {
        token,
        role,
        estAdmin: role === "ADMIN",
        isAuthenticated: tokenEstValide(token),
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
    }
    return context;
}
