# Gestion des Sessions DMP - Documentation

## Vue d'ensemble

Le système DMP a été modifié pour utiliser automatiquement l'ID du patient connecté dans toutes les requêtes. Cela garantit que chaque patient ne voit que ses propres données médicales.

## Fonctionnement

### 1. Récupération automatique de l'ID patient

Toutes les fonctions API DMP récupèrent automatiquement l'ID du patient connecté depuis le localStorage :

```javascript
const getConnectedPatientId = () => {
    const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
    return storedPatient.id;
};
```

### 2. Fonctions API modifiées

Toutes les fonctions API DMP ont été modifiées pour :
- Récupérer automatiquement l'ID du patient connecté
- Utiliser cet ID dans les requêtes
- Retourner des données spécifiques au patient

#### Exemples de fonctions modifiées :

```javascript
// Avant
export const getDMP = async (patientId) => { ... }

// Après
export const getDMP = async (patientId = null) => {
    if (!patientId) {
        patientId = getConnectedPatientId();
    }
    // Utilise l'ID du patient connecté
}
```

### 3. Données mock personnalisées

Les données mock sont maintenant générées en fonction du patient connecté :

```javascript
const getMockDataForPatient = (patientId) => {
    const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
    
    return {
        tableauDeBord: {
            patient: {
                id: patientId || storedPatient.id,
                nom: storedPatient.nom || "Dupont",
                prenom: storedPatient.prenom || "Jean",
                // ... autres données du patient connecté
            }
        }
    };
};
```

## Fonctions API mises à jour

### Fonctions qui utilisent automatiquement l'ID patient :

1. **getTableauDeBord()** - Récupère le tableau de bord du patient connecté
2. **getStatistiques()** - Récupère les statistiques du patient connecté
3. **getDMP(patientId = null)** - Récupère le DMP complet du patient connecté
4. **getHistoriqueMedical(patientId = null)** - Récupère l'historique du patient connecté
5. **getDroitsAcces(patientId = null)** - Récupère les droits d'accès du patient connecté
6. **getAutoMesuresDMP(patientId = null, type = null)** - Récupère les auto-mesures du patient connecté
7. **getDocumentsDMP(patientId = null, type = null)** - Récupère les documents du patient connecté
8. **createAutoMesureDMP(patientId = null, mesureData)** - Crée une auto-mesure pour le patient connecté
9. **uploadDocumentDMP(patientId = null, documentData)** - Upload un document pour le patient connecté

## Contexte DMP mis à jour

Le contexte DMP utilise maintenant automatiquement l'ID du patient connecté :

```javascript
// Dans DMPContext.js
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
```

## Sécurité

### Vérifications de sécurité :

1. **Vérification de connexion** : Toutes les fonctions vérifient que le patient est connecté
2. **ID patient requis** : Les fonctions retournent une erreur si aucun patient n'est connecté
3. **Données isolées** : Chaque patient ne voit que ses propres données

### Gestion des erreurs :

```javascript
if (!patientId) {
    throw new Error('Patient non connecté');
}
```

## Utilisation

### Dans les composants :

```javascript
// Les appels API utilisent automatiquement l'ID du patient connecté
const tableauData = await dmpApi.getTableauDeBord();
const historiqueData = await dmpApi.getHistoriqueMedical();
const documentsData = await dmpApi.getDocumentsDMP();
```

### Dans le contexte :

```javascript
// Le contexte utilise automatiquement l'ID du patient connecté
const { loadDMP, loadHistorique, loadDocuments } = useDMP();

useEffect(() => {
    loadDMP(); // Utilise automatiquement l'ID du patient connecté
}, []);
```

## Migration vers le backend

Quand le backend sera disponible, il suffira de :

1. Remplacer les données mock par de vraies requêtes HTTP
2. Utiliser l'ID du patient connecté dans les URLs des requêtes
3. Conserver la même logique de récupération automatique de l'ID

### Exemple de migration :

```javascript
// Actuel (mock)
export const getDMP = async (patientId = null) => {
    const patientId = getConnectedPatientId();
    const mockData = getMockDataForPatient(patientId);
    return { data: mockData };
};

// Futur (backend)
export const getDMP = async (patientId = null) => {
    const patientId = getConnectedPatientId();
    const response = await dmpApi.get(`/patients/${patientId}/dmp`);
    return response.data;
};
```

## Avantages

1. **Sécurité** : Chaque patient ne voit que ses données
2. **Simplicité** : Pas besoin de passer l'ID patient manuellement
3. **Cohérence** : Toutes les requêtes utilisent le même patient
4. **Maintenabilité** : Code plus propre et centralisé
5. **Évolutivité** : Facile à migrer vers le backend

## Tests

Pour tester le système :

1. Connectez-vous en tant que patient
2. Naviguez vers la page DMP
3. Vérifiez que les données affichées correspondent au patient connecté
4. Testez les différentes fonctionnalités (auto-mesures, documents, etc.)
5. Vérifiez que les nouvelles données sont associées au bon patient 