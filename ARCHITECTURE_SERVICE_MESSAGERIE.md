# 🏗️ Architecture du Service de Messagerie

## 📋 Vue d'ensemble

Le service de messagerie est composé de plusieurs couches qui gèrent la communication en temps réel entre patients et médecins, incluant la messagerie textuelle et les appels WebRTC.

## 🏛️ Architecture générale

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Components Layer                                          │
│  ├── ChatMessage.js          # Interface complète         │
│  ├── MessagingWidget.js      # Widget compact             │
│  ├── MessagingButton.js      # Bouton déclencheur         │
│  └── WebRTCWidget.js         # Interface WebRTC           │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                            │
│  └── signalingService.js     # Service de signalisation   │
├─────────────────────────────────────────────────────────────┤
│  Communication Layer                                       │
│  ├── WebSocket (HTTPS:3443)  # Temps réel                 │
│  └── REST API (HTTP:3000)    # Données persistantes       │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Composants principaux

### 1. **ChatMessage.js** - Interface complète
```javascript
// Props principales
{
  userId: number,           // ID utilisateur
  role: 'patient'|'medecin', // Rôle utilisateur
  token: string,            // Token d'authentification
  conversationId: number,   // ID conversation
  medecinId: number,        // ID médecin (optionnel)
  patientId: number         // ID patient (optionnel)
}
```

### 2. **MessagingWidget.js** - Widget compact
```javascript
// Props principales
{
  userId: number,
  role: 'patient'|'medecin',
  token: string,
  conversationId: number,
  toUserId: number,         // Destinataire
  onClose: function         // Callback fermeture
}
```

### 3. **WebRTCWidget.js** - Interface WebRTC
```javascript
// Props principales
{
  conversationId: number,   // ID conversation
  isInitiator: boolean,     // Initiateur de l'appel
  initialConferenceLink: string, // Lien conférence
  onClose: function         // Callback fermeture
}
```

## 📡 Service de Signalisation (signalingService.js)

### Configuration
```javascript
class SignalingService {
  baseURL = 'https://192.168.4.81:3443';    // WebSocket HTTPS
  apiBaseURL = 'http://192.168.4.81:3000';  // REST API HTTP
  
  // Configuration Socket.IO
  socket = io(baseURL, {
    transports: ['websocket', 'polling'],
    rejectUnauthorized: false,  // Certificats auto-signés
    timeout: 20000,
    forceNew: true,
    secure: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
}
```

## 📨 Formats de données - Messages

### 1. **Envoi de message (REST API)**
```javascript
// Endpoint: POST /api/messaging/conversations/{conversationId}/messages
{
  "contenu": "Contenu du message",
  "type_message": "texte",  // texte|image|file|audio
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "sender_id": 123,
    "conversation_id": 456
  }
}
```

### 2. **Réponse serveur - Message envoyé**
```javascript
{
  "success": true,
  "data": {
    "message": {
      "id": 789,
      "contenu": "Contenu du message",
      "type_message": "texte",
      "expediteur_id": 123,
      "conversation_id": 456,
      "timestamp": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 3. **Message reçu (WebSocket)**
```javascript
// Événement: 'new_message'
{
  "id": 789,
  "contenu": "Contenu du message",
  "type_message": "texte",
  "expediteur_id": 123,
  "conversation_id": 456,
  "timestamp": "2024-01-15T10:30:00Z",
  "sender": {
    "id": 123,
    "type": "medecin",
    "nom": "Dr. Dupont"
  }
}
```

### 4. **Format message formaté (Frontend)**
```javascript
{
  "id": 789,
  "sender": "medecin",        // patient|medecin
  "content": "Contenu du message",
  "timestamp": "2024-01-15T10:30:00Z",
  "type": "texte"            // texte|image|file|audio
}
```

## 🎥 Formats de données - WebRTC

### 1. **Création de session WebRTC (MÉDECIN)**
```javascript
// Endpoint: POST /api/messaging/webrtc/sessions?generate_conference_link=true
// Initié par: MÉDECIN uniquement
{
  "conversation_id": "temp_conv_11_79",
  "session_type": "audio_video",  // audio_video|audio_only
  "sdp_offer": null,             // null pour création
  "initiator": {
    "userType": "medecin",
    "userId": 79
  }
}
```

### 2. **Réponse - Session créée**
```javascript
{
  "status": "success",
  "data": {
    "session": {
      "id": 193,
      "conversation_id": 803921,
      "session_type": "audio_video",
      "statut": "initiating"
    },
    "conferenceLink": {
      "sessionId": 193,
      "conferenceUrl": "https://192.168.4.81:3443/conference/193",
      "joinCode": "81392D21",
      "fullLink": "https://192.168.4.81:3443/conference/193?code=81392D21"
    }
  }
}
```

### 3. **Offre WebRTC (WebSocket)**
```javascript
// Événement: 'webrtc_offer'
{
  "sessionId": 193,
  "conversationId": 803921,
  "sdpOffer": "v=0\r\no=- 1234567890 2 IN IP4 127.0.0.1\r\n...",
  "sessionType": "audio_video",
  "from": {
    "userId": 79,
    "userType": "medecin"
  }
}
```

### 4. **Réponse WebRTC (WebSocket)**
```javascript
// Événement: 'webrtc_answer'
{
  "sessionId": 193,
  "sdpAnswer": "v=0\r\no=- 9876543210 2 IN IP4 127.0.0.1\r\n...",
  "from": {
    "userId": 123,
    "userType": "patient"
  }
}
```

### 5. **Candidats ICE (WebSocket)**
```javascript
// Événement: 'webrtc_ice_candidates'
{
  "sessionId": 193,
  "candidates": [
    {
      "candidate": "candidate:1 1 UDP 2113667326 192.168.1.100 54400 typ host",
      "sdpMLineIndex": 0,
      "sdpMid": "0"
    }
  ],
  "from": {
    "userId": 79,
    "userType": "medecin"
  }
}
```

### 6. **Rejoindre une conversation (WebSocket)**
```javascript
// Événement: 'join_conversation'
{
  "conversationId": 803921,
  "user": {
    "userId": 79,
    "userType": "medecin",
    "role": "medecin"
  }
}
```

### 7. **Demande d'offre WebRTC (PATIENT)**
```javascript
// Événement: 'request_webrtc_offer'
// Initié par: PATIENT qui rejoint la conférence
{
  "code": "81392D21",        // Code d'accès fourni par le médecin
  "sessionId": 193,          // ID de session de la conférence
  "user": {
    "userId": 123,
    "userType": "patient"    // Toujours "patient" pour cette demande
  },
  "action": "join_conference" // Action demandée
}
```

## 🔄 Flux de communication

### **Flux de messagerie textuelle**
```
1. Client → REST API: POST /api/messaging/conversations/{id}/messages
2. Serveur → Base de données: Sauvegarde message
3. Serveur → WebSocket: Émission 'new_message'
4. Clients connectés → Réception message temps réel
```

### **Flux WebRTC - Création de conférence (MÉDECIN)**
```
1. MÉDECIN → REST API: POST /api/messaging/webrtc/sessions?generate_conference_link=true
2. Serveur → Génération lien conférence + code d'accès
3. MÉDECIN → Reçoit: { sessionId, conferenceUrl, joinCode, fullLink }
4. MÉDECIN → Partage le lien avec le patient
5. MÉDECIN → WebSocket: 'webrtc_offer' + SDP (en attente du patient)
6. Connexion → WebRTC PeerConnection établie
```

### **Flux WebRTC - Rejoindre la conférence (PATIENT)**
```
1. PATIENT → URL: https://192.168.4.81:3001/conference/193?code=81392D21
2. PATIENT → WebSocket: 'request_webrtc_offer' + code d'accès
3. MÉDECIN → WebSocket: 'webrtc_offer' + SDP (réponse à la demande)
4. PATIENT → WebSocket: 'webrtc_answer' + SDP
5. Échange → WebSocket: 'webrtc_ice_candidates' (bidirectionnel)
6. Connexion → WebRTC PeerConnection établie
```

### **Rôles et responsabilités**

#### **MÉDECIN (Créateur de conférence)**
- ✅ **Crée la session WebRTC** via REST API
- ✅ **Reçoit le lien de conférence** avec code d'accès
- ✅ **Partage le lien** avec le patient (SMS, email, etc.)
- ✅ **Initie l'offre WebRTC** en attente du patient
- ✅ **Gère la session** (début, fin, contrôles)

#### **PATIENT (Participant à la conférence)**
- ✅ **Reçoit le lien** de conférence du médecin
- ✅ **Accède à l'URL** de conférence
- ✅ **Demande l'offre WebRTC** via le code d'accès
- ✅ **Répond à l'offre** avec sa propre SDP
- ✅ **Participe à la conférence** une fois connecté

### **Séquence temporelle détaillée**

```
Temps 0: MÉDECIN crée la conférence
├── POST /api/messaging/webrtc/sessions?generate_conference_link=true
├── Serveur génère: sessionId=193, joinCode=81392D21
└── MÉDECIN reçoit: https://192.168.4.81:3001/conference/193?code=81392D21

Temps 1: MÉDECIN partage le lien
├── MÉDECIN envoie le lien au PATIENT
└── MÉDECIN attend la connexion du patient

Temps 2: PATIENT rejoint la conférence
├── PATIENT clique sur le lien
├── PATIENT accède à: https://192.168.4.81:3001/conference/193?code=81392D21
└── PATIENT émet: 'request_webrtc_offer' avec code=81392D21

Temps 3: Établissement de la connexion WebRTC
├── MÉDECIN reçoit la demande et émet: 'webrtc_offer' + SDP
├── PATIENT reçoit l'offre et émet: 'webrtc_answer' + SDP
├── Échange bidirectionnel: 'webrtc_ice_candidates'
└── Connexion WebRTC établie
```

### **Contrôles d'accès et sécurité**

#### **Validation du code d'accès**
```javascript
// Le serveur valide que le code appartient à une session active
{
  "conferenceCode": "81392D21",
  "sessionId": 193,
  "isValid": true,
  "expiresAt": "2024-01-15T12:00:00Z",
  "createdBy": {
    "userType": "medecin",
    "userId": 79
  }
}
```

#### **Permissions par rôle**
- **MÉDECIN** : Peut créer, gérer et terminer les conférences
- **PATIENT** : Peut uniquement rejoindre avec un code valide
- **Sécurité** : Un patient ne peut pas créer de conférence

## 🔐 Authentification

### **Tokens utilisés**
```javascript
// Récupération automatique depuis localStorage
{
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  patient: { id_patient: 123, nom: "Dupont", prenom: "Jean" },
  medecin: { id_professionnel: 79, nom: "Martin", prenom: "Dr." }
}
```

### **Headers d'authentification**
```javascript
// REST API
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}

// WebSocket
{
  "auth": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userType": "medecin",
    "userId": 79,
    "role": "medecin"
  }
}
```

## 🎯 Types de messages supportés

```javascript
export const MESSAGE_TYPES = {
  TEXT: 'texte',      // Message texte
  IMAGE: 'image',     // Image
  FILE: 'file',       // Fichier
  AUDIO: 'audio'      // Message vocal
};

export const MESSAGING_TYPES = {
  PRIVATE: 'private', // Conversation privée
  GROUP: 'group'      // Conversation de groupe
};
```

## 🔧 Configuration des ports

```javascript
// URLs de service
const CONFIG = {
  WEBSOCKET_URL: 'https://192.168.4.81:3443',  // WebSocket HTTPS
  API_URL: 'http://192.168.4.81:3000',         // REST API HTTP
  FRONTEND_URL: 'https://192.168.4.81:3001'    // React HTTPS
};
```

Cette architecture permet une communication bidirectionnelle en temps réel entre patients et médecins, avec support complet pour la messagerie textuelle et les appels vidéo WebRTC.
