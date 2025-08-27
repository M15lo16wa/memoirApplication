import axios from "axios";

const API_URL = "http://localhost:3001/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

// Intercepteur pour ajouter le token à chaque requête
// PRIORITÉ : Token patient (JWT) pour accéder aux données patient
api.interceptors.request.use(
    (config) => {
        // recuperation du token
        const candidates = [
            localStorage.getItem('originalJWT'),
            localStorage.getItem('firstConnectionToken'),
            localStorage.getItem('jwt'),
            localStorage.getItem('token'),
        ];
        
        let usedToken = null;
        for (const candidate of candidates) {
            if (
                candidate &&
                candidate.startsWith('eyJ') &&
                candidate.length > 100 &&
                !candidate.startsWith('temp_') &&
                !candidate.startsWith('auth_')
            ) {
                usedToken = candidate;
                break;
            }
        }
        
        if (usedToken) {
            config.headers.Authorization = `Bearer ${usedToken}`;
            console.log('[patientApi] JWT valide utilisé pour Authorization:', `${usedToken.substring(0, 20)}...`);
        } else {
            console.warn('[patientApi] Aucun JWT valide disponible pour l\'authentification');
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// creation de rendez-vous
export const createRendezVous = async (rendezVous) => {
    try {
        const startTime = Date.now();
        const response = await api.post('/rendez-vous', rendezVous);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Retourner les informations de statut du serveur
        return {
            success: true,
            status: response.status,
            statusCode: response.status,
            responseTime: responseTime,
            responseSize: JSON.stringify(response.data).length,
            data: response.data,
            message: 'Rendez-vous créé avec succès'
        };
    } catch (error) {
        console.error('Erreur lors de la création du rendez-vous:', error);
        return {
            success: false,
            status: error.response?.status || 500,
            statusCode: error.response?.status || 500,
            error: error.message,
            message: error.response?.data?.message || 'Erreur lors de la création du rendez-vous'
        };
    }
};

// affichage des rendez-vous
export const getRendezVous = async (id) => {
    const response = await api.get(`/rendez-vous/${id}`);
    return response.data;
};

// affichage des rendez-vous par patient
export const updateRendezVous = async (id, rendezVous) => {
    const response = await api.put(`/rendez-vous/${id}`, rendezVous);
    return response.data;
};

// suppression des rendez-vous
export const deleteRendezVous = async (id) => {
    const response = await api.delete(`/rendez-vous/${id}`);
}

// prendre un rendez-vous
export const prendreRendezVous = async (id, rendezVous) => {
    const response = await api.put(`/rendez-vous/${id}/prendre`, rendezVous);
    return response.data;
}

// recuperation de la listes de medecins
export const getMedecins = async (id) => {
    const response = await api.get(`/professionnelSante/${id}`);
    return response.data;
}

// recuperation de tous les professionnels de santé
export const getAllProfessionnelsSante = async () => {
    try {
        const response = await api.get('/professionnelSante');
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des professionnels de santé:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// liste de toutes les fonctions:

const rendezVousApi = {
    createRendezVous,
    getRendezVous,
    updateRendezVous,
    deleteRendezVous,
    prendreRendezVous,
    getAllProfessionnelsSante,
}

export default rendezVousApi;
