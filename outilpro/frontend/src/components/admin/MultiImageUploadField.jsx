import { useState } from 'react';
import uploadApi from '../../api/uploads';
import { IconTrash } from './icons';

/**
 * Champ d'upload de PLUSIEURS images (galerie produit), en complement du champ
 * ImageUploadField (photo de couverture, unique).
 *
 * value    : tableau d'URLs deja envoyees (ou [] si aucune)
 * onChange : appele avec le nouveau tableau d'URLs a chaque ajout/retrait
 */
function MultiImageUploadField({ value = [], onChange, label = 'Photos supplémentaires' }) {
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState(null);

    async function gererSelectionFichiers(e) {
        const fichiers = Array.from(e.target.files || []);
        if (fichiers.length === 0) return;

        const invalide = fichiers.find((f) => !f.type.startsWith('image/'));
        if (invalide) {
            setErreur('Tous les fichiers doivent être des images.');
            e.target.value = '';
            return;
        }

        setErreur(null);
        setEnvoiEnCours(true);
        try {
            // Envoi sequentiel (pas Promise.all) : evite de saturer le serveur si l'admin
            // selectionne beaucoup de fichiers d'un coup, et garde l'ordre d'ajout stable
            // meme si une requete est plus lente qu'une autre.
            const nouvellesUrls = [];
            for (const fichier of fichiers) {
                const { url } = await uploadApi.uploadImage(fichier);
                nouvellesUrls.push(url);
            }
            onChange([...value, ...nouvellesUrls]);
        } catch (err) {
            setErreur("Échec de l'envoi d'une ou plusieurs images.");
            console.error(err);
        } finally {
            setEnvoiEnCours(false);
            e.target.value = ''; // permet de re-choisir les mêmes fichiers plus tard si besoin
        }
    }

    function retirer(index) {
        onChange(value.filter((_, i) => i !== index));
    }

    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>

            {value.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {value.map((url, index) => (
                        <div key={url + index} className="relative">
                            <img src={url} alt="" className="w-20 h-20 object-cover rounded border" />
                            <button
                                type="button"
                                onClick={() => retirer(index)}
                                title="Retirer cette photo"
                                className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-red-500 shadow-sm border border-white transition-colors duration-150 hover:bg-red-100 hover:text-red-600"
                            >
                                <IconTrash className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <input
                type="file"
                accept="image/*"
                multiple
                onChange={gererSelectionFichiers}
                disabled={envoiEnCours}
                className="block w-full text-sm text-gray-600
                           file:mr-3 file:py-2 file:px-4 file:rounded file:border-0
                           file:bg-gray-100 file:text-sm file:font-medium file:text-gray-700
                           hover:file:bg-gray-200 disabled:opacity-50"
            />

            <p className="text-xs text-gray-500 mt-1">
                Tu peux sélectionner plusieurs fichiers à la fois, ou ajouter des photos une par une.
            </p>

            {envoiEnCours && <p className="text-xs text-gray-500 mt-1">Envoi en cours...</p>}
            {erreur && <p className="text-xs text-red-600 mt-1">{erreur}</p>}
        </div>
    );
}

export default MultiImageUploadField;
