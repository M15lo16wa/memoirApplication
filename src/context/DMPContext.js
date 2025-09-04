import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { getCurrentUser, getStoredPatient } from '../services/api/authApi';
import * as dmpApi from '../services/api/dmpApi';
import * as medicalApi from '../services/api/medicalApi';
import { isAuthenticated } from '../services/api/authApi';


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
            return { ...state, historique: action.payload || [], loading: false };
        case 'SET_JOURNAL':
            return { ...state, journal: action.payload || [], loading: false };
        case 'SET_AUTO_MESURES':
            return { ...state, autoMesures: action.payload || [], loading: false };
        case 'SET_RENDEZ_VOUS':
            return { ...state, rendezVous: action.payload || [], loading: false };
        case 'SET_DOCUMENTS':
            return { ...state, documents: action.payload || [], loading: false };
        case 'SET_DROITS_ACCES':
            return { ...state, droitsAcces: action.payload || [], loading: false };
        case 'SET_BIBLIOTHEQUE':
            return { ...state, bibliotheque: action.payload || [], loading: false };
        case 'SET_STATISTIQUES':
            return { ...state, statistiques: action.payload, loading: false };
        case 'SET_LAST_DMP_REQUEST':
            return { ...state, lastDMPRequest: action.payload };
        case 'ADD_AUTO_MESURE':
            // Validation que state.autoMesures est bien un tableau
            const currentAutoMesures = Array.isArray(state.autoMesures) ? state.autoMesures : [];
            
            return { 
                ...state, 
                autoMesures: [action.payload, ...currentAutoMesures],
                loading: false 
            };
        case 'ADD_DOCUMENT':
            // Validation que state.documents est bien un tableau
            const currentDocuments = Array.isArray(state.documents) ? state.documents : [];
            
            return { 
                ...state, 
                documents: [action.payload, ...currentDocuments],
                loading: false 
            };
        case 'ADD_HISTORIQUE_ENTRY':
            // Validation que state.historique est bien un tableau
            const currentHistorique = Array.isArray(state.historique) ? state.historique : [];
            
            return { 
                ...state, 
                historique: [action.payload, ...currentHistorique],
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
        const initializePatientId = () => {
            const currentUser = getCurrentUser();
            const storedPatientData = getStoredPatient();
            
            console.log('🔍 DMPContext - Initialisation du patient ID:');
            console.log('  - currentUser:', currentUser);
            console.log('  - storedPatientData:', storedPatientData);
            
            let patientId = null;
            
            // Prioriser les données du patient stockées localement
            if (storedPatientData?.id_patient || storedPatientData?.id) {
                patientId = storedPatientData.id_patient || storedPatientData.id;
                console.log('✅ DMPContext - Patient ID récupéré depuis storedPatientData:', patientId);
            } else if (currentUser?.id_patient || currentUser?.id) {
                patientId = currentUser.id_patient || currentUser.id;
                console.log('✅ DMPContext - Patient ID récupéré depuis currentUser:', patientId);
            }
            
            if (patientId) {
                // Vérifier que l'ID est valide (nombre positif)
                if (typeof patientId === 'number' && patientId > 0) {
                    console.log('✅ DMPContext - Patient ID valide défini:', patientId);
                    dispatch({ type: 'SET_PATIENT_ID', payload: patientId });
                } else if (typeof patientId === 'string' && !isNaN(parseInt(patientId)) && parseInt(patientId) > 0) {
                    const numericId = parseInt(patientId);
                    console.log('✅ DMPContext - Patient ID converti en nombre:', numericId);
                    dispatch({ type: 'SET_PATIENT_ID', payload: numericId });
                } else {
                    console.error('❌ DMPContext - Patient ID invalide:', patientId, 'Type:', typeof patientId);
                }
            } else {
                console.warn('⚠️ DMPContext - Aucun Patient ID trouvé');
            }
        };
        
        // Initialiser immédiatement
        initializePatientId();
        
        // Écouter les changements dans le localStorage
        const handleStorageChange = (e) => {
            if (e.key === 'patient' || e.key === 'token') {
                console.log('🔄 DMPContext - Changement détecté dans localStorage, réinitialisation du Patient ID');
                setTimeout(initializePatientId, 100); // Délai pour laisser le temps aux données de se mettre à jour
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Charger les données initiales quand le patientId est disponible
    useEffect(() => {
        if (state.patientId) {
            // ✅ VÉRIFICATION D'AUTHENTIFICATION : Ne charger les données que si l'utilisateur est connecté
            if (!isAuthenticated()) {
                console.log('🔒 DMPContext - Utilisateur non authentifié');
                console.log('🔒 DMPContext - Utilisateur non authentifié, pas de chargement automatique des données');
                return;
            }
            
            console.log('🔐 DMPContext - Utilisateur authentifié, chargement des données initiales...');
            
            // Charger les documents automatiquement
            const loadInitialDocuments = async () => {
                try {
                    const response = await dmpApi.getDocumentsPersonnelsDMP(state.patientId, {});
                    console.log('📄 Documents personnels chargés dans le contexte:', response);
                    
                    // S'assurer que nous avons un tableau de documents
                    let documents = [];
                    if (response && Array.isArray(response)) {
                        documents = response;
                    } else if (response && response.data && Array.isArray(response.data)) {
                        documents = response.data;
                    }
                    
                    console.log('📄 Documents finaux pour le contexte:', documents);
                    dispatch({ type: 'SET_DOCUMENTS', payload: documents });
                } catch (error) {
                    console.error('❌ Erreur lors du chargement des documents dans le contexte:', error);
                    dispatch({ type: 'SET_ERROR', payload: error.message });
                }
            };

            // Charger les auto-mesures automatiquement
            const loadInitialAutoMesures = async () => {
                try {
                    const response = await dmpApi.getAutoMesuresDMP(state.patientId, null);
                    console.log('📊 Auto-mesures chargées dans le contexte (initial):', response);
                    
                    // S'assurer que nous avons un tableau d'auto-mesures
                    let autoMesures = [];
                    
                    // Log détaillé pour déboguer le format des données (même logique que loadAutoMesures)
                    console.log('🔍 Format de réponse reçu (initial):', {
                        response: response,
                        responseData: response?.data,
                        responseDataType: typeof response?.data,
                        isArray: Array.isArray(response?.data),
                        hasAutoMesures: response?.data?.auto_mesures,
                        autoMesuresType: typeof response?.data?.auto_mesures,
                        autoMesuresIsArray: Array.isArray(response?.data?.auto_mesures)
                    });
                    
                    // Traitement simplifié et optimisé (même logique que loadAutoMesures)
                    if (response && response.data && Array.isArray(response.data)) {
                        // Format actuel : { data: [...] }
                        autoMesures = response.data;
                        console.log('✅ Format détecté (initial) : response.data (tableau direct)');
                    } else if (response && response.data && response.data.auto_mesures && Array.isArray(response.data.auto_mesures)) {
                        // Format alternatif : { data: { auto_mesures: [...] } }
                        autoMesures = response.data.auto_mesures;
                        console.log('✅ Format détecté (initial) : response.data.auto_mesures');
                    } else if (response && Array.isArray(response)) {
                        // Format direct : [...]
                        autoMesures = response;
                        console.log('✅ Format détecté (initial) : response (tableau direct)');
                    } else {
                        console.warn('⚠️ Format de réponse non reconnu (initial), initialisation avec tableau vide');
                        autoMesures = [];
                    }
                    
                    console.log('📊 Auto-mesures finales pour le contexte (initial):', autoMesures);
                    dispatch({ type: 'SET_AUTO_MESURES', payload: autoMesures });
                } catch (error) {
                    console.error('❌ Erreur lors du chargement des auto-mesures dans le contexte (initial):', error);
                    // En cas d'erreur, initialiser avec un tableau vide
                    console.warn("Erreur API: initialisation des auto-mesures avec tableau vide (initial)");
                    dispatch({ type: 'SET_AUTO_MESURES', payload: [] });
                }
            };

            loadInitialDocuments();
            loadInitialAutoMesures();
        }
    }, [state.patientId]);

    // Actions DMP - Memoized to prevent infinite re-renders
    const actions = useMemo(() => ({
        // Charger le DMP complet
        loadDMP: async () => {
            // ✅ VÉRIFICATION D'AUTHENTIFICATION : Ne charger le DMP que si l'utilisateur est connecté
            if (!isAuthenticated()) {
                console.log('🔒 DMPContext.loadDMP - Utilisateur non authentifié');
                console.log('🔒 DMPContext - Utilisateur non authentifié, pas de chargement du DMP');
                return;
            }
            
            if (!state.patientId) {
                console.log('⚠️ DMPContext - Pas de patient ID, pas de chargement du DMP');
                return;
            }
            
            // Éviter les requêtes trop fréquentes (minimum 15 secondes entre les requêtes)
            const now = Date.now();
            if (now - (state.lastDMPRequest || 0) < 15000) {
                console.log('⏭️ DMPContext - Requête DMP ignorée (trop récente)');
                return;
            }
            
            console.log('🔐 DMPContext - Chargement du DMP pour le patient:', state.patientId);
            dispatch({ type: 'SET_LOADING', payload: true });
            dispatch({ type: 'SET_LAST_DMP_REQUEST', payload: now });
            
            try {
                const response = await dmpApi.getDMP(state.patientId);
                dispatch({ type: 'SET_DMP_DATA', payload: response.data });
                console.log('✅ DMPContext - DMP chargé avec succès');
            } catch (error) {
                console.error('❌ DMPContext - Erreur lors du chargement du DMP:', error);
                if (error.response?.status === 429) {
                    console.warn('⚠️ DMPContext - Rate limit atteint, utilisation des données en cache');
                    return;
                }
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Charger l'historique médical
        loadHistorique: async () => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const response = await dmpApi.getHistoriqueMedical(state.patientId); // Utilise l'ID du patient connecté
                dispatch({ type: 'SET_HISTORIQUE', payload: response.data });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Ajouter une entrée à l'historique
        addHistoriqueEntry: async (entry) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const response = await dmpApi.addHistoriqueEntry(state.patientId, entry);
                dispatch({ type: 'ADD_HISTORIQUE_ENTRY', payload: response.data });
                return response.data;
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
                const response = await dmpApi.getJournalActivite(state.patientId, filters);
                dispatch({ type: 'SET_JOURNAL', payload: response.data });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Charger les auto-mesures
        loadAutoMesures: async (type = null) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const response = await dmpApi.getAutoMesuresDMP(state.patientId, type); // Passer l'ID du patient connecté
                console.log('📊 Auto-mesures chargées via actions:', response);
                
                // S'assurer que nous avons un tableau d'auto-mesures
                let autoMesures = [];
                
                // Log détaillé pour déboguer le format des données
                console.log('🔍 Format de réponse reçu:', {
                    response: response,
                    responseData: response?.data,
                    responseDataType: typeof response?.data,
                    isArray: Array.isArray(response?.data),
                    hasAutoMesures: response?.data?.auto_mesures,
                    autoMesuresType: typeof response?.data?.auto_mesures,
                    autoMesuresIsArray: Array.isArray(response?.data?.auto_mesures)
                });
                
                // Traitement simplifié et optimisé
                if (response && response.data && Array.isArray(response.data)) {
                    // Format actuel : { data: [...] }
                    autoMesures = response.data;
                    console.log('✅ Format détecté : response.data (tableau direct)');
                } else if (response && response.data && response.data.auto_mesures && Array.isArray(response.data.auto_mesures)) {
                    // Format alternatif : { data: { auto_mesures: [...] } }
                    autoMesures = response.data.auto_mesures;
                    console.log('✅ Format détecté : response.data.auto_mesures');
                } else if (response && Array.isArray(response)) {
                    // Format direct : [...]
                    autoMesures = response;
                    console.log('✅ Format détecté : response (tableau direct)');
                } else {
                    console.warn('⚠️ Format de réponse non reconnu, initialisation avec tableau vide');
                    autoMesures = [];
                }
                
                console.log('📊 Auto-mesures finales via actions:', autoMesures);
                dispatch({ type: 'SET_AUTO_MESURES', payload: autoMesures });
            } catch (error) {
                console.error('❌ Erreur lors du chargement des auto-mesures via actions:', error);
                // En cas d'erreur, initialiser avec un tableau vide
                console.warn("Erreur API: initialisation des auto-mesures avec tableau vide");
                dispatch({ type: 'SET_AUTO_MESURES', payload: [] });
            }
        },

        // Créer une auto-mesure
        createAutoMesure: async (mesureData) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const response = await dmpApi.createAutoMesureDMP(state.patientId, mesureData); // Utilise l'ID du patient connecté
                console.log(' Auto-mesure créée via contexte:', response);
                
                // Recharger toutes les auto-mesures pour avoir les données à jour
                await actions.loadAutoMesures();
                
                // Retourner la réponse complète au lieu de response.data
                return response;
            } catch (error) {
                console.error(' Erreur lors de la création de l\'auto-mesure via contexte:', error);
                dispatch({ type: 'SET_ERROR', payload: error.message });
                throw error;
            }
        },

        // Charger les documents
        loadDocuments: async (filters = {}) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                // Utiliser getDocumentsPersonnelsDMP pour récupérer uniquement les documents personnels
                const response = await dmpApi.getDocumentsPersonnelsDMP(state.patientId, filters);
                console.log('📄 Documents personnels chargés via getDocumentsPersonnelsDMP:', response);
                
                // S'assurer que nous avons un tableau de documents
                let documents = [];
                if (response && Array.isArray(response)) {
                    documents = response;
                } else if (response && response.data && Array.isArray(response.data)) {
                    documents = response.data;
                }
                
                console.log('📄 Documents finaux pour le contexte:', documents);
                dispatch({ type: 'SET_DOCUMENTS', payload: documents });
            } catch (error) {
                console.error('❌ Erreur lors du chargement des documents via getDocumentsPersonnelsDMP:', error);
                // En cas d'erreur, initialiser avec un tableau vide
                console.warn("Erreur API: initialisation des documents avec tableau vide");
                dispatch({ type: 'SET_DOCUMENTS', payload: [] });
            }
        },

        // Uploader un document
        uploadDocument: async (documentData) => {
            if (!state.patientId) return;
            
            // Validation de la taille du fichier (max 10MB)
            if (documentData && documentData.file && documentData.file.size > 10 * 1024 * 1024) {
                const error = "Le fichier est trop volumineux. Taille maximale autorisée : 10MB";
                dispatch({ type: 'SET_ERROR', payload: error });
                throw new Error(error);
            }
            
            // Information sur la taille du fichier
            if (documentData && documentData.file) {
                const fileSizeMB = (documentData.file.size / (1024 * 1024)).toFixed(2);
                const warningSize = 8 * 1024 * 1024; // 8MB - seuil d'avertissement
                
                if (documentData.file.size > warningSize) {
                    const remainingMB = (10 - parseFloat(fileSizeMB)).toFixed(2);
                    console.log(` Attention : Fichier de ${fileSizeMB}MB (${remainingMB}MB restants sur 10MB)`);
                } else {
                    console.log(`Fichier de ${fileSizeMB}MB - Taille acceptable`);
                }
            }
            
            // Validation du type de fichier autorisé
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (documentData && documentData.file && !allowedTypes.includes(documentData.file.type)) {
                const error = "Type de fichier non autorisé. Types acceptés : JPG, PNG, GIF, PDF, TXT, DOC, DOCX";
                dispatch({ type: 'SET_ERROR', payload: error });
                throw new Error(error);
            }
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                // Créer le FormData pour l'upload
                const formData = new FormData();
                formData.append('file', documentData.file);
                formData.append('title', documentData.description || 'Document sans titre');
                formData.append('description', documentData.description || '');
                formData.append('type', documentData.type || 'general');
                formData.append('categorie', documentData.categorie || 'general');
                formData.append('patientId', state.patientId);
                
                // Debug: Vérifier le contenu du FormData
                console.log('Contenu du FormData avant envoi:');
                for (let [key, value] of formData.entries()) {
                    if (key === 'file') {
                        console.log(`  ${key}:`, {
                            name: value.name,
                            type: value.type,
                            size: value.size,
                            isFile: value instanceof File
                        });
                    } else {
                        console.log(`  ${key}:`, value);
                    }
                }
                
                console.log('Envoi du FormData:', {
                    file: documentData.file?.name,
                    title: documentData.description || 'Document sans titre',
                    description: documentData.description || '',
                    type: documentData.type || 'general',
                    categorie: documentData.categorie || 'general',
                    patientId: state.patientId
                });
                
                // Appel à l'API réelle pour uploader le document
                const response = await medicalApi.uploadDocument(state.patientId, formData);
                
                if (response) {
                    // Créer un objet document pour l'ajouter au contexte
                    const newDocument = {
                        id: response.id || Date.now(),
                        name: documentData.file?.name || 'Document',
                        type: documentData.type || 'general',
                        description: documentData.description || '',
                        categorie: documentData.categorie || 'general',
                        size: documentData.file?.size,
                        uploadedAt: new Date().toISOString(),
                        ...response
                    };
                    
                    dispatch({ type: 'ADD_DOCUMENT', payload: newDocument });
                    console.log(' Document uploadé via le contexte:', newDocument);
                    return newDocument;
                } else {
                    throw new Error('Réponse invalide de l\'API');
                }
            } catch (error) {
                console.error('Erreur lors de l\'upload via le contexte:', error);
                dispatch({ type: 'SET_ERROR', payload: error.message });
                throw error;
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        },

        // Charger les droits d'accès
        loadDroitsAcces: async () => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const response = await dmpApi.getDroitsAcces(state.patientId);
                dispatch({ type: 'SET_DROITS_ACCES', payload: response.data });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Mettre à jour les droits d'accès
        updateDroitsAcces: async (droits) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const response = await dmpApi.updateDroitsAcces(state.patientId, droits);
                dispatch({ type: 'SET_DROITS_ACCES', payload: response.data });
                return response.data;
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
                const response = await dmpApi.getBibliothequeSante(state.patientId);
                dispatch({ type: 'SET_BIBLIOTHEQUE', payload: response.data });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Charger les statistiques
        loadStatistiques: async (periode = '30j') => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const response = await dmpApi.getStatistiquesDMP(state.patientId, periode);
                dispatch({ type: 'SET_STATISTIQUES', payload: response.data });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Charger les rendez-vous
        loadRendezVous: async () => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const response = await dmpApi.getRendezVousDMP(state.patientId);
                dispatch({ type: 'SET_RENDEZ_VOUS', payload: response.data });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },

        // Créer un rendez-vous
        createRendezVous: async (rdvData) => {
            if (!state.patientId) return;
            
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const response = await dmpApi.createRendezVousDMP(state.patientId, rdvData);
                // Recharger la liste des rendez-vous directement
                const rendezVousResponse = await dmpApi.getRendezVousDMP(state.patientId);
                dispatch({ type: 'SET_RENDEZ_VOUS', payload: rendezVousResponse.data });
                return response.data;
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
                const response = await dmpApi.updateDMP(state.patientId, dmpData);
                dispatch({ type: 'SET_DMP_DATA', payload: response.data });
                return response.data;
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
            if (!state.patientId) {
                console.warn('⚠️ DMPContext - refreshAllData: patientId non défini');
                return;
            }
            
            console.log('🔄 DMPContext - Rechargement de toutes les données pour le patient:', state.patientId);
            dispatch({ type: 'SET_LOADING', payload: true });
            
            try {
                const [
                    dmpDataResponse,
                    historiqueResponse,
                    journalResponse,
                    autoMesuresResponse,
                    documentsResponse,
                    droitsAccesResponse,
                    bibliothequeResponse,
                    statistiquesResponse,
                    rendezVousResponse
                ] = await Promise.all([
                    dmpApi.getDMP(),
                    dmpApi.getHistoriqueMedical(),
                    dmpApi.getJournalActivite(state.patientId),
                    dmpApi.getAutoMesuresDMP(null),
                    dmpApi.getDocumentsPersonnelsDMP(state.patientId, {}),
                    dmpApi.getDroitsAcces(state.patientId),
                    dmpApi.getBibliothequeSante(state.patientId),
                    dmpApi.getStatistiquesDMP(state.patientId),
                    dmpApi.getRendezVousDMP(state.patientId)
                ]);
                
                // Dispatch all the results with .data extraction
                dispatch({ type: 'SET_DMP_DATA', payload: dmpDataResponse.data });
                dispatch({ type: 'SET_HISTORIQUE', payload: historiqueResponse.data });
                dispatch({ type: 'SET_JOURNAL', payload: journalResponse.data });
                dispatch({ type: 'SET_AUTO_MESURES', payload: autoMesuresResponse.data });
                dispatch({ type: 'SET_DOCUMENTS', payload: documentsResponse.data || documentsResponse });
                dispatch({ type: 'SET_DROITS_ACCES', payload: droitsAccesResponse.data });
                dispatch({ type: 'SET_BIBLIOTHEQUE', payload: bibliothequeResponse.data });
                dispatch({ type: 'SET_STATISTIQUES', payload: statistiquesResponse.data });
                dispatch({ type: 'SET_RENDEZ_VOUS', payload: rendezVousResponse.data });
                
                console.log('✅ DMPContext - Toutes les données rechargées avec succès pour le patient:', state.patientId);
            } catch (error) {
                console.error('❌ DMPContext - Erreur lors du rechargement des données pour le patient:', state.patientId, error);
                dispatch({ type: 'SET_ERROR', payload: error.message });
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        },

        // Forcer la réinitialisation du patient ID
        forceRefreshPatientId: () => {
            console.log('🔄 DMPContext - Forçage de la réinitialisation du Patient ID');
            const currentUser = getCurrentUser();
            const storedPatientData = getStoredPatient();
            
            let patientId = null;
            
            if (storedPatientData?.id_patient || storedPatientData?.id) {
                patientId = storedPatientData.id_patient || storedPatientData.id;
            } else if (currentUser?.id_patient || currentUser?.id) {
                patientId = currentUser.id_patient || currentUser.id;
            }
            
            if (patientId) {
                const numericId = typeof patientId === 'string' ? parseInt(patientId) : patientId;
                if (numericId > 0) {
                    console.log('✅ DMPContext - Nouveau Patient ID forcé:', numericId);
                    dispatch({ type: 'SET_PATIENT_ID', payload: numericId });
                    return numericId;
                }
            }
            
            console.warn('⚠️ DMPContext - Impossible de forcer la réinitialisation du Patient ID');
            return null;
        }
    }), [state.patientId, state.lastDMPRequest]);

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

export default DMPContext;