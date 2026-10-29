import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, consommerMotifDeconnexion } from "../../context/AuthContext";

// Messages affichés quand cette page est atteinte suite à une déconnexion AUTOMATIQUE
// (voir AuthContext.jsx) plutôt qu'un clic volontaire sur "Déconnexion" ou une simple
// visite directe -- pour que l'admin comprenne pourquoi il se retrouve ici sans l'avoir demandé.
const MESSAGES_MOTIF_DECONNEXION = {
    expiration: "Votre session a expiré. Veuillez vous reconnecter.",
    inactivite: "Vous avez été déconnecté(e) après une période d'inactivité. Veuillez vous reconnecter.",
};

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [erreur, setErreur] = useState("");
    const [chargement, setChargement] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // consommerMotifDeconnexion() retire le motif du sessionStorage en le lisant : ce
    // message ne s'affiche donc qu'une seule fois, pas à chaque rafraîchissement ultérieur
    // de cette page.
    useEffect(() => {
        const motif = consommerMotifDeconnexion();
        if (motif && MESSAGES_MOTIF_DECONNEXION[motif]) {
            setErreur(MESSAGES_MOTIF_DECONNEXION[motif]);
        }
    }, []);

    const soumettre = async (e) => {
        e.preventDefault();
        setErreur("");
        setChargement(true);
        try {
            await login(username, password);
            // "/admin" (et non "/admin/stats" en dur) : AdminAccueilRedirect choisit la bonne
            // destination selon le rôle (un EMPLOYE n'a pas accès à /admin/stats).
            navigate("/admin", { replace: true });
        } catch (err) {
            setErreur("Identifiants invalides");
        } finally {
            setChargement(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={soumettre} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4">
                <h1 className="text-xl font-bold text-center">Espace Admin</h1>

                {erreur && (
                    <p className="text-red-600 text-sm text-center">{erreur}</p>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1">Nom d'utilisateur</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Mot de passe</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <button
                    type="submit"
                    disabled={chargement}
                    className="w-full bg-gray-900 text-white rounded py-2 disabled:opacity-50"
                >
                    {chargement ? "Connexion..." : "Se connecter"}
                </button>
            </form>
        </div>
    );
}