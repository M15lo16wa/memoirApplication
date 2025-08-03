import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getCurrentUser, getStoredPatient } from '../services/api/authApi';
import * as dmpApi from '../services/api/dmpApi';

const DMPContext = createContext();

const initialState = {
    patientId: null,
    dmpData: null,
    historique: [],
    journal: [],
    autoMesures: [],
    rendezVous: [],
    documents: [],
    droitsAcces: [],
    bibliotheque: [],
    statistiques: {},
    loading: false,
    error: null,
    lastUpdate: null
};

const dmpReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'SET_PATIENT_ID':
            return { ...state, patientId: action.payload };
        case 'SET_DMP_DATA':
            return { 
                ...state, 
                dmpData: action.payload,
                lastUpdate: new Date().toISOString(),
                loading: false 
            };
        case 'SET_HISTORIQUE':
            return { ...state, historique: action.payload, loading: false };
        case 'SET_JOURNAL':
            return { ...state, journal: action.payload, loading: false };
        case 'SET_AUTO_MESURES':
            return { ...state, autoMesures: action.payload, loading: false };
        case 'SET_RENDEZ_VOUS':
            return { ...state, rendezVous: action.payload, loading: false };
        case 'SET_DOCUMENTS':
            return { ...state, documents: action.payload, loading: false };
        case 'SET_DROITS_ACCES':
            return { ...state, droitsAcces: action.payload, loading: false };
        case 'SET_BIBLIOTHEQUE':
            return { ...state, bibliotheque: action.payload, loading: false };
        case 'SET_STATISTIQUES':
            return { ...state, statistiques: action.payload, loading: false };
        case 'ADD_AUTO_MESURE':
            return { 
                ...state, 
                autoMesures: [action.payload, ...state.autoMesures],
                loading: false 
            };
        case 'ADD_DOCUMENT':
            return { 
                ...state, 
                documents: [action.payload, ...state.documents],
                loading: false 
            };
        case 'ADD_HISTORIQUE_ENTRY':
            return { 
                ...state, 
                historique: [action.payload, ...state.historique],
                loading: false 
            };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        default:
            return state;
    }
};

export const DMPProvider = ({ children }) => {
    const [state, dispatch] = useReducer(dmpReducer, initialState);

    // Initialiser le patient ID
    useEffect(() => {
        const currentUser = getCurrentUser();
        const storedPatient = getStoredPatient();
        
        // Prioriser les données du patient stockées localement
        if (storedPatient?.id) {
            dispatch({ type: 'SET_PATIENT_ID', payload: storedPatient.id });
        } else if (currentUser?.id) {
            dispatch({ type: 'SET_PATIENT_ID', payload: currentUser.id });
        }
    }, []);

    // Actions DMP
    const actions = {
        // Charger le DMP complet
        loadDMP: async () => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const dmpData = await dmpApi.getDMP(); // Utilise l'ID du patient connecté automatiquement
                dispatch({ type: 'SET_DMP_DATA', payload: dmpData });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Charger l'historique médical
        loadHistorique: async () => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const historique = await dmpApi.getHistoriqueMedical(); // Utilise l'ID du patient connecté automatiquement
                dispatch({ type: 'SET_HISTORIQUE', payload: historique });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Ajouter une entrée à l'historique
        addHistoriqueEntry: async (entry) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const newEntry = await dmpApi.addHistoriqueEntry(state.patientId, entry);
                dispatch({ type: 'ADD_HISTORIQUE_ENTRY', payload: newEntry });
                return newEntry;
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
                throw error;
            }
        },

        // Charger le journal d'activité
        loadJournal: async (filters = {}) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const journal = await dmpApi.getJournalActivite(state.patientId, filters);
                dispatch({ type: 'SET_JOURNAL', payload: journal });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Charger les auto-mesures
        loadAutoMesures: async (type = null) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const autoMesures = await dmpApi.getAutoMesuresDMP(null, type); // Utilise l'ID du patient connecté automatiquement
                dispatch({ type: 'SET_AUTO_MESURES', payload: autoMesures });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Créer une auto-mesure
        createAutoMesure: async (mesureData) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const newMesure = await dmpApi.createAutoMesureDMP(null, mesureData); // Utilise l'ID du patient connecté automatiquement
                dispatch({ type: 'ADD_AUTO_MESURE', payload: newMesure });
                return newMesure;
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
                throw error;
            }
        },

        // Charger les documents
        loadDocuments: async (type = null) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const documents = await dmpApi.getDocumentsDMP(null, type); // Utilise l'ID du patient connecté automatiquement
                dispatch({ type: 'SET_DOCUMENTS', payload: documents });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Uploader un document
        uploadDocument: async (documentData) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const newDocument = await dmpApi.uploadDocumentDMP(null, documentData); // Utilise l'ID du patient connecté automatiquement
                dispatch({ type: 'ADD_DOCUMENT', payload: newDocument });
                return newDocument;
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
                throw error;
            }
        },

        // Charger les droits d'accès
        loadDroitsAcces: async () => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const droits = await dmpApi.getDroitsAcces(state.patientId);
                dispatch({ type: 'SET_DROITS_ACCES', payload: droits });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Mettre à jour les droits d'accès
        updateDroitsAcces: async (droits) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const updatedDroits = await dmpApi.updateDroitsAcces(state.patientId, droits);
                dispatch({ type: 'SET_DROITS_ACCES', payload: updatedDroits });
                return updatedDroits;
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
                throw error;
            }
        },

        // Charger la bibliothèque de santé
        loadBibliotheque: async () => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const bibliotheque = await dmpApi.getBibliothequeSante(state.patientId);
                dispatch({ type: 'SET_BIBLIOTHEQUE', payload: bibliotheque });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Charger les statistiques
        loadStatistiques: async (periode = '30j') => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const statistiques = await dmpApi.getStatistiquesDMP(state.patientId, periode);
                dispatch({ type: 'SET_STATISTIQUES', payload: statistiques });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Charger les rendez-vous
        loadRendezVous: async () => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const rendezVous = await dmpApi.getRendezVousDMP(state.patientId);
                dispatch({ type: 'SET_RENDEZ_VOUS', payload: rendezVous });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Créer un rendez-vous
        createRendezVous: async (rdvData) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const newRdv = await dmpApi.createRendezVousDMP(state.patientId, rdvData);
                // Recharger la liste des rendez-vous
                actions.loadRendezVous();
                return newRdv;
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
                throw error;
            }
        },

        // Mettre à jour le DMP
        updateDMP: async (dmpData) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const updatedDMP = await dmpApi.updateDMP(state.patientId, dmpData);
                dispatch({ type: 'SET_DMP_DATA', payload: updatedDMP });
                return updatedDMP;
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
                throw error;
            }
        },

        // Effacer les erreurs
        clearError: () => {
            dispatch({ type: 'CLEAR_ERROR' });
        },

        // Recharger toutes les données
        refreshAllData: async () => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                await Promise.all([
                    actions.loadDMP(),
                    actions.loadHistorique(),
                    actions.loadJournal(),
                    actions.loadAutoMesures(),
                    actions.loadDocuments(),
                    actions.loadDroitsAcces(),
                    actions.loadBibliotheque(),
                    actions.loadStatistiques(),
                    actions.loadRendezVous()
                ]);
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        }
    };

    return (
        <DMPContext.Provider value={{ state, actions }}>
            {children}
        </DMPContext.Provider>
    );
};

export { DMPContext };
export const useDMP = () => {
    const context = useContext(DMPContext);
    if (!context) {
        throw new Error('useDMP doit être utilisé dans un DMPProvider');
    }
    return context;
}; 