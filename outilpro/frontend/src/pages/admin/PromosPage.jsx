import { useEffect, useMemo, useRef, useState } from 'react';
import produitApi from '../../api/produits';
import { IconImageOff, IconPencil, IconX, IconTag, IconChevronDown } from '../../components/admin/icons';

// Construit le payload complet attendu par PUT /api/produits/{id} à partir d'un produit
// déjà chargé (l'API ne supporte pas le PATCH partiel) en ne changeant que prixPromotionnel.
function payloadAvecPromo(produit, prixPromotionnel) {
    return {
        nom: produit.nom,
        description: produit.description || null,
        sku: produit.sku,
        prix: produit.prix,
        prixPromotionnel,
        stock: produit.stock,
        categorieId: produit.categorieId,
        marqueId: produit.marqueId,
        imageUrl: produit.imageUrl || null,
    };
}

// Carte produit en promo : image, prix barré + prix promo, pourcentage, actions rapides.
function CarteProduitPromo({ produit, onModifier, onRetirer }) {
    const pourcentage = Math.round((1 - produit.prixEffectif / produit.prix) * 100);

    return (
        <div className="group relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="relative aspect-square bg-gray-50">
                {produit.imageUrl ? (
                    <img src={produit.imageUrl} alt={produit.nom} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <IconImageOff className="w-8 h-8" />
                    </div>
                )}
                <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full bg-orange-600 text-white shadow-sm">
                    -{pourcentage}%
                </span>
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150"
                >
                    <button
                        onClick={() => onModifier(produit)}
                        title="Modifier la promotion"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 shadow-sm transition-colors duration-150 hover:bg-gray-200 hover:text-gray-900"
                    >
                        <IconPencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onRetirer(produit)}
                        title="Retirer la promotion"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 shadow-sm transition-colors duration-150 hover:bg-red-100 hover:text-red-600"
                    >
                        <IconX className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="p-3">
                <p className="font-medium text-gray-900 text-sm truncate">{produit.nom}</p>
                <p className="text-xs text-gray-400 font-mono truncate">{produit.sku}</p>
                <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="font-semibold text-orange-600 text-sm">{produit.prixEffectif} DH</span>
                    <span className="text-gray-400 line-through text-xs">{produit.prix} DH</span>
                </div>
            </div>
        </div>
    );
}

function PromosPage() {
    const [produits, setProduits] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    const [recherche, setRecherche] = useState('');
    const [produitSelectionne, setProduitSelectionne] = useState(null);
    const [dropdownOuvert, setDropdownOuvert] = useState(false);
    const selecteurRef = useRef(null);
    const [mode, setMode] = useState('pourcentage'); // 'pourcentage' | 'prix'
    const [pourcentage, setPourcentage] = useState('');
    const [prixPromo, setPrixPromo] = useState('');
    const [erreurFormulaire, setErreurFormulaire] = useState(null);
    const [envoiEnCours, setEnvoiEnCours] = useState(false);

    async function chargerProduits() {
        setChargement(true);
        setErreur(null);
        try {
            // Le catalogue public renvoie déjà enPromotion/prixEffectif calculés côté backend ;
            // pas besoin d'un endpoint admin dédié pour ce module.
            const data = await produitApi.getAll();
            setProduits(data);
        } catch (err) {
            setErreur('Impossible de charger les produits.');
            console.error(err);
        } finally {
            setChargement(false);
        }
    }

    useEffect(() => {
        chargerProduits();
    }, []);

    // Ferme le menu déroulant si on clique en dehors du sélecteur de produit.
    useEffect(() => {
        function gererClicExterieur(e) {
            if (selecteurRef.current && !selecteurRef.current.contains(e.target)) {
                setDropdownOuvert(false);
            }
        }
        document.addEventListener('mousedown', gererClicExterieur);
        return () => document.removeEventListener('mousedown', gererClicExterieur);
    }, []);

    const produitsEnPromo = useMemo(
        () => produits.filter((p) => p.enPromotion).sort((a, b) => a.nom.localeCompare(b.nom)),
        [produits]
    );

    // Liste affichée dans le menu déroulant : tout le catalogue par défaut (trié par nom),
    // filtré au fur et à mesure que l'admin tape dans le champ de recherche.
    const produitsAffiches = useMemo(() => {
        const tries = [...produits].sort((a, b) => a.nom.localeCompare(b.nom));
        const q = recherche.trim().toLowerCase();
        if (!q) return tries;
        return tries.filter((p) => p.nom.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }, [produits, recherche]);

    function selectionnerProduit(produit) {
        setProduitSelectionne(produit);
        setRecherche('');
        setDropdownOuvert(false);
        setMode('pourcentage');
        setPourcentage('');
        setPrixPromo('');
        setErreurFormulaire(null);
    }

    function modifierPromoExistante(produit) {
        setProduitSelectionne(produit);
        setRecherche('');
        setMode('prix');
        setPourcentage('');
        setPrixPromo(String(produit.prixPromotionnel));
        setErreurFormulaire(null);
    }

    function fermerFormulaire() {
        setProduitSelectionne(null);
        setPourcentage('');
        setPrixPromo('');
        setErreurFormulaire(null);
    }

    // Prix promo effectivement appliqué selon le mode actif (calculé en direct pour l'aperçu)
    const prixPromoCalcule = useMemo(() => {
        if (!produitSelectionne) return null;
        if (mode === 'pourcentage') {
            const pct = parseFloat(pourcentage);
            if (!pct || pct <= 0 || pct >= 100) return null;
            return Math.round(produitSelectionne.prix * (1 - pct / 100) * 100) / 100;
        }
        const prix = parseFloat(prixPromo);
        if (!prix || prix <= 0) return null;
        return prix;
    }, [produitSelectionne, mode, pourcentage, prixPromo]);

    const pourcentageEquivalent =
        produitSelectionne && prixPromoCalcule
            ? Math.round((1 - prixPromoCalcule / produitSelectionne.prix) * 100)
            : null;

    async function appliquerPromo(e) {
        e.preventDefault();
        if (!produitSelectionne || prixPromoCalcule == null) return;
        if (prixPromoCalcule >= produitSelectionne.prix) {
            setErreurFormulaire('Le prix promo doit être inférieur au prix normal du produit.');
            return;
        }
        setErreurFormulaire(null);
        setEnvoiEnCours(true);
        try {
            await produitApi.update(produitSelectionne.id, payloadAvecPromo(produitSelectionne, prixPromoCalcule));
            fermerFormulaire();
            chargerProduits();
        } catch (err) {
            setErreurFormulaire(err.response?.data?.message || 'Une erreur est survenue.');
            console.error(err);
        } finally {
            setEnvoiEnCours(false);
        }
    }

    async function retirerPromo(produit) {
        if (!window.confirm(`Retirer la promotion sur "${produit.nom}" ?`)) return;
        try {
            await produitApi.update(produit.id, payloadAvecPromo(produit, null));
            chargerProduits();
        } catch (err) {
            alert(err.response?.data?.message || 'Impossible de retirer cette promotion.');
            console.error(err);
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
            </div>

            {/* Sélecteur de produit : recherche par nom/SKU, on choisit ensuite le mode de remise */}
            <div className="bg-white border rounded-lg p-5 mb-6 max-w-xl">
                <h2 className="font-semibold text-gray-900 mb-3">Mettre un produit en promotion</h2>

                {!produitSelectionne ? (
                    <div className="relative" ref={selecteurRef}>
                        <div className="relative">
                            <input
                                type="text"
                                value={recherche}
                                onChange={(e) => {
                                    setRecherche(e.target.value);
                                    setDropdownOuvert(true);
                                }}
                                onFocus={() => setDropdownOuvert(true)}
                                placeholder="Cliquez pour voir tous les produits, ou tapez pour rechercher..."
                                className="w-full border rounded px-3 py-2 pr-9 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setDropdownOuvert((v) => !v)}
                                title="Voir tous les produits"
                                className="absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400 hover:text-gray-700"
                            >
                                <IconChevronDown className={`w-4 h-4 transition-transform ${dropdownOuvert ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                        {dropdownOuvert && (
                            <ul className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                                {produitsAffiches.length === 0 ? (
                                    <li className="px-3 py-3 text-sm text-gray-400 text-center">Aucun produit trouvé.</li>
                                ) : (
                                    produitsAffiches.map((p) => (
                                        <li key={p.id}>
                                            <button
                                                type="button"
                                                onClick={() => selectionnerProduit(p)}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-start hover:bg-gray-50"
                                            >
                                                <div className="w-10 h-10 rounded bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center text-gray-300">
                                                    {p.imageUrl ? (
                                                        <img src={p.imageUrl} alt={p.nom} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <IconImageOff className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{p.nom}</p>
                                                    <p className="text-xs text-gray-400 font-mono truncate">
                                                        {p.sku} · {p.prix} DH
                                                        {p.enPromotion && ' · déjà en promo'}
                                                    </p>
                                                </div>
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>
                ) : (
                    <form onSubmit={appliquerPromo} className="space-y-4">
                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                            <div className="w-12 h-12 rounded bg-white shrink-0 overflow-hidden flex items-center justify-center text-gray-300 border border-gray-100">
                                {produitSelectionne.imageUrl ? (
                                    <img src={produitSelectionne.imageUrl} alt={produitSelectionne.nom} className="w-full h-full object-cover" />
                                ) : (
                                    <IconImageOff className="w-5 h-5" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{produitSelectionne.nom}</p>
                                <p className="text-xs text-gray-500">Prix normal : {produitSelectionne.prix} DH</p>
                            </div>
                            <button
                                type="button"
                                onClick={fermerFormulaire}
                                title="Changer de produit"
                                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                            >
                                <IconX className="w-4 h-4" />
                            </button>
                        </div>

                        {erreurFormulaire && <p className="text-red-600 text-sm">{erreurFormulaire}</p>}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setMode('pourcentage')}
                                className={`flex-1 text-sm font-medium py-2 rounded border ${mode === 'pourcentage' ? 'bg-orange-600 text-white border-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                Pourcentage de réduction
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('prix')}
                                className={`flex-1 text-sm font-medium py-2 rounded border ${mode === 'prix' ? 'bg-orange-600 text-white border-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                Prix promo direct
                            </button>
                        </div>

                        {mode === 'pourcentage' ? (
                            <div>
                                <label className="block text-sm font-medium mb-1">Réduction (%)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    step="1"
                                    value={pourcentage}
                                    onChange={(e) => setPourcentage(e.target.value)}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                    placeholder="ex: 20"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium mb-1">Prix promo (DH)</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={prixPromo}
                                    onChange={(e) => setPrixPromo(e.target.value)}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                    placeholder={`ex: ${produitSelectionne.prix}`}
                                />
                            </div>
                        )}

                        {prixPromoCalcule != null && (
                            <div className="flex items-center gap-2 text-sm bg-orange-50 text-orange-700 rounded-lg px-3 py-2">
                                <IconTag className="w-4 h-4 shrink-0" />
                                <span>
                                    Prix promo : <strong>{prixPromoCalcule} DH</strong> au lieu de {produitSelectionne.prix} DH
                                    {pourcentageEquivalent != null && ` (soit -${pourcentageEquivalent}%)`}
                                </span>
                            </div>
                        )}

                        <div className="flex gap-2 pt-1">
                            <button
                                type="submit"
                                disabled={envoiEnCours || prixPromoCalcule == null}
                                className="bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                            >
                                {envoiEnCours ? 'Enregistrement...' : 'Appliquer la promotion'}
                            </button>
                            <button
                                type="button"
                                onClick={fermerFormulaire}
                                className="text-sm font-medium px-4 py-2 rounded hover:bg-gray-100"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Liste des produits actuellement soldés */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">
                    Produits actuellement en promotion {!chargement && `(${produitsEnPromo.length})`}
                </h2>
            </div>

            {chargement && <div className="text-center py-16 text-gray-500">Chargement...</div>}
            {erreur && <div className="text-center py-16 text-red-600">{erreur}</div>}

            {!chargement && !erreur && produitsEnPromo.length === 0 && (
                <div className="text-center py-16 text-gray-500">Aucun produit en promotion pour le moment.</div>
            )}

            {!chargement && !erreur && produitsEnPromo.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {produitsEnPromo.map((produit) => (
                        <CarteProduitPromo
                            key={produit.id}
                            produit={produit}
                            onModifier={modifierPromoExistante}
                            onRetirer={retirerPromo}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default PromosPage;
