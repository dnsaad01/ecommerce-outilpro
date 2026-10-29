import { Logo } from '../components/Logo';

/**
 * Page affichée à la place de tout le site public quand le mode maintenance est
 * actif (voir App.jsx + api/config.js). L'espace admin (/admin/**) n'est jamais
 * concerné par cette page -- App.jsx ne la rend que pour les routes publiques.
 * Pas de lien vers /admin/login ici : l'équipe connaît déjà l'URL, inutile de
 * l'afficher publiquement.
 */
function MaintenancePage() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
            <Logo className="h-14 mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Site en préparation</h1>
            <p className="text-gray-500 max-w-md">
                Nous mettons à jour notre catalogue. Le site sera de nouveau disponible très bientôt, merci de votre patience !
            </p>
        </div>
    );
}

export default MaintenancePage;
