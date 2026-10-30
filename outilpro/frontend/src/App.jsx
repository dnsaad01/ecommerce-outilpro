import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MaintenancePage from './pages/MaintenancePage';
import configApi from './api/config';
import { trackPageView } from './lib/metaPixel';
import CataloguePage from './pages/CataloguePage';
import ProduitDetailPage from './pages/ProduitDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MarquesPage from './pages/MarquesPage';
import CollectionsPage from './pages/CollectionsPage';
import PromotionsPage from './pages/PromotionsPage';
import LoginPage from "./pages/admin/LoginPage";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import AdminLayout from "./components/admin/AdminLayout";
import CommandesPage from "./pages/admin/CommandesPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import MarquesAdminPage from "./pages/admin/MarquesPage";
import PromosPage from "./pages/admin/PromosPage";
import ProduitsPage from "./pages/admin/ProduitsPage";
import StockPage from "./pages/admin/StockPage";
import StatsPage from "./pages/admin/StatsPage";
import AnalysesPage from "./pages/admin/AnalysesPage";

// "/admin" doit mener à un accueil différent selon le rôle : un EMPLOYE n'a pas accès
// à /admin/stats (réservé à ADMIN, voir ProtectedRoute roles=['ADMIN'] plus bas), donc
// le rediriger là produirait un aller-retour visible (redirigé une 2e fois vers
// /admin/commandes). On choisit directement la bonne destination ici.
function AdminAccueilRedirect() {
    const { estAdmin } = useAuth();
    return <Navigate to={estAdmin ? "/admin/stats" : "/admin/commandes"} replace />;
}

function App() {
    const location = useLocation();
    // La Navbar publique (site vitrine) n'a rien à faire dans l'espace admin,
    // qui a déjà son propre layout avec sidebar (AdminLayout).
    const estEspaceAdmin = location.pathname.startsWith('/admin');

    // Mode maintenance : appelé une seule fois au montage, jamais pour l'espace admin
    // (qui doit rester accessible même quand le site public est en maintenance, pour
    // continuer à gérer le catalogue -- voir api/config.js et ConfigController côté
    // backend). maintenanceActif reste 'false' tant que la réponse n'est pas arrivée,
    // pour ne pas bloquer l'affichage du site en cas de lenteur/échec de cet appel.
    const [maintenanceActif, setMaintenanceActif] = useState(false);
    useEffect(() => {
        configApi.get()
            .then((config) => setMaintenanceActif(Boolean(config.maintenanceMode)))
            .catch(() => setMaintenanceActif(false));
    }, []);

    // Suivi Meta Pixel (Facebook Ads) : une app React est une SPA, donc une navigation
    // interne ne recharge jamais la page -- sans cet effet, le Pixel ne verrait que la
    // toute première page ouverte et jamais les suivantes. Se déclenche aussi au tout
    // premier rendu (pathname/search ont bien une valeur dès le départ).
    useEffect(() => {
        trackPageView();
    }, [location.pathname, location.search]);

    if (maintenanceActif && !estEspaceAdmin) {
        return <MaintenancePage />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {!estEspaceAdmin && <Navbar />}
            <main className="flex-1">
            <Routes>
                {/* Routes Publiques */}
                <Route path="/" element={<HomePage />} />
                <Route path="/catalogue" element={<CataloguePage />} />
                <Route path="/produit/:id" element={<ProduitDetailPage />} />
                <Route path="/marques" element={<MarquesPage />} />
                <Route path="/collections" element={<CollectionsPage />} />
                <Route path="/promotions" element={<PromotionsPage />} />
                <Route path="/panier" element={<CartPage />} />
                <Route path="/commande" element={<CheckoutPage />} />

                {/* Route Login Admin */}
                <Route path="/admin/login" element={<LoginPage />} />
                <Route path="/admin" element={<AdminAccueilRedirect />} />

                {/* Routes Protégées Admin -- accessibles à ADMIN et EMPLOYE (gestion des
                    commandes + consultation des produits, voir Rôles & Permissions) */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/admin/commandes" element={<CommandesPage />} />
                        <Route path="/admin/produits" element={<ProduitsPage />} />

                        {/* Routes réservées à ADMIN : statistiques financières/sensibles et
                            configuration du catalogue, hors périmètre EMPLOYE. */}
                        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                            <Route path="/admin/stats" element={<StatsPage />} />
                            <Route path="/admin/analyses" element={<AnalysesPage />} />
                            <Route path="/admin/stock" element={<StockPage />} />
                            <Route path="/admin/categories" element={<CategoriesPage />} />
                            <Route path="/admin/marques" element={<MarquesAdminPage />} />
                            <Route path="/admin/promos" element={<PromosPage />} />
                        </Route>
                    </Route>
                </Route>
            </Routes>
            </main>
            {!estEspaceAdmin && <Footer />}
        </div>
    );
}

export default App;