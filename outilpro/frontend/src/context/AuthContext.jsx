import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/auth";
import { tokenEstValide } from "../utils/jwt";

const AuthContext = createContext(null);
const TOKEN_KEY = "outilpro_admin_token";

export function AuthProvider({ children }) {
    // Lecture paresseuse : on ne lit le localStorage qu'une seule fois, au montage.
    // Un token présent mais déjà expiré (ex: onglet resté ouvert plus de 24h) est
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

    const login = async (username, password) => {
        const data = await authApi.login(username, password);
        setToken(data.token);
        localStorage.setItem(TOKEN_KEY, data.token);
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
    };

    // axios.js déclenche cet événement quand une requête revient en 401 (token
    // invalide/expiré) : on synchronise l'état React en se déconnectant, pour que
    // ProtectedRoute redirige immédiatement vers /admin/login au lieu de laisser
    // l'admin bloqué sur une page qui semble fonctionner mais dont chaque action
    // échouera silencieusement.
    useEffect(() => {
        window.addEventListener("outilpro:session-expiree", logout);
        return () => window.removeEventListener("outilpro:session-expiree", logout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // isAuthenticated revérifie l'expiration à chaque rendu (pas seulement au montage) :
    // si le token stocké a expiré pendant que l'onglet était ouvert, ProtectedRoute doit
    // rediriger vers /admin/login même sans action de l'utilisateur qui déclencherait
    // un appel API (et donc le mécanisme de déconnexion sur 401).
    const value = {
        token,
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