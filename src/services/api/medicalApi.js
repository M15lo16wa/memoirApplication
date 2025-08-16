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
api.interceptors.request.use(
    (config) => {
        const jwtToken = localStorage.getItem('jwt');
        const generalToken = localStorage.getItem('token');
        const hasMedecin = !!localStorage.getItem('medecin');

        // Prioriser le token médecin quand il est présent (afin d'accéder aux routes back côté pro)
        if (generalToken && hasMedecin) {
            config.headers.Authorization = `Bearer ${generalToken}`;
        }
        // Sinon, fallback sur le JWT patient
        else if (jwtToken) {
            config.headers.Authorization = `Bearer ${jwtToken}`;
        }
        // Dernier recours
        else if (generalToken) {
            config.headers.Authorization = `Bearer ${generalToken}`;
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

// 1-) recuperation des rendez-vous d'un patient
const getPatientRendezVous = async (patientId) => {
    try {
        const response = await api.get(`/rendez-vous/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        return [];
    }
};

// 2-) recuperation du prochain rendez-vous d'un patient
const getProchainRendezVous = async (patientId) => {
    try {
        const response = await api.get(`/rendez-vous/patient/${patientId}/prochain`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du prochain rendez-vous:', error);
        return null;
    }
};

// 3-) recuperation des traitements actifs d'un patient
const getTraitementsActifs = async (patientId) => {
    try {
        const response = await api.get(`/prescription/patient/${patientId}/actifs`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des traitements actifs:', error);
        return [];
    }
};

// 4-) creation d'une ordonnance
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

// 5-) creation d'un examen
const createExamen = async (examen) => {
    try {
        const response = await api.post(`/prescription/demande-examen`, examen);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création de l\'examen:', error);
        throw error;
    }
};

// 6-) Récupération de toutes les prescriptions
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
// -6-) Récupération des ordonnances récentes
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

// 7-) Création d'une ordonnance complète avec notification
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

// 8-) Ajouter une prescription au dossier patient
const ajouterPrescriptionAuDossier = async (prescriptionId, dossierId) => {
    try {
        const response = await api.post(`/prescription/${prescriptionId}/ajouter-dossier`, { dossier_id: dossierId });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la prescription au dossier:', error);
        throw error;
    }
};

// 9-) Créer une notification
const creerNotification = async (prescriptionId, notificationData) => {
    try {
        const response = await api.post(`/prescription/${prescriptionId}/notification`, notificationData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création de la notification:', error);
        throw error;
    }
};

// 10-) Marquer une notification comme lue
const marquerNotificationLue = async (notificationId) => {
    try {
        const response = await api.patch(`/prescription/notification/${notificationId}/lue`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors du marquage de la notification:', error);
        throw error;
    }
};

// 11-) Récupérer les notifications d'un patient
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

// 12-) Récupérer le résumé des ordonnances d'aujourd'hui
const getResumeAujourdhui = async () => {
    try {
        const response = await api.get(`/prescription/resume-aujourdhui`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du résumé:', error);
        throw error;
    }
};

// 3.3.1-) creation de dossier medical
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

// 3.3.1.1-) recuperation d'un dossier medical specifique
const getDossierMedical = async (Id) => {
    try {
        const response = await api.get(`/dossierMedical/${Id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du dossier medical:', error);
        throw error;
    }
};

// 3.3.1.1-) recuperation de tous les dossiers medicaux avec informations complètes
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
            
            // Simple enrichment without external API calls to avoid failures
            const enrichedDossiers = dossiers.map((dossier) => {
                try {
                    // Check if dossier already has patient and service info embedded
                    const patient = dossier.patient_info || dossier.patient || dossier.Patient;
                    const service = dossier.service_info || dossier.service || dossier.Service;
                    
                                         // Create proper file number - Prioriser le numeroDossier, sinon générer un numéro basé sur l'ID
                    let fileNumber = dossier.numeroDossier || dossier.numero_dossier;
                    
                     // Si le numeroDossier n'est pas présent, générer un numéro basé sur l'ID
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
            });
            
            console.log('Enriched dossiers:', enrichedDossiers);
            return { data: enrichedDossiers, status: 'success' };
        }
        
        // Fallback: if data is directly an array
        if (Array.isArray(response.data)) {
            console.log('Response data is direct array:', response.data);
            return { data: response.data, status: 'success' };
        }
        
        // Fallback: if dossiers is in root data
        if (response.data.dossiers && Array.isArray(response.data.dossiers)) {
            console.log('Found dossiers in response.data.dossiers:', response.data.dossiers);
            return { data: response.data.dossiers, status: 'success' };
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

// 3.3.2-) creation de dossier patient (qui est en fait un dossier medical)
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

// 3.3.3-) recuperation des dossiers medicaux (tous les dossiers, ou filtrés par patient_id)
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
                            const [patientsData, servicesData] = await Promise.all([
                                getPatients(),
                                getServices()
                            ]);
                            
                            // Find matching patient with more flexible ID matching
                            if (!patient && Array.isArray(patientsData)) {
                                patient = patientsData.find(p => {
                                    const patientId = p.id_patient || p.id || p.patient_id;
                                    const dossierId = dossier.patient_id || dossier.patientId || dossier.id_patient;
                                    return patientId === dossierId;
                                });
                            }
                            
                            // Find matching service with more flexible ID matching
                            if (!service && Array.isArray(servicesData)) {
                                service = servicesData.find(s => {
                                    const serviceId = s.id || s.id_service || s.service_id;
                                    const dossierServiceId = dossier.service_id || dossier.serviceId || dossier.id_service;
                                    return serviceId === dossierServiceId;
                                });
                            }
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

// 3.3.4-) recuperation d'un dossier patient specifique (complet par patient_id)
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

// 3.3.5-) mise à jour d'un dossier patient
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

// 3.3.6-) fermeture d'un dossier patient
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

// 3-3) recuperation des services
const getServices = async () => {
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

// 3-4) recuperation des patients
const getPatients = async () => {
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

// 4-) recuperation des documents recents
const getDocumentsRecents = async (Id) => {
    try {
        const response = await api.get(`/dossierMedical/${Id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des documents récents:', error);
        return [];
    }
};

// 5-) recuperation des documents d'un patient
const getPatientDocuments = async (patientId) => {
    try {
        const response = await api.get(`/dossierMedical/patient/${patientId}/complet`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des documents du patient:', error);
        return [];
    }
};

// 6-) recuperation des parametres biologiques
const getParametresBiologiques = async (patientId) => {
    try {
        const response = await api.get(`/parametres-biologiques/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des paramètres biologiques:', error);
        return [];
    }
};

// 7-) recuperation des antecedents medicaux
const getAntecedentsMedicaux = async (patientId) => {
    try {
        const response = await api.get(`/antecedents-medicaux/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des antécédents médicaux:', error);
        return [];
    }
};

// 8-) recuperation des allergies
const getAllergies = async (patientId) => {
    try {
        const response = await api.get(`/allergies/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des allergies:', error);
        return [];
    }
};

// 9-) recuperation de l'historique des consultations
const getHistoriqueConsultations = async (patientId) => {
    try {
        const response = await api.get(`/consultation/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des consultations:', error);
        return [];
    }
};

// services/api/medicalApi.js

// 10-) Upload de document 
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


// 11-) download de document
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

// 12-) view de document avec gestion d'erreur améliorée
export const viewDocument = async (filters = {}) => {
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

// 13-) recuperation du resume medical
const getResumeMedical = async (patientId) => {
    try {
        const response = await api.get(`/resume-medical/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du résumé médical:', error);
        return null;
    }
};

// 14-) creation d'une consultation
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

// 15-) recuperation d'une consultation specifique
const getConsultation = async (consultationId) => {
    try {
        const response = await api.get(`/consultation/${consultationId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération de la consultation:', error);
        throw error;
    }
};

// 16-) recuperation de toutes les consultations
const getAllConsultations = async () => {
    try {
        const response = await api.get('/consultation');
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des consultations:', error);
        return [];
    }
};

// 17-) recuperation des consultations d'un patient
const getConsultationsByPatient = async (patientId) => {
    try {
        const response = await api.get(`/consultation/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des consultations du patient:', error);
        return [];
    }
};

// 18-) suppression d'une consultation
const deleteConsultation = async (consultationId) => {
    try {
        const response = await api.delete(`/consultation/${consultationId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression de la consultation:', error);
        throw error;
    }
};

// 19-) mise à jour d'une consultation
const updateConsultation = async (consultationId, consultationData) => {
    try {
        const response = await api.put(`/consultation/${consultationId}`, consultationData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la consultation:', error);
        throw error;
    }
};

export {
    getPatientRendezVous,
    getProchainRendezVous,
    getTraitementsActifs,
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
    createDossierMedical,
    getDossierMedical,
    getAllDossiersMedical,
    createDossierPatient,
    getDossiersPatients,
    getDossierPatient,
    updateDossierPatient,
    closeDossierPatient,
    getServices,
    getPatients,
    getDocumentsRecents,
    getPatientDocuments,
    getParametresBiologiques,
    getAntecedentsMedicaux,
    getAllergies,
    getHistoriqueConsultations,
    uploadDocument,
    downloadDocument,
    // viewDocument,
    getResumeMedical,
    createConsultation,
    getConsultation,
    getAllConsultations,
    getConsultationsByPatient,
    deleteConsultation,
    updateConsultation
}; 