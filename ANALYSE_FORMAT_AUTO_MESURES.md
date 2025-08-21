# Analyse du Format de Récupération des Auto-mesures - Frontend

## 🔍 Structure de Récupération des Données

### **1. Flux de Données API → Frontend**

```
Backend API → dmpApi.js → DMPContext → Composants UI
```

### **2. Fonction API `getAutoMesuresDMP`**

**Localisation :** `src/services/api/dmpApi.js` (lignes 590-625)

**Structure de la réponse attendue :**
```javascript
// ✅ Format attendu du backend
{
  data: {
    auto_mesures: [
      {
        id: 1,
        type_mesure: 'poids',
        valeur: 75,
        unite: 'kg',
        date_mesure: '2025-01-25',
        commentaire: 'Matin avant petit déjeuner'
      }
    ]
  }
}
```

**Logique de traitement :**
```javascript
// Extraction des données avec fallbacks multiples
let autoMesures = response.data.data || response.data || [];

// Filtrage par type si spécifié
if (type) {
    autoMesures = autoMesures.filter(mesure => 
        mesure.type_mesure === type || 
        mesure.type === type
    );
}

// Retour dans un format standardisé
const result = { data: autoMesures };
return result;
```

## 🔧 Traitement dans le Contexte DMP

### **3. Fonction `loadAutoMesures` dans DMPContext**

**Localisation :** `src/context/DMPContext.js` (lignes 224-250)

**Logique de traitement avec fallbacks multiples :**
```javascript
// S'assurer que nous avons un tableau d'auto-mesures
let autoMesures = [];

// Fallback 1 : response.data.auto_mesures
if (response && response.data && response.data.auto_mesures && Array.isArray(response.data.auto_mesures)) {
    autoMesures = response.data.auto_mesures;
} 
// Fallback 2 : response.data (tableau direct)
else if (response && response.data && Array.isArray(response.data)) {
    autoMesures = response.data;
} 
// Fallback 3 : response (tableau direct)
else if (response && Array.isArray(response)) {
    autoMesures = response;
} 
// Fallback 4 : response.data.data (structure imbriquée)
else if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
    autoMesures = response.data.data;
}
```

## 📊 Structure des Données dans l'État

### **4. État Initial et Reducer**

**État initial :**
```javascript
const initialState = {
    // ... autres propriétés
    autoMesures: [],  // Tableau vide par défaut
    // ... autres propriétés
};
```

**Actions du reducer :**
```javascript
case 'SET_AUTO_MESURES':
    return { ...state, autoMesures: action.payload || [], loading: false };

case 'ADD_AUTO_MESURE':
    const currentAutoMesures = Array.isArray(state.autoMesures) ? state.autoMesures : [];
    return { 
        ...state, 
        autoMesures: [action.payload, ...currentAutoMesures],
        loading: false 
    };
```

## 🎯 Format des Données Attendues

### **5. Structure d'une Auto-mesure**

```javascript
{
    id: number,                    // Identifiant unique
    type_mesure: string,           // Type de mesure (poids, glycemie, etc.)
    valeur: number | string,       // Valeur de la mesure
    unite: string,                 // Unité de mesure (kg, mg/dL, mmHg)
    date_mesure: string,           // Date de la mesure (format ISO)
    commentaire: string            // Commentaire optionnel
}
```

### **6. Types de Mesures Supportés**

```javascript
const supportedTypes = [
    'poids',                    // Poids en kg
    'taille',                   // Taille en cm
    'tension_arterielle',       // Tension en mmHg
    'glycemie',                 // Glycémie en mg/dL
    'temperature'               // Température en °C
];
```

## ⚠️ Problèmes Identifiés

### **7. Incohérences dans le Traitement**

**Problème 1 : Fallbacks trop nombreux**
- Le code gère 4 formats différents de réponse
- Cela peut masquer des problèmes de structure backend

**Problème 2 : URLs incorrectes**
- Certaines fonctions utilisent encore `/patient/` au lieu de `/patients/dmp/`
- Cela cause des erreurs 404

**Problème 3 : Données mockées dans le composant**
- `AutoMesuresWidget` utilise des données statiques au lieu de l'API
- Cela empêche le test réel de l'intégration

### **8. Structure de Réponse Backend Incohérente**

**Formats supportés par le frontend :**
```javascript
// Format 1 (préféré)
{ data: { auto_mesures: [...] } }

// Format 2
{ data: [...] }

// Format 3
[...]

// Format 4
{ data: { data: [...] } }
```

## ✅ Recommandations d'Amélioration

### **9. Standardisation du Format Backend**

**Format recommandé :**
```javascript
{
  success: true,
  data: {
    auto_mesures: [
      {
        id: 1,
        type_mesure: 'poids',
        valeur: 75,
        unite: 'kg',
        date_mesure: '2025-01-25',
        commentaire: 'Matin avant petit déjeuner'
      }
    ]
  },
  message: "Auto-mesures récupérées avec succès"
}
```

### **10. Simplification du Traitement Frontend**

```javascript
// Simplifier la logique de traitement
const response = await dmpApi.getAutoMesuresDMP(state.patientId, type);
const autoMesures = response?.data?.auto_mesures || [];

// Validation du format
if (!Array.isArray(autoMesures)) {
    console.warn('Format de réponse inattendu:', response);
    dispatch({ type: 'SET_AUTO_MESURES', payload: [] });
    return;
}

dispatch({ type: 'SET_AUTO_MESURES', payload: autoMesures });
```

### **11. Suppression des Données Mockées**

```javascript
// Remplacer les données mockées par un appel API réel
const loadAutoMesures = async () => {
    try {
        setLoading(true);
        const response = await dmpApi.getAutoMesuresDMP();
        setAutoMesures(response.data || []);
    } catch (error) {
        console.error('Erreur lors du chargement des auto-mesures:', error);
        setAutoMesures([]);
    } finally {
        setLoading(false);
    }
};
```

## 🚀 Tests Recommandés

### **12. Test de l'Intégration API**

1. **Vérifier la réponse backend** sur `/api/patients/5/dmp/auto-mesures`
2. **Tester le format de données** retourné par l'API
3. **Vérifier le traitement frontend** dans `loadAutoMesures`
4. **Confirmer l'affichage** dans `AutoMesuresWidget`

### **13. Test des Fallbacks**

1. **Tester avec format 1** : `{ data: { auto_mesures: [...] } }`
2. **Tester avec format 2** : `{ data: [...] }`
3. **Tester avec format 3** : `[...]`
4. **Tester avec format 4** : `{ data: { data: [...] } }`

## ✅ Résumé

**Le frontend est configuré pour gérer 4 formats de réponse différents, mais :**

- **Les URLs sont partiellement corrigées** (2/7)
- **Le composant utilise des données mockées** au lieu de l'API
- **La logique de fallback est trop complexe** et peut masquer des problèmes
- **Le format de réponse backend n'est pas standardisé**

**Recommandation : Standardiser le format backend et simplifier le traitement frontend.**
