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

/**
 * Service de messagerie unifié (API REST + WebSocket)
 */
class MessagingService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageCallbacks = new Set();
    this.connectionCallbacks = new Set();
  }

  // ===== GESTION WEBSOCKET ET UTILISATEUR =====

  /**
   * Décode le token JWT pour obtenir les infos de l'utilisateur.
   */
  getCurrentUserFromToken() {
    try {
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
      this.notifyConnectionChange();
      
      const user = this.getCurrentUserFromToken();
      if (user) {
        this.socket.emit('authenticate', {
            userId: user.id,
            userType: user.role,
            role: user.role
        });
      }
    });
    
    this.socket.on('authenticated', (data) => {
      console.log(`✅ [messagingApi] WebSocket authentifié:`, data.message);
    });
    
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.warn(`🔌 [messagingApi] WebSocket déconnecté: ${reason}`);
      this.notifyConnectionChange();
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ [messagingApi] Erreur de connexion WebSocket:', error.message);
      this.isConnected = false;
      this.notifyConnectionChange();
    });
    
    this.socket.on('new_message', (data) => {
      console.log('📨 [messagingApi] Nouveau message reçu via WebSocket:', data);
      const normalizedMessage = this.normalizeMessages([data.message])[0];
      this.messageCallbacks.forEach(callback => callback(normalizedMessage));
    });
    
    this.socket.on('error', (error) => {
      console.error('❌ [messagingApi] Erreur du serveur WebSocket:', error.message);
    });
  }
  
  onNewMessage(callback) {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onConnectionChange(callback) {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  notifyConnectionChange() {
    this.connectionCallbacks.forEach(callback => callback(this.isConnected));
  }

  joinConversation(conversationId) {
    if (this.isConnected && conversationId) {
      this.socket.emit('join_conversation', conversationId);
      console.log(`🔗 [messagingApi] Rejoint la conversation ${conversationId}`);
    }
  }

  leaveConversation(conversationId) {
    if (this.isConnected && conversationId) {
      this.socket.emit('leave_conversation', conversationId);
      console.log(`🔗 [messagingApi] Quitté la conversation ${conversationId}`);
    }
  }

  disconnectWebSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.notifyConnectionChange();
    }
  }

  // ===== MÉTHODES API REST =====

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
    if (!conversationId) {
      throw new Error('ID de conversation manquant');
    }

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
    if (!conversationId) {
      throw new Error('ID de conversation manquant');
    }

    try {
      const response = await api.post(`/messaging/conversation/${conversationId}/message`, messageData);
      if (response.data.status === 'success') {
        return this.normalizeMessages([response.data.data.message])[0];
      }
      return response.data;
    } catch (error) {
      console.error("❌ [messagingApi] L'envoi du message a échoué.", error);
      throw this.handleApiError(error, 'envoi du message');
    }
  }

  async getMessageHistory(contextType, contextId) {
    try {
      let response;
      
      if (contextType === 'ordonnance') {
        response = await api.get(`/messaging/history/ordonnance/${contextId}`);
      } else if (contextType === 'consultation') {
        response = await api.get(`/messaging/history/consultation/${contextId}`);
      } else {
        // Fallback vers l'ancienne route générique si elle existe
        response = await api.get(`/messaging/history/${contextType}/${contextId}`);
      }
      
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

  // async findOrCreateConversationForContext(contextType, contextId) {
  //   try {
  //     // Pour l'ordonnance, utiliser la route spécifique d'historique
  //     if (contextType === 'ordonnance') {
  //       const response = await api.get(`/messaging/history/ordonnance/${contextId}`);
  //       if (response.data.status === 'success') {
  //         const data = response.data.data;
  //         if (data.conversation) {
  //           return data.conversation;
  //         } else {
  //           // Créer une nouvelle conversation pour cette ordonnance
  //           return await this.createConversationForOrdonnance(contextId);
  //         }
  //       }
  //     }
      
  //     // Pour les consultations
  //     if (contextType === 'consultation') {
  //       const response = await api.get(`/messaging/history/consultation/${contextId}`);
  //       if (response.data.status === 'success') {
  //         const data = response.data.data;
  //         if (data.conversation) {
  //           return data.conversation;
  //         } else {
  //           // Créer une nouvelle conversation pour cette consultation
  //           return await this.createConversationForConsultation(contextId);
  //         }
  //       }
  //     }
      
  //     throw new Error(`Type de contexte non supporté: ${contextType}`);
  //   } catch (error) {
  //     throw this.handleApiError(error, 'création/recherche de conversation');
  //   }
  // }
  async findOrCreateConversationForContext(contextType, contextId, medecinInfo) {
    if (!contextType || !contextId) {
        throw new Error("Le type de contexte et l'ID sont requis.");
    }
    
    try {
        // Étape 1 : Essayer de récupérer la conversation existante.
        console.log(`[messagingApi] Recherche d'une conversation pour ${contextType} #${contextId}`);
        const response = await api.get(`/messaging/history/${contextType}/${contextId}`);
        const data = response.data.data;

        if (data && data.conversation) {
            console.log(`[messagingApi] Conversation existante trouvée : ID ${data.conversation.id}`);
            return { id_conversation: data.conversation.id || data.conversation.id_conversation };
        }

        console.log(`[messagingApi] Aucune conversation liée trouvée. Création en cours...`);
        return await this.createConversationForContext(contextType, contextId, medecinInfo);

    } catch (error) {
        // Étape 2 : Gérer les erreurs.
        if (error.response && (error.response.status === 404 || error.response.status === 400)) {
            // Un 404 est normal ici, cela signifie qu'il faut créer la conversation.
            console.log(`[messagingApi] L'historique n'existe pas (404). Création d'une nouvelle conversation.`);
            return await this.createConversationForContext(contextType, contextId, medecinInfo);
        }
        
        // Toutes les autres erreurs (comme le 400 "ID invalide") sont des erreurs réelles.
        console.error(`[messagingApi] Erreur inattendue lors de la recherche de la conversation.`);
        throw this.handleApiError(error, `recherche de conversation pour ${contextType}`);
    }
  }

   /**
   * AMÉLIORATION : Fonction unifiée pour la création de conversation.
   */
  async createConversationForContext(contextType, contextId, medecinInfo) {
    try {
        const titre = `${contextType.charAt(0).toUpperCase() + contextType.slice(1)} #${contextId}`;
        
        const response = await api.post(`/messaging/conversation`, {
            titre: titre,
            type_conversation: 'patient_medecin',
            contexte_type: contextType,
            contexte_id: contextId,
            medecin_id: medecinInfo?.id,
            patient_id: this.getCurrentUserFromToken()?.id,
        });
      
        if (response.data.status === 'success') {
            console.log(`[messagingApi] Conversation créée avec succès : ID ${response.data.data.conversation.id}`);
            return { id_conversation: response.data.data.conversation.id };
        }
        throw new Error('La création de la conversation a échoué via l\'API.');
    } catch (error) {
        throw this.handleApiError(error, `création de conversation pour ${contextType}`);
    }
  }



  async createConversationForOrdonnance(ordonnanceId) {
    try {
      const response = await api.post(`/messaging/conversation`, {
        titre: `Ordonnance #${ordonnanceId}`,
        type_conversation: 'patient_medecin',
        participants: [] // Les participants seront déterminés côté backend
      });
      
      if (response.data.status === 'success') {
        return response.data.data.conversation;
      }
      throw new Error('Impossible de créer la conversation');
    } catch (error) {
      throw this.handleApiError(error, 'création de conversation pour ordonnance');
    }
  }

  async createConversationForConsultation(consultationId) {
    try {
      const response = await api.post(`/messaging/conversation`, {
        titre: `Consultation #${consultationId}`,
        type_conversation: 'patient_medecin',
        participants: [] // Les participants seront déterminés côté backend
      });
      
      if (response.data.status === 'success') {
        return response.data.data.conversation;
      }
      throw new Error('Impossible de créer la conversation');
    } catch (error) {
      throw this.handleApiError(error, 'création de conversation pour consultation');
    }
  }
  
  async getNewMessages(conversationId, since, limit = 50) {
    try {
      const response = await api.get(`/messaging/conversation/${conversationId}/new-messages`, {
        params: { since, limit }
      });
      
      if (response.data.status === 'success') {
        return this.normalizeMessages(response.data.data.messages || []);
      }
      return [];
    } catch (error) {
      throw this.handleApiError(error, 'récupération des nouveaux messages');
    }
  }

  async getConversationsWithUnreadMessages() {
    try {
      const response = await api.get('/messaging/conversations/unread');
      if (response.data.status === 'success') {
        return this.normalizeConversations(response.data.data.conversations || []);
      }
      return [];
    } catch (error) {
      throw this.handleApiError(error, 'récupération des conversations non lues');
    }
  }

  async getConversationParticipants(conversationId) {
    try {
      const response = await api.get(`/messaging/conversation/${conversationId}/participants`);
      if (response.data.status === 'success') {
        return response.data.data.participants || [];
      }
      return [];
    } catch (error) {
      throw this.handleApiError(error, 'récupération des participants');
    }
  }

  async getMessagingPermissions(ordonnanceId, patientId) {
    try {
      const response = await api.get(`/messaging/permissions/${ordonnanceId}/patient/${patientId}`);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      return null;
    } catch (error) {
      throw this.handleApiError(error, 'vérification des permissions');
    }
  }

  

  // ===== NORMALISATION ET UTILITAIRES =====

  normalizeConversations(apiConversations) {
    if (!Array.isArray(apiConversations)) return [];
    return apiConversations.map(conv => ({
      id: conv.id,
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
      conversation_id: msg.id_conversation,
      expediteur_info: msg.expediteur_info || { 
        id: msg.expediteur_id, 
        type: msg.expediteur_type, 
        nom: 'Inconnu' 
      },
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