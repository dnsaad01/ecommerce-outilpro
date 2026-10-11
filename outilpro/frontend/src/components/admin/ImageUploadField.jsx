import { useState } from 'react';
import uploadApi from '../../api/uploads';
import { IconTrash } from './icons';

/**
 * Champ d'upload d'image réutilisable pour les formulaires admin
 * (Catégories, Marques, Produits...).
 *
 * value    : l'URL actuelle de l'image (ou '' si aucune)
 * onChange : appelé avec la nouvelle URL une fois l'upload terminé (ou '' si on retire l'image)
 */
function ImageUploadField({ value, onChange, label = 'Image' }) {
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState(null);

    async function gererSelectionFichier(e) {
        const fichier = e.target.files[0];
        if (!fichier) return;

        if (!fichier.type.startsWith('image/')) {
            setErreur('Le fichier doit être une image.');
            return;
        }

        setErreur(null);
        setEnvoiEnCours(true);
        try {
            const { url } = await uploadApi.uploadImage(fichier);
            onChange(url);
        } catch (err) {
            setErreur("Échec de l'envoi de l'image.");
            console.error(err);
        } finally {
            setEnvoiEnCours(false);
            e.target.value = ''; // permet de re-choisir le même fichier plus tard si besoin
        }
    }

    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>

            {value && (
                <div className="relative inline-block mb-2">
                    <img src={value} alt="" className="w-24 h-24 object-cover rounded border" />
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        title="Retirer l'image"
                        className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-500 shadow-sm border border-white transition-colors duration-150 hover:bg-red-100 hover:text-red-600"
                    >
                        <IconTrash className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            <input
                type="file"
                accept="image/*"
                onChange={gererSelectionFichier}
                disabled={envoiEnCours}
                className="block w-full text-sm text-gray-600
                           file:mr-3 file:py-2 file:px-4 file:rounded file:border-0
                           file:bg-gray-100 file:text-sm file:font-medium file:text-gray-700
                           hover:file:bg-gray-200 disabled:opacity-50"
            />

            {envoiEnCours && <p className="text-xs text-gray-500 mt-1">Envoi en cours...</p>}
            {erreur && <p className="text-xs text-red-600 mt-1">{erreur}</p>}
        </div>
    );
}

export default ImageUploadField;
