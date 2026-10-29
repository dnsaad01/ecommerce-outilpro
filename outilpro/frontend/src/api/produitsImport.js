import api from './axios';

// Import en masse de produits (Excel) + téléchargement du modèle à remplir.
// Endpoints réservés à ADMIN côté backend (voir ProduitImportController).
const produitImportApi = {
    importer: (fichier) => {
        const formData = new FormData();
        formData.append('file', fichier);
        return api
            .post('/produits/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            .then((res) => res.data);
    },
    // responseType 'blob' : la réponse est le fichier binaire .xlsx lui-même, pas du JSON.
    telechargerModele: () => api.get('/produits/import/modele', { responseType: 'blob' }).then((res) => res.data),
};

export default produitImportApi;
