// Dictionnaire de traductions du front-office (français / arabe simple).
// Pas de librairie externe : on reste volontairement léger (pas d'accès npm install
// sur la machine de prod), juste un objet de textes + une petite fonction de substitution.

export const LANGUE_PAR_DEFAUT = 'fr';

export const traductions = {
    fr: {
        // Navbar
        accueil: 'Accueil',
        tousLesProduits: 'Tous les produits',
        nosMarques: 'Nos Marques',
        promotions: 'Promotions',
        panier: 'Panier',
        ouvrirMenu: 'Ouvrir le menu',
        fermerMenu: 'Fermer le menu',
        rechercherPlaceholder: 'Rechercher un produit...',
        changerLangue: 'Changer de langue',

        // Footer
        navigation: 'Navigation',
        commanderChezNous: 'Commander chez nous',
        livraisonPartout: 'Livraison partout au Maroc',
        paiementLivraison: 'Paiement à la livraison',
        confirmationTelephone: 'Confirmation de commande par téléphone',
        footerTagline: "L'outillage professionnel, livré chez vous. Les meilleures marques, les meilleurs prix, livrés rapidement.",
        tousDroitsReserves: 'Tous droits réservés.',

        // HomePage
        heroTitle: "L'outillage professionnel, livré chez vous",
        heroSubtitle: 'Les meilleures marques, les meilleurs prix, livrés rapidement.',
        voirCatalogue: 'Voir le catalogue',
        nosCollections: 'Nos Collections',
        produitsPhares: 'Produits phares',
        erreurChargementDonnees: 'Impossible de charger les données. Vérifie que le backend tourne sur le port 8081.',
        chargement: 'Chargement...',

        // CataloguePage
        filtres: 'Filtres',
        reinitialiser: 'Réinitialiser',
        enStockUniquement: 'En stock uniquement',
        categories: 'Catégories',
        marques: 'Marques',
        toutes: 'Toutes',
        catalogue: 'Catalogue',
        resultatsPour: 'Résultats pour "{{q}}"',
        produitsCompte: '{{n}} produit(s)',
        triNomAsc: 'Nom (A → Z)',
        triPrixAsc: 'Prix croissant',
        triPrixDesc: 'Prix décroissant',
        aucunProduit: 'Aucun produit ne correspond à ces critères.',
        erreurChargementProduits: 'Impossible de charger les produits.',

        // ProduitDetailPage / ProduitCard
        sku: 'SKU',
        pasDImage: "Pas d'image",
        enStock: 'En stock',
        plusQue: '— plus que {{n}}',
        ajouterAuPanier: 'Ajouter au panier',
        ajoute: 'Ajouté ✓',
        commanderMaintenant: 'Commander maintenant',
        ruptureStock: 'Rupture de stock',
        description: 'Description',
        produitsSimilaires: 'Produits similaires',
        produitIntrouvable: "Ce produit est introuvable ou n'existe plus.",
        retourCatalogue: 'Retour au catalogue',

        // CartPage
        monPanier: 'Mon panier',
        panierVide: 'Ton panier est vide.',
        codePromoPlaceholder: 'Code promo',
        appliquer: 'Appliquer',
        verificationCode: 'Vérification du code...',
        retirer: 'Retirer',
        codeApplique: 'Code "{{code}}" appliqué',
        sousTotal: 'Sous-total',
        reduction: 'Réduction',
        totalHorsLivraison: 'Total (hors livraison)',
        passerCommande: 'Passer la commande',
        supprimer: 'Supprimer',

        // CheckoutPage
        finaliserCommande: 'Finaliser la commande',
        nomComplet: 'Nom complet',
        telephone: 'Téléphone',
        ville: 'Ville',
        selectionnerVille: 'Sélectionner une ville',
        fraisLivraisonSuffixe: 'DH de livraison',
        adresseLivraison: 'Adresse de livraison',
        notesOptionnel: 'Notes (optionnel)',
        confirmerCommande: 'Confirmer la commande',
        envoiEnCours: 'Envoi en cours...',
        recapitulatif: 'Récapitulatif',
        livraison: 'Livraison',
        total: 'Total',
        commandeConfirmee: 'Commande confirmée !',
        merciMessage: 'Merci {{nom}}, ta commande #{{id}} a été enregistrée. Notre équipe te contactera au {{tel}} pour confirmer la livraison.',
        retourAccueil: "Retour à l'accueil",
        erreurVilleRequise: 'Merci de choisir une ville de livraison.',
        erreurCommandeGenerique: 'Une erreur est survenue lors de la création de la commande.',

        // MarquesPage
        aucuneMarque: 'Aucune marque disponible pour le moment.',
        erreurMarques: 'Impossible de charger les marques.',

        // CollectionsPage
        aucuneCategorie: 'Aucune collection disponible pour le moment.',
        erreurCategories: 'Impossible de charger les collections.',
        voirToutesCollections: 'Voir toutes les collections',
        voirToutesMarques: 'Voir toutes les marques',
        voirTousLesProduits: 'Voir tous les produits',

        // PromotionsPage
        promotionsEnCours: 'Promotions en cours',
        promotionsSousTitre: 'Les meilleures offres du moment, à prix réduit.',
        aucunePromotion: 'Aucun produit en promotion pour le moment.',
        erreurPromotions: 'Impossible de charger les promotions.',
    },
    ar: {
        // Navbar
        accueil: 'الرئيسية',
        tousLesProduits: 'كل المنتجات',
        nosMarques: 'ماركاتنا',
        promotions: 'العروض',
        panier: 'السلة',
        ouvrirMenu: 'فتح القائمة',
        fermerMenu: 'إغلاق القائمة',
        rechercherPlaceholder: 'بحث عن منتج...',
        changerLangue: 'تغيير اللغة',

        // Footer
        navigation: 'التصفح',
        commanderChezNous: 'كيفاش تطلب عندنا',
        livraisonPartout: 'التوصيل لجميع مدن المغرب',
        paiementLivraison: 'الدفع عند التوصيل',
        confirmationTelephone: 'تأكيد الطلب بالهاتف',
        footerTagline: 'عدة الحرفيين، توصلك لباب الدار. أحسن الماركات، أحسن الأسعار، التوصيل السريع.',
        tousDroitsReserves: 'جميع الحقوق محفوظة.',

        // HomePage
        heroTitle: 'عدة الحرفيين، توصلك لباب الدار',
        heroSubtitle: 'أحسن الماركات، أحسن الأسعار، التوصيل السريع.',
        voirCatalogue: 'شوف كل المنتجات',
        nosCollections: 'التصنيفات',
        produitsPhares: 'منتجات مميزة',
        erreurChargementDonnees: 'ما قدرناش نجيبو المعطيات. تأكد أن الخادم شغال.',
        chargement: 'كي تحمّل...',

        // CataloguePage
        filtres: 'التصفية',
        reinitialiser: 'إلغاء التصفية',
        enStockUniquement: 'المتوفر فقط',
        categories: 'التصنيفات',
        marques: 'الماركات',
        toutes: 'الكل',
        catalogue: 'كل المنتجات',
        resultatsPour: 'نتائج البحث عن "{{q}}"',
        produitsCompte: '{{n}} منتج',
        triNomAsc: 'الاسم (أ ← ي)',
        triPrixAsc: 'السعر: من الأقل للأكثر',
        triPrixDesc: 'السعر: من الأكثر للأقل',
        aucunProduit: 'ما كاين حتى منتج يوافق هاد البحث.',
        erreurChargementProduits: 'ما قدرناش نجيبو المنتجات.',

        // ProduitDetailPage / ProduitCard
        sku: 'رمز المنتج',
        pasDImage: 'ما كاينة تصويرة',
        enStock: 'متوفر',
        plusQue: '— باقي غير {{n}}',
        ajouterAuPanier: 'أضف للسلة',
        ajoute: 'تمت الإضافة ✓',
        commanderMaintenant: 'اطلب الآن',
        ruptureStock: 'غير متوفر',
        description: 'الوصف',
        produitsSimilaires: 'منتجات مشابهة',
        produitIntrouvable: 'هاد المنتج ماكاينش ولا تمسح.',
        retourCatalogue: 'الرجوع لكل المنتجات',

        // CartPage
        monPanier: 'سلتي',
        panierVide: 'السلة ديالك خاوية.',
        codePromoPlaceholder: 'كود التخفيض',
        appliquer: 'تطبيق',
        verificationCode: 'كي نتحقق من الكود...',
        retirer: 'حذف',
        codeApplique: 'الكود "{{code}}" مطبق',
        sousTotal: 'المجموع الفرعي',
        reduction: 'التخفيض',
        totalHorsLivraison: 'المجموع (بلا التوصيل)',
        passerCommande: 'تأكيد الطلب',
        supprimer: 'حذف',

        // CheckoutPage
        finaliserCommande: 'إتمام الطلب',
        nomComplet: 'الاسم الكامل',
        telephone: 'رقم الهاتف',
        ville: 'المدينة',
        selectionnerVille: 'اختر المدينة',
        fraisLivraisonSuffixe: 'درهم للتوصيل',
        adresseLivraison: 'عنوان التوصيل',
        notesOptionnel: 'ملاحظات (اختياري)',
        confirmerCommande: 'تأكيد الطلب',
        envoiEnCours: 'كي نرسل...',
        recapitulatif: 'ملخص الطلب',
        livraison: 'التوصيل',
        total: 'المجموع',
        commandeConfirmee: 'الطلب تأكد!',
        merciMessage: 'شكراً {{nom}}، الطلب رقم #{{id}} تسجل. غادي نتصلو بيك على {{tel}} لتأكيد التوصيل.',
        retourAccueil: 'الرجوع للرئيسية',
        erreurVilleRequise: 'خاصك تختار مدينة التوصيل.',
        erreurCommandeGenerique: 'وقع خطأ فتسجيل الطلب.',

        // MarquesPage
        aucuneMarque: 'ماكاين حتى ماركة دابا.',
        erreurMarques: 'ما قدرناش نجيبو الماركات.',

        // CollectionsPage
        aucuneCategorie: 'ماكاين حتى تصنيف دابا.',
        erreurCategories: 'ما قدرناش نجيبو التصنيفات.',
        voirToutesCollections: 'شوف جميع التصنيفات',
        voirToutesMarques: 'شوف جميع الماركات',
        voirTousLesProduits: 'شوف جميع المنتجات',

        // PromotionsPage
        promotionsEnCours: 'العروض الحالية',
        promotionsSousTitre: 'أحسن العروض دابا، بثمن مخفض.',
        aucunePromotion: 'ماكاين حتى منتج بالتخفيض دابا.',
        erreurPromotions: 'ما قدرناش نجيبو العروض.',
    },
};

// Remplace les {{cle}} d'un texte par les valeurs fournies dans vars.
export function interpoler(texte, vars) {
    if (!vars) return texte;
    return Object.entries(vars).reduce(
        (acc, [cle, valeur]) => acc.replaceAll(`{{${cle}}}`, valeur),
        texte
    );
}
