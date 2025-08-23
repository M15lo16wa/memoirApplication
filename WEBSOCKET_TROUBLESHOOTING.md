# 🔌 Guide de Résolution des Problèmes WebSocket

## 🚨 **Problème : WebSocket non connecté ("No WS")**

Si vous voyez l'indicateur **"No WS"** dans votre interface de messagerie, cela signifie que la connexion WebSocket n'est pas établie. Voici comment diagnostiquer et résoudre ce problème.

## 🔍 **Diagnostic Automatique**

### **1. Ouvrir le Diagnostic WebSocket**
- Cliquez sur le bouton **🐛 (Diagnostic)** dans l'interface de messagerie
- Le composant de diagnostic affichera :
  - Statut de la connexion WebSocket
  - Validité du token JWT
  - Statut du serveur
  - Nombre de tentatives de connexion
  - Dernière erreur rencontrée

### **2. Vérifications Automatiques**
Le diagnostic vérifie automatiquement :
- ✅ Présence d'un token JWT dans localStorage
- ✅ Validité du format du token JWT
- ✅ État de la connexion WebSocket
- ✅ Disponibilité du serveur

## 🛠️ **Actions de Diagnostic Disponibles**

### **1. Tester le Serveur**
```bash
# Cliquez sur "Tester le serveur"
# Vérifie si http://localhost:3000/api/health répond
```

### **2. Forcer la Connexion WebSocket**
```bash
# Cliquez sur "Forcer la connexion"
# Tente de reconnecter avec le token disponible
```

### **3. Vider le Cache et Reconnecter**
```bash
# Cliquez sur "Vider cache + reconnecter"
# Nettoie le cache et tente une nouvelle connexion
```

## 🔧 **Résolution des Problèmes Courants**

### **Problème 1 : Aucun Token JWT**

**Symptômes :**
- Token affiché comme "Aucun token trouvé"
- Token Valid : "Invalide"

**Solutions :**
1. **Vérifier la connexion utilisateur**
   ```javascript
   // Dans la console du navigateur
   console.log('JWT:', localStorage.getItem('jwt'));
   console.log('First Connection Token:', localStorage.getItem('firstConnectionToken'));
   console.log('Original JWT:', localStorage.getItem('originalJWT'));
   ```

2. **Se reconnecter à l'application**
   - Fermer et rouvrir l'application
   - Se déconnecter et se reconnecter

3. **Vérifier l'authentification**
   - S'assurer d'être connecté en tant que médecin ou patient
   - Vérifier que la session n'a pas expiré

### **Problème 2 : Token JWT Invalide**

**Symptômes :**
- Token affiché mais "Token Valid : Invalide"
- Erreurs de format dans la console

**Solutions :**
1. **Vérifier le format du token**
   ```javascript
   // Un JWT valide doit avoir 3 parties séparées par des points
   const token = localStorage.getItem('jwt');
   const parts = token.split('.');
   console.log('Nombre de parties:', parts.length); // Doit être 3
   ```

2. **Vérifier l'expiration du token**
   ```javascript
   try {
     const payload = JSON.parse(atob(token.split('.')[1]));
     console.log('Expiration:', new Date(payload.exp * 1000));
     console.log('Maintenant:', new Date());
   } catch (error) {
     console.error('Token invalide:', error);
   }
   ```

3. **Renouveler le token**
   - Se déconnecter et se reconnecter
   - Vérifier que le serveur génère des tokens valides

### **Problème 3 : Serveur Hors Ligne**

**Symptômes :**
- Serveur affiché comme "Hors ligne"
- Erreurs de connexion réseau

**Solutions :**
1. **Vérifier que le serveur backend est démarré**
   ```bash
   # Dans le terminal du serveur
   cd backend
   npm start
   # ou
   node server.js
   ```

2. **Vérifier l'URL du serveur**
   ```javascript
   // Dans messagingApi.js, vérifier l'URL
   const wsConfig = {
     url: 'http://localhost:3000', // Vérifier cette URL
     // ...
   };
   ```

3. **Tester la connectivité**
   ```bash
   # Dans le terminal
   curl http://localhost:3000/api/health
   # Doit retourner une réponse 200 OK
   ```

### **Problème 4 : Erreurs de Connexion WebSocket**

**Symptômes :**
- Tentatives de connexion échouent
- Erreurs dans la console du navigateur

**Solutions :**
1. **Vérifier les logs du serveur**
   ```bash
   # Dans le terminal du serveur
   # Vérifier les erreurs de connexion WebSocket
   ```

2. **Vérifier la configuration CORS**
   ```javascript
   // Sur le serveur, vérifier que CORS est configuré pour
   // http://localhost:3000 (frontend)
   ```

3. **Vérifier les ports**
   - Frontend : généralement sur le port 3000 ou 3001
   - Backend : généralement sur le port 3000
   - S'assurer qu'il n'y a pas de conflit de ports

## 🔄 **Processus de Reconnexion Automatique**

### **1. Reconnexion Périodique**
- Toutes les 60 secondes, si WebSocket déconnecté
- Tentative automatique de reconnexion
- Fallback vers l'API HTTP en cas d'échec

### **2. Reconnexion Intelligente**
```javascript
// Dans MedecinMessaging.js
useEffect(() => {
  const interval = setInterval(() => {
    if (!wsConnected) {
      console.log('🔄 Tentative de reconnexion WebSocket...');
      const token = localStorage.getItem('jwt');
      if (token) {
        connectWebSocket(token);
      }
    }
  }, 60000);
  
  return () => clearInterval(interval);
}, [wsConnected, connectWebSocket]);
```

## 📊 **Monitoring et Logs**

### **1. Logs de Connexion**
```javascript
// Tous les événements WebSocket sont loggés
console.log('✅ [messagingApi] WebSocket connecté avec succès');
console.log('❌ [messagingApi] Erreur de connexion WebSocket:', error);
console.log('🔄 [messagingApi] WebSocket reconnecté après', attemptNumber, 'tentatives');
```

### **2. Indicateurs Visuels**
- **WS** (vert) : WebSocket connecté
- **No WS** (rouge) : WebSocket déconnecté
- **✓** (vert) : Connexion établie
- **⏳** (jaune) : Connexion en cours

## 🚀 **Actions de Récupération**

### **1. Redémarrage Complet**
```bash
# 1. Arrêter le serveur backend
Ctrl+C

# 2. Arrêter le frontend
Ctrl+C

# 3. Redémarrer le serveur backend
npm start

# 4. Redémarrer le frontend
npm start
```

### **2. Nettoyage du Cache**
```javascript
// Dans la console du navigateur
localStorage.clear();
// Puis se reconnecter
```

### **3. Vérification des Dépendances**
```bash
# Vérifier que socket.io-client est installé
npm list socket.io-client

# Réinstaller si nécessaire
npm install socket.io-client
```

## 📞 **Support et Débogage**

### **1. Informations à Collecter**
- Screenshot de l'interface avec "No WS"
- Logs de la console du navigateur
- Logs du serveur backend
- Statut du diagnostic WebSocket

### **2. Commandes de Débogage**
```javascript
// Dans la console du navigateur
// Vérifier l'état WebSocket
console.log('WebSocket Status:', messagingService.getWebSocketStatus());

// Vérifier les tokens
console.log('Tokens:', {
  jwt: localStorage.getItem('jwt'),
  firstConnection: localStorage.getItem('firstConnectionToken'),
  original: localStorage.getItem('originalJWT')
});

// Tester la connexion manuellement
const token = localStorage.getItem('jwt');
if (token) {
  messagingService.connectWebSocket(token);
}
```

## 🎯 **Prévention des Problèmes**

### **1. Bonnes Pratiques**
- ✅ Toujours vérifier la connexion WebSocket au démarrage
- ✅ Implémenter la reconnexion automatique
- ✅ Gérer les erreurs de connexion gracieusement
- ✅ Maintenir un fallback vers l'API HTTP

### **2. Monitoring Continu**
- Surveiller l'état de la connexion WebSocket
- Logger tous les événements de connexion/déconnexion
- Alerter en cas de problèmes de connectivité

### **3. Tests Réguliers**
- Tester la connexion WebSocket après chaque déploiement
- Vérifier la reconnexion automatique
- Tester avec différents types d'utilisateurs

---

**💡 Conseil :** Utilisez toujours le composant de diagnostic WebSocket pour identifier rapidement la source du problème. Il fournit toutes les informations nécessaires pour résoudre la plupart des problèmes de connexion ! 🚀
