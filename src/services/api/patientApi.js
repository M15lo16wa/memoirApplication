import axios from "axios";

const API_URL = "http://localhost:3000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

// 1-) affichage de tous les patients
export const getPatients = async(patient) => {
    try{
        const response = await api.post(`${API_URL}/patient`, patient);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 2-) affichage d'un patient
export const getPatient = async(id) => {
    try{
        const response = await api.get(`${API_URL}/patient/${id}`);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 3-) creation d'un patient
export const createPatient = async(patient) => {
    try{
        const response = await api.post(`${API_URL}/patient`, patient);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 4-) mise a jour d'un patient
export const updatePatient = async(id, patient) => {
    try{
        const response = await api.put(`${API_URL}/patient/${id}`, patient);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 5-) suppression d'un patient
export const deletePatient = async(id) => {
    try{
        const response = await api.delete(`${API_URL}/patient/${id}`);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 6-) connexion d'un patient
export const loginPatient = async(patient) => {
    try{
        const response = await api.post(`${API_URL}/patient/auth/login`, patient);
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
