import axios from "axios";

const API_URL = "http://192.168.4.81:3000/api";

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
    try {
        const response = await api.delete(`/rendez-vous/${id}`);
        return {
            success: true,
            message: 'Rendez-vous supprimé avec succès'
        };
    } catch (error) {
        console.error('Erreur lors de la suppression du rendez-vous:', error);
        return {
            success: false,
            error: error.message,
            message: 'Erreur lors de la suppression du rendez-vous'
        };
    }
}

// prendre un rendez-vous
export const prendreRendezVous = async (id, rendezVous) => {
    return (await api.put(`/rendez-vous/${id}/prendre`, rendezVous)).data;
}

// recuperation de la listes de medecins
export const getMedecins = async (id) => {
    return (await api.get(`/professionnelSante/${id}`)).data;
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

// --- NOUVELLES FONCTIONS POUR LE TABLEAU DE BORD MÉDECIN ---

// Récupérer les patients d'un médecin
export const getPatientsByMedecin = async (medecinId) => {
    try {
        const response = await api.get(`/medecin/${medecinId}/patients`);
        return {
            success: true,
            data: { patients: response.data }
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des patients:', error);
        return {
            success: false,
            error: error.message,
            data: { patients: [] }
        };
    }
};

// Récupérer les rendez-vous d'un médecin
export const getRendezVousByMedecin = async (medecinId) => {
    try {
        const response = await api.get(`/medecin/${medecinId}/rendez-vous`);
        return {
            success: true,
            data: { rendezVous: response.data }
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        return {
            success: false,
            error: error.message,
            data: { rendezVous: [] }
        };
    }
};

// Récupérer les messages récents d'un médecin
export const getMessagesRecents = async (medecinId) => {
    try {
        const response = await api.get(`/medecin/${medecinId}/messages`);
        return {
            success: true,
            data: { messages: response.data }
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        return {
            success: false,
            error: error.message,
            data: { messages: [] }
        };
    }
};

// Récupérer les notifications d'un médecin
export const getNotificationsByMedecin = async (medecinId) => {
    try {
        const response = await api.get(`/medecin/${medecinId}/notifications`);
        return {
            success: true,
            data: { notifications: response.data }
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        return {
            success: false,
            error: error.message,
            data: { notifications: [] }
        };
    }
};

// Récupérer tous les rendez-vous (pour l'agenda)
export const getAllRendezVous = async () => {
    try {
        const response = await api.get('/rendez-vous');
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        
        // Gérer les erreurs spécifiques
        if (error.response) {
            if (error.response.status === 401) {
                return {
                    success: false,
                    status: 401,
                    error: 'Erreur d\'authentification - Token invalide ou expiré',
                    data: []
                };
            } else if (error.response.status === 403) {
                return {
                    success: false,
                    status: 403,
                    error: 'Accès interdit - Permissions insuffisantes',
                    data: []
                };
            } else if (error.response.status === 404) {
                return {
                    success: false,
                    status: 404,
                    error: 'Endpoint non trouvé',
                    data: []
                };
            }
        }
        
        return {
            success: false,
            status: error.response?.status || 500,
            error: error.message,
            data: []
        };
    }
};

// Récupérer les rendez-vous d'un médecin spécifique (pour l'agenda)
export const getRendezVousByMedecinForAgenda = async (medecinId) => {
    try {
        const response = await api.get(`/rendez-vous/medecin/${medecinId}`);
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous du médecin:', error);
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
};

// Récupérer les rendez-vous d'un patient spécifique
export const getRendezVousByPatient = async (patientId) => {
    try {
        console.log('🔍 Récupération des rendez-vous pour le patient:', patientId);
        
        // Essayer d'abord l'endpoint spécifique patient
        try {
            const response = await api.get(`/rendez-vous/patient/${patientId}`);
            console.log('📅 Rendez-vous récupérés via endpoint patient:', response.data);
            return response.data;
        } catch (patientError) {
            console.log('⚠️ Endpoint patient non disponible, essai avec endpoint général...');
            
            // Fallback : utiliser l'endpoint général et filtrer côté client
            if (patientError.response?.status === 404) {
                try {
                    const allRendezVousResponse = await api.get('/rendez-vous');
                    console.log('📅 Tous les rendez-vous récupérés:', allRendezVousResponse.data);
                    
                    // Filtrer les rendez-vous pour ce patient
                    const allRendezVous = allRendezVousResponse.data?.data || allRendezVousResponse.data || [];
                    const patientRendezVous = allRendezVous.filter(rdv => 
                        rdv.patient_id === patientId || 
                        rdv.patientId === patientId || 
                        rdv.patient?.id === patientId ||
                        rdv.patient?.id_patient === patientId
                    );
                    
                    console.log('📅 Rendez-vous filtrés pour le patient:', patientRendezVous);
                    
                    return {
                        success: true,
                        data: patientRendezVous,
                        message: `${patientRendezVous.length} rendez-vous trouvé(s) pour ce patient`
                    };
                } catch (fallbackError) {
                    console.error('❌ Erreur lors du fallback:', fallbackError);
                    throw fallbackError;
                }
            } else {
                throw patientError;
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des rendez-vous du patient:', error);
        
        // Gérer les erreurs spécifiques
        if (error.response) {
            if (error.response.status === 404) {
                return {
                    success: true,
                    data: [],
                    message: 'Aucun rendez-vous trouvé pour ce patient'
                };
            } else if (error.response.status === 403) {
                return {
                    success: false,
                    data: [],
                    message: 'Accès non autorisé aux rendez-vous'
                };
            }
        }
        
        // Retourner une réponse d'erreur standardisée
        return {
            success: false,
            data: [],
            message: error.message || 'Erreur lors de la récupération des rendez-vous'
        };
    }
};

// liste de toutes les fonctions:
const rendezVousApi = {
    createRendezVous,
    getRendezVous,
    updateRendezVous,
    deleteRendezVous,
    prendreRendezVous,
    getAllProfessionnelsSante,
    // Nouvelles fonctions pour le tableau de bord médecin
    getPatientsByMedecin,
    getRendezVousByMedecin,
    getMessagesRecents,
    getNotificationsByMedecin,
    getAllRendezVous,
    getRendezVousByMedecinForAgenda,
    // Nouvelle fonction pour récupérer les rendez-vous d'un patient
    getRendezVousByPatient,
}

export default rendezVousApi;
