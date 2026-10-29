import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import produitApi from '../api/produits';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import ProduitCard from '../components/ProduitCard';
import ImagePlaceholder from '../components/ImagePlaceholder';

function IconChevronRight({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
        </svg>
    );
}

function ProduitDetailPage() {
    const { id } = useParams();
    const { ajouterAuPanier } = useCart();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [produit, setProduit] = useState(null);
    const [similaires, setSimilaires] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);
    const [quantite, setQuantite] = useState(1);
    const [ajoute, setAjoute] = useState(false);
    const [indexImageActive, setIndexImageActive] = useState(0);

    useEffect(() => {
        let annule = false;

        async function charger() {
            setChargement(true);
            setErreur(null);
            setAjoute(false);
            setQuantite(1);
            setIndexImageActive(0);
            try {
                const data = await produitApi.getById(id);
                if (annule) return;
                setProduit(data);

                // Produits similaires : même catégorie, sans le produit courant, 4 max.
                // Le catalogue public n'a pas d'endpoint dédié "produits liés" — on réutilise
                // le filtre par catégorie déjà utilisé par la page Catalogue.
                try {
                    const memeCategorie = await produitApi.getAll({ categorieId: data.categorieId });
                    if (!annule) {
                        setSimilaires(memeCategorie.filter((p) => p.id !== data.id).slice(0, 4));
                    }
                } catch (err) {
                    console.error(err);
                }
            } catch (err) {
                if (!annule) setErreur(t('produitIntrouvable'));
                console.error(err);
            } finally {
                if (!annule) setChargement(false);
            }
        }
        charger();

        return () => { annule = true; };
    }, [id, t]);

    if (chargement) {
        return <div className="text-center py-20 text-gray-500">{t('chargement')}</div>;
    }

    if (erreur || !produit) {
        return (
            <div className="max-w-xl mx-auto px-4 py-20 text-center">
                <p className="text-gray-500 text-lg">{erreur}</p>
                <Link to="/catalogue" className="inline-block mt-4 text-orange-600 font-medium hover:underline">
                    {t('retourCatalogue')}
                </Link>
            </div>
        );
    }

    const enPromo = produit.enPromotion;
    const pourcentageReduction = enPromo
        ? Math.round((1 - produit.prixEffectif / produit.prix) * 100)
        : 0;
    const enStock = produit.stock > 0;
    const quantiteMax = Math.max(produit.stock, 1);

    // Couverture (imageUrl) en premier, puis les photos supplementaires -- Boolean filtre
    // un imageUrl vide/null sans casser l'ordre des suivantes.
    const toutesLesPhotos = [produit.imageUrl, ...(produit.imagesSupplementaires || [])].filter(Boolean);
    const photoAffichee = toutesLesPhotos[indexImageActive] || toutesLesPhotos[0];

    function changerQuantite(delta) {
        setQuantite((q) => Math.min(quantiteMax, Math.max(1, q + delta)));
    }

    function ajouter() {
        ajouterAuPanier(produit, quantite);
        setAjoute(true);
        setTimeout(() => setAjoute(false), 2000);
    }

    // Achat rapide : ajoute le produit au panier (même quantité que celle choisie)
    // puis part directement au tunnel de commande, sans passer par la page Panier.
    function commanderMaintenant() {
        ajouterAuPanier(produit, quantite);
        navigate('/commande');
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 flex-wrap">
                <Link to="/" className="hover:text-orange-600 transition-colors">{t('accueil')}</Link>
                <IconChevronRight className="w-3.5 h-3.5 text-gray-300 rtl:rotate-180" />
                <Link to="/catalogue" className="hover:text-orange-600 transition-colors">{t('tousLesProduits')}</Link>
                {produit.categorieNom && (
                    <>
                        <IconChevronRight className="w-3.5 h-3.5 text-gray-300 rtl:rotate-180" />
                        <Link
                            to={`/catalogue?categorieId=${produit.categorieId}`}
                            className="hover:text-orange-600 transition-colors"
                        >
                            {produit.categorieNom}
                        </Link>
                    </>
                )}
                <IconChevronRight className="w-3.5 h-3.5 text-gray-300 rtl:rotate-180" />
                <span className="text-gray-900 font-medium truncate max-w-[16rem]">{produit.nom}</span>
            </nav>

            <div className="grid md:grid-cols-2 gap-10">
                <div>
                    <div className="aspect-square bg-gray-50 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
                        {enPromo && (
                            <span className="absolute top-3 start-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                                -{pourcentageReduction}%
                            </span>
                        )}
                        {photoAffichee ? (
                            <img src={photoAffichee} alt={produit.nom} className="w-full h-full object-cover" />
                        ) : (
                            <ImagePlaceholder label={t('pasDImage')} />
                        )}
                    </div>

                    {/* Vignettes cliquables : affichees seulement s'il y a plus d'une photo. */}
                    {toutesLesPhotos.length > 1 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                            {toutesLesPhotos.map((url, index) => (
                                <button
                                    key={url + index}
                                    type="button"
                                    onClick={() => setIndexImageActive(index)}
                                    className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                                        index === indexImageActive
                                            ? 'border-orange-600'
                                            : 'border-transparent hover:border-gray-300'
                                    }`}
                                >
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    {produit.marqueNom && (
                        <Link
                            to={`/catalogue?marqueId=${produit.marqueId}`}
                            className="text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-orange-600 transition-colors"
                        >
                            {produit.marqueNom}
                        </Link>
                    )}
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{produit.nom}</h1>
                    <p className="text-xs text-gray-400 font-mono mt-1">{t('sku')} : {produit.sku}</p>

                    {enPromo ? (
                        <div className="mt-4 flex items-baseline gap-3">
                            <p className="text-3xl font-bold text-orange-600">{produit.prixEffectif} DH</p>
                            <p className="text-lg text-gray-400 line-through">{produit.prix} DH</p>
                        </div>
                    ) : (
                        <p className="text-3xl font-bold text-orange-600 mt-4">{produit.prix} DH</p>
                    )}

                    <div className="mt-3">
                        {enStock ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {t('enStock')}
                                {produit.stock <= 5 && t('plusQue', { n: produit.stock })}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {t('ruptureStock')}
                            </span>
                        )}
                    </div>

                    <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center border border-gray-300 rounded-md">
                                <button
                                    onClick={() => changerQuantite(-1)}
                                    disabled={!enStock || quantite <= 1}
                                    className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    −
                                </button>
                                <span className="w-10 text-center font-medium">{quantite}</span>
                                <button
                                    onClick={() => changerQuantite(1)}
                                    disabled={!enStock || quantite >= quantiteMax}
                                    className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                onClick={ajouter}
                                disabled={!enStock}
                                className="flex-1 border-2 border-gray-900 text-gray-900 font-semibold py-3 rounded-md hover:bg-gray-50 disabled:border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {!enStock ? t('ruptureStock') : ajoute ? t('ajoute') : t('ajouterAuPanier')}
                            </button>
                        </div>

                        {/* CTA principal : achat direct, saute la page Panier et va droit au formulaire de commande. */}
                        <button
                            onClick={commanderMaintenant}
                            disabled={!enStock}
                            className="w-full bg-orange-600 text-white font-semibold py-3.5 rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {t('commanderMaintenant')}
                        </button>
                    </div>

                    {produit.description && (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h2 className="font-semibold text-gray-900 mb-2">{t('description')}</h2>
                            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{produit.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {similaires.length > 0 && (
                <div className="mt-16">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">{t('produitsSimilaires')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {similaires.map((p) => (
                            <ProduitCard key={p.id} produit={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProduitDetailPage;
