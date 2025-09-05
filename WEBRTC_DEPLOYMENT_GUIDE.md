# 🚀 Guide de Déploiement WebRTC - Application de Santé

## 📋 Vue d'ensemble

Ce guide explique comment déployer et utiliser le système WebRTC pour les appels vidéo entre médecins et patients.

## 🛠️ Architecture

### Serveur Principal (Port 3000)
- **API REST** : API principale de l'application
- **Messagerie** : Gestion des messages

### Serveur WebRTC (Port 3443)
- **API REST** : Gestion des sessions WebRTC
- **WebSocket** : Signaling en temps réel
- **Authentification** : Validation des utilisateurs

### Frontend React (Port 3001)
- **Interface utilisateur** : Boutons d'appel et interface vidéo
- **WebRTC Client** : Gestion des flux audio/vidéo
- **Socket.IO Client** : Communication avec le serveur

## 🚀 Démarrage Rapide

### 1. Démarrer le Serveur WebRTC

#### Option A: Windows
```cmd
start-webrtc.bat
```

#### Option B: Linux/Mac
```bash
./start-webrtc.sh
```

#### Option C: Manuel
```bash
# Installer les dépendances
npm install express socket.io cors

# Démarrer le serveur
node server.js
```

### 2. Démarrer le Frontend React

```bash
# Dans un nouveau terminal
npm start
```

### 3. Tester la Connexion

```bash
# Tester le serveur WebRTC
node test-server.js
```

## 📡 Endpoints API

### Configuration WebRTC
```
GET http://localhost:3443/api/webrtc/config
```

### Créer une Session
```
POST http://localhost:3443/api/webrtc/sessions
Content-Type: application/json

{
  "medecinId": "medecin_123",
  "patientId": "patient_456",
  "sessionType": "video"
}
```

### Rejoindre une Conférence
```
GET http://localhost:3443/api/webrtc/join/ABC123?userId=medecin_123&userType=medecin
```

## 🔌 WebSocket Events

### Côté Client
- `webrtc:join` - Rejoindre une session
- `webrtc:offer` - Envoyer une offre WebRTC
- `webrtc:answer` - Envoyer une réponse WebRTC
- `webrtc:ice-candidate` - Envoyer un candidat ICE

### Côté Serveur
- `webrtc:participant_joined` - Participant rejoint
- `webrtc:participant_left` - Participant quitté
- `webrtc:offer` - Offre WebRTC reçue
- `webrtc:answer` - Réponse WebRTC reçue
- `webrtc:ice-candidate` - Candidat ICE reçu

## 🎯 Utilisation dans l'Application

### 1. Page Médecin
- **Bouton d'appel** : Dans l'interface de messagerie
- **Options** : Appel vidéo ou audio
- **Interface** : Plein écran avec contrôles

### 2. Fonctionnalités
- **Appel vidéo** : Caméra + micro
- **Appel audio** : Micro uniquement
- **Contrôles** : Couper/activer vidéo/audio
- **Plein écran** : Mode plein écran
- **Terminer** : Fin d'appel

## 🔧 Configuration

### Variables d'Environnement
```bash
# Serveur WebRTC
PORT=3000
NODE_ENV=development

# Frontend
REACT_APP_MAIN_SERVER=http://localhost:3000
REACT_APP_API_URL=http://localhost:3000/api
```

### Configuration WebRTC
```javascript
const webrtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};
```

## 🧪 Tests

### Test du Serveur
```bash
node test-server.js
```

### Test Frontend
1. Ouvrir http://localhost:3001
2. Se connecter comme médecin
3. Aller dans la messagerie
4. Sélectionner un patient
5. Cliquer sur "Appel"
6. Choisir "Appel vidéo" ou "Appel audio"

## 🔒 Sécurité

### Authentification
- **Token JWT** : Validation des utilisateurs
- **Autorisation** : Vérification des permissions
- **Sessions** : Gestion des sessions actives

### Validation
- **Médecin** : Peut créer des sessions
- **Patient** : Peut rejoindre les sessions
- **Codes de conférence** : Uniques et temporaires

## 📊 Monitoring

### Logs Serveur
```bash
# Logs détaillés
DEBUG=* node server.js
```

### Endpoint de Test
```
GET http://localhost:3000/api/test
```

### Métriques
- Sessions actives
- Conferences actives
- Participants connectés

## 🚨 Dépannage

### Problèmes Courants

#### 1. Serveur ne démarre pas
```bash
# Vérifier le port
netstat -an | findstr :3000

# Changer le port
PORT=3001 node server.js
```

#### 2. WebSocket ne se connecte pas
- Vérifier CORS
- Vérifier l'URL du serveur
- Vérifier les ports

#### 3. WebRTC ne fonctionne pas
- Vérifier les permissions caméra/micro
- Vérifier HTTPS en production
- Vérifier les serveurs STUN

#### 4. Erreurs d'authentification
- Vérifier le token JWT
- Vérifier les headers Authorization
- Vérifier les permissions utilisateur

### Logs de Débogage
```javascript
// Frontend
localStorage.setItem('debug', 'webrtc:*');

// Serveur
DEBUG=webrtc:* node server.js
```

## 📈 Production

### Déploiement
```bash
# PM2
npm install -g pm2
pm2 start server.js --name "webrtc-server"

# Docker
docker build -t webrtc-server .
docker run -p 3000:3000 webrtc-server
```

### Configuration Production
- **HTTPS** : Obligatoire pour WebRTC
- **Certificats SSL** : Valides
- **Serveurs TURN** : Pour NAT/Firewall
- **Monitoring** : Logs et métriques

## 📝 Changelog

### v1.0.0
- ✅ Serveur WebRTC avec Express + Socket.IO
- ✅ API REST pour les sessions
- ✅ WebSocket signaling
- ✅ Interface React complète
- ✅ Authentification et autorisation
- ✅ Tests automatisés
- ✅ Documentation complète

## 🎉 Fonctionnalités Implémentées

### ✅ Serveur Backend
- [x] Routes API WebRTC
- [x] WebSocket signaling
- [x] Gestion des sessions
- [x] Authentification
- [x] Tests automatisés

### ✅ Frontend React
- [x] Hook useWebRTC
- [x] Composant WebRTCCallButton
- [x] Interface WebRTCInterface
- [x] Intégration page médecin
- [x] Gestion des erreurs

### ✅ Fonctionnalités
- [x] Appels vidéo
- [x] Appels audio
- [x] Contrôles (vidéo/audio)
- [x] Plein écran
- [x] Gestion des participants
- [x] Fin d'appel

## 🚀 Prêt pour la Production !

Le système WebRTC est maintenant complètement implémenté et prêt à être utilisé. Suivez le guide de démarrage pour tester les fonctionnalités.
