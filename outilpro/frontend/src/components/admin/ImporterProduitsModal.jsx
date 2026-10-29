import { useState } from 'react';
import produitImportApi from '../../api/produitsImport';
import { IconX, IconFileSpreadsheet, IconUpload } from './icons';

/**
 * Modale d'import en masse de produits depuis un fichier Excel (.xlsx) -- évite la
 * saisie manuelle produit par produit : les catégories/marques citées dans le
 * fichier sont créées automatiquement si elles n'existent pas encore (voir
 * ProduitImportService côté backend pour le détail des règles).
 *
 * onFermer : appelé pour fermer la modale (annulation ou après fermeture du résultat).
 * onSucces : appelé après un import réussi (même partiellement), pour rafraîchir la liste.
 */
function ImporterProduitsModal({ onFermer, onSucces }) {
    const [fichier, setFichier] = useState(null);
    const [enCours, setEnCours] = useState(false);
    const [telechargementEnCours, setTelechargementEnCours] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [resultat, setResultat] = useState(null);

    function gererSelectionFichier(e) {
        const f = e.target.files[0];
        setErreur(null);
        setResultat(null);
        if (f && !f.name.toLowerCase().endsWith('.xlsx')) {
            setErreur('Le fichier doit être au format Excel (.xlsx).');
            setFichier(null);
            return;
        }
        setFichier(f || null);
    }

    async function telechargerModele() {
        setTelechargementEnCours(true);
        setErreur(null);
        try {
            const blob = await produitImportApi.telechargerModele();
            const url = window.URL.createObjectURL(blob);
            const lien = document.createElement('a');
            lien.href = url;
            lien.download = 'modele-import-produits.xlsx';
            document.body.appendChild(lien);
            lien.click();
            lien.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setErreur('Impossible de télécharger le modèle pour le moment.');
            console.error(err);
        } finally {
            setTelechargementEnCours(false);
        }
    }

    async function lancerImport() {
        if (!fichier) return;
        setEnCours(true);
        setErreur(null);
        try {
            const resultatImport = await produitImportApi.importer(fichier);
            setResultat(resultatImport);
            onSucces?.(resultatImport);
        } catch (err) {
            setErreur(err.response?.data?.message || "Échec de l'import. Vérifiez le fichier et réessayez.");
            console.error(err);
        } finally {
            setEnCours(false);
        }
    }

    const aDesErreurs = Boolean(resultat?.erreurs?.length);
    const totalCrees = (resultat?.produitsCrees ?? 0) + (resultat?.produitsMisAJour ?? 0);

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onFermer}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-lg w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="font-semibold text-gray-900">Importer des produits (Excel)</h2>
                        <p className="text-sm text-gray-500">
                            Les catégories et marques citées dans le fichier sont créées automatiquement si besoin.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onFermer}
                        className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-150"
                    >
                        <IconX className="w-4 h-4" />
                    </button>
                </div>

                {!resultat && (
                    <>
                        <button
                            type="button"
                            onClick={telechargerModele}
                            disabled={telechargementEnCours}
                            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <IconFileSpreadsheet className="w-4 h-4" />
                            {telechargementEnCours ? 'Préparation...' : 'Télécharger le modèle (.xlsx)'}
                        </button>

                        <div>
                            <label className="block text-sm font-medium mb-1">Fichier à importer</label>
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={gererSelectionFichier}
                                disabled={enCours}
                                className="block w-full text-sm text-gray-600
                                           file:mr-3 file:py-2 file:px-4 file:rounded file:border-0
                                           file:bg-gray-100 file:text-sm file:font-medium file:text-gray-700
                                           hover:file:bg-gray-200 disabled:opacity-50"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Une ligne par produit. Les colonnes Nom, Prix, Stock, SKU, Categorie et Marque sont obligatoires.
                            </p>
                        </div>

                        {erreur && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{erreur}</p>}

                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={lancerImport}
                                disabled={!fichier || enCours}
                                className="inline-flex items-center gap-2 bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                            >
                                <IconUpload className="w-4 h-4" />
                                {enCours ? 'Import en cours...' : 'Importer'}
                            </button>
                            <button
                                type="button"
                                onClick={onFermer}
                                className="text-sm font-medium px-4 py-2 rounded hover:bg-gray-100"
                            >
                                Annuler
                            </button>
                        </div>
                    </>
                )}

                {resultat && (
                    <div className="space-y-3">
                        <div className={`rounded-lg px-3 py-2.5 text-sm ${aDesErreurs ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                            {totalCrees} produit(s) importé(s) avec succès
                            {resultat.categoriesCreees > 0 && ` · ${resultat.categoriesCreees} catégorie(s) créée(s)`}
                            {resultat.marquesCreees > 0 && ` · ${resultat.marquesCreees} marque(s) créée(s)`}
                            {aDesErreurs && ` · ${resultat.erreurs.length} ligne(s) en erreur`}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                                <p className="text-gray-400 text-xs">Créés</p>
                                <p className="font-semibold text-gray-900">{resultat.produitsCrees}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                                <p className="text-gray-400 text-xs">Mis à jour</p>
                                <p className="font-semibold text-gray-900">{resultat.produitsMisAJour}</p>
                            </div>
                        </div>

                        {aDesErreurs && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Lignes en erreur :</p>
                                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
                                    {resultat.erreurs.map((e, i) => (
                                        <div key={i} className="px-3 py-2 text-sm">
                                            <span className="font-medium text-gray-700">Ligne {e.ligne}</span>
                                            <span className="text-gray-500"> — {e.message}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Corrigez ces lignes dans le fichier puis réimportez-le : les lignes déjà importées ne seront pas dupliquées.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => { setResultat(null); setFichier(null); }}
                                className="text-sm font-medium px-4 py-2 rounded border hover:bg-gray-50"
                            >
                                Importer un autre fichier
                            </button>
                            <button
                                type="button"
                                onClick={onFermer}
                                className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded hover:bg-gray-800"
                            >
                                Terminer
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ImporterProduitsModal;
