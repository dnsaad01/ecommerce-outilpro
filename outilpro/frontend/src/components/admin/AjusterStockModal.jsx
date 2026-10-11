import { useState } from 'react';
import stockApi from '../../api/stock';
import { IconArrowDownCircle, IconArrowUpCircle, IconX } from './icons';

const MOTIFS = [
    { value: 'REAPPROVISIONNEMENT', label: 'Réapprovisionnement fournisseur' },
    { value: 'CORRECTION_INVENTAIRE', label: "Correction d'inventaire" },
    { value: 'RETOUR_CLIENT', label: 'Retour client' },
    { value: 'PRODUIT_ENDOMMAGE', label: 'Produit endommagé / perdu' },
    { value: 'AUTRE', label: 'Autre' },
];

/**
 * Modale de gestion rapide du stock : entrée ou sortie d'une quantité, avec motif,
 * sans passer par le formulaire complet d'édition du produit.
 * Utilisée depuis la page "Gestion des stocks" et depuis la liste des produits.
 *
 * produit  : { id, nom, sku, stock } — le stock affiché doit être la valeur à jour.
 * onFermer : appelé pour fermer la modale (annulation ou après succès).
 * onSucces : appelé avec la réponse du mouvement créé, pour rafraîchir les listes appelantes.
 */
function AjusterStockModal({ produit, onFermer, onSucces }) {
    const [type, setType] = useState('ENTREE');
    const [quantite, setQuantite] = useState('');
    const [motif, setMotif] = useState(MOTIFS[0].value);
    const [commentaire, setCommentaire] = useState('');
    const [erreur, setErreur] = useState(null);
    const [envoiEnCours, setEnvoiEnCours] = useState(false);

    const quantiteNombre = parseInt(quantite, 10);
    const quantiteValide = Number.isInteger(quantiteNombre) && quantiteNombre > 0;
    const stockApres = quantiteValide
        ? (type === 'ENTREE' ? produit.stock + quantiteNombre : produit.stock - quantiteNombre)
        : produit.stock;
    const sortieImpossible = type === 'SORTIE' && quantiteValide && stockApres < 0;

    async function soumettre(e) {
        e.preventDefault();
        if (!quantiteValide || sortieImpossible) return;

        setErreur(null);
        setEnvoiEnCours(true);
        try {
            const mouvement = await stockApi.creerMouvement({
                produitId: produit.id,
                type,
                quantite: quantiteNombre,
                motif,
                commentaire: commentaire.trim() || null,
            });
            onSucces(mouvement);
            onFermer();
        } catch (err) {
            setErreur(err.response?.data?.message || "Une erreur est survenue.");
            console.error(err);
        } finally {
            setEnvoiEnCours(false);
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={onFermer}
        >
            <form
                onSubmit={soumettre}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-lg w-full max-w-md p-5 space-y-4"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="font-semibold text-gray-900">Ajuster le stock</h2>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{produit.nom}</p>
                        <p className="text-xs text-gray-400 font-mono">{produit.sku}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onFermer}
                        className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-150"
                    >
                        <IconX className="w-4 h-4" />
                    </button>
                </div>

                {erreur && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{erreur}</p>}

                {/* Choix Entrée / Sortie : deux gros boutons, pour que le sens du mouvement
                    soit sans ambiguïté avant même de regarder la quantité. */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setType('ENTREE')}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors duration-150 ${
                            type === 'ENTREE'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <IconArrowUpCircle className="w-4 h-4" />
                        Entrée
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('SORTIE')}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors duration-150 ${
                            type === 'SORTIE'
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <IconArrowDownCircle className="w-4 h-4" />
                        Sortie
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Quantité</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        autoFocus
                        value={quantite}
                        onChange={(e) => setQuantite(e.target.value)}
                        required
                        className="w-full border rounded px-3 py-2"
                        placeholder="Ex. 20"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Motif</label>
                    <select
                        value={motif}
                        onChange={(e) => setMotif(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                    >
                        {MOTIFS.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Commentaire (optionnel)</label>
                    <textarea
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                        rows={2}
                        maxLength={500}
                        className="w-full border rounded px-3 py-2 text-sm"
                        placeholder="Ex. Bon de livraison n°2024-118"
                    />
                </div>

                {/* Aperçu en direct : stock actuel -> nouveau stock, pour valider d'un coup d'œil
                    avant de soumettre. Passe en rouge si la sortie demandée est impossible. */}
                <div className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${
                    sortieImpossible ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
                }`}>
                    <span>Stock actuel : <span className="font-semibold">{produit.stock}</span></span>
                    <span>
                        Nouveau stock : <span className="font-semibold">{quantiteValide ? Math.max(stockApres, 0) : produit.stock}</span>
                        {sortieImpossible && ' — insuffisant'}
                    </span>
                </div>

                <div className="flex gap-2 pt-1">
                    <button
                        type="submit"
                        disabled={envoiEnCours || !quantiteValide || sortieImpossible}
                        className="bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                    >
                        {envoiEnCours ? 'Enregistrement...' : 'Confirmer'}
                    </button>
                    <button
                        type="button"
                        onClick={onFermer}
                        className="text-sm font-medium px-4 py-2 rounded hover:bg-gray-100"
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AjusterStockModal;
