# 🚀 Serveur WebRTC - Application de Santé

## 📋 Description

Serveur backend pour la gestion des sessions WebRTC dans l'application de santé. Gère les conférences vidéo entre médecins et patients avec authentification et signaling en temps réel.

## 🛠️ Installation

```bash
# Installer les dépendances
npm install express socket.io cors

# Ou utiliser le package.json du serveur
cp server-package.json package.json
npm install
```

## 🚀 Démarrage

### Option 1: Démarrage direct
```bash
node server.js
```

### Option 2: Script de démarrage
```bash
node start-server.js
```

### Option 3: Mode développement (avec nodemon)
```bash
npm run dev
```

## 📡 Endpoints API

### Configuration WebRTC
```
GET /api/webrtc/config
```
Récupère la configuration WebRTC (serveurs STUN, etc.)

### Création de Session
```
POST /api/webrtc/sessions
```
Crée une nouvelle session WebRTC entre un médecin et un patient.

**Body:**
```json
{
  "medecinId": "medecin_123",
  "patientId": "patient_456",
  "sessionType": "video",
  "conferenceCode": "ABC123" // optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_1234567890_abc123",
    "conferenceCode": "ABC123",
    "joinUrl": "http://localhost:3001/webrtc/join/ABC123",
    "session": { ... }
  }
}
```

### Rejoindre une Conférence
```
GET /api/webrtc/join/:code?userId=123&userType=medecin
```
Rejoint une conférence existante avec authentification.

**Paramètres:**
- `code`: Code de la conférence
- `userId`: ID de l'utilisateur
- `userType`: Type d'utilisateur (medecin/patient)

## 🔌 WebSocket Signaling

### Événements disponibles

#### Côté Client
- `webrtc:join` - Rejoindre une session
- `webrtc:offer` - Envoyer une offre WebRTC
- `webrtc:answer` - Envoyer une réponse WebRTC
- `webrtc:ice-candidate` - Envoyer un candidat ICE

#### Côté Serveur
- `webrtc:participant_joined` - Participant rejoint
- `webrtc:participant_left` - Participant quitté
- `webrtc:offer` - Offre WebRTC reçue
- `webrtc:answer` - Réponse WebRTC reçue
- `webrtc:ice-candidate` - Candidat ICE reçu
- `webrtc:error` - Erreur WebRTC

### Exemple d'utilisation

```javascript
const socket = io('http://localhost:3000');

// Rejoindre une session
socket.emit('webrtc:join', {
  sessionId: 'session_123',
  userId: 'medecin_123',
  userType: 'medecin'
});

// Écouter les événements
socket.on('webrtc:participant_joined', (data) => {
  console.log('Participant rejoint:', data);
});

socket.on('webrtc:offer', (data) => {
  // Traiter l'offre WebRTC
  handleWebRTCOffer(data.offer);
});
```

## 🧪 Tests

```bash
# Tester le serveur
node test-server.js
```

## 📊 Configuration

### Variables d'environnement
- `PORT`: Port du serveur (défaut: 3000)
- `NODE_ENV`: Environnement (development/production)

### Configuration WebRTC
- Serveurs STUN: Google STUN servers
- ICE Candidate Pool Size: 10
- Support des transports: WebSocket, Polling

## 🔒 Sécurité

- Authentification par userId/userType
- Validation des autorisations de session
- CORS configuré pour les domaines autorisés
- Nettoyage automatique des sessions inactives

## 📈 Monitoring

### Endpoint de test
```
GET /api/test
```
Retourne l'état du serveur et les statistiques.

### Logs
Le serveur affiche des logs détaillés pour :
- Connexions/déconnexions WebSocket
- Création/rejoindre de sessions
- Événements WebRTC
- Erreurs et exceptions

## 🚀 Déploiement

### Production
```bash
# Installer PM2
npm install -g pm2

# Démarrer le serveur
pm2 start server.js --name "webrtc-server"

# Monitoring
pm2 monit
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## 🔧 Dépannage

### Problèmes courants

1. **Port déjà utilisé**
   ```bash
   # Changer le port
   PORT=3001 node server.js
   ```

2. **Erreurs CORS**
   - Vérifier les domaines autorisés dans la configuration CORS

3. **WebSocket ne se connecte pas**
   - Vérifier que le port 3000 est ouvert
   - Vérifier la configuration Socket.IO

### Logs de débogage
```bash
# Activer les logs détaillés
DEBUG=* node server.js
```

## 📝 Changelog

### v1.0.0
- Implémentation des routes WebRTC de base
- Support WebSocket signaling
- Authentification et autorisation
- Gestion des sessions en mémoire
- Tests automatisés
