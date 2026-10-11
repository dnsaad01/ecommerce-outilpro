import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { IconChart, IconTrendingUp, IconClipboardList, IconBox, IconLayers, IconBookmark, IconMapPin, IconTag, IconLogOut, IconArrowUpDown } from "./icons";

const liens = [
    { to: "/admin/stats", label: "Tableau de bord", Icon: IconChart },
    { to: "/admin/analyses", label: "Statistiques & Analyses", Icon: IconTrendingUp },
    { to: "/admin/commandes", label: "Commandes", Icon: IconClipboardList },
    { to: "/admin/produits", label: "Produits", Icon: IconBox },
    { to: "/admin/stock", label: "Gestion des stocks", Icon: IconArrowUpDown },
    { to: "/admin/categories", label: "Catégories", Icon: IconLayers },
    { to: "/admin/marques", label: "Marques", Icon: IconBookmark },
    { to: "/admin/villes", label: "Villes", Icon: IconMapPin },
    { to: "/admin/promos", label: "Promotions", Icon: IconTag },
];

export default function AdminLayout() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen">
            {/* Sidebar fixe : reste en place pendant que le contenu de droite défile.
                h-screen + overflow-y-auto pour qu'elle défile elle-même si la nav
                (liste de liens) devient un jour plus haute que l'écran. */}
            <aside className="fixed inset-y-0 left-0 z-30 w-56 h-screen overflow-y-auto bg-gray-900 text-white flex flex-col">
                <div className="p-4 flex items-center gap-2 border-b border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-sm">
                        OP
                    </div>
                    <span className="font-bold">OutilPro Admin</span>
                </div>

                <nav className="flex-1 p-2 space-y-1">
                    {liens.map(({ to, label, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm border-l-2 transition-all duration-150 ${
                                    isActive
                                        ? "bg-gray-800 border-orange-500 text-white"
                                        : "border-transparent text-gray-300 hover:bg-gray-800/60 hover:border-gray-600 hover:text-white"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                                            isActive ? "text-orange-500" : "text-gray-500 group-hover:text-gray-300"
                                        }`}
                                    />
                                    <span>{label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-2 border-t border-gray-800">
                    <button
                        onClick={logout}
                        className="group w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-gray-300 transition-all duration-150 hover:bg-red-500/10 hover:text-red-400"
                    >
                        <IconLogOut className="w-4 h-4 shrink-0 text-gray-500 transition-colors duration-150 group-hover:text-red-400" />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* ml-56 compense la largeur de la sidebar devenue fixe (hors du flux) ;
                h-screen + overflow-y-auto en fait le seul panneau qui défile. */}
            <main className="ml-56 h-screen overflow-y-auto p-6 bg-gray-50">
                <Outlet />
            </main>
        </div>
    );
}
