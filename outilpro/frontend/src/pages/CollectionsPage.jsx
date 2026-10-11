import { useEffect, useState } from 'react';
import categorieApi from '../api/categories';
import CategorieCard from '../components/CategorieCard';
import { useLanguage } from '../context/LanguageContext';

function CollectionsPage() {
    const { t } = useLanguage();
    const [categories, setCategories] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    useEffect(() => {
        async function chargerCategories() {
            setChargement(true);
            setErreur(null);
            try {
                const data = await categorieApi.getAll();
                setCategories(data);
            } catch (err) {
                setErreur(t('erreurCategories'));
                console.error(err);
            } finally {
                setChargement(false);
            }
        }
        chargerCategories();
    }, [t]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('nosCollections')}</h1>

            {chargement && <div className="text-center py-16 text-gray-500">{t('chargement')}</div>}
            {erreur && <div className="text-center py-16 text-red-600">{erreur}</div>}

            {!chargement && !erreur && categories.length === 0 && (
                <div className="text-center py-16 text-gray-500">{t('aucuneCategorie')}</div>
            )}

            {!chargement && !erreur && categories.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map((categorie) => (
                        <CategorieCard key={categorie.id} categorie={categorie} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CollectionsPage;
