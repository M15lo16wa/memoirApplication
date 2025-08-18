# 🧪 Test de la Structure des Données Utilisateur

## 📋 **Objectif du Test**

Vérifier que les données utilisateur sont correctement transmises au composant `Setup2FA` et que l'extraction de l'ID fonctionne.

## 🔍 **Étapes de Test**

### **1. Connexion et Observation des Logs**

1. **Ouvrir la console du navigateur** (F12 → Console)
2. **Se connecter** avec un utilisateur qui a la 2FA activée
3. **Observer les logs** suivants :

```javascript
🔍 Setup2FA - userData reçu: { ... }
🔍 Structure complète des données utilisateur: { ... }
🔍 Structure des données utilisateur: { hasId: false, hasPatientId: true, ... }
🔍 Tentative d'extraction de l'ID: { directId: undefined, patientId: 5, ... }
```

### **2. Vérification de l'Interface de Debug**

En mode développement, une section bleue doit apparaître avec :
- ✅ **Type** des données
- ✅ **Propriétés** disponibles
- ✅ **Valeurs** des différents IDs
- ✅ **Données complètes** en JSON

### **3. Structure Attendue des Données**

#### **Connexion Patient**
```javascript
{
  "numero_assure": "TEMP000005",
  "nom": "MOLOWA",
  "two_factor_secret": "OYVEYKB7CM7RWVIX",
  // ❌ "id" manquant
  // ✅ "numero_assure" présent → ID temporaire créé
}
```

#### **Connexion Médecin**
```javascript
{
  "numero_adeli": "123456789",
  "nom": "Dr. Smith",
  "two_factor_secret": "ABC123",
  // ❌ "id" manquant
  // ✅ "numero_adeli" présent → ID temporaire créé
}
```

#### **Connexion Admin**
```javascript
{
  "email": "admin@sante.sn",
  "nom": "Admin",
  "two_factor_secret": "XYZ789",
  // ❌ "id" manquant
  // ✅ "email" présent → ID temporaire créé
}
```

## 🛠️ **Logique d'Extraction de l'ID**

### **1. Recherche Directe**
```javascript
let userId = userData.id || userData.patient_id || userData.user_id || userData.medecin_id;
```

### **2. Recherche dans les Propriétés Imbriquées**
```javascript
if (userData.data && userData.data.id) userId = userData.data.id;
else if (userData.patient && userData.patient.id) userId = userData.patient.id;
else if (userData.medecin && userData.medecin.id) userId = userData.medecin.id;
else if (userData.user && userData.user.id) userId = userData.user.id;
```

### **3. Fallback avec Identifiants Alternatifs**
```javascript
if (userData.numero_assure) userId = `patient_${userData.numero_assure}`;
else if (userData.numero_adeli) userId = `medecin_${userData.numero_adeli}`;
else if (userData.email) userId = `user_${userData.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
```

## 🧪 **Scénarios de Test**

### **Scénario 1 : Patient avec Numéro d'Assuré**
- **Données reçues** : `{ numero_assure: "TEMP000005", ... }`
- **ID extrait** : `patient_TEMP000005`
- **Type** : `patient`
- **Résultat attendu** : ✅ Succès

### **Scénario 2 : Médecin avec Numéro ADELI**
- **Données reçues** : `{ numero_adeli: "123456789", ... }`
- **ID extrait** : `medecin_123456789`
- **Type** : `medecin`
- **Résultat attendu** : ✅ Succès

### **Scénario 3 : Admin avec Email**
- **Données reçues** : `{ email: "admin@sante.sn", ... }`
- **ID extrait** : `user_admin_sante_sn`
- **Type** : `admin`
- **Résultat attendu** : ✅ Succès

### **Scénario 4 : Données Incomplètes**
- **Données reçues** : `{ nom: "Test", ... }`
- **ID extrait** : ❌ Impossible
- **Résultat attendu** : ❌ Erreur avec logs détaillés

## 📊 **Logs de Débogage Attendus**

### **Succès**
```javascript
🔐 Création session temporaire 2FA pour: { numero_assure: "TEMP000005", ... }
🔍 Tentative d'extraction de l'ID: { directId: undefined, patientId: undefined, ... }
⚠️ ID non trouvé directement, recherche dans les propriétés imbriquées...
⚠️ Aucun ID numérique trouvé, tentative avec des identifiants alternatifs...
✅ ID temporaire créé avec numero_assure: patient_TEMP000005
✅ ID utilisateur final extrait: patient_TEMP000005
✅ Type utilisateur déterminé: patient
📤 Données envoyées à create2FASession: { id: "patient_TEMP000005", type: "patient", ... }
```

### **Échec**
```javascript
❌ Impossible de déterminer l'identifiant utilisateur
🔍 Données disponibles: { userData: {...}, keys: [...], values: [...] }
```

## 🚨 **Points d'Attention**

### **1. Logs Obligatoires**
- ✅ Structure complète des données
- ✅ Tentative d'extraction de l'ID
- ✅ Recherche dans les propriétés imbriquées
- ✅ Fallback avec identifiants alternatifs
- ✅ ID final extrait
- ✅ Type utilisateur déterminé

### **2. Gestion des Erreurs**
- ✅ Message d'erreur clair
- ✅ Logs détaillés pour le débogage
- ✅ Affichage des données disponibles

### **3. Fallbacks Robustes**
- ✅ ID temporaire avec préfixe
- ✅ Nettoyage des caractères spéciaux
- ✅ Type utilisateur déduit automatiquement

## 📚 **Références**

- [Débogage Structure Données](./DEBUG_USERDATA_STRUCTURE.md)
- [Correction Frontend 2FA](./CORRECTION_2FA_FRONTEND.md)
- [Flux 2FA Corrigé](./FLUX_2FA_CORRIGE.md)
