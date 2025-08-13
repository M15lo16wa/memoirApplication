import axios from "axios";

const API_URL = "http://localhost:3000/api";

// Fonction utilitaire pour récupérer le patient connecté
const getStoredPatient = () => {
    try {
        const patient = localStorage.getItem("patient");
        return patient ? JSON.parse(patient) : null;
    } catch (error) {
        console.error('Erreur lors du parsing des données patient:', error);
        return null;
    }
};

const dmpApi = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
} );

// Intercepteur pour le token JWT
dmpApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwt') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// =================================================================
//                 API POUR LES PATIENTS
// =================================================================
export const getPendingAccessRequests = () => dmpApi.get('/access/patient/pending');
export const respondToAccessRequest = (id, decision, comment) => dmpApi.patch(`/access/patient/response/${id}`, { response: decision, comment });
export const getPatientAuthorizations = () => dmpApi.get('/access/patient/authorizations');
export const getPatientAccessHistory = () => dmpApi.get('/access/patient/history');

// =================================================================
//                 API POUR LES MÉDECINS
// =================================================================

// --- Authentification et Demande d'Accès ---
export const authenticateCPS = (cpsData) => dmpApi.post('/auth/authenticate-cps', cpsData);
export const requestStandardAccess = (accessData) => dmpApi.post('/access/request-standard', accessData);

/**
 * (Médecin) Récupère le statut d'accès actuel pour un patient donné.
 * @param {number} patientId L'ID du patient.
 * @returns {Promise<{accessStatus: string, authorization: object|null}>}
 */
export const getAccessStatus = async (patientId) => {
    try {
        if (patientId && patientId !== 'undefined') {
            // Pour les médecins : vérifier le statut d'accès à un patient spécifique
            const response = await dmpApi.get(`/access/status/${patientId}`);
            return {
                accessStatus: response.data.data.status,
                authorization: null // Le statut est déjà filtré côté backend
            };
        } else {
            // Pour les patients : récupérer leur propre statut d'accès
            const response = await dmpApi.get('/access/patient/status');
            const data = response.data.data;
            
            // Retourner une structure cohérente
            return {
                accessStatus: data.activeAuthorizations.length > 0 ? 'active' : 'no_access',
                authorization: data.activeAuthorizations[0] || null,
                // Informations supplémentaires disponibles
                summary: data.summary,
                allRequests: data.allRequests
            };
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du statut d\'accès:', error);
        throw error;
    }
};

/**
 * Fonction pour filtrer les accès par patient ID (si nécessaire côté frontend)
 * Note: Cette fonction peut être redondante car le backend filtre déjà les données
 */
const filterAccessByPatient = (accessData, patientId) => {
    if (!accessData || !patientId) return [];
    
    // Vérifier la structure des données
    let arr;
    if (Array.isArray(accessData)) {
        arr = accessData;
    } else if (accessData.authorizationAccess && Array.isArray(accessData.authorizationAccess)) {
        arr = accessData.authorizationAccess;
    } else if (accessData.allRequests && Array.isArray(accessData.allRequests)) {
        arr = accessData.allRequests;
    } else {
        console.warn('Structure de données inattendue:', accessData);
        return [];
    }
    
    console.log("Accès bruts:", arr);
    arr.forEach(acc => console.log("Clés accès:", Object.keys(acc), acc));
    
    // Filtrage par patient_id avec conversion en nombre
    return arr.filter(access => {
        const accessPatientId = Number(access.patient_id);
        const targetPatientId = Number(patientId);
        return accessPatientId === targetPatientId;
    });
};

/**
 * (Médecin) Récupère l'ensemble des données du dossier d'un patient de manière sécurisée.
 * Ne fonctionne que si une autorisation est active.
 * @param {number} patientId
 * @returns {Promise<object>} Un objet contenant toutes les données du dossier.
 */
export const getSecureDossierForMedecin = async (patientId) => {
    const response = await dmpApi.get(`/dossierMedical/patient/${patientId}/complet`);
    return response.data; // Renvoie directement les données du dossier
};

// --- Gestion des demandes envoyées (pour la page DMPDemandesAcces) ---
export const getSentAccessRequests = async () => {
    const response = await dmpApi.get('/access/authorizations/active');
    return response.data.data.authorizations;
};

// --- Gestion des demandes d'accès pour les médecins ---
export const getMedecinAccessRequests = async (patientId) => {
    try {
        // Utiliser la nouvelle route pour les patients
        const response = await dmpApi.get('/access/patient/status');
        const {data} = response.data.data;
        
        // Si nous avons un patientId spécifique, filtrer les résultats
        if (patientId && data && data.authorizationAccess) {
            const filteredAccess = data.authorizationAccess.filter(access => 
                access.patient_id === parseInt(patientId)
            );
            
            // Retourner la structure filtrée
            return {
                ...data,
                authorizationAccess: filteredAccess,
                total: filteredAccess.length
            };
        }
        
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des accès:', error);
        // En cas d'erreur, retourner un tableau vide
        return { authorizationAccess: [], total: 0 };
    }
};

// --- Gestion des demandes d'accès envoyées par le patient ---
export const getPatientSentAccessRequests = async (patientId) => {
    try {
        // Récupérer toutes les demandes d'accès
        const response = await dmpApi.get('/access/authorization');
        const allRequests = response.data.data;
        
        // Filtrer pour ne retourner que celles envoyées par le patient connecté
        if (Array.isArray(allRequests)) {
            return allRequests.filter(request => 
                request.patient_id === parseInt(patientId)
            );
        }
        
        return [];
    } catch (error) {
        console.error('Erreur lors de la récupération des demandes envoyées:', error);
        return [];
    }
};

// --- Récupération des accès d'un patient spécifique ---
export const getPatientAccessStatus = async (patientId) => {
    try {
        // Utiliser la route spécifique au patient si disponible
        const response = await dmpApi.get(`/access/patient/status/${patientId}`);
        return response.data.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du statut d\'accès du patient:', error);
        // Fallback vers la route générale
        try {
            const generalResponse = await dmpApi.get('/access/patient/status');
            const {data} = generalResponse.data.data;
            
            // Filtrer pour le patient spécifique
            if (data && data.authorizationAccess) {
                const patientAccess = data.authorizationAccess.filter(access => 
                    access.patient_id === parseInt(patientId)
                );
                
                return {
                    ...data,
                    authorizationAccess: patientAccess,
                    total: patientAccess.length
                };
            }
            
            return data;
        } catch (fallbackError) {
            console.error('Erreur lors du fallback:', fallbackError);
            return { authorizationAccess: [], total: 0 };
        }
    }
};

//---- Gestion des demande d'acces pour le medecin ----


// =================================================================
//                 FONCTIONS MANQUANTES POUR LES COMPOSANTS
// =================================================================

// --- Gestion des autorisations ---
export const getAutorisations = async (patientId = null) => {
    const url = patientId ? `/access/authorization/patient/${patientId}` : '/access/authorization';
    const response = await dmpApi.get(url);
    return response.data.data;
};

export const accepterAutorisation = async (autorisationId, commentaire) => {
    const response = await dmpApi.patch(`/access/authorization/${autorisationId}`, { 
        statut: 'actif', 
        commentaire 
    });
    return response.data.data;
};

export const refuserAutorisation = async (autorisationId, raisonRefus) => {
    const response = await dmpApi.patch(`/access/authorization/${autorisationId}`, { 
        statut: 'refuse', 
        raisonRefus 
    });
    return response.data.data;
};

// --- Notifications et statistiques ---
// Note: Ces endpoints n'existent pas dans l'API, on utilise les endpoints d'accès à la place
export const getNotificationsStats = async () => {
    // Utiliser l'historique des accès comme alternative
    const response = await dmpApi.get('/access/history/professional');
    return response.data.data;
};

export const marquerToutesNotificationsLues = async () => {
    // Cette fonctionnalité n'existe pas dans l'API
    console.warn('⚠️ Fonctionnalité non disponible dans l\'API');
    return { success: true };
};

export const marquerNotificationDroitsAccesLue = async (notificationId) => {
    // Marquer la notification comme traitée via l'API d'autorisation
    const response = await dmpApi.patch(`/access/authorization/${notificationId}`, { 
        statut: 'traite' 
    });
    return response.data.data;
};

// --- Historique et accès ---
export const getDMPAccessHistory = async (patientId) => {
    const response = await dmpApi.get(`/access/history/patient/${patientId}`);
    return response.data.data;
};

// --- Documents DMP ---
export const getDocumentsDMP = async (patientId = null, filters = {}) => {
    const url = patientId ? `/dossierMedical/patient/${patientId}/complet` : '/dossierMedical';
    const response = await dmpApi.get(url, { params: filters });
    return response.data.data;
};

export const uploadDocumentDMP = async (patientId, documentData) => {
    // Utiliser l'endpoint de mise à jour du dossier médical
    const response = await dmpApi.put(`/dossierMedical/${patientId}`, documentData);
    return response.data.data;
};

// --- Auto-mesures DMP ---
// Note: Les auto-mesures font partie du dossier médical
export const getAutoMesuresDMP = async (patientId = null, type = null) => {
    const url = patientId ? `/dossierMedical/patient/${patientId}/complet` : '/dossierMedical';
    const response = await dmpApi.get(url);
    // Extraire les auto-mesures du dossier médical
    const dossier = response.data.data;
    let autoMesures = dossier?.autoMesures || dossier?.auto_mesures || [];
    
    if (type) {
        autoMesures = autoMesures.filter(mesure => mesure.type === type || mesure.type_mesure === type);
    }
    
    return { data: autoMesures };
};

export const createAutoMesureDMP = async (patientId, mesureData) => {
    // Ajouter l'auto-mesure au dossier médical existant
    const response = await dmpApi.put(`/dossierMedical/${patientId}`, { 
        autoMesures: [mesureData] 
    });
    return response.data.data;
};

// --- DMP principal ---
export const getDMP = async (patientId = null) => {
    const url = patientId ? `/dossierMedical/patient/${patientId}/complet` : '/dossierMedical';
    const response = await dmpApi.get(url);
    return response.data.data;
};

export const updateDMP = async (patientId, dmpData) => {
    const response = await dmpApi.put(`/dossierMedical/${patientId}`, dmpData);
    return response.data.data;
};

// --- Historique médical ---
// Note: L'historique fait partie du dossier médical
export const getHistoriqueMedical = async (patientId = null) => {
    const url = patientId ? `/dossierMedical/patient/${patientId}/complet` : '/dossierMedical';
    const response = await dmpApi.get(url);
    // Extraire l'historique du dossier médical
    const dossier = response.data.data;
    return { data: dossier?.historique || dossier?.historiqueMedical || [] };
};

export const addHistoriqueEntry = async (patientId, entry) => {
    // Ajouter l'entrée à l'historique du dossier médical
    const response = await dmpApi.put(`/dossierMedical/${patientId}`, { 
        historique: [entry] 
    });
    return response.data.data;
};

// --- Journal d'activité ---
// Note: Le journal fait partie du dossier médical
export const getJournalActivite = async (patientId, filters = {}) => {
    const url = patientId ? `/dossierMedical/patient/${patientId}/complet` : '/dossierMedical';
    const response = await dmpApi.get(url);
    // Extraire le journal du dossier médical
    const dossier = response.data.data;
    let journal = dossier?.journal || dossier?.journalActivite || [];
    
    // Appliquer les filtres si nécessaire
    if (filters.date) {
        journal = journal.filter(entry => entry.date === filters.date);
    }
    
    return { data: journal };
};

// --- Droits d'accès ---
export const getDroitsAcces = async (patientId) => {
    const response = await dmpApi.get(`/access/authorization/patient/${patientId}`);
    return response.data.data;
};

export const updateDroitsAcces = async (patientId, droits) => {
    // Mettre à jour les droits d'accès via l'API d'autorisation
    const response = await dmpApi.put(`/access/authorization/patient/${patientId}`, droits);
    return response.data.data;
};

// --- Bibliothèque santé ---
// Note: La bibliothèque fait partie du dossier médical
export const getBibliothequeSante = async (patientId) => {
    const url = patientId ? `/dossierMedical/patient/${patientId}/complet` : '/dossierMedical';
    const response = await dmpApi.get(url);
    // Extraire la bibliothèque du dossier médical
    const dossier = response.data.data;
    return { data: dossier?.bibliotheque || dossier?.bibliothequeSante || [] };
};

// --- Statistiques DMP ---
// Note: Les statistiques sont calculées à partir du dossier médical
export const getStatistiquesDMP = async (patientId, periode = null) => {
    const url = patientId ? `/dossierMedical/patient/${patientId}/complet` : '/dossierMedical';
    const response = await dmpApi.get(url);
    // Extraire les données du dossier médical pour calculer les statistiques
    const dossier = response.data.data;
    
    // Calculer les statistiques basiques à partir des données disponibles
    const stats = {
        totalDocuments: dossier?.documents?.length || 0,
        totalAutoMesures: dossier?.autoMesures?.length || dossier?.auto_mesures?.length || 0,
        totalConsultations: dossier?.consultations?.length || 0,
        derniereMiseAJour: dossier?.derniereMiseAJour || new Date().toISOString()
    };
    
    return { data: stats };
};

// --- Rendez-vous DMP ---
export const getRendezVousDMP = async (patientId) => {
    const response = await dmpApi.get(`/rendez-vous/patient/${patientId}/avenir`);
    return response.data.data;
};

export const createRendezVousDMP = async (patientId, rdvData) => {
    const response = await dmpApi.post(`/rendez-vous`, { ...rdvData, patient_id: patientId });
    return response.data.data;
};

// --- Tableau de bord ---
// Note: Le tableau de bord est construit à partir du dossier médical
export const getTableauDeBord = async () => {
    // Récupérer le patient connecté depuis le localStorage
    const storedPatient = getStoredPatient();
    const patientId = storedPatient?.id_patient || storedPatient?.id;
    
    if (!patientId) {
        throw new Error('ID patient non disponible pour le tableau de bord');
    }
    
    const url = `/dossierMedical/patient/${patientId}/complet`;
    const response = await dmpApi.get(url);
    const dossier = response.data.data;
    
    // Construire le tableau de bord à partir des données du dossier
    const tableauDeBord = {
        resume: dossier?.resume || {},
        derniereConsultation: dossier?.consultations?.[0] || null,
        prochainRendezVous: null, // À récupérer via l'API rendez-vous
        documentsRecents: dossier?.documents?.slice(0, 5) || [],
        autoMesuresRecentes: dossier?.autoMesures?.slice(0, 3) || dossier?.auto_mesures?.slice(0, 3) || []
    };
    
    return { data: { tableau_de_bord: tableauDeBord } };
};

// --- Rappels ---
export const getRappels = async () => {
    // Récupérer le patient connecté depuis le localStorage
    const storedPatient = getStoredPatient();
    const patientId = storedPatient?.id_patient || storedPatient?.id;
    
    if (!patientId) {
        throw new Error('ID patient non disponible pour les rappels');
    }
    
    const response = await dmpApi.get(`/rendez-vous/patient/${patientId}/rappels`);
    return response.data.data;
};

// --- Fonctions utilitaires pour les notifications ---
// Note: Ces endpoints n'existent pas dans l'API, on utilise les endpoints d'accès à la place
export const findAutorisationIdFromNotification = async (notification) => {
    // Utiliser l'API d'autorisation pour trouver l'autorisation correspondante
    const response = await dmpApi.get(`/access/authorization/${notification.autorisationId || notification.id}`);
    return { data: { autorisationId: response.data.data.id } };
};

export const verifierAutorisationExistence = async (notificationId) => {
    // Vérifier l'existence de l'autorisation via l'API d'autorisation
    const response = await dmpApi.get(`/access/authorization/${notificationId}`);
    return { data: { autorisation: response.data.data } };
};

// --- Fonctions pour DMPDemandesAcces ---
export const getAutorisationsDemandees = async () => {
    const response = await dmpApi.get('/access/authorizations/active');
    return response.data.data;
};

export const verifierAcces = async (patientId) => {
    // Récupérer le professionnel connecté depuis le localStorage
    const storedMedecin = JSON.parse(localStorage.getItem('medecin') || '{}');
    const professionnelId = storedMedecin?.id || storedMedecin?.id_professionnel;
    
    if (!professionnelId) {
        throw new Error('ID professionnel non disponible pour vérifier l\'accès');
    }
    
    // Utiliser l'endpoint de vérification d'accès
    const response = await dmpApi.get(`/access/check/${professionnelId}/${patientId}/standard`);
    return response.data.data;
};

export const getDureeRestante = async (autorisationId) => {
    const response = await dmpApi.get(`/access/authorization/${autorisationId}`);
    // Calculer la durée restante à partir de la date d'expiration
    const autorisation = response.data.data;
    if (autorisation.dateExpiration) {
        const maintenant = new Date();
        const expiration = new Date(autorisation.dateExpiration);
        const dureeRestante = expiration - maintenant;
        return { data: { dureeRestante: Math.max(0, dureeRestante) } };
    }
    return { data: { dureeRestante: 0 } };
};

// Exporter toutes les fonctions pour une utilisation facile
const dmpApiExports = {
    getPendingAccessRequests,
    respondToAccessRequest,
    getPatientAuthorizations,
    getPatientAccessHistory,
    authenticateCPS,
    requestStandardAccess,
    getAccessStatus,
    getSecureDossierForMedecin,
    getSentAccessRequests,
    getMedecinAccessRequests,
    getPatientSentAccessRequests,
    getPatientAccessStatus,
    getAutorisations,
    accepterAutorisation,
    refuserAutorisation,
    getNotificationsStats,
    marquerToutesNotificationsLues,
    marquerNotificationDroitsAccesLue,
    getDMPAccessHistory,
    getDocumentsDMP,
    uploadDocumentDMP,
    getAutoMesuresDMP,
    createAutoMesureDMP,
    getDMP,
    updateDMP,
    getHistoriqueMedical,
    addHistoriqueEntry,
    getJournalActivite,
    getDroitsAcces,
    updateDroitsAcces,
    getBibliothequeSante,
    getStatistiquesDMP,
    getRendezVousDMP,
    createRendezVousDMP,
    getTableauDeBord,
    getRappels,
    findAutorisationIdFromNotification,
    verifierAutorisationExistence,
    getAutorisationsDemandees,
    verifierAcces,
    getDureeRestante,
};

export default dmpApiExports;

