import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [erreur, setErreur] = useState("");
    const [chargement, setChargement] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const soumettre = async (e) => {
        e.preventDefault();
        setErreur("");
        setChargement(true);
        try {
            await login(username, password);
            navigate("/admin/stats", { replace: true });
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