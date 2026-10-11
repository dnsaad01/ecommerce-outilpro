import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CataloguePage from './pages/CataloguePage';
import ProduitDetailPage from './pages/ProduitDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MarquesPage from './pages/MarquesPage';
import CollectionsPage from './pages/CollectionsPage';
import PromotionsPage from './pages/PromotionsPage';
import LoginPage from "./pages/admin/LoginPage";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import CommandesPage from "./pages/admin/CommandesPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import MarquesAdminPage from "./pages/admin/MarquesPage";
import VillesPage from "./pages/admin/VillesPage";
import PromosPage from "./pages/admin/PromosPage";
import ProduitsPage from "./pages/admin/ProduitsPage";
import StockPage from "./pages/admin/StockPage";
import StatsPage from "./pages/admin/StatsPage";
import AnalysesPage from "./pages/admin/AnalysesPage";

function App() {
    const location = useLocation();
    // La Navbar publique (site vitrine) n'a rien à faire dans l'espace admin,
    // qui a déjà son propre layout avec sidebar (AdminLayout).
    const estEspaceAdmin = location.pathname.startsWith('/admin');

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
                <Route path="/admin" element={<Navigate to="/admin/stats" replace />} />

                {/* Routes Protégées Admin */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/admin/stats" element={<StatsPage />} />
                        <Route path="/admin/analyses" element={<AnalysesPage />} />
                        <Route path="/admin/commandes" element={<CommandesPage />} />
                        <Route path="/admin/produits" element={<ProduitsPage />} />
                        <Route path="/admin/stock" element={<StockPage />} />
                        <Route path="/admin/categories" element={<CategoriesPage />} />
                        <Route path="/admin/marques" element={<MarquesAdminPage />} />
                        <Route path="/admin/villes" element={<VillesPage />} />
                        <Route path="/admin/promos" element={<PromosPage />} />
                    </Route>
                </Route>
            </Routes>
            </main>
            {!estEspaceAdmin && <Footer />}
        </div>
    );
}

export default App;