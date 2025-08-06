import axios from "axios";

const API_URL = "http://localhost:3000/api";

const dmpApi = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

// Intercepteur d'authentification
dmpApi.interceptors.request.use(
    (config) => {
        const jwtToken = localStorage.getItem('jwt');
        const token = localStorage.getItem('token');
        
        console.log('🔐 Intercepteur - URL:', config.url);
        console.log('🔐 Intercepteur - jwtToken:', jwtToken ? '✅ Présent' : '❌ Absent');
        console.log('🔐 Intercepteur - token:', token ? '✅ Présent' : '❌ Absent');
        
        // Test JWT détaillé
        if (jwtToken) {
            try {
                const parts = jwtToken.split('.');
                if (parts.length === 3) {
                    const header = JSON.parse(atob(parts[0]));
                    const payload = JSON.parse(atob(parts[1]));
                    
                    console.log('🔐 JWT Header:', header);
                    console.log('🔐 JWT Payload:', payload);
                    
                    // Vérifier l'expiration
                    const now = Math.floor(Date.now() / 1000);
                    const exp = payload.exp;
                    const iat = payload.iat;
                    
                    console.log('🔐 Timestamp actuel:', now);
                    console.log('🔐 Expiration JWT:', exp);
                    console.log('🔐 Émis le:', iat);
                    console.log('🔐 Token expiré:', now > exp ? '❌ OUI' : '✅ NON');
                    
                    if (now > exp) {
                        console.log('⚠️ Le token a expiré !');
                        console.log('🔐 Temps écoulé depuis expiration:', Math.floor((now - exp) / 60), 'minutes');
                    } else {
                        console.log('⏰ Temps restant:', Math.floor((exp - now) / 60), 'minutes');
                    }
                    
                    // Vérifier le rôle
                    console.log('🔐 Rôle dans le token:', payload.role);
                    console.log('🔐 ID utilisateur dans le token:', payload.patient_id || payload.id);
                    
                } else {
                    console.log('❌ Format JWT invalide');
                }
            } catch (error) {
                console.log('❌ Erreur décodage JWT:', error);
            }
        }
        
        if (jwtToken) {
            config.headers.Authorization = `Bearer ${jwtToken}`;
            console.log('🔐 Intercepteur - Headers Authorization ajouté avec JWT');
        } else if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔐 Intercepteur - Headers Authorization ajouté avec token');
        } else {
            console.log('❌ Intercepteur - Aucun token trouvé');
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Fonction utilitaire pour récupérer l'ID du patient
const getPatientId = (patientId = null) => {
    if (patientId) return patientId;
    
    try {
        console.log('🔍 getPatientId - Début de la récupération...');
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        
        console.log('🔍 getPatientId - currentUser:', currentUser);
        console.log('🔍 getPatientId - storedPatient:', storedPatient);
        
        // Essayer plusieurs propriétés possibles pour l'ID
        const targetPatientId = storedPatient.id || storedPatient.id_patient || storedPatient.patient_id || 
                               currentUser.id || currentUser.id_patient || currentUser.patient_id;
        
        console.log('🔍 getPatientId - targetPatientId:', targetPatientId);
        
        if (!targetPatientId) {
            console.log('❌ getPatientId - Aucun ID patient trouvé');
            throw new Error('Patient non connecté');
        }
        
        console.log('✅ getPatientId - ID patient trouvé:', targetPatientId);
        return targetPatientId;
    } catch (error) {
        console.log('❌ getPatientId - Erreur:', error.message);
        throw new Error('Patient non connecté');
    }
};

// ===== FONCTIONS DMP PRINCIPALES =====

// 1. Récupérer le DMP complet d'un patient
export const getDMP = async (patientId = null) => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const response = await dmpApi.get(`/patient/dmp`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 2. Mettre à jour le DMP
export const updateDMP = async (patientId, dmpData) => {
    try {
        const response = await dmpApi.put(`/patient/dmp`, dmpData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 3. Récupérer l'historique médical
export const getHistoriqueMedical = async (patientId = null) => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const response = await dmpApi.get(`/patient/dmp/historique-medical`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 4. Ajouter une entrée à l'historique
export const addHistoriqueEntry = async (patientId, entry) => {
    try {
        const response = await dmpApi.post(`/patient/dmp/historique-medical`, entry);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 5. Récupérer le journal d'activité
export const getJournalActivite = async (patientId, filters = {}) => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const params = new URLSearchParams(filters);
        const response = await dmpApi.get(`/patient/dmp/journal-activite?${params}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 6. Gestion des droits d'accès
export const getDroitsAcces = async (patientId = null) => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const response = await dmpApi.get(`/patient/dmp/droits-acces`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateDroitsAcces = async (patientId, droits) => {
    try {
        const response = await dmpApi.put(`/patient/dmp/droits-acces`, droits);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 6.1. Notifications des droits d'accès pour les patients
export const getDroitsAccesNotifications = async (patientId = null) => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const response = await dmpApi.get(`/patient/dmp/droits-acces/notifications`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications des droits d\'accès:', error);
        throw error;
    }
};

export const marquerNotificationDroitsAccesLue = async (notificationId, patientId = null) => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const response = await dmpApi.put(`/patient/dmp/droits-acces/notifications/${notificationId}/lue`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors du marquage de la notification comme lue:', error);
        throw error;
    }
};

export const repondreDemandeAcces = async (demandeId, reponse, patientId = null) => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const response = await dmpApi.post(`/patient/dmp/droits-acces/demandes/${demandeId}/reponse`, {
            reponse: reponse // 'accepter' ou 'refuser'
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la réponse à la demande d\'accès:', error);
        throw error;
    }
};

// Nouvelles fonctions pour la gestion avancée des notifications
export const getNotificationsStats = async (patientId = null) => {
    try {
        getPatientId(patientId);
        const response = await dmpApi.get(`/patient/dmp/notifications/stats`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques des notifications:', error);
        throw error;
    }
};

export const marquerToutesNotificationsLues = async (patientId = null) => {
    try {
        getPatientId(patientId);
        const response = await dmpApi.put(`/patient/dmp/droits-acces/notifications/marquer-toutes-lues`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors du marquage de toutes les notifications:', error);
        throw error;
    }
};

export const getNotificationDetails = async (notificationId, patientId = null) => {
    try {
        getPatientId(patientId);
        const response = await dmpApi.get(`/patient/dmp/droits-acces/notifications/${notificationId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des détails de la notification:', error);
        throw error;
    }
};

// 7. Auto-mesures DMP
export const getAutoMesuresDMP = async (patientId = null, type = null) => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const params = type ? `?type=${type}` : '';
        const response = await dmpApi.get(`/patient/dmp/auto-mesures${params}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createAutoMesureDMP = async (patientId, mesureData) => {
    try {
        const response = await dmpApi.post(`/patient/dmp/auto-mesures`, mesureData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 8. Rendez-vous DMP
export const getRendezVousDMP = async (patientId = null) => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const response = await dmpApi.get(`/patient/dmp/rendez-vous`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createRendezVousDMP = async (patientId, rdvData) => {
    try {
        const response = await dmpApi.post(`/patient/dmp/rendez-vous`, rdvData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 9. Documents DMP
export const getDocumentsDMP = async (patientId = null, type = null) => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const params = type ? `?type=${type}` : '';
        const response = await dmpApi.get(`/patient/dmp/documents${params}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const uploadDocumentDMP = async (patientId, documentData) => {
    try {
        const formData = new FormData();
        formData.append('file', documentData.file);
        formData.append('type', documentData.type);
        formData.append('description', documentData.description);
        formData.append('categorie', documentData.categorie || 'general');
        
        const response = await dmpApi.post(`/patient/dmp/upload-document`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 10. Bibliothèque de santé
export const getBibliothequeSante = async (patientId = null) => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const response = await dmpApi.get(`/patient/dmp/bibliotheque-sante`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 11. Statistiques DMP
export const getStatistiquesDMP = async (patientId = null, periode = '30j') => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const response = await dmpApi.get(`/patient/dmp/statistiques?periode=${periode}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 12. Tableau de bord DMP
export const getTableauDeBord = async (patientId = null) => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const response = await dmpApi.get(`/patient/dmp/tableau-de-bord`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 13. Rappels DMP
export const getRappels = async (patientId = null) => {
    try {
        getPatientId(patientId); // Vérifier que le patient est connecté
        const response = await dmpApi.get(`/patient/dmp/rappels`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// ===== NOUVELLES FONCTIONS DMP ACCESS =====

// Test du système DMP
export const testDMPSystem = async () => {
  try {
    const response = await dmpApi.get('/medecin/dmp/test/systeme');
    return response.data;
  } catch (error) {
    console.error('Erreur lors du test du système DMP:', error);
    throw error;
  }
};

// Authentification CPS
export const authenticateCPS = async (credentials) => {
  try {
    const response = await dmpApi.post('/medecin/dmp/authentification-cps', credentials);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'authentification CPS:', error);
    throw error;
  }
};

// Création de session d'accès
export const createDMPSession = async (sessionData) => {
  try {
    const response = await dmpApi.post('/medecin/dmp/creer-session', sessionData);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création de session DMP:', error);
    throw error;
  }
};

// Demande d'accès au DMP
export const requestDMPAccess = async (accessData) => {
  try {
    console.log('requestDMPAccess appelée avec:', accessData);
    console.log('URL de l\'API:', dmpApi.defaults.baseURL);
    
    const response = await dmpApi.post('/medecin/dmp/demande-acces', accessData);
    console.log('Réponse complète de l\'API:', response);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la demande d\'accès DMP:', error);
    console.error('Détails de l\'erreur:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

// Récupération des notifications DMP
export const getDMPNotifications = async (sessionId) => {
  try {
    const response = await dmpApi.get(`/medecin/dmp/notifications/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications DMP:', error);
    throw error;
  }
};

// Validation du statut de session DMP
export const validateDMPSession = async (sessionId) => {
  try {
    const response = await dmpApi.get(`/medecin/dmp/session/${sessionId}/statut`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la validation de session DMP:', error);
    throw error;
  }
};

// Fermeture de session DMP
export const closeDMPSession = async (sessionId) => {
  try {
    const response = await dmpApi.post(`/medecin/dmp/session/${sessionId}/fermer`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la fermeture de session DMP:', error);
    throw error;
  }
};

// Récupération de l'historique des accès DMP
export const getDMPAccessHistory = async (patientId = null) => {
  try {
    const url = patientId 
      ? `/medecin/dmp/historique/${patientId}`
      : '/medecin/dmp/historique';
    
    const response = await dmpApi.get(url);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique DMP:', error);
    throw error;
  }
};

// Validation des données d'accès
export const validateAccessRequest = (data) => {
  const errors = [];
  
  if (!data.mode_acces) {
    errors.push('Le mode d\'accès est requis');
  }
  
  if (!data.raison_acces || data.raison_acces.length < 10) {
    errors.push('La raison d\'accès doit contenir au moins 10 caractères');
  }
  
  if (!data.duree_acces || data.duree_acces < 15 || data.duree_acces > 480) {
    errors.push('La durée d\'accès doit être entre 15 et 480 minutes');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Validation du code CPS
export const validateCPS = (code) => {
  if (!code || code.length !== 4) {
    return { valid: false, message: 'Le code CPS doit contenir 4 chiffres' };
  }
  
  if (!/^\d{4}$/.test(code)) {
    return { valid: false, message: 'Le code CPS ne doit contenir que des chiffres' };
  }
  
  return { valid: true };
};

const dmpApiExports = {
    getDMP,
    updateDMP,
    getHistoriqueMedical,
    addHistoriqueEntry,
    getJournalActivite,
    getDroitsAcces,
    updateDroitsAcces,
    getDroitsAccesNotifications,
    marquerNotificationDroitsAccesLue,
    repondreDemandeAcces,
    getAutoMesuresDMP,
    createAutoMesureDMP,
    getRendezVousDMP,
    createRendezVousDMP,
    getDocumentsDMP,
    uploadDocumentDMP,
    getBibliothequeSante,
    getStatistiquesDMP,
    getTableauDeBord,
    getRappels,
    // Nouvelles fonctions DMP Access
    testDMPSystem,
    authenticateCPS,
    createDMPSession,
    requestDMPAccess,
    getDMPNotifications,
    validateDMPSession,
    closeDMPSession,
    getDMPAccessHistory,
    validateAccessRequest,
    validateCPS
};

export default dmpApiExports; 