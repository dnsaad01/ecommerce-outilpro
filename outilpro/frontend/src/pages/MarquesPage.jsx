import { useEffect, useState } from 'react';
import marqueApi from '../api/marques';
import MarqueCard from '../components/MarqueCard';
import { useLanguage } from '../context/LanguageContext';

function MarquesPage() {
    const { t } = useLanguage();
    const [marques, setMarques] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    useEffect(() => {
        async function chargerMarques() {
            setChargement(true);
            setErreur(null);
            try {
                const data = await marqueApi.getAll();
                setMarques(data);
            } catch (err) {
                setErreur(t('erreurMarques'));
                console.error(err);
            } finally {
                setChargement(false);
            }
        }
        chargerMarques();
    }, [t]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('nosMarques')}</h1>

            {chargement && <div className="text-center py-16 text-gray-500">{t('chargement')}</div>}
            {erreur && <div className="text-center py-16 text-red-600">{erreur}</div>}

            {!chargement && !erreur && marques.length === 0 && (
                <div className="text-center py-16 text-gray-500">{t('aucuneMarque')}</div>
            )}

            {!chargement && !erreur && marques.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {marques.map((marque) => (
                        <MarqueCard key={marque.id} marque={marque} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default MarquesPage;
