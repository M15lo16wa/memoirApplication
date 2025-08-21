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
// PRIORITÉ : Token médecin/professionnel pour accéder aux routes administratives
api.interceptors.request.use(
    (config) => {
        // ✅ SÉLECTION STRICTE : Prioriser les JWT de première connexion et rejeter les tokens temporaires
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
            console.log('🔐 [medicalApi] JWT valide utilisé pour Authorization:', `${usedToken.substring(0, 20)}...`);
        } else {
            console.warn('⚠️ [medicalApi] Aucun JWT valide disponible pour l\'authentification');
        }

        // IMPORTANT: Supprimer le Content-Type global pour les FormData
        // Axios doit pouvoir définir automatiquement le bon Content-Type avec boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor pour gérer les erreurs d'authentification
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // On laisse la gestion du 401 au composant appelant
        return Promise.reject(error);
    }
);

// ============================================================================
// 🏥 FONCTIONS MÉDECIN/PROFESSIONNEL - GESTION ADMINISTRATIVE
// ============================================================================

// 1-) Récupération des rendez-vous d'un patient (médecin)
const getPatientRendezVous = async (patientId) => {
    try {
        const response = await api.get(`/rendez-vous/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        return [];
    }
};

// 2-) Récupération du prochain rendez-vous d'un patient (médecin)
const getProchainRendezVous = async (patientId) => {
    try {
        const response = await api.get(`/rendez-vous/patient/${patientId}/prochain`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du prochain rendez-vous:', error);
        return null;
    }
};

// 3-) Récupération des traitements actifs d'un patient (médecin)
const getTraitementsActifs = async (patientId) => {
    try {
        const response = await api.get(`/prescription/patient/${patientId}/actifs`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des traitements actifs:', error);
        return [];
    }
};

// 4-) Création d'une ordonnance (médecin)
const createOrdonnance = async (ordonnanceData) => {
    try {
        console.log('Creating ordonnance with data:', ordonnanceData);
        const response = await api.post(`/prescription/ordonnance`, ordonnanceData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création de l\'ordonnance:', error);
        throw error;
    }
};

// 5-) Création d'un examen (médecin)
const createExamen = async (examen) => {
    try {
        const response = await api.post(`/prescription/demande-examen`, examen);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création de l\'examen:', error);
        throw error;
    }
};

// 6-) Récupération de toutes les prescriptions (médecin)
const getAllPrescriptions = async (patient_id) => {
    try {
        const response = await api.get(`/prescription/patient/${patient_id}`);
        console.log('Réponse prescriptions:', response);
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('Erreur lors de la récupération des prescriptions:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        } else {
            console.error('Erreur lors de la récupération des prescriptions:', error.message);
        }
        throw error;
    }
};

// 7-) Récupération des ordonnances récentes (médecin)
const getOrdonnancesRecentes = async (filters = {}) => {
    try {
        const { limit, type, professionnel_id, patient_id } = filters;
        
        // Construction des paramètres de requête
        const params = new URLSearchParams();
        if (limit){ params.append('limit', limit)};
        if (type){ params.append('type', type)};
        if (professionnel_id){ params.append('professionnel_id', professionnel_id)};
        if (patient_id) {params.append('patient_id', patient_id)};
        
        const queryString = params.toString();
        const url = `/prescription/ordonnances-recentes${queryString ? `?${queryString}` : ''}`;
        
        const response = await api.get(url);
        console.log('Réponse ordonnances récentes:', response);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des ordonnances récentes:', error);
        throw error;
    }
};

// 8-) Création d'une ordonnance complète avec notification (médecin)
const createOrdonnanceComplete = async (ordonnanceData) => {
    try {
        console.log('Creating ordonnance complete with data:', ordonnanceData);
        const response = await api.post(`/prescription/ordonnance-complete`, ordonnanceData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création de l\'ordonnance complète:', error);
        throw error;
    }
};

// 9-) Ajouter une prescription au dossier patient (médecin)
const ajouterPrescriptionAuDossier = async (prescriptionId, dossierId) => {
    try {
        const response = await api.post(`/prescription/${prescriptionId}/ajouter-dossier`, { dossier_id: dossierId });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la prescription au dossier:', error);
        throw error;
    }
};

// 10-) Créer une notification (médecin)
const creerNotification = async (prescriptionId, notificationData) => {
    try {
        const response = await api.post(`/prescription/${prescriptionId}/notification`, notificationData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création de la notification:', error);
        throw error;
    }
};

// 11-) Marquer une notification comme lue (médecin)
const marquerNotificationLue = async (notificationId) => {
    try {
        const response = await api.patch(`/prescription/notification/${notificationId}/lue`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors du marquage de la notification:', error);
        throw error;
    }
};

// 12-) Récupérer les notifications d'un patient (médecin)
const getNotificationsPatient = async (patientId, statut = null) => {
    try {
        const url = statut ? 
            `/prescription/patient/${patientId}/notifications?statut=${statut}` :
            `/prescription/patient/${patientId}/notifications`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        throw error;
    }
};

// 13-) Récupérer le résumé des ordonnances d'aujourd'hui (médecin)
const getResumeAujourdhui = async () => {
    try {
        const response = await api.get(`/prescription/resume-aujourdhui`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du résumé:', error);
        throw error;
    }
};

// ============================================================================
// 📁 GESTION DES DOSSIERS MÉDICAUX (MÉDECIN)
// ============================================================================

// 14-) Création de dossier medical (médecin)
const createDossierMedical = async (dossierMedical) => {
    try {
        console.log('Creating dossier medical with data:', dossierMedical);
        
        // Validate required fields
        if (!dossierMedical.patient_id) {
            throw new Error('ID du patient requis');
        }
        if (!dossierMedical.service_id) {
            throw new Error('ID du service requis');
        }
        
        const response = await api.post(`/dossierMedical`, dossierMedical);
        console.log('Dossier medical créé:', response.data);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création du dossier medical:', error);
        throw error.response?.data?.message || error.message || 'Erreur lors de la création du dossier medical';
    }
};

// 15-) Récupération d'un dossier medical spécifique (médecin)
const getDossierMedical = async (Id) => {
    try {
        const response = await api.get(`/dossierMedical/${Id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du dossier medical:', error);
        throw error;
    }
};

// 16-) Récupération de tous les dossiers medicaux (médecin)
const getAllDossiersMedical = async () => {
    try {
        console.log('Fetching all dossiers medical from API...');
        const response = await api.get(`/dossierMedical`);
        console.log('Dossiers medical API response:', response.data);
        
        if (!response || !response.data) {
            console.error('Invalid API response format:', response);
            return { data: [], status: 'error', message: 'Format de réponse invalide' };
        }
        
        // Backend returns: { status: 'success', results: N, data: { dossiers: [...] } }
        if (response.data.status === 'success' && response.data.data && Array.isArray(response.data.data.dossiers)) {
            const dossiers = response.data.data.dossiers;
            console.log('Found dossiers:', dossiers);
            
            // Debug: Log the first dossier structure to see what fields are available
            if (dossiers.length > 0) {
                console.log('=== RAW DOSSIER STRUCTURE DEBUG ===');
                console.log('First dossier raw data:', dossiers[0]);
                console.log('All keys in first dossier:', Object.keys(dossiers[0]));
                console.log('NumeroDossier fields:', {
                    numeroDossier: dossiers[0].numeroDossier,
                    numero_dossier: dossiers[0].numero_dossier,
                    numeroDossier_exact: dossiers[0].numeroDossier,
                    'numeroDossier (string)': dossiers[0]['numeroDossier']
                });
                console.log('Patient-related fields:', {
                    patient_id: dossiers[0].patient_id,
                    patientId: dossiers[0].patientId,
                    id_patient: dossiers[0].id_patient,
                    patient: dossiers[0].patient,
                    Patient: dossiers[0].Patient
                });
                console.log('Service-related fields:', {
                    service_id: dossiers[0].service_id,
                    serviceId: dossiers[0].serviceId,
                    id_service: dossiers[0].id_service,
                    service: dossiers[0].service,
                    Service: dossiers[0].Service
                });
                console.log('=====================================');
            }
            
            // ✅ CORRECTION : Enrichir les dossiers avec les informations des patients et services
            console.log('🔍 Enrichissement des dossiers avec les données patients et services...');
            
            try {
                // Importer dynamiquement les fonctions nécessaires
                const { getPatients } = await import('./patientApi.js');
                const { getServices } = await import('./patientApi.js');
                
                // Récupérer les patients et services
                const [patientsResponse, servicesResponse] = await Promise.all([
                    getPatients(),
                    getServices()
                ]);
                
                console.log('📊 Patients récupérés pour enrichissement:', patientsResponse);
                console.log('📊 Services récupérés pour enrichissement:', servicesResponse);
                
                // Créer des maps pour un accès rapide
                const patientsMap = new Map();
                const servicesMap = new Map();
                
                if (Array.isArray(patientsResponse)) {
                    patientsResponse.forEach(patient => {
                        const patientId = patient.id_patient || patient.id || patient.patientId;
                        if (patientId) {
                            patientsMap.set(patientId.toString(), patient);
                        }
                    });
                }
                
                if (Array.isArray(servicesResponse)) {
                    servicesResponse.forEach(service => {
                        const serviceId = service.id_service || service.id || service.serviceId;
                        if (serviceId) {
                            servicesMap.set(serviceId.toString(), service);
                        }
                    });
                }
                
                console.log(`🗺️ Map patients créée avec ${patientsMap.size} entrées`);
                console.log(`🗺️ Map services créée avec ${servicesMap.size} entrées`);
                
                // Enrichir les dossiers
                const enrichedDossiers = dossiers.map((dossier) => {
                    try {
                        // Identifier l'ID du patient et du service
                        const patientId = dossier.patient_id || dossier.patientId || dossier.id_patient;
                        const serviceId = dossier.service_id || dossier.serviceId || dossier.id_service;
                        
                        console.log(`🔍 Enrichissement dossier ${dossier.id_dossier || dossier.id}:`, {
                            patientId,
                            serviceId,
                            patientFound: patientsMap.has(patientId?.toString()),
                            serviceFound: servicesMap.has(serviceId?.toString())
                        });
                        
                        // Récupérer les informations du patient et du service
                        const patient = patientsMap.get(patientId?.toString());
                        const service = servicesMap.get(serviceId?.toString());
                        
                        // Create proper file number
                        let fileNumber = dossier.numeroDossier || dossier.numero_dossier;
                        if (!fileNumber || fileNumber === 'N/A' || fileNumber === 'undefined') {
                            const dossierId = dossier.id_dossier || dossier.id;
                            fileNumber = `DOSSIER-${dossierId.toString().padStart(6, '0')}`;
                        }
                        
                        return {
                            ...dossier,
                            id: dossier.id_dossier || dossier.id,
                            numeroDossier: fileNumber,
                            patient_name: patient ? `${patient.prenom || ''} ${patient.nom || ''}`.trim() : `Patient ID: ${patientId || 'undefined'}`,
                            service_name: service ? (service.nom || service.name || service.libelle) : `Service ID: ${serviceId || 'undefined'}`,
                            dateOuverture: dossier.dateCreation || dossier.createdAt,
                            patient_info: patient,
                            patient: patient,
                            service_info: service,
                            // Ajouter les IDs pour référence
                            patient_id: patientId,
                            service_id: serviceId
                        };
                    } catch (enrichError) {
                        console.error('Error enriching dossier:', enrichError);
                        return {
                            ...dossier,
                            id: dossier.id_dossier || dossier.id,
                            patient_name: `Patient ID: ${dossier.patient_id || dossier.patientId || dossier.id_patient || 'undefined'}`,
                            service_name: `Service ID: ${dossier.service_id || dossier.serviceId || dossier.id_service || 'undefined'}`,
                            dateOuverture: dossier.dateCreation || dossier.createdAt
                        };
                    }
                });
                
                console.log('✅ Dossiers enrichis avec succès:', enrichedDossiers);
                return { data: enrichedDossiers, status: 'success' };
                
            } catch (enrichmentError) {
                console.error('❌ Erreur lors de l\'enrichissement des dossiers:', enrichmentError);
                console.log('⚠️ Utilisation de l\'enrichissement de base sans API externe...');
                
                // Fallback: enrichment de base sans API externe
                const enrichedDossiers = dossiers.map((dossier) => {
                    try {
                        const patient = dossier.patient_info || dossier.patient || dossier.Patient;
                        const service = dossier.service_info || dossier.service || dossier.Service;
                        
                        let fileNumber = dossier.numeroDossier || dossier.numero_dossier;
                        if (!fileNumber || fileNumber === 'N/A' || fileNumber === 'undefined') {
                            const dossierId = dossier.id_dossier || dossier.id;
                            fileNumber = `DOSSIER-${dossierId.toString().padStart(6, '0')}`;
                        }
                        
                        return {
                            ...dossier,
                            id: dossier.id_dossier || dossier.id,
                            numeroDossier: fileNumber,
                            patient_name: patient ? `${patient.prenom || ''} ${patient.nom || ''}`.trim() : `Patient ID: ${dossier.patient_id || dossier.patientId || dossier.id_patient || 'undefined'}`,
                            service_name: service ? (service.nom || service.name || service.libelle) : `Service ID: ${dossier.service_id || dossier.serviceId || dossier.id_service || 'undefined'}`,
                            dateOuverture: dossier.dateCreation || dossier.createdAt,
                            patient_info: patient,
                            patient: patient,
                            service_info: service
                        };
                    } catch (enrichError) {
                        console.error('Error enriching dossier:', enrichError);
                        return {
                            ...dossier,
                            id: dossier.id_dossier || dossier.id,
                            patient_name: `Patient ID: ${dossier.patient_id || dossier.patientId || dossier.id_patient || 'undefined'}`,
                            service_name: `Service ID: ${dossier.service_id || dossier.serviceId || dossier.id_service || 'undefined'}`,
                            dateOuverture: dossier.dateCreation || dossier.createdAt
                        };
                    }
                });
                
                console.log('✅ Dossiers enrichis avec fallback:', enrichedDossiers);
                return { data: enrichedDossiers, status: 'success' };
            }
        }
        
        // Fallback: if data is directly an array
        if (Array.isArray(response.data)) {
            console.log('Response data is direct array:', response.data);
            return { data: response.data, status: 'success' };
        }
        
        // Fallback: if dossiers is in root data
        if (response.data.dossiers && Array.isArray(response.data.dossiers)) {
            console.log('Dossiers found in root data:', response.data.dossiers);
            return { data: response.data.dossiers, status: 'success' };
        }
        
        console.error('Unexpected dossiers response format:', response.data);
        return { data: [], status: 'error', message: 'Format de réponse inattendu' };
        
    } catch (error) {
        console.error('Erreur lors de la récupération des dossiers medicaux:', error);
        return { data: [], status: 'error', message: error.message };
    }
};

// 17-) Création de dossier patient (qui est en fait un dossier medical) (médecin)
const createDossierPatient = async (dossierData) => {
    try {
        console.log('Creating dossier patient (medical) with data:', dossierData);
        
        // Validate required fields
        if (!dossierData.patient_id) {
            throw new Error('ID du patient requis');
        }
        
        // The backend route for creating a medical dossier is POST /dossierMedical
        const response = await api.post('/dossierMedical', dossierData);
        console.log('Dossier patient (medical) créé:', response.data);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création du dossier patient (medical):', error);
        throw error.message || 'Erreur lors de la création du dossier patient (medical)';
    }
};

// 18-) Récupération des dossiers medicaux (tous les dossiers, ou filtrés par patient_id) (médecin)
const getDossiersPatients = async (patientId = null) => {
    try {
        console.log('Fetching dossiers medical from API...');
        let url = `/dossierMedical`;
        if (patientId) {
            url = `/dossierMedical?patient_id=${patientId}`;
        }
        const response = await api.get(url);
        console.log('Dossiers medical API response:', response);
        console.log('Dossiers medical API response.data:', response.data);
        
        if (!response || !response.data) {
            console.error('Invalid API response format:', response);
            return { data: [], status: 'error', message: 'Format de réponse invalide' };
        }
        
        // Backend returns: { status: 'success', results: N, data: { dossiers: [...] } }
        if (response.data.status === 'success' && response.data.data && Array.isArray(response.data.data.dossiers)) {
            const {dossiers} = response.data.data.dossiers;
            console.log('Found dossiers in getDossiersPatients:', dossiers);
            
            // Debug: Log the first dossier structure to see what fields are available
            if (dossiers.length > 0) {
                console.log('=== RAW DOSSIER STRUCTURE DEBUG (getDossiersPatients) ===');
                console.log('First dossier raw data:', dossiers[0]);
                console.log('All keys in first dossier:', Object.keys(dossiers[0]));
                console.log('Patient-related fields:', {
                    patient_id: dossiers[0].patient_id,
                    patientId: dossiers[0].patientId,
                    id_patient: dossiers[0].id_patient,
                    patient: dossiers[0].patient,
                    Patient: dossiers[0].Patient
                });
                console.log('Service-related fields:', {
                    service_id: dossiers[0].service_id,
                    serviceId: dossiers[0].serviceId,
                    id_service: dossiers[0].id_service,
                    service: dossiers[0].service,
                    Service: dossiers[0].Service
                });
                console.log('=====================================');
            }
            
            // Enrich dossiers with patient and service information
            const enrichedDossiers = await Promise.all(
                dossiers.map(async (dossier) => {
                    try {
                        // Check if dossier already has patient and service info embedded
                        let patient = dossier.patient_info || dossier.patient || dossier.Patient;
                        let service = dossier.service_info || dossier.service || dossier.Service;
                        
                        // If not embedded, fetch and find by ID
                        if (!patient || !service) {
                            // Note: getPatients and getServices moved to patientApi.js
                            // We'll need to import them here or handle differently
                            console.warn('Patient/Service enrichment requires getPatients/getServices from patientApi');
                        }
                        
                        // Create proper file number - Prioriser le numeroDossier, sinon générer un numéro basé sur l'ID
                        let fileNumber = dossier.numeroDossier || dossier.numero_dossier;
                        
                        // Si le numeroDossier n'est pas présent, générer un numéro basé sur l'ID
                        if (!fileNumber || fileNumber === 'N/A' || fileNumber === 'undefined') {
                            const dossierId = dossier.id_dossier || dossier.id;
                            fileNumber = `DOSSIER-${dossierId.toString().padStart(6, '0')}`;
                        }
                        console.log('Enrichissement dossier - Numéro dossier:', {
                            original: dossier.numeroDossier,
                            fallback: dossier.numero_dossier,
                            id_dossier: dossier.id_dossier,
                            id: dossier.id,
                            final: fileNumber,
                            rawDossier: dossier
                        });
                        
                        return {
                            ...dossier,
                            id: dossier.id_dossier || dossier.id,
                            numeroDossier: fileNumber,
                            patient_name: patient ? `${patient.prenom || ''} ${patient.nom || ''}`.trim() : `Patient ID: ${dossier.patient_id || dossier.patientId || dossier.id_patient || 'undefined'}`,
                            service_name: service ? (service.nom || service.name || service.libelle) : `Service ID: ${dossier.service_id || dossier.serviceId || dossier.id_service || 'undefined'}`,
                            dateOuverture: dossier.dateCreation || dossier.createdAt,
                            patient_info: patient,
                            patient: patient, // Add direct patient reference
                            service_info: service
                        };
                    } catch (enrichError) {
                        console.error('Error enriching dossier:', enrichError);
                        return {
                            ...dossier,
                            id: dossier.id_dossier || dossier.id,
                            patient_name: `Patient ID: ${dossier.patient_id || dossier.patientId || dossier.id_patient || 'undefined'}`,
                            service_name: `Service ID: ${dossier.service_id || dossier.serviceId || dossier.id_service || 'undefined'}`,
                            dateOuverture: dossier.dateCreation || dossier.createdAt
                        };
                    }
                })
            );
            
            console.log('Enriched dossiers from getDossiersPatients:', enrichedDossiers);
            return { data: enrichedDossiers, status: 'success' };
        }
        
        console.error('Unexpected dossiers medical response format:', response.data);
        return { data: [], status: 'error', message: 'Format de réponse inattendu' };
        
    } catch (error) {
        console.error('Service dossiers medical non disponible:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url
        });
        return { data: [], status: 'error', message: 'Service non disponible' };
    }
};

// 19-) Récupération d'un dossier patient spécifique (complet par patient_id) (médecin)
const getDossierPatient = async (patientId) => {
    try {
        const response = await api.get(`/dossierMedical/patient/${patientId}/complet`);
        console.log('Dossier patient complet récupéré:', response.data);
        return response.data;
    } catch (error) {
        console.log('Service dossier patient complet non disponible');
        return { data: null, status: 'error', message: 'Service non disponible' };
    }
};

// 20-) Mise à jour d'un dossier patient (médecin)
const updateDossierPatient = async (dossierId, dossierData) => {
    try {
        const response = await api.put(`/dossierMedical/${dossierId}`, dossierData);
        console.log('Dossier patient mis à jour:', response.data);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la mise à jour du dossier patient:', error);
        throw error.response?.data?.message || 'Erreur lors de la mise à jour du dossier patient';
    }
};

// 21-) Fermeture d'un dossier patient (médecin)
const closeDossierPatient = async (dossierId, dateFermeture) => {
    try {
        const response = await api.patch(`/dossierMedical/${dossierId}/close`, {
            dateFermeture: dateFermeture || new Date().toISOString().split('T')[0]
        });
        console.log('Dossier patient fermé:', response.data);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la fermeture du dossier patient:', error);
        throw error.response?.data?.message || 'Erreur lors de la fermeture du dossier patient';
    }
};

// ============================================================================
// 📋 GESTION DES CONSULTATIONS (MÉDECIN)
// ============================================================================

// 22-) Création d'une consultation (médecin)
const createConsultation = async (consultation) => {
    try {
        console.log('Creating consultation with data:', consultation);
        
        // Validate required fields
        if (!consultation.patient_id) {
            throw new Error('ID du patient requis');
        }
        
        const response = await api.post('/consultation', consultation);
        console.log('Consultation créée:', response.data);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création de la consultation:', error);
        throw error.response?.data?.message || error.message || 'Erreur lors de la création de la consultation';
    }
};

// 23-) Récupération d'une consultation spécifique (médecin)
const getConsultation = async (consultationId) => {
    try {
        const response = await api.get(`/consultation/${consultationId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération de la consultation:', error);
        throw error;
    }
};

// 24-) Récupération de toutes les consultations (médecin)
const getAllConsultations = async () => {
    try {
        const response = await api.get('/consultation');
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des consultations:', error);
        return [];
    }
};

// 25-) Récupération des consultations d'un patient (médecin)
const getConsultationsByPatient = async (patientId) => {
    try {
        const response = await api.get(`/consultation/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des consultations du patient:', error);
        return [];
    }
};

// 26-) Suppression d'une consultation (médecin)
const deleteConsultation = async (consultationId) => {
    try {
        const response = await api.delete(`/consultation/${consultationId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression de la consultation:', error);
        throw error;
    }
};

// 27-) Mise à jour d'une consultation (médecin)
const updateConsultation = async (consultationId, consultationData) => {
    try {
        const response = await api.put(`/consultation/${consultationId}`, consultationData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la consultation:', error);
        throw error;
    }
};

// ============================================================================
// 📄 GESTION DES DOCUMENTS (MÉDECIN)
// ============================================================================

// 28-) Upload de document (médecin)
const uploadDocument = async (patientId, formData) => {
    try {
        // Debug: Vérifier le FormData reçu
        console.log(' FormData reçu dans medicalApi.uploadDocument:');
        console.log('  patientId:', patientId);
        console.log('  formData instanceof FormData:', formData instanceof FormData);
        
        if (formData instanceof FormData) {
            console.log('  Contenu du FormData:');
            for (let [key, value] of formData.entries()) {
                if (key === 'file') {
                    console.log(`${key}:`, {
                        name: value.name,
                        type: value.type,
                        size: value.size,
                        isFile: value instanceof File
                    });
                } else {
                    console.log(`${key}:`, value);
                }
            }
        }
        
        const response = await api.post(`/documents/upload`, formData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de l\'upload du document:', error);
        throw error;
    }
};

// 29-) Download de document (médecin)
const downloadDocument = async (documentId) => {
    try {
        const response = await api.get(`/documents/${documentId}/download`, {
            responseType: 'blob',
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors du download du document:', error);
        throw error;
    }
};

// 30-) View de document avec gestion d'erreur améliorée (médecin)
const viewDocument = async (filters = {}) => {
    try {
        // Construire les paramètres de requête
        const params = new URLSearchParams();
        
        if (filters.type) params.append('type', filters.type);
        if (filters.date_debut) params.append('date_debut', filters.date_debut);
        if (filters.date_fin) params.append('date_fin', filters.date_fin);
        
        const queryString = params.toString();
        const url = `/documents/patient${queryString ? `?${queryString}` : ''}`;
        
        const response = await api.get(url);
        
        // Vérifier que la réponse est valide et extraire les données
        if (response.data && response.data.success) {
            console.log(`✅ ${response.data.count} documents récupérés avec succès`);
            return response.data.data;
        } else {
            throw new Error('Format de réponse invalide de l\'API');
        }
    } catch (error) {
        if (error.response) {
            // Erreur de réponse du serveur
            console.error('❌ Erreur serveur:', error.response.status, error.response.data);
            throw new Error(`Erreur serveur: ${error.response.data.message || 'Erreur inconnue'}`);
        } else if (error.request) {
            // Erreur de requête (pas de réponse)
            console.error('❌ Erreur de connexion:', error.request);
            throw new Error('Erreur de connexion au serveur');
        } else {
            // Erreur autre
            console.error('❌ Erreur lors de la visualisation des documents:', error.message);
            throw error;
        }
    }
};

// ============================================================================
// 📊 RÉSUMÉS ET STATISTIQUES (MÉDECIN)
// ============================================================================

// 31-) Récupération du résumé medical (médecin)
const getResumeMedical = async (patientId) => {
    try {
        const response = await api.get(`/resume-medical/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du résumé médical:', error);
        return null;
    }
};

// ============================================================================
// 📋 EXPORT DES FONCTIONS MÉDECIN
// ============================================================================

export {
    // Rendez-vous et traitements
    getPatientRendezVous,
    getProchainRendezVous,
    getTraitementsActifs,
    
    // Prescriptions
    createOrdonnance,
    createExamen,
    getAllPrescriptions,
    getOrdonnancesRecentes,
    createOrdonnanceComplete,
    ajouterPrescriptionAuDossier,
    creerNotification,
    marquerNotificationLue,
    getNotificationsPatient,
    getResumeAujourdhui,
    
    // Dossiers médicaux
    createDossierMedical,
    getDossierMedical,
    getAllDossiersMedical,
    createDossierPatient,
    getDossiersPatients,
    getDossierPatient,
    updateDossierPatient,
    closeDossierPatient,
    
    // Consultations
    createConsultation,
    getConsultation,
    getAllConsultations,
    getConsultationsByPatient,
    deleteConsultation,
    updateConsultation,
    
    // Documents
    uploadDocument,
    downloadDocument,
    viewDocument,
    
    // Résumés
    getResumeMedical
}; 