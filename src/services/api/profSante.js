import axios from "axios";

const API_URL = "http://localhost:3000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        // Priorité au token patient (JWT)
        const jwtToken = localStorage.getItem('jwt');
        const token = localStorage.getItem('token');
        let usedToken = null;
        if (jwtToken) {
            config.headers.Authorization = `Bearer ${jwtToken}`;
            usedToken = jwtToken;
        } else if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            usedToken = token;
        }
        console.log('[adminApi] Token utilisé pour Authorization:', usedToken);
        return config;
    },
    (error) => Promise.reject(error)
);

// 1-)affichage des professionnels de sante
export const getProfSante = async () => {
    try{
        const response = await api.get('/professionnelSante');
        return response.data;
    }catch(error){
        throw error;
    }
}

// 2-)affichage d'un professionnel de sante
export const getProfSanteById = async (id) => {
    try{
        const response = await api.get(`/professionnelSante/${id}`);
        return response.data;
    }catch(error){
        throw error;
    }
}

// 3-)creation d'un professionnel de sante
export const createProfSante = async (profSante) => {
    try{
        const response = await api.post('/professionnelSante', profSante);
        return response.data;
    }catch(error){
        throw error;
    }
}

// 4-)modification d'un professionnel de sante
export const updateProfSante = async (id, profSante) => {
    try{
        const response = await api.put(`/professionnelSante/${id}`, profSante);
        return response.data;
    }catch(error){
        throw error;
    }
}

// 5-)suppression d'un professionnel de sante
export const deleteProfSante = async (id) => {
    try{
        const response = await api.delete(`/professionnelSante/${id}`);
        return response.data;
    }catch(error){
        throw error;
    }
}