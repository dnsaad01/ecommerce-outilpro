import { useEffect, useState } from 'react';
import villeApi from '../../api/villes';
import { IconMapPin } from '../../components/admin/icons';
import ActionButtons from '../../components/admin/ActionButtons';

const FORM_VIDE = { nom: '', codePostal: '', fraisLivraison: '' };

// Une ville n'a ni image ni logo : contrairement aux produits/catégories/marques,
// une grille de cartes vides de visuel n'apporterait rien. On garde donc une liste,
// mais avec le même langage visuel que les cartes (coins arrondis, survol, icône,
// suppression discrète) plutôt que l'ancien tableau brut.
function LigneVille({ ville, onModifier, onSupprimer }) {
    const livraisonGratuite = Number(ville.fraisLivraison) === 0;
    return (
        <div
            onClick={() => onModifier(ville)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') onModifier(ville);
            }}
            role="button"
            tabIndex={0}
            title="Cliquer pour modifier cette ville"
            className="group flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-200"
        >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <IconMapPin className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{ville.nom}</p>
                <p className="text-xs text-gray-400 truncate">{ville.codePostal || 'Sans code postal'}</p>
            </div>

            <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                    livraisonGratuite ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                }`}
            >
                {livraisonGratuite ? 'Gratuit' : `${ville.fraisLivraison} DH`}
            </span>

            <ActionButtons
                className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 shrink-0"
                onModifier={() => onModifier(ville)}
                onSupprimer={() => onSupprimer(ville)}
            />
        </div>
    );
}

function VillesPage() {
    const [villes, setVilles] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    const [formOuvert, setFormOuvert] = useState(false);
    const [villeEnEdition, setVilleEnEdition] = useState(null); // null = création
    const [form, setForm] = useState(FORM_VIDE);
    const [erreurFormulaire, setErreurFormulaire] = useState(null);
    const [envoiEnCours, setEnvoiEnCours] = useState(false);

    async function chargerVilles() {
        setChargement(true);
        setErreur(null);
        try {
            const data = await villeApi.getAll();
            setVilles(data);
        } catch (err) {
            setErreur('Impossible de charger les villes.');
            console.error(err);
        } finally {
            setChargement(false);
        }
    }

    useEffect(() => {
        chargerVilles();
    }, []);

    function ouvrirCreation() {
        setVilleEnEdition(null);
        setForm(FORM_VIDE);
        setErreurFormulaire(null);
        setFormOuvert(true);
    }

    function ouvrirEdition(ville) {
        setVilleEnEdition(ville);
        setForm({
            nom: ville.nom,
            codePostal: ville.codePostal || '',
            fraisLivraison: ville.fraisLivraison,
        });
        setErreurFormulaire(null);
        setFormOuvert(true);
    }

    function fermerFormulaire() {
        setFormOuvert(false);
        setVilleEnEdition(null);
    }

    async function soumettre(e) {
        e.preventDefault();
        setErreurFormulaire(null);
        setEnvoiEnCours(true);
        try {
            const payload = {
                nom: form.nom,
                codePostal: form.codePostal || null,
                fraisLivraison: parseFloat(form.fraisLivraison),
            };
            if (villeEnEdition) {
                const maj = await villeApi.update(villeEnEdition.id, payload);
                setVilles((prev) => prev.map((v) => (v.id === maj.id ? maj : v)));
            } else {
                const creee = await villeApi.create(payload);
                setVilles((prev) => [...prev, creee]);
            }
            fermerFormulaire();
        } catch (err) {
            setErreurFormulaire(err.response?.data?.message || "Une erreur est survenue.");
            console.error(err);
        } finally {
            setEnvoiEnCours(false);
        }
    }

    async function supprimer(ville) {
        if (!window.confirm(`Supprimer la ville "${ville.nom}" ? Cette action est irréversible.`)) {
            return;
        }
        try {
            await villeApi.delete(ville.id);
            setVilles((prev) => prev.filter((v) => v.id !== ville.id));
        } catch (err) {
            alert(err.response?.data?.message || "Impossible de supprimer cette ville.");
            console.error(err);
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Villes de livraison</h1>
                <button
                    onClick={ouvrirCreation}
                    className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded hover:bg-gray-800"
                >
                    + Nouvelle ville
                </button>
            </div>

            {formOuvert && (
                <form onSubmit={soumettre} className="bg-white border rounded-lg p-5 mb-6 space-y-4 max-w-lg">
                    <h2 className="font-semibold text-gray-900">
                        {villeEnEdition ? 'Modifier la ville' : 'Nouvelle ville'}
                    </h2>

                    {erreurFormulaire && <p className="text-red-600 text-sm">{erreurFormulaire}</p>}

                    <div>
                        <label className="block text-sm font-medium mb-1">Nom</label>
                        <input
                            type="text"
                            value={form.nom}
                            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                            required
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Code postal (optionnel)</label>
                        <input
                            type="text"
                            value={form.codePostal}
                            onChange={(e) => setForm((f) => ({ ...f, codePostal: e.target.value }))}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Frais de livraison (DH)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.fraisLivraison}
                            onChange={(e) => setForm((f) => ({ ...f, fraisLivraison: e.target.value }))}
                            required
                            className="w-full border rounded px-3 py-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">Mets 0 pour une livraison gratuite dans cette ville.</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={envoiEnCours}
                            className="bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                            {envoiEnCours ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                            type="button"
                            onClick={fermerFormulaire}
                            className="text-sm font-medium px-4 py-2 rounded hover:bg-gray-100"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            )}

            {chargement && <div className="text-center py-16 text-gray-500">Chargement...</div>}
            {erreur && <div className="text-center py-16 text-red-600">{erreur}</div>}

            {!chargement && !erreur && villes.length === 0 && (
                <div className="text-center py-16 text-gray-500">Aucune ville pour le moment.</div>
            )}

            {!chargement && !erreur && villes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {villes.map((ville) => (
                        <LigneVille
                            key={ville.id}
                            ville={ville}
                            onModifier={ouvrirEdition}
                            onSupprimer={supprimer}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default VillesPage;
