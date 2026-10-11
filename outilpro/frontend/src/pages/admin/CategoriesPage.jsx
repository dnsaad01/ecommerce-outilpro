import { useEffect, useState } from 'react';
import categorieApi from '../../api/categories';
import ImageUploadField from '../../components/admin/ImageUploadField';
import { IconImageOff } from '../../components/admin/icons';
import ActionButtons from '../../components/admin/ActionButtons';

// Transforme "Outils Électriques" en "outils-electriques" : minuscules, sans accents,
// espaces/caractères spéciaux remplacés par des tirets.
function slugifier(texte) {
    return texte
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-+|-+$)/g, '');
}

const FORM_VIDE = { nom: '', slug: '', imageUrl: '' };

// Carte catégorie : même principe que les cartes produit (image, nom, action
// de suppression discrète au survol), simplifiée puisqu'il n'y a ni prix ni stock.
function CarteCategorie({ categorie, onModifier, onSupprimer }) {
    return (
        <div
            onClick={() => onModifier(categorie)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') onModifier(categorie);
            }}
            role="button"
            tabIndex={0}
            title="Cliquer pour modifier cette catégorie"
            className="group relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-200"
        >
            <div className="relative aspect-square bg-gray-50">
                {categorie.imageUrl ? (
                    <img src={categorie.imageUrl} alt={categorie.nom} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <IconImageOff className="w-8 h-8" />
                    </div>
                )}

                <ActionButtons
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150"
                    onModifier={() => onModifier(categorie)}
                    onSupprimer={() => onSupprimer(categorie)}
                />
            </div>

            <div className="p-3">
                <p className="font-medium text-gray-900 text-sm truncate">{categorie.nom}</p>
                <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{categorie.slug}</p>
            </div>
        </div>
    );
}

function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    const [formOuvert, setFormOuvert] = useState(false);
    const [categorieEnEdition, setCategorieEnEdition] = useState(null); // null = création
    const [form, setForm] = useState(FORM_VIDE);
    const [slugModifieManuellement, setSlugModifieManuellement] = useState(false);
    const [erreurFormulaire, setErreurFormulaire] = useState(null);
    const [envoiEnCours, setEnvoiEnCours] = useState(false);

    async function chargerCategories() {
        setChargement(true);
        setErreur(null);
        try {
            const data = await categorieApi.getAll();
            setCategories(data);
        } catch (err) {
            setErreur('Impossible de charger les catégories.');
            console.error(err);
        } finally {
            setChargement(false);
        }
    }

    useEffect(() => {
        chargerCategories();
    }, []);

    function ouvrirCreation() {
        setCategorieEnEdition(null);
        setForm(FORM_VIDE);
        setSlugModifieManuellement(false);
        setErreurFormulaire(null);
        setFormOuvert(true);
    }

    function ouvrirEdition(categorie) {
        setCategorieEnEdition(categorie);
        setForm({ nom: categorie.nom, slug: categorie.slug, imageUrl: categorie.imageUrl || '' });
        setSlugModifieManuellement(true); // on ne régénère pas le slug d'une catégorie existante automatiquement
        setErreurFormulaire(null);
        setFormOuvert(true);
    }

    function fermerFormulaire() {
        setFormOuvert(false);
        setCategorieEnEdition(null);
    }

    function changerNom(valeur) {
        setForm((f) => ({
            ...f,
            nom: valeur,
            slug: slugModifieManuellement ? f.slug : slugifier(valeur),
        }));
    }

    function changerSlug(valeur) {
        setSlugModifieManuellement(true);
        setForm((f) => ({ ...f, slug: valeur }));
    }

    async function soumettre(e) {
        e.preventDefault();
        setErreurFormulaire(null);
        setEnvoiEnCours(true);
        try {
            const payload = { nom: form.nom, slug: form.slug, imageUrl: form.imageUrl || null };
            if (categorieEnEdition) {
                const maj = await categorieApi.update(categorieEnEdition.id, payload);
                setCategories((prev) => prev.map((c) => (c.id === maj.id ? maj : c)));
            } else {
                const creee = await categorieApi.create(payload);
                setCategories((prev) => [...prev, creee]);
            }
            fermerFormulaire();
        } catch (err) {
            setErreurFormulaire(err.response?.data?.message || "Une erreur est survenue.");
            console.error(err);
        } finally {
            setEnvoiEnCours(false);
        }
    }

    async function supprimer(categorie) {
        if (!window.confirm(`Supprimer la catégorie "${categorie.nom}" ? Cette action est irréversible.`)) {
            return;
        }
        try {
            await categorieApi.delete(categorie.id);
            setCategories((prev) => prev.filter((c) => c.id !== categorie.id));
        } catch (err) {
            alert(err.response?.data?.message || "Impossible de supprimer cette catégorie.");
            console.error(err);
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
                <button
                    onClick={ouvrirCreation}
                    className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded hover:bg-gray-800"
                >
                    + Nouvelle catégorie
                </button>
            </div>

            {formOuvert && (
                <form onSubmit={soumettre} className="bg-white border rounded-lg p-5 mb-6 space-y-4 max-w-lg">
                    <h2 className="font-semibold text-gray-900">
                        {categorieEnEdition ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                    </h2>

                    {erreurFormulaire && <p className="text-red-600 text-sm">{erreurFormulaire}</p>}

                    <div>
                        <label className="block text-sm font-medium mb-1">Nom</label>
                        <input
                            type="text"
                            value={form.nom}
                            onChange={(e) => changerNom(e.target.value)}
                            required
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Slug</label>
                        <input
                            type="text"
                            value={form.slug}
                            onChange={(e) => changerSlug(e.target.value)}
                            required
                            className="w-full border rounded px-3 py-2 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Généré automatiquement à partir du nom, modifiable si besoin.</p>
                    </div>

                    <ImageUploadField
                        label="Image de la catégorie (optionnel)"
                        value={form.imageUrl}
                        onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                    />

                    <div className="flex gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={envoiEnCours}
                            className="bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                            {envoiEnCours ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                            type="button"
                            onClick={fermerFormulaire}
                            className="text-sm font-medium px-4 py-2 rounded hover:bg-gray-100"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            )}

            {chargement && <div className="text-center py-16 text-gray-500">Chargement...</div>}
            {erreur && <div className="text-center py-16 text-red-600">{erreur}</div>}

            {!chargement && !erreur && categories.length === 0 && (
                <div className="text-center py-16 text-gray-500">Aucune catégorie pour le moment.</div>
            )}

            {!chargement && !erreur && categories.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {categories.map((categorie) => (
                        <CarteCategorie
                            key={categorie.id}
                            categorie={categorie}
                            onModifier={ouvrirEdition}
                            onSupprimer={supprimer}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CategoriesPage;
