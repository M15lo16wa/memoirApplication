import axios from "axios";

const API_URL = "http://localhost:3000/api";

const dmpApi = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

// Fonction utilitaire pour récupérer l'ID du patient connecté
const getConnectedPatientId = () => {
    const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
    return storedPatient.id;
};

// Intercepteur d'authentification
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
                id: patientId || storedPatient.id || 1,
                nom: storedPatient.nom || "Dupont",
                prenom: storedPatient.prenom || "Jean",
                date_naissance: storedPatient.date_naissance || "1985-03-15",
                groupe_sanguin: storedPatient.groupe_sanguin || "A+",
                allergies: storedPatient.allergies || "Pénicilline",
                maladies_chroniques: storedPatient.maladies_chroniques || "Diabète type 2",
                telephone: storedPatient.telephone || "+221 77 123 45 67",
                email: storedPatient.email || "jean.dupont@email.com"
            },
            statistiques: {
                auto_mesures: 24,
                documents: 8,
                rendez_vous: 3,
                consultations: 12
            },
            derniere_activite: "Consultation cardiologie - 15/01/2024"
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
        ]
    };
};

// ===== FONCTIONS DMP PRINCIPALES =====

// 1. Récupérer le tableau de bord
export const getTableauDeBord = async () => {
    try {
        const patientId = getConnectedPatientId();
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        // Simulation d'un délai réseau
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
        // Récupérer l'ID du patient connecté
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const patientId = storedPatient.id;
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockData = getMockDataForPatient(patientId);
        return { data: mockData.statistiques };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id);
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

// 4. Récupérer le DMP complet d'un patient
export const getDMP = async (patientId = null) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id;
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
        const mockData = getMockDataForPatient(storedPatient.id);
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

// 6. Récupérer l'historique médical
export const getHistoriqueMedical = async (patientId = null) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id;
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
        const mockData = getMockDataForPatient(storedPatient.id);
        return { data: mockData.historique };
    }
};

// 7. Ajouter une entrée à l'historique
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
            patientId = storedPatient.id;
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
        const mockData = getMockDataForPatient(storedPatient.id);
        return { data: mockData.historique };
    }
};

// 9. Gestion des droits d'accès
export const getDroitsAcces = async (patientId = null) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id;
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
        const mockData = getMockDataForPatient(storedPatient.id);
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
            patientId = storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockData = getMockDataForPatient(patientId);
        let mesures = mockData.auto_mesures;
        if (type) {
            mesures = mesures.filter(m => m.type === type);
        }
        return { data: mesures };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id);
        let mesures = mockData.auto_mesures;
        if (type) {
            mesures = mesures.filter(m => m.type === type);
        }
        return { data: mesures };
    }
};

export const createAutoMesureDMP = async (patientId = null, mesureData) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        const newMesure = { 
            id: Date.now(), 
            patient_id: patientId,
            ...mesureData 
        };
        return { data: newMesure };
    } catch (error) {
        console.warn("Mode développement: simulation d'ajout");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const newMesure = { 
            id: Date.now(), 
            patient_id: storedPatient.id,
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
export const getDocumentsDMP = async (patientId = null, type = null) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockData = getMockDataForPatient(patientId);
        let documents = mockData.documents;
        if (type) {
            documents = documents.filter(d => d.type === type);
        }
        return { data: documents };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id);
        let documents = mockData.documents;
        if (type) {
            documents = documents.filter(d => d.type === type);
        }
        return { data: documents };
    }
};

export const uploadDocumentDMP = async (patientId = null, documentData) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newDocument = {
            id: Date.now(),
            patient_id: patientId,
            titre: documentData.description || "Document uploadé",
            type: documentData.type || "autre",
            description: documentData.description || "",
            date_upload: new Date().toISOString().split('T')[0],
            taille: "1.5 MB",
            url: "#"
        };
        return { data: newDocument };
    } catch (error) {
        console.warn("Mode développement: simulation d'upload");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const newDocument = {
            id: Date.now(),
            patient_id: storedPatient.id,
            titre: documentData.description || "Document uploadé",
            type: documentData.type || "autre",
            description: documentData.description || "",
            date_upload: new Date().toISOString().split('T')[0],
            taille: "1.5 MB",
            url: "#"
        };
        return { data: newDocument };
    }
};

// 13. Bibliothèque de santé
export const getBibliothequeSante = async (patientId) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { data: [] };
    } catch (error) {
        console.warn("Mode développement: utilisation des données mock");
        return { data: [] };
    }
};

// 14. Statistiques DMP
export const getStatistiquesDMP = async (patientId, periode = '30j') => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id;
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
        const mockData = getMockDataForPatient(storedPatient.id);
        return { data: mockData.statistiques };
    }
};

export default {
    getDMP,
    updateDMP,
    getHistoriqueMedical,
    addHistoriqueEntry,
    getJournalActivite,
    getDroitsAcces,
    updateDroitsAcces,
    getAutoMesuresDMP,
    createAutoMesureDMP,
    getRendezVousDMP,
    createRendezVousDMP,
    getDocumentsDMP,
    uploadDocumentDMP,
    getBibliothequeSante,
    getStatistiquesDMP
}; 