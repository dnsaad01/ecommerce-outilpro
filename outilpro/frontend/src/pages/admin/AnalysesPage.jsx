import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import statsApi from '../../api/stats';
import {
    IconChart,
    IconMapPin,
    IconTrophy,
    IconArrowRight,
    IconX,
} from '../../components/admin/icons';

// Formate un montant/nombre en fr-FR à 2 décimales ; '—' si la valeur est absente, nulle
// ou non numérique (ex. donnée pas encore renvoyée par le backend), plutôt qu'un "NaN".
function formaterMontant(valeur) {
    const nombre = Number(valeur);
    if (!Number.isFinite(nombre)) return '—';
    return nombre.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formaterDateCourte(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formaterDateLongue(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formaterMoisCourt(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short' });
}

function formaterMoisAnneeLongue(dateStr) {
    const libelle = new Date(dateStr).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return libelle.charAt(0).toUpperCase() + libelle.slice(1);
}

// Petit bouton pill, cohérent avec "Voir tout" du tableau de bord : ouvre la modale de
// détail de son bloc (table complète, totaux, pourcentages).
function BoutonDetail({ onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 px-2.5 py-1 rounded-full bg-orange-50 hover:bg-orange-100 transition-colors duration-150 shrink-0"
        >
            Voir le détail
            <IconArrowRight className="w-3 h-3" />
        </button>
    );
}

// Modale générique de détail : même pattern que AjusterStockModal (overlay + clic
// extérieur pour fermer), mais plus large et scrollable pour accueillir un tableau complet.
function DetailModal({ titre, sousTitre, onFermer, children }) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onFermer}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[85vh] flex flex-col"
            >
                <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="font-semibold text-gray-900">{titre}</h2>
                        {sousTitre && <p className="text-sm text-gray-500">{sousTitre}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onFermer}
                        className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-150 shrink-0"
                    >
                        <IconX className="w-4 h-4" />
                    </button>
                </div>
                <div className="overflow-y-auto p-5">{children}</div>
            </div>
        </div>
    );
}

// Évolution des ventes avec filtrage par période : vue "Jours" (14 derniers jours) ou
// "Mois" (12 derniers mois), au choix de l'admin. Le détail ouvre un tableau complet de
// la période sélectionnée avec totaux et moyenne.
function BlocEvolutionVentes({ ventesParJour, ventesParMois }) {
    const [periode, setPeriode] = useState('jour');
    const [detailOuvert, setDetailOuvert] = useState(false);
    const estMois = periode === 'mois';
    const cle = estMois ? 'mois' : 'date';
    const donnees = estMois ? ventesParMois : ventesParJour;
    const formaterCourt = estMois ? formaterMoisCourt : formaterDateCourte;
    const formaterLong = estMois ? formaterMoisAnneeLongue : formaterDateLongue;

    const total = donnees.reduce((somme, d) => somme + Number(d.chiffreAffaires), 0);
    const nbCommandes = donnees.reduce((somme, d) => somme + Number(d.nombreCommandes), 0);
    const maxValeur = Math.max(1, ...donnees.map((d) => Number(d.chiffreAffaires)));
    const dernierePeriode = donnees[donnees.length - 1]?.[cle];
    const meilleurePeriode = donnees.reduce(
        (meilleur, d) => (Number(d.chiffreAffaires) > Number(meilleur?.chiffreAffaires ?? -1) ? d : meilleur),
        null
    );

    return (
        <div id="chiffre-affaires" className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 shrink-0">
                        <IconChart className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">Chiffre d'affaires</p>
                        <p className="text-xs text-gray-400">{estMois ? '12 derniers mois' : '14 derniers jours'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-100 rounded-full p-0.5 text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setPeriode('jour')}
                            className={`px-3 py-1 rounded-full transition-colors duration-150 ${
                                !estMois ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Jours
                        </button>
                        <button
                            type="button"
                            onClick={() => setPeriode('mois')}
                            className={`px-3 py-1 rounded-full transition-colors duration-150 ${
                                estMois ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Mois
                        </button>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">{formaterMontant(total)} DH</p>
                        <p className="text-xs text-gray-400">sur la période</p>
                    </div>
                </div>
            </div>

            {total === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                    Aucune vente enregistrée sur cette période.
                </div>
            ) : (
                <div className={`h-48 flex items-end ${estMois ? 'gap-2' : 'gap-1.5'}`}>
                    {donnees.map((d, index) => {
                        const valeur = Number(d.chiffreAffaires);
                        const hauteur = Math.max(valeur > 0 ? 4 : 1.5, Math.round((valeur / maxValeur) * 100));
                        const cleValeur = d[cle];
                        const estDerniere = cleValeur === dernierePeriode;
                        const afficherLabel = estMois || index % 2 === 0 || index === donnees.length - 1;

                        return (
                            <div key={cleValeur} className="group flex-1 flex flex-col items-center justify-end h-full">
                                <div
                                    title={`${formaterLong(cleValeur)} — ${formaterMontant(valeur)} DH (${d.nombreCommandes} commande${d.nombreCommandes === 1 ? '' : 's'})`}
                                    className={`w-full rounded-t transition-colors duration-150 ${
                                        estDerniere ? 'bg-orange-500' : 'bg-orange-200 group-hover:bg-orange-300'
                                    }`}
                                    style={{ height: `${hauteur}%` }}
                                />
                                <p className={`text-[10px] mt-1.5 whitespace-nowrap ${afficherLabel ? 'text-gray-400' : 'text-transparent'}`}>
                                    {formaterCourt(cleValeur)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                {meilleurePeriode && Number(meilleurePeriode.chiffreAffaires) > 0 ? (
                    <p className="text-xs text-gray-500">
                        Meilleure période : <span className="font-semibold text-gray-900">{formaterLong(meilleurePeriode[cle])}</span>
                        {' '}— {formaterMontant(meilleurePeriode.chiffreAffaires)} DH
                    </p>
                ) : (
                    <span />
                )}
                <BoutonDetail onClick={() => setDetailOuvert(true)} />
            </div>

            {detailOuvert && (
                <DetailModal
                    titre="Chiffre d'affaires"
                    sousTitre={estMois ? '12 derniers mois' : '14 derniers jours'}
                    onFermer={() => setDetailOuvert(false)}
                >
                    <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400">Total</p>
                            <p className="font-semibold text-gray-900">{formaterMontant(total)} DH</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400">Commandes</p>
                            <p className="font-semibold text-gray-900">{nbCommandes}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400">Moyenne / {estMois ? 'mois' : 'jour'}</p>
                            <p className="font-semibold text-gray-900">{formaterMontant(total / donnees.length)} DH</p>
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 uppercase tracking-wide">
                                <th className="py-2 text-left font-medium">{estMois ? 'Mois' : 'Date'}</th>
                                <th className="py-2 text-right font-medium">Commandes</th>
                                <th className="py-2 text-right font-medium">CA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[...donnees].reverse().map((d) => (
                                <tr
                                    key={d[cle]}
                                    className={
                                        meilleurePeriode && d[cle] === meilleurePeriode[cle] && Number(d.chiffreAffaires) > 0
                                            ? 'bg-emerald-50/60'
                                            : ''
                                    }
                                >
                                    <td className="py-2 text-gray-900">{formaterLong(d[cle])}</td>
                                    <td className="py-2 text-right text-gray-700">{d.nombreCommandes}</td>
                                    <td className="py-2 text-right font-medium text-gray-900">{formaterMontant(d.chiffreAffaires)} DH</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </DetailModal>
            )}
        </div>
    );
}

// Ventes par ville : barres (top 6) + nombre de commandes par ville en regard du CA.
// Le détail liste toutes les villes avec leur part du chiffre d'affaires total.
function BlocVentesParVille({ donnees }) {
    const [detailOuvert, setDetailOuvert] = useState(false);
    const top = donnees.slice(0, 8);
    const maxValeur = Math.max(1, ...top.map((v) => Number(v.chiffreAffaires)));
    const autresVilles = donnees.length - top.length;
    const totalCA = donnees.reduce((somme, v) => somme + Number(v.chiffreAffaires), 0);
    const totalCommandes = donnees.reduce((somme, v) => somme + Number(v.nombreCommandes), 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-sm font-medium text-gray-900">Ventes par ville</p>
                <BoutonDetail onClick={() => setDetailOuvert(true)} />
            </div>

            {top.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-gray-400 text-center">
                    Aucune commande pour le moment.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    {top.map((ville) => {
                        const valeur = Number(ville.chiffreAffaires);
                        const pourcentage = Math.max(4, Math.round((valeur / maxValeur) * 100));
                        return (
                            <div key={ville.ville}>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 min-w-0">
                                        <IconMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <span className="truncate">{ville.ville}</span>
                                    </span>
                                    <span className="text-sm text-gray-900 shrink-0">
                                        <span className="font-medium">{formaterMontant(valeur)} DH</span>
                                        <span className="text-gray-400"> · {ville.nombreCommandes} cmd{ville.nombreCommandes > 1 ? 's' : ''}</span>
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${pourcentage}%` }} />
                                </div>
                            </div>
                        );
                    })}
                    {autresVilles > 0 && (
                        <p className="text-xs text-gray-400 pt-1 sm:col-span-2">
                            + {autresVilles} autre{autresVilles > 1 ? 's' : ''} ville{autresVilles > 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            )}

            {detailOuvert && (
                <DetailModal
                    titre="Ventes par ville"
                    sousTitre={`${donnees.length} ville${donnees.length > 1 ? 's' : ''} desservies`}
                    onFermer={() => setDetailOuvert(false)}
                >
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 uppercase tracking-wide">
                                <th className="py-2 text-left font-medium">Ville</th>
                                <th className="py-2 text-right font-medium">Commandes</th>
                                <th className="py-2 text-right font-medium">CA</th>
                                <th className="py-2 text-right font-medium">% du CA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {donnees.map((ville) => (
                                <tr key={ville.ville}>
                                    <td className="py-2 text-gray-900">
                                        <span className="inline-flex items-center gap-1.5">
                                            <IconMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            {ville.ville}
                                        </span>
                                    </td>
                                    <td className="py-2 text-right text-gray-700">{ville.nombreCommandes}</td>
                                    <td className="py-2 text-right font-medium text-gray-900">{formaterMontant(ville.chiffreAffaires)} DH</td>
                                    <td className="py-2 text-right text-gray-500">
                                        {totalCA > 0 ? Math.round((Number(ville.chiffreAffaires) / totalCA) * 100) : 0}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-gray-200 font-semibold text-gray-900">
                                <td className="py-2">Total</td>
                                <td className="py-2 text-right">{totalCommandes}</td>
                                <td className="py-2 text-right">{formaterMontant(totalCA)} DH</td>
                                <td className="py-2 text-right">100%</td>
                            </tr>
                        </tfoot>
                    </table>
                </DetailModal>
            )}
        </div>
    );
}

// Produits les plus vendus : top 5 affiché inline, classement complet (jusqu'à 20) dans
// le détail avec la part de chaque produit dans le chiffre d'affaires total.
function BlocTopProduits({ donnees }) {
    const [detailOuvert, setDetailOuvert] = useState(false);
    const top = donnees.slice(0, 5);
    const totalCA = donnees.reduce((somme, p) => somme + Number(p.chiffreAffaires), 0);
    const totalQte = donnees.reduce((somme, p) => somme + Number(p.quantiteVendue), 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                        <IconTrophy className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">Produits les plus vendus</p>
                        <p className="text-xs text-gray-400">Classement par quantité</p>
                    </div>
                </div>
                <BoutonDetail onClick={() => setDetailOuvert(true)} />
            </div>

            {top.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-gray-400">Aucune vente enregistrée pour le moment.</p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-wide">
                            <th className="px-5 py-2 text-left font-medium w-8">#</th>
                            <th className="px-5 py-2 text-left font-medium">Produit</th>
                            <th className="px-5 py-2 text-right font-medium">Qté</th>
                            <th className="px-5 py-2 text-right font-medium">CA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {top.map((produit, index) => (
                            <tr key={produit.produitId ?? produit.sku}>
                                <td className="px-5 py-2.5 text-gray-400 font-medium">{index + 1}</td>
                                <td className="px-5 py-2.5 min-w-0">
                                    <p className="text-gray-900 font-medium truncate max-w-[200px]">{produit.nom}</p>
                                    <p className="text-xs text-gray-400 font-mono truncate">{produit.sku}</p>
                                </td>
                                <td className="px-5 py-2.5 text-right text-gray-700">{produit.quantiteVendue}</td>
                                <td className="px-5 py-2.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                                    {formaterMontant(produit.chiffreAffaires)} DH
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {donnees.length > top.length && (
                <p className="px-5 pb-4 text-xs text-gray-400">
                    + {donnees.length - top.length} autre{donnees.length - top.length > 1 ? 's' : ''} produit{donnees.length - top.length > 1 ? 's' : ''} dans le classement complet
                </p>
            )}

            {detailOuvert && (
                <DetailModal
                    titre="Produits les plus vendus"
                    sousTitre={`Classement complet (${donnees.length} produit${donnees.length > 1 ? 's' : ''})`}
                    onFermer={() => setDetailOuvert(false)}
                >
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 uppercase tracking-wide">
                                <th className="py-2 text-left font-medium w-8">#</th>
                                <th className="py-2 text-left font-medium">Produit</th>
                                <th className="py-2 text-right font-medium">Qté</th>
                                <th className="py-2 text-right font-medium">CA</th>
                                <th className="py-2 text-right font-medium">% du CA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {donnees.map((produit, index) => (
                                <tr key={produit.produitId ?? produit.sku}>
                                    <td className="py-2 text-gray-400 font-medium">{index + 1}</td>
                                    <td className="py-2">
                                        <p className="text-gray-900 font-medium">{produit.nom}</p>
                                        <p className="text-xs text-gray-400 font-mono">{produit.sku}</p>
                                    </td>
                                    <td className="py-2 text-right text-gray-700">{produit.quantiteVendue}</td>
                                    <td className="py-2 text-right font-medium text-gray-900">{formaterMontant(produit.chiffreAffaires)} DH</td>
                                    <td className="py-2 text-right text-gray-500">
                                        {totalCA > 0 ? Math.round((Number(produit.chiffreAffaires) / totalCA) * 100) : 0}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-gray-200 font-semibold text-gray-900">
                                <td className="py-2" colSpan={2}>Total</td>
                                <td className="py-2 text-right">{totalQte}</td>
                                <td className="py-2 text-right">{formaterMontant(totalCA)} DH</td>
                                <td className="py-2 text-right">100%</td>
                            </tr>
                        </tfoot>
                    </table>
                </DetailModal>
            )}
        </div>
    );
}

// Page "Statistiques & Analyses" : vue complète et détaillée, séparée du tableau de bord
// pour que ce dernier reste épuré. Chaque bloc s'ouvre en profondeur via sa modale de détail.
function AnalysesPage() {
    const [stats, setStats] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);
    const location = useLocation();

    useEffect(() => {
        async function charger() {
            setChargement(true);
            setErreur(null);
            try {
                const data = await statsApi.getDashboard();
                setStats(data);
            } catch (err) {
                setErreur('Impossible de charger les statistiques.');
                console.error(err);
            } finally {
                setChargement(false);
            }
        }
        charger();
    }, []);

    // Arrivée depuis "Voir le détail" d'une carte du Dashboard (ex. /admin/analyses#chiffre-affaires) :
    // une fois les données chargées (et donc le bloc ciblé réellement dans le DOM), on scrolle
    // vers lui -- React Router ne le fait pas tout seul lors d'une navigation interne (SPA).
    useEffect(() => {
        if (!chargement && stats && location.hash) {
            const cible = document.getElementById(location.hash.slice(1));
            if (cible) cible.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [chargement, stats, location.hash]);

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Statistiques & Analyses</h1>
            <p className="text-sm text-gray-500 mb-6">
                Analyse détaillée des ventes, des villes et des produits les plus vendus.
            </p>

            {chargement && <div className="text-center py-16 text-gray-500">Chargement...</div>}
            {erreur && <div className="text-center py-16 text-red-600">{erreur}</div>}

            {!chargement && !erreur && stats && (
                <>
                    <div className="mb-6">
                        <BlocEvolutionVentes ventesParJour={stats.ventesParJour} ventesParMois={stats.ventesParMois} />
                    </div>

                    <div className="mb-6">
                        <BlocVentesParVille donnees={stats.ventesParVille} />
                    </div>

                    <div>
                        <BlocTopProduits donnees={stats.topProduits} />
                    </div>
                </>
            )}
        </div>
    );
}

export default AnalysesPage;
