import api from './axios';

const promoApi = {
    // Routes publiques (site vitrine)
    verifier: (code, sousTotal) =>
        api.get('/promos/verifier', { params: { code, sousTotal } }).then((res) => res.data),
    getActifs: () => api.get('/promos/actifs').then((res) => res.data),

    // Routes admin (protégées par JWT)
    getAll: () => api.get('/promos').then((res) => res.data),
    create: (payload) => api.post('/promos', payload).then((res) => res.data),
    update: (id, payload) => api.put(`/promos/${id}`, payload).then((res) => res.data),
    delete: (id) => api.delete(`/promos/${id}`),
};

export default promoApi;
