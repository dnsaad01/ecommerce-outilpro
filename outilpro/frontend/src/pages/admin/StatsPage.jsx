import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import statsApi from '../../api/stats';
import commandeApi from '../../api/commandes';
import AjusterStockModal from '../../components/admin/AjusterStockModal';
import {
    IconWallet,
    IconClipboardList,
    IconAlertTriangle,
    IconArrowUpCircle,
    IconBox,
    IconClock,
    IconTag,
    IconArrowRight,
    IconTrendingUp,
} from '../../components/admin/icons';

const STATUT_STYLES = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
    VALIDEE: 'bg-blue-100 text-blue-800',
    LIVREE: 'bg-green-100 text-green-800',
    ANNULEE: 'bg-red-100 text-red-800',
};

const STATUT_DOT = {
    EN_ATTENTE: 'bg-yellow-500',
    VALIDEE: 'bg-blue-500',
    LIVREE: 'bg-green-500',
    ANNULEE: 'bg-red-500',
};

function formaterMontant(valeur) {
    return Number(valeur).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formaterDate(dateStr) {
    return new Date(dateStr).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Initiales du client (2 lettres max), pour l'avatar rond dans "Dernières commandes".
function initiales(nom) {
    return nom
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((mot) => mot[0].toUpperCase())
        .join('');
}

// Un "stat tile" : un label court (pas de ":"), une grande valeur, une icône d'identité.
// Cliquable quand `to` est fourni : redirige vers la page détaillée correspondante, avec
// un curseur pointeur et un effet de survol (bordure + ombre + légère flèche) pour signaler
// l'interactivité, cohérent avec ActionCard plus bas.
function StatTile({ to, label, valeur, icon, accent = 'text-gray-900', iconBg = 'bg-gray-100', iconColor = 'text-gray-500', pulse = false }) {
    const Conteneur = to ? Link : 'div';
    const props = to ? { to } : {};

    return (
        <Conteneur
            {...props}
            className={`group bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 block ${
                to ? 'cursor-pointer hover:border-gray-200' : ''
            }`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className={`text-3xl font-semibold mt-1 ${accent}`}>{valeur}</p>
                </div>
                <div className={`relative flex items-center justify-center w-10 h-10 rounded-lg ${iconBg} ${iconColor} transition-transform duration-200 group-hover:scale-110`}>
                    {icon}
                    {pulse && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </div>
            </div>
            {to && (
                <div className="flex items-center gap-1 mt-3 text-xs font-medium text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Voir le détail
                    <IconArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
            )}
        </Conteneur>
    );
}

function ActionCard({ to, icon, iconBg, iconColor, label, badge, badgeClass }) {
    return (
        <Link
            to={to}
            className="group flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white transition-all duration-200 hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5"
        >
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconBg} ${iconColor} transition-transform duration-200 group-hover:scale-110 shrink-0`}>
                {icon}
            </div>
            <div className="flex-1 flex items-center gap-2 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
                {badge != null && (
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${badgeClass}`}>{badge}</span>
                )}
            </div>
            <IconArrowRight className="w-4 h-4 text-gray-300 transition-all duration-200 group-hover:text-gray-500 group-hover:translate-x-0.5 shrink-0" />
        </Link>
    );
}

// Badge de stock : rouge "Rupture" si 0, orange avec la quantité sinon (produit sous le seuil d'alerte).
function BadgeStock({ stock }) {
    if (stock === 0) {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Rupture
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-800">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            {stock} en stock
        </span>
    );
}

// Tableau de bord (accueil admin) : vue épurée et synthétique — indicateurs clés, accès
// rapides, et activité la plus récente. L'analyse approfondie (évolution des ventes,
// villes, top produits) vit désormais sur sa propre page, /admin/analyses, pour ne pas
// noyer ces essentiels sous des graphiques à chaque connexion.
function StatsPage() {
    const [stats, setStats] = useState(null);
    const [dernieresCommandes, setDernieresCommandes] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);
    const [produitEnAjustement, setProduitEnAjustement] = useState(null);

    async function charger() {
        setChargement(true);
        setErreur(null);
        try {
            const [statsData, commandesData] = await Promise.all([
                statsApi.getDashboard(),
                commandeApi.getAll({ page: 0, size: 5 }), // déjà trié par dateCreation décroissant côté backend
            ]);
            setStats(statsData);
            setDernieresCommandes(commandesData.content);
        } catch (err) {
            setErreur('Impossible de charger les statistiques.');
            console.error(err);
        } finally {
            setChargement(false);
        }
    }

    useEffect(() => {
        charger();
    }, []);

    // Après un réapprovisionnement rapide depuis la liste "stock faible" : on rafraîchit
    // discrètement (sans repasser par l'état "Chargement..." plein écran) pour que la
    // quantité, le badge et le compteur KPI soient à jour immédiatement.
    async function rafraichirApresAjustement() {
        try {
            const [statsData, commandesData] = await Promise.all([
                statsApi.getDashboard(),
                commandeApi.getAll({ page: 0, size: 5 }),
            ]);
            setStats(statsData);
            setDernieresCommandes(commandesData.content);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>

            {chargement && <div className="text-center py-16 text-gray-500">Chargement...</div>}
            {erreur && <div className="text-center py-16 text-red-600">{erreur}</div>}

            {!chargement && !erreur && stats && (
                <>
                    {/* KPI essentiels : chiffre d'affaires, commandes, stock faible -- les métriques
                        dérivées (panier moyen, ratios) ont été retirées, sans utilité opérationnelle
                        directe pour la gestion quotidienne de la boutique. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <StatTile
                            to="/admin/analyses#chiffre-affaires"
                            label="Chiffre d'affaires"
                            valeur={`${formaterMontant(stats.chiffreAffairesTotal)} DH`}
                            icon={<IconWallet className="w-5 h-5" />}
                            iconBg="bg-emerald-50"
                            iconColor="text-emerald-600"
                        />
                        <StatTile
                            to="/admin/commandes"
                            label="Commandes"
                            valeur={stats.nombreCommandesTotal}
                            icon={<IconClipboardList className="w-5 h-5" />}
                            iconBg="bg-purple-50"
                            iconColor="text-purple-600"
                        />
                        <StatTile
                            to="/admin/stock"
                            label={`Stock faible (≤ ${stats.seuilAlerteStock})`}
                            valeur={stats.produitsStockFaible}
                            accent={stats.produitsStockFaible > 0 ? 'text-red-600' : 'text-gray-900'}
                            icon={<IconAlertTriangle className="w-5 h-5" />}
                            iconBg={stats.produitsStockFaible > 0 ? 'bg-red-50' : 'bg-gray-100'}
                            iconColor={stats.produitsStockFaible > 0 ? 'text-red-600' : 'text-gray-500'}
                            pulse={stats.produitsStockFaible > 0}
                        />
                    </div>

                    {/* Actions rapides : les tâches admin les plus fréquentes, à un clic — en
                        tête, l'accès vers l'analyse approfondie des ventes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                        <p className="text-sm text-gray-500 mb-3">Actions rapides</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <ActionCard
                                to="/admin/analyses"
                                icon={<IconTrendingUp className="w-5 h-5" />}
                                iconBg="bg-emerald-50"
                                iconColor="text-emerald-600"
                                label="Statistiques & Analyses"
                            />
                            <ActionCard
                                to="/admin/produits?action=new"
                                icon={<IconBox className="w-5 h-5" />}
                                iconBg="bg-gray-900"
                                iconColor="text-white"
                                label="Nouveau produit"
                            />
                            <ActionCard
                                to="/admin/commandes?statut=EN_ATTENTE"
                                icon={<IconClock className="w-5 h-5" />}
                                iconBg="bg-yellow-50"
                                iconColor="text-yellow-600"
                                label="Commandes en attente"
                                badge={stats.commandesParStatut.EN_ATTENTE ?? 0}
                                badgeClass="bg-yellow-100 text-yellow-800"
                            />
                            <ActionCard
                                to="/admin/promos"
                                icon={<IconTag className="w-5 h-5" />}
                                iconBg="bg-orange-50"
                                iconColor="text-orange-600"
                                label="Gérer les promotions"
                            />
                        </div>
                    </div>

                    {/* Activité récente : les 5 dernières commandes, pour voir en un coup d'œil ce qui vient d'arriver */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                        <div className="flex items-center justify-between px-5 py-4">
                            <p className="text-sm font-medium text-gray-900">Dernières commandes</p>
                            <Link
                                to="/admin/commandes"
                                className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 px-2.5 py-1 rounded-full bg-orange-50 hover:bg-orange-100 transition-colors duration-150"
                            >
                                Voir tout
                                <IconArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        {dernieresCommandes.length === 0 ? (
                            <p className="px-5 pb-5 text-sm text-gray-500">Aucune commande pour le moment.</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {dernieresCommandes.map((commande) => (
                                    <div
                                        key={commande.id}
                                        className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-gray-50"
                                    >
                                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold shrink-0">
                                            {initiales(commande.nomClient)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{commande.nomClient}</p>
                                            <p className="text-xs text-gray-400">{formaterDate(commande.dateCreation)}</p>
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full shrink-0 ${STATUT_STYLES[commande.statut]}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${STATUT_DOT[commande.statut]}`} />
                                            {commande.statut.replace('_', ' ')}
                                        </span>
                                        <p className="text-sm font-semibold text-gray-900 w-24 text-right shrink-0">
                                            {commande.total.toFixed(2)} DH
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {stats.produitsStockFaible > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                                <IconAlertTriangle className="w-4 h-4 text-red-500" />
                                <p className="text-sm text-gray-500">
                                    Produits à réapprovisionner (stock ≤ {stats.seuilAlerteStock})
                                    {stats.produitsStockFaible > stats.listeStockFaible.length && (
                                        <span> — 20 premiers sur {stats.produitsStockFaible}</span>
                                    )}
                                </p>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-gray-400 uppercase tracking-wide">
                                        <th className="px-5 py-2 text-left font-medium">Produit</th>
                                        <th className="px-5 py-2 text-left font-medium">SKU</th>
                                        <th className="px-5 py-2 text-right font-medium">Stock</th>
                                        <th className="px-5 py-2 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {stats.listeStockFaible.map((produit) => (
                                        <tr
                                            key={produit.id}
                                            onClick={() => setProduitEnAjustement(produit)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') setProduitEnAjustement(produit);
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            className="cursor-pointer transition-colors duration-150 hover:bg-orange-50/60 focus:outline-none focus:bg-orange-50/60"
                                            title="Réapprovisionner ce produit"
                                        >
                                            <td className="px-5 py-2 text-gray-900">{produit.nom}</td>
                                            <td className="px-5 py-2 text-gray-500 font-mono text-xs">{produit.sku}</td>
                                            <td className="px-5 py-2 text-right">
                                                <BadgeStock stock={produit.stock} />
                                            </td>
                                            <td className="px-5 py-2 text-right">
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600">
                                                    <IconArrowUpCircle className="w-4 h-4" />
                                                    Réapprovisionner
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {produitEnAjustement && (
                <AjusterStockModal
                    produit={produitEnAjustement}
                    onFermer={() => setProduitEnAjustement(null)}
                    onSucces={rafraichirApresAjustement}
                />
            )}
        </div>
    );
}

export default StatsPage;
