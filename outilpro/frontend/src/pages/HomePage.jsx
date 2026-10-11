import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import produitApi from '../api/produits';
import categorieApi from '../api/categories';
import marqueApi from '../api/marques';
import ProduitCard from '../components/ProduitCard';
import CategorieCard from '../components/CategorieCard';
import MarqueCard from '../components/MarqueCard';
import { useLanguage } from '../context/LanguageContext';
import heroOutillageBg from '../assets/hero-outillage.jpg';

function HomePage() {
    const { t } = useLanguage();
    const [categories, setCategories] = useState([]);
    const [marques, setMarques] = useState([]);
    const [produits, setProduits] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    useEffect(() => {
        async function chargerDonnees() {
            try {
                const [categoriesData, marquesData, produitsData] = await Promise.all([
                    categorieApi.getAll(),
                    marqueApi.getAll(),
                    produitApi.getAll(),
                ]);
                setCategories(categoriesData);
                setMarques(marquesData);
                setProduits(produitsData);
            } catch (err) {
                setErreur(t('erreurChargementDonnees'));
                console.error(err);
            } finally {
                setChargement(false);
            }
        }
        chargerDonnees();
    }, [t]);

    if (chargement) {
        return <div className="text-center py-20 text-gray-500">{t('chargement')}</div>;
    }

    if (erreur) {
        return <div className="text-center py-20 text-red-600">{erreur}</div>;
    }

    return (
        <div>
            <section className="relative overflow-hidden text-white">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${heroOutillageBg})` }}
                    aria-hidden="true"
                ></div>
                <div className="absolute inset-0 bg-black/75" aria-hidden="true"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold">{t('heroTitle')}</h1>
                    <p className="mt-4 text-gray-300 text-base md:text-lg">
                        {t('heroSubtitle')}
                    </p>
                    <Link
                        to="/catalogue"
                        className="inline-block mt-8 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3.5 rounded-md transition-colors"
                    >
                        {t('tousLesProduits')}
                    </Link>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 py-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('nosCollections')}</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    {categories.slice(0, 4).map((categorie) => (
                        <div key={categorie.id} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)]">
                            <CategorieCard categorie={categorie} />
                        </div>
                    ))}
                </div>
                <Link
                    to="/collections"
                    className="inline-block mt-8 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                >
                    {t('voirToutesCollections')} →
                </Link>
            </section>

            <section className="max-w-7xl mx-auto px-4 py-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('nosMarques')}</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    {marques.slice(0, 4).map((marque) => (
                        <div key={marque.id} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)]">
                            <MarqueCard marque={marque} />
                        </div>
                    ))}
                </div>
                <Link
                    to="/marques"
                    className="inline-block mt-8 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                >
                    {t('voirToutesMarques')} →
                </Link>
            </section>

            <section id="produits" className="max-w-7xl mx-auto px-4 py-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('produitsPhares')}</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    {produits.slice(0, 4).map((produit) => (
                        <div key={produit.id} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)]">
                            <ProduitCard produit={produit} />
                        </div>
                    ))}
                </div>
                <Link
                    to="/catalogue"
                    className="inline-block mt-8 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                >
                    {t('voirTousLesProduits')} →
                </Link>
            </section>
        </div>
    );
}


export default HomePage;
