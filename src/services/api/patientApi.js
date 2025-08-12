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

// ... existing code ...

// 7-) récupération des prescriptions d'un patient
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

// 8-) récupération de toutes les prescriptions d'un patient (avec pagination automatique)
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
                limit: 100 // Maximum autorisé par l'API
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

// 9-) récupération des prescriptions actives d'un patient
export const getActivePrescriptionsByPatient = async (patientId) => {
    const result = await getPrescriptionsByPatient(patientId, { statut: 'active' });
    
    // Ajouter des métadonnées spécifiques
    if (result.success) {
        result.metadata.typeFiltre = 'actives';
        result.metadata.description = 'Prescriptions avec statut "active" uniquement';
    }
    
    return result;
};

// 10-) récupération des ordonnances d'un patient
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

// 11-) récupération des demandes d'examen d'un patient
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

// 12-) Fonction utilitaire pour extraire facilement les informations
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

// 13-) Fonction utilitaire pour vérifier si la réponse contient des données
export const hasPrescriptions = (apiResponse) => {
    return apiResponse && 
           apiResponse.success && 
           apiResponse.prescriptions && 
           apiResponse.prescriptions.length > 0;
};

// 14-) Fonction utilitaire pour obtenir le nombre de prescriptions
export const getPrescriptionCount = (apiResponse) => {
    return apiResponse?.prescriptions?.length || 0;
};

const patientApi = {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    loginPatient,
    getPrescriptionsByPatient,        // ✅ Ajouté
    getAllPrescriptionsByPatient,     // ✅ Ajouté
    getActivePrescriptionsByPatient,  // ✅ Ajouté
    getOrdonnancesByPatient,          // ✅ Ajouté
    getExamensByPatient,              // ✅ Ajouté
    extractPrescriptionData,           // ✅ Nouvelle fonction utilitaire
    hasPrescriptions,                  // ✅ Nouvelle fonction utilitaire
    getPrescriptionCount               // ✅ Nouvelle fonction utilitaire
};

export default patientApi;