import api from './axios';

const produitApi = {
    // Catalogue public : tous les filtres (categorieId, marqueId, recherche, enStock, tri) sont
    // combinables entre eux, appliqués et triés côté backend (voir ProduitRepository.rechercherCatalogue)
    getAll: (params = {}) => api.get('/produits', { params }).then((res) => res.data),
    getById: (id) => api.get(`/produits/${id}`).then((res) => res.data),

    // Admin : listing paginé, endpoint séparé pour ne pas toucher au contrat du catalogue public
    getAllPagine: (params) => api.get('/produits/page', { params }).then((res) => res.data),
    create: (payload) => api.post('/produits', payload).then((res) => res.data),
    update: (id, payload) => api.put(`/produits/${id}`, payload).then((res) => res.data),
    delete: (id) => api.delete(`/produits/${id}`),
};

export default produitApi;
