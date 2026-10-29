import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Logo } from './Logo';

function Footer() {
    const { t } = useLanguage();

    const LIENS = [
        { to: '/', label: t('accueil') },
        { to: '/catalogue', label: t('tousLesProduits') },
        { to: '/marques', label: t('nosMarques') },
        { to: '/promotions', label: t('promotions') },
    ];

    return (
        <footer className="bg-gray-900 text-gray-300 mt-16">
            <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
                <div>
                    <Link to="/" className="inline-block">
                        <Logo className="h-10" />
                    </Link>
                    <p className="text-sm text-gray-400 mt-3 max-w-xs">
                        {t('footerTagline')}
                    </p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">{t('navigation')}</h3>
                    <ul className="space-y-2 text-sm">
                        {LIENS.map((lien) => (
                            <li key={lien.to}>
                                <Link to={lien.to} className="text-gray-400 hover:text-orange-500 transition-colors">
                                    {lien.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">{t('commanderChezNous')}</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li>{t('livraisonPartout')}</li>
                        <li>{t('paiementLivraison')}</li>
                        <li>{t('confirmationTelephone')}</li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-gray-500 text-center">
                    © {new Date().getFullYear()} Spartak brico. {t('tousDroitsReserves')}
                </div>
            </div>
        </footer>
    );
}

export default Footer;
