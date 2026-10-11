import { useEffect, useState } from 'react';
import produitApi from '../../api/produits';
import stockApi from '../../api/stock';
import statsApi from '../../api/stats';
import AjusterStockModal from '../../components/admin/AjusterStockModal';
import {
    IconArrowDownCircle,
    IconArrowUpCircle,
    IconArrowUpDown,
    IconImageOff,
    IconX,
} from '../../components/admin/icons';

const MOTIF_LABELS = {
    REAPPROVISIONNEMENT: 'Réapprovisionnement fournisseur',
    CORRECTION_INVENTAIRE: "Correction d'inventaire",
    RETOUR_CLIENT: 'Retour client',
    PRODUIT_ENDOMMAGE: 'Produit endommagé / perdu',
    AUTRE: 'Autre',
};

function formaterDate(dateStr) {
    return new Date(dateStr).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Badge à 3 niveaux : rouge (rupture), orange (sous le seuil d'alerte), vert (sain) —
// le seuil vient du même réglage que les pages Statistiques / Produits, pour rester cohérent.
function BadgeStock({ stock, seuil }) {
    if (stock === 0) {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Rupture
            </span>
        );
    }
    if (stock <= seuil) {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                {stock} en stock
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {stock} en stock
        </span>
    );
}

function BadgeTypeMouvement({ type }) {
    if (type === 'ENTREE') {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                <IconArrowUpCircle className="w-3.5 h-3.5" />
                Entrée
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">
            <IconArrowDownCircle className="w-3.5 h-3.5" />
            Sortie
        </span>
    );
}

function Onglet({ actif, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-1 pb-3 text-sm font-medium border-b-2 transition-colors duration-150 ${
                actif ? 'border-orange-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
            {children}
        </button>
    );
}

function Pagination({ totalElements, page, totalPages, onPrecedent, onSuivant, libelleUnite }) {
    return (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>{totalElements} {libelleUnite} · Page {page + 1} / {Math.max(totalPages, 1)}</span>
            <div className="space-x-2">
                <button
                    onClick={onPrecedent}
                    disabled={page === 0}
                    className="px-3 py-1.5 border rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    Précédent
                </button>
                <button
                    onClick={onSuivant}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 border rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    Suivant
                </button>
            </div>
        </div>
    );
}

function StockPage() {
    const [onglet, setOnglet] = useState('etat'); // 'etat' | 'historique'
    const [seuilAlerte, setSeuilAlerte] = useState(5);

    // --- Onglet "État des stocks" ---
    const [pageData, setPageData] = useState(null);
    const [page, setPage] = useState(0);
    const [rechercheInput, setRechercheInput] = useState('');
    const [rechercheAppliquee, setRechercheAppliquee] = useState('');
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);
    const [produitEnAjustement, setProduitEnAjustement] = useState(null);

    // --- Onglet "Historique des mouvements" ---
    const [historiqueData, setHistoriqueData] = useState(null);
    const [pageHistorique, setPageHistorique] = useState(0);
    const [chargementHistorique, setChargementHistorique] = useState(true);
    const [erreurHistorique, setErreurHistorique] = useState(null);

    // Seuil d'alerte configuré côté backend, uniquement pour colorer le badge de stock
    // de la même façon que sur les pages Statistiques et Produits.
    useEffect(() => {
        statsApi.getDashboard().then((data) => setSeuilAlerte(data.seuilAlerteStock)).catch(() => {});
    }, []);

    async function chargerProduits() {
        setChargement(true);
        setErreur(null);
        try {
            const params = { page, size: 10, sort: 'stock,asc' };
            if (rechercheAppliquee) params.recherche = rechercheAppliquee;
            const data = await produitApi.getAllPagine(params);
            setPageData(data);
        } catch (err) {
            setErreur('Impossible de charger les stocks.');
            console.error(err);
        } finally {
            setChargement(false);
        }
    }

    useEffect(() => {
        chargerProduits();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rechercheAppliquee]);

    async function chargerHistorique() {
        setChargementHistorique(true);
        setErreurHistorique(null);
        try {
            const data = await stockApi.getMouvements({ page: pageHistorique, size: 10 });
            setHistoriqueData(data);
        } catch (err) {
            setErreurHistorique("Impossible de charger l'historique des mouvements.");
            console.error(err);
        } finally {
            setChargementHistorique(false);
        }
    }

    useEffect(() => {
        chargerHistorique();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageHistorique]);

    function soumettreRecherche(e) {
        e.preventDefault();
        setPage(0);
        setRechercheAppliquee(rechercheInput.trim());
    }

    // Après un mouvement réussi : on rafraîchit les deux onglets pour que le nouveau
    // stock et la nouvelle ligne d'historique soient visibles immédiatement, quel que
    // soit l'endroit d'où la modale a été ouverte.
    function apresAjustement() {
        chargerProduits();
        chargerHistorique();
    }

    const produits = pageData?.content ?? [];
    const totalPagesProduits = pageData?.totalPages ?? 0;
    const totalProduits = pageData?.totalElements ?? 0;

    const mouvements = historiqueData?.content ?? [];
    const totalPagesHistorique = historiqueData?.totalPages ?? 0;
    const totalMouvements = historiqueData?.totalElements ?? 0;

    return (
        <div>
            <div className="mb-1">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des stocks</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Vue d'ensemble des stocks, ajustements rapides et historique des mouvements.
                </p>
            </div>

            <div className="flex gap-6 border-b border-gray-200 mb-6 mt-4">
                <Onglet actif={onglet === 'etat'} onClick={() => setOnglet('etat')}>
                    État des stocks
                </Onglet>
                <Onglet actif={onglet === 'historique'} onClick={() => setOnglet('historique')}>
                    Historique des mouvements
                </Onglet>
            </div>

            {onglet === 'etat' && (
                <div>
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

                    {chargement && <div className="text-center py-16 text-gray-500">Chargement...</div>}
                    {erreur && <div className="text-center py-16 text-red-600">{erreur}</div>}

                    {!chargement && !erreur && produits.length === 0 && (
                        <div className="text-center py-16 text-gray-500">Aucun produit trouvé.</div>
                    )}

                    {!chargement && !erreur && produits.length > 0 && (
                        <>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs text-gray-400 uppercase tracking-wide">
                                            <th className="px-5 py-2.5 text-left font-medium">Produit</th>
                                            <th className="px-5 py-2.5 text-left font-medium">Catégorie</th>
                                            <th className="px-5 py-2.5 text-left font-medium">Stock</th>
                                            <th className="px-5 py-2.5 w-32"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {produits.map((produit) => (
                                            <tr key={produit.id} className="transition-colors duration-150 hover:bg-gray-50">
                                                <td className="px-5 py-2.5">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                                            {produit.imageUrl ? (
                                                                <img src={produit.imageUrl} alt={produit.nom} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <IconImageOff className="w-4 h-4 text-gray-300" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-gray-900 font-medium truncate max-w-xs">{produit.nom}</p>
                                                            <p className="text-xs text-gray-400 font-mono truncate">{produit.sku}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-2.5 text-gray-500">{produit.categorieNom}</td>
                                                <td className="px-5 py-2.5">
                                                    <BadgeStock stock={produit.stock} seuil={seuilAlerte} />
                                                </td>
                                                <td className="px-5 py-2.5 text-right">
                                                    <button
                                                        onClick={() => setProduitEnAjustement(produit)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 transition-colors duration-150 hover:bg-blue-100 hover:text-blue-700"
                                                    >
                                                        <IconArrowUpDown className="w-3.5 h-3.5" />
                                                        Ajuster
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                totalElements={totalProduits}
                                page={page}
                                totalPages={totalPagesProduits}
                                onPrecedent={() => setPage((p) => Math.max(0, p - 1))}
                                onSuivant={() => setPage((p) => Math.min(totalPagesProduits - 1, p + 1))}
                                libelleUnite="produit(s)"
                            />
                        </>
                    )}
                </div>
            )}

            {onglet === 'historique' && (
                <div>
                    {chargementHistorique && <div className="text-center py-16 text-gray-500">Chargement...</div>}
                    {erreurHistorique && <div className="text-center py-16 text-red-600">{erreurHistorique}</div>}

                    {!chargementHistorique && !erreurHistorique && mouvements.length === 0 && (
                        <div className="text-center py-16 text-gray-500">Aucun mouvement enregistré pour le moment.</div>
                    )}

                    {!chargementHistorique && !erreurHistorique && mouvements.length > 0 && (
                        <>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs text-gray-400 uppercase tracking-wide">
                                            <th className="px-5 py-2.5 text-left font-medium">Date</th>
                                            <th className="px-5 py-2.5 text-left font-medium">Produit</th>
                                            <th className="px-5 py-2.5 text-left font-medium">Type</th>
                                            <th className="px-5 py-2.5 text-right font-medium">Quantité</th>
                                            <th className="px-5 py-2.5 text-left font-medium">Stock</th>
                                            <th className="px-5 py-2.5 text-left font-medium">Motif</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {mouvements.map((mouvement) => (
                                            <tr key={mouvement.id} className="transition-colors duration-150 hover:bg-gray-50">
                                                <td className="px-5 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                                                    {formaterDate(mouvement.dateCreation)}
                                                </td>
                                                <td className="px-5 py-2.5">
                                                    <p className="text-gray-900 truncate max-w-[12rem]">{mouvement.produitNom}</p>
                                                    <p className="text-xs text-gray-400 font-mono truncate">{mouvement.produitSku}</p>
                                                </td>
                                                <td className="px-5 py-2.5">
                                                    <BadgeTypeMouvement type={mouvement.type} />
                                                </td>
                                                <td className={`px-5 py-2.5 text-right font-semibold ${
                                                    mouvement.type === 'ENTREE' ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                    {mouvement.type === 'ENTREE' ? '+' : '-'}{mouvement.quantite}
                                                </td>
                                                <td className="px-5 py-2.5 text-gray-500 whitespace-nowrap">
                                                    {mouvement.stockAvant} → <span className="text-gray-900 font-medium">{mouvement.stockApres}</span>
                                                </td>
                                                <td className="px-5 py-2.5 text-gray-500">
                                                    <p>{MOTIF_LABELS[mouvement.motif] ?? mouvement.motif}</p>
                                                    {mouvement.commentaire && (
                                                        <p className="text-xs text-gray-400 truncate max-w-[16rem]" title={mouvement.commentaire}>
                                                            {mouvement.commentaire}
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                totalElements={totalMouvements}
                                page={pageHistorique}
                                totalPages={totalPagesHistorique}
                                onPrecedent={() => setPageHistorique((p) => Math.max(0, p - 1))}
                                onSuivant={() => setPageHistorique((p) => Math.min(totalPagesHistorique - 1, p + 1))}
                                libelleUnite="mouvement(s)"
                            />
                        </>
                    )}
                </div>
            )}

            {produitEnAjustement && (
                <AjusterStockModal
                    produit={produitEnAjustement}
                    onFermer={() => setProduitEnAjustement(null)}
                    onSucces={apresAjustement}
                />
            )}
        </div>
    );
}

export default StockPage;
