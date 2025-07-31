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
        // Priorité au token patient (JWT)
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

// 1-) Récupération des rendez-vous du patient
export const getPatientRendezVous = async (patientId) => {
    try {
        const response = await api.get(`/rendez-vous/patient/${patientId}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log('Service rendez-vous non disponible');
        return { data: [] };
    }
};

// 2-) Récupération des prochains rendez-vous
export const getProchainRendezVous = async (patientId) => {
    try {
        const response = await api.get(`/rendez-vous/patient/${patientId}/prochain`);
        return response.data;
    } catch (error) {
        console.log('Aucun prochain rendez-vous');
        return { data: null };
    }
};

// 3-) Récupération des traitements actifs
export const getTraitementsActifs = async (patientId) => {
    try {
        const response = await api.get(`/prescription/patient/${patientId}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log('Service traitements non disponible');
        return { data: [] };
    }
};

// 3.1-) creation d'ordonnance
export const createOrdonnance = async (Id) => {
    try {
        const response = await api.post(`/prescription/${Id}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log('creation d\'ordonnance success');
        return { data: [] };
    }
};

// 3.2-) creation de prescription d'examen
export const createExamen = async (examen) => {
    try {
        const response = await api.post(`/prescription/demande-examen`, examen);
        return response.data;
    } catch (error) {
        console.log('creation de demande d\'examen success');
        return { data: [] };
    }
};

//  3.3-) creation de dossier medical
export const createDossierMedical = async (dossierMedical) => {
    try {
        const response = await api.post(`/dossierMedical`, dossierMedical);
        return response.data;
    } catch (error) {
        console.log('creation de dossier medical success');
        return { data: [] };
    }
};

// 3-3) recuperation des services
export const getServices = async () => {
    try{
        const response = await api.get(`/service-sante`);
        console.log(response.data);
        return response.data;
    }catch(error){
        console.log('Service services non disponible');
        return { data: [] };
    }
}

// 3-4) Récupération des patients
export const getPatients = async () => {
    try {
        console.log('Fetching patients from API...');
        const response = await api.get("/patient");
        console.log('API Response:', response);
        
        if (!response || !response.data) {
            console.error('Invalid API response format:', response);
            return [];
        }
        
        // Handle the API response format: { status: 'success', results: 3, data: { patients: [...] } }
        if (response.data.status === 'success' && response.data.data && response.data.data.patients) {
            console.log('Returning patients from response.data.data.patients:', response.data.data.patients);
            return response.data.data.patients;
        }
        
        // Fallback to check other possible formats
        if (Array.isArray(response.data)) {
            console.log('Returning patients array directly:', response.data);
            return response.data;
        }
        
        if (response.data.patients && Array.isArray(response.data.patients)) {
            console.log('Returning patients from response.data.patients:', response.data.patients);
            return response.data.patients;
        }
        
        if (response.data.id_patient) {
            console.log('Returning single patient as array:', [response.data]);
            return [response.data];
        }
        
        console.error('Unexpected API response format:', response.data);
        return [];
    } catch (error) {
        console.error('Error fetching patients:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        return [];
    }
};


// 4-) Récupération des documents récents
export const getDocumentsRecents = async (Id) => {
    try {
        const response = await api.get(`/dossierMedical/${Id}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log('Service documents non disponible');
        return { data: [] };
    }
};

// 5-) Récupération de tous les documents du patient
export const getPatientDocuments = async (patientId) => {
    try {
        const response = await api.get(`/documents/patient/${patientId}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log('Service documents non disponible');
        return { data: [] };
    }
};

// 6-) Récupération des paramètres biologiques
export const getParametresBiologiques = async (patientId) => {
    try {
        const response = await api.get(`/analyses/patient/${patientId}/biologiques`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log('Service analyses biologiques non disponible');
        return { data: [] };
    }
};

// 7-) Récupération des antécédents médicaux
export const getAntecedentsMedicaux = async (patientId) => {
    try {
        const response = await api.get(`/antecedents/patient/${patientId}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log('Service antécédents non disponible');
        return { data: [] };
    }
};

// 8-) Récupération des allergies
export const getAllergies = async (patientId) => {
    try {
        const response = await api.get(`/allergies/patient/${patientId}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log('Service allergies non disponible');
        return { data: [] };
    }
};

// 9-) Récupération de l'historique des consultations
export const getHistoriqueConsultations = async (patientId) => {
    try {
        const response = await api.get(`/consultations/patient/${patientId}/historique`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log('Service consultations non disponible');
        return { data: [] };
    }
};

// 10-) Upload d'un document
export const uploadDocument = async (patientId, formData) => {
    try {
        const response = await api.post(`/documents/patient/${patientId}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de l'upload du document";
    }
};

// 11-) Téléchargement d'un document
export const downloadDocument = async (documentId) => {
    try {
        const response = await api.get(`/documents/${documentId}/download`, {
            responseType: 'blob',
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors du téléchargement";
    }
};

// 12-) Visualisation d'un document
export const viewDocument = async (documentId) => {
    try {
        const response = await api.get(`/documents/${documentId}/view`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la visualisation";
    }
};

// 13-) Récupération du résumé médical complet
export const getResumeMedical = async (patientId) => {
    try {
        // Récupérer toutes les données en parallèle
        const [
            antecedents,
            allergies,
            consultations,
            traitements
        ] = await Promise.allSettled([
            getAntecedentsMedicaux(patientId),
            getAllergies(patientId),
            getHistoriqueConsultations(patientId),
            getTraitementsActifs(patientId)
        ]);
        
        return {
            antecedents: antecedents.status === 'fulfilled' ? antecedents.value.data : [],
            allergies: allergies.status === 'fulfilled' ? allergies.value.data : [],
            consultations: consultations.status === 'fulfilled' ? consultations.value.data : [],
            traitements: traitements.status === 'fulfilled' ? traitements.value.data : []
        };
    } catch (error) {
        console.log('Erreur lors de la récupération du résumé médical');
        return {
            antecedents: [],
            allergies: [],
            consultations: [],
            traitements: []
        };
    }
};

// 14-)  creation de consultation
export const createConsultation = async (consultation) => {
    try {
        const response = await api.post(`/consultation`, consultation);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log('Erreur lors de la création de la consultation');
        return { data: [] };
    }
};

// 15-) recuperation des consulatiions
export const getConsultations = async (ID) => {
    try {
        const response = await api.get(`/consultation/${ID}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log('Erreur lors de la récupération des consultations');
        return { data: [] };
    }
}

// 16-) suppression de consultation
export const deleteConsultation = async (ID) => {
    try {
        const response = await api.delete(`/consultation/${ID}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log('Erreur lors de la suppression de la consultation');
        return { data: [] };
    }
}

// 17-)transmettre la consultation au patient

// export const transmettreConsultation = async (ID) => {
//     try{

//     }
// }

const apiExports = {
    getPatientRendezVous,
    getProchainRendezVous,
    getTraitementsActifs,
    getDocumentsRecents,
    getPatientDocuments,
    getParametresBiologiques,
    getAntecedentsMedicaux,
    getAllergies,
    getHistoriqueConsultations,
    uploadDocument,
    downloadDocument,
    viewDocument,
    getResumeMedical,
    getPatients
};

export default apiExports;
