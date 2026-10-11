import api from './axios';

const statsApi = {
    getDashboard: () => api.get('/stats/dashboard').then((res) => res.data),
};

export default statsApi;
