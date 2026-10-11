import { IconArrowUpDown, IconPencil, IconTrash } from './icons';

// Boutons d'action standard pour toutes les pages admin : "Ajuster le stock" (fond bleu,
// optionnel, seulement sur les produits), "Modifier" (fond neutre) et "Supprimer" (fond
// rouge), même gabarit, même comportement partout.
// Le conteneur intercepte le clic (stopPropagation) : les cartes dont toute la
// surface ouvre déjà l'édition au clic n'ont donc pas besoin de le refaire elles-mêmes.
export default function ActionButtons({ onAjusterStock, onModifier, onSupprimer, className = '' }) {
    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center gap-1.5 ${className}`}
        >
            {onAjusterStock && (
                <button
                    onClick={onAjusterStock}
                    title="Ajuster le stock"
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 shadow-sm transition-colors duration-150 hover:bg-blue-100 hover:text-blue-700"
                >
                    <IconArrowUpDown className="w-4 h-4" />
                </button>
            )}
            {onModifier && (
                <button
                    onClick={onModifier}
                    title="Modifier"
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 shadow-sm transition-colors duration-150 hover:bg-gray-200 hover:text-gray-900"
                >
                    <IconPencil className="w-4 h-4" />
                </button>
            )}
            {onSupprimer && (
                <button
                    onClick={onSupprimer}
                    title="Supprimer"
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 shadow-sm transition-colors duration-150 hover:bg-red-100 hover:text-red-600"
                >
                    <IconTrash className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
