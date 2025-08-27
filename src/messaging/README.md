# 📱 Service de Messagerie

## 🏗️ Architecture

```
src/messaging/
├── index.js                    # Point d'entrée unifié
├── README.md                   # Documentation
├── components/                 # Composants React
│   ├── index.js               # Export des composants
│   ├── MessagingButton.js     # Bouton de messagerie
│   ├── MessagingWidget.js     # Widget de messagerie
│   └── chatMessage.js         # Page complète de messagerie
└── services/                   # Services
    └── signalingService.js     # Service de signalisation WebSocket
```

## 🚀 Utilisation

### Import unifié
```javascript
import { 
  MessagingButton, 
  MessagingWidget, 
  ChatMessage,
  signalingService 
} from '../messaging';
```

### Composants disponibles

#### 1. MessagingButton
Bouton simple pour déclencher la messagerie
```javascript
<MessagingButton
  userId={userId}
  role={role}
  token={token}
  conversationId={conversationId}
  onClick={handleClick}
  unreadCount={5}
/>
```

#### 2. MessagingWidget
Widget compact pour afficher et envoyer des messages
```javascript
<MessagingWidget
  userId={userId}
  role={role}
  token={token}
  conversationId={conversationId}
  toUserId={toUserId}
  onClose={handleClose}
/>
```

#### 3. ChatMessage
Page complète de messagerie avec gestion des conversations
```javascript
<ChatMessage />
```

## 🔧 Configuration

### Variables d'environnement
```bash
REACT_APP_API_URL=http://localhost:3000
```

### Service de signalisation
Le `signalingService` gère automatiquement :
- Connexion WebSocket
- Authentification
- Gestion des tokens
- Reconnexion automatique

## 📋 Fonctionnalités

- ✅ Connexion WebSocket automatique
- ✅ Gestion des conversations
- ✅ Envoi/réception de messages en temps réel
- ✅ Gestion des erreurs et reconnexion
- ✅ Interface responsive et moderne
- ✅ Support patient/médecin
- ✅ Notifications de nouveaux messages

## 🧪 Test

Pour tester le service :
1. Vérifiez que le backend est démarré
2. Assurez-vous d'avoir un token JWT valide
3. Utilisez le composant `MessagingDiagnostic` pour diagnostiquer

## 🔄 Mise à jour

Cette organisation remplace l'ancienne structure avec :
- ❌ Suppression des doublons de code
- ✅ Point d'entrée unifié
- ✅ Composants cohérents
- ✅ Service centralisé
- ✅ Documentation claire
