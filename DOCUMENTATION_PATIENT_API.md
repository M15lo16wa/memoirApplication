# Documentation API Patient - `src/services/api/patientApi.js`

## Vue d'ensemble

Ce fichier contient toutes les fonctions d'API pour la gestion des patients dans l'application Santé Sénégal. Il utilise Axios pour les requêtes HTTP et implémente un système d'authentification basé sur les tokens JWT.

## Architecture et Configuration

### Configuration Axios
```javascript
const API_URL = "http://localhost:3000/api";
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});
```

### Système d'Authentification
Le fichier implémente un intercepteur de requête qui gère automatiquement l'authentification :

- **Priorité JWT** : Le token JWT (`jwt`) a la priorité sur le token standard (`token`)
- **Headers automatiques** : Ajoute automatiquement le header `Authorization: Bearer <token>`
- **Logging** : Affiche le token utilisé pour le débogage

## Fonctions API Disponibles

### 1. `getPatients()`
**Endpoint** : `GET /patient`  
**Description** : Récupère la liste de tous les patients  
**Retour** : `Promise<Array>` - Liste des patients  
**Utilisation** :
```javascript
import { getPatients } from '../services/api/patientApi';

const patients = await getPatients();
```

### 2. `getPatient(id)`
**Endpoint** : `GET /patient/:id`  
**Description** : Récupère les détails d'un patient spécifique  
**Paramètres** : `id` (string/number) - ID du patient  
**Retour** : `Promise<Object>` - Détails du patient  
**Utilisation** :
```javascript
const patient = await getPatient("123");
```

### 3. `createPatient(patient)`
**Endpoint** : `POST /patient`  
**Description** : Crée un nouveau patient  
**Paramètres** : `patient` (Object) - Données du patient  
**Retour** : `Promise<Object>` - Patient créé  
**Utilisation** :
```javascript
const newPatient = await createPatient({
    nom: "Dupont",
    prenom: "Jean",
    email: "jean@example.com"
});
```

### 4. `updatePatient(id, patient)`
**Endpoint** : `PUT /patient/:id`  
**Description** : Met à jour les informations d'un patient  
**Paramètres** : 
- `id` (string/number) - ID du patient
- `patient` (Object) - Nouvelles données du patient  
**Retour** : `Promise<Object>` - Patient mis à jour  
**Utilisation** :
```javascript
const updatedPatient = await updatePatient("123", {
    telephone: "0123456789"
});
```

### 5. `deletePatient(id)`
**Endpoint** : `DELETE /patient/:id`  
**Description** : Supprime un patient  
**Paramètres** : `id` (string/number) - ID du patient  
**Retour** : `Promise<Object>` - Confirmation de suppression  
**Utilisation** :
```javascript
await deletePatient("123");
```

### 6. `loginPatient(patient)`
**Endpoint** : `POST /patient/auth/login`  
**Description** : Authentifie un patient  
**Paramètres** : `patient` (Object) - Credentials de connexion  
**Retour** : `Promise<Object>` - Token et informations du patient  
**Utilisation** :
```javascript
const authResult = await loginPatient({
    email: "patient@example.com",
    password: "password123"
});
```

## Gestion des Erreurs

Toutes les fonctions suivent le même pattern de gestion d'erreur :
```javascript
try {
    const response = await api.get(`/endpoint`);
    return response.data;
} catch (error) {
    throw error;
}
```

**Avantages** :
- Propagation des erreurs HTTP
- Possibilité de gestion centralisée des erreurs
- Logs d'erreur automatiques

## Recommandations pour l'Organisation

### 1. Structure des Endpoints
**Actuelle** : `/patient/*`  
**Recommandation** : Organiser par fonctionnalité
```
/patients          # Liste des patients
/patients/:id      # Détails d'un patient
/patients/:id/dmp  # DMP d'un patient
/patients/:id/prescriptions  # Prescriptions
/patients/:id/auto-mesures   # Auto-mesures
```

### 2. Ajout de Fonctions Manquantes
```javascript
// Gestion du DMP
export const getPatientDMP = async (patientId) => {
    try {
        const response = await api.get(`/patients/${patientId}/dmp`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Gestion des prescriptions
export const getPatientPrescriptions = async (patientId) => {
    try {
        const response = await api.get(`/patients/${patientId}/prescriptions`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Gestion des auto-mesures
export const getPatientAutoMesures = async (patientId) => {
    try {
        const response = await api.get(`/patients/${patientId}/auto-mesures`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createAutoMesure = async (patientId, mesureData) => {
    try {
        const response = await api.post(`/patients/${patientId}/auto-mesures`, mesureData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Gestion des documents
export const getPatientDocuments = async (patientId) => {
    try {
        const response = await api.get(`/patients/${patientId}/documents`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const uploadDocument = async (patientId, documentData) => {
    try {
        const formData = new FormData();
        formData.append('file', documentData.file);
        formData.append('type', documentData.type);
        formData.append('description', documentData.description);
        
        const response = await api.post(`/patients/${patientId}/documents`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
```

### 3. Amélioration de la Gestion des Erreurs
```javascript
// Fonction utilitaire pour la gestion d'erreur
const handleApiError = (error, context) => {
    console.error(`[patientApi] Erreur dans ${context}:`, error);
    
    if (error.response) {
        // Erreur de réponse du serveur
        const { status, data } = error.response;
        switch (status) {
            case 401:
                throw new Error('Non autorisé - Veuillez vous reconnecter');
            case 403:
                throw new Error('Accès interdit');
            case 404:
                throw new Error('Patient non trouvé');
            case 422:
                throw new Error(data.message || 'Données invalides');
            default:
                throw new Error(data.message || 'Erreur serveur');
        }
    } else if (error.request) {
        // Erreur de réseau
        throw new Error('Erreur de connexion au serveur');
    } else {
        // Autre erreur
        throw new Error('Erreur inattendue');
    }
};

// Utilisation dans les fonctions
export const getPatient = async (id) => {
    try {
        const response = await api.get(`/patient/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error, `getPatient(${id})`);
    }
};
```

### 4. Validation des Données
```javascript
// Validation des données patient
const validatePatientData = (patient) => {
    const errors = [];
    
    if (!patient.nom || patient.nom.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    if (!patient.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
        errors.push('Email invalide');
    }
    
    if (patient.telephone && !/^[0-9+\-\s()]{8,}$/.test(patient.telephone)) {
        errors.push('Numéro de téléphone invalide');
    }
    
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
    
    return patient;
};

// Utilisation dans createPatient et updatePatient
export const createPatient = async (patient) => {
    try {
        const validatedData = validatePatientData(patient);
        const response = await api.post(`/patient`, validatedData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'createPatient');
    }
};
```

### 5. Cache et Performance
```javascript
// Cache simple pour les patients
const patientCache = new Map();

export const getPatient = async (id) => {
    try {
        // Vérifier le cache
        if (patientCache.has(id)) {
            const cached = patientCache.get(id);
            const now = Date.now();
            if (now - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
                return cached.data;
            }
        }
        
        const response = await api.get(`/patient/${id}`);
        
        // Mettre en cache
        patientCache.set(id, {
            data: response.data,
            timestamp: Date.now()
        });
        
        return response.data;
    } catch (error) {
        handleApiError(error, `getPatient(${id})`);
    }
};
```

## Structure Recommandée du Backend

### Endpoints RESTful
```
GET    /api/patients                    # Liste des patients
POST   /api/patients                    # Créer un patient
GET    /api/patients/:id                # Détails d'un patient
PUT    /api/patients/:id                # Modifier un patient
DELETE /api/patients/:id                # Supprimer un patient

# Authentification
POST   /api/patients/auth/login         # Connexion patient
POST   /api/patients/auth/logout        # Déconnexion patient
POST   /api/patients/auth/refresh       # Rafraîchir token

# DMP (Dossier Médical Partagé)
GET    /api/patients/:id/dmp            # Récupérer le DMP
POST   /api/patients/:id/dmp            # Créer/Modifier le DMP

# Prescriptions
GET    /api/patients/:id/prescriptions  # Liste des prescriptions
POST   /api/patients/:id/prescriptions  # Créer une prescription
PUT    /api/patients/:id/prescriptions/:prescriptionId
DELETE /api/patients/:id/prescriptions/:prescriptionId

# Auto-mesures
GET    /api/patients/:id/auto-mesures   # Liste des auto-mesures
POST   /api/patients/:id/auto-mesures   # Créer une auto-mesure
PUT    /api/patients/:id/auto-mesures/:mesureId
DELETE /api/patients/:id/auto-mesures/:mesureId

# Documents
GET    /api/patients/:id/documents      # Liste des documents
POST   /api/patients/:id/documents      # Uploader un document
DELETE /api/patients/:id/documents/:documentId
```

### Modèles de Données Recommandés

#### Patient
```javascript
{
    id: "string",
    nom: "string",
    prenom: "string",
    email: "string",
    telephone: "string",
    dateNaissance: "Date",
    adresse: "string",
    groupeSanguin: "string",
    allergies: ["string"],
    antecedents: ["string"],
    createdAt: "Date",
    updatedAt: "Date"
}
```

#### Auto-mesure
```javascript
{
    id: "string",
    patientId: "string",
    type: "poids|taille|tension_arterielle|glycemie|temperature|saturation",
    valeur: "number",
    valeur_secondaire: "number", // Pour tension artérielle
    unite: "string",
    unite_secondaire: "string",
    date_mesure: "Date",
    heure_mesure: "string",
    notes: "string",
    createdAt: "Date"
}
```

#### Document
```javascript
{
    id: "string",
    patientId: "string",
    nom: "string",
    type: "ordonnance|resultat|certificat|autre",
    description: "string",
    url: "string",
    taille: "number",
    format: "string",
    createdAt: "Date"
}
```

## Tests et Débogage

### Logs Recommandés
```javascript
// Ajouter des logs détaillés
api.interceptors.request.use(
    (config) => {
        console.log(`[patientApi] ${config.method.toUpperCase()} ${config.url}`);
        console.log('[patientApi] Headers:', config.headers);
        return config;
    },
    (error) => {
        console.error('[patientApi] Erreur de requête:', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log(`[patientApi] Réponse ${response.status} pour ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('[patientApi] Erreur de réponse:', error.response?.data);
        return Promise.reject(error);
    }
);
```

Cette documentation vous fournit une base solide pour organiser et améliorer votre API patient. Les recommandations peuvent être implémentées progressivement selon vos besoins. 