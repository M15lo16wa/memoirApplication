# 🔧 CORRECTION Ordre d'Initialisation - Setup2FA.js

## 🚨 **Erreur rencontrée**

```
ERROR
Cannot access 'buildUserParams' before initialization
ReferenceError: Cannot access 'buildUserParams' before initialization
    at Setup2FA (http://localhost:3001/static/js/bundle.js:142230:71)
```

## 🔍 **Cause du problème**

**Ordre d'initialisation incorrect :**
- `handleResendEmail` (ligne 225) utilise `buildUserParams`
- `buildUserParams` est défini après (ligne 249)
- **Résultat :** Erreur d'accès avant initialisation

## 🔧 **Solution appliquée**

### **1. Réorganisation de l'ordre des fonctions**

**AVANT (incorrect) :**
```javascript
// 1. sendSetupEmail (ligne ~85)
// 2. handleResendEmail (ligne 225) ← UTILISE buildUserParams
// 3. buildUserParams (ligne 249) ← DÉFINI APRÈS utilisation
// 4. initialize2FA (ligne 308)
```

**APRÈS (correct) :**
```javascript
// 1. sendSetupEmail (ligne ~85)
// 2. buildUserParams (ligne ~222) ← DÉFINI AVANT utilisation
// 3. handleResendEmail (ligne ~285) ← UTILISE buildUserParams
// 4. initialize2FA (ligne ~368)
```

### **2. Code de la fonction buildUserParams déplacée**

```javascript
// Construction des paramètres utilisateur
const buildUserParams = useCallback((userData) => {
    // 🔍 DÉBOGAGE - Vérifier la structure de userData
    console.log('🔐 DEBUG - buildUserParams - Structure userData:', {
        keys: Object.keys(userData || {}),
        numero_assure: userData?.numero_assure,
        numero_adeli: userData?.numero_adeli,
        email: userData?.email,
        email_professionnel: userData?.email_professionnel,
        email_medecin: userData?.email_medecin,
        professionnel: userData?.professionnel ? Object.keys(userData.professionnel) : 'N/A',
        type: userData?.type,
        id: userData?.id,
        id_professionnel: userData?.id_professionnel,
        userId: userData?.userId
    });
    
    if (userData.numero_assure) {
        return { 
            userType: 'patient', 
            identifier: userData.numero_assure, 
            userId: userData.id_patient || userData.id || userData.userId ? String(userData.id_patient || userData.id || userData.userId) : undefined 
        };
    }
    if (userData.numero_adeli) {
        return { 
            userType: 'professionnel', 
            identifier: userData.numero_adeli, 
            userId: userData.id || userData.id_professionnel || userData.userId ? String(userData.id || userData.id_professionnel || userData.userId) : undefined 
        };
    }
    
    // 🔍 DÉBOGAGE - Recherche d'email dans différentes propriétés
    const email = userData.email || 
                 userData.email_professionnel || 
                 userData.email_medecin ||
                 userData.professionnel?.email ||
                 userData.user?.email;
    
    if (email) {
        console.log('🔐 DEBUG - Email trouvé pour buildUserParams:', email);
        return { 
            userType: 'professionnel', 
            identifier: email, 
            userId: userData.id || userData.id_professionnel || userData.userId ? String(userData.id || userData.id_professionnel || userData.userId) : undefined 
        };
    }
    
    if (userData.id || userData.userId) {
        return { 
            userType: userData.type === 'patient' ? 'patient' : 'professionnel', 
            identifier: String(userData.id || userData.userId), 
            userId: String(userData.id || userData.userId) 
        };
    }
    
    console.error('❌ DEBUG - Impossible de déterminer userType et identifier:', userData);
    throw new Error("Impossible de déterminer 'userType' et 'identifier' pour setup2FA");
}, []);
```

## 📊 **Statut des corrections**

### ✅ **Erreurs résolues :**
- ❌ ~~`Cannot access 'buildUserParams' before initialization`~~
- ❌ ~~`'buildUserParams' is not defined` (lignes 230, 246, 275, 306, 359)~~

### 🔧 **Ordre des fonctions corrigé :**
1. ✅ **`sendSetupEmail`** → Définie en premier
2. ✅ **`buildUserParams`** → Définie avant utilisation
3. ✅ **`handleResendEmail`** → Peut maintenant utiliser `buildUserParams`
4. ✅ **`initialize2FA`** → Peut maintenant utiliser `buildUserParams`

## 🎯 **Résultat attendu**

Après cette correction :
- ✅ **Pas d'erreur d'initialisation** → `buildUserParams` accessible partout
- ✅ **Composant Setup2FA fonctionnel** → Plus d'erreur de référence
- ✅ **Process 2FA complet** → Toutes les fonctions disponibles dans le bon ordre

## 🚀 **Test de validation**

Pour vérifier que la correction fonctionne :
1. **Relancer l'application** → `npm start`
2. **Accéder au composant Setup2FA** → Plus d'erreur d'initialisation
3. **Tester le processus 2FA** → Validation et redirection devraient fonctionner

## 📝 **Note technique**

**Principe JavaScript/React :**
- Les fonctions doivent être définies avant d'être utilisées
- L'ordre de déclaration dans le composant est important
- Les hooks `useCallback` doivent respecter l'ordre d'utilisation

---
**Date :** 2025-01-19  
**Statut :** ✅ **CORRECTION APPLIQUÉE** - Ordre d'initialisation résolu
