import api from './axios';

const uploadApi = {
    // fichier : un objet File (venant d'un <input type="file">)
    // axios détecte un FormData et fixe automatiquement le header
    // multipart/form-data avec le bon boundary — pas besoin de le faire à la main.
    uploadImage: (fichier) => {
        const formData = new FormData();
        formData.append('file', fichier);
        return api.post('/uploads/image', formData).then((res) => res.data); // { url: "..." }
    },
};

export default uploadApi;
