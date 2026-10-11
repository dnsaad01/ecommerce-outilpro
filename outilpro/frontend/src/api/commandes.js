import api from './axios';

const commandeApi = {
    create: (payload) => api.post('/commandes', payload).then((res) => res.data),
    // params attendus : { page, size, statut } — statut peut être omis (undefined) pour "tous les statuts"
    getAll: (params) => api.get('/commandes', { params }).then((res) => res.data),
    changerStatut: (id, statut) => api.patch(`/commandes/${id}/statut`, { statut }).then((res) => res.data),
};

export default commandeApi;
