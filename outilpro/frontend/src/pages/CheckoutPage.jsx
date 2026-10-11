import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { usePromoReduction } from '../hooks/usePromoReduction';
import { useLanguage } from '../context/LanguageContext';
import villeApi from '../api/villes';
import commandeApi from '../api/commandes';

function CheckoutPage() {
    const { articles, totalPrix, codePromo, viderPanier } = useCart();
    const { reduction } = usePromoReduction(codePromo, totalPrix);
    const { t } = useLanguage();
    const [villes, setVilles] = useState([]);
    const [villeId, setVilleId] = useState('');
    const [nomClient, setNomClient] = useState('');
    const [telephoneClient, setTelephoneClient] = useState('');
    const [adresseLivraison, setAdresseLivraison] = useState('');
    const [notes, setNotes] = useState('');
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [commandeConfirmee, setCommandeConfirmee] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        villeApi.getAll().then(setVilles).catch(console.error);
    }, []);

    const villeSelectionnee = villes.find((v) => String(v.id) === String(villeId));
    const fraisLivraison = villeSelectionnee ? villeSelectionnee.fraisLivraison : 0;
    const totalFinal = Math.max(0, totalPrix - reduction) + fraisLivraison;

    async function soumettreCommande(e) {
        e.preventDefault();
        setErreur(null);

        if (!villeId) {
            setErreur(t('erreurVilleRequise'));
            return;
        }

        const payload = {
            nomClient,
            telephoneClient,
            adresseLivraison,
            villeId: Number(villeId),
            notes: notes || null,
            codePromo: codePromo || null,
            lignes: articles.map((a) => ({ produitId: a.produitId, quantite: a.quantite })),
        };

        setEnvoiEnCours(true);
        try {
            const commande = await commandeApi.create(payload);
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
                    <select required value={villeId} onChange={(e) => setVilleId(e.target.value)}
                            className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="">{t('selectionnerVille')}</option>
                        {villes.map((v) => (
                            <option key={v.id} value={v.id}>{v.nom} — {v.fraisLivraison} {t('fraisLivraisonSuffixe')}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('adresseLivraison')}</label>
                    <textarea required rows={2} value={adresseLivraison} onChange={(e) => setAdresseLivraison(e.target.value)}
                              className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('notesOptionnel')}</label>
                    <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
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
                    <div className="flex justify-between text-gray-600"><span>{t('livraison')}</span><span>{villeSelectionnee ? `${fraisLivraison} DH` : '—'}</span></div>
                    <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
                        <span>{t('total')}</span><span>{totalFinal.toFixed(2)} DH</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;
