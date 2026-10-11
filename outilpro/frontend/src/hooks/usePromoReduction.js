import { useEffect, useState } from 'react';
import promoApi from '../api/promos';

export function usePromoReduction(codePromo, sousTotal) {
    const [reduction, setReduction] = useState(0);
    const [erreur, setErreur] = useState(null);
    const [chargement, setChargement] = useState(false);

    useEffect(() => {
        if (!codePromo || sousTotal <= 0) {
            setReduction(0);
            setErreur(null);
            return;
        }

        let annule = false;

        async function verifier() {
            setChargement(true);
            try {
                const resultat = await promoApi.verifier(codePromo, sousTotal);
                if (!annule) {
                    setReduction(resultat.reductionMontant);
                    setErreur(null);
                }
            } catch (err) {
                if (!annule) {
                    setReduction(0);
                    setErreur(err.response?.data?.message || "Ce code promo n'est plus valide pour ce panier.");
                }
            } finally {
                if (!annule) setChargement(false);
            }
        }

        verifier();
        return () => { annule = true; };
    }, [codePromo, sousTotal]);

    return { reduction, erreur, chargement };
}