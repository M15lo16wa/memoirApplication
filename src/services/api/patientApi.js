import axios from "axios";

const API_URL = "http://localhost:3000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
})

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
        console.log('[patientApi] Token utilisé pour Authorization:', usedToken);
        return config;
    },
    (error) => Promise.reject(error)
);

// 1-) affichage de tous les patients
export const getPatients = async () => {
    try {
        const response = await api.get(`/patient`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 2-) affichage d'un patient
export const getPatient = async(id) => {
    try{
        const response = await api.get(`/patient/${id}`);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 3-) creation d'un patient
export const createPatient = async(patient) => {
    try{
        const response = await api.post(`/patient`, patient);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 4-) mise a jour d'un patient
export const updatePatient = async(id, patient) => {
    try{
        const response = await api.put(`/patient/${id}`, patient);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 5-) suppression d'un patient
export const deletePatient = async(id) => {
    try{
        const response = await api.delete(`/patient/${id}`);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 6-) connexion d'un patient
export const loginPatient = async(patient) => {
    try{
        const response = await api.post(`/patient/auth/login`, patient);
        return response.data;
    }catch(error){
        throw error;
    }
};

export default {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    loginPatient   
};
