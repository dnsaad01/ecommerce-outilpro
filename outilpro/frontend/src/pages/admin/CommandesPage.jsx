import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import commandeApi from '../../api/commandes';
import { IconChevronDown, IconTrash } from '../../components/admin/icons';

const STATUTS = ['EN_ATTENTE', 'VALIDEE', 'LIVREE', 'ANNULEE'];

const STATUT_STYLES = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
    VALIDEE: 'bg-blue-100 text-blue-800',
    LIVREE: 'bg-green-100 text-green-800',
    ANNULEE: 'bg-red-100 text-red-800',
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

function CommandesPage() {
    const [searchParams] = useSearchParams();
    const [pageData, setPageData] = useState(null); // réponse brute Spring Page : { content, totalPages, totalElements, number, ... }
    const [page, setPage] = useState(0);
    // Permet d'arriver déjà filtré via un lien du type /admin/commandes?statut=EN_ATTENTE
    // (utilisé par le raccourci "Commandes en attente" de la page Statistiques).
    const [statutFiltre, setStatutFiltre] = useState(searchParams.get('statut') || '');
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);
    const [ligneOuverte, setLigneOuverte] = useState(null); // id de la commande dont le détail est déplié
    const [enCoursMaj, setEnCoursMaj] = useState(null); // id de la commande en train de changer de statut
    const [enCoursSuppression, setEnCoursSuppression] = useState(null); // id de la commande en train d'etre supprimee

    useEffect(() => {
        async function chargerCommandes() {
            setChargement(true);
            setErreur(null);
            try {
                const params = { page, size: 10 };
                if (statutFiltre) params.statut = statutFiltre;
                const data = await commandeApi.getAll(params);
                setPageData(data);
            } catch (err) {
                setErreur('Impossible de charger les commandes.');
                console.error(err);
            } finally {
                setChargement(false);
            }
        }
        chargerCommandes();
    }, [page, statutFiltre]);

    function changerFiltre(nouveauStatut) {
        setStatutFiltre(nouveauStatut);
        setPage(0); // on revient à la première page quand le filtre change
    }

    async function changerStatut(commande, nouveauStatut) {
        if (nouveauStatut === commande.statut) return;
        setEnCoursMaj(commande.id);
        try {
            const commandeMaj = await commandeApi.changerStatut(commande.id, nouveauStatut);
            // On remplace juste la commande modifiée dans la liste déjà chargée, sans tout recharger
            setPageData((prev) => ({
                ...prev,
                content: prev.content.map((c) => (c.id === commandeMaj.id ? commandeMaj : c)),
            }));
        } catch (err) {
            alert("Impossible de changer le statut de cette commande.");
            console.error(err);
        } finally {
            setEnCoursMaj(null);
        }
    }

    // Suppression definitive : reservee aux commandes de test/erronees. Pour une vraie
    // commande client, preferer "Annulee" (changerStatut) qui garde une trace.
    async function supprimer(commande) {
        if (!window.confirm(`Supprimer definitivement la commande de "${commande.nomClient}" (${commande.total.toFixed(2)} DH) ? Cette action est irreversible.`)) {
            return;
        }
        setEnCoursSuppression(commande.id);
        try {
            await commandeApi.delete(commande.id);
            setPageData((prev) => ({
                ...prev,
                content: prev.content.filter((c) => c.id !== commande.id),
                totalElements: prev.totalElements - 1,
            }));
            if (ligneOuverte === commande.id) setLigneOuverte(null);
        } catch (err) {
            alert("Impossible de supprimer cette commande.");
            console.error(err);
        } finally {
            setEnCoursSuppression(null);
        }
    }

    const commandes = pageData?.content ?? [];
    const totalPages = pageData?.totalPages ?? 0;
    const totalElements = pageData?.totalElements ?? 0;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
                <select
                    value={statutFiltre}
                    onChange={(e) => changerFiltre(e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                >
                    <option value="">Tous les statuts</option>
                    {STATUTS.map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                </select>
            </div>

            {chargement && <div className="text-center py-16 text-gray-500">Chargement...</div>}
            {erreur && <div className="text-center py-16 text-red-600">{erreur}</div>}

            {!chargement && !erreur && commandes.length === 0 && (
                <div className="text-center py-16 text-gray-500">Aucune commande trouvée.</div>
            )}

            {!chargement && !erreur && commandes.length > 0 && (
                <>
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-gray-500 uppercase text-xs tracking-wide">
                                <tr>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">Ville</th>
                                    <th className="px-4 py-3">Total</th>
                                    <th className="px-4 py-3">Statut</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {commandes.map((commande) => (
                                    <Fragment key={commande.id}>
                                        <tr key={commande.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{commande.nomClient}</div>
                                                <div className="text-gray-500 text-xs">{commande.telephoneClient}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{commande.ville}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">
                                                {commande.total.toFixed(2)} DH
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={commande.statut}
                                                    disabled={enCoursMaj === commande.id}
                                                    onChange={(e) => changerStatut(commande, e.target.value)}
                                                    className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${STATUT_STYLES[commande.statut]}`}
                                                >
                                                    {STATUTS.map((s) => (
                                                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {formaterDate(commande.dateCreation)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => supprimer(commande)}
                                                        disabled={enCoursSuppression === commande.id}
                                                        title="Supprimer définitivement cette commande"
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 transition-all duration-150 hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
                                                    >
                                                        <IconTrash className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setLigneOuverte(ligneOuverte === commande.id ? null : commande.id)}
                                                        title={ligneOuverte === commande.id ? 'Masquer les détails' : 'Voir les détails'}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 transition-all duration-150 hover:bg-gray-200 hover:text-gray-900"
                                                    >
                                                        <IconChevronDown
                                                            className={`w-4 h-4 transition-transform duration-200 ${
                                                                ligneOuverte === commande.id ? 'rotate-180' : ''
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {ligneOuverte === commande.id && (
                                            <tr key={`${commande.id}-detail`} className="bg-gray-50">
                                                <td colSpan={6} className="px-4 py-4">
                                                    <div className="text-xs text-gray-500 mb-2">
                                                        {commande.adresseLivraison}
                                                        {commande.codePromoUtilise && (
                                                            <span> · Code promo : <strong>{commande.codePromoUtilise}</strong></span>
                                                        )}
                                                    </div>
                                                    <table className="w-full text-xs">
                                                        <thead className="text-gray-500">
                                                            <tr>
                                                                <th className="text-left py-1">Produit</th>
                                                                <th className="text-left py-1">SKU</th>
                                                                <th className="text-right py-1">Qté</th>
                                                                <th className="text-right py-1">Prix unit.</th>
                                                                <th className="text-right py-1">Sous-total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {commande.lignes.map((ligne) => (
                                                                <tr key={ligne.produitId}>
                                                                    <td className="py-1">{ligne.produitNom}</td>
                                                                    <td className="py-1 text-gray-500">{ligne.produitSku}</td>
                                                                    <td className="py-1 text-right">{ligne.quantite}</td>
                                                                    <td className="py-1 text-right">{ligne.prixUnitaire} DH</td>
                                                                    <td className="py-1 text-right">{ligne.sousTotalLigne.toFixed(2)} DH</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="font-medium">
                                                                <td colSpan={4} className="text-right py-2">Sous-total</td>
                                                                <td className="text-right py-2">{commande.sousTotal.toFixed(2)} DH</td>
                                                            </tr>
                                                            {commande.reductionMontant > 0 && (
                                                                <tr className="text-green-700">
                                                                    <td colSpan={4} className="text-right py-1">Réduction</td>
                                                                    <td className="text-right py-1">-{commande.reductionMontant.toFixed(2)} DH</td>
                                                                </tr>
                                                            )}
                                                            <tr>
                                                                <td colSpan={4} className="text-right py-1">Livraison</td>
                                                                <td className="text-right py-1 text-green-700 font-medium">Gratuite</td>
                                                            </tr>
                                                            <tr className="font-bold">
                                                                <td colSpan={4} className="text-right py-2">Total</td>
                                                                <td className="text-right py-2">{commande.total.toFixed(2)} DH</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                        <span>{totalElements} commande(s) · Page {page + 1} / {totalPages}</span>
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
        </div>
    );
}

export default CommandesPage;
