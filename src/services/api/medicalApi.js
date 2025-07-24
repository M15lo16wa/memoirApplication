import  axios from "axios";

const API_URL = "http://localhost:3000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

// 1-) affichage de tous les dossiers medicaux
export const getMedicals = () => {
    try{
        const response = api.get(`${API_URL}/medical`);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 2-) affichage d'un dossier medical
export const getMedical = (id) => {
    try{
        const response = api.get(`${API_URL}/medical/${id}`);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 3-) creation d'un dossier medical
export const createMedical = (medical) => {
    try{
        const response = api.post(`${API_URL}/medical`, medical);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 4-) mise a jour d'un dossier medical
export const updateMedical = (id, medical) => {
    try{
        const response = api.put(`${API_URL}/medical/${id}`, medical);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 5-) suppression d'un dossier medical
export const deleteMedical = (id) => {
    try{
        const response = api.delete(`${API_URL}/medical/${id}`);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 6-) recherche d'un dossier medical
// const searchMedical = (query) => {
//     return api.get(`${API_URL}/medical/search?query=${query}`);
// };

export default {
    getMedicals,
    getMedical,
    createMedical,
    updateMedical,
    deleteMedical,
    // searchMedical
};
