// services/webrtc.service.js
import io from 'socket.io-client';

/**
 * Service WebRTC côté client
 * Gère les connexions peer-to-peer et les flux vidéo
 */
class WebRTCService {
  constructor() {
    this.socket = null;
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.webrtcConfig = null;
    this.isConnected = false;
    this.isMuted = false;
    this.isVideoOff = false;
    this.conferenceCode = null;
    this.userType = null;
    this.user = null;
    this.token = null;
    this.serverUrl = 'http://localhost:3000';
    
    // Callbacks pour les événements
    this.onConnectionChange = null;
    this.onParticipantJoined = null;
    this.onParticipantLeft = null;
    this.onRemoteStream = null;
    this.onError = null;
  }

  /**
   * Initialiser le service WebRTC
   */
  async initialize(token, conferenceCode, userType, user) {
    try {
      this.token = token;
      this.conferenceCode = conferenceCode;
      this.userType = userType;
      this.user = user;

      console.log('✅ [WebRTC Service] Service initialisé');
      return true;

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur initialisation:', error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Charger la configuration WebRTC depuis le serveur
   */
  async loadWebRTCConfig(token) {
    try {
      const response = await fetch(`${this.serverUrl}/api/webrtc/config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur configuration: ${response.status}`);
      }

      const data = await response.json();
      this.webrtcConfig = data.data;
      console.log('🔧 [WebRTC Service] Configuration chargée');

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur chargement config:', error);
      throw error;
    }
  }

  /**
   * Obtenir les patients autorisés pour le médecin
   * (patients avec prescriptions actives)
   */
  async getAuthorizedPatients() {
    try {
      console.log('📋 [WebRTC Service] Récupération des patients autorisés avec prescriptions actives...');
      console.log('🔑 [WebRTC Service] Token utilisé:', this.token ? 'Présent' : 'Manquant');
      console.log('🌐 [WebRTC Service] URL serveur:', this.serverUrl);
      
      // Utiliser la route dédiée pour les patients autorisés
      console.log('📡 [WebRTC Service] Appel API /api/webrtc/patients-authorized...');
      const response = await fetch(`${this.serverUrl}/api/webrtc/patients-authorized`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 [WebRTC Service] Réponse patients autorisés:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [WebRTC Service] Erreur détaillée:', errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 [WebRTC Service] Structure de données reçue:', data);
      
      // Extraire les patients de la réponse
      let patients = [];
      if (Array.isArray(data)) {
        patients = data;
      } else if (data.data && Array.isArray(data.data)) {
        patients = data.data;
      } else if (data.patients && Array.isArray(data.patients)) {
        patients = data.patients;
      } else if (data.results && Array.isArray(data.results)) {
        patients = data.results;
      } else {
        console.warn('⚠️ [WebRTC Service] Structure de données inattendue, tentative d\'extraction...');
        // Essayer d'extraire le premier tableau trouvé
        for (const key in data) {
          if (Array.isArray(data[key])) {
            patients = data[key];
            break;
          }
        }
      }

      // Validation finale
      if (!Array.isArray(patients)) {
        console.error('❌ [WebRTC Service] Impossible d\'extraire un tableau de patients:', data);
        throw new Error('Format de données invalide: aucun tableau de patients trouvé');
      }

      console.log('✅ [WebRTC Service] Patients autorisés récupérés:', patients.length);
      return patients;

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur chargement patients autorisés:', error);
      throw error;
    }
  }

  /**
   * Créer une conférence (médecin)
   */
  async createConference(patientId, sessionType = 'consultation', expiryHours = 24) {
    try {
      // ✅ VALIDATION : Vérifier que patientId est un nombre
      if (!patientId || isNaN(parseInt(patientId))) {
        throw new Error('ID du patient invalide. Veuillez sélectionner un patient valide.');
      }

      // ✅ CONVERSION : Convertir en nombre
      const numericPatientId = parseInt(patientId);

      const response = await fetch(`${this.serverUrl}/api/webrtc/conferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: numericPatientId,  // ✅ Nombre au lieu de string
          sessionType: sessionType,
          expiryHours: expiryHours
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [WebRTC Service] Conférence créée:', data.data);
      return data.data;

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur création conférence:', error);
      throw error;
    }
  }

  /**
   * Rejoindre une conférence par code (patient)
   */
  async joinConferenceByCode(code) {
    try {
      const response = await fetch(`${this.serverUrl}/api/webrtc/conferences/${code}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [WebRTC Service] Conférence rejointe:', data.data);
      return data.data;

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur join conférence:', error);
      throw error;
    }
  }

  /**
   * Lister les conférences de l'utilisateur
   */
  async getUserConferences() {
    try {
      const response = await fetch(`${this.serverUrl}/api/webrtc/conferences`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur liste conférences:', error);
      throw error;
    }
  }

  /**
   * Obtenir les détails d'une conférence
   */
  async getConferenceDetails(conferenceId) {
    try {
      const response = await fetch(`${this.serverUrl}/api/webrtc/conferences/${conferenceId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      return data.data;

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur détails conférence:', error);
      throw error;
    }
  }

  /**
   * Terminer une conférence
   */
  async endConference(conferenceId) {
    try {
      const response = await fetch(`${this.serverUrl}/api/webrtc/conferences/${conferenceId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [WebRTC Service] Conférence terminée');
      return data.data;

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur terminer conférence:', error);
      throw error;
    }
  }

  /**
   * Tester la connectivité avec le serveur
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.serverUrl}/api/webrtc/config`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [WebRTC Service] Test de connexion réussi:', data);
      return { success: true, data };

    } catch (error) {
      console.error('❌ [WebRTC Service] Test de connexion échoué:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialiser la connexion WebSocket
   */
  initializeSocket(token) {
    this.socket = io(this.serverUrl, {
      transports: ['websocket'],
      autoConnect: false
    });

    // Événements de connexion
    this.socket.on('connect', () => {
      console.log('🔌 [WebRTC Service] WebSocket connecté');
      this.authenticate(token);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 [WebRTC Service] WebSocket déconnecté');
      this.isConnected = false;
      this.triggerConnectionChange(false);
    });

    // Événements d'authentification
    this.socket.on('authenticated', (data) => {
      console.log('🔐 [WebRTC Service] Authentifié:', data.user.type);
      this.joinRoom();
    });

    this.socket.on('auth-error', (error) => {
      console.error('❌ [WebRTC Service] Erreur auth:', error);
      this.handleError(new Error(error.message));
    });

    // Événements de salle
    this.socket.on('room-joined', (data) => {
      console.log('🎥 [WebRTC Service] Rejoint la salle:', data.conferenceCode);
      this.isConnected = true;
      this.triggerConnectionChange(true);
      this.triggerParticipantJoined(data.participants);
    });

    this.socket.on('participant-joined', (data) => {
      console.log('👋 [WebRTC Service] Participant rejoint:', data.participantId);
      this.triggerParticipantJoined([data]);
    });

    this.socket.on('participant-left', (data) => {
      console.log('👋 [WebRTC Service] Participant parti:', data.participantId);
      this.triggerParticipantLeft(data);
    });

    this.socket.on('participant-disconnected', (data) => {
      console.log('🔌 [WebRTC Service] Participant déconnecté:', data.participantId);
      this.triggerParticipantLeft(data);
    });

    // Événements WebRTC
    this.socket.on('offer', (data) => {
      this.handleOffer(data);
    });

    this.socket.on('answer', (data) => {
      this.handleAnswer(data);
    });

    this.socket.on('ice-candidate', (data) => {
      this.handleIceCandidate(data);
    });

    // Événements de contrôles
    this.socket.on('audio-toggled', (data) => {
      console.log('🔇 [WebRTC Service] Audio toggled:', data);
    });

    this.socket.on('video-toggled', (data) => {
      console.log('📹 [WebRTC Service] Vidéo toggled:', data);
    });

    this.socket.on('conference-force-closed', (data) => {
      console.log('🔒 [WebRTC Service] Conférence fermée:', data.reason);
      this.leaveConference();
    });

    // Événements d'erreur
    this.socket.on('error', (error) => {
      console.error('❌ [WebRTC Service] Erreur socket:', error);
      this.handleError(new Error(error.message));
    });

    // Connecter le socket
    this.socket.connect();
  }

  /**
   * S'authentifier auprès du serveur
   */
  authenticate(token) {
    this.socket.emit('authenticate', {
      token: token,
      conferenceCode: this.conferenceCode
    });
  }

  /**
   * Rejoindre une salle de conférence
   */
  joinRoom() {
    this.socket.emit('join-room', {
      conferenceCode: this.conferenceCode,
      userType: this.userType
    });
  }

  /**
   * Initialiser les flux média
   */
  async initializeMedia() {
    try {
      const constraints = {
        video: {
          width: this.webrtcConfig.videoConstraints.width,
          height: this.webrtcConfig.videoConstraints.height,
          frameRate: this.webrtcConfig.videoConstraints.frameRate
        },
        audio: this.webrtcConfig.audioConstraints
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('📹 [WebRTC Service] Flux média initialisé');

      // Créer la connexion peer-to-peer
      this.createPeerConnection();

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur flux média:', error);
      throw error;
    }
  }

  /**
   * Créer la connexion peer-to-peer
   */
  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.webrtcConfig);

    // Ajouter le flux local
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    // Gérer les flux distants
    this.peerConnection.ontrack = (event) => {
      console.log('📺 [WebRTC Service] Flux distant reçu');
      this.remoteStream = event.streams[0];
      this.triggerRemoteStream(this.remoteStream);
    };

    // Gérer les candidats ICE
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          conferenceCode: this.conferenceCode,
          candidate: event.candidate,
          targetParticipant: 'all'
        });
      }
    };

    // Gérer les changements de connexion
    this.peerConnection.onconnectionstatechange = () => {
      console.log('�� [WebRTC Service] État connexion:', this.peerConnection.connectionState);
      this.isConnected = this.peerConnection.connectionState === 'connected';
      this.triggerConnectionChange(this.isConnected);
    };

    console.log('🔗 [WebRTC Service] Connexion peer-to-peer créée');
  }

  /**
   * Gérer les offres WebRTC
   */
  async handleOffer(data) {
    try {
      if (!this.peerConnection) {
        this.createPeerConnection();
      }

      await this.peerConnection.setRemoteDescription(data.offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.socket.emit('answer', {
        conferenceCode: this.conferenceCode,
        answer: answer,
        targetParticipant: data.from
      });

      console.log('📤 [WebRTC Service] Réponse envoyée');

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur handle-offer:', error);
      this.handleError(error);
    }
  }

  /**
   * Gérer les réponses WebRTC
   */
  async handleAnswer(data) {
    try {
      if (!this.peerConnection) {
        return;
      }

      await this.peerConnection.setRemoteDescription(data.answer);
      console.log('📥 [WebRTC Service] Réponse reçue');

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur handle-answer:', error);
      this.handleError(error);
    }
  }

  /**
   * Gérer les candidats ICE
   */
  async handleIceCandidate(data) {
    try {
      if (!this.peerConnection) {
        return;
      }

      await this.peerConnection.addIceCandidate(data.candidate);
      console.log('�� [WebRTC Service] Candidat ICE ajouté');

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur handle-ice-candidate:', error);
    }
  }

  /**
   * Démarrer une conférence (médecin)
   */
  async startConference() {
    try {
      if (this.userType !== 'medecin') {
        throw new Error('Seuls les médecins peuvent démarrer une conférence');
      }

      if (!this.peerConnection) {
        this.createPeerConnection();
      }

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.socket.emit('offer', {
        conferenceCode: this.conferenceCode,
        offer: offer,
        targetParticipant: 'all'
      });

      console.log('🎥 [WebRTC Service] Conférence démarrée');

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur start-conference:', error);
      this.handleError(error);
    }
  }

  /**
   * Basculer l'audio
   */
  toggleAudio() {
    if (!this.localStream) {
      return;
    }

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isMuted = !audioTrack.enabled;

      this.socket.emit('toggle-audio', {
        conferenceCode: this.conferenceCode,
        isMuted: this.isMuted
      });

      console.log(`🔇 [WebRTC Service] Audio ${this.isMuted ? 'coupé' : 'activé'}`);
    }
  }

  /**
   * Basculer la vidéo
   */
  toggleVideo() {
    if (!this.localStream) {
      return;
    }

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isVideoOff = !videoTrack.enabled;

      this.socket.emit('toggle-video', {
        conferenceCode: this.conferenceCode,
        isVideoOff: this.isVideoOff
      });

      console.log(`📹 [WebRTC Service] Vidéo ${this.isVideoOff ? 'coupée' : 'activée'}`);
    }
  }

  /**
   * Quitter la conférence
   */
  leaveConference() {
    try {
      if (this.socket) {
        this.socket.emit('leave-room', {
          conferenceCode: this.conferenceCode
        });
      }

      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      this.isConnected = false;
      this.triggerConnectionChange(false);

      console.log('👋 [WebRTC Service] Conférence quittée');

    } catch (error) {
      console.error('❌ [WebRTC Service] Erreur leave-conference:', error);
    }
  }

  /**
   * Nettoyer les ressources
   */
  cleanup() {
    this.leaveConference();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.remoteStream = null;
    this.conferenceCode = null;
    this.userType = null;
    this.user = null;
    this.token = null;
  }

  /**
   * Définir les callbacks
   */
  setCallbacks(callbacks) {
    this.onConnectionChange = callbacks.onConnectionChange;
    this.onParticipantJoined = callbacks.onParticipantJoined;
    this.onParticipantLeft = callbacks.onParticipantLeft;
    this.onRemoteStream = callbacks.onRemoteStream;
    this.onError = callbacks.onError;
  }

  /**
   * Déclencher les callbacks
   */
  triggerConnectionChange(connected) {
    if (this.onConnectionChange) {
      this.onConnectionChange(connected);
    }
  }

  triggerParticipantJoined(participants) {
    if (this.onParticipantJoined) {
      this.onParticipantJoined(participants);
    }
  }

  triggerParticipantLeft(participant) {
    if (this.onParticipantLeft) {
      this.onParticipantLeft(participant);
    }
  }

  triggerRemoteStream(stream) {
    if (this.onRemoteStream) {
      this.onRemoteStream(stream);
    }
  }

  handleError(error) {
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Getters
   */
  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }

  getIsConnected() {
    return this.isConnected;
  }

  getIsMuted() {
    return this.isMuted;
  }

  getIsVideoOff() {
    return this.isVideoOff;
  }
}

export default WebRTCService;