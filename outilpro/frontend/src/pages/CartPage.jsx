import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { usePromoReduction } from '../hooks/usePromoReduction';
import { useLanguage } from '../context/LanguageContext';

function CartPage() {
    const { articles, modifierQuantite, supprimerDuPanier, totalPrix, codePromo, setCodePromo } = useCart();
    const { t } = useLanguage();
    const [saisiePromo, setSaisiePromo] = useState('');
    const { reduction, erreur: erreurPromo, chargement: verificationEnCours } = usePromoReduction(codePromo, totalPrix);
    const navigate = useNavigate();

    function appliquerCodePromo(e) {
        e.preventDefault();
        if (saisiePromo.trim()) {
            setCodePromo(saisiePromo.trim().toUpperCase());
            setSaisiePromo('');
        }
    }

    const totalApresReduction = Math.max(0, totalPrix - reduction);

    if (articles.length === 0) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                <p className="text-gray-500 text-lg">{t('panierVide')}</p>
                <Link to="/catalogue" className="inline-block mt-4 text-orange-600 font-medium hover:underline">
                    {t('voirCatalogue')}
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('monPanier')}</h1>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                {articles.map((article) => (
                    <div key={article.produitId} className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100 last:border-b-0">
                        <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                            {article.imageUrl && <img src={article.imageUrl} alt={article.nom} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <p className="font-medium text-gray-900">{article.nom}</p>
                            <p className="text-sm text-gray-500">{article.prix} DH</p>
                        </div>

                        {/* Sur mobile, ce bloc (quantité + sous-total + suppression) passe sur sa propre
                            ligne dès que la ligne devient trop étroite, plutôt que d'écraser le texte. */}
                        <div className="flex items-center gap-3 sm:ms-auto">
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => modifierQuantite(article.produitId, article.quantite - 1)}
                                    className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded text-lg hover:bg-gray-50"
                                >
                                    −
                                </button>
                                <span className="w-8 text-center">{article.quantite}</span>
                                <button
                                    onClick={() => modifierQuantite(article.produitId, article.quantite + 1)}
                                    className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded text-lg hover:bg-gray-50"
                                >
                                    +
                                </button>
                            </div>
                            <p className="w-20 text-end font-semibold text-gray-900">{(article.prix * article.quantite).toFixed(2)} DH</p>
                            <button
                                onClick={() => supprimerDuPanier(article.produitId)}
                                aria-label={t('supprimer')}
                                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md ms-auto">
                <form onSubmit={appliquerCodePromo} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={saisiePromo}
                        onChange={(e) => setSaisiePromo(e.target.value)}
                        placeholder={t('codePromoPlaceholder')}
                        // text-base (16px) pour éviter le zoom automatique d'iOS Safari au focus.
                        className="flex-1 px-3 py-2.5 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button type="submit" className="px-4 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800">
                        {t('appliquer')}
                    </button>
                </form>

                {verificationEnCours && <p className="text-sm text-gray-500 mb-4">{t('verificationCode')}</p>}
                {erreurPromo && (
                    <div className="text-sm text-red-600 mb-4 flex items-center justify-between">
                        <span>{erreurPromo}</span>
                        <button onClick={() => setCodePromo(null)} className="underline">{t('retirer')}</button>
                    </div>
                )}
                {codePromo && !erreurPromo && !verificationEnCours && (
                    <div className="text-sm text-green-700 mb-4 flex items-center justify-between">
                        <span>{t('codeApplique', { code: codePromo })}</span>
                        <button onClick={() => setCodePromo(null)} className="underline">{t('retirer')}</button>
                    </div>
                )}

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600"><span>{t('sousTotal')}</span><span>{totalPrix.toFixed(2)} DH</span></div>
                    {reduction > 0 && (
                        <div className="flex justify-between text-green-700"><span>{t('reduction')}</span><span>-{reduction.toFixed(2)} DH</span></div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
                        <span>{t('totalHorsLivraison')}</span><span>{totalApresReduction.toFixed(2)} DH</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/commande')}
                    className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3.5 rounded-md transition-colors"
                >
                    {t('passerCommande')}
                </button>
            </div>
        </div>
    );
}

export default CartPage;
