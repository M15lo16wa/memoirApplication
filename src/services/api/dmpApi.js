import axios from "axios";

const API_URL = "http://localhost:3000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

// Intercepteur pour ajouter le token JWT patient
api.interceptors.request.use(
    (config) => {
        const jwtToken = localStorage.getItem('jwt');
        if (jwtToken) {
            config.headers.Authorization = `Bearer ${jwtToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ================================
// CATÉGORIE 1 : LE CŒUR DU DMP
// ================================

// 1. Tableau de Bord Personnalisé
export const getTableauDeBord = async () => {
    try {
        const response = await api.get('/patient/dmp/tableau-de-bord');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la récupération du tableau de bord";
    }
};

// 2. Historique Médical Complet
export const getHistoriqueMedical = async (params = {}) => {
    try {
        const response = await api.get('/patient/dmp/historique-medical', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la récupération de l'historique médical";
    }
};

// 3. Journal d'Activité et de Consentement
export const getJournalActivite = async (params = {}) => {
    try {
        const response = await api.get('/patient/dmp/journal-activite', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la récupération du journal d'activité";
    }
};

// ================================
// CATÉGORIE 2 : GESTION ACTIVE
// ================================

// 4. Gestion des Droits d'Accès
export const getDroitsAcces = async () => {
    try {
        const response = await api.get('/patient/dmp/droits-acces');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la récupération des droits d'accès";
    }
};

export const autoriserAcces = async (professionnelId, permissions) => {
    try {
        const response = await api.post('/patient/dmp/autoriser-acces', {
            professionnel_id: professionnelId,
            permissions
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de l'autorisation d'accès";
    }
};

export const revoquerAcces = async (professionnelId) => {
    try {
        const response = await api.delete(`/patient/dmp/revoquer-acces/${professionnelId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la révocation d'accès";
    }
};

// 5. Ajout d'Informations par le Patient
export const updateInformationsPersonnelles = async (informations) => {
    try {
        const response = await api.patch('/patient/dmp/informations-personnelles', informations);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la mise à jour des informations";
    }
};

export const ajouterAutoMesure = async (autoMesure) => {
    try {
        const response = await api.post('/patient/dmp/auto-mesures', autoMesure);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de l'ajout de l'auto-mesure";
    }
};

// 6. Upload de Documents Personnels
export const uploadDocument = async (formData) => {
    try {
        const response = await api.post('/patient/dmp/upload-document', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de l'upload du document";
    }
};

// ================================
// CATÉGORIE 3 : INTERACTION ET SERVICES
// ================================

// 7. Gestion des Rendez-vous
export const getRendezVous = async (params = {}) => {
    try {
        const response = await api.get('/patient/dmp/rendez-vous', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la récupération des rendez-vous";
    }
};

// 8. Messagerie Sécurisée Patient-Médecin
export const envoyerMessage = async (message) => {
    try {
        const response = await api.post('/patient/dmp/messagerie', message);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de l'envoi du message";
    }
};

export const getMessages = async (params = {}) => {
    try {
        const response = await api.get('/patient/dmp/messagerie', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la récupération des messages";
    }
};

// ================================
// CATÉGORIE 4 : AUTONOMISATION ET PRÉVENTION
// ================================

// 9. Fiche d'Urgence Imprimable / QR Code
export const getFicheUrgence = async () => {
    try {
        const response = await api.get('/patient/dmp/fiche-urgence');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la génération de la fiche d'urgence";
    }
};

// 10. Rappels et Plan de Soins Personnalisé
export const getRappels = async (params = {}) => {
    try {
        const response = await api.get('/patient/dmp/rappels', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la récupération des rappels";
    }
};

export const creerRappel = async (rappel) => {
    try {
        const response = await api.post('/patient/dmp/rappels', rappel);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la création du rappel";
    }
};

// 11. Bibliothèque de Santé
export const getBibliothequeSante = async (params = {}) => {
    try {
        const response = await api.get('/patient/dmp/bibliotheque-sante', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la récupération de la bibliothèque de santé";
    }
};

// 12. Statistiques du DMP
export const getStatistiques = async () => {
    try {
        const response = await api.get('/patient/dmp/statistiques');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la récupération des statistiques";
    }
};

// ================================
// UTILITAIRES
// ================================

// Fonction pour télécharger un document
export const telechargerDocument = async (documentId) => {
    try {
        const response = await api.get(`/patient/dmp/documents/${documentId}/download`, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors du téléchargement du document";
    }
};

// Fonction pour supprimer un document
export const supprimerDocument = async (documentId) => {
    try {
        const response = await api.delete(`/patient/dmp/documents/${documentId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la suppression du document";
    }
};

// Fonction pour marquer un rappel comme terminé
export const marquerRappelTermine = async (rappelId) => {
    try {
        const response = await api.patch(`/patient/dmp/rappels/${rappelId}/termine`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la mise à jour du rappel";
    }
};

// Export par défaut
const dmpApi = {
    // Catégorie 1
    getTableauDeBord,
    getHistoriqueMedical,
    getJournalActivite,
    
    // Catégorie 2
    getDroitsAcces,
    autoriserAcces,
    revoquerAcces,
    updateInformationsPersonnelles,
    ajouterAutoMesure,
    uploadDocument,
    
    // Catégorie 3
    getRendezVous,
    envoyerMessage,
    getMessages,
    
    // Catégorie 4
    getFicheUrgence,
    getRappels,
    creerRappel,
    getBibliothequeSante,
    getStatistiques,
    
    // Utilitaires
    telechargerDocument,
    supprimerDocument,
    marquerRappelTermine
};

export default dmpApi; 