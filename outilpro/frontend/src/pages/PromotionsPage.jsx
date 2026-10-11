import { useEffect, useState } from 'react';
import produitApi from '../api/produits';
import ProduitCard from '../components/ProduitCard';
import { useLanguage } from '../context/LanguageContext';

function PromotionsPage() {
    const { t } = useLanguage();
    const [produits, setProduits] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    useEffect(() => {
        async function chargerProduitsEnPromo() {
            setChargement(true);
            setErreur(null);
            try {
                // Le catalogue public renvoie tous les produits ; on ne garde ici que ceux
                // avec une remise active (enPromotion calculé côté backend depuis prixPromotionnel).
                const data = await produitApi.getAll();
                setProduits(data.filter((p) => p.enPromotion));
            } catch (err) {
                setErreur(t('erreurPromotions'));
                console.error(err);
            } finally {
                setChargement(false);
            }
        }
        chargerProduitsEnPromo();
    }, [t]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">{t('promotionsEnCours')}</h1>
            <p className="text-gray-600 mb-8 text-center">{t('promotionsSousTitre')}</p>

            {chargement && <div className="text-center py-16 text-gray-500">{t('chargement')}</div>}
            {erreur && <div className="text-center py-16 text-red-600">{erreur}</div>}

            {!chargement && !erreur && produits.length === 0 && (
                <div className="text-center py-16 text-gray-500">{t('aucunePromotion')}</div>
            )}

            {!chargement && !erreur && produits.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {produits.map((produit) => (
                        <ProduitCard key={produit.id} produit={produit} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default PromotionsPage;
