import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

function Navbar() {
    const { totalArticles } = useCart();
    const { langue, basculerLangue, t } = useLanguage();
    const [recherche, setRecherche] = useState('');
    const [menuOuvert, setMenuOuvert] = useState(false);
    const navigate = useNavigate();

    const LIENS = [
        { to: '/catalogue', label: t('tousLesProduits') },
        { to: '/collections', label: t('nosCollections') },
        { to: '/marques', label: t('nosMarques') },
        { to: '/promotions', label: t('promotions') },
    ];

    function soumettreRecherche(e) {
        e.preventDefault();
        if (recherche.trim()) {
            navigate(`/catalogue?recherche=${encodeURIComponent(recherche.trim())}`);
            setMenuOuvert(false);
        }
    }

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 md:gap-6">
                {/* Bouton menu mobile : la nav complète (liens ci-dessous) n'a pas la place
                    sur un petit écran, donc elle se replie ici plutôt que de disparaître.
                    Padding généreux (p-2) pour une zone tactile confortable au doigt. */}
                <button
                    onClick={() => setMenuOuvert((o) => !o)}
                    className="md:hidden -ms-2 p-2 text-gray-700 hover:text-orange-600 transition-colors"
                    aria-label={menuOuvert ? t('fermerMenu') : t('ouvrirMenu')}
                    aria-expanded={menuOuvert}
                >
                    {menuOuvert ? (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                        </svg>
                    )}
                </button>

                <Link to="/" className="text-2xl font-bold text-gray-900 tracking-tight shrink-0">
                    Outil<span className="text-orange-600">Pro</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
                    {LIENS.map((lien) => (
                        <Link key={lien.to} to={lien.to} className="hover:text-orange-600 transition-colors">
                            {lien.label}
                        </Link>
                    ))}
                </nav>

                <form onSubmit={soumettreRecherche} className="flex-1 max-w-md ms-auto">
                    <input
                        type="text"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder={t('rechercherPlaceholder')}
                        // text-base (16px) plutôt que text-sm : en-dessous de 16px, iOS Safari
                        // zoome automatiquement la page au focus, ce qui casse l'ergonomie mobile.
                        className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </form>

                {/* Bascule de langue FR / عربي : affiche la langue vers laquelle on bascule. */}
                <button
                    onClick={basculerLangue}
                    className="shrink-0 text-sm font-semibold border border-gray-300 rounded-full px-3 py-2 hover:bg-gray-50 transition-colors"
                    aria-label={t('changerLangue')}
                >
                    {langue === 'fr' ? 'عربي' : 'FR'}
                </button>

                <Link to="/panier" className="relative flex items-center p-2 -me-2 text-gray-700 hover:text-orange-600 transition-colors shrink-0" aria-label={t('panier')}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.87-4.51 2.201-6.518a.75.75 0 00-.734-.882H5.106M7.5 14.25L5.106 5.653M7.5 14.25L6.72 9.75m10.5 4.5l1.5-4.5" />
                    </svg>
                    {totalArticles > 0 && (
                        <span className="absolute top-0 end-0 bg-orange-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {totalArticles}
                        </span>
                    )}
                </Link>
            </div>

            {/* Panneau mobile : mêmes liens que la nav desktop, repliés sous le bandeau
                jusqu'à ce qu'on ouvre le menu. Lignes plus hautes (py-3) pour un tap confortable. */}
            {menuOuvert && (
                <nav className="md:hidden border-t border-gray-100 px-4 py-3 flex flex-col gap-1">
                    {LIENS.map((lien) => (
                        <Link
                            key={lien.to}
                            to={lien.to}
                            onClick={() => setMenuOuvert(false)}
                            className="px-3 py-3 text-base font-medium text-gray-700 rounded hover:bg-gray-50 hover:text-orange-600 transition-colors"
                        >
                            {lien.label}
                        </Link>
                    ))}
                </nav>
            )}
        </header>
    );
}

export default Navbar;
