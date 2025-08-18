# 🧪 Test de l'Erreur 400 - Création de Session 2FA

## 📋 **Problème Identifié**

L'erreur `"Request failed with status code 400"` avec le message `"Type d'utilisateur et identifiant requis"` indique que le backend rejette les données envoyées.

## 🔍 **Analyse des Données**

### **1. Données Extraites du Frontend**
```javascript
// Dans Setup2FA.js
const userDataWithType = {
    ...userData,           // { id_patient: 5, nom: "MOLOWA", ... }
    id: userId,            // 5 (extrait de id_patient)
    type: userType         // "patient"
};

// userData original reçu :
{
    "id_patient": 5,
    "nom": "MOLOWA",
    "prenom": "ESSONGA", 
    "numero_assure": "TEMP000005",
    "two_factor_enabled": true,
    "two_factor_secret": "OYVEYKB7CM7RWVIX"
}
```

### **2. Données Envoyées au Backend**
```javascript
// Dans twoFactorApi.js
const requestData = { 
    userId: userData.id,      // 5
    userType: userData.type   // "patient"
};

// Requête POST vers :
POST /api/auth/create-2fa-session
{
    "userId": 5,
    "userType": "patient"
}
```

## 🛠️ **Diagnostic du Problème**

### **Scénario 1 : Backend Non Implémenté**
- ❌ L'endpoint `/api/auth/create-2fa-session` n'existe pas
- ❌ Erreur 404 attendue, mais on reçoit 400
- ✅ Le backend existe mais rejette les données

### **Scénario 2 : Validation Backend Incorrecte**
- ❌ Le backend attend une structure différente
- ❌ Validation qui échoue côté serveur
- ✅ Erreur 400 avec message personnalisé

### **Scénario 3 : Structure des Données Incorrecte**
- ❌ Le backend attend `userId` mais reçoit autre chose
- ❌ Le backend attend `userType` mais reçoit autre chose
- ✅ Validation qui échoue sur la structure

## 🧪 **Tests à Effectuer**

### **Test 1 : Vérification des Logs Frontend**
```javascript
// Logs attendus dans la console :
🔐 Création session temporaire 2FA pour: { id_patient: 5, nom: "MOLOWA", ... }
🔍 Structure des données utilisateur: { hasId: false, hasPatientId: false, hasIdPatient: true, ... }
🔍 Tentative d'extraction de l'ID: { directId: undefined, patientId: undefined, idPatient: 5, ... }
✅ ID utilisateur final extrait: 5
✅ Type utilisateur déterminé: patient
📤 Données envoyées à create2FASession: { id: 5, type: "patient", ... }
📤 Données envoyées au backend: { userId: 5, userType: "patient" }
🔗 Endpoint appelé: POST /auth/create-2fa-session
❌ Erreur création session temporaire 2FA: Request failed with status code 400
```

### **Test 2 : Vérification de l'Interface Debug**
- ✅ Section bleue de debug visible
- ✅ `ID Patient: 5` affiché
- ✅ `Type: patient` déterminé
- ✅ Pas d'erreur d'extraction de l'ID

### **Test 3 : Test avec Postman/Insomnia**
```bash
POST http://localhost:3000/api/auth/create-2fa-session
Content-Type: application/json

{
    "userId": 5,
    "userType": "patient"
}
```

## 🚨 **Solutions Possibles**

### **Solution 1 : Vérifier la Structure Backend**
Le backend pourrait attendre :
```javascript
// Structure alternative possible
{
    "id": 5,              // au lieu de "userId"
    "type": "patient"     // au lieu de "userType"
}

// Ou
{
    "patientId": 5,       // au lieu de "userId"
    "role": "patient"     // au lieu de "userType"
}
```

### **Solution 2 : Vérifier l'Endpoint Backend**
- ✅ L'endpoint existe-t-il ?
- ✅ La méthode POST est-elle acceptée ?
- ✅ Les headers sont-ils corrects ?
- ✅ L'authentification est-elle requise ?

### **Solution 3 : Vérifier la Validation Backend**
- ✅ Le backend valide-t-il `userId` ?
- ✅ Le backend valide-t-il `userType` ?
- ✅ Les types de données sont-ils corrects ?
- ✅ Y a-t-il des contraintes supplémentaires ?

## 📊 **Logs de Débogage Attendus**

### **Succès (Backend Implémenté)**
```javascript
📤 Données envoyées au backend: { userId: 5, userType: "patient" }
🔗 Endpoint appelé: POST /auth/create-2fa-session
✅ Session temporaire 2FA créée: { tempTokenId: "abc123", ... }
```

### **Échec (Problème Backend)**
```javascript
📤 Données envoyées au backend: { userId: 5, userType: "patient" }
🔗 Endpoint appelé: POST /auth/create-2fa-session
❌ Erreur création session temporaire 2FA: Request failed with status code 400
```

## 🚀 **Prochaines Étapes**

### **1. Vérifier les Logs Frontend**
- ✅ Confirmer que l'ID `5` est extrait
- ✅ Confirmer que le type `"patient"` est déterminé
- ✅ Confirmer que les données sont envoyées au backend

### **2. Vérifier l'Endpoint Backend**
- ✅ L'endpoint `/api/auth/create-2fa-session` existe-t-il ?
- ✅ La méthode POST est-elle implémentée ?
- ✅ La validation des données fonctionne-t-elle ?

### **3. Tester avec Postman/Insomnia**
- ✅ Envoyer la même requête manuellement
- ✅ Vérifier la réponse du backend
- ✅ Identifier la cause exacte de l'erreur 400

## 📚 **Références**

- [Test Structure ID Patient](./TEST_STRUCTURE_ID_PATIENT.md)
- [Débogage Structure Données](./DEBUG_USERDATA_STRUCTURE.md)
- [Correction Frontend 2FA](./CORRECTION_2FA_FRONTEND.md)
