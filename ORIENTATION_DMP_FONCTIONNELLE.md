# Orientation pour Rendre la Page DMP Fonctionnelle

## 📋 Vue d'ensemble

Ce document fournit une orientation complète pour rendre la page DMP (Dossier Médical Partagé) entièrement fonctionnelle en synchronisant le service API frontend avec les fonctionnalités DMP implémentées dans le backend.

## 🎯 Objectifs

1. **Synchronisation complète** entre le frontend et le backend DMP
2. **Interface utilisateur moderne** et intuitive pour les patients
3. **Fonctionnalités complètes** du DMP opérationnelles
4. **Gestion d'état robuste** avec cache et validation
5. **Expérience utilisateur optimale** avec feedback en temps réel

## 🏗️ Architecture Recommandée

### Structure Frontend
```
src/
├── services/
│   └── api/
│       ├── patientApi.js          # ✅ Créé - Service API complet
│       └── dmpApi.js              # 🆕 À créer - Service DMP spécialisé
├── components/
│   └── dmp/
│       ├── DMPDashboard.js        # Tableau de bord principal
│       ├── DMPHistorique.js       # Historique médical
│       ├── DMPJournal.js          # Journal d'activité
│       ├── DMPDroitsAcces.js      # Gestion des droits d'accès
│       ├── DMPAutoMesures.js      # Auto-mesures
│       ├── DMPRendezVous.js       # Gestion des rendez-vous
│       ├── DMPDocuments.js        # Documents personnels
│       ├── DMPBibliotheque.js     # Bibliothèque de santé
│       └── DMPStatistiques.js     # Statistiques DMP
├── hooks/
│   └── useDMP.js                  # Hook personnalisé pour DMP
├── context/
│   └── DMPContext.js              # Contexte pour l'état global DMP
└── utils/
    └── dmpUtils.js                # Utilitaires DMP
```

## 🔧 Implémentation Étape par Étape

### Étape 1: Service API DMP Spécialisé

#### Créer `src/services/api/dmpApi.js`
```javascript
import axios from "axios";

const API_URL = "http://localhost:3000/api";

const dmpApi = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

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

// ===== FONCTIONS DMP PRINCIPALES =====

// 1. Récupérer le DMP complet d'un patient
export const getDMP = async (patientId) => {
    try {
        const response = await dmpApi.get(`/patients/${patientId}/dmp`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 2. Mettre à jour le DMP
export const updateDMP = async (patientId, dmpData) => {
    try {
        const response = await dmpApi.put(`/patients/${patientId}/dmp`, dmpData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 3. Récupérer l'historique médical
export const getHistoriqueMedical = async (patientId) => {
    try {
        const response = await dmpApi.get(`/patients/${patientId}/dmp/historique`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 4. Ajouter une entrée à l'historique
export const addHistoriqueEntry = async (patientId, entry) => {
    try {
        const response = await dmpApi.post(`/patients/${patientId}/dmp/historique`, entry);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 5. Récupérer le journal d'activité
export const getJournalActivite = async (patientId, filters = {}) => {
    try {
        const params = new URLSearchParams(filters);
        const response = await dmpApi.get(`/patients/${patientId}/dmp/journal?${params}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 6. Gestion des droits d'accès
export const getDroitsAcces = async (patientId) => {
    try {
        const response = await dmpApi.get(`/patients/${patientId}/dmp/droits-acces`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateDroitsAcces = async (patientId, droits) => {
    try {
        const response = await dmpApi.put(`/patients/${patientId}/dmp/droits-acces`, droits);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 7. Auto-mesures DMP
export const getAutoMesuresDMP = async (patientId, type = null) => {
    try {
        const params = type ? `?type=${type}` : '';
        const response = await dmpApi.get(`/patients/${patientId}/dmp/auto-mesures${params}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createAutoMesureDMP = async (patientId, mesureData) => {
    try {
        const response = await dmpApi.post(`/patients/${patientId}/dmp/auto-mesures`, mesureData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 8. Rendez-vous DMP
export const getRendezVousDMP = async (patientId) => {
    try {
        const response = await dmpApi.get(`/patients/${patientId}/dmp/rendez-vous`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createRendezVousDMP = async (patientId, rdvData) => {
    try {
        const response = await dmpApi.post(`/patients/${patientId}/dmp/rendez-vous`, rdvData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 9. Documents DMP
export const getDocumentsDMP = async (patientId, type = null) => {
    try {
        const params = type ? `?type=${type}` : '';
        const response = await dmpApi.get(`/patients/${patientId}/dmp/documents${params}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const uploadDocumentDMP = async (patientId, documentData) => {
    try {
        const formData = new FormData();
        formData.append('file', documentData.file);
        formData.append('type', documentData.type);
        formData.append('description', documentData.description);
        formData.append('categorie', documentData.categorie || 'general');
        
        const response = await dmpApi.post(`/patients/${patientId}/dmp/documents`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 10. Bibliothèque de santé
export const getBibliothequeSante = async (patientId) => {
    try {
        const response = await dmpApi.get(`/patients/${patientId}/dmp/bibliotheque`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 11. Statistiques DMP
export const getStatistiquesDMP = async (patientId, periode = '30j') => {
    try {
        const response = await dmpApi.get(`/patients/${patientId}/dmp/statistiques?periode=${periode}`);
        return response.data;
    } catch (error) {
        throw error;
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
```

### Étape 2: Contexte DMP Global

#### Créer `src/context/DMPContext.js`
```javascript
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getCurrentUser } from '../services/api/authApi';
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
        if (currentUser?.id) {
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
                const dmpData = await dmpApi.getDMP(state.patientId);
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
                const historique = await dmpApi.getHistoriqueMedical(state.patientId);
                dispatch({ type: 'SET_HISTORIQUE', payload: historique });
            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
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
                const autoMesures = await dmpApi.getAutoMesuresDMP(state.patientId, type);
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
                const newMesure = await dmpApi.createAutoMesureDMP(state.patientId, mesureData);
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
                const documents = await dmpApi.getDocumentsDMP(state.patientId, type);
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
                const newDocument = await dmpApi.uploadDocumentDMP(state.patientId, documentData);
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

        // Effacer les erreurs
        clearError: () => {
            dispatch({ type: 'CLEAR_ERROR' });
        }
    };

    return (
        <DMPContext.Provider value={{ state, actions }}>
            {children}
        </DMPContext.Provider>
    );
};

export const useDMP = () => {
    const context = useContext(DMPContext);
    if (!context) {
        throw new Error('useDMP doit être utilisé dans un DMPProvider');
    }
    return context;
};
```

### Étape 3: Hook Personnalisé DMP

#### Créer `src/hooks/useDMP.js`
```javascript
import { useContext, useEffect, useCallback } from 'react';
import { DMPContext } from '../context/DMPContext';

export const useDMP = () => {
    const { state, actions } = useContext(DMPContext);

    // Charger automatiquement les données DMP au montage
    useEffect(() => {
        if (state.patientId && !state.dmpData) {
            actions.loadDMP();
        }
    }, [state.patientId, state.dmpData]);

    // Fonctions utilitaires
    const refreshData = useCallback(() => {
        actions.loadDMP();
    }, [actions]);

    const getMesuresByType = useCallback((type) => {
        return state.autoMesures.filter(mesure => mesure.type === type);
    }, [state.autoMesures]);

    const getDocumentsByType = useCallback((type) => {
        return state.documents.filter(doc => doc.type === type);
    }, [state.documents]);

    const getRecentActivity = useCallback((limit = 10) => {
        return state.journal.slice(0, limit);
    }, [state.journal]);

    return {
        ...state,
        ...actions,
        refreshData,
        getMesuresByType,
        getDocumentsByType,
        getRecentActivity
    };
};
```

### Étape 4: Composants DMP Modulaires

#### Exemple: `src/components/dmp/DMPDashboard.js`
```javascript
import React, { useEffect } from 'react';
import { useDMP } from '../../hooks/useDMP';
import { FaHeartbeat, FaFileMedical, FaCalendarAlt, FaChartLine } from 'react-icons/fa';

const DMPDashboard = () => {
    const { 
        dmpData, 
        statistiques, 
        loading, 
        error,
        loadStatistiques,
        getRecentActivity 
    } = useDMP();

    useEffect(() => {
        loadStatistiques();
    }, [loadStatistiques]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong>Erreur:</strong> {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête DMP */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                <h1 className="text-2xl font-bold">Mon Dossier Médical Partagé</h1>
                <p className="text-blue-100">
                    Bienvenue dans votre espace de santé personnalisé
                </p>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                        <FaHeartbeat className="text-red-500 text-2xl mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Auto-mesures</p>
                            <p className="text-2xl font-bold">{statistiques.autoMesuresCount || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                        <FaFileMedical className="text-blue-500 text-2xl mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Documents</p>
                            <p className="text-2xl font-bold">{statistiques.documentsCount || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                        <FaCalendarAlt className="text-green-500 text-2xl mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Rendez-vous</p>
                            <p className="text-2xl font-bold">{statistiques.rdvCount || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                        <FaChartLine className="text-purple-500 text-2xl mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Activité</p>
                            <p className="text-2xl font-bold">{statistiques.activiteCount || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activité récente */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Activité Récente</h2>
                <div className="space-y-3">
                    {getRecentActivity(5).map((activite, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                                <p className="font-medium">{activite.titre}</p>
                                <p className="text-sm text-gray-600">{activite.description}</p>
                            </div>
                            <span className="text-xs text-gray-500">
                                {new Date(activite.date).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DMPDashboard;
```

### Étape 5: Intégration dans la Page DMP Existante

#### Modifier `src/pages/DMP.js`
```javascript
// Ajouter les imports
import { DMPProvider } from '../context/DMPContext';
import DMPDashboard from '../components/dmp/DMPDashboard';
import DMPHistorique from '../components/dmp/DMPHistorique';
import DMPJournal from '../components/dmp/DMPJournal';
import DMPDroitsAcces from '../components/dmp/DMPDroitsAcces';
import DMPAutoMesures from '../components/dmp/DMPAutoMesures';
import DMPRendezVous from '../components/dmp/DMPRendezVous';
import DMPDocuments from '../components/dmp/DMPDocuments';
import DMPBibliotheque from '../components/dmp/DMPBibliotheque';
import DMPStatistiques from '../components/dmp/DMPStatistiques';

// Wrapper le composant DMP avec le provider
const DMPPage = () => {
    return (
        <DMPProvider>
            <DMP />
        </DMPProvider>
    );
};

// Modifier la fonction de rendu des onglets
const renderTabContent = () => {
    switch (activeTab) {
        case 'dashboard':
            return <DMPDashboard />;
        case 'historique':
            return <DMPHistorique />;
        case 'journal':
            return <DMPJournal />;
        case 'droits-acces':
            return <DMPDroitsAcces />;
        case 'auto-mesures':
            return <DMPAutoMesures />;
        case 'rendez-vous':
            return <DMPRendezVous />;
        case 'documents':
            return <DMPDocuments />;
        case 'bibliotheque':
            return <DMPBibliotheque />;
        case 'statistiques':
            return <DMPStatistiques />;
        default:
            return <DMPDashboard />;
    }
};
```

## 🚀 Backend Endpoints Requis

### Structure des Routes Backend
```javascript
// Routes DMP
app.get('/api/patients/:id/dmp', getDMP);
app.put('/api/patients/:id/dmp', updateDMP);

app.get('/api/patients/:id/dmp/historique', getHistoriqueMedical);
app.post('/api/patients/:id/dmp/historique', addHistoriqueEntry);

app.get('/api/patients/:id/dmp/journal', getJournalActivite);

app.get('/api/patients/:id/dmp/droits-acces', getDroitsAcces);
app.put('/api/patients/:id/dmp/droits-acces', updateDroitsAcces);

app.get('/api/patients/:id/dmp/auto-mesures', getAutoMesuresDMP);
app.post('/api/patients/:id/dmp/auto-mesures', createAutoMesureDMP);

app.get('/api/patients/:id/dmp/rendez-vous', getRendezVousDMP);
app.post('/api/patients/:id/dmp/rendez-vous', createRendezVousDMP);

app.get('/api/patients/:id/dmp/documents', getDocumentsDMP);
app.post('/api/patients/:id/dmp/documents', uploadDocumentDMP);

app.get('/api/patients/:id/dmp/bibliotheque', getBibliothequeSante);

app.get('/api/patients/:id/dmp/statistiques', getStatistiquesDMP);
```

## 📊 Modèles de Données Backend

### Modèle DMP
```javascript
{
    id: "string",
    patientId: "string",
    dateCreation: "Date",
    dateDerniereModification: "Date",
    statut: "actif|inactif|suspendu",
    version: "string",
    donnees: {
        informationsPersonnelles: {},
        antecedents: [],
        allergies: [],
        traitements: [],
        vaccinations: []
    },
    droitsAcces: [],
    statistiques: {}
}
```

### Modèle Historique Médical
```javascript
{
    id: "string",
    patientId: "string",
    date: "Date",
    type: "consultation|examen|traitement|vaccination",
    titre: "string",
    description: "string",
    medecin: "string",
    etablissement: "string",
    documents: [],
    notes: "string"
}
```

### Modèle Journal d'Activité
```javascript
{
    id: "string",
    patientId: "string",
    date: "Date",
    type: "auto_mesure|document|rdv|consultation",
    titre: "string",
    description: "string",
    donnees: {},
    statut: "termine|en_cours|planifie"
}
```

## 🎯 Avantages de cette Architecture

1. **Modularité** : Composants réutilisables et indépendants
2. **Gestion d'état centralisée** : Contexte DMP pour l'état global
3. **Performance** : Cache et chargement optimisé
4. **Maintenabilité** : Code organisé et documenté
5. **Extensibilité** : Facile d'ajouter de nouvelles fonctionnalités
6. **UX optimale** : Feedback en temps réel et gestion d'erreurs

## 📋 Checklist d'Implémentation

- [ ] Créer `dmpApi.js` avec toutes les fonctions
- [ ] Implémenter `DMPContext.js` pour la gestion d'état
- [ ] Créer `useDMP.js` hook personnalisé
- [ ] Développer les composants DMP modulaires
- [ ] Intégrer dans la page DMP existante
- [ ] Implémenter les endpoints backend
- [ ] Tester toutes les fonctionnalités
- [ ] Optimiser les performances
- [ ] Documenter l'API

Cette orientation vous permettra de rendre votre page DMP entièrement fonctionnelle avec une architecture robuste et évolutive ! 