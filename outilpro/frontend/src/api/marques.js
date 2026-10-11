import api from './axios';

const marqueApi = {
    getAll: () => api.get('/marques').then((res) => res.data),
    getById: (id) => api.get(`/marques/${id}`).then((res) => res.data),
    create: (payload) => api.post('/marques', payload).then((res) => res.data),
    update: (id, payload) => api.put(`/marques/${id}`, payload).then((res) => res.data),
    delete: (id) => api.delete(`/marques/${id}`),
};

export default marqueApi;
