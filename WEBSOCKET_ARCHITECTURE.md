# 🔌 Architecture WebSocket Unifiée - Messagerie Sécurisée

## 📋 **Vue d'ensemble**

L'application utilise une **architecture WebSocket unifiée** basée sur Socket.IO pour la messagerie en temps réel. Tous les composants de messagerie utilisent le même service centralisé pour garantir la cohérence et éviter les conflits.

## 🏗️ **Architecture des Services**

### **Service Principal : `messagingApi.js`**
- **Localisation** : `src/services/api/messagingApi.js`
- **Technologie** : Socket.IO Client
- **Responsabilités** :
  - Connexion WebSocket au serveur
  - Gestion des événements en temps réel
  - API HTTP pour la messagerie
  - Cache intelligent des conversations
  - Normalisation des données

### **Hooks Unifiés**

#### **`useMessaging`** - Hook principal WebSocket
- **Localisation** : `src/hooks/useMessaging.js`
- **Responsabilités** :
  - État de connexion WebSocket
  - Méthodes de gestion des conversations
  - Écouteurs d'événements WebSocket
  - Interface unifiée pour tous les composants

#### **`useSecureMessaging`** - Hook de messagerie sécurisée
- **Localisation** : `src/hooks/useSecureMessaging.js`
- **Responsabilités** :
  - Gestion des messages d'une conversation
  - Intégration WebSocket pour les nouveaux messages
  - Normalisation et enrichissement des messages
  - Gestion des participants de conversation

## 🔄 **Flux de Données WebSocket**

```
Serveur Socket.IO ←→ messagingApi.js ←→ useMessaging ←→ Composants React
```

### **Événements WebSocket Supportés**

| Événement | Description | Utilisation |
|-----------|-------------|-------------|
| `connect` | Connexion établie | Indicateur de statut |
| `disconnect` | Déconnexion | Gestion des erreurs |
| `new_message` | Nouveau message | Mise à jour en temps réel |
| `user_typing` | Indicateur de frappe | UX interactive |
| `conversation_updated` | Conversation modifiée | Rafraîchissement automatique |
| `user_online/offline` | Présence utilisateur | Indicateurs de statut |
| `notification` | Notifications système | Alertes utilisateur |

## 🧩 **Composants Utilisant WebSocket**

### **1. MedecinMessaging.js**
- **Hook utilisé** : `useMessaging`
- **Fonctionnalités** :
  - Liste des conversations en temps réel
  - Indicateurs de nouveaux messages
  - Mises à jour automatiques via WebSocket

### **2. SecureMessaging.js**
- **Hook utilisé** : `useSecureMessaging`
- **Fonctionnalités** :
  - Messages en temps réel
  - Indicateurs de frappe
  - Notifications de nouveaux messages

### **3. MessagingButton.js**
- **Hook utilisé** : `useMessaging` (via SecureMessaging)
- **Fonctionnalités** :
  - Ouverture de la messagerie
  - Intégration avec le système WebSocket

## 🔧 **Configuration WebSocket**

### **Paramètres de Connexion**
```javascript
const wsConfig = {
  url: 'http://localhost:3000',
  transports: ['websocket'],
  timeout: 15000,
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionAttempts: 10,
  forceNew: true,
  upgrade: true
};
```

### **Authentification**
```javascript
// Token JWT automatiquement ajouté via intercepteur axios
this.socket = io(this.wsConfig.url, {
  auth: { token },
  ...this.wsConfig
});
```

## 📱 **Gestion des États de Connexion**

### **États Supportés**
- ✅ **Connecté** : WebSocket actif, messages en temps réel
- ❌ **Déconnecté** : Fallback vers API HTTP, reconnexion automatique
- 🔄 **Reconnexion** : Tentatives automatiques de reconnexion
- ⚠️ **Erreur** : Gestion des erreurs avec fallback

### **Fallback Automatique**
```javascript
// Si WebSocket déconnecté, utilisation de l'API HTTP
if (!wsConnected) {
  console.log('🔄 Rechargement périodique (WebSocket déconnecté)...');
  loadConversations(); // API HTTP
}
```

## 🚀 **Avantages de l'Architecture Unifiée**

### **1. Cohérence**
- Un seul service WebSocket pour toute l'application
- Pas de conflits entre services multiples
- Interface unifiée pour tous les composants

### **2. Performance**
- Cache intelligent des conversations
- Reconnexion automatique en cas de déconnexion
- Gestion optimisée des événements

### **3. Maintenabilité**
- Code centralisé et facile à maintenir
- Gestion unifiée des erreurs
- Configuration centralisée

### **4. Extensibilité**
- Facile d'ajouter de nouveaux événements
- Support des nouvelles fonctionnalités WebSocket
- Architecture modulaire

## 🔍 **Débogage et Monitoring**

### **Logs WebSocket**
```javascript
// Tous les événements WebSocket sont loggés avec des emojis
console.log('✅ [messagingApi] WebSocket connecté avec succès');
console.log('📨 [messagingApi] Nouveau message reçu via WebSocket:', message);
console.log('🔄 [messagingApi] Conversation mise à jour via WebSocket:', data);
```

### **Indicateurs Visuels**
- Indicateur de statut WebSocket dans l'interface
- Affichage du Socket ID pour le débogage
- Indicateurs de connexion/déconnexion

## 📚 **Utilisation Recommandée**

### **Pour les Composants de Messagerie**
```javascript
import useMessaging from '../../hooks/useMessaging';

const { isConnected, socketId, onNewMessage } = useMessaging();
```

### **Pour la Messagerie Sécurisée**
```javascript
import useSecureMessaging from '../../hooks/useSecureMessaging';

const { messages, sendMessageUnified, isConnected } = useSecureMessaging(contextType, contextId);
```

### **Éviter**
- ❌ Import direct de `messagingApi.js`
- ❌ Création de nouveaux services WebSocket
- ❌ Gestion manuelle des connexions Socket.IO

## 🎯 **Conclusion**

L'architecture WebSocket unifiée garantit :
- **Cohérence** : Un seul service pour toute l'application
- **Performance** : Cache intelligent et reconnexion automatique
- **Maintenabilité** : Code centralisé et bien structuré
- **Fiabilité** : Fallback automatique vers l'API HTTP

Cette architecture est optimale pour une application de messagerie sécurisée en temps réel ! 🚀
