import axios from "axios";

const API_URL = "http://192.168.4.81:3000/api";

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
export const getPatientConsultations = (patientId) => dmpApi.get(`/consultation/patient/${patientId}`);

// =================================================================
//                 API POUR LES MÉDECINS
// =================================================================

// --- Authentification et Demande d'Accès ---
export const authenticateCPS = (cpsData) => dmpApi.post('/auth/authenticate-cps', cpsData);
export const requestStandardAccess = (accessData) => dmpApi.post('/access/request-standard', accessData);

// --- Tableau de Bord Médecin ---
export const getPatientsByMedecin = (medecinId) => dmpApi.get(`/medecin/${medecinId}/patients`);
export const getRendezVousByMedecin = (medecinId) => dmpApi.get(`/medecin/${medecinId}/rendez-vous`);
export const getMessagesRecents = (medecinId) => dmpApi.get(`/medecin/${medecinId}/messages`);
export const getNotificationsByMedecin = (medecinId) => dmpApi.get(`/medecin/${medecinId}/notifications`);

/**
 * Enregistre un accès d'urgence dans le système
 * @param {Object} emergencyData - Données de l'accès d'urgence
 * @param {string} emergencyData.mode - Mode d'accès ('urgence')
 * @param {string} emergencyData.raison - Raison de l'accès
 * @param {number} emergencyData.patient_id - ID du patient
 * @param {string} emergencyData.justification_urgence - Justification détaillée
 * @param {string} emergencyData.timestamp - Horodatage de l'accès
 * @returns {Promise<Object>} Réponse de l'API
 */
export const recordEmergencyAccess = async (emergencyData) => {
    try {
        console.log('🚨 Enregistrement de l\'accès d\'urgence:', emergencyData);
        
        // Essayer d'enregistrer via l'API d'urgence si elle existe
        try {
            const response = await dmpApi.post('/access/emergency', emergencyData);
            console.log('✅ Accès d\'urgence enregistré via API dédiée:', response.data);
            return response.data;
        } catch (apiError) {
            console.log('⚠️ API d\'urgence non disponible, utilisation du fallback...');
            
            // Fallback : essayer d'enregistrer via l'historique des accès
            const fallbackResponse = await dmpApi.post('/access/history', {
                ...emergencyData,
                type: 'urgence',
                statut: 'actif',
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Accès d\'urgence enregistré via fallback:', fallbackResponse.data);
            return fallbackResponse.data;
        }
    } catch (error) {
        console.warn('⚠️ Impossible d\'enregistrer l\'accès d\'urgence, mais l\'accès principal fonctionne:', error);
        // Ne pas faire échouer l'opération principale pour un problème d'enregistrement
        return { 
            status: 'warning', 
            message: 'Accès d\'urgence réussi mais enregistrement échoué',
            data: emergencyData 
        };
    }
};

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

// Fonction pour récupérer les informations de base d'un patient
export const getPatientInfo = async (patientId) => {
    try {
        console.log(`🔍 Récupération des informations du patient ${patientId}...`);
        
        // Validation de l'ID du patient
        if (!patientId || isNaN(patientId) || patientId <= 0) {
            console.warn(`⚠️ ID patient invalide: ${patientId}`);
            return {
                id: patientId,
                nom: 'Patient',
                prenom: 'Inconnu',
                date_naissance: 'N/A',
                groupe_sanguin: 'N/A'
            };
        }
        
        // Essayer d'abord la fonction getPatient de patientApi
        try {
            const { getPatient } = await import('./patientApi.js');
            const patientData = await getPatient(patientId);
            console.log(`✅ Informations patient récupérées via getPatient:`, patientData);
            
            // Extraire les données du patient de la réponse
            if (patientData?.data?.patient) {
                return patientData.data.patient;
            } else if (patientData?.patient) {
                return patientData.patient;
            } else if (patientData?.data) {
                return patientData.data;
            } else {
                return patientData;
            }
        } catch (patientError) {
            console.log(`⚠️ getPatient non disponible, essai via route directe...`);
        }
        
        // Essayer la route patient directe
        try {
            const response = await dmpApi.get(`/patient/${patientId}`);
            console.log(`✅ Informations patient récupérées via /patient/${patientId}:`, response.data);
            
            if (response.data?.data?.patient) {
                return response.data.data.patient;
            } else if (response.data?.patient) {
                return response.data.patient;
            } else if (response.data?.data) {
                return response.data.data;
            } else {
                return response.data;
            }
        } catch (patientError) {
            console.log(`⚠️ Route /patient/${patientId} non disponible, essai via dossier médical...`);
        }
        
        // Fallback via le dossier médical
        try {
            const dossierResponse = await dmpApi.get(`/dossierMedical/patient/${patientId}/complet`);
            const dossierData = dossierResponse.data.data || dossierResponse.data;
            console.log(`📋 Données du dossier récupérées:`, dossierData);
            
            // Extraire les informations du patient du dossier
            if (dossierData?.patient) {
                console.log(`✅ Informations patient extraites du dossier:`, dossierData.patient);
                return dossierData.patient;
            } else if (dossierData?.patient_info) {
                console.log(`✅ Informations patient extraites du dossier (patient_info):`, dossierData.patient_info);
                return dossierData.patient_info;
            } else if (dossierData?.nom || dossierData?.prenom) {
                // Créer un objet patient avec les données disponibles dans le dossier
                const patientInfo = {
                    id: patientId,
                    nom: dossierData.nom || 'Patient',
                    prenom: dossierData.prenom || 'Inconnu',
                    date_naissance: dossierData.date_naissance || 'N/A',
                    groupe_sanguin: dossierData.groupe_sanguin || 'N/A'
                };
                console.log(`⚠️ Informations patient extraites des propriétés du dossier:`, patientInfo);
                return patientInfo;
            } else {
                console.warn(`⚠️ Aucune information patient trouvée dans le dossier`);
                console.log(`🔍 Clés disponibles dans le dossier:`, Object.keys(dossierData || {}));
            }
        } catch (dossierError) {
            console.log(`⚠️ Route dossier médical non disponible:`, dossierError.message);
        }
        
        // Dernier fallback : essayer de récupérer depuis la liste des patients
        try {
            const { getPatients } = await import('./patientApi.js');
            const patientsResponse = await getPatients();
            console.log(`🔍 Recherche du patient ${patientId} dans la liste des patients...`);
            
            if (patientsResponse?.data) {
                const patients = Array.isArray(patientsResponse.data) ? patientsResponse.data : [patientsResponse.data];
                const patient = patients.find(p => p.id == patientId || p.id_patient == patientId);
                
                if (patient) {
                    console.log(`✅ Patient trouvé dans la liste:`, patient);
                    return patient;
                }
            }
        } catch (listError) {
            console.log(`⚠️ Impossible de récupérer la liste des patients:`, listError.message);
        }
        
        // Si aucune méthode n'a fonctionné, créer un objet patient minimal
        console.warn(`⚠️ Aucune méthode n'a permis de récupérer les informations du patient ${patientId}`);
        const fallbackPatient = {
            id: patientId,
            nom: 'Patient',
            prenom: 'Inconnu',
            date_naissance: 'N/A',
            groupe_sanguin: 'N/A'
        };
        console.log(`⚠️ Objet patient minimal créé:`, fallbackPatient);
        return fallbackPatient;
        
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération des informations du patient ${patientId}:`, error);
        // Retourner un objet patient minimal en cas d'erreur
        return {
            id: patientId,
            nom: 'Patient',
            prenom: 'Inconnu',
            date_naissance: 'N/A',
            groupe_sanguin: 'N/A'
        };
    }
};

/**
 * (Médecin) Récupère l'ensemble des données du dossier d'un patient de manière sécurisée.
 * Ne fonctionne que si une autorisation est active.
 * @param {number} patientId
 * @returns {Promise<object>} Un objet contenant toutes les données du dossier.
 */
export const getSecureDossierForMedecin = async (patientId) => {
    try {
        console.log(`🔍 Récupération du dossier sécurisé pour le patient ${patientId}...`);
        
        const response = await dmpApi.get(`/dossierMedical/patient/${patientId}/complet`);
        console.log(`📊 Réponse brute de l'API:`, response.data);
        
        // Extraire les données du dossier
        const dossierData = response.data.data || response.data;
        console.log(`📋 Données du dossier extraites:`, dossierData);
        
        // S'assurer que nous avons les informations du patient
        if (dossierData && dossierData.patient) {
            console.log(`✅ Informations du patient trouvées:`, dossierData.patient);
        } else if (dossierData && dossierData.patient_info) {
            console.log(`✅ Informations du patient trouvées (patient_info):`, dossierData.patient_info);
            // Normaliser la structure
            dossierData.patient = dossierData.patient_info;
        } else {
            console.warn(`⚠️ Aucune information patient trouvée dans le dossier`);
            console.log(`🔍 Clés disponibles dans le dossier:`, Object.keys(dossierData || {}));
        }
        
        // S'assurer que nous avons les documents
        if (dossierData && dossierData.documents) {
            console.log(`📄 ${dossierData.documents.length} documents trouvés`);
        } else {
            console.warn(`⚠️ Aucun document trouvé dans le dossier`);
        }
        
        // S'assurer que nous avons les auto-mesures
        if (dossierData && dossierData.autoMesures) {
            console.log(`📊 ${dossierData.autoMesures.length} auto-mesures trouvées`);
        } else if (dossierData && dossierData.auto_mesures) {
            console.log(`📊 ${dossierData.auto_mesures.length} auto-mesures trouvées (auto_mesures)`);
            // Normaliser la structure
            dossierData.autoMesures = dossierData.auto_mesures;
        } else {
            console.warn(`⚠️ Aucune auto-mesure trouvée dans le dossier`);
        }
        
        console.log(`✅ Dossier sécurisé récupéré avec succès pour le patient ${patientId}`);
        return dossierData;
        
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération du dossier sécurisé pour le patient ${patientId}:`, error);
        throw error;
    }
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
        commentaire: commentaire || 'Autorisation acceptée par le patient'
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

// =================================================================
//                 API RECHERCHE PATIENT (PROFESSIONNEL + 2FA)
// =================================================================

/**
 * Recherche un patient par nom/prénom et récupère toutes ses données associées.
 * - Réservé aux professionnels de santé authentifiés
 * - 2FA requis: passer le code TOTP via twoFactorToken (header x-2fa-token)
 *
 * @param {{ nom?: string, prenom?: string, twoFactorToken?: string }} params
 * @returns {Promise<{count: number, data: any[]}>}
 */
export const searchPatientFullData = async ({ nom = '', prenom = '', twoFactorToken }) => {
    try {
        console.log('🔍 searchPatientFullData appelé avec:', { nom, prenom, hasTwoFactorToken: !!twoFactorToken });
        console.log('🔍 DEBUG - Paramètres détaillés:', {
            nom: nom,
            prenom: prenom,
            twoFactorToken: twoFactorToken,
            twoFactorTokenType: typeof twoFactorToken,
            twoFactorTokenLength: twoFactorToken ? String(twoFactorToken).length : 0,
            timestamp: new Date().toISOString()
        });
        
        // 🔍 DEBUG - Vérifier l'état des tokens au début de la fonction
        console.log('🔍 DEBUG - État des tokens au début de searchPatientFullData:', {
            hasJwt: !!localStorage.getItem('jwt'),
            hasToken: !!localStorage.getItem('token'),
            jwtValue: localStorage.getItem('jwt')?.substring(0, 50) + '...',
            tokenValue: localStorage.getItem('token')?.substring(0, 50) + '...',
            tempTokenIdUrgence: localStorage.getItem('tempTokenId_urgence'),
            localStorageKeys: Object.keys(localStorage)
        });
        
        // Si pas de token 2FA, créer une session 2FA et déclencher le flux
        if (!twoFactorToken) {
            console.log('🔐 Aucun token 2FA fourni, création de session 2FA...');
            
            try {
                // Récupérer les informations du médecin depuis le localStorage
                const medecinData = localStorage.getItem('medecin');
                const professionnelData = localStorage.getItem('professionnel');
                const token = localStorage.getItem('jwt') || localStorage.getItem('token');
                
                if (!token) {
                    throw new Error('Aucun token d\'authentification trouvé');
                }
                
                // Déterminer le type d'utilisateur et l'identifiant
                let userType = 'professionnel';
                let identifier = '';
                
                if (medecinData) {
                    try {
                        const medecin = JSON.parse(medecinData);
                        identifier = medecin.id || medecin.id_medecin || medecin.email || 'medecin';
                    } catch (e) {
                        identifier = 'medecin';
                    }
                } else if (professionnelData) {
                    try {
                        const professionnel = JSON.parse(professionnelData);
                        identifier = professionnel.id || professionnel.id_professionnel || professionnel.email || 'professionnel';
                    } catch (e) {
                        identifier = 'professionnel';
                    }
                } else {
                    // Fallback : utiliser l'email du token JWT si possible
                    identifier = 'professionnel_sante';
                }
                
                console.log('🔐 Création de session 2FA avec:', { userType, identifier });
                console.log('🔍 DEBUG - Données utilisateur récupérées:', {
                    hasMedecinData: !!medecinData,
                    hasProfessionnelData: !!professionnelData,
                    medecinKeys: medecinData ? Object.keys(JSON.parse(medecinData)) : [],
                    professionnelKeys: professionnelData ? Object.keys(JSON.parse(professionnelData)) : []
                });
                
                // Importer et utiliser la fonction de création de session 2FA
                console.log('📦 Import de create2FASession...');
                const { create2FASession } = await import('./twoFactorApi.js');
                console.log('✅ Import réussi, appel de create2FASession...');
                
                const sessionResult = await create2FASession({
                    userType,
                    identifier,
                    action: 'patient_search',
                    context: 'Recherche patient DMP'
                });
                
                console.log('🔐 Session 2FA créée:', sessionResult);
                console.log('🔍 DEBUG - Structure de sessionResult:', {
                    hasStatus: !!sessionResult?.status,
                    statusValue: sessionResult?.status,
                    hasSuccess: !!sessionResult?.success,
                    successValue: sessionResult?.success,
                    hasData: !!sessionResult?.data,
                    hasTempTokenId: !!sessionResult?.data?.tempTokenId,
                    tempTokenIdValue: sessionResult?.data?.tempTokenId,
                    fullResult: JSON.stringify(sessionResult, null, 2)
                });
                
                // Vérifier que la session a été créée avec succès
                // create2FASession retourne { status: 'success', data: { tempTokenId, ... } }
                if (sessionResult && 
                    (sessionResult.status === 'success' || sessionResult.success) && 
                    sessionResult.data?.tempTokenId) {
                    
                    // Stocker le tempTokenId pour la validation 2FA
                    const tempTokenIdToStore = sessionResult.data.tempTokenId;
                    localStorage.setItem('tempTokenId_urgence', tempTokenIdToStore);
                    
                    console.log('✅ tempTokenId stocké dans localStorage:', {
                        key: 'tempTokenId_urgence',
                        value: tempTokenIdToStore,
                        timestamp: new Date().toISOString(),
                        localStorageKeys: Object.keys(localStorage)
                    });
                    
                    // Déclencher le flux 2FA en retournant une erreur 403
                    console.log('🚨 Déclenchement du flux 2FA - Lancement d\'une erreur 403...');
                    const error = new Error('Veuillez valider votre authentification 2FA pour accéder aux données patient');
                    error.response = {
                        status: 403,
                        data: {
                            message: 'Veuillez valider votre authentification 2FA pour accéder aux données patient',
                            requires2FA: true,
                            tempTokenId: tempTokenIdToStore
                        }
                    };
                    throw error;
                } else {
                    console.error('❌ Réponse de session 2FA invalide:', sessionResult);
                    throw new Error('Impossible de créer une session 2FA - Réponse invalide');
                }
            } catch (sessionError) {
                console.error('❌ Erreur lors de la création de session 2FA:', sessionError);
                throw sessionError;
            }
        }

        // Si nous avons un token 2FA, faire la recherche
        console.log('🔐 Token 2FA fourni, recherche du patient avec:', { nom, prenom, twoFactorToken: 'PRÉSENT' });
        
        // Récupérer le token JWT d'authentification principal (après validation 2FA)
        const jwtToken = localStorage.getItem('jwt') || localStorage.getItem('token');
        if (!jwtToken) {
            throw new Error('Token JWT d\'authentification manquant - veuillez valider la 2FA');
        }
        
        // Faire la recherche directement avec le token JWT validé (comme l'authentification normale)
        console.log('🔐 2FA validée, recherche directe avec token JWT:', { nom, prenom, hasJWT: !!jwtToken });
        console.log('🔍 DEBUG - Token JWT récupéré:', {
            hasJwt: !!localStorage.getItem('jwt'),
            hasToken: !!localStorage.getItem('token'),
            jwtLength: localStorage.getItem('jwt')?.length || 0,
            tokenLength: localStorage.getItem('token')?.length || 0,
            jwtValue: localStorage.getItem('jwt')?.substring(0, 50) + '...',
            tokenValue: localStorage.getItem('token')?.substring(0, 50) + '...',
            selectedToken: jwtToken.substring(0, 50) + '...',
            selectedTokenLength: jwtToken.length
        });
        
        console.log('🚀 APPEL API - GET /search-patient avec paramètres:', {
            nom: nom || undefined,
            prenom: prenom || undefined,
            headers: {
                'Authorization': `Bearer ${jwtToken.substring(0, 20)}...`
            }
        });
        
        const response = await dmpApi.get('/search-patient', {
            params: {
                nom: nom || undefined,
                prenom: prenom || undefined
                // Ne pas envoyer twoFactorToken - le serveur vérifie via le JWT dans Authorization
            },
            headers: {
                // Utiliser le header Authorization standard avec le JWT validé
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        console.log('✅ APPEL API - Réponse reçue de /search-patient:', {
            status: response.status,
            statusText: response.statusText,
            hasData: !!response.data,
            dataType: typeof response.data,
            dataKeys: response.data ? Object.keys(response.data) : [],
            dataLength: response.data?.data?.length || 'N/A'
        });

        // Format attendu: { count: number, data: [...] }
        return response.data;
    } catch (error) {
        console.error('❌ Erreur dans searchPatientFullData:', error);
        console.log('🔍 DEBUG - Détails de l\'erreur:', {
            message: error.message,
            hasResponse: !!error.response,
            responseStatus: error.response?.status,
            responseData: error.response?.data,
            stack: error.stack?.split('\n').slice(0, 3)
        });
        throw error;
    }
};

// ============================================================================
// 🔐 FONCTIONS UNIFIÉES DE RÉVOCATION D'AUTORISATION
// ============================================================================

// ✅ FONCTION UNIFIÉE : Révocation d'autorisation pour tous les utilisateurs
export const revokerAutorisationUnified = async (autorisationId, raisonRevocation) => {
    try {
        console.log(`🔐 Révocation unifiée de l'autorisation ${autorisationId}:`, raisonRevocation);
        
        // ✅ MÉTHODE UNIFIÉE : PATCH avec statut 'expire'
        const response = await dmpApi.patch(`/access/patient/authorization/${autorisationId}`, {
            statut: 'expire',
            raison_demande: raisonRevocation
        }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        });
        
        console.log('✅ Autorisation révoquée avec succès (méthode unifiée):', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Erreur lors de la révocation unifiée de l\'autorisation:', error);
        throw error;
    }
};

export const revokerAutorisation = async (autorisationId, raisonRevocation) => {
    try {
        // Utiliser la route patient pour la révocation
        const response = await dmpApi.delete(`/access/patient/authorization/${autorisationId}`, {
            data: { reason: raisonRevocation }
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la révocation de l\'autorisation:', error);
        throw error;
    }
};

// Fonction pour révoquer l'accès d'un médecin à un patient spécifique
export const revokerAutorisationMedecin = async (professionnelId, patientId,raisonRevocation) => {
    try {
        console.log(`   Désactivation de l'accès: Médecin ${professionnelId} → Patient ${patientId}`);
        
        // ✅ ÉTAPE 1: Récupérer l'autorisation active
        const verification = await dmpApi.get(`/access/status/${patientId}?professionnelId=${professionnelId}`);
        
        if (!verification.data.data.status || verification.data.data.status === 'not_requested') {
            console.log('ℹ️ Aucune autorisation active trouvée');
            return { message: 'Aucune autorisation active' };
        }
        
        // ✅ ÉTAPE 2: Récupérer l'ID de l'autorisation
        const autorisationId = verification.data.data.authorization?.id_acces;
        if (!autorisationId) {
            throw new Error('ID d\'autorisation non trouvé');
        }
        
        // ✅ ÉTAPE 3: Désactiver l'autorisation
        const response = await dmpApi.patch(`/access/authorization/${autorisationId}`, {
            statut: 'expire',
            raison_demande: raisonRevocation
        }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        });

        console.log('✅ Autorisation désactivée avec succès:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Erreur lors de la désactivation de l\'autorisation:', error);
        throw error;
    }
};

// // Pour les professionnels (route existante) - si besoin futur
// const revokeProfAuth = async (id, reason) => {
//     const response = await dmpApi.delete(`/access/authorization/${id}`, {
//         data: { reason }
//     });
//     return response.data;
// };
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
export const getDMPAccessHistory = async (patientId, forceGenericEndpoint = false) => {
    // Validation du patientId
    if (!patientId) {
        throw new Error('ID du patient requis pour récupérer l\'historique DMP');
    }
    
    console.log(`🔍 [getDMPAccessHistory] Début de la fonction pour patient ${patientId}`, {
        forceGenericEndpoint: forceGenericEndpoint
    });
    
    // Si forceGenericEndpoint est true, utiliser directement l'endpoint générique
    if (forceGenericEndpoint) {
        console.log(`🔄 [getDMPAccessHistory] Forçage de l'endpoint générique pour patient ${patientId}`);
        try {
            const response = await dmpApi.get('/access/history');
            let historyData = response.data.data;
            
            if (Array.isArray(historyData)) {
                // Filtrer strictement par patient_id
                const filteredData = historyData.filter(entry => {
                    const entryPatientId = entry.patient_id || entry.id_ressource;
                    const match = Number(entryPatientId) === Number(patientId);
                    
                    console.log(`🔍 [getDMPAccessHistory] Filtrage forcé:`, {
                        entryId: entry.id_historique,
                        entryPatientId: entry.patient_id,
                        entryIdRessource: entry.id_ressource,
                        targetPatientId: patientId,
                        match: match
                    });
                    
                    return match;
                });
                
                console.log(`✅ [getDMPAccessHistory] Filtrage forcé réussi: ${filteredData.length} entrées pour patient ${patientId}`);
                return filteredData;
            }
            return [];
        } catch (error) {
            console.error(`❌ [getDMPAccessHistory] Erreur avec endpoint forcé:`, error);
            return [];
        }
    }
    
    try {
        // Essayer d'abord l'endpoint spécifique au patient
        console.log(`🚀 [getDMPAccessHistory] Appel API: /access/history/patient/${patientId}`);
        const response = await dmpApi.get(`/access/history/patient/${patientId}`);
        let historyData = response.data.data;
        
        console.log(`📊 [getDMPAccessHistory] Données brutes reçues:`, {
            patientId: patientId,
            dataLength: Array.isArray(historyData) ? historyData.length : 'Non-array',
            dataType: typeof historyData,
            firstEntry: Array.isArray(historyData) && historyData.length > 0 ? historyData[0] : 'Aucune entrée'
        });
        
        // 🔑 FILTRAGE CRUCIAL : S'assurer que seules les données du patient demandé sont retournées
        if (Array.isArray(historyData)) {
            // Filtrer par patient_id pour éviter la confusion entre patients
            const filteredHistory = historyData.filter(entry => {
                console.log(`🔍 [getDMPAccessHistory] Vérification entrée:`, {
                    entryId: entry.id_historique,
                    entryPatientId: entry.patient_id,
                    entryIdRessource: entry.id_ressource,
                    targetPatientId: patientId,
                    patientIdMatch: entry.patient_id ? Number(entry.patient_id) === Number(patientId) : false,
                    idRessourceMatch: entry.id_ressource ? Number(entry.id_ressource) === Number(patientId) : false
                });
                
                // Vérifier si l'entrée a un patient_id qui correspond
                if (entry.patient_id) {
                    return Number(entry.patient_id) === Number(patientId);
                }
                // Si pas de patient_id, vérifier l'id_ressource (pour les accès au dossier)
                if (entry.id_ressource) {
                    return Number(entry.id_ressource) === Number(patientId);
                }
                // Si aucune correspondance, exclure l'entrée
                return false;
            });
            
            console.log(`🔍 [getDMPAccessHistory] Résultat du filtrage pour patient ${patientId}:`, {
                total: historyData.length,
                filtré: filteredHistory.length,
                patientId: patientId,
                entréesFiltrées: filteredHistory.map(entry => ({
                    id: entry.id_historique,
                    patient_id: entry.patient_id,
                    id_ressource: entry.id_ressource,
                    action: entry.action
                }))
            });
            
            // Si le filtrage ne donne aucun résultat mais qu'il y a des données brutes,
            // cela indique un problème avec l'endpoint backend
            if (filteredHistory.length === 0 && historyData.length > 0) {
                console.warn(`⚠️ [getDMPAccessHistory] Endpoint backend ne filtre pas correctement pour patient ${patientId}`);
                console.warn(`⚠️ [getDMPAccessHistory] Tentative de récupération avec endpoint générique...`);
                return await getDMPAccessHistory(patientId, true); // Récursion avec forceGenericEndpoint = true
            }
            
            return filteredHistory;
        }
        
        return historyData;
    } catch (error) {
        console.error(`Erreur lors de la récupération de l\'historique DMP pour le patient ${patientId}:`, error);
        
        // En cas d'erreur, essayer l'endpoint générique et filtrer côté frontend
        try {
            console.log(`🔄 [getDMPAccessHistory] Fallback: récupération depuis l'endpoint générique...`);
            const fallbackResponse = await dmpApi.get('/access/history');
            let fallbackData = fallbackResponse.data.data;
            
            console.log(`📊 [getDMPAccessHistory] Données fallback reçues:`, {
                patientId: patientId,
                dataLength: Array.isArray(fallbackData) ? fallbackData.length : 'Non-array',
                dataType: typeof fallbackData
            });
            
            if (Array.isArray(fallbackData)) {
                // Filtrer strictement par patient_id
                const filteredData = fallbackData.filter(entry => {
                    const entryPatientId = entry.patient_id || entry.id_ressource;
                    const match = Number(entryPatientId) === Number(patientId);
                    
                    console.log(`🔍 [getDMPAccessHistory] Filtrage fallback:`, {
                        entryId: entry.id_historique,
                        entryPatientId: entry.patient_id,
                        entryIdRessource: entry.id_ressource,
                        targetPatientId: patientId,
                        match: match
                    });
                    
                    return match;
                });
                
                console.log(`✅ [getDMPAccessHistory] Fallback réussi: ${filteredData.length} entrées filtrées pour patient ${patientId}`);
                return filteredData;
            }
            
            return [];
        } catch (fallbackError) {
            console.error(`❌ [getDMPAccessHistory] Erreur lors du fallback:`, fallbackError);
            // Retourner un tableau vide pour éviter les erreurs d'affichage
            return [];
        }
    }
};

// --- Documents DMP ---
export const getDocumentsDMP = async (patientId = null, filters = {}) => {
    const url = patientId ? `/dossierMedical/patient/${patientId}/complet` : '/dossierMedical';
    const response = await dmpApi.get(url, { params: filters });
    return response.data.data;
};

// --- Documents personnels DMP ---
export const getDocumentsPersonnelsDMP = async (patientId = null, filters = {}) => {
    try {
        // Construire les paramètres de requête
        const params = new URLSearchParams();
        
        if (filters.type) params.append('type', filters.type);
        if (filters.date_debut) params.append('date_debut', filters.date_debut);
        if (filters.date_fin) params.append('date_fin', filters.date_fin);
        
        const queryString = params.toString();
        const url = patientId
            ? `/documents/patient/${patientId}${queryString ? `?${queryString}` : ''}`
            : `/documents/patient${queryString ? `?${queryString}` : ''}`;
        
        const response = await dmpApi.get(url);
        
        // Vérifier que la réponse est valide et extraire les données
        if (response.data && response.data.success) {
            console.log(`✅ ${response.data.count || 0} documents personnels récupérés avec succès`);
            return response.data.data;
        } else {
            throw new Error('Format de réponse invalide de l\'API');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des documents personnels:', error);
        // En cas d'erreur, essayer de récupérer depuis le dossier médical
        try {
            console.log('🔄 Fallback: récupération depuis le dossier médical...');
            const fallbackResponse = await dmpApi.get(`/dossierMedical/patient/${patientId}/complet`);
            const dossier = fallbackResponse.data.data;
            
            // Extraire les documents personnels du dossier médical
            let documents = [];
            if (dossier && dossier.documents_personnels && Array.isArray(dossier.documents_personnels)) {
                documents = dossier.documents_personnels;
            } else if (dossier && dossier.documents && Array.isArray(dossier.documents)) {
                documents = dossier.documents;
            }
            
            // Appliquer les filtres si nécessaire
            if (filters.type) {
                documents = documents.filter(doc => doc.type === filters.type);
            }
            if (filters.date_debut) {
                documents = documents.filter(doc => new Date(doc.createdAt) >= new Date(filters.date_debut));
            }
            if (filters.date_fin) {
                documents = documents.filter(doc => new Date(doc.createdAt) <= new Date(filters.date_fin));
            }
            
            console.log(`✅ ${documents.length} documents récupérés via fallback`);
            return documents;
        } catch (fallbackError) {
            console.error('❌ Erreur lors du fallback:', fallbackError);
            return [];
        }
    }
};

export const uploadDocumentDMP = async (patientId, documentData) => {
    // Utiliser l'endpoint de mise à jour du dossier médical
    const response = await dmpApi.put(`/dossierMedical/${patientId}`, documentData);
    return response.data.data;
};

// --- Auto-mesures DMP ---
// Utiliser les nouveaux endpoints auto-mesures dédiés
export const getAutoMesuresDMP = async (patientId = null, type = null) => {
    console.log('🔍 getAutoMesuresDMP - FONCTION APPELÉE avec patientId:', patientId, 'et type:', type);
    try {
        let url;
    	if (patientId) {
        // ✅ Utiliser le nouvel endpoint auto-mesures dédié
        url = `/patient/auto-mesures/${patientId}`;
    	} else {
        	// ✅ Récupérer toutes les auto-mesures
        	url = `/patient/auto-mesures/${patientId}`;
    	}
    
    	console.log('🔍 getAutoMesuresDMP - URL appelée:', url);
    
    	const response = await dmpApi.get(url);
    	console.log('🔍 getAutoMesuresDMP - Réponse complète de l\'API:', response);
    
    	// Les auto-mesures sont maintenant directement dans la réponse
    	let autoMesures = response.data.data || response.data || [];
    	console.log('🔍 getAutoMesuresDMP - Auto-mesures trouvées:', autoMesures);
    	if (type) {
        	autoMesures = autoMesures.filter(mesure => 
            	mesure.type_mesure === type || 
            	mesure.type === type
        	);
        	console.log('🔍 getAutoMesuresDMP - Auto-mesures filtrées par type:', type, autoMesures);
    	}
    
    	const result = { data: autoMesures };
    	console.log('🔍 getAutoMesuresDMP - Résultat final:', result);
return result;
}catch(error){
	console.error ( 'Erreur lors de la recuperation des auto-mesures DMP:', error);
};

};

// export const getAutoMesuresDMP = async (patientId = null, type = null) => {
//     console.log('🔍 getAutoMesuresDMP - FONCTION APPELÉE avec patientId:', patientId, 'et type:', type);
    
//     try {
//         let url;
//         if (patientId) {
//             // ✅ Utiliser la route existante du dossier médical
//             url = `/dossierMedical/patient/${patientId}/complet`;
//         } else {
//             // ✅ Récupérer le dossier du patient connecté
//             const patient = getStoredPatient();
//             if (!patient?.id_patient) {
//                 throw new Error('Aucun patient connecté trouvé');
//             }
//             url = `/dossierMedical/patient/${patient.id_patient}/complet`;
//         }
        
//         console.log('🔍 getAutoMesuresDMP - URL appelée:', url);
        
//         const response = await dmpApi.get(url);
//         console.log('🔍 getAutoMesuresDMP - Réponse complète de l\'API:', response);
        
//         // Extraire les auto-mesures du dossier médical complet
//         let autoMesures = [];
//         if (response.data && response.data.data) {
//             const dossierData = response.data.data;
            
//             // Essayer différents chemins possibles pour les auto-mesures
//             if (dossierData.autoMesures && Array.isArray(dossierData.autoMesures)) {
//                 autoMesures = dossierData.autoMesures;
//             } else if (dossierData.mesures && Array.isArray(dossierData.mesures)) {
//                 autoMesures = dossierData.mesures;
//             } else if (dossierData.auto_mesures && Array.isArray(dossierData.auto_mesures)) {
//                 autoMesures = dossierData.auto_mesures;
//             } else if (dossierData.mesures_auto && Array.isArray(dossierData.mesures_auto)) {
//                 autoMesures = dossierData.mesures_auto;
//             }
            
//             console.log('🔍 getAutoMesuresDMP - Auto-mesures extraites du dossier:', autoMesures);
//         }
        
//         if (type) {
//             autoMesures = autoMesures.filter(mesure => 
//                 mesure.type_mesure === type || 
//                 mesure.type === type
//             );
//             console.log('🔍 getAutoMesuresDMP - Auto-mesures filtrées par type:', type, autoMesures);
//         }
        
//         const result = { data: autoMesures };
//         console.log('🔍 getAutoMesuresDMP - Résultat final:', result);
//         return result;
        
//     } catch (error) {
//         console.error('❌ Erreur lors de la récupération des auto-mesures DMP:', error);
        
//         // Retourner un tableau vide en cas d'erreur pour éviter le crash
//         return { data: [] };
//     }
// };

// --- Nouvelles Fonctionnalités Disponibles ---

// Créer une nouvelle auto-mesure
export const createAutoMesureDMP = async (autoMesureData) => {
    const url = '/patient/auto-mesures';
    console.log('🔍 createAutoMesureDMP - Création auto-mesure:', autoMesureData);
    
    const response = await dmpApi.post(url, autoMesureData);
    console.log('🔍 createAutoMesureDMP - Réponse:', response);
    
    return response.data;
};

// Récupérer une auto-mesure spécifique par ID
export const getAutoMesureByIdDMP = async (autoMesureId) => {
    const url = `/patient/auto-mesures/${autoMesureId}`;
    console.log('�� getAutoMesureByIdDMP - Récupération ID:', autoMesureId);
    
    const response = await dmpApi.get(url);
    console.log('�� getAutoMesureByIdDMP - Réponse:', response);
    
    return response.data;
};

// Mettre à jour une auto-mesure
export const updateAutoMesureDMP = async (autoMesureId, updateData) => {
    const url = `/patient/auto-mesures/${autoMesureId}`;
    console.log('🔍 updateAutoMesureDMP - Mise à jour ID:', autoMesureId, updateData);
    
    const response = await dmpApi.put(url, updateData);
    console.log('🔍 updateAutoMesureDMP - Réponse:', response);
    
    return response.data;
};

// Supprimer une auto-mesure
export const deleteAutoMesureDMP = async (autoMesureId) => {
    const url = `/patient/auto-mesures/${autoMesureId}`;
    console.log('🔍 deleteAutoMesureDMP - Suppression ID:', autoMesureId);
    
    const response = await dmpApi.delete(url);
    console.log('🔍 deleteAutoMesureDMP - Réponse:', response);
    
    return response.data;
};

// Obtenir les statistiques des auto-mesures
export const getAutoMesuresStatsDMP = async (patientId, type = null) => {
    // ✅ Utiliser l'endpoint dédié aux statistiques
    let url = `/patient/${patientId}/auto-mesures/stats`;
    if (type) {
        url += `?type_mesure=${type}`;
    }
    
    console.log('🔍 getAutoMesuresStatsDMP - Statistiques:', patientId, type);
    
    const response = await dmpApi.get(url);
    console.log('🔍 getAutoMesuresStatsDMP - Réponse:', response);
    
    return response.data;
};

// Obtenir la dernière auto-mesure par type
export const getLastAutoMesureByTypeDMP = async (patientId, type) => {
    // ✅ Utiliser l'endpoint dédié à la dernière mesure
    const url = `/patient/${patientId}/auto-mesures/last/${type}`;
    console.log('🔍 getLastAutoMesureByTypeDMP - Dernière mesure:', patientId, type);
    
    const response = await dmpApi.get(url);
    console.log('🔍 getLastAutoMesureByTypeDMP - Réponse:', response);
    
    return response.data;
};

// --- DMP principal ---
export const getDMP = async (patientId = null) => {
    const url = patientId ? `/dossierMedical/patient/${patientId}/complet` : '/dossierMedical';
    const response = await dmpApi.get(url);
    return response.data.data;
};

// --- Mode urgence - Accès sans autorisation ---
export const getDMPUrgence = async (patientId = null) => {
    try {
        console.log(`🚨 Mode urgence - Accès au dossier patient ${patientId} sans autorisation`);
        
        // Créer une instance axios temporaire sans intercepteur pour le mode urgence
        const urgenceApi = axios.create({
            baseURL: API_URL,
            headers: { 
                "Content-Type": "application/json", 
                "Accept": "application/json",
                // Ajouter un header spécial pour indiquer le mode urgence
                "X-Mode-Urgence": "true"
            }
        });
        
        const url = patientId ? `/dossierMedical/patient/${patientId}/complet` : '/dossierMedical';
        console.log(`🔗 URL appelée en mode urgence: ${url}`);
        
        const response = await urgenceApi.get(url);
        console.log(`✅ Mode urgence - Dossier récupéré avec succès:`, response.data);
        
        return response.data.data;
    } catch (error) {
        console.error(`❌ Mode urgence - Erreur lors de l'accès au dossier:`, error);
        throw error;
    }
};

export const getHistoriqueMedicalUrgence = async (patientId = null) => {
    try {
        console.log(`🚨 Mode urgence - Accès à l'historique médical patient ${patientId} sans autorisation`);
        
        // Créer une instance axios temporaire sans intercepteur pour le mode urgence
        const urgenceApi = axios.create({
            baseURL: API_URL,
            headers: { 
                "Content-Type": "application/json", 
                "Accept": "application/json",
                "X-Mode-Urgence": "true"
            }
        });
        
        const url = patientId ? `/dossierMedical/patient/${patientId}/complet` : '/dossierMedical';
        const response = await urgenceApi.get(url);
        
        // Extraire l'historique du dossier médical
        const dossier = response.data.data;
        return { data: dossier?.historique || dossier?.historiqueMedical || [] };
    } catch (error) {
        console.error(`❌ Mode urgence - Erreur lors de l'accès à l'historique:`, error);
        throw error;
    }
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

// --- Consultations dans l'historique médical ---
export const getConsultationsHistoriqueMedical = async (patientId = null) => {
    try {
        console.log(`🔍 Récupération des consultations pour le patient ${patientId || 'connecté'}...`);
        
        // Utiliser directement l'API des consultations
        const consultationsResponse = await dmpApi.get(`/consultation/patient/${patientId}`);
        
        // Extraire les consultations de la réponse
        let consultations = [];
        if (consultationsResponse?.data) {
            consultations = Array.isArray(consultationsResponse.data) ? consultationsResponse.data : [consultationsResponse.data];
        }
        
        console.log(`✅ ${consultations.length} consultations récupérées via l'API des consultations`);
        
        // Enrichir les consultations avec des informations supplémentaires si nécessaire
        const consultationsEnrichies = consultations.map(consultation => {
            // Gérer le professionnel de santé
            let professionnel = consultation.professionnel;
            if (!professionnel) {
                if (consultation.medecin && typeof consultation.medecin === 'object') {
                    // Si medecin est un objet, extraire le nom
                    professionnel = consultation.medecin.nom && consultation.medecin.prenom 
                        ? `${consultation.medecin.prenom} ${consultation.medecin.nom}`
                        : consultation.medecin.nom || consultation.medecin.prenom || 'Professionnel de santé';
                } else if (consultation.medecin) {
                    professionnel = consultation.medecin;
                } else if (consultation.professionnel_id) {
                    professionnel = `Professionnel ID: ${consultation.professionnel_id}`;
                }
            }

            // Gérer le service
            let service = consultation.service;
            if (!service && consultation.service_id) {
                service = `Service ID: ${consultation.service_id}`;
            }

            return {
                ...consultation,
                type: consultation.type || 'consultation',
                date: consultation.date || consultation.date_consultation || consultation.createdAt,
                statut: consultation.statut || 'terminee',
                motif: consultation.motif || consultation.raison || 'Consultation médicale',
                observations: consultation.observations || consultation.commentaires || '',
                professionnel: professionnel,
                service: service
            };
        });
        
        return { 
            data: consultationsEnrichies, 
            status: 'success',
            count: consultationsEnrichies.length,
            patientId: patientId || 'patient_connecte'
        };
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des consultations:', error);
        return { 
            data: [], 
            status: 'error',
            message: 'Impossible de récupérer les consultations',
            count: 0,
            patientId: patientId || 'patient_connecte'
        };
    }
};

// --- Récupération des consultations par période ---
export const getConsultationsByPeriod = async (patientId, dateDebut, dateFin) => {
    try {
        console.log(`🔍 Récupération des consultations entre ${dateDebut} et ${dateFin} pour le patient ${patientId}...`);
        
        // Récupérer toutes les consultations
        const consultationsResponse = await getConsultationsHistoriqueMedical(patientId);
        const consultations = consultationsResponse.data;
        
        if (!Array.isArray(consultations)) {
            console.warn('⚠️ Aucune consultation disponible pour le filtrage par période');
            return { data: [], status: 'no_data', count: 0 };
        }
        
        // Filtrer par période
        const consultationsFiltrees = consultations.filter(consultation => {
            const dateConsultation = new Date(consultation.date || consultation.date_consultation || consultation.createdAt);
            const debut = new Date(dateDebut);
            const fin = new Date(dateFin);
            
            return dateConsultation >= debut && dateConsultation <= fin;
        });
        
        console.log(`✅ ${consultationsFiltrees.length} consultations trouvées pour la période spécifiée`);
        
        return { 
            data: consultationsFiltrees, 
            status: 'success',
            count: consultationsFiltrees.length,
            periode: { debut: dateDebut, fin: dateFin }
        };
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des consultations par période:', error);
        return { 
            data: [], 
            status: 'error',
            message: 'Erreur lors du filtrage par période',
            count: 0
        };
    }
};

// --- Récupération des consultations par type ---
export const getConsultationsByType = async (patientId, typeConsultation) => {
    try {
        console.log(`🔍 Récupération des consultations de type "${typeConsultation}" pour le patient ${patientId}...`);
        
        // Récupérer toutes les consultations
        const consultationsResponse = await getConsultationsHistoriqueMedical(patientId);
        const consultations = consultationsResponse.data;
        
        if (!Array.isArray(consultations)) {
            console.warn('⚠️ Aucune consultation disponible pour le filtrage par type');
            return { data: [], status: 'no_data', count: 0 };
        }
        
        // Filtrer par type
        const consultationsFiltrees = consultations.filter(consultation => {
            const type = consultation.type || consultation.categorie || consultation.nature || '';
            return type.toLowerCase().includes(typeConsultation.toLowerCase());
        });
        
        console.log(`✅ ${consultationsFiltrees.length} consultations de type "${typeConsultation}" trouvées`);
        
        return { 
            data: consultationsFiltrees, 
            status: 'success',
            count: consultationsFiltrees.length,
            type: typeConsultation
        };
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des consultations par type:', error);
        return { 
            data: [], 
            status: 'error',
            message: 'Erreur lors du filtrage par type',
            count: 0
        };
    }
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

// Fonction pour vérifier si un médecin a encore accès à un patient
export const verifierAccesMedecinPatient = async (professionnelId, patientId) => {
    try {
        const response = await dmpApi.get(`/access/check/${professionnelId}/${patientId}/status`);
        return {
            hasAccess: response.data.data?.hasAccess || false,
            status: response.data.data?.status || 'unknown',
            message: response.data.data?.message || 'Statut d\'accès non disponible'
        };
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'accès:', error);
        return {
            hasAccess: false,
            status: 'error',
            message: 'Erreur lors de la vérification de l\'accès'
        };
    }
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
    // gestion des acces au DMP
    getPendingAccessRequests,
    respondToAccessRequest,
    getPatientAuthorizations,
    getPatientAccessHistory,
    authenticateCPS,
    requestStandardAccess,
    recordEmergencyAccess,
    getAccessStatus,
    getSecureDossierForMedecin,
    getSentAccessRequests,
    getMedecinAccessRequests,
    // gestion des acces patient
    getPatientSentAccessRequests,
    getPatientAccessStatus,
    getPatientConsultations,
    getPatientInfo,
    getAutorisations,
    accepterAutorisation,
    refuserAutorisation,
    revokerAutorisation,
    revokerAutorisationMedecin,
    revokerAutorisationUnified, 
    getNotificationsStats,
    marquerToutesNotificationsLues,
    marquerNotificationDroitsAccesLue,
    getDMPAccessHistory,
    getDocumentsDMP,
    getDocumentsPersonnelsDMP,
    uploadDocumentDMP,
    getAutoMesuresDMP,
    createAutoMesureDMP,
    getDMP,
    updateDMP,
    getHistoriqueMedical,
    getConsultationsHistoriqueMedical,
    getConsultationsByPeriod,
    getConsultationsByType,
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
    verifierAccesMedecinPatient,
    getDureeRestante,
    // Recherche et accès d'urgence
    searchPatientFullData,
};

export default dmpApiExports;