import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Intercepteur de REQUÊTE : avant chaque appel, on regarde si un token existe
// dans le localStorage, et si oui on l'ajoute dans le header Authorization.
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("outilpro_admin_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur de RÉPONSE : si le backend renvoie 401 (token invalide/expiré),
// on nettoie le token stocké. axios.js ne connaît pas le router ni le contexte React,
// donc on prévient via un événement navigateur : AuthContext l'écoute et appelle
// logout(), ce qui met à jour son état React et fait réagir ProtectedRoute (sans ce
// signal, isAuthenticated resterait "true" en mémoire même après un token supprimé
// du localStorage, et l'utilisateur resterait bloqué sur une page qui semble marcher
// jusqu'au prochain appel authentifié).
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("outilpro_admin_token");
            window.dispatchEvent(new Event("outilpro:session-expiree"));
        }
        return Promise.reject(error);
    }
);

export default apiClient;