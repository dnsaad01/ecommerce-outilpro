import api from './axios';

const stockApi = {
    // Historique paginé des mouvements de stock (le plus récent en premier côté backend).
    // produitId optionnel pour filtrer sur un seul produit.
    getMouvements: (params = {}) => api.get('/stock/mouvements', { params }).then((res) => res.data),

    // Enregistre un mouvement (ENTREE/SORTIE) : met aussi à jour le stock du produit
    // concerné côté backend, dans la même transaction.
    creerMouvement: (payload) => api.post('/stock/mouvements', payload).then((res) => res.data),
};

export default stockApi;
