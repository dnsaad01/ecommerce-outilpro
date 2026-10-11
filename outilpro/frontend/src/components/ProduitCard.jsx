import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import ImagePlaceholder from './ImagePlaceholder';

function ProduitCard({ produit }) {
    const { ajouterAuPanier } = useCart();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const enPromo = produit.enPromotion;
    const pourcentageReduction = enPromo
        ? Math.round((1 - produit.prixEffectif / produit.prix) * 100)
        : 0;
    const enStock = produit.stock > 0;

    // Achat rapide : ajoute le produit (quantité 1) au panier puis file directement
    // au tunnel de commande, sans passer par la page Panier.
    function commanderMaintenant() {
        ajouterAuPanier(produit, 1);
        navigate('/commande');
    }

    return (
        <div className="group w-full max-w-[240px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <Link to={`/produit/${produit.id}`} className="block">
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {enPromo && (
                        <span className="absolute top-1.5 start-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            -{pourcentageReduction}%
                        </span>
                    )}
                    {produit.imageUrl ? (
                        <img
                            src={produit.imageUrl}
                            alt={produit.nom}
                            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                        />
                    ) : (
                        <ImagePlaceholder label={t('pasDImage')} />
                    )}
                </div>
                <div className="p-3 pb-0">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">{produit.marqueNom}</p>
                    <h3 className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2 group-hover:text-orange-600 transition-colors">{produit.nom}</h3>

                    {enPromo ? (
                        <div className="mt-1.5 flex items-baseline gap-1.5">
                            <p className="text-base font-bold text-orange-600">{produit.prixEffectif} DH</p>
                            <p className="text-xs text-gray-400 line-through">{produit.prix} DH</p>
                        </div>
                    ) : (
                        <p className="text-base font-bold text-orange-600 mt-1.5">{produit.prix} DH</p>
                    )}
                </div>
            </Link>

            <div className="p-3 pt-2 space-y-1">
                <button
                    onClick={() => ajouterAuPanier(produit, 1)}
                    disabled={!enStock}
                    className="w-full bg-gray-900 text-white text-xs font-medium py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    {enStock ? t('ajouterAuPanier') : t('ruptureStock')}
                </button>
                {enStock && (
                    <button
                        onClick={commanderMaintenant}
                        className="w-full border border-orange-600 text-orange-600 text-[11px] font-semibold py-1.5 rounded-md hover:bg-orange-50 transition-colors"
                    >
                        {t('commanderMaintenant')}
                    </button>
                )}
            </div>
        </div>
    );
}

export default ProduitCard;
