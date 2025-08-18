# 🔍 Diagnostic de l'Erreur 400 - Création Session 2FA

## 📋 **Erreur Actuelle**

```
❌ Erreur création session temporaire 2FA: 
AxiosError {
    message: 'Request failed with status code 400', 
    name: 'AxiosError', 
    code: 'ERR_BAD_REQUEST'
}
```

## 🔍 **Analyse de l'Erreur**

### **1. Statut de l'Erreur**
- ✅ **Endpoint existe** → Erreur 400 (pas 404)
- ✅ **Méthode POST acceptée** → La requête arrive au backend
- ❌ **Validation échoue** → Le backend rejette les données

### **2. Données Envoyées (Frontend)**
```javascript
// Dans twoFactorApi.js:78
const requestData = { 
    userId: userData.id,      // 5 (extrait de id_patient)
    userType: userData.type   // "patient"
};

console.log('📤 Données envoyées au backend:', requestData);
// Résultat attendu : { userId: 5, userType: "patient" }
```

### **3. Requête HTTP Envoyée**
```bash
POST /api/auth/create-2fa-session
Content-Type: application/json
Authorization: Bearer [token]

{
    "userId": 5,
    "userType": "patient"
}
```

## 🚨 **Causes Possibles de l'Erreur 400**

### **Cause 1 : Structure des Données Incorrecte**
```javascript
// Le backend pourrait attendre :
{
    "id": 5,              // au lieu de "userId"
    "type": "patient"     // au lieu de "userType"
}

// Ou
{
    "patientId": 5,       // au lieu de "userId"
    "role": "patient"     // au lieu de "userType"
}

// Ou
{
    "user_id": 5,         // au lieu de "userId"
    "user_type": "patient" // au lieu de "userType"
}
```

### **Cause 2 : Types de Données Incorrects**
```javascript
// Le backend pourrait attendre :
{
    "userId": "5",        // string au lieu de number
    "userType": "PATIENT" // majuscules au lieu de minuscules
}

// Ou
{
    "userId": 5.0,        // float au lieu de integer
    "userType": 1         // number au lieu de string
}
```

### **Cause 3 : Validation Backend Stricte**
```javascript
// Le backend pourrait valider :
- userId doit être > 0
- userType doit être dans ["patient", "medecin", "admin"]
- userId doit exister en base de données
- userType doit correspondre au type réel de l'utilisateur
```

### **Cause 4 : Authentification Requise**
```javascript
// Le backend pourrait exiger :
- Un token JWT valide
- Une session active
- Des permissions spécifiques
```

## 🧪 **Tests de Diagnostic**

### **Test 1 : Vérification des Logs Frontend**
```javascript
// Dans la console, vérifier :
🔐 create2FASession - Création session temporaire 2FA... { userData }
✅ Validation des données réussie: { userId: 5, userType: "patient" }
📤 Données envoyées au backend: { userId: 5, userType: "patient" }
🔗 Endpoint appelé: POST /auth/create-2fa-session
❌ Erreur création session temporaire 2FA: Request failed with status code 400
```

### **Test 2 : Test avec Postman/Insomnia**
```bash
# Test 1 : Structure actuelle
POST http://localhost:3000/api/auth/create-2fa-session
{
    "userId": 5,
    "userType": "patient"
}

# Test 2 : Structure alternative 1
POST http://localhost:3000/api/auth/create-2fa-session
{
    "id": 5,
    "type": "patient"
}

# Test 3 : Structure alternative 2
POST http://localhost:3000/api/auth/create-2fa-session
{
    "patientId": 5,
    "role": "patient"
}

# Test 4 : Types de données alternatifs
POST http://localhost:3000/api/auth/create-2fa-session
{
    "userId": "5",
    "userType": "PATIENT"
}
```

### **Test 3 : Vérification de l'Authentification**
```bash
# Vérifier si l'endpoint nécessite une authentification
# Ajouter le header Authorization si nécessaire
POST http://localhost:3000/api/auth/create-2fa-session
Authorization: Bearer [token_jwt]
{
    "userId": 5,
    "userType": "patient"
}
```

## 🛠️ **Solutions à Tester**

### **Solution 1 : Adapter la Structure des Données**
```javascript
// Dans twoFactorApi.js - Essayer différentes structures
const requestData = { 
    // Option 1 : Structure actuelle
    userId: userData.id,
    userType: userData.type
    
    // Option 2 : Structure alternative
    // id: userData.id,
    // type: userData.type
    
    // Option 3 : Structure alternative
    // patientId: userData.id,
    // role: userData.type
};
```

### **Solution 2 : Adapter les Types de Données**
```javascript
// Dans twoFactorApi.js - Conversion des types
const requestData = { 
    userId: String(userData.id),        // Convertir en string
    userType: userData.type.toUpperCase() // Convertir en majuscules
};
```

### **Solution 3 : Ajouter l'Authentification**
```javascript
// Dans twoFactorApi.js - Vérifier l'authentification
const token = localStorage.getItem('jwt') || localStorage.getItem('token');
if (!token) {
    throw new Error('Authentification requise pour créer une session 2FA');
}

// L'intercepteur Axios devrait déjà ajouter le header Authorization
```

## 📊 **Logs de Débogage à Ajouter**

### **Dans twoFactorApi.js**
```javascript
export const create2FASession = async (userData) => {
    try {
        console.log('🔐 create2FASession - Création session temporaire 2FA...', { userData });
        
        // Validation des données requises
        if (!userData || !userData.id) {
            throw new Error('Type d\'utilisateur et identifiant requis. Veuillez fournir l\'identifiant ou vous reconnecter.');
        }
        
        if (!userData.type) {
            throw new Error('Type d\'utilisateur manquant. Veuillez vous reconnecter.');
        }
        
        console.log('✅ Validation des données réussie:', {
            userId: userData.id,
            userType: userData.type
        });
        
        const requestData = { 
            userId: userData.id,
            userType: userData.type
        };
        
        console.log('📤 Données envoyées au backend:', requestData);
        console.log('🔗 Endpoint appelé: POST /auth/create-2fa-session');
        
        // Vérifier l'authentification
        const token = localStorage.getItem('jwt') || localStorage.getItem('token');
        console.log('🔑 Token d\'authentification:', token ? 'Présent' : 'Absent');
        
        const response = await api.post('/auth/create-2fa-session', requestData);
        
        console.log('✅ Session temporaire 2FA créée:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Erreur création session temporaire 2FA:', error);
        console.error('📊 Détails de l\'erreur:', {
            status: error.response?.status,
            message: error.response?.data?.message,
            data: error.response?.data,
            headers: error.response?.headers
        });
        
        // Gestion améliorée des erreurs
        if (error.message && error.message.includes('Type d\'utilisateur')) {
            throw error.message; // Erreur de validation des données
        } else if (error.response?.data?.message) {
            throw error.response.data.message; // Erreur du serveur
        } else {
            throw "Erreur lors de la création de la session 2FA";
        }
    }
};
```

## 🚀 **Prochaines Étapes**

### **1. Vérifier les Logs Frontend**
- ✅ Confirmer que l'ID `5` est extrait
- ✅ Confirmer que le type `"patient"` est déterminé
- ✅ Confirmer que les données sont envoyées au backend

### **2. Tester avec Postman/Insomnia**
- ✅ Tester différentes structures de données
- ✅ Tester différents types de données
- ✅ Vérifier l'authentification requise

### **3. Analyser la Réponse Backend**
- ✅ Identifier le message d'erreur exact
- ✅ Comprendre la validation qui échoue
- ✅ Adapter la structure des données

## 📚 **Références**

- [Test Erreur 400](./TEST_ERREUR_400_CREATE_SESSION.md)
- [Analyse Flux Connexion](./ANALYSE_FLUX_CONNEXION_2FA.md)
- [Test Structure ID Patient](./TEST_STRUCTURE_ID_PATIENT.md)
