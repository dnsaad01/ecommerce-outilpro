import { useEffect, useState } from 'react';
import marqueApi from '../../api/marques';
import ImageUploadField from '../../components/admin/ImageUploadField';
import { IconImageOff, IconMapPin } from '../../components/admin/icons';
import ActionButtons from '../../components/admin/ActionButtons';

const FORM_VIDE = { nom: '', pays: '', logoUrl: '' };

// Carte marque : le logo est traité différemment d'une photo produit (object-contain
// sur fond clair, pour ne jamais recadrer/couper un logo) ; le pays s'affiche avec une
// petite icône plutôt qu'en colonne de tableau.
function CarteMarque({ marque, onModifier, onSupprimer }) {
    return (
        <div
            onClick={() => onModifier(marque)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') onModifier(marque);
            }}
            role="button"
            tabIndex={0}
            title="Cliquer pour modifier cette marque"
            className="group relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-200"
        >
            <div className="relative aspect-[4/3] bg-gray-50">
                {marque.logoUrl ? (
                    <img src={marque.logoUrl} alt={marque.nom} className="w-full h-full object-contain p-4" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <IconImageOff className="w-8 h-8" />
                    </div>
                )}

                <ActionButtons
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150"
                    onModifier={() => onModifier(marque)}
                    onSupprimer={() => onSupprimer(marque)}
                />
            </div>

            <div className="p-3">
                <p className="font-medium text-gray-900 text-sm truncate">{marque.nom}</p>
                {marque.pays && (
                    <p className="flex items-center gap-1 text-xs text-gray-500 truncate mt-0.5">
                        <IconMapPin className="w-3 h-3 shrink-0" />
                        {marque.pays}
                    </p>
                )}
            </div>
        </div>
    );
}

function MarquesAdminPage() {
    const [marques, setMarques] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    const [formOuvert, setFormOuvert] = useState(false);
    const [marqueEnEdition, setMarqueEnEdition] = useState(null); // null = création
    const [form, setForm] = useState(FORM_VIDE);
    const [erreurFormulaire, setErreurFormulaire] = useState(null);
    const [envoiEnCours, setEnvoiEnCours] = useState(false);

    async function chargerMarques() {
        setChargement(true);
        setErreur(null);
        try {
            const data = await marqueApi.getAll();
            setMarques(data);
        } catch (err) {
            setErreur('Impossible de charger les marques.');
            console.error(err);
        } finally {
            setChargement(false);
        }
    }

    useEffect(() => {
        chargerMarques();
    }, []);

    function ouvrirCreation() {
        setMarqueEnEdition(null);
        setForm(FORM_VIDE);
        setErreurFormulaire(null);
        setFormOuvert(true);
    }

    function ouvrirEdition(marque) {
        setMarqueEnEdition(marque);
        setForm({ nom: marque.nom, pays: marque.pays || '', logoUrl: marque.logoUrl || '' });
        setErreurFormulaire(null);
        setFormOuvert(true);
    }

    function fermerFormulaire() {
        setFormOuvert(false);
        setMarqueEnEdition(null);
    }

    async function soumettre(e) {
        e.preventDefault();
        setErreurFormulaire(null);
        setEnvoiEnCours(true);
        try {
            const payload = { nom: form.nom, pays: form.pays || null, logoUrl: form.logoUrl || null };
            if (marqueEnEdition) {
                const maj = await marqueApi.update(marqueEnEdition.id, payload);
                setMarques((prev) => prev.map((m) => (m.id === maj.id ? maj : m)));
            } else {
                const creee = await marqueApi.create(payload);
                setMarques((prev) => [...prev, creee]);
            }
            fermerFormulaire();
        } catch (err) {
            setErreurFormulaire(err.response?.data?.message || "Une erreur est survenue.");
            console.error(err);
        } finally {
            setEnvoiEnCours(false);
        }
    }

    async function supprimer(marque) {
        if (!window.confirm(`Supprimer la marque "${marque.nom}" ? Cette action est irréversible.`)) {
            return;
        }
        try {
            await marqueApi.delete(marque.id);
            setMarques((prev) => prev.filter((m) => m.id !== marque.id));
        } catch (err) {
            alert(err.response?.data?.message || "Impossible de supprimer cette marque.");
            console.error(err);
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Marques</h1>
                <button
                    onClick={ouvrirCreation}
                    className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded hover:bg-gray-800"
                >
                    + Nouvelle marque
                </button>
            </div>

            {formOuvert && (
                <form onSubmit={soumettre} className="bg-white border rounded-lg p-5 mb-6 space-y-4 max-w-lg">
                    <h2 className="font-semibold text-gray-900">
                        {marqueEnEdition ? 'Modifier la marque' : 'Nouvelle marque'}
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
                        <label className="block text-sm font-medium mb-1">Pays (optionnel)</label>
                        <input
                            type="text"
                            value={form.pays}
                            onChange={(e) => setForm((f) => ({ ...f, pays: e.target.value }))}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <ImageUploadField
                        label="Logo de la marque (optionnel)"
                        value={form.logoUrl}
                        onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
                    />

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

            {!chargement && !erreur && marques.length === 0 && (
                <div className="text-center py-16 text-gray-500">Aucune marque pour le moment.</div>
            )}

            {!chargement && !erreur && marques.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {marques.map((marque) => (
                        <CarteMarque
                            key={marque.id}
                            marque={marque}
                            onModifier={ouvrirEdition}
                            onSupprimer={supprimer}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default MarquesAdminPage;
