# Guide d'Intégration du Système de Messagerie

## Vue d'ensemble

Votre application dispose maintenant d'un système de messagerie complètement autonome et moderne, basé sur Redis avec fallback localStorage. Ce système remplace l'ancien service de messagerie qui avait des problèmes de stabilité.

## 🚀 Fonctionnalités Principales

- **Messagerie bidirectionnelle** : Support des rôles patient et médecin
- **Stockage Redis** : Performance et persistance des données
- **Fallback localStorage** : Fonctionnement même sans Redis
- **Appels vidéo/audio** : Intégration WebRTC
- **Notifications temps réel** : Système de notifications avancé
- **Interface moderne** : Composants React réutilisables

## 📁 Structure des Fichiers

```
src/messaging/
├── services/           # Services de base
│   ├── redisClient.js      # Client Redis avec fallback
│   ├── messageStore.js     # Stockage des messages
│   ├── conversationManager.js # Gestion des conversations
│   ├── userManager.js       # Gestion des utilisateurs
│   ├── notificationService.js # Service de notifications
│   ├── signalingService.js  # Signalisation WebRTC
│   ├── messagingService.js  # Service principal unifié
│   └── index.js            # Export centralisé
├── hooks/              # Hooks React
│   ├── useChat.js          # Gestion du chat
│   ├── useWebRTC.js        # Gestion des appels
│   ├── useNotifications.js # Gestion des notifications
│   └── index.js            # Export centralisé
└── components/         # Composants UI
    ├── MessagingButton.js  # Bouton de messagerie
    ├── ChatWindow.js       # Fenêtre de chat
    ├── VideoCall/          # Composants d'appel vidéo
    └── index.js            # Export centralisé
```

## 🔧 Installation et Configuration

### 1. Dépendances Installées

```bash
npm install redis ioredis
```

### 2. Configuration Redis (Optionnel)

Si vous avez un serveur Redis :
```javascript
// Dans redisClient.js, modifiez la configuration
const redisConfig = {
  host: 'localhost',
  port: 6379,
  password: 'votre_mot_de_passe',
  db: 0
};
```

Sans Redis, le système utilise automatiquement localStorage.

## 📱 Utilisation dans vos Composants

### 1. Bouton de Messagerie Simple

```jsx
import { MessagingButton } from '../messaging/components';

const MonComposant = () => {
  const handleOpenMessaging = () => {
    // Ouvrir la messagerie
  };

  const handleOpenVideoCall = () => {
    // Démarrer un appel vidéo
  };

  return (
    <MessagingButton
      userId="user-123"
      userType="patient"
      onOpenMessaging={handleOpenMessaging}
      onOpenVideoCall={handleOpenVideoCall}
      size="medium"
      variant="primary"
    />
  );
};
```

### 2. Fenêtre de Chat Complète

```jsx
import { ChatWindow } from '../messaging/components';

const MonComposant = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsChatOpen(true)}>
        Ouvrir le Chat
      </button>
      
      {isChatOpen && (
        <ChatWindow
          userId="user-123"
          userType="patient"
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </>
  );
};
```

### 3. Gestion des Appels Vidéo

```jsx
import { useWebRTC } from '../messaging/hooks';

const MonComposant = () => {
  const {
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    localStream,
    remoteStream,
    isConnected
  } = useWebRTC('user-123', 'patient');

  const handleStartCall = async () => {
    await initiateCall({
      id: 'callee-456',
      nom: 'Dr. Dupont',
      prenom: 'Jean'
    }, 'video');
  };

  return (
    <div>
      <button onClick={handleStartCall}>Appeler</button>
      {localStream && (
        <video ref={localVideoRef} autoPlay muted />
      )}
      {remoteStream && (
        <video ref={remoteVideoRef} autoPlay />
      )}
    </div>
  );
};
```

### 4. Gestion des Notifications

```jsx
import { useNotifications } from '../messaging/hooks';

const MonComposant = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications('user-123', 'patient');

  return (
    <div>
      <span>Notifications: {unreadCount}</span>
      {notifications.map(notification => (
        <div key={notification.id}>
          {notification.message}
          <button onClick={() => markAsRead(notification.id)}>
            Marquer comme lu
          </button>
        </div>
      ))}
    </div>
  );
};
```

## 🔌 Intégration dans vos Pages Existantes

### 1. Page Médecin

```jsx
// Dans src/pages/medecin.js
import { MessagingButton } from '../messaging/components';

// Dans la section messagerie
case 'messaging':
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Messagerie</h2>
      
      <MessagingButton
        userId={medecin.id_professionnel || medecin.id}
        userType="medecin"
        onOpenMessaging={() => setActiveSection('chat')}
        onOpenVideoCall={() => setActiveSection('video')}
        size="large"
        variant="primary"
      />
      
      {/* Autres composants de messagerie */}
    </div>
  );
```

### 2. Page DMP

```jsx
// Dans src/pages/DMP.js
import { MessagingButton } from '../messaging/components';

// Remplacer l'ancien MessagingButton
{(prescription.type_prescription === 'ordonnance' || prescription.type_prescription === 'examen') && (
  <div className="pt-2 border-t border-gray-200">
    <MessagingButton
      userId={patientProfile?.id}
      userType="patient"
      onOpenMessaging={() => {
        // Ouvrir la messagerie avec le contexte de la prescription
      }}
      onOpenVideoCall={() => {
        // Démarrer un appel avec le médecin
      }}
      className="w-full"
      size="medium"
      variant="outline"
    />
  </div>
)}
```

## 🎯 Initialisation des Services

### 1. Initialisation Automatique

Les services s'initialisent automatiquement lors de leur première utilisation. Pour une initialisation manuelle :

```jsx
import { initializeMessagingServices } from '../messaging/services';

useEffect(() => {
  const initServices = async () => {
    try {
      await initializeMessagingServices();
      console.log('✅ Services de messagerie initialisés');
    } catch (error) {
      console.error('❌ Erreur d\'initialisation:', error);
    }
  };

  initServices();
}, []);
```

### 2. Vérification de l'État

```jsx
import { healthCheckMessagingServices } from '../messaging/services';

const checkHealth = async () => {
  const health = await healthCheckMessagingServices();
  console.log('État des services:', health);
};
```

## 🔒 Gestion des Permissions

Le système respecte automatiquement les rôles utilisateur :

- **Patients** : Peuvent voir leurs conversations et contacter leurs médecins
- **Médecins** : Peuvent voir leurs conversations et contacter leurs patients
- **Sécurité** : Chaque utilisateur ne voit que ses propres données

## 📊 Statistiques et Monitoring

```jsx
import { getMessagingServicesStats } from '../messaging/services';

const getStats = async () => {
  const stats = await getMessagingServicesStats();
  console.log('Statistiques:', stats);
  // stats contient des informations sur Redis, messages, conversations, etc.
};
```

## 🧹 Nettoyage et Maintenance

```jsx
import { cleanupMessagingServices } from '../messaging/services';

// Lors de la fermeture de l'application
useEffect(() => {
  return () => {
    cleanupMessagingServices();
  };
}, []);
```

## 🚨 Gestion des Erreurs

Le système gère automatiquement :
- **Connexion Redis perdue** : Fallback vers localStorage
- **Erreurs de stockage** : Retry automatique
- **Problèmes WebRTC** : Fallback vers chat uniquement

## 🎨 Personnalisation

### 1. Thèmes CSS

Modifiez les fichiers CSS dans `src/messaging/components/` pour adapter l'apparence.

### 2. Comportement

Utilisez les props des composants pour personnaliser le comportement :
- `size` : "small", "medium", "large"
- `variant` : "primary", "secondary", "outline"
- `className` : Classes CSS personnalisées

## 🔍 Débogage

### 1. Console Browser

Tous les services loggent leurs actions avec des emojis pour faciliter le débogage.

### 2. Vérification de l'État

```jsx
import { 
  redisClient, 
  messageStore, 
  conversationManager 
} from '../messaging/services';

// Vérifier l'état de Redis
const redisStatus = await redisClient.testConnection();

// Vérifier le stockage des messages
const messageStats = await messageStore.getStorageStats();

// Vérifier les conversations
const conversationStats = await conversationManager.getConversationStats();
```

## 📱 Test de la Messagerie

Visitez `/messaging-demo` dans votre application pour tester toutes les fonctionnalités.

## 🚀 Prochaines Étapes

1. **Intégrer dans vos pages existantes** en remplaçant les anciens composants
2. **Configurer Redis** si vous voulez une performance optimale
3. **Personnaliser l'interface** selon vos besoins
4. **Tester les fonctionnalités** avec des utilisateurs réels

## ❓ Support

En cas de problème :
1. Vérifiez la console du navigateur
2. Utilisez les fonctions de diagnostic intégrées
3. Vérifiez la connectivité Redis
4. Consultez les logs des services

---

**Note** : Ce système est complètement autonome et ne dépend plus de l'ancien service de messagerie. Toutes les fonctionnalités sont maintenant gérées localement avec une architecture moderne et évolutive.
