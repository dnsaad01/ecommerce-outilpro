// Placeholder visuel uniforme pour toutes les zones d'image sans contenu
// (produit, catégorie...). Remplace les blocs gris vides par une icône discrète
// sur fond doux, pour une expérience visuelle propre et professionnelle partout.
function ImagePlaceholder({ label }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z"
                />
            </svg>
            {label && <span className="text-xs text-gray-400">{label}</span>}
        </div>
    );
}

export default ImagePlaceholder;
