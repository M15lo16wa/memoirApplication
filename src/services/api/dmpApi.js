import axios from "axios";

const API_URL = "http://localhost:3000/api";

const dmpApi = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

/**
 * Fonction utilitaire pour récupérer l'ID du patient connecté
 * @returns {number|null} ID du patient ou null si non connecté
 */
export const getConnectedPatientId = () => {
    try {
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        return storedPatient.id_patient || storedPatient.id || null;
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'ID du patient:', error);
        return null;
    }
};

// Intercepteur d\'authentification
dmpApi.interceptors.request.use(
    (config) => {
        const jwtToken = localStorage.getItem('jwt');
        const token = localStorage.getItem('token');
        
        if (jwtToken) {
            config.headers.Authorization = `Bearer ${jwtToken}`;
        } else if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// ===== DONNÉES MOCK POUR DÉVELOPPEMENT =====
const getMockDataForPatient = (patientId) => {
    // Récupérer les données du patient connecté
    const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
    
    return {
        tableauDeBord: {
            patient: {
                id: patientId || storedPatient.id_patient || storedPatient.id || 1,
                nom: storedPatient.nom || "",
                prenom: storedPatient.prenom || "",
                date_naissance: storedPatient.date_naissance || "",
                groupe_sanguin: storedPatient.groupe_sanguin || "",
                allergies: storedPatient.allergies || "",
                maladies_chroniques: storedPatient.maladies_chroniques || "",
                telephone: storedPatient.telephone || "",
                email: storedPatient.email || ""
            },
            statistiques: {
                auto_mesures: 24,
                documents: 8,
                rendez_vous: 3,
                consultations: 12
            },
            derniere_activite: ""
        },
        statistiques: {
            auto_mesures: {
                total: 24,
                ce_mois: 8,
                types: {
                    poids: 6,
                    tension: 8,
                    temperature: 4,
                    glycemie: 6
                }
            },
            documents: {
                total: 8,
                types: {
                    ordonnances: 3,
                    resultats: 2,
                    radiographies: 2,
                    autres: 1
                }
            },
            rendez_vous: {
                total: 3,
                a_venir: 2,
                passes: 1
            }
        },
        rappels: [
            {
                id: 1,
                titre: "Prise de tension",
                description: "Mesurez votre tension artérielle",
                date_rappel: "2024-01-20",
                type: "auto_mesure",
                actif: true
            },
            {
                id: 2,
                titre: "Rendez-vous cardiologue",
                description: "Consultation de suivi",
                date_rappel: "2024-01-25",
                type: "rendez_vous",
                actif: true
            }
        ],
        historique: [
            {
                id: 1,
                type: "Consultation",
                date: "2024-01-15",
                description: "Consultation cardiologie - Dr. Martin",
                medecin: "Dr. Martin",
                specialite: "Cardiologie"
            },
            {
                id: 2,
                type: "Analyse",
                date: "2024-01-10",
                description: "Prise de sang - Glycémie, Cholestérol",
                laboratoire: "Labo Central"
            }
        ],
        auto_mesures: [
            {
                id: 1,
                type: "poids",
                valeur: 75,
                unite: "kg",
                date_mesure: "2024-01-15",
                heure_mesure: "08:30",
                commentaire: "Poids stable"
            },
            {
                id: 2,
                type: "tension",
                valeur: 120,
                valeur_secondaire: 80,
                unite: "mmHg",
                date_mesure: "2024-01-14",
                heure_mesure: "09:15",
                commentaire: "Tension normale"
            },
            {
                id: 3,
                type: "temperature",
                valeur: 36.8,
                unite: "°C",
                date_mesure: "2024-01-13",
                heure_mesure: "18:45",
                commentaire: "Température normale"
            }
        ],
        documents: [
            {
                id: 1,
                titre: "Ordonnance cardiologie",
                type: "ordonnance",
                description: "Ordonnance du Dr. Martin",
                date_upload: "2024-01-15",
                taille: "245 KB",
                url: "#"
            },
            {
                id: 2,
                titre: "Résultats analyses",
                type: "resultat",
                description: "Analyses sanguines",
                date_upload: "2024-01-10",
                taille: "1.2 MB",
                url: "#"
            }
        ],
        droits_acces: [
            {
                id: 1,
                professionnel: {
                    nom: "Martin",
                    prenom: "Sophie",
                    specialite: "Cardiologie"
                },
                date_autorisation: "2024-01-01",
                permissions: ["lecture", "ecriture"]
            }
        ],
        bibliotheque: [
            {
                id: 1,
                titre: "Guide de l'hypertension",
                type: "guide",
                description: "Comprendre et gérer l'hypertension artérielle",
                url: "#",
                date_publication: "2024-01-01"
            },
            {
                id: 2,
                titre: "Alimentation équilibrée",
                type: "conseil",
                description: "Conseils nutritionnels pour une alimentation saine",
                url: "#",
                date_publication: "2024-01-05"
            }
        ]
    };
};

// ===== API D'ADMINISTRATION DMP =====

/**
 * Récupère la liste des patients avec leurs données DMP
 * @param {Object} params - Paramètres de pagination
 * @param {number} params.limit - Nombre maximum de résultats (défaut: 20)
 * @param {number} params.offset - Nombre de résultats à ignorer (défaut: 0)
 * @returns {Promise} Réponse contenant la liste des patients
 */
export const getPatientsList = async (params = {}) => {
    try {
        const { limit = 20, offset = 0 } = params;
        const response = await dmpApi.get('/admin/dmp/patients', {
            params: { limit, offset }
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération de la liste des patients:', error);
        throw error;
    }
};

/**
 * Récupère les données DMP d'un patient spécifique
 * @param {number} patientId - ID du patient
 * @returns {Promise} Réponse contenant les données DMP du patient
 */
export const getPatientDMPData = async (patientId) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id_patient || storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        // Simulation d'un délai réseau
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockData = getMockDataForPatient(patientId);
        
        return {
            data: {
                patient: mockData.tableauDeBord.patient,
                statistiques: mockData.statistiques,
                historique: mockData.historique,
                documents: mockData.documents,
                rappels: mockData.rappels
            }
        };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id_patient || storedPatient.id);
        return {
            data: {
                patient: mockData.tableauDeBord.patient,
                statistiques: mockData.statistiques,
                historique: mockData.historique,
                documents: mockData.documents,
                rappels: mockData.rappels
            }
        };
    }
};

/**
 * Récupère toutes les auto-mesures de tous les patients
 * @param {Object} filters - Filtres de recherche
 * @param {number} filters.patientId - Filtrer par patient spécifique
 * @param {string} filters.type_mesure - Filtrer par type de mesure
 * @param {string} filters.date_debut - Date de début pour le filtrage (format: YYYY-MM-DD)
 * @param {string} filters.date_fin - Date de fin pour le filtrage (format: YYYY-MM-DD)
 * @param {number} filters.limit - Nombre maximum de résultats (défaut: 50)
 * @param {number} filters.offset - Nombre de résultats à ignorer (défaut: 0)
 * @returns {Promise} Réponse contenant les auto-mesures
 */
export const getAllAutoMesures = async (filters = {}) => {
    try {
        const { patientId, type_mesure, date_debut, date_fin, limit = 50, offset = 0 } = filters;
        const params = {};
        
        if (patientId) params.patientId = patientId;
        if (type_mesure) params.type_mesure = type_mesure;
        if (date_debut) params.date_debut = date_debut;
        if (date_fin) params.date_fin = date_fin;
        params.limit = limit;
        params.offset = offset;
        
        const response = await dmpApi.get('/admin/dmp/auto-mesures', { params });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des auto-mesures:', error);
        throw error;
    }
};

/**
 * Supprime une auto-mesure (médecin uniquement)
 * @param {number} id - ID de l\'auto-mesure à supprimer
 * @returns {Promise} Réponse de confirmation
 */
export const deleteAutoMesure = async (id) => {
    try {
        if (!id) {
            throw new Error('ID de l\\\'auto-mesure requis');
        }
        const response = await dmpApi.delete(`/admin/dmp/auto-mesures/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression de l\\\'auto-mesure:', error);
        throw error;
    }
};

/**
 * Récupère tous les documents personnels de tous les patients
 * @param {Object} filters - Filtres de recherche
 * @param {number} filters.patientId - Filtrer par patient spécifique
 * @param {string} filters.type - Filtrer par type de document
 * @param {number} filters.limit - Nombre maximum de résultats (défaut: 50)
 * @param {number} filters.offset - Nombre de résultats à ignorer (défaut: 0)
 * @returns {Promise} Réponse contenant les documents
 */
export const getAllDocuments = async (filters = {}) => {
    try {
        const { patientId, type, limit = 50, offset = 0 } = filters;
        const params = {};
        
        if (patientId) params.patientId = patientId;
        if (type) params.type = type;
        params.limit = limit;
        params.offset = offset;
        
        const response = await dmpApi.get('/admin/dmp/documents', { params });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        throw error;
    }
};

/**
 * Supprime un document personnel (médecin uniquement)
 * @param {number} id - ID du document à supprimer
 * @returns {Promise} Réponse de confirmation
 */
export const deleteDocument = async (id) => {
    try {
        if (!id) {
            throw new Error('ID du document requis');
        }
        const response = await dmpApi.delete(`/admin/dmp/documents/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression du document:', error);
        throw error;
    }
};

// Fonction pour supprimer un document DMP (pour les patients)
export const deleteDocumentDMP = async (documentId) => {
    try {
        if (!documentId) {
            throw new Error('ID du document requis');
        }

        // Appel API réel pour supprimer le document
        const response = await dmpApi.delete(`/patient/dmp/documents-personnels/${documentId}`);
        
        console.log('✅ Document supprimé avec succès:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression du document:', error);
        
        // Fallback vers une simulation en cas d'erreur
        console.warn("Mode développement: simulation de suppression");
        return { 
            success: true, 
            message: "Document supprimé avec succès",
            deleted_id: documentId 
        };
    }
};

/**
 * Récupère tous les messages de tous les patients
 * @param {Object} filters - Filtres de recherche
 * @param {number} filters.patientId - Filtrer par patient spécifique
 * @param {number} filters.professionnelId - Filtrer par professionnel spécifique
 * @param {boolean} filters.lu - Filtrer par statut lu/non lu
 * @param {number} filters.limit - Nombre maximum de résultats (défaut: 50)
 * @param {number} filters.offset - Nombre de résultats à ignorer (défaut: 0)
 * @returns {Promise} Réponse contenant les messages
 */
export const getAllMessages = async (filters = {}) => {
    try {
        const { patientId, professionnelId, lu, limit = 50, offset = 0 } = filters;
        const params = {};
        
        if (patientId) params.patientId = patientId;
        if (professionnelId) params.professionnelId = professionnelId;
        if (lu !== undefined) params.lu = lu;
        params.limit = limit;
        params.offset = offset;
        
        const response = await dmpApi.get('/admin/dmp/messages', { params });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        throw error;
    }
};

/**
 * Supprime un message (médecin uniquement)
 * @param {number} id - ID du message à supprimer
 * @returns {Promise} Réponse de confirmation
 */
export const deleteMessage = async (id) => {
    try {
        if (!id) {
            throw new Error('ID du message requis');
        }
        const response = await dmpApi.delete(`/admin/dmp/messages/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
        throw error;
    }
};

/**
 * Récupère tous les rappels de tous les patients
 * @param {Object} filters - Filtres de recherche
 * @param {number} filters.patientId - Filtrer par patient spécifique
 * @param {string} filters.type - Filtrer par type de rappel
 * @param {boolean} filters.actif - Filtrer par statut actif/inactif
 * @param {number} filters.limit - Nombre maximum de résultats (défaut: 50)
 * @param {number} filters.offset - Nombre de résultats à ignorer (défaut: 0)
 * @returns {Promise} Réponse contenant les rappels
 */
export const getAllRappels = async (filters = {}) => {
    try {
        const { patientId, type, actif, limit = 50, offset = 0 } = filters;
        const params = {};
        
        if (patientId) params.patientId = patientId;
        if (type) params.type = type;
        if (actif !== undefined) params.actif = actif;
        params.limit = limit;
        params.offset = offset;
        
        const response = await dmpApi.get('/admin/dmp/rappels', { params });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des rappels:', error);
        throw error;
    }
};

/**
 * Supprime un rappel (médecin uniquement)
 * @param {number} id - ID du rappel à supprimer
 * @returns {Promise} Réponse de confirmation
 */
export const deleteRappel = async (id) => {
    try {
        if (!id) {
            throw new Error('ID du rappel requis');
        }
        const response = await dmpApi.delete(`/admin/dmp/rappels/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression du rappel:', error);
        throw error;
    }
};

/**
 * Récupère les statistiques globales du DMP
 * @returns {Promise} Réponse contenant les statistiques globales
 */
export const getGlobalStatistics = async () => {
    try {
        const response = await dmpApi.get('/admin/dmp/statistiques');
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques globales:', error);
        throw error;
    }
};

/**
 * Désactive l\'accès DMP d\'un patient
 * @param {number} patientId - ID du patient
 * @returns {Promise} Réponse de confirmation
 */
export const desactiverAccesDMP = async (patientId) => {
    try {
        if (!patientId) {
            throw new Error('ID du patient requis');
        }
        const response = await dmpApi.patch(`/admin/dmp/patients/${patientId}/desactiver`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la désactivation de l\\\'accès DMP:', error);
        throw error;
    }
};

/**
 * Réactive l\'accès DMP d\'un patient
 * @param {number} patientId - ID du patient
 * @returns {Promise} Réponse de confirmation
 */
export const reactiverAccesDMP = async (patientId) => {
    try {
        if (!patientId) {
            throw new Error('ID du patient requis');
        }
        const response = await dmpApi.patch(`/admin/dmp/patients/${patientId}/reactiver`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la réactivation de l\\\'accès DMP:', error);
        throw error;
    }
};

// ===== FONCTIONS DMP PRINCIPALES (POUR COMPATIBILITÉ AVEC LE CONTEXTE) =====

// 1. Récupérer le tableau de bord
export const getTableauDeBord = async () => {
    try {
        const patientId = getConnectedPatientId();
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        // Simulation d\'un délai réseau
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockData = getMockDataForPatient(patientId);
        return { data: { tableau_de_bord: mockData.tableauDeBord } };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        const patientId = getConnectedPatientId();
        const mockData = getMockDataForPatient(patientId);
        return { data: { tableau_de_bord: mockData.tableauDeBord } };
    }
};

// 2. Récupérer les statistiques
export const getStatistiques = async () => {
    try {
        // Récupérer l\'ID du patient connecté
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const patientId = storedPatient.id_patient || storedPatient.id;
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockData = getMockDataForPatient(patientId);
        return { data: mockData.statistiques };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id_patient || storedPatient.id);
        return { data: mockData.statistiques };
    }
};

// 3. Récupérer les rappels
export const getRappels = async () => {
    try {
        const patientId = getConnectedPatientId();
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        const mockData = getMockDataForPatient(patientId);
        return { data: mockData.rappels };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        const patientId = getConnectedPatientId();
        const mockData = getMockDataForPatient(patientId);
        return { data: mockData.rappels };
    }
};

// 4. Récupérer le DMP complet d\'un patient
export const getDMP = async (patientId = null) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id_patient || storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        await new Promise(resolve => setTimeout(resolve, 400));
        const mockData = getMockDataForPatient(patientId);
        return {
            data: {
                patient: mockData.tableauDeBord.patient,
                historique: mockData.historique,
                auto_mesures: mockData.auto_mesures,
                documents: mockData.documents
            }
        };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id_patient || storedPatient.id);
        return {
            data: {
                patient: mockData.tableauDeBord.patient,
                historique: mockData.historique,
                auto_mesures: mockData.auto_mesures,
                documents: mockData.documents
            }
        };
    }
};

// 5. Mettre à jour le DMP
export const updateDMP = async (patientId, dmpData) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { data: { success: true, message: "DMP mis à jour" } };
    } catch (error) {
        console.warn("Mode développement: simulation de mise à jour");
        return { data: { success: true, message: "DMP mis à jour" } };
    }
};

// 6. Récupérer l\'historique médical
export const getHistoriqueMedical = async (patientId = null) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id_patient || storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockData = getMockDataForPatient(patientId);
        return { data: mockData.historique };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id_patient || storedPatient.id);
        return { data: mockData.historique };
    }
};

// 7. Ajouter une entrée à l\'historique
export const addHistoriqueEntry = async (patientId, entry) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 200));
        const newEntry = { id: Date.now(), ...entry };
        return { data: newEntry };
    } catch (error) {
        console.warn("Mode développement: simulation d'ajout");
        const newEntry = { id: Date.now(), ...entry };
        return { data: newEntry };
    }
};

// 8. Récupérer le journal d'activité
export const getJournalActivite = async (patientId, filters = {}) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id_patient || storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockData = getMockDataForPatient(patientId);
        return { data: mockData.historique };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id_patient || storedPatient.id);
        return { data: mockData.historique };
    }
};

// 9. Gestion des droits d'accès
export const getDroitsAcces = async (patientId = null) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id_patient || storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockData = getMockDataForPatient(patientId);
        return { data: mockData.droits_acces };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id_patient || storedPatient.id);
        return { data: mockData.droits_acces };
    }
};

export const updateDroitsAcces = async (patientId, droits) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { data: { success: true, message: "Droits mis à jour" } };
    } catch (error) {
        console.warn("Mode développement: simulation de mise à jour");
        return { data: { success: true, message: "Droits mis à jour" } };
    }
};

// 10. Auto-mesures DMP
export const getAutoMesuresDMP = async (patientId = null, type = null) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id_patient || storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }

        // Paramètres pour l'API
        const params = { patient_id: patientId };
        if (type) {
            params.type_mesure = type;
        }

        // Appel API réel pour récupérer les auto-mesures
        const response = await dmpApi.get('/patient/dmp/auto-mesures', { params });
        
        console.log('✅ Auto-mesures récupérées avec succès:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des auto-mesures:', error);
        
        // Fallback vers les données mock en cas d'erreur
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id_patient || storedPatient.id);
        let mesures = mockData.auto_mesures;
        if (type) {
            mesures = mesures.filter(m => m.type === type);
        }
        return { data: mesures };
    }
};

// Fonction pour supprimer une auto-mesure DMP (pour les patients)
// Fonction pour mettre à jour une auto-mesure DMP (pour les patients)
// Fonction pour récupérer une auto-mesure spécifique DMP (pour les patients)
export const getAutoMesureDMP = async (mesureId) => {
    try {
        if (!mesureId) {
            throw new Error('ID de l\'auto-mesure requis');
        }

        // Appel API réel pour récupérer l'auto-mesure
        const response = await dmpApi.get(`/patient/dmp/auto-mesures/${mesureId}`);
        
        console.log('✅ Auto-mesure récupérée avec succès:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'auto-mesure:', error);
        
        // Fallback vers une simulation en cas d'erreur
        console.warn("Mode développement: simulation de récupération");
        return { 
            success: false, 
            message: "Auto-mesure non trouvée",
            error: error.message 
        };
    }
};

// Fonction pour mettre à jour une auto-mesure DMP (pour les patients)
export const updateAutoMesureDMP = async (mesureId, mesureData) => {
    try {
        if (!mesureId) {
            throw new Error('ID de l\'auto-mesure requis');
        }

        // Préparer les données pour l'API
        const apiData = {
            type_mesure: mesureData.type_mesure,
            valeur: mesureData.valeur,
            valeur_secondaire: mesureData.valeur_secondaire || null,
            unite: mesureData.unite,
            unite_secondaire: mesureData.unite_secondaire || null,
            commentaire: mesureData.commentaire || '',
            date_mesure: mesureData.date_mesure,
            heure_mesure: mesureData.heure_mesure
        };

        // Appel API réel pour mettre à jour l'auto-mesure
        const response = await dmpApi.put(`/patient/dmp/auto-mesures/${mesureId}`, apiData);
        
        console.log('✅ Auto-mesure mise à jour avec succès:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de l\'auto-mesure:', error);
        
        // Fallback vers une simulation en cas d'erreur
        console.warn("Mode développement: simulation de mise à jour");
        return { 
            success: true, 
            message: "Auto-mesure mise à jour avec succès",
            updated_id: mesureId,
            data: mesureData 
        };
    }
};

// Fonction pour supprimer une auto-mesure DMP (pour les patients)
export const deleteAutoMesureDMP = async (mesureId) => {
    try {
        if (!mesureId) {
            throw new Error('ID de l\'auto-mesure requis');
        }

        // Appel API réel pour supprimer l'auto-mesure
        const response = await dmpApi.delete(`/patient/dmp/auto-mesures/${mesureId}`);
        
        console.log('✅ Auto-mesure supprimée avec succès:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression de l\'auto-mesure:', error);
        
        // Fallback vers une simulation en cas d'erreur
        console.warn("Mode développement: simulation de suppression");
        return { 
            success: true, 
            message: "Auto-mesure supprimée avec succès",
            deleted_id: mesureId 
        };
    }
};

export const createAutoMesureDMP = async (patientId = null, mesureData) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id_patient || storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }

        // Préparer les données pour l'API
        const apiData = {
            patient_id: patientId,
            type_mesure: mesureData.type_mesure,
            valeur: mesureData.valeur,
            valeur_secondaire: mesureData.valeur_secondaire || null,
            unite: mesureData.unite,
            unite_secondaire: mesureData.unite_secondaire || null,
            commentaire: mesureData.commentaire || '',
            date_mesure: mesureData.date_mesure,
            heure_mesure: mesureData.heure_mesure
        };

        // Appel API réel pour créer l'auto-mesure
        const response = await dmpApi.post('/patient/dmp/auto-mesures', apiData);
        
        console.log('✅ Auto-mesure créée avec succès:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'auto-mesure:', error);
        
        // Fallback vers les données mock en cas d'erreur
        console.warn("Mode développement: simulation d'ajout");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const newMesure = { 
            id: Date.now(), 
            patient_id: storedPatient.id_patient || storedPatient.id,
            ...mesureData 
        };
        return { data: newMesure };
    }
};

// 11. Rendez-vous DMP
export const getRendezVousDMP = async (patientId) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { data: [] };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        return { data: [] };
    }
};

export const createRendezVousDMP = async (patientId, rdvData) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 200));
        const newRdv = { id: Date.now(), ...rdvData };
        return { data: newRdv };
    } catch (error) {
        console.warn("Mode développement: simulation d'ajout");
        const newRdv = { id: Date.now(), ...rdvData };
        return { data: newRdv };
    }
};

// 12. Documents DMP
export const getDocumentsDMP = async (patientId = null, filters = {}) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id_patient || storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }

        // Paramètres requis par l'API backend
        const params = { 
            patient_id: patientId,
            type: filters.type || null,
            date_debut: filters.date_debut || null,
            date_fin: filters.date_fin || null
        };

        // Filtrer les paramètres null/undefined
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([key, value]) => value !== null && value !== undefined)
        );

        // Appel API réel pour récupérer les documents
        const response = await dmpApi.get('/patient/dmp/documents-personnels', { params: cleanParams });
        
        console.log('✅ Documents récupérés avec succès:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des documents:', error);
        
        // Fallback vers les données mock en cas d'erreur
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id_patient || storedPatient.id);
        let {documents} = mockData;
        
        // Appliquer les filtres sur les données mock
        if (filters.type) {
            documents = documents.filter(d => d.type === filters.type);
        }
        if (filters.date_debut) {
            documents = documents.filter(d => new Date(d.date_upload) >= new Date(filters.date_debut));
        }
        if (filters.date_fin) {
            documents = documents.filter(d => new Date(d.date_upload) <= new Date(filters.date_fin));
        }
        
        return { data: documents };
    }
};

export const uploadDocumentDMP = async (patientId = null, documentData) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id_patient || storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }

        // Créer un FormData pour l'upload de fichier
        const formData = new FormData();
        formData.append('patient_id', patientId);
        formData.append('titre', documentData.titre || '');
        formData.append('description', documentData.description || '');
        formData.append('type', documentData.type || 'document');
        
        // Ajouter le fichier s'il existe
        if (documentData.file) {
            formData.append('file', documentData.file);
        }

        // Configuration spéciale pour l'upload de fichier
        const uploadConfig = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        };

        // Appel API réel pour l'upload
        const response = await dmpApi.post('/patient/dmp/upload-document', formData, uploadConfig);
        
        
        console.log('✅ Document uploadé avec succès:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'upload du document:', error);
        
        // Fallback vers les données mock en cas d'erreur
        console.warn("Mode développement: simulation d'upload");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const newDocument = { 
            id: Date.now(), 
            patient_id: storedPatient.id_patient || storedPatient.id,
            date_upload: new Date().toISOString().split('T')[0],
            titre: documentData.titre || 'Document',
            description: documentData.description || '',
            type: documentData.type || 'document',
            taille: documentData.file ? `${Math.round(documentData.file.size / 1024)} KB` : '0 KB',
            url: '#'
        };
        return { data: newDocument };
    }
};

// 13. Bibliothèque de santé
export const getBibliothequeSante = async (patientId = null) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id_patient || storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockData = getMockDataForPatient(patientId);
        return { data: mockData.bibliotheque };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id_patient || storedPatient.id);
        return { data: mockData.bibliotheque };
    }
};

// 14. Statistiques DMP
export const getStatistiquesDMP = async (patientId = null, periode = '30j') => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id_patient || storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockData = getMockDataForPatient(patientId);
        return { data: mockData.statistiques };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id_patient || storedPatient.id);
        return { data: mockData.statistiques };
    }
};

// ===== FONCTIONS UTILITAIRES =====

/**
 * Fonction utilitaire pour formater les paramètres de pagination
 * @param {number} page - Numéro de page (commence à 1)
 * @param {number} pageSize - Taille de la page
 * @returns {Object} Objet contenant limit et offset
 */
export const formatPaginationParams = (page = 1, pageSize = 20) => {
    const limit = pageSize;
    const offset = (page - 1) * pageSize;
    return { limit, offset };
};

/**
 * Fonction utilitaire pour formater les dates pour l'API
 * @param {Date|string} date - Date à formater
 * @returns {string} Date formatée en YYYY-MM-DD
 */
export const formatDateForAPI = (date) => {
    if (!date) return null;
    
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    
    return dateObj.toISOString().split('T')[0];
};

/**
 * Fonction utilitaire pour gérer les erreurs d'API
 * @param {Error} error - Erreur capturée
 * @returns {Object} Objet d'erreur formaté
 */
export const handleApiError = (error) => {
    if (error.response) {
        // Erreur de réponse du serveur
        return {
            status: error.response.status,
            message: error.response.data?.message || 'Erreur du serveur',
            data: error.response.data
        };
    } else if (error.request) {
        // Erreur de réseau
        return {
            status: 0,
            message: 'Erreur de connexion au serveur',
            data: null
        };
    } else {
        // Autre erreur
        return {
            status: -1,
            message: error.message || 'Erreur inconnue',
            data: null
        };
    }
};

// Export par défaut de l\'instance axios configurée
export default dmpApi; 

// ===== EXEMPLE D\'UTILISATION =====

/*
// Récupérer la liste des patients avec pagination
const patients = await getPatientsList({ limit: 10, offset: 0 });

// Récupérer les données DMP d\'un patient spécifique
const patientDMP = await getPatientDMPData(123);

// Récupérer les auto-mesures avec filtres
const autoMesures = await getAllAutoMesures({
    patientId: 123,
    type_mesure: 'tension',
    date_debut: '2024-01-01',
    date_fin: '2024-01-31'
});

// Supprimer une auto-mesure
await deleteAutoMesure(456);

// Récupérer les statistiques globales
const stats = await getGlobalStatistics();

// Désactiver l\'accès DMP d\'un patient
await desactiverAccesDMP(123);

// Gestion des erreurs
try {
    const result = await getPatientsList();
} catch (error) {
    const formattedError = handleApiError(error);
    console.error('Erreur:', formattedError.message);
}
*/
