import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import produitApi from '../api/produits';
import categorieApi from '../api/categories';
import marqueApi from '../api/marques';
import ProduitCard from '../components/ProduitCard';
import { useLanguage } from '../context/LanguageContext';

const TRI_DEFAUT = 'nom_asc';

function CataloguePage() {
    const { t } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    const categorieId = searchParams.get('categorieId');
    const marqueId = searchParams.get('marqueId');
    const recherche = searchParams.get('recherche');
    const tri = searchParams.get('tri') || TRI_DEFAUT;
    const enStockActif = searchParams.get('enStock') === 'true';

    const [categories, setCategories] = useState([]);
    const [marques, setMarques] = useState([]);
    const [produits, setProduits] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    // Les listes de filtres ne se chargent qu'une fois
    useEffect(() => {
        async function chargerFiltres() {
            try {
                const [categoriesData, marquesData] = await Promise.all([
                    categorieApi.getAll(),
                    marqueApi.getAll(),
                ]);
                setCategories(categoriesData);
                setMarques(marquesData);
            } catch (err) {
                console.error(err);
            }
        }
        chargerFiltres();
    }, []);

    // Les produits se rechargent à chaque changement de filtre. Tous les filtres sont
    // maintenant combinables côté backend (categorie + marque + recherche + stock + tri).
    useEffect(() => {
        async function chargerProduits() {
            setChargement(true);
            setErreur(null);
            try {
                const params = { tri };
                if (categorieId) params.categorieId = categorieId;
                if (marqueId) params.marqueId = marqueId;
                if (recherche) params.recherche = recherche;
                if (enStockActif) params.enStock = true;
                const data = await produitApi.getAll(params);
                setProduits(data);
            } catch (err) {
                setErreur(t('erreurChargementProduits'));
                console.error(err);
            } finally {
                setChargement(false);
            }
        }
        chargerProduits();
    }, [categorieId, marqueId, recherche, tri, enStockActif, t]);

    // Met à jour un ou plusieurs paramètres d'URL en préservant les autres filtres actifs
    // (auparavant chaque filtre reconstruisait l'URL à la main et en perdait certains au passage).
    function mettreAJourFiltres(changements) {
        const params = new URLSearchParams(searchParams);
        Object.entries(changements).forEach(([cle, valeur]) => {
            if (valeur === null || valeur === undefined || valeur === '') {
                params.delete(cle);
            } else {
                params.set(cle, String(valeur));
            }
        });
        setSearchParams(params);
    }

    function selectionnerCategorie(id) {
        mettreAJourFiltres({ categorieId: id });
    }

    function selectionnerMarque(id) {
        mettreAJourFiltres({ marqueId: id });
    }

    function changerTri(valeur) {
        mettreAJourFiltres({ tri: valeur === TRI_DEFAUT ? null : valeur });
    }

    function basculerEnStock() {
        mettreAJourFiltres({ enStock: enStockActif ? null : 'true' });
    }

    function reinitialiserFiltres() {
        setSearchParams({});
    }

    const desFiltresSontActifs = categorieId || marqueId || recherche || tri !== TRI_DEFAUT || enStockActif;

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row md:items-start gap-8">
            <aside className="w-full md:w-72 shrink-0 md:sticky md:top-24">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">{t('filtres')}</h2>
                        {desFiltresSontActifs && (
                            <button onClick={reinitialiserFiltres} className="text-sm text-orange-600 hover:underline">
                                {t('reinitialiser')}
                            </button>
                        )}
                    </div>

                    <div className="pb-5 mb-5 border-b border-gray-100">
                        <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={enStockActif}
                                onChange={basculerEnStock}
                                className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            {t('enStockUniquement')}
                        </label>
                    </div>

                    <div className="pb-5 mb-5 border-b border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('categories')}</h3>
                        <ul className="space-y-1">
                            <li>
                                <button
                                    onClick={() => selectionnerCategorie(null)}
                                    className={`text-sm w-full text-start px-3 py-2.5 rounded-md transition-colors ${!categorieId ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {t('toutes')}
                                </button>
                            </li>
                            {categories.map((c) => (
                                <li key={c.id}>
                                    <button
                                        onClick={() => selectionnerCategorie(c.id)}
                                        className={`text-sm w-full text-start px-3 py-2.5 rounded-md transition-colors ${String(categorieId) === String(c.id) ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        {c.nom}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('marques')}</h3>
                        <ul className="space-y-1">
                            <li>
                                <button
                                    onClick={() => selectionnerMarque(null)}
                                    className={`text-sm w-full text-start px-3 py-2.5 rounded-md transition-colors ${!marqueId ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {t('toutes')}
                                </button>
                            </li>
                            {marques.map((m) => (
                                <li key={m.id}>
                                    <button
                                        onClick={() => selectionnerMarque(m.id)}
                                        className={`text-sm w-full text-start px-3 py-2.5 rounded-md transition-colors ${String(marqueId) === String(m.id) ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        {m.nom}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </aside>

            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-8 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {recherche ? t('resultatsPour', { q: recherche }) : t('catalogue')}
                    </h1>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 whitespace-nowrap">{t('produitsCompte', { n: produits.length })}</span>
                        <select
                            value={tri}
                            onChange={(e) => changerTri(e.target.value)}
                            className="text-sm bg-white border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="nom_asc">{t('triNomAsc')}</option>
                            <option value="prix_asc">{t('triPrixAsc')}</option>
                            <option value="prix_desc">{t('triPrixDesc')}</option>
                        </select>
                    </div>
                </div>

                {chargement && <div className="text-center py-16 text-gray-500">{t('chargement')}</div>}
                {erreur && <div className="text-center py-16 text-red-600">{erreur}</div>}

                {!chargement && !erreur && produits.length === 0 && (
                    <div className="text-center py-16 text-gray-500">{t('aucunProduit')}</div>
                )}

                {!chargement && !erreur && produits.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        {produits.map((produit) => (
                            <ProduitCard key={produit.id} produit={produit} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CataloguePage;
