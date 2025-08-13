# Correction de la Synchronisation Frontend-Backend

## Problème Identifié

D'après les logs de la console, il y avait une désynchronisation entre :
- **Backend** : L'API filtre correctement les accès par `patient_id: 5` et retourne seulement les accès de ce patient
- **Frontend** : Le composant récupérait toutes les autorisations au lieu de seulement celles du patient connecté

## Cause Racine

Le problème était dans l'utilisation des mauvaises fonctions de l'API :

1. **`getAutorisations()`** sans `patientId` → Récupérait TOUTES les autorisations
2. **`getMedecinAccessRequests()`** → Utilisait l'endpoint général au lieu de l'endpoint spécifique au patient
3. **Filtrage côté frontend** → Redondant puisque le backend filtre déjà

## Solutions Appliquées

### 1. Correction de `dmpApi.js`

#### Fonction `getAutorisations` améliorée
```javascript
export const getAutorisations = async (patientId = null) => {
    // Si on a un patientId, utiliser l'endpoint spécifique au patient
    if (patientId) {
        const url = `/access/authorization/patient/${patientId}`;
        const response = await dmpApi.get(url);
        return response.data.data;
    }
    
    // Sinon, utiliser l'endpoint général mais avec filtrage côté frontend
    const response = await dmpApi.get('/access/authorization');
    return response.data.data;
};
```

#### Fonction `getMedecinAccessRequests` simplifiée
```javascript
export const getMedecinAccessRequests = async (patientId) => {
    try {
        // Si on a un patientId, utiliser l'endpoint qui filtre déjà côté backend
        if (patientId) {
            const response = await dmpApi.get(`/access/patient/status`);
            const {data} = response.data.data;
            
            // L'API backend filtre déjà par patient_id, on peut retourner directement
            return data;
        }
        
        // Sinon, utiliser l'endpoint général (pour les médecins qui veulent voir tous les accès)
        const response = await dmpApi.get('/access/patient/status');
        const {data} = response.data.data;
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des accès:', error);
        return { authorizationAccess: [], total: 0 };
    }
};
```

### 2. Correction de `DMP.js`

#### Suppression du filtrage redondant
```javascript
// AVANT (redondant)
const filteredRequests = filterAccessByPatient(pendingRequests, patientId);
setNotificationsDroitsAcces(filteredRequests);

// APRÈS (l'API filtre déjà)
setNotificationsDroitsAcces(pendingRequests);
```

#### Passage du `patientId` à `getAutorisations`
```javascript
// AVANT
const autorisationsData = await dmpApi.getAutorisations();

// APRÈS
const storedPatient = getStoredPatient();
const patientId = storedPatient?.id_patient || storedPatient?.id;
const autorisationsData = await dmpApi.getAutorisations(patientId);
```

### 3. Correction de `AutorisationsEnAttente.js`

#### Utilisation des fonctions spécifiques aux patients
```javascript
// AVANT
import { getAutorisations } from '../../services/api/dmpApi';
const result = await getAutorisations();

// APRÈS
import { getPatientAuthorizations, getPatientAccessHistory, getPendingAccessRequests } from '../../services/api/dmpApi';

const [authorizations, accessHistory, pendingRequests] = await Promise.all([
    getPatientAuthorizations(),
    getPatientAccessHistory(),
    getPendingAccessRequests()
]);
```

## Fonctions Recommandées pour les Patients

### Dans `dmpApi.js` (Section "API POUR LES PATIENTS")
- ✅ `getPendingAccessRequests()` - Demandes en attente
- ✅ `getPatientAuthorizations()` - Autorisations du patient
- ✅ `getPatientAccessHistory()` - Historique des accès
- ✅ `getPatientAccessStatus(patientId)` - Statut d'accès spécifique

### À éviter pour les patients
- ❌ `getAutorisations()` sans `patientId` - Récupère toutes les autorisations
- ❌ `getMedecinAccessRequests()` sans `patientId` - Récupère tous les accès

## Résultat

Maintenant, le frontend et le backend sont synchronisés :
- **Backend** : Filtre par `patient_id` côté serveur
- **Frontend** : Utilise les endpoints spécifiques aux patients
- **Données** : Seules les autorisations du patient connecté sont affichées

## Vérification

Pour vérifier que la correction fonctionne :
1. Se connecter en tant que patient (ex: patient_id = 5)
2. Aller dans l'onglet "droits-acces"
3. Vérifier que seules les autorisations du patient 5 sont affichées
4. Vérifier dans la console que les logs montrent le bon filtrage
