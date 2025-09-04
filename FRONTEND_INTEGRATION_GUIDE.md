# 🎨 Guide d'intégration Frontend WebRTC

## 📋 Vue d'ensemble

Ce guide explique comment intégrer le nouveau système WebRTC dual-serveur dans votre application React existante.

## 🏗️ Architecture

### **Système dual-serveur :**
- **Serveur principal (HTTP)** : `http://localhost:3000` - API et messagerie
- **Serveur WebRTC (HTTPS)** : `https://localhost:3443` - Conférences et WebRTC

### **Nouveaux fichiers créés :**
```
src/
├── services/
│   ├── config.service.js          # Configuration dynamique
│   ├── webrtcClient.service.js    # Service WebRTC client
│   └── signalingService.updated.js # Service de signalisation mis à jour
├── components/
│   ├── WebRTCConference.jsx       # Composant de conférence
│   └── CreateConference.jsx       # Composant de création de conférence
├── styles/
│   └── webrtc-conference.css      # Styles pour les conférences
└── config/
    └── env.example                # Exemple de configuration
```

## ⚙️ Configuration

### **1. Variables d'environnement**

Créez le fichier `.env.local` dans votre projet frontend :

```bash
# Copiez le contenu de src/config/env.example vers .env.local
cp src/config/env.example .env.local
```

### **2. Configuration des serveurs**

```bash
# .env.local
REACT_APP_MAIN_SERVER=http://localhost:3000
REACT_APP_WEBRTC_SERVER=https://localhost:3443
REACT_APP_FRONTEND_URL=http://localhost:3001
REACT_APP_SSL_VERIFY=false  # Pour les certificats auto-signés
```

## 🚀 Utilisation

### **1. Créer une conférence (Médecin)**

```jsx
import CreateConference from './components/CreateConference';

const MedecinDashboard = () => {
  const [showCreateConference, setShowCreateConference] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const handleCreateConference = (patientId) => {
    setSelectedPatientId(patientId);
    setShowCreateConference(true);
  };

  return (
    <div>
      {/* Votre interface existante */}
      
      {showCreateConference && (
        <CreateConference
          patientId={selectedPatientId}
          onConferenceCreated={(conferenceData) => {
            console.log('Conférence créée:', conferenceData);
            // Le lien de partage est automatiquement généré
          }}
          onClose={() => setShowCreateConference(false)}
        />
      )}
    </div>
  );
};
```

### **2. Rejoindre une conférence (Patient)**

```jsx
import { useParams } from 'react-router-dom';
import ConferencePage from './messaging/components/ConferencePage';

// Le composant ConferencePage gère automatiquement :
// - La validation du token de partage
// - La connexion au serveur WebRTC
// - L'initialisation de la conférence
```

### **3. URLs de conférence**

- **Création** : Le médecin crée une conférence et reçoit un lien de partage
- **Rejoindre** : `http://localhost:3001/conference/join/{shareToken}`
- **Code de conférence** : `http://localhost:3001/conference?code={conferenceCode}`

## 🔧 Services disponibles

### **FrontendConfigService**

```javascript
import FrontendConfigService from './services/config.service';

// Obtenir la configuration
const config = FrontendConfigService.getConfig();

// Configuration WebRTC
const webrtcConfig = FrontendConfigService.getWebRTCConfig();

// Configuration Socket.io
const socketConfig = FrontendConfigService.getSocketConfig('webrtc');
```

### **WebRTCClientService**

```javascript
import WebRTCClientService from './services/webrtcClient.service';

const webrtcService = new WebRTCClientService();

// Créer une conférence
const result = await webrtcService.createConference(patientId, userToken);

// Rejoindre une conférence
const success = await webrtcService.joinConference(conferenceCode, userToken);
```

### **UpdatedSignalingService**

```javascript
import updatedSignalingService from './services/signalingService.updated';

// Initialiser le service
updatedSignalingService.initialize();

// Se connecter aux deux serveurs
updatedSignalingService.connect();

// Créer une session WebRTC
const session = await updatedSignalingService.createWebRTCSession(patientId);
```

## 🎯 Intégration dans l'interface existante

### **1. Ajouter un bouton de conférence**

```jsx
// Dans votre composant de messagerie existant
import CreateConference from '../components/CreateConference';

const MessagingWidget = () => {
  const [showConference, setShowConference] = useState(false);

  return (
    <div>
      {/* Interface de messagerie existante */}
      
      <button 
        onClick={() => setShowConference(true)}
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        🎥 Créer une conférence
      </button>

      {showConference && (
        <CreateConference
          patientId={currentPatientId}
          onConferenceCreated={(data) => {
            // Afficher le lien de partage
            alert(`Lien de partage: ${data.shareLink.shareUrl}`);
          }}
          onClose={() => setShowConference(false)}
        />
      )}
    </div>
  );
};
```

### **2. Gérer les liens de partage**

```jsx
// Dans votre composant de notification ou de messagerie
const handleShareConference = (conferenceData) => {
  const shareUrl = conferenceData.shareLink.shareUrl;
  
  // Copier dans le presse-papiers
  navigator.clipboard.writeText(shareUrl);
  
  // Ou envoyer par email/SMS
  // sendNotification(shareUrl);
};
```

## 🔒 Sécurité

### **1. Certificats SSL auto-signés**

Pour le développement, les certificats auto-signés sont utilisés. Le navigateur affichera un avertissement de sécurité.

**Solution :**
- Accepter le certificat dans le navigateur
- Ou configurer `REACT_APP_SSL_VERIFY=false`

### **2. Authentification**

Toutes les requêtes WebRTC nécessitent un token JWT valide :

```javascript
const userToken = localStorage.getItem('jwt') || localStorage.getItem('token');
```

## 🐛 Débogage

### **1. Vérifier la configuration**

```javascript
import FrontendConfigService from './services/config.service';

console.log('Configuration:', FrontendConfigService.getConfig());
```

### **2. Vérifier la connexion**

```javascript
import updatedSignalingService from './services/signalingService.updated';

console.log('Statut de connexion:', updatedSignalingService.getConnectionStatus());
console.log('Diagnostic:', updatedSignalingService.getDiagnosticInfo());
```

### **3. Logs de débogage**

Activez les logs de débogage :

```bash
# .env.local
REACT_APP_DEBUG_MODE=true
```

## 📱 Responsive Design

Le composant `WebRTCConference` est responsive et s'adapte aux différentes tailles d'écran :

- **Desktop** : Affichage côte à côte des vidéos
- **Mobile** : Affichage empilé des vidéos
- **Contrôles** : Toujours accessibles en bas de l'écran

## 🚀 Déploiement

### **1. Variables de production**

```bash
# .env.production
REACT_APP_MAIN_SERVER=https://votre-domaine.com
REACT_APP_WEBRTC_SERVER=https://webrtc.votre-domaine.com
REACT_APP_SSL_VERIFY=true
```

### **2. Certificats SSL**

Pour la production, utilisez des certificats SSL valides :

```bash
# Générer des certificats Let's Encrypt
certbot certonly --webroot -w /var/www/html -d webrtc.votre-domaine.com
```

## 🔄 Migration depuis l'ancien système

### **1. Remplacer l'ancien service**

```javascript
// Ancien
import signalingService from './services/signalingService';

// Nouveau
import updatedSignalingService from './services/signalingService.updated';
```

### **2. Mettre à jour les composants**

```javascript
// Ancien
import WebRTCWidget from './messaging/components/WebRTCWidget';

// Nouveau
import WebRTCConference from './components/WebRTCConference';
```

### **3. Mettre à jour les routes**

Les routes existantes sont compatibles, mais de nouvelles routes ont été ajoutées :

```javascript
// Nouvelles routes
<Route path="/conference/join/:shareToken" element={<ConferencePage />} />
```

## 📞 Support

En cas de problème :

1. Vérifiez les logs de la console
2. Vérifiez la configuration des serveurs
3. Vérifiez les certificats SSL
4. Vérifiez l'authentification utilisateur

## 🎉 Résumé

Le nouveau système WebRTC est maintenant intégré et prêt à être utilisé. Il offre :

- ✅ **Sécurité** : HTTPS pour WebRTC
- ✅ **Performance** : Serveur dédié pour les conférences
- ✅ **Facilité d'utilisation** : Liens de partage automatiques
- ✅ **Compatibilité** : Fonctionne avec l'interface existante
- ✅ **Responsive** : S'adapte à tous les écrans

Le système est maintenant prêt pour la production ! 🚀
