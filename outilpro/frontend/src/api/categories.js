import api from './axios';

const categorieApi = {
    getAll: () => api.get('/categories').then((res) => res.data),
    getById: (id) => api.get(`/categories/${id}`).then((res) => res.data),
    create: (payload) => api.post('/categories', payload).then((res) => res.data),
    update: (id, payload) => api.put(`/categories/${id}`, payload).then((res) => res.data),
    delete: (id) => api.delete(`/categories/${id}`),
};

export default categorieApi;
