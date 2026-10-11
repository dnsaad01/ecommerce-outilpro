import api from './axios';

const villeApi = {
    getAll: () => api.get('/villes').then((res) => res.data),
    create: (payload) => api.post('/villes', payload).then((res) => res.data),
    update: (id, payload) => api.put(`/villes/${id}`, payload).then((res) => res.data),
    delete: (id) => api.delete(`/villes/${id}`),
};

export default villeApi;
