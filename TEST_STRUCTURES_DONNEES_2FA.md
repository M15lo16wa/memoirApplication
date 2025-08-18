# 🧪 Test des Structures de Données - Endpoint 2FA

## 📋 **Objectif du Test**

Tester différentes structures de données avec l'endpoint `/api/auth/create-2fa-session` pour identifier la structure attendue par le backend.

## 🔍 **Structure Actuelle (Frontend)**

```javascript
// Données envoyées actuellement
{
    "userId": 5,
    "userType": "patient"
}
```

## 🧪 **Tests à Effectuer**

### **Test 1 : Structure Alternative 1**
```bash
POST http://localhost:3000/api/auth/create-2fa-session
Content-Type: application/json

{
    "id": 5,
    "type": "patient"
}
```

### **Test 2 : Structure Alternative 2**
```bash
POST http://localhost:3000/api/auth/create-2fa-session
Content-Type: application/json

{
    "patientId": 5,
    "role": "patient"
}
```

### **Test 3 : Structure Alternative 3**
```bash
POST http://localhost:3000/api/auth/create-2fa-session
Content-Type: application/json

{
    "user_id": 5,
    "user_type": "patient"
}
```

### **Test 4 : Types de Données Alternatifs**
```bash
POST http://localhost:3000/api/auth/create-2fa-session
Content-Type: application/json

{
    "userId": "5",
    "userType": "PATIENT"
}
```

### **Test 5 : Structure Alternative 4**
```bash
POST http://localhost:3000/api/auth/create-2fa-session
Content-Type: application/json

{
    "userId": 5.0,
    "userType": 1
}
```

## 🔧 **Implémentation des Tests**

### **Option 1 : Test avec Postman/Insomnia**
1. Créer une nouvelle requête POST
2. URL : `http://localhost:3000/api/auth/create-2fa-session`
3. Headers : `Content-Type: application/json`
4. Body : Tester chaque structure ci-dessus
5. Analyser la réponse (status, message d'erreur)

### **Option 2 : Test avec cURL**
```bash
# Test 1
curl -X POST http://localhost:3000/api/auth/create-2fa-session \
  -H "Content-Type: application/json" \
  -d '{"id": 5, "type": "patient"}'

# Test 2
curl -X POST http://localhost:3000/api/auth/create-2fa-session \
  -H "Content-Type: application/json" \
  -d '{"patientId": 5, "role": "patient"}'

# Test 3
curl -X POST http://localhost:3000/api/auth/create-2fa-session \
  -H "Content-Type: application/json" \
  -d '{"user_id": 5, "user_type": "patient"}'
```

### **Option 3 : Test Frontend Temporaire**
```javascript
// Dans twoFactorApi.js - Fonction de test temporaire
export const testDifferentStructures = async (userData) => {
    const structures = [
        // Structure actuelle
        { userId: userData.id, userType: userData.type },
        // Structure alternative 1
        { id: userData.id, type: userData.type },
        // Structure alternative 2
        { patientId: userData.id, role: userData.type },
        // Structure alternative 3
        { user_id: userData.id, user_type: userData.type }
    ];
    
    for (let i = 0; i < structures.length; i++) {
        const structure = structures[i];
        console.log(`🧪 Test structure ${i + 1}:`, structure);
        
        try {
            const response = await api.post('/auth/create-2fa-session', structure);
            console.log(`✅ Structure ${i + 1} réussie:`, response.data);
            return response.data;
        } catch (error) {
            console.log(`❌ Structure ${i + 1} échouée:`, {
                status: error.response?.status,
                message: error.response?.data?.message
            });
        }
    }
    
    throw new Error('Aucune structure de données acceptée par le backend');
};
```

## 📊 **Analyse des Réponses**

### **Réponse de Succès (200)**
```javascript
{
    "success": true,
    "tempTokenId": "temp_session_123",
    "message": "Session temporaire 2FA créée"
}
```

### **Réponse d'Erreur (400)**
```javascript
{
    "success": false,
    "message": "Type d'utilisateur et identifiant requis",
    "details": "Le champ 'userId' est requis"
}
```

### **Réponse d'Erreur (400) - Structure Alternative**
```javascript
{
    "success": false,
    "message": "Données invalides",
    "details": "Le champ 'id' est requis au lieu de 'userId'"
}
```

## 🚀 **Prochaines Étapes**

### **1. Effectuer les Tests**
- ✅ Tester chaque structure avec Postman/Insomnia
- ✅ Analyser les messages d'erreur
- ✅ Identifier la structure attendue

### **2. Adapter le Frontend**
- ✅ Modifier `twoFactorApi.js` avec la bonne structure
- ✅ Tester la connexion 2FA
- ✅ Vérifier la création de session

### **3. Validation Complète**
- ✅ Tester le flux complet 2FA
- ✅ Vérifier la génération du QR code
- ✅ Valider la validation du code

## 📚 **Références**

- [Diagnostic Erreur 400](./DIAGNOSTIC_ERREUR_400_2FA.md)
- [Test Erreur 400](./TEST_ERREUR_400_CREATE_SESSION.md)
- [Analyse Flux Connexion](./ANALYSE_FLUX_CONNEXION_2FA.md)
