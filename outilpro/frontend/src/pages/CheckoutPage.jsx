import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { usePromoReduction } from '../hooks/usePromoReduction';
import { useLanguage } from '../context/LanguageContext';
import commandeApi from '../api/commandes';
import { trackInitiateCheckout, trackPurchase } from '../lib/metaPixel';

// Liste fermée (triée par ordre alphabétique du nom français, pour un ordre stable quelle
// que soit la langue d'affichage) des principales villes et préfectures du Maroc pour le
// menu déroulant. "value" est le nom canonique (toujours en français) enregistré en base
// -- quelle que soit la langue d'affichage du site, afin que la statistique "Ventes par
// ville" ne soit pas fragmentée entre une saisie FR et une saisie AR de la même ville. Pas
// d'entité ni de tarification de livraison associée : c'est une simple liste statique,
// purement informative.
const VILLES_MAROC = [
    { value: 'Agadir', ar: 'أكادير' },
    { value: 'Al Hoceïma', ar: 'الحسيمة' },
    { value: 'Asilah', ar: 'أصيلة' },
    { value: 'Azrou', ar: 'أزرو' },
    { value: 'Béni Mellal', ar: 'بني ملال' },
    { value: 'Benslimane', ar: 'بن سليمان' },
    { value: 'Berkane', ar: 'بركان' },
    { value: 'Berrechid', ar: 'برشيد' },
    { value: 'Bouznika', ar: 'بوزنيقة' },
    { value: 'Casablanca', ar: 'الدار البيضاء' },
    { value: 'Chefchaouen', ar: 'شفشاون' },
    { value: 'Dakhla', ar: 'الداخلة' },
    { value: 'El Jadida', ar: 'الجديدة' },
    { value: 'Errachidia', ar: 'الرشيدية' },
    { value: 'Essaouira', ar: 'الصويرة' },
    { value: 'Fès', ar: 'فاس' },
    { value: 'Fquih Ben Salah', ar: 'الفقيه بن صالح' },
    { value: 'Guelmim', ar: 'كلميم' },
    { value: 'Guercif', ar: 'جرسيف' },
    { value: 'Ifrane', ar: 'إفران' },
    { value: 'Jerada', ar: 'جرادة' },
    { value: 'Kénitra', ar: 'القنيطرة' },
    { value: 'Khémisset', ar: 'الخميسات' },
    { value: 'Khénifra', ar: 'خنيفرة' },
    { value: 'Khouribga', ar: 'خريبكة' },
    { value: 'Ksar El Kébir', ar: 'القصر الكبير' },
    { value: 'Laâyoune', ar: 'العيون' },
    { value: 'Larache', ar: 'العرائش' },
    { value: 'Marrakech', ar: 'مراكش' },
    { value: 'Martil', ar: 'مرتيل' },
    { value: 'Meknès', ar: 'مكناس' },
    { value: 'Midelt', ar: 'ميدلت' },
    { value: "M'diq", ar: 'المضيق' },
    { value: 'Mohammedia', ar: 'المحمدية' },
    { value: 'Nador', ar: 'الناظور' },
    { value: 'Ouarzazate', ar: 'ورزازات' },
    { value: 'Ouazzane', ar: 'وزان' },
    { value: 'Oujda', ar: 'وجدة' },
    { value: 'Rabat', ar: 'الرباط' },
    { value: 'Safi', ar: 'آسفي' },
    { value: 'Salé', ar: 'سلا' },
    { value: 'Sefrou', ar: 'صفرو' },
    { value: 'Settat', ar: 'سطات' },
    { value: 'Sidi Bennour', ar: 'سيدي بنور' },
    { value: 'Sidi Kacem', ar: 'سيدي قاسم' },
    { value: 'Sidi Slimane', ar: 'سيدي سليمان' },
    { value: 'Skhirate', ar: 'الصخيرات' },
    { value: 'Tan-Tan', ar: 'طانطان' },
    { value: 'Tanger', ar: 'طنجة' },
    { value: 'Taounate', ar: 'تاونات' },
    { value: 'Taourirt', ar: 'تاوريرت' },
    { value: 'Taroudant', ar: 'تارودانت' },
    { value: 'Taza', ar: 'تازة' },
    { value: 'Témara', ar: 'تمارة' },
    { value: 'Tétouan', ar: 'تطوان' },
    { value: 'Tiznit', ar: 'تيزنيت' },
    { value: 'Youssoufia', ar: 'اليوسفية' },
    { value: 'Zagora', ar: 'زاكورة' },
];

// Libellé affiché dans le menu : les deux langues toujours visibles, dans l'ordre adapté
// au sens de lecture courant, pour rester lisible aussi bien en FR qu'en AR.
function libelleVille(v, langue) {
    return langue === 'ar' ? `${v.ar} — ${v.value}` : `${v.value} — ${v.ar}`;
}

function CheckoutPage() {
    const { articles, totalPrix, codePromo, viderPanier } = useCart();
    const { reduction } = usePromoReduction(codePromo, totalPrix);
    const { t, langue } = useLanguage();
    const [nomClient, setNomClient] = useState('');
    const [telephoneClient, setTelephoneClient] = useState('');
    const [ville, setVille] = useState('');
    const [adresseLivraison, setAdresseLivraison] = useState('');
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [commandeConfirmee, setCommandeConfirmee] = useState(null);
    const navigate = useNavigate();

    // Une seule fois à l'arrivée sur la page (pas à chaque re-render) : signale à Meta
    // qu'un client a commencé le paiement, avec le panier tel qu'il est à ce moment-là.
    useEffect(() => {
        if (articles.length > 0) {
            trackInitiateCheckout(articles, totalPrix);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Livraison toujours gratuite, quelle que soit la ville : aucun frais n'est calculé.
    // La ville reste demandée au client (simple champ, pas de tarification) pour que
    // l'admin sache où expédier la commande.
    const totalFinal = Math.max(0, totalPrix - reduction);

    async function soumettreCommande(e) {
        e.preventDefault();
        setErreur(null);

        const payload = {
            nomClient,
            telephoneClient,
            ville,
            adresseLivraison,
            codePromo: codePromo || null,
            lignes: articles.map((a) => ({ produitId: a.produitId, quantite: a.quantite })),
        };

        setEnvoiEnCours(true);
        try {
            const commande = await commandeApi.create(payload);
            trackPurchase(commande);
            setCommandeConfirmee(commande);
            viderPanier();
        } catch (err) {
            setErreur(err.response?.data?.message || t('erreurCommandeGenerique'));
        } finally {
            setEnvoiEnCours(false);
        }
    }

    if (commandeConfirmee) {
        return (
            <div className="max-w-xl mx-auto px-4 py-20 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('commandeConfirmee')}</h1>
                <p className="text-gray-600 mb-6">
                    {t('merciMessage', {
                        nom: commandeConfirmee.nomClient,
                        id: commandeConfirmee.id,
                        tel: commandeConfirmee.telephoneClient,
                    })}
                </p>
                <p className="text-lg font-semibold text-gray-900 mb-8">{t('total')} : {commandeConfirmee.total.toFixed(2)} DH</p>
                <button onClick={() => navigate('/')} className="bg-gray-900 text-white font-semibold px-6 py-3.5 rounded-md hover:bg-gray-800">
                    {t('retourAccueil')}
                </button>
            </div>
        );
    }

    if (articles.length === 0) {
        return <Navigate to="/panier" replace />;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
            <form onSubmit={soumettreCommande} className="space-y-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('finaliserCommande')}</h1>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('nomComplet')}</label>
                    <input type="text" required value={nomClient} onChange={(e) => setNomClient(e.target.value)}
                           className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('telephone')}</label>
                    <input type="tel" required value={telephoneClient} onChange={(e) => setTelephoneClient(e.target.value)}
                           className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('ville')}</label>
                    <select required value={ville} onChange={(e) => setVille(e.target.value)}
                            className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="">{t('selectionnerVille')}</option>
                        {VILLES_MAROC.map((v) => (
                            <option key={v.value} value={v.value}>{libelleVille(v, langue)}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('adresseLivraison')}</label>
                    <textarea required rows={2} value={adresseLivraison} onChange={(e) => setAdresseLivraison(e.target.value)}
                              className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>

                {erreur && <p className="text-sm text-red-600">{erreur}</p>}

                <button type="submit" disabled={envoiEnCours}
                        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-semibold py-3.5 rounded-md transition-colors">
                    {envoiEnCours ? t('envoiEnCours') : t('confirmerCommande')}
                </button>
            </form>

            <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit">
                <h2 className="font-semibold text-gray-900 mb-4">{t('recapitulatif')}</h2>
                <div className="space-y-2 mb-4">
                    {articles.map((a) => (
                        <div key={a.produitId} className="flex justify-between text-sm text-gray-700">
                            <span>{a.nom} × {a.quantite}</span>
                            <span>{(a.prix * a.quantite).toFixed(2)} DH</span>
                        </div>
                    ))}
                </div>
                <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-gray-600"><span>{t('sousTotal')}</span><span>{totalPrix.toFixed(2)} DH</span></div>
                    {reduction > 0 && (
                        <div className="flex justify-between text-green-700"><span>{t('reduction')} ({codePromo})</span><span>-{reduction.toFixed(2)} DH</span></div>
                    )}
                    <div className="flex justify-between text-gray-600"><span>{t('livraison')}</span><span className="text-green-700 font-medium">{t('livraisonGratuite')}</span></div>
                    <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
                        <span>{t('total')}</span><span>{totalFinal.toFixed(2)} DH</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;
