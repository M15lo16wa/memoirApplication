import axios from "axios";

const API_URL = "http://localhost:3000/api";

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
        // 🔍 DEBUG - Vérifier tous les tokens disponibles
        const allTokens = {
            originalJWT: localStorage.getItem('originalJWT'),
            firstConnectionToken: localStorage.getItem('firstConnectionToken'),
            jwt: localStorage.getItem('jwt'),
            token: localStorage.getItem('token'),
            tempTokenIdUrgence: localStorage.getItem('tempTokenId_urgence')
        };
        
        console.log('[patientApi] 🔍 Tokens disponibles:', {
            hasOriginalJWT: !!allTokens.originalJWT,
            hasFirstConnectionToken: !!allTokens.firstConnectionToken,
            hasJwt: !!allTokens.jwt,
            hasToken: !!allTokens.token,
            hasTempTokenIdUrgence: !!allTokens.tempTokenIdUrgence,
            jwtLength: allTokens.jwt?.length || 0,
            tokenLength: allTokens.token?.length || 0
        });
        
        // ✅ SÉLECTION STRICTE : Prioriser les JWT de première connexion et rejeter les tokens temporaires
        const candidates = [
            allTokens.originalJWT,
            allTokens.firstConnectionToken,
            allTokens.jwt,
            allTokens.token,
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
            console.log('[patientApi] ✅ JWT valide utilisé pour Authorization:', `${usedToken.substring(0, 20)}...`);
        } else {
            console.warn('[patientApi] ⚠️ Aucun JWT valide disponible pour l\'authentification');
            console.log('[patientApi] 🔍 Détail des tokens rejetés:', {
                originalJWT: allTokens.originalJWT ? `${allTokens.originalJWT.substring(0, 20)}...` : 'null',
                firstConnectionToken: allTokens.firstConnectionToken ? `${allTokens.firstConnectionToken.substring(0, 20)}...` : 'null',
                jwt: allTokens.jwt ? `${allTokens.jwt.substring(0, 20)}...` : 'null',
                token: allTokens.token ? `${allTokens.token.substring(0, 20)}...` : 'null'
            });
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================================================
// 👥 FONCTIONS PATIENT - GESTION DES DONNÉES PERSONNELLES
// ============================================================================

// 1-) Affichage de tous les patients (lecture seule) - FONCTION ADMINISTRATIVE
export const getPatients = async () => {
    try {
        // Essayer d'abord l'endpoint spécifique pour les patients
        let response = await api.get('/patients');
        
        // Si ça ne marche pas, essayer l'endpoint générique
        if (!response || !response.data || response.data.length === 0) {
            console.log('Tentative avec endpoint alternatif...');
            response = await api.get('/patient');
        }
        
        if (!response || !response.data) {
            console.error('Invalid API response format for patients');
            return [];
        }
        
        // Backend returns: { status: 'success', results: N, data: [...] }
        if (response.data.status === 'success' && response.data.data && Array.isArray(response.data.data)) {
            console.log('✅ Patients found in response.data.data:', response.data.data);
            return response.data.data;
        }
        
        // Nouveau format: { status: 'success', results: N, data: { patients: [...] } }
        if (response.data.status === 'success' && response.data.data && response.data.data.patients && Array.isArray(response.data.data.patients)) {
            console.log('✅ Patients found in response.data.data.patients:', response.data.data.patients);
            return response.data.data.patients;
        }
        
        // Debug: Log la structure exacte de data
        if (response.data.status === 'success' && response.data.data) {
            console.log('🔍 Structure de response.data.data:', response.data.data);
            console.log('🔍 Type de response.data.data:', typeof response.data.data);
            console.log('🔍 Clés disponibles:', Object.keys(response.data.data));
        }
        
        // Fallback formats for compatibility
        if (response.data && response.data.patients && Array.isArray(response.data.patients)) {
            return response.data.patients;
        }
        
        if (Array.isArray(response.data)) {
            // Si les données sont des paramètres biologiques, extraire les patients uniques
            const patientsMap = new Map();
            
            response.data.forEach(item => {
                if (item.patient && item.patient.id_patient) {
                    const patientId = item.patient.id_patient;
                    if (!patientsMap.has(patientId)) {
                        patientsMap.set(patientId, {
                            id_patient: patientId,
                            nom: item.patient.nom || '',
                            prenom: item.patient.prenom || '',
                            // Ajouter d'autres champs si disponibles
                            statut: 'Actif',
                            date_naissance: null,
                            sexe: null,
                            telephone: null,
                            email: null,
                            adresse: null,
                            code_postal: null,
                            ville: null,
                            groupe_sanguin: null
                        });
                    }
                }
            });
            
            const patients = Array.from(patientsMap.values());
            console.log('✅ Patients extraits des paramètres biologiques:', patients);
            return patients;
        }
        
        console.error('Unexpected patients response format:', response.data);
        return [];
        
    } catch (error) {
        console.error('Service patients non disponible:', error.message);
        return [];
    }
};

// 1b-) Récupération des patients d'un médecin spécifique (FONCTION SÉCURISÉE)
export const getPatientsByMedecin = async () => {
    try {
        console.log('🔍 [patientApi] Récupération des patient:',);
        
        // Endpoint spécifique pour récupérer les patients d'un médecin
        const response = await api.get(`/patient`);
        
        if (!response || !response.data) {
            console.error('❌ [patientApi] Réponse API invalide aucun patient trouvé');
            return [];
        }
        
        // Format standard de l'API
        if (response.data.status === 'success' && response.data.data && Array.isArray(response.data.data)) {
            console.log('✅ [patientApi] Patients du médecin récupérés:', response.data.data.length);
            return response.data.data;
        }
        
        // Format alternatif
        if (response.data.status === 'success' && response.data.data && response.data.data.patients && Array.isArray(response.data.data.patients)) {
            console.log('✅ [patientApi] Patients du médecin récupérés (format alternatif):', response.data.data.patients.length);
            return response.data.data.patients;
        }
        
        // Fallback : essayer de récupérer via les consultations
        console.log('🔄 [patientApi] Tentative de récupération via les consultations...');
        const consultationsResponse = await api.get(`/consultation`);
        
        if (consultationsResponse && consultationsResponse.data && consultationsResponse.data.status === 'success') {
            const consultations = consultationsResponse.data.data || [];
            const patientsMap = new Map();
            
            consultations.forEach(consultation => {
                if (consultation.patient && consultation.patient.id_patient) {
                    const patientId = consultation.patient.id_patient;
                    if (!patientsMap.has(patientId)) {
                        patientsMap.set(patientId, {
                            id: patientId,
                            id_patient: patientId,
                            nom: consultation.patient.nom || '',
                            prenom: consultation.patient.prenom || '',
                            date_naissance: consultation.patient.date_naissance || null,
                            sexe: consultation.patient.sexe || null,
                            telephone: consultation.patient.telephone || null,
                            email: consultation.patient.email || null,
                            statut: 'Actif',
                            // Informations de la consultation
                            derniere_consultation: consultation.date_consultation,
                            type_consultation: consultation.type_consultation
                        });
                    }
                }
            });
            
            const patients = Array.from(patientsMap.values());
            console.log('✅ [patientApi] Patients extraits des consultations:', patients.length);
            return patients;
        }
        
        console.warn('⚠️ [patientApi] Aucun patient trouvé:',);
        return [];
        
    } catch (error) {
        console.error('❌ [patientApi] Erreur lors de la récupération des patients:', error);
        
        // En cas d'erreur, retourner une liste vide mais log l'erreur
        if (error.response) {
            console.error('❌ [patientApi] Détails de l\'erreur:', {
                status: error.response.status,
                message: error.response.data?.message || 'Erreur inconnue'
            });
        }
        
        return [];
    }
};

// 2-) Affichage d'un patient spécifique
export const getPatient = async(id) => {
    try{
        const response = await api.get(`/patient/${id}`);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 3-) Création d'un patient (fonction administrative)
export const createPatient = async(patient) => {
    try{
        const response = await api.post(`/patient`, patient);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 4-) Mise à jour d'un patient
export const updatePatient = async(id, patient) => {
    try{
        const response = await api.put(`/patient/${id}`, patient);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 5-) Suppression d'un patient (fonction administrative)
export const deletePatient = async(id) => {
    try{
        const response = await api.delete(`/patient/${id}`);
        return response.data;
    }catch(error){
        throw error;
    }
};

// 6-) Connexion d'un patient
export const loginPatient = async(patient) => {
    try{
        const response = await api.post(`/patient/auth/login`, patient);
        return response.data;
    }catch(error){
        throw error;
    }
};

// ============================================================================
// 🏥 FONCTIONS PATIENT - GESTION DES SERVICES DE SANTÉ
// ============================================================================

// 7-) Récupération des services de santé
export const getServices = async () => {
    try{
        const response = await api.get('/service-sante');
        
        if (!response || !response.data) {
            console.error('Invalid API response format for services');
            return [];
        }
        
        // Backend returns: { status: 'success', results: N, data: { services: [...] } }
        if (response.data.status === 'success' && response.data.data && Array.isArray(response.data.data.services)) {
            return response.data.data.services;
        }
        
        // Fallback formats for compatibility
        if (response.data && response.data.services && Array.isArray(response.data.services)) {
            return response.data.services;
        }
        
        if (Array.isArray(response.data)) {
            return response.data;
        }
        
        console.error('Unexpected services response format:', response.data);
        return [];
        
    } catch (error) {
        console.error('Service services non disponible:', error.message);
        return [];
    }
};

// ============================================================================
// 📋 FONCTIONS PATIENT - GESTION DES PRESCRIPTIONS
// ============================================================================

// 8-) Récupération des prescriptions d'un patient
export const getPrescriptionsByPatient = async (patientId, options = {}) => {
    try {
        // Validation des paramètres
        if (!patientId || isNaN(patientId) || patientId < 1) {
            throw new Error('ID du patient invalide. Doit être un nombre positif.');
        }

        // Construction des paramètres de requête
        const queryParams = new URLSearchParams();
        
        if (options.statut) {
            queryParams.append('statut', options.statut);
        }
        
        if (options.type_prescription) {
            queryParams.append('type_prescription', options.type_prescription);
        }
        
        if (options.page && options.page > 0) {
            queryParams.append('page', options.page.toString());
        }
        
        if (options.limit && options.limit > 0 && options.limit <= 100) {
            queryParams.append('limit', options.limit.toString());
        }
        
        // 🔑 PARAMÈTRE CRUCIAL : Inclure les informations du médecin
        queryParams.append('include_medecin', 'true');
        queryParams.append('include_redacteur', 'true');

        // Construction de l'URL avec paramètres
        const url = `/prescription/patient/${patientId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        
        console.log('[patientApi] Récupération des prescriptions pour le patient:', patientId);
        console.log('[patientApi] URL de la requête:', url);

        // Appel API
        const response = await api.get(url);
        
        if (response.status === 200) {
            const apiResponse = response.data;
            console.log('[patientApi] Prescriptions récupérées avec succès:', apiResponse.data.prescriptions.length, 'prescription(s)');
            
            // Retourner une réponse structurée et facile à utiliser
            return {
                success: true,
                status: apiResponse.status,
                message: apiResponse.message,
                // Données principales
                prescriptions: apiResponse.data.prescriptions || [],
                total: apiResponse.data.total || 0,
                // Informations de pagination
                pagination: {
                    page: apiResponse.data.pagination?.page || 1,
                    limit: apiResponse.data.pagination?.limit || 10,
                    totalPages: apiResponse.data.pagination?.totalPages || 1,
                    hasNext: apiResponse.data.pagination?.hasNext || false,
                    hasPrev: apiResponse.data.pagination?.hasPrev || false
                },
                // Métadonnées utiles
                metadata: {
                    patientId: patientId,
                    filters: options,
                    timestamp: new Date().toISOString(),
                    count: apiResponse.data.prescriptions?.length || 0
                },
                // Données brutes de l'API (pour compatibilité)
                raw: apiResponse
            };
        } else {
            throw new Error(`Erreur inattendue: ${response.status}`);
        }

    } catch (error) {
        console.error('[patientApi] Erreur lors de la récupération des prescriptions du patient:', error);
        
        // Gestion des erreurs spécifiques
        if (error.response) {
            const { status, data } = error.response;
            
            switch (status) {
                case 401:
                    throw new Error('Non autorisé. Veuillez vous reconnecter.');
                case 403:
                    throw new Error('Accès interdit. Vous ne pouvez accéder qu\'à vos propres prescriptions.');
                case 404:
                    throw new Error('Patient non trouvé.');
                case 400:
                    throw new Error(`Données invalides: ${data.message || 'Paramètres de requête incorrects'}`);
                case 500:
                    throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
                default:
                    throw new Error(`Erreur ${status}: ${data.message || 'Erreur inconnue'}`);
            }
        }
        
        // Erreur réseau ou autre
        if (error.message.includes('Network Error')) {
            throw new Error('Erreur de connexion. Vérifiez votre connexion internet.');
        }
        
        throw error;
    }
};

// 9-) Récupération de toutes les prescriptions d'un patient AVEC informations du médecin
export const getAllPrescriptionsByPatient = async (patientId, options = {}) => {
    try {
        const allPrescriptions = [];
        let page = 1;
        let hasMore = true;
        let totalPages = 0;
        
        console.log('[patientApi] Récupération de toutes les prescriptions du patient:', patientId);
        
        while (hasMore) {
            const result = await getPrescriptionsByPatient(patientId, {
                ...options,
                page,
                limit: 100, // Maximum autorisé par l'API
                include_medecin: true, // 🔑 FORCER l'inclusion des infos médecin
                include_redacteur: true // 🔑 FORCER l'inclusion des infos rédacteur
            });
            
            if (result.success && result.prescriptions && result.prescriptions.length > 0) {
                allPrescriptions.push(...result.prescriptions);
                
                // Mettre à jour le nombre total de pages
                if (page === 1) {
                    totalPages = Math.ceil(result.total / result.pagination.limit);
                }
                
                page++;
                hasMore = page <= totalPages;
                
                console.log(`[patientApi] Page ${page - 1}/${totalPages} récupérée:`, result.prescriptions.length, 'prescriptions');
            } else {
                hasMore = false;
            }
        }
        
        console.log('[patientApi] Total des prescriptions récupérées:', allPrescriptions.length);
        
        // Retourner une réponse structurée
        return {
            success: true,
            status: 'success',
            message: `Toutes les prescriptions récupérées (${allPrescriptions.length} au total)`,
            // Données principales
            prescriptions: allPrescriptions,
            total: allPrescriptions.length,
            // Informations de pagination
            pagination: {
                totalPages: totalPages,
                pagesRecuperees: totalPages,
                totalElements: allPrescriptions.length
            },
            // Métadonnées utiles
            metadata: {
                patientId: patientId,
                filters: options,
                timestamp: new Date().toISOString(),
                method: 'getAllPrescriptionsByPatient',
                paginationAutomatique: true
            },
            // Statistiques utiles
            stats: {
                totalPrescriptions: allPrescriptions.length,
                parType: allPrescriptions.reduce((acc, prescription) => {
                    const type = prescription.type_prescription || 'inconnu';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                }, {}),
                parStatut: allPrescriptions.reduce((acc, prescription) => {
                    const statut = prescription.statut || 'inconnu';
                    acc[statut] = (acc[statut] || 0) + 1;
                    return acc;
                }, {}),
                datePlusRecente: allPrescriptions.length > 0 ? 
                    new Date(Math.max(...allPrescriptions.map(p => new Date(p.date_prescription || 0)))) : null,
                datePlusAncienne: allPrescriptions.length > 0 ? 
                    new Date(Math.min(...allPrescriptions.map(p => new Date(p.date_prescription || 0)))) : null
            }
        };
        
    } catch (error) {
        console.error('[patientApi] Erreur lors de la récupération de toutes les prescriptions:', error);
        throw error;
    }
};

// 10-) Récupération des prescriptions actives d'un patient
export const getActivePrescriptionsByPatient = async (patientId) => {
    const result = await getPrescriptionsByPatient(patientId, { statut: 'active' });
    
    // Ajouter des métadonnées spécifiques
    if (result.success) {
        result.metadata.typeFiltre = 'actives';
        result.metadata.description = 'Prescriptions avec statut "active" uniquement';
    }
    
    return result;
};

// 11-) Récupération des ordonnances d'un patient
export const getOrdonnancesByPatient = async (patientId, options = {}) => {
    const result = await getPrescriptionsByPatient(patientId, { 
        ...options, 
        type_prescription: 'ordonnance' 
    });
    
    // Ajouter des métadonnées spécifiques
    if (result.success) {
        result.metadata.typeFiltre = 'ordonnances';
        result.metadata.description = 'Prescriptions de type "ordonnance" uniquement';
    }
    
    return result;
};

// 12-) Récupération des demandes d'examen d'un patient
export const getExamensByPatient = async (patientId, options = {}) => {
    const result = await getPrescriptionsByPatient(patientId, { 
        ...options, 
        type_prescription: 'examen' 
    });
    
    // Ajouter des métadonnées spécifiques
    if (result.success) {
        result.metadata.typeFiltre = 'examens';
        result.metadata.description = 'Prescriptions de type "examen" uniquement';
    }
    
    return result;
};

// ============================================================================
// 📊 FONCTIONS PATIENT - GESTION DES DONNÉES MÉDICALES
// ============================================================================

// 13-) Récupération des paramètres biologiques d'un patient
export const getParametresBiologiques = async (patientId) => {
    try {
        const response = await api.get(`/parametres-biologiques/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des paramètres biologiques:', error);
        return [];
    }
};

// 14-) Récupération des antécédents médicaux d'un patient
export const getAntecedentsMedicaux = async (patientId) => {
    try {
        const response = await api.get(`/antecedents-medicaux/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des antécédents médicaux:', error);
        return [];
    }
};

// 15-) Récupération des allergies d'un patient
export const getAllergies = async (patientId) => {
    try {
        const response = await api.get(`/allergies/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des allergies:', error);
        return [];
    }
};

// 16-) Récupération de l'historique des consultations d'un patient
export const getHistoriqueConsultations = async (patientId) => {
    try {
        const response = await api.get(`/consultation/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des consultations:', error);
        return [];
    }
};

// 17-) Récupération des documents d'un patient
export const getPatientDocuments = async (patientId) => {
    try {
        const response = await api.get(`/dossierMedical/patient/${patientId}/complet`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des documents du patient:', error);
        return [];
    }
};

// 18-) Récupération des documents récents d'un patient
export const getDocumentsRecents = async (Id) => {
    try {
        const response = await api.get(`/dossierMedical/${Id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des documents récents:', error);
        return [];
    }
};

// ============================================================================
// 🔧 FONCTIONS UTILITAIRES POUR LES PATIENTS
// ============================================================================

// 19-) Fonction utilitaire pour extraire facilement les informations
export const extractPrescriptionData = (apiResponse) => {
    if (!apiResponse || !apiResponse.success) {
        return null;
    }
    
    return {
        // Données de base
        prescriptions: apiResponse.prescriptions || [],
        total: apiResponse.total || 0,
        
        // Pagination
        page: apiResponse.pagination?.page || 1,
        limit: apiResponse.pagination?.limit || 10,
        totalPages: apiResponse.pagination?.totalPages || 1,
        hasNext: apiResponse.pagination?.hasNext || false,
        hasPrev: apiResponse.pagination?.hasPrev || false,
        
        // Métadonnées
        patientId: apiResponse.metadata?.patientId,
        filters: apiResponse.metadata?.filters || {},
        timestamp: apiResponse.metadata?.timestamp,
        
        // Statistiques (si disponibles)
        stats: apiResponse.stats || null,
        
        // Message
        message: apiResponse.message
    };
};

// 20-) Fonction utilitaire pour vérifier si la réponse contient des données
export const hasPrescriptions = (apiResponse) => {
    return apiResponse && 
        apiResponse.success && 
        apiResponse.prescriptions && 
        apiResponse.prescriptions.length > 0;
};

// 21-) Fonction utilitaire pour obtenir le nombre de prescriptions
export const getPrescriptionCount = (apiResponse) => {
    return apiResponse?.prescriptions?.length || 0;
};

// ============================================================================
// 📋 EXPORT DES FONCTIONS PATIENT
// ============================================================================

const patientApi = {
    // Gestion des patients
    getPatients,
    getPatientsByMedecin,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    loginPatient,
    
    // Services de santé
    getServices,
    
    // Prescriptions
    getPrescriptionsByPatient,       
    getAllPrescriptionsByPatient,
    getActivePrescriptionsByPatient, 
    getOrdonnancesByPatient,         
    getExamensByPatient,           
    
    // Données médicales
    getParametresBiologiques,
    getAntecedentsMedicaux,
    getAllergies,
    getHistoriqueConsultations,
    getPatientDocuments,
    getDocumentsRecents,
    
    // Fonctions utilitaires
    extractPrescriptionData,          
    hasPrescriptions,                 
    getPrescriptionCount              
};

export default patientApi;
