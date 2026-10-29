import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Rôles reconnus pour l'espace admin. Un token dont le claim "role" ne correspond à
// aucun des deux (absent, mal formé, ou toute autre valeur) est traité comme invalide,
// même si sa signature/expiration sont par ailleurs correctes -- défense en profondeur
// contre un token structurellement valide mais sémantiquement incohérent.
const ROLES_CONNUS = ["ADMIN", "EMPLOYE"];

// roles=null (par défaut) : accessible à tout utilisateur admin authentifié avec un rôle
// reconnu (ADMIN ou EMPLOYE) -- ex: Commandes, Produits en consultation. roles=['ADMIN'] :
// routes sensibles (Statistiques, Stock, Catégories, Marques, Promotions) -- un EMPLOYE
// authentifié mais pas autorisé pour CETTE page précise est renvoyé vers /admin/commandes
// (pas vers /login, puisqu'il EST bien connecté : seul son rôle ne convient pas ici).
//
// Revalidation systématique à chaque navigation : useLocation().pathname change à CHAQUE
// changement de route (y compris entre deux pages qui partagent ce même ProtectedRoute,
// ex: /admin/commandes -> /admin/produits -> retour depuis le site client via l'URL
// /admin), donc l'effet ci-dessous se redéclenche à chaque fois -- pas seulement au
// premier montage. Il ne se contente pas de bloquer visuellement l'accès (le rendu
// <Navigate> plus bas suffirait pour ça) : il purge aussi ACTIVEMENT toute session
// invalide (logout()) dès qu'elle est détectée, au lieu de laisser un token périmé
// traîner en state/localStorage jusqu'au prochain appel API en échec ou au prochain
// passage du minuteur de fond (jusqu'à 15s, voir AuthContext.jsx) -- "l'utilisateur
// nettoyé du state" est donc garanti au moment même où l'accès est bloqué, pas après.
export default function ProtectedRoute({ roles = null }) {
    const { isAuthenticated, role, token, logout } = useAuth();
    const location = useLocation();

    // isAuthenticated revérifie déjà signature structurelle + expiration du token (voir
    // AuthContext.jsx / tokenEstValide) ; on y ajoute ici le contrôle du rôle, pour qu'un
    // token authentique mais dont le rôle ne serait ni ADMIN ni EMPLOYE soit lui aussi
    // refusé par CE garde-fou de base, pas seulement par le contrôle roles=['ADMIN'] plus
    // bas qui ne s'applique qu'aux routes explicitement restreintes.
    const sessionValide = isAuthenticated && ROLES_CONNUS.includes(role);

    useEffect(() => {
        if (!sessionValide) {
            // Un token était présent mais invalide/expiré/rôle incohérent -> motif
            // "expiration" (LoginPage affiche un message). Aucun token du tout (visite
            // directe, jamais connecté) -> pas de motif, retour silencieux à l'écran de
            // connexion : annoncer une "session expirée" à quelqu'un qui n'en a jamais eu
            // une serait trompeur.
            logout(token ? "expiration" : undefined);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, sessionValide]);

    if (!sessionValide) {
        return <Navigate to="/admin/login" replace />;
    }

    if (roles && !roles.includes(role)) {
        return <Navigate to="/admin/commandes" replace />;
    }

    return <Outlet />;
}
