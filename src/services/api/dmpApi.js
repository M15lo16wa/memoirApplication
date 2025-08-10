import axios from "axios";

// L'URL de base de votre API.
const API_URL = "http://localhost:3000/api";

const dmpApi = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

// L'intercepteur pour ajouter le token JWT à chaque requête.
dmpApi.interceptors.request.use(
    (config) => {
        const jwtToken = localStorage.getItem('jwt');
        const generalToken = localStorage.getItem('token');
        if (jwtToken) {
            config.headers.Authorization = `Bearer ${jwtToken}`;
        } else if (generalToken) {
            config.headers.Authorization = `Bearer ${generalToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// =================================================================
//                 FONCTIONS API CONNECTÉES
// =================================================================

// ===== PATIENT - Notifications & Accès =====
// export const getDroitsAccesNotifications = () => dmpApi.get('/access/patient/pending');
/**
 * @description Récupère les demandes d'accès en attente pour le patient connecté.
 * @returns {Promise<Array>} Une liste de notifications/demandes d'accès.
 */
export const getPendingAccessRequests = async () => {
    try {
        const response = await dmpApi.get('/access/patient/pending');
        return response.data.data.pendingRequests;
    } catch (error) {
        console.error("Erreur lors de la récupération des demandes d'accès :", error.response?.data || error.message);
        throw error.response?.data || new Error("Impossible de charger les demandes.");
    }
};
export const marquerNotificationDroitsAccesLue = (notificationId) => dmpApi.patch(`/patient/notifications/${notificationId}/mark-as-read`);
// export const repondreDemandeAcces = (autorisationId, reponse, commentaire = '') => dmpApi.patch(`/access/patient/reponse/${autorisationId}`, { response: reponse, comment: commentaire });
/**
 * @description Envoie la réponse du patient (acceptation ou refus) à une demande d'accès.
 * @param {number} authorizationId - L'ID de la demande d'autorisation (reçu via getPendingAccessRequests).
 * @param {'accept' | 'refuse'} response - La décision du patient.
 * @param {string} [comment] - Un commentaire optionnel (surtout en cas de refus).
 * @returns {Promise<Object>} L'objet autorisation mis à jour.
 */
export const respondToAccessRequest = async (authorizationId, decision, comment = '') => {
    try {
        const res = await dmpApi.patch(`/access/patient/response/${authorizationId}`, {
            response: decision,
            comment,
        });
        return res.data;
    } catch (error) {
        console.error("Erreur lors de la réponse à la demande d'accès :", error.response?.data || error.message);
        throw error.response?.data || new Error("La réponse n'a pas pu être envoyée.");
    }
}
export const getAutorisations = () => dmpApi.get('/access/patient/authorizations');

// ===== PATIENT - Notifications avancées =====
export const getNotificationsStats = () => dmpApi.get('/patient/notifications/stats');
export const marquerToutesNotificationsLues = () => dmpApi.put('/patient/notifications/mark-all-read');
export const getNotificationDetails = (notificationId) => dmpApi.get(`/patient/notifications/${notificationId}`);

// ===== PATIENT - Données du DMP =====
export const getDMP = async () => {
    const res = await dmpApi.get('/patient/auth/me');
    return { data: res.data };
};
export const updateDMP = async (dmpData) => {
    try {
        const res = await dmpApi.put('/patient/me/dmp', dmpData);
        return res.data;
    } catch (error) {
        console.warn("updateDMP non supporté sur l'API actuelle");
        throw error.response?.data || new Error('Mise à jour DMP non supportée');
    }
};
export const getTableauDeBord = async () => {
    try {
        const res = await dmpApi.get('/patient/dashboard');
        return res; // garder la forme AxiosResponse
    } catch (error) {
        // Fallback: construire un tableau minimal depuis le profil
        const profil = await dmpApi.get('/patient/auth/me');
        return { data: { tableau_de_bord: { patient: profil.data } } };
    }
};
export const getHistoriqueMedical = () => dmpApi.get('/access/patient/history');
export const addHistoriqueEntry = (entry) => dmpApi.post('/dossierMedical/patient/me/history', entry);
export const getJournalActivite = (filters = {}) => dmpApi.get('/patient/me/activity-log', { params: filters });
export const getDocumentsDMP = async (type = null) => {
    const params = type ? { type } : {};
    try {
        const res = await dmpApi.get('/patient/me/documents', { params });
        return res;
    } catch (error) {
        if (error.response?.status === 404) {
            return { data: [] };
        }
        throw error;
    }
};
export const getAutoMesuresDMP = async (type = null) => {
    const params = type ? { type } : {};
    try {
        const res = await dmpApi.get('/patient/me/automesures', { params });
        return res;
    } catch (error) {
        if (error.response?.status === 404) {
            return { data: [] };
        }
        throw error;
    }
};
export const getRappels = () => dmpApi.get('/patient/me/rappels');
export const createAutoMesureDMP = (mesureData) => dmpApi.post('/patient/me/automesures', mesureData);
export const uploadDocumentDMP = (formData) => dmpApi.post('/patient/me/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// ===== PATIENT - Droits d'accès =====
export const getDroitsAcces = () => dmpApi.get('/patient/me/access-rights');
export const updateDroitsAcces = (droits) => dmpApi.put('/patient/me/access-rights', droits);

// ===== PATIENT - Rendez-vous =====
export const getRendezVousDMP = () => dmpApi.get('/patient/me/appointments');
export const createRendezVousDMP = (rdvData) => dmpApi.post('/patient/me/appointments', rdvData);

// ===== PATIENT - Bibliothèque et statistiques =====
export const getBibliothequeSante = () => dmpApi.get('/patient/me/health-library');
export const getStatistiquesDMP = (periode = '30j') => dmpApi.get('/patient/me/statistics', { params: { periode } });

// ===== PATIENT - Autorisations =====
export const createDirectAutorisation = (autorisationData) => dmpApi.post('/patient/me/authorizations', autorisationData);
export const accepterAutorisation = (autorisationId, commentaire = '') => dmpApi.post(`/patient/me/authorizations/${autorisationId}/accept`, { commentaire });
export const refuserAutorisation = (autorisationId, raisonRefus) => dmpApi.post(`/patient/me/authorizations/${autorisationId}/refuse`, { raison_refus: raisonRefus });

// ===== MÉDECIN - Authentification & Demande d'Accès =====
export const authenticateCPS = async (cpsData) => {
    const response = await dmpApi.post('/auth/authenticate-cps', cpsData);
    if (response.data?.data?.token) {
        console.log('✅ Nouveau token de session reçu, mise à jour du localStorage.');
        localStorage.setItem('jwt', response.data.data.token);
    }
    return response.data;
};
export const requestDMPAccess = (accessData) => dmpApi.post('/access/request-standard', accessData);
export const requestStandardAccess = (accessData) => dmpApi.post('/access/request-standard', accessData);
export const grantEmergencyAccess = (accessData) => dmpApi.post('/access/grant-emergency', accessData);
export const grantSecretAccess = (accessData) => dmpApi.post('/access/grant-secret', accessData);

// ===== MÉDECIN - Sessions et accès =====
export const testDMPSystem = () => dmpApi.get('/medecin/dmp/test/systeme');
export const createDMPSession = (sessionData) => dmpApi.post('/medecin/dmp/creer-session', sessionData);
export const getDMPNotifications = (sessionId) => dmpApi.get(`/medecin/dmp/notifications/${sessionId}`);
export const validateDMPSession = (sessionId) => dmpApi.get(`/medecin/dmp/session/${sessionId}/statut`);
export const closeDMPSession = (sessionId) => dmpApi.post(`/medecin/dmp/session/${sessionId}/fermer`);
export const getAutorisationsDemandees = () => dmpApi.get('/medecin/dmp/autorisations');

// ===== GÉNÉRAL - Vérification d'accès =====
export const verifierAcces = (professionnelId, patientId) => dmpApi.get('/dmp/verifier-acces', {
    params: { professionnel_id: professionnelId, patient_id: patientId }
});
export const getDureeRestante = (autorisationId) => dmpApi.get(`/dmp/autorisations/${autorisationId}/duree-restante`);
export const getDMPAccessHistory = (patientId) => dmpApi.get(`/history/patient/${patientId}`);

// ===== MÉDECIN - Statut d'accès au DMP =====

/**
 * @description Récupère le statut d'accès actuel d'un professionnel pour un patient donné.
 * @param {number} patientId L'ID du patient.
 * @returns {Promise<{accessStatus: string, authorization: object|null}>} Un objet contenant le statut et l'autorisation.
 */
export const getAccessStatus = async (patientId) => {
    try {
        // Revenir à la vérification via /dmp/verifier-acces si la route spécifique n'est pas disponible
        const response = await dmpApi.get('/dmp/verifier-acces', {
            params: { patient_id: patientId }
        });
        const data = response?.data?.data || response?.data || {};
        // Normaliser en status
        const authorized = data.acces_autorise === true;
        return { status: authorized ? 'authorized' : 'not_authorized', ...data };
    } catch (error) {
        console.error("Erreur lors de la récupération du statut d'accès :", error.response?.data || error.message);
        throw error.response?.data || new Error("Impossible de récupérer le statut d'accès.");
    }
};

// ===== MÉDECIN - Récupération des données patient (après autorisation) =====
/**
 * Récupère le résumé DMP du patient pour affichage côté médecin.
 * Selon l'implémentation backend, le patientId peut être passé en query.
 */
export const getPatientDMPForMedecin = async (patientId) => {
    const params = patientId ? { patient_id: patientId } : {};
    const res = await dmpApi.get('/patient/dmp', { params });
    return res?.data?.data || res?.data || {};
};

/**
 * Récupère les documents du patient côté médecin.
 */
export const getPatientDocumentsForMedecin = async (patientId, type = null) => {
    const params = { ...(patientId ? { patient_id: patientId } : {}), ...(type ? { type } : {}) };
    const res = await dmpApi.get('/patient/dmp/documents', { params });
    return res?.data?.data?.documents || res?.data?.documents || res?.data || [];
};

/**
 * Récupère les auto-mesures du patient côté médecin.
 */
export const getPatientAutoMesuresForMedecin = async (patientId, type = null) => {
    const params = { ...(patientId ? { patient_id: patientId } : {}), ...(type ? { type } : {}) };
    const res = await dmpApi.get('/patient/dmp/auto-mesures', { params });
    return res?.data?.data?.mesures || res?.data?.mesures || res?.data || [];
};

/**
 * Récupère les autorisations liées au patient (vue médecin).
 */
export const getPatientAutorisationsForMedecin = async (patientId) => {
    const params = patientId ? { patient_id: patientId } : {};
    const res = await dmpApi.get('/patient/dmp/autorisations', { params });
    return res?.data?.data || res?.data || [];
};

// ===== FONCTIONS DE VALIDATION ET UTILITAIRES =====
export const validateNewAccessRequest = (data) => {
    const errors = [];
    if (!data.patient_id) {
        errors.push('L\'ID du patient est requis');
    }
    if (!data.raison_demande || data.raison_demande.length < 10) {
        errors.push('La raison doit faire au moins 10 caractères');
    }
    return { valid: errors.length === 0, errors };
};

export const validateCPS = (code) => {
    return /^\d{4}$/.test(code);
};

export const validateDirectAutorisation = (data) => {
    const errors = [];
    if (!data.professionnel_id) {
        errors.push('L\'ID du professionnel est requis');
    }
    if (!data.duree_validite) {
        errors.push('La durée de validité est requise');
    }
    return { valid: errors.length === 0, errors };
};

export const verifierAutorisationExistence = async (autorisationId) => {
    try {
        const response = await dmpApi.get(`/dmp/autorisations/${autorisationId}/verifier`);
        return response.data.exists;
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'autorisation:', error);
        return false;
    }
};

export const findAutorisationIdFromNotification = async (notification) => {
    try {
        const response = await dmpApi.post('/dmp/notifications/find-autorisation', { notification });
        return response.data.autorisation_id;
    } catch (error) {
        console.error('Erreur lors de la recherche de l\'autorisation:', error);
        return null;
    }
};

// =================================================================
//      EXPORTATION PAR DÉFAUT
// =================================================================

const dmpApiExports = {
    // Authentification et accès
    authenticateCPS,
    requestDMPAccess,
    requestStandardAccess,
    grantEmergencyAccess,
    grantSecretAccess,
    
    // Notifications et autorisations
    getPendingAccessRequests,
    marquerNotificationDroitsAccesLue,
    marquerToutesNotificationsLues,
    getNotificationsStats,
    getNotificationDetails,
    respondToAccessRequest,
    getAutorisations,
    accepterAutorisation,
    refuserAutorisation,
    createDirectAutorisation,
    
    // Données DMP
    getDMP,
    updateDMP,
    getTableauDeBord,
    getHistoriqueMedical,
    addHistoriqueEntry,
    getJournalActivite,
    getDocumentsDMP,
    getAutoMesuresDMP,
    getRappels,
    createAutoMesureDMP,
    uploadDocumentDMP,
    
    // Droits d'accès
    getDroitsAcces,
    updateDroitsAcces,
    
    // Rendez-vous
    getRendezVousDMP,
    createRendezVousDMP,
    
    // Bibliothèque et statistiques
    getBibliothequeSante,
    getStatistiquesDMP,
    
    // Sessions et accès
    testDMPSystem,
    createDMPSession,
    getDMPNotifications,
    validateDMPSession,
    closeDMPSession,
    getAutorisationsDemandees,
    
    // Vérifications
    verifierAcces,
    getDureeRestante,
    getDMPAccessHistory,
    getAccessStatus,
    verifierAutorisationExistence,
    findAutorisationIdFromNotification,
    
    // Validation
    validateNewAccessRequest,
    validateCPS,
    validateDirectAutorisation
};

export default dmpApiExports;
