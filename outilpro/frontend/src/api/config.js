import api from './axios';

// Config publique (actuellement : juste le mode maintenance) -- voir ConfigController
// côté backend. Appelé une fois au chargement de l'app (voir App.jsx).
const configApi = {
    get: () => api.get('/config').then((res) => res.data),
};

export default configApi;
