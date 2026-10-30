// Intégration Meta Pixel (Facebook/Instagram Ads) -- suivi des visites et des
// actions e-commerce clés (vue produit, ajout panier, démarrage commande, achat)
// pour permettre le retargeting et l'optimisation des campagnes publicitaires
// depuis le Gestionnaire d'événements Meta.
//
// L'ID du pixel est injecté au moment du build via VITE_FACEBOOK_PIXEL_ID (voir
// .env.example + Dockerfile, même mécanisme que VITE_API_URL). Si la variable est
// vide ou absente (ex: développement local, ou avant configuration sur Coolify),
// toutes les fonctions ci-dessous ne font rien silencieusement -- le site continue
// de fonctionner normalement sans pixel configuré.

const PIXEL_ID = import.meta.env.VITE_FACEBOOK_PIXEL_ID;

let initialise = false;

// Charge le script officiel fbevents.js et initialise le pixel -- à appeler une
// seule fois au démarrage de l'app (voir main.jsx). Ne fait volontairement PAS
// de fbq('track', 'PageView') ici : App.jsx s'en charge à chaque changement de
// route (y compris le premier), pour que la navigation en SPA soit suivie
// correctement sans dépendre d'un rechargement complet de page.
export function initMetaPixel() {
    if (initialise || !PIXEL_ID || typeof window === 'undefined') return;
    initialise = true;

    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0';
        n.queue = []; t = b.createElement(e); t.async = true;
        t.src = v; s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq('init', PIXEL_ID);
}

function envoyer(nomEvenement, donnees) {
    if (!PIXEL_ID || typeof window === 'undefined' || !window.fbq) return;
    window.fbq('track', nomEvenement, donnees);
}

export function trackPageView() {
    envoyer('PageView');
}

export function trackViewContent(produit) {
    envoyer('ViewContent', {
        content_ids: [String(produit.id)],
        content_name: produit.nom,
        content_type: 'product',
        value: produit.prixEffectif ?? produit.prix,
        currency: 'MAD',
    });
}

export function trackAddToCart(produit, quantite = 1) {
    const prixUnitaire = produit.prixEffectif ?? produit.prix;
    envoyer('AddToCart', {
        content_ids: [String(produit.id)],
        content_name: produit.nom,
        content_type: 'product',
        value: prixUnitaire * quantite,
        currency: 'MAD',
    });
}

export function trackInitiateCheckout(articles, totalPrix) {
    envoyer('InitiateCheckout', {
        content_ids: articles.map((a) => String(a.produitId)),
        content_type: 'product',
        num_items: articles.reduce((total, a) => total + a.quantite, 0),
        value: totalPrix,
        currency: 'MAD',
    });
}

export function trackPurchase(commande) {
    envoyer('Purchase', {
        content_ids: (commande.lignes || []).map((l) => String(l.produitId)),
        content_type: 'product',
        value: commande.total,
        currency: 'MAD',
    });
}
