import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import produitApi from '../../api/produits';
import categorieApi from '../../api/categories';
import marqueApi from '../../api/marques';
import ImageUploadField from '../../components/admin/ImageUploadField';
import MultiImageUploadField from '../../components/admin/MultiImageUploadField';
import AjusterStockModal from '../../components/admin/AjusterStockModal';
import { IconImageOff, IconX } from '../../components/admin/icons';
import ActionButtons from '../../components/admin/ActionButtons';
import { useAuth } from '../../context/AuthContext';

const FORM_VIDE = {
    nom: '',
    description: '',
    sku: '',
    prix: '',
    prixPromotionnel: '',
    stock: '',
    categorieId: '',
    marqueId: '',
    imageUrl: '',
    imagesSupplementaires: [],
};

// Une carte produit : image cadrée en haut, infos essentielles en dessous.
// Toute la carte est cliquable (ouvre l'édition) ; "Supprimer" reste une action
// isolée (icône discrète, visible au survol) pour ne jamais déclencher les deux à la fois.
function CarteProduit({ produit, onModifier, onSupprimer, onAjusterStock }) {
    const estEditable = Boolean(onModifier);
    return (
        <div
            onClick={estEditable ? () => onModifier(produit) : undefined}
            onKeyDown={estEditable ? (e) => { if (e.key === 'Enter') onModifier(produit); } : undefined}
            role={estEditable ? 'button' : undefined}
            tabIndex={estEditable ? 0 : undefined}
            title={estEditable ? 'Cliquer pour modifier ce produit' : undefined}
            className={`group relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-200 ${estEditable ? 'cursor-pointer' : ''}`}
        >
            <div className="relative aspect-square bg-gray-50">
                {produit.imageUrl ? (
                    <img src={produit.imageUrl} alt={produit.nom} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <IconImageOff className="w-8 h-8" />
                    </div>
                )}

                {produit.enPromotion && (
                    <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full bg-orange-600 text-white shadow-sm">
                        Promo
                    </span>
                )}

                {/* onXxx transmis seulement si fourni par le parent : pour un EMPLOYE (consultation
                    seule), ProduitsPage passe onModifier/onSupprimer/onAjusterStock à undefined, et
                    ces wrappers doivent rester undefined aussi -- sinon ActionButtons recevrait quand
                    même une fonction "truthy" et afficherait des boutons qui planteraient au clic. */}
                <ActionButtons
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150"
                    onAjusterStock={onAjusterStock ? () => onAjusterStock(produit) : undefined}
                    onModifier={onModifier ? () => onModifier(produit) : undefined}
                    onSupprimer={onSupprimer ? () => onSupprimer(produit) : undefined}
                />
            </div>

            <div className="p-3">
                <p className="font-medium text-gray-900 text-sm truncate">{produit.nom}</p>
                <p className="text-xs text-gray-400 font-mono truncate">{produit.sku}</p>
                <p className="text-xs text-gray-500 truncate mt-1">{produit.categorieNom} · {produit.marqueNom}</p>

                <div className="flex items-center justify-between mt-2 gap-2">
                    {produit.enPromotion ? (
                        <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className="font-semibold text-orange-600 text-sm">{produit.prixEffectif} DH</span>
                            <span className="text-gray-400 line-through text-xs">{produit.prix} DH</span>
                        </div>
                    ) : (
                        <span className="font-semibold text-gray-900 text-sm">{produit.prix} DH</span>
                    )}
                    <span className={`text-xs font-medium shrink-0 ${produit.stock <= 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {produit.stock <= 0 ? 'Rupture' : `${produit.stock} en stock`}
                    </span>
                </div>
            </div>
        </div>
    );
}

function ProduitsPage() {
    const { estAdmin } = useAuth();
    const [pageData, setPageData] = useState(null);
    const [page, setPage] = useState(0);
    const [rechercheInput, setRechercheInput] = useState('');
    const [rechercheAppliquee, setRechercheAppliquee] = useState('');
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    const [categories, setCategories] = useState([]);
    const [marques, setMarques] = useState([]);

    const [formOuvert, setFormOuvert] = useState(false);
    const [produitEnEdition, setProduitEnEdition] = useState(null); // null = création
    const [form, setForm] = useState(FORM_VIDE);
    const [erreurFormulaire, setErreurFormulaire] = useState(null);
    const [envoiEnCours, setEnvoiEnCours] = useState(false);

    const [produitEnAjustement, setProduitEnAjustement] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();

    // Catégories et marques ne se chargent qu'une fois, pour peupler les selects du formulaire
    useEffect(() => {
        async function chargerListesFiltres() {
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
        chargerListesFiltres();
    }, []);

    // Ouvre directement la fiche d'un produit si on arrive avec ?edit=<id>
    // (utilisé par le lien "Produits à réapprovisionner" de la page Statistiques).
    useEffect(() => {
        const idAEditer = searchParams.get('edit');
        if (!idAEditer || !estAdmin) return;
        async function ouvrirDepuisLien() {
            try {
                const produit = await produitApi.getById(idAEditer);
                ouvrirEdition(produit);
            } catch (err) {
                console.error(err);
            } finally {
                // On retire le paramètre pour ne pas rouvrir le formulaire à un refresh
                setSearchParams((params) => {
                    const suivants = new URLSearchParams(params);
                    suivants.delete('edit');
                    return suivants;
                }, { replace: true });
            }
        }
        ouvrirDepuisLien();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Ouvre directement le formulaire de création si on arrive avec ?action=new
    // (utilisé par le raccourci "Nouveau produit" de la page Statistiques).
    useEffect(() => {
        if (searchParams.get('action') !== 'new' || !estAdmin) return;
        ouvrirCreation();
        setSearchParams((params) => {
            const suivants = new URLSearchParams(params);
            suivants.delete('action');
            return suivants;
        }, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function chargerProduits() {
        setChargement(true);
        setErreur(null);
        try {
            const params = { page, size: 10 };
            if (rechercheAppliquee) params.recherche = rechercheAppliquee;
            const data = await produitApi.getAllPagine(params);
            setPageData(data);
        } catch (err) {
            setErreur('Impossible de charger les produits.');
            console.error(err);
        } finally {
            setChargement(false);
        }
    }

    useEffect(() => {
        chargerProduits();
    }, [page, rechercheAppliquee]);

    function soumettreRecherche(e) {
        e.preventDefault();
        setPage(0);
        setRechercheAppliquee(rechercheInput.trim());
    }

    function ouvrirCreation() {
        setProduitEnEdition(null);
        setForm(FORM_VIDE);
        setErreurFormulaire(null);
        setFormOuvert(true);
    }

    function ouvrirEdition(produit) {
        setProduitEnEdition(produit);
        setForm({
            nom: produit.nom,
            description: produit.description || '',
            sku: produit.sku,
            prix: produit.prix,
            prixPromotionnel: produit.prixPromotionnel ?? '',
            stock: produit.stock,
            categorieId: produit.categorieId,
            marqueId: produit.marqueId,
            imageUrl: produit.imageUrl || '',
            imagesSupplementaires: produit.imagesSupplementaires || [],
        });
        setErreurFormulaire(null);
        setFormOuvert(true);
    }

    function fermerFormulaire() {
        setFormOuvert(false);
        setProduitEnEdition(null);
    }

    async function soumettre(e) {
        e.preventDefault();
        setErreurFormulaire(null);
        setEnvoiEnCours(true);
        try {
            const payload = {
                nom: form.nom,
                description: form.description || null,
                sku: form.sku,
                prix: parseFloat(form.prix),
                prixPromotionnel: form.prixPromotionnel !== '' ? parseFloat(form.prixPromotionnel) : null,
                stock: parseInt(form.stock, 10),
                categorieId: parseInt(form.categorieId, 10),
                marqueId: parseInt(form.marqueId, 10),
                imageUrl: form.imageUrl || null,
                imagesSupplementaires: form.imagesSupplementaires,
            };

            if (produitEnEdition) {
                await produitApi.update(produitEnEdition.id, payload);
            } else {
                await produitApi.create(payload);
            }
            fermerFormulaire();
            chargerProduits(); // on recharge la page courante pour voir le résultat à jour
        } catch (err) {
            setErreurFormulaire(err.response?.data?.message || "Une erreur est survenue.");
            console.error(err);
        } finally {
            setEnvoiEnCours(false);
        }
    }

    async function supprimer(produit) {
        if (!window.confirm(`Supprimer le produit "${produit.nom}" ? Cette action est irréversible.`)) {
            return;
        }
        try {
            await produitApi.delete(produit.id);
            chargerProduits();
        } catch (err) {
            alert(err.response?.data?.message || "Impossible de supprimer ce produit.");
            console.error(err);
        }
    }

    const produits = pageData?.content ?? [];
    const totalPages = pageData?.totalPages ?? 0;
    const totalElements = pageData?.totalElements ?? 0;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
                {estAdmin ? (
                    <button
                        onClick={ouvrirCreation}
                        className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded hover:bg-gray-800"
                    >
                        + Nouveau produit
                    </button>
                ) : (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                        Consultation seule
                    </span>
                )}
            </div>

            <form onSubmit={soumettreRecherche} className="mb-4 flex gap-2">
                <input
                    type="text"
                    value={rechercheInput}
                    onChange={(e) => setRechercheInput(e.target.value)}
                    placeholder="Rechercher un produit par nom..."
                    className="border rounded px-3 py-2 text-sm w-72"
                />
                <button type="submit" className="text-sm font-medium px-4 py-2 rounded border hover:bg-gray-50">
                    Rechercher
                </button>
                {rechercheAppliquee && (
                    <button
                        type="button"
                        onClick={() => { setRechercheInput(''); setRechercheAppliquee(''); setPage(0); }}
                        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 hover:text-gray-800 transition-colors duration-150"
                    >
                        <IconX className="w-3.5 h-3.5" />
                        Réinitialiser
                    </button>
                )}
            </form>

            {formOuvert && (
                <form onSubmit={soumettre} className="bg-white border rounded-lg p-5 mb-6 space-y-4 max-w-xl">
                    <h2 className="font-semibold text-gray-900">
                        {produitEnEdition ? 'Modifier le produit' : 'Nouveau produit'}
                    </h2>

                    {erreurFormulaire && <p className="text-red-600 text-sm">{erreurFormulaire}</p>}

                    <div>
                        <label className="block text-sm font-medium mb-1">Nom</label>
                        <input
                            type="text"
                            value={form.nom}
                            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                            required
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description (optionnel)</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            rows={3}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">SKU</label>
                            <input
                                type="text"
                                value={form.sku}
                                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                                required
                                className="w-full border rounded px-3 py-2 font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Stock</label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={form.stock}
                                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                                required
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Prix (DH)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.prix}
                                onChange={(e) => setForm((f) => ({ ...f, prix: e.target.value }))}
                                required
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Prix promotionnel (optionnel)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.prixPromotionnel}
                                onChange={(e) => setForm((f) => ({ ...f, prixPromotionnel: e.target.value }))}
                                className="w-full border rounded px-3 py-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">Doit être inférieur au prix normal.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Catégorie</label>
                            <select
                                value={form.categorieId}
                                onChange={(e) => setForm((f) => ({ ...f, categorieId: e.target.value }))}
                                required
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="" disabled>Choisir...</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nom}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Marque</label>
                            <select
                                value={form.marqueId}
                                onChange={(e) => setForm((f) => ({ ...f, marqueId: e.target.value }))}
                                required
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="" disabled>Choisir...</option>
                                {marques.map((m) => (
                                    <option key={m.id} value={m.id}>{m.nom}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <ImageUploadField
                        label="Image du produit (optionnel)"
                        value={form.imageUrl}
                        onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                    />

                    <MultiImageUploadField
                        label="Photos supplémentaires (optionnel)"
                        value={form.imagesSupplementaires}
                        onChange={(urls) => setForm((f) => ({ ...f, imagesSupplementaires: urls }))}
                    />

                    <div className="flex gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={envoiEnCours}
                            className="bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                            {envoiEnCours ? 'Enregistrement...' : 'Enregistrer'}
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

            {chargement && <div className="text-center py-16 text-gray-500">Chargement...</div>}
            {erreur && <div className="text-center py-16 text-red-600">{erreur}</div>}

            {!chargement && !erreur && produits.length === 0 && (
                <div className="text-center py-16 text-gray-500">Aucun produit trouvé.</div>
            )}

            {!chargement && !erreur && produits.length > 0 && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {produits.map((produit) => (
                            <CarteProduit
                                key={produit.id}
                                produit={produit}
                                onModifier={estAdmin ? ouvrirEdition : undefined}
                                onSupprimer={estAdmin ? supprimer : undefined}
                                onAjusterStock={estAdmin ? setProduitEnAjustement : undefined}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                        <span>{totalElements} produit(s) · Page {page + 1} / {totalPages}</span>
                        <div className="space-x-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1.5 border rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Précédent
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-3 py-1.5 border rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                </>
            )}

            {produitEnAjustement && (
                <AjusterStockModal
                    produit={produitEnAjustement}
                    onFermer={() => setProduitEnAjustement(null)}
                    onSucces={chargerProduits}
                />
            )}
        </div>
    );
}

export default ProduitsPage;
