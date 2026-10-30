import { createContext, useContext, useEffect, useState } from 'react';
import { trackAddToCart } from '../lib/metaPixel';

const CartContext = createContext(null);

const CLE_STOCKAGE_PANIER = 'outilpro_panier';
const CLE_STOCKAGE_PROMO = 'outilpro_code_promo';

function chargerPanierInitial() {
    try {
        const donnees = localStorage.getItem(CLE_STOCKAGE_PANIER);
        return donnees ? JSON.parse(donnees) : [];
    } catch {
        return [];
    }
}

function chargerCodePromoInitial() {
    try {
        return localStorage.getItem(CLE_STOCKAGE_PROMO) || null;
    } catch {
        return null;
    }
}

export function CartProvider({ children }) {
    const [articles, setArticles] = useState(chargerPanierInitial);
    const [codePromo, setCodePromo] = useState(chargerCodePromoInitial);

    useEffect(() => {
        localStorage.setItem(CLE_STOCKAGE_PANIER, JSON.stringify(articles));
    }, [articles]);

    useEffect(() => {
        if (codePromo) {
            localStorage.setItem(CLE_STOCKAGE_PROMO, codePromo);
        } else {
            localStorage.removeItem(CLE_STOCKAGE_PROMO);
        }
    }, [codePromo]);

    function ajouterAuPanier(produit, quantite = 1) {
        trackAddToCart(produit, quantite);
        setArticles((precedent) => {
            const existant = precedent.find((a) => a.produitId === produit.id);
            if (existant) {
                return precedent.map((a) =>
                    a.produitId === produit.id ? { ...a, quantite: a.quantite + quantite } : a
                );
            }
            // On stocke le prix EFFECTIF (promo si actif, sinon prix normal) — c'est aussi
            // celui que le backend facturera réellement à la création de la commande.
            const prixUnitaire = produit.prixEffectif ?? produit.prix;
            return [
                ...precedent,
                { produitId: produit.id, nom: produit.nom, prix: prixUnitaire, imageUrl: produit.imageUrl, sku: produit.sku, quantite },
            ];
        });
    }

    function modifierQuantite(produitId, quantite) {
        if (quantite <= 0) {
            supprimerDuPanier(produitId);
            return;
        }
        setArticles((precedent) =>
            precedent.map((a) => (a.produitId === produitId ? { ...a, quantite } : a))
        );
    }

    function supprimerDuPanier(produitId) {
        setArticles((precedent) => precedent.filter((a) => a.produitId !== produitId));
    }

    function viderPanier() {
        setArticles([]);
        setCodePromo(null);
    }

    const totalArticles = articles.reduce((total, a) => total + a.quantite, 0);
    const totalPrix = articles.reduce((total, a) => total + a.prix * a.quantite, 0);

    const valeur = {
        articles,
        ajouterAuPanier,
        modifierQuantite,
        supprimerDuPanier,
        viderPanier,
        totalArticles,
        totalPrix,
        codePromo,
        setCodePromo,
    };

    return <CartContext.Provider value={valeur}>{children}</CartContext.Provider>;
}

export const useCart = () => {
    const contexte = useContext(CartContext);
    if (!contexte) {
        throw new Error("useCart doit être utilisé à l'intérieur d'un CartProvider");
    }
    return contexte;
};