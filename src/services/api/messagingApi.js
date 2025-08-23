import axios from "axios";
import { io } from 'socket.io-client';

const API_URL = "http://localhost:3000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const candidates = [
            localStorage.getItem('originalJWT'),
            localStorage.getItem('firstConnectionToken'),
            localStorage.getItem('jwt'),
            localStorage.getItem('token'),
        ];
        
        const usedToken = candidates.find(t => t && t.startsWith('eyJ') && t.length > 100);
        
        if (usedToken) {
            config.headers.Authorization = `Bearer ${usedToken}`;
        } else {
            console.warn('⚠️ [messagingApi] Aucun JWT valide disponible pour l\'authentification');
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// SUPPRIMÉE : La fonction autonome est retirée d'ici. La logique est maintenant DANS la classe.

/**
 * Service de messagerie unifié (API REST + WebSocket)
 */
class MessagingService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageCallbacks = new Set();
  }

  // ===== GESTION WEBSOCKET ET UTILISATEUR =====

  /**
   * CORRIGÉE : C'est maintenant la seule et unique version de la fonction.
   * Décode le token JWT pour obtenir les infos de l'utilisateur.
   * Cette méthode est publique pour que les hooks puissent l'utiliser.
   */
  getCurrentUserFromToken() {
    try {
        // On utilise bien la version robuste qui cherche dans tous les tokens.
        const candidates = [
            localStorage.getItem('originalJWT'),
            localStorage.getItem('firstConnectionToken'),
            localStorage.getItem('jwt'),
            localStorage.getItem('token'),
        ];
        
        const token = candidates.find(t => t && t.startsWith('eyJ'));

        if (!token) {
            console.warn("⚠️ [messagingApi] Aucun token trouvé pour identifier l'utilisateur.");
            return null;
        }

        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            id: payload.id_professionnel || payload.id_patient || payload.id,
            role: payload.role
        };
    } catch (e) {
        console.error("❌ [messagingApi] Erreur lors du décodage du token :", e);
        return null;
    }
  }

  connectWebSocket() {
    if (this.socket && this.isConnected) {
      console.log('🔌 [messagingApi] WebSocket déjà connecté.');
      return;
    }

    // Récupère le premier token valide pour l'authentification WebSocket
    const token = [
        localStorage.getItem('originalJWT'),
        localStorage.getItem('firstConnectionToken'),
        localStorage.getItem('jwt'),
        localStorage.getItem('token'),
    ].find(t => t && t.startsWith('eyJ'));

    if (!token) {
      console.error('❌ [messagingApi] Impossible de se connecter au WebSocket : token manquant.');
      return;
    }

    console.log('🔄 [messagingApi] Tentative de connexion WebSocket...');
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 5000,
      auth: { token }
    });

    this.setupWebSocketEventListeners();
  }

  setupWebSocketEventListeners() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log(`✅ [messagingApi] WebSocket connecté avec l'ID: ${this.socket.id}`);
      
      // L'appel `this.getCurrentUserFromToken()` appelle maintenant la bonne méthode de classe.
      const user = this.getCurrentUserFromToken();
      if (user) {
        this.socket.emit('authenticate', {
            userId: user.id,
            userType: user.role,
            role: user.role
        });
      }
    });
    
    this.socket.on('authenticated', (data) => console.log(`✅ [messagingApi] WebSocket authentifié:`, data.message));
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.warn(`🔌 [messagingApi] WebSocket déconnecté: ${reason}`);
    });
    this.socket.on('connect_error', (error) => console.error('❌ [messagingApi] Erreur de connexion WebSocket:', error.message));
    this.socket.on('new_message', (data) => {
      console.log('📨 [messagingApi] Nouveau message reçu via WebSocket:', data);
      const normalizedMessage = this.normalizeMessages([data.message])[0];
      this.messageCallbacks.forEach(callback => callback(normalizedMessage));
    });
    this.socket.on('error', (error) => console.error('❌ [messagingApi] Erreur du serveur WebSocket:', error.message));
  }
  
  onNewMessage(callback) {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  joinConversation(conversationId) {
    if (this.isConnected) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  disconnectWebSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // ===== MÉTHODES API REST (inchangées) =====

  async getMedecinConversations(medecinId) {
    try {
      const response = await api.get(`/messaging/medecin/${medecinId}/conversations`);
      if (response.data.status === 'success') {
        return this.normalizeConversations(response.data.data.conversations);
      }
      return [];
    } catch (error) {
      throw this.handleApiError(error, 'récupération des conversations médecin');
    }
  }

  async getConversationMessages(conversationId) {
    try {
      const response = await api.get(`/messaging/conversation/${conversationId}/messages`);
      if (response.data.status === 'success') {
        return {
          conversation: response.data.data.conversation,
          messages: this.normalizeMessages(response.data.data.messages),
          pagination: response.data.data.pagination
        };
      }
      return { conversation: null, messages: [], pagination: null };
    } catch (error) {
      throw this.handleApiError(error, 'récupération des messages');
    }
  }

  async sendMessageToConversation(conversationId, messageData) {
    try {
      const response = await api.post(`/messaging/conversation/${conversationId}/message`, messageData);
      if (response.data.status === 'success') {
        return this.normalizeMessages([response.data.data.message])[0];
      }
      return response.data;
    } catch (error) {
      console.error("❌ [messagingApi] L'envoi du message a échoué. Cause probable : erreur serveur (500).", error);
      throw this.handleApiError(error, 'envoi du message');
    }
  }

  async getMessageHistory(contextType, contextId) {
    try {
      const response = await api.get(`/messaging/history/${contextType}/${contextId}`);
      if (response.data.status === 'success') {
        return {
            ...response.data.data,
            messages: this.normalizeMessages(response.data.data.messages || [])
        };
      }
       return { conversation: null, messages: [], pagination: null };
    } catch (error) {
      throw this.handleApiError(error, `récupération de l'historique ${contextType}`);
    }
  }
  
  // ===== NORMALISATION ET UTILITAIRES (inchangés) =====

  normalizeConversations(apiConversations) {
    if (!Array.isArray(apiConversations)) return [];
    return apiConversations.map(conv => ({
      id: conv.id_conversation,
      titre: conv.titre,
      lastActivity: conv.date_modification,
      patient: conv.patient || { id: 'unknown', nom: 'Patient', prenom: 'Inconnu' },
      medecin: conv.medecin || { id: 'unknown', nom: 'Médecin', prenom: 'Inconnu' },
      lastMessage: conv.dernier_message ? {
        content: conv.dernier_message.contenu,
        timestamp: conv.dernier_message.date_envoi,
        sender: { type: conv.dernier_message.expediteur_type }
      } : null,
      contextType: this.extractContextFromTitle(conv.titre),
      contextId: this.extractContextIdFromTitle(conv.titre),
    }));
  }

  normalizeMessages(apiMessages) {
    if (!Array.isArray(apiMessages)) return [];
    return apiMessages.map(msg => ({
      id: msg.id_message,
      content: msg.contenu,
      timestamp: msg.date_envoi,
      status: msg.statut === 'envoyé' ? 'sent' : msg.statut,
      expediteur_info: msg.expediteur_info || { id: msg.expediteur_id, type: msg.expediteur_type, nom: 'Inconnu' },
      sender: {
        id: msg.expediteur_info?.id || msg.expediteur_id,
        type: msg.expediteur_info?.type || msg.expediteur_type,
        name: `${msg.expediteur_info?.prenom || ''} ${msg.expediteur_info?.nom || 'Utilisateur'}`.trim()
      }
    }));
  }

  extractContextFromTitle(titre) {
    if (!titre) return 'consultation';
    if (titre.toLowerCase().includes('ordonnance')) return 'ordonnance';
    if (titre.toLowerCase().includes('examen')) return 'examen';
    return 'consultation';
  }

  extractContextIdFromTitle(titre) {
    if (!titre) return null;
    const match = titre.match(/(\d+)$/);
    return match ? match[1] : null;
  }

  handleApiError(error, context) {
    let message = `Erreur lors de ${context}`;
    if (error.response) {
      message = error.response.data?.message || `Erreur serveur ${error.response.status}`;
    } else if (error.request) {
      message = 'Erreur réseau, impossible de contacter le serveur.';
    } else {
      message = error.message;
    }
    console.error(`❌ [messagingApi] ${message}`, { originalError: error });
    const formattedError = new Error(message);
    formattedError.originalError = error;
    return formattedError;
  }
}

const messagingService = new MessagingService();

export default messagingService;