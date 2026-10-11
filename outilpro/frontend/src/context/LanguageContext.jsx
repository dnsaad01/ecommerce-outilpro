import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LANGUE_PAR_DEFAUT, interpoler, traductions } from '../i18n/translations';

const LanguageContext = createContext(null);

const CLE_STOCKAGE_LANGUE = 'outilpro_langue';

function chargerLangueInitiale() {
    try {
        const stockee = localStorage.getItem(CLE_STOCKAGE_LANGUE);
        return stockee === 'ar' || stockee === 'fr' ? stockee : LANGUE_PAR_DEFAUT;
    } catch {
        return LANGUE_PAR_DEFAUT;
    }
}

export function LanguageProvider({ children }) {
    const [langue, setLangue] = useState(chargerLangueInitiale);
    const location = useLocation();
    // L'espace Admin a sa propre interface (non traduite, toujours en français) et une
    // mise en page (sidebar, tableaux, cartes) pensée pour un sens de lecture LTR : la
    // langue choisie côté client ne doit jamais l'affecter.
    const estEspaceAdmin = location.pathname.startsWith('/admin');

    // Le sens de lecture (RTL en arabe) et l'attribut lang doivent être posés sur <html>
    // pour que toute la page (scrollbar, alignement natif des inputs, etc.) suive,
    // pas seulement le contenu applicatif. On force LTR/français dans l'espace Admin,
    // quelle que soit la langue active côté client.
    useEffect(() => {
        if (estEspaceAdmin) {
            document.documentElement.lang = 'fr';
            document.documentElement.dir = 'ltr';
        } else {
            document.documentElement.lang = langue;
            document.documentElement.dir = langue === 'ar' ? 'rtl' : 'ltr';
        }
        try {
            localStorage.setItem(CLE_STOCKAGE_LANGUE, langue);
        } catch {
            // stockage indisponible (navigation privée...) : on continue sans persister
        }
    }, [langue, estEspaceAdmin]);

    function basculerLangue() {
        setLangue((precedente) => (precedente === 'fr' ? 'ar' : 'fr'));
    }

    // t('cle', { variable: valeur }) : traduit une clé pour la langue active,
    // avec substitution optionnelle de {{variable}} dans le texte.
    function t(cle, vars) {
        const dict = traductions[langue] || traductions[LANGUE_PAR_DEFAUT];
        const texte = dict[cle] ?? traductions[LANGUE_PAR_DEFAUT][cle] ?? cle;
        return interpoler(texte, vars);
    }

    const valeur = {
        langue,
        estRtl: estEspaceAdmin ? false : langue === 'ar',
        basculerLangue,
        t,
    };

    return <LanguageContext.Provider value={valeur}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
    const contexte = useContext(LanguageContext);
    if (!contexte) {
        throw new Error('useLanguage doit être utilisé à l\'intérieur d\'un LanguageProvider');
    }
    return contexte;
};
