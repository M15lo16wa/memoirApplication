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

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
    (config) => {
        // Prioriser les JWT de première connexion et rejeter les tokens temporaires
        const candidates = [
            localStorage.getItem('originalJWT'),
            localStorage.getItem('firstConnectionToken'),
            localStorage.getItem('jwt'),
            localStorage.getItem('token'),
        ];
        
        let usedToken = null;
        for (const candidate of candidates) {
            if (
                candidate &&
                candidate.startsWith('eyJ') &&
                candidate.length > 100 &&
                !candidate.startsWith('temp_') &&
                !candidate.startsWith('auth_')
            ) {
                usedToken = candidate;
                break;
            }
        }
        
        if (usedToken) {
            config.headers.Authorization = `Bearer ${usedToken}`;
            console.log('�� [messagingApi] JWT valide utilisé pour Authorization:', `${usedToken.substring(0, 20)}...`);
        } else {
            console.warn('⚠️ [messagingApi] Aucun JWT valide disponible pour l\'authentification');
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor pour gérer les erreurs d'authentification
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Gestion centralisée des erreurs
        if (error.response?.status === 401) {
            console.warn('🔒 [messagingApi] Token expiré ou invalide');
            // Optionnel : rediriger vers la connexion
        }
        return Promise.reject(error);
    }
);

// Cache simple pour éviter les appels redondants
const messageCache = new Map();
const CACHE_DURATION = 30000; // 30 secondes

// Système de throttling pour éviter les requêtes trop fréquentes
const requestThrottle = new Map();
const THROTTLE_DELAY = 1000; // 1 seconde minimum entre requêtes similaires

// Service de messagerie sécurisée entre médecins et patients
class MessagingService {
  constructor() {
    // 🔌 PROPRIÉTÉS WEBSOCKET
    this.socket = null;
    this.isConnected = false;
    this.messageCallbacks = new Map();
    this.typingCallbacks = new Map();
    this.conversationCallbacks = new Map();
    this.presenceCallbacks = new Map();
    this.notificationCallbacks = new Map();
    this.connectionCallbacks = new Map();
    
    // Configuration WebSocket
    this.wsConfig = {
      url: 'http://localhost:3000',
      transports: ['websocket'],
      timeout: 15000,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      forceNew: true,
      upgrade: true
    };

    // Propriétés pour le throttling des tentatives de connexion
    this.connectionAttempts = 0;
    this.lastConnectionAttempt = 0;
    
    // Cache pour les requêtes fréquentes
    this.userInfoCache = new Map();
    this.conversationCache = new Map();
    this.messageCache = new Map();
  }
  
  // ===== MÉTHODES WEBSOCKET =====
  
  /**
   * Se connecter au serveur WebSocket
   * @param {string} token - Token d'authentification
   */
  connectWebSocket(token) {
    // Éviter les reconnexions multiples
    if (this.socket && this.isConnected) {
      console.log('🔌 [messagingApi] WebSocket déjà connecté');
      return;
    }

    // Éviter les tentatives de reconnexion trop fréquentes
    if (this.connectionAttempts > 0) {
      const timeSinceLastAttempt = Date.now() - this.lastConnectionAttempt;
      if (timeSinceLastAttempt < 5000) { // 5 secondes minimum entre tentatives
        console.log('⏳ [messagingApi] Attente avant nouvelle tentative de connexion...');
        return;
      }
    }

    this.connectionAttempts++;
    this.lastConnectionAttempt = Date.now();

    console.log('🔄 [messagingApi] Tentative de connexion WebSocket...', this.connectionAttempts);
    
    // Nettoyer l'ancienne connexion si elle existe
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.socket = io(this.wsConfig.url, {
      auth: { token },
      ...this.wsConfig,
      // Optimisations pour éviter les reconnexions
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: false
    });

    this.setupWebSocketEventListeners();
  }

  /**
   * Configuration des écouteurs d'événements WebSocket
   */
  setupWebSocketEventListeners() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.connectionAttempts = 0; // Reset des tentatives
      console.log('✅ [messagingApi] WebSocket connecté avec succès');
      this.notifyConnectionCallbacks('connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('🔌 [messagingApi] WebSocket déconnecté:', reason);
      this.notifyConnectionCallbacks('disconnected');
      
      // Éviter les reconnexions automatiques trop agressives
      if (reason === 'io client disconnect') {
        console.log('🛑 [messagingApi] Déconnexion volontaire, pas de reconnexion automatique');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ [messagingApi] Erreur de connexion WebSocket:', error);
      this.notifyConnectionCallbacks('error', error);
      
      // Limiter les tentatives de reconnexion
      if (this.connectionAttempts >= 5) {
        console.warn('⚠️ [messagingApi] Nombre maximum de tentatives atteint, arrêt des reconnexions');
        this.socket.disconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 [messagingApi] WebSocket reconnecté après', attemptNumber, 'tentatives');
      this.connectionAttempts = 0; // Reset des tentatives
      this.notifyConnectionCallbacks('reconnected');
    });

    // Écouter les nouveaux messages
    this.socket.on('new_message', (message) => {
      console.log('📨 [messagingApi] Nouveau message reçu via WebSocket:', message);
      this.notifyMessageCallbacks(message);
    });

    // Écouter les indicateurs de frappe
    this.socket.on('user_typing', (data) => {
      console.log('👀 [messagingApi] Indicateur de frappe reçu:', data);
      this.notifyTypingCallbacks(data);
    });

    // Écouter les mises à jour de conversation
    this.socket.on('conversation_updated', (data) => {
      console.log('🔄 [messagingApi] Conversation mise à jour via WebSocket:', data);
      this.notifyConversationCallbacks(data);
    });

    // Écouter les changements de présence
    this.socket.on('user_online', (data) => {
      console.log('🟢 [messagingApi] Utilisateur en ligne:', data);
      this.notifyPresenceCallbacks('online', data);
    });

    this.socket.on('user_offline', (data) => {
      console.log('🔴 [messagingApi] Utilisateur hors ligne:', data);
      this.notifyPresenceCallbacks('offline', data);
    });

    // Écouter les notifications système
    this.socket.on('notification', (data) => {
      console.log('🔔 [messagingApi] Notification reçue via WebSocket:', data);
      this.notifyNotificationCallbacks(data);
    });
  }

  /**
   * Rejoindre une conversation WebSocket
   * @param {string|number} conversationId - ID de la conversation
   */
  joinConversation(conversationId) {
    if (!this.isConnected) {
      console.warn('⚠️ [messagingApi] WebSocket non connecté, impossible de rejoindre la conversation');
      return;
    }

    console.log('🚪 [messagingApi] Rejoindre la conversation WebSocket:', conversationId);
    this.socket.emit('join_conversation', { conversationId });
  }

  /**
   * Quitter une conversation WebSocket
   * @param {string|number} conversationId - ID de la conversation
   */
  leaveConversation(conversationId) {
    if (!this.isConnected) return;

    console.log('🚪 [messagingApi] Quitter la conversation WebSocket:', conversationId);
    this.socket.emit('leave_conversation', { conversationId });
  }

  /**
   * Envoyer un indicateur de frappe via WebSocket
   * @param {string|number} conversationId - ID de la conversation
   * @param {boolean} isTyping - Indique si l'utilisateur est en train de taper
   */
  emitTyping(conversationId, isTyping) {
    if (!this.isConnected) return;

    console.log('👀 [messagingApi] Envoi indicateur de frappe WebSocket:', isTyping);
    this.socket.emit('typing', { 
      conversationId, 
      isTyping,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notifier le WebSocket d'un message envoyé via HTTP
   * @param {Object} message - Message envoyé
   */
  emitMessageSent(message) {
    if (!this.isConnected) {
      console.warn('⚠️ [messagingApi] WebSocket non connecté, impossible de notifier');
      return;
    }

    console.log('📤 [messagingApi] Notification WebSocket du message envoyé:', message.id);
    console.log('🔍 [DEBUG] Message complet reçu:', message);
    
    // 🔧 CORRECTION : Construire le message avec la structure complète
    const newMessageEvent = {
      id: message.id || message.id_message,
      content: message.contenu || message.content,
      type: message.type_message || 'text',
      sender: {
        id: message.expediteur_id || message.sender?.id,
        type: message.expediteur_type || message.sender?.type,
        name: message.expediteur_nom || message.sender?.name
      },
      recipient: {
        id: message.destinataire_id || message.recipient?.id,
        type: message.destinataire_type || message.recipient?.type,
        name: message.destinataire_nom || message.recipient?.name
      },
      conversation_id: message.conversation_id || message.conversationId,
      timestamp: message.timestamp || new Date().toISOString(),
      status: 'sent'
    };

    const messageSentEvent = {
      message_id: message.id || message.id_message,
      conversation_id: message.conversation_id || message.conversationId,
      sender_id: message.expediteur_id || message.sender?.id,
      timestamp: message.timestamp || new Date().toISOString()
    };

    console.log('🔍 [DEBUG] Événement new_message à émettre:', newMessageEvent);
    console.log('🔍 [DEBUG] Événement message_sent à émettre:', messageSentEvent);

    try {
      // 🔧 CORRECTION : Diffuser le message à tous les participants de la conversation
      this.socket.emit('new_message', newMessageEvent);
      
      // 🔧 CORRECTION : Notifier que le message a été envoyé
      this.socket.emit('message_sent', messageSentEvent);
      
      // 🔧 CORRECTION : Rejoindre automatiquement la conversation si pas déjà fait
      const conversationId = message.conversation_id || message.conversationId;
      if (conversationId && !this.activeConversations.has(conversationId)) {
        console.log('🚪 [messagingApi] Rejoindre automatiquement la conversation:', conversationId);
        this.joinConversation(conversationId);
      }

      console.log('✅ [messagingApi] Notifications WebSocket envoyées avec succès');
    } catch (error) {
      console.error('❌ [messagingApi] Erreur lors de l\'envoi WebSocket:', error);
    }
  }

  // ===== MÉTHODES PRINCIPALES =====
  
  /**
   * Récupérer les conversations d'un médecin
   * @param {number} medecinId - ID du médecin
   * @param {number} page - Numéro de page (défaut: 1)
   * @param {number} limit - Limite par page (défaut: 20)
   * @returns {Promise<Array>} Liste des conversations
   */
  async getMedecinConversations(medecinId, page = 1, limit = 20) {
    const cacheKey = `medecin_conversations_${medecinId}_${page}_${limit}`;
    
    try {
      // Vérifier le cache
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('📋 [messagingApi] Conversations récupérées depuis le cache');
        return cached;
      }

      console.log('�� [messagingApi] Récupération des conversations médecin:', medecinId);
      
      // CORRECTION : Utiliser la route correcte du serveur
      const response = await api.get(`/messaging/conversations/medecin/${medecinId}`, {
        params: { page, limit, statut: 'active' }
      });
      
      if (response.data.status === 'success' && response.data.data) {
        const conversations = this.normalizeConversations(response.data.data.conversations);
        
        // Mettre en cache
        this.setCache(cacheKey, conversations);
        
        console.log('✅ [messagingApi] Conversations récupérées:', conversations.length);
        return conversations;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ [messagingApi] Erreur lors de la récupération des conversations médecin:', error);
      throw this.handleApiError(error, 'récupération des conversations');
    }
  }

  /**
   * Récupérer les messages d'une conversation
   * @param {number} conversationId - ID de la conversation
   * @param {number} page - Numéro de page (défaut: 1)
   * @param {number} limit - Limite par page (défaut: 50)
   * @returns {Promise<Object>} Messages et informations de conversation
   */
  async getConversationMessages(conversationId, page = 1, limit = 50) {
    const cacheKey = `conversation_messages_${conversationId}_${page}_${limit}`;
    
    try {
      // Vérifier le cache
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('📋 [messagingApi] Messages récupérés depuis le cache');
        return cached;
      }

      console.log('�� [messagingApi] Récupération des messages conversation:', conversationId);
      
      // CORRECTION : Utiliser la route correcte du serveur
      const response = await api.get(`/messaging/conversation/${conversationId}/messages`, {
        params: { page, limit }
      });
      
             if (response.data.status === 'success' && response.data.data) {
         // 🔑 NOUVELLE APPROCHE : Récupérer les participants de la conversation
         let conversationParticipants = null;
         if (response.data.data.conversation && response.data.data.conversation.rawData) {
           conversationParticipants = response.data.data.conversation.rawData.participants;
         }
         
         // 🔧 CORRECTION : Normaliser les messages avec les participants
         const normalizedMessages = this.normalizeMessages(response.data.data.messages, conversationParticipants);
         
         // 🔧 CORRECTION : Enrichir avec les noms réels des utilisateurs (fallback)
         const enrichedMessages = await this.enrichMessagesWithUserInfo(normalizedMessages);
        
        const result = {
          conversation: response.data.data.conversation,
          messages: enrichedMessages,
          pagination: response.data.data.pagination
        };
        
        // Mettre en cache
        this.setCache(cacheKey, result);
        
        console.log('✅ [messagingApi] Messages récupérés et enrichis:', result.messages.length);
        return result;
      }
      
      return { conversation: null, messages: [], pagination: null };
      
    } catch (error) {
      console.error('❌ [messagingApi] Erreur lors de la récupération des messages:', error);
      throw this.handleApiError(error, 'récupération des messages');
    }
  }

  /**
   * Récupérer les informations d'un utilisateur via le serveur de messagerie
   * @param {number} userId - ID de l'utilisateur
   * @param {string} userType - Type d'utilisateur ('patient' ou 'medecin')
   * @returns {Promise<Object>} Informations de l'utilisateur
   */
  async getUserInfo(userId, userType) {
    try {
      const cacheKey = `user_${userId}_${userType}`;
      
      // Vérifier le cache d'abord
      if (this.userInfoCache.has(cacheKey)) {
        const cached = this.userInfoCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 60000) { // Cache valide 1 minute
          console.log('💾 [messagingApi] Utilisation du cache pour les infos utilisateur:', userId);
          return cached.data;
        }
      }

      // Throttling pour éviter les requêtes trop fréquentes
      if (!this.canMakeRequest(`getUserInfo_${userId}`, 2000)) {
        console.log('⏳ [messagingApi] Requête getUserInfo throttlée, utilisation du cache ou fallback');
        const cached = this.userInfoCache.get(cacheKey);
        return cached ? cached.data : null;
      }

      console.log('👤 [messagingApi] Récupération des infos utilisateur via messagerie:', { userId, userType });
      
      // 🔧 NOUVELLE APPROCHE : Utiliser le serveur de messagerie
      // Le serveur de messagerie a déjà accès aux informations des utilisateurs
      let response;
      try {
        // Essayer d'abord la route de messagerie pour les infos utilisateur
        response = await api.get(`/messaging/user/${userId}/info`);
        console.log('✅ [messagingApi] Infos utilisateur récupérées via messagerie');
      } catch (error) {
        console.warn('⚠️ [messagingApi] Route messagerie non disponible, fallback vers API directe');
        
        // Fallback vers les routes directes (si authentification disponible)
        if (userType === 'patient') {
          response = await api.get(`/patients/${userId}`);
        } else if (userType === 'medecin') {
          response = await api.get(`/medecins/${userId}`);
        } else {
          console.warn('⚠️ [messagingApi] Type d\'utilisateur non reconnu:', userType);
          return null;
        }
      }
      
      if (response.data.status === 'success' && response.data.data) {
        const userData = response.data.data;
        const userInfo = {
          id: userId,
          type: userType,
          name: userType === 'patient' 
            ? `${userData.prenom || ''} ${userData.nom || ''}`.trim() || `Patient #${userId}`
            : `${userData.prenom || ''} ${userData.nom || ''}`.trim() || `Médecin #${userId}`,
          prenom: userData.prenom,
          nom: userData.nom,
          specialite: userData.specialite
        };
        
        // Mettre en cache
        this.userInfoCache.set(cacheKey, {
          data: userInfo,
          timestamp: Date.now()
        });
        
        console.log('✅ [messagingApi] Informations utilisateur récupérées:', userInfo);
        return userInfo;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ [messagingApi] Erreur lors de la récupération des infos utilisateur:', error);
      return null;
    }
  }

  /**
   * Enrichir les messages avec les noms réels des utilisateurs
   * @param {Array} messages - Messages à enrichir
   * @returns {Promise<Array>} Messages enrichis
   */
  async enrichMessagesWithUserInfo(messages) {
    try {
      console.log('🔧 [messagingApi] Enrichissement des messages avec les noms réels...');
      
      // Throttling pour éviter les enrichissements trop fréquents
      if (!this.canMakeRequest('enrichMessages', 3000)) {
        console.log('⏳ [messagingApi] Enrichissement throttlé, retour des messages non enrichis');
        return messages;
      }
      
      const enrichedMessages = await Promise.all(
        messages.map(async (msg) => {
          if (!msg.sender || !msg.sender.id || !msg.sender.type) {
            return msg;
          }
          
          // Récupérer les informations de l'émetteur
          const senderInfo = await this.getUserInfo(msg.sender.id, msg.sender.type);
          if (senderInfo) {
            msg.sender.name = senderInfo.name;
            msg.sender.prenom = senderInfo.prenom;
            msg.sender.nom = senderInfo.nom;
            msg.sender.specialite = senderInfo.specialite;
          }
          
          return msg;
        })
      );
      
      console.log('✅ [messagingApi] Messages enrichis:', enrichedMessages.length);
      return enrichedMessages;
      
    } catch (error) {
      console.error('❌ [messagingApi] Erreur lors de l\'enrichissement des messages:', error);
      return messages; // Retourner les messages originaux en cas d'erreur
    }
  }

  /**
   * Récupérer les participants d'une conversation
   * @param {number} conversationId - ID de la conversation
   * @returns {Promise<Array>} Liste des participants
   */
  async getConversationParticipants(conversationId) {
    try {
      console.log('👥 [messagingApi] Récupération des participants de la conversation:', conversationId);
      
      const response = await api.get(`/messaging/conversation/${conversationId}/participants`);
      
      if (response.data.status === 'success' && response.data.data) {
        const participants = response.data.data.participants || response.data.data;
        console.log('✅ [messagingApi] Participants récupérés:', participants.length);
        return participants;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ [messagingApi] Erreur lors de la récupération des participants:', error);
      // Retourner un tableau vide en cas d'erreur pour éviter le crash
      return [];
    }
  }

  /**
   * Envoyer un message via WebSocket
   * @param {string|number} conversationId - ID de la conversation
   * @param {Object} messageData - Données du message
   * @returns {Promise<Object>} Message envoyé
   */
  async sendMessageViaWebSocket(conversationId, messageData) {
    try {
      if (!this.isConnected) {
        throw new Error('WebSocket non connecté');
      }

      console.log('🔌 [messagingApi] Envoi de message via WebSocket:', conversationId, messageData);
      
      // Créer un message temporaire avec ID unique
      const tempMessage = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: messageData.content,
        type: messageData.type || 'text',
        sender: messageData.sender,
        recipient: messageData.recipient,
        conversationId: conversationId,
        timestamp: new Date().toISOString(),
        status: 'sending'
      };

      // Émettre le message via WebSocket
      this.socket.emit('send_message', {
        conversationId: conversationId,
        message: tempMessage
      });

      // Retourner le message temporaire
      return tempMessage;
      
    } catch (error) {
      console.error('❌ [messagingApi] Erreur lors de l\'envoi WebSocket:', error);
      throw error;
    }
  }

  /**
   * Envoyer un message dans une conversation
   * @param {number} conversationId - ID de la conversation
   * @param {Object} messageData - Données du message
   * @returns {Promise<Object>} Message envoyé
   */
  async sendMessageToConversation(conversationId, messageData) {
    try {
      console.log('🔄 [messagingApi] Envoi de message dans la conversation:', conversationId);
      
      // 🔧 CORRECTION : Utiliser la route correcte du serveur
      const response = await api.post(`/messaging/conversation/${conversationId}/message`, {
        contenu: messageData.contenu,
        type_message: messageData.type_message || 'texte'
      });
      
      console.log('🔍 [messagingApi] Réponse brute de l\'envoi:', response);
      console.log('🔍 [messagingApi] response.data:', response.data);
      
      if (response.data.status === 'success' && response.data.data) {
        const message = response.data.data.message || response.data.data;
        
        // 🔧 CORRECTION : Normaliser le message retourné avec la structure expediteur_info
        const normalizedMessage = {
          id: message.id || message.id_message || `msg_${Date.now()}`,
          contenu: message.contenu || message.content || messageData.contenu,
          type_message: message.type_message || message.type || 'texte',
          expediteur_id: message.expediteur_id || message.sender_id || message.expediteur?.id,
          expediteur_type: message.expediteur_type || message.sender_type || message.expediteur?.type,
          destinataire_id: message.destinataire_id || message.recipient_id || message.destinataire?.id,
          destinataire_type: message.destinataire_type || message.recipient_type || message.destinataire?.type,
          date_envoi: message.date_envoi || message.timestamp || new Date().toISOString(),
          statut: message.statut || message.status || 'sent',
          conversation_id: conversationId,
          // 🔑 NOUVELLE STRUCTURE : expediteur_info pour la compatibilité
          expediteur_info: {
            id: message.expediteur_id || message.sender_id || message.expediteur?.id,
            type: message.expediteur_type || message.sender_type || message.expediteur?.type,
            nom: message.expediteur_nom || message.sender?.nom || 'Utilisateur',
            prenom: message.expediteur_prenom || message.sender?.prenom || ''
          }
        };
        
        // Invalider le cache des messages de cette conversation
        this.invalidateConversationCache(conversationId);
        
        // 🔌 Notifier le WebSocket du message envoyé
        if (this.isConnected) {
          this.emitMessageSent({
            ...normalizedMessage,
            conversationId: conversationId
          });
        }
        
        console.log('✅ [messagingApi] Message envoyé avec succès:', normalizedMessage);
        return normalizedMessage;
      }
      
      console.warn('⚠️ [messagingApi] Réponse API non standard:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ [messagingApi] Erreur lors de l\'envoi du message:', error);
      throw this.handleApiError(error, 'envoi du message');
    }
  }

  /**
   * Créer une nouvelle conversation
   * @param {Object} conversationData - Données de la conversation
   * @returns {Promise<Object>} Conversation créée
   */
  async createConversation(conversationData) {
    try {
      console.log('�� [messagingApi] Création d\'une nouvelle conversation');
      
      const response = await api.post('/messaging/conversation', conversationData);
      
      if (response.data.status === 'success' && response.data.data) {
        // Invalider le cache des conversations
        this.invalidateMedecinCache();
        
        console.log('✅ [messagingApi] Conversation créée avec succès');
        return response.data.data;
      }
      
      return response.data;
      
    } catch (error) {
      console.error('❌ [messagingApi] Erreur lors de la création de la conversation:', error);
      throw this.handleApiError(error, 'création de la conversation');
    }
  }

  /**
   * Créer une conversation à partir d'un contexte
   * @param {string} contextType - Type de contexte
   * @param {string|number} contextId - ID du contexte
   * @param {number} patient_id - ID du patient
   * @param {number} medecinId - ID du médecin
   * @returns {Promise<Object>} Conversation créée
   */
  async createConversationFromContext(contextType, contextId, patient_id, medecinId) {
    try {
      console.log('�� [messagingApi] Création de conversation depuis le contexte:', { contextType, contextId });
      
      const conversationData = {
        titre: `Messages - ${contextType === 'ordonnance' ? 'Ordonnance' : 'Consultation'} ${contextId}`,
        type_conversation: 'patient_medecin',
        participants: [
          { participant_id: patient_id, participant_type: 'patient' },
          { participant_id: medecinId, participant_type: 'medecin' }
        ],
        initiateur_id: patient_id,
        initiateur_type: 'patient'
      };
      
      const result = await this.createConversation(conversationData);
      
      if (result && result.id_conversation) {
        return {
          conversationId: result.id_conversation,
          conversation: result
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ [messagingApi] Erreur lors de la création de conversation depuis le contexte:', error);
      throw error;
    }
  }

  /**
   * Récupérer l'historique des messages pour un contexte (ordonnance, consultation, etc.)
   * @param {string|number} contextId - ID du contexte (ordonnance, consultation, etc.)
   * @param {number} page - Numéro de page (défaut: 1)
   * @param {number} limit - Limite par page (défaut: 50)
   * @param {string} contextType - Type de contexte (défaut: 'ordonnance')
   * @returns {Promise<Object>} Historique des messages
   */
  async getMessageHistory(contextId, page = 1, limit = 50, contextType = 'ordonnance') {
    const cacheKey = `message_history_${contextType}_${contextId}_${page}_${limit}`;
    
    try {
      // Vérifier le cache
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('📋 [messagingApi] Historique récupéré depuis le cache');
        return cached;
      }

      console.log('�� [messagingApi] Récupération de l\'historique pour le contexte:', contextType, contextId);
      
      let response;
      
      // CORRECTION : Utiliser directement la route correcte selon le type de contexte
      if (contextType === 'ordonnance') {
        // Route corrigée pour les ordonnances
        response = await api.get(`/messaging/history/ordonnance/${contextId}`, {
          params: { page, limit }
        });
        console.log('✅ [messagingApi] Historique ordonnance chargé via route corrigée');
      } else if (contextType === 'consultation') {
        // Route corrigée pour les consultations avec l'ID correct
        response = await api.get(`/messaging/history/consultation/${contextId}`, {
          params: { page, limit }
        });
        console.log('✅ [messagingApi] Historique consultation chargé via route corrigée');
      } else {
        // Route générique pour autres types de contexte
        response = await api.get(`/messaging/history/${contextType}/${contextId}`, {
          params: { page, limit }
        });
        console.log('✅ [messagingApi] Historique générique chargé pour:', contextType);
      }
      
      // DEBUG DÉTAILLÉ : Afficher la structure complète de la réponse
      console.log('🔍 [messagingApi] Réponse API brute:', response);
      console.log('🔍 [messagingApi] response.data:', response.data);
      console.log('🔍 [messagingApi] response.data.status:', response.data?.status);
      console.log('🔍 [messagingApi] response.data.data:', response.data?.data);
      console.log('🔍 [messagingApi] response.data.messages:', response.data?.messages);
      console.log('🔍 [messagingApi] response.data.conversation:', response.data?.conversation);
      console.log('🔍 [messagingApi] response.data.ordonnance:', response.data?.ordonnance);
      console.log('🔍 [messagingApi] Toutes les clés disponibles:', Object.keys(response.data || {}));
      
      // Vérifier si la réponse a la structure attendue
      if (response.data.status === 'success' && response.data.data) {
        console.log('🔍 [messagingApi] Structure standard détectée');
        const result = {
          contextType: contextType,
          contextId: contextId,
          ordonnance: response.data.data.ordonnance,
          conversation: response.data.data.conversation,
          messages: this.normalizeMessages(response.data.data.messages || []),
          pagination: response.data.data.pagination
        };
        
        // Mettre en cache
        this.setCache(cacheKey, result);
        
        console.log('✅ [messagingApi] Historique récupéré:', result.messages.length, 'messages');
        return result;
      }
      
      // Vérifier si la réponse a une structure alternative
      if (response.data.messages && Array.isArray(response.data.messages)) {
        console.log('🔍 [messagingApi] Structure alternative détectée - messages directement dans response.data');
        const result = {
          contextType: contextType,
          contextId: contextId,
          ordonnance: response.data.ordonnance || null,
          conversation: response.data.conversation || null,
          messages: this.normalizeMessages(response.data.messages),
          pagination: response.data.pagination || { page: 1, limit: 50, total: response.data.messages.length, totalPages: 1 }
        };
        
        // Mettre en cache
        this.setCache(cacheKey, result);
        
        console.log('✅ [messagingApi] Historique récupéré (structure alternative):', result.messages.length, 'messages');
        return result;
      }
      
      // Vérifier si la réponse est vide mais valide
      if (response.data.status === 'success' || response.status === 200) {
        console.log('🔍 [messagingApi] Réponse valide mais sans messages - consultation vide ou nouvelle');
        const result = {
          contextType: contextType,
          contextId: contextId,
          ordonnance: response.data.ordonnance || null,
          conversation: response.data.conversation || null,
          messages: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
        };
        
        // Mettre en cache
        this.setCache(cacheKey, result);
        
        console.log('✅ [messagingApi] Consultation sans messages (normale pour une nouvelle consultation)');
        return result;
      }
      
      // Si aucune structure n'est reconnue, retourner un objet vide avec debug
      console.warn('⚠️ [messagingApi] Structure de réponse non reconnue, retour objet vide');
      console.warn('⚠️ [messagingApi] Structure disponible:', Object.keys(response.data || {}));
      console.warn('⚠️ [messagingApi] Status HTTP:', response.status);
      console.warn('⚠️ [messagingApi] Headers:', response.headers);
      
      return {
        contextType: contextType,
        contextId: contextId,
        ordonnance: null,
        conversation: null,
        messages: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
      };
      
    } catch (error) {
      console.error('❌ [messagingApi] Erreur lors de la récupération de l\'historique:', error);
      throw this.handleApiError(error, 'récupération de l\'historique');
    }
  }

  /**
   * Récupérer l'historique des messages pour une ordonnance spécifique (méthode de compatibilité)
   * @param {number} ordonnanceId - ID de l'ordonnance
   * @param {number} page - Numéro de page (défaut: 1)
   * @param {number} limit - Limite par page (défaut: 50)
   * @returns {Promise<Object>} Historique des messages
   */
  async getOrdonnanceHistory(ordonnanceId, page = 1, limit = 50) {
    return this.getMessageHistory(ordonnanceId, page, limit, 'ordonnance');
  }

  /**
   * Vérifier les permissions de messagerie
   * @param {number} ordonnanceId - ID de l'ordonnance
   * @param {number} patientId - ID du patient
   * @returns {Promise<Object>} Permissions de messagerie
   */
  async checkMessagingPermissions(ordonnanceId, patientId) {
    try {
      console.log('�� [messagingApi] Vérification des permissions:', ordonnanceId, patientId);
      
      const response = await api.get(`/messaging/permissions/${ordonnanceId}/patient/${patientId}`);
      
      if (response.data.status === 'success' && response.data.data) {
        console.log('✅ [messagingApi] Permissions vérifiées');
        return response.data.data;
      }
      
      return response.data;
      
    } catch (error) {
      console.error('❌ [messagingApi] Erreur lors de la vérification des permissions:', error);
      throw this.handleApiError(error, 'vérification des permissions');
    }
  }

  // ===== MÉTHODES UTILITAIRES =====
  
  /**
   * Normaliser les conversations pour le frontend
   * @param {Array} conversations - Conversations de l'API
   * @returns {Array} Conversations normalisées
   */
  normalizeConversations(conversations) {
    return conversations.map(conv => {
      // 🔧 CORRECTION : Adapter le format pour correspondre au serveur
      // Le serveur retourne id_conversation, pas id
      const conversationId = conv.id_conversation || conv.id;
      
      // 🔑 NOUVELLE APPROCHE : Extraire les participants depuis rawData.participants
      let patientParticipant = null;
      let medecinParticipant = null;
      
      if (conv.rawData && conv.rawData.participants) {
        // Utiliser la nouvelle structure avec 'type' et 'info'
        patientParticipant = conv.rawData.participants.find(p => p.type === 'patient');
        medecinParticipant = conv.rawData.participants.find(p => p.type === 'medecin');
      } else if (conv.participants) {
        // Fallback vers l'ancienne structure
        patientParticipant = conv.participants.find(p => p.participant_type === 'patient') || {};
        medecinParticipant = conv.participants.find(p => p.participant_type === 'medecin') || {};
      }
      
      // Extraire l'ID de la prescription depuis le titre (ex: "Messages - Ordonnance 15")
      const prescriptionId = this.extractContextIdFromTitle(conv.titre);
      
      // 🔑 EXTRACTION DES VRAIS NOMS depuis rawData.participants.info
      const patientInfo = patientParticipant?.info || {};
      const medecinInfo = medecinParticipant?.info || {};
      
      return {
        id: conversationId,
        id_conversation: conversationId, // Garder la compatibilité avec l'ancien format
        contextType: this.extractContextFromTitle(conv.titre) || 'consultation',
        contextId: prescriptionId || conversationId,
        prescriptionId: prescriptionId, // 🔑 NOUVEAU : ID de la prescription
        patientId: patientParticipant?.id || 'unknown',
        patient: {
          id: patientParticipant?.id || 'unknown',
          nom: patientInfo.nom || 'Patient',
          prenom: patientInfo.prenom || 'Inconnu',
          // 🔑 NOUVEAU : Nom complet pour l'affichage
          displayName: patientInfo.nom && patientInfo.prenom 
            ? `${patientInfo.prenom} ${patientInfo.nom}`.trim()
            : `Patient #${patientParticipant?.id || '?'}`
        },
        medecinId: medecinParticipant?.id || 'unknown', // 🔑 NOUVEAU : ID du médecin
        medecin: {
          id: medecinParticipant?.id || 'unknown',
          nom: medecinInfo.nom || 'Médecin',
          prenom: medecinInfo.prenom || 'Inconnu',
          specialite: medecinInfo.specialite || 'Généraliste',
          // 🔑 NOUVEAU : Nom complet pour l'affichage
          displayName: medecinInfo.nom && medecinInfo.prenom 
            ? `Dr. ${medecinInfo.prenom} ${medecinInfo.nom}`.trim()
            : `Médecin #${medecinParticipant?.id || '?'}`
        },
        lastMessage: conv.dernier_message ? {
          content: conv.dernier_message.contenu,
          timestamp: conv.dernier_message.date_envoi,
          sender: { 
            id: conv.dernier_message.expediteur_id,
            type: conv.dernier_message.expediteur_type 
          }
        } : null,
        messageCount: 0, // Sera mis à jour lors de l'initialisation
        unreadCount: 0, // Sera mis à jour lors de l'initialisation
        lastActivity: conv.date_modification,
        priority: 'normal',
        status: conv.statut,
        titre: conv.titre,
        type_conversation: conv.type_conversation,
        // 🔑 NOUVEAU : Informations brutes du serveur pour debug
        rawData: {
          participants: conv.participants || conv.rawData?.participants,
          dernier_message: conv.dernier_message
        }
      };
    });
  }

  /**
   * Normaliser les messages pour le frontend
   * @param {Array} messages - Messages de l'API
   * @returns {Array} Messages normalisés
   */
  normalizeMessages(messages, conversationParticipants = null) {
    return messages.map(msg => {
      // 🔧 CORRECTION : Utiliser les données du serveur pour les noms
      // Le serveur retourne déjà sender.id, sender.type, et sender.name
      const sender = {
        id: msg.sender?.id || msg.expediteur_id || msg.senderId,
        type: msg.sender?.type || msg.expediteur_type || msg.senderType,
        name: msg.sender?.name || 'Utilisateur'
      };
      
      // 🔑 NOUVELLE APPROCHE : Utiliser les participants de la conversation pour les vrais noms
      if (conversationParticipants && sender.id && sender.type) {
        const participant = conversationParticipants.find(p => 
          p.id === sender.id && p.type === sender.type
        );
        
        if (participant && participant.info) {
          // Utiliser les vrais noms depuis les participants
          if (sender.type === 'patient') {
            sender.name = `${participant.info.prenom || ''} ${participant.info.nom || ''}`.trim() || `Patient #${sender.id}`;
            sender.displayName = `👤 ${sender.name}`;
          } else if (sender.type === 'medecin') {
            sender.name = `Dr. ${participant.info.prenom || ''} ${participant.info.nom || ''}`.trim() || `Médecin #${sender.id}`;
            sender.displayName = `👨‍⚕️ ${sender.name}`;
          }
        } else {
          // Fallback vers l'ancienne méthode
          if (sender.type === 'patient' && sender.id) {
            if (sender.name === 'Patient' || sender.name === 'Utilisateur') {
              sender.name = `Patient #${sender.id}`;
            }
            sender.displayName = `👤 ${sender.name}`;
          }
          
          if (sender.type === 'medecin' && sender.id) {
            if (sender.name === 'Médecin' || sender.name === 'Utilisateur') {
              sender.name = `Médecin #${sender.id}`;
            }
            sender.displayName = `👨‍⚕️ ${sender.name}`;
          }
        }
      }
      
      // 🔑 NOUVELLE STRUCTURE : Créer expediteur_info pour la compatibilité
      const expediteur_info = {
        id: sender.id,
        type: sender.type,
        nom: sender.name.replace(/^(Dr\. |👤 |👨‍⚕️ )/, '').split(' ').pop() || 'Utilisateur',
        prenom: sender.name.replace(/^(Dr\. |👤 |👨‍⚕️ )/, '').split(' ').slice(0, -1).join(' ') || ''
      };
      
      return {
        id: msg.id || msg.id_message,
        content: msg.content || msg.contenu,
        type: msg.type || msg.type_message,
        sender: sender,
        recipient: {
          id: sender.type === 'medecin' ? 'patient' : 'medecin',
          type: sender.type === 'medecin' ? 'patient' : 'medecin',
          name: sender.type === 'medecin' ? 'Patient' : 'Médecin'
        },
        timestamp: msg.timestamp || msg.date_envoi,
        status: msg.status || (msg.statut === 'envoyé' ? 'sent' : msg.statut),
        date_lecture: msg.date_lecture,
        // 🔑 NOUVELLE STRUCTURE : expediteur_info pour la compatibilité
        expediteur_info: expediteur_info,
        // 🔑 GARDER LA COMPATIBILITÉ : contenu et date_envoi
        contenu: msg.content || msg.contenu,
        date_envoi: msg.timestamp || msg.date_envoi,
        // 🔑 NOUVEAU : Garder les données brutes du serveur pour debug
        rawData: {
          originalMessage: msg,
          senderId: msg.senderId,
          senderType: msg.senderType,
          currentUserId: msg.currentUserId,
          currentUserType: msg.currentUserType
        }
      };
    });
  }

  /**
   * Extraire le type de contexte depuis le titre
   * @param {string} titre - Titre de la conversation
   * @returns {string} Type de contexte
   */
  extractContextFromTitle(titre) {
    if (!titre) return 'consultation';
    
    if (titre.toLowerCase().includes('ordonnance')) return 'ordonnance';
    if (titre.toLowerCase().includes('examen')) return 'examen';
    return 'consultation';
  }

  /**
   * Extraire l'ID du contexte depuis le titre
   * @param {string} titre - Titre de la conversation
   * @returns {string|null} ID du contexte
   */
  extractContextIdFromTitle(titre) {
    if (!titre) return null;
    
    // 🔧 CORRECTION : Adapter pour le format du serveur
    // Format attendu : "Messages - Ordonnance 15" ou "Messages - Examen 23"
    
    // Essayer d'abord le format "Messages - Type ID"
    const match1 = titre.match(/Messages?\s*-\s*(?:Ordonnance|Examen|Consultation)\s+(\d+)/i);
    if (match1) return match1[1];
    
    // Essayer le format avec # (ancien format)
    const match2 = titre.match(/#(\d+)/);
    if (match2) return match2[1];
    
    // Essayer d'extraire n'importe quel nombre à la fin
    const match3 = titre.match(/(\d+)(?:\s*$|[\s\-_])/);
    if (match3) return match3[1];
    
    return null;
  }

  /**
   * Gestion centralisée des erreurs API
   * @param {Error} error - Erreur capturée
   * @param {string} context - Contexte de l'erreur
   * @returns {Error} Erreur formatée
   */
  handleApiError(error, context) {
    let message = `Erreur lors de la ${context}`;
    
    if (error.response?.status === 400) {
      message = `Erreur de validation: ${error.response.data?.message || 'Données invalides'}`;
    } else if (error.response?.status === 401) {
      message = 'Non autorisé: Vérifiez votre authentification';
    } else if (error.response?.status === 403) {
      message = 'Accès refusé: Vous n\'avez pas les permissions nécessaires';
    } else if (error.response?.status === 404) {
      message = 'Route non trouvée: Vérifiez l\'URL de l\'API';
    } else if (error.response?.status === 500) {
      message = 'Erreur serveur: Veuillez réessayer plus tard';
    } else if (error.code === 'NETWORK_ERROR') {
      message = 'Erreur réseau: Vérifiez votre connexion internet';
    } else {
      message = `${message}: ${error.message}`;
    }
    
    const formattedError = new Error(message);
    formattedError.originalError = error;
    formattedError.status = error.response?.status;
    formattedError.context = context;
    
    return formattedError;
  }

  // ===== GESTION DU CACHE =====
  
  /**
   * Récupérer une valeur du cache
   * @param {string} key - Clé de cache
   * @returns {*} Valeur en cache ou null
   */
  getFromCache(key) {
    const cached = messageCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Mettre une valeur en cache
   * @param {string} key - Clé de cache
   * @param {*} data - Données à mettre en cache
   */
  setCache(key, data) {
    messageCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Invalider le cache des conversations d'un médecin
   */
  invalidateMedecinCache() {
    for (const key of messageCache.keys()) {
      if (key.startsWith('medecin_conversations_')) {
        messageCache.delete(key);
      }
    }
  }

  /**
   * Invalider le cache d'une conversation spécifique
   * @param {number} conversationId - ID de la conversation
   */
  invalidateConversationCache(conversationId) {
    for (const key of messageCache.keys()) {
      if (key.includes(`conversation_messages_${conversationId}`) || 
          key.includes(`message_history_${conversationId}`)) {
        messageCache.delete(key);
      }
    }
  }

  /**
   * Vider tout le cache
   */
  clearCache() {
    messageCache.clear();
    console.log('🗑️ [messagingApi] Cache vidé');
  }

  // ===== GESTION DES CALLBACKS WEBSOCKET =====
  
  /**
   * S'abonner aux nouveaux messages
   * @param {Function} callback - Fonction de callback
   * @param {string|number} conversationId - ID de la conversation (optionnel)
   */
  onNewMessage(callback, conversationId = null) {
    const key = conversationId || 'global';
    if (!this.messageCallbacks.has(key)) {
      this.messageCallbacks.set(key, []);
    }
    this.messageCallbacks.get(key).push(callback);
  }

  /**
   * Se désabonner des nouveaux messages
   * @param {Function} callback - Fonction de callback
   * @param {string|number} conversationId - ID de la conversation (optionnel)
   */
  offNewMessage(callback, conversationId = null) {
    const key = conversationId || 'global';
    if (this.messageCallbacks.has(key)) {
      const callbacks = this.messageCallbacks.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * S'abonner aux confirmations d'envoi de messages
   * @param {Function} callback - Fonction de callback
   * @param {string|number} conversationId - ID de la conversation (optionnel)
   */
  onMessageSent(callback, conversationId = null) {
    const key = conversationId || 'global';
    if (!this.messageCallbacks.has(key)) {
      this.messageCallbacks.set(key, []);
    }
    this.messageCallbacks.get(key).push(callback);
  }

  /**
   * Se désabonner des confirmations d'envoi de messages
   * @param {Function} callback - Fonction de callback
   * @param {string|number} conversationId - ID de la conversation (optionnel)
   */
  offMessageSent(callback, conversationId = null) {
    const key = conversationId || 'global';
    if (this.messageCallbacks.has(key)) {
      const callbacks = this.messageCallbacks.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * S'abonner aux erreurs de messages
   * @param {Function} callback - Fonction de callback
   * @param {string|number} conversationId - ID de la conversation (optionnel)
   */
  onMessageError(callback, conversationId = null) {
    const key = conversationId || 'global';
    if (!this.messageCallbacks.has(key)) {
      this.messageCallbacks.set(key, []);
    }
    this.messageCallbacks.get(key).push(callback);
  }

  /**
   * Se désabonner des erreurs de messages
   * @param {Function} callback - Fonction de callback
   * @param {string|number} conversationId - ID de la conversation (optionnel)
   */
  offMessageError(callback, conversationId = null) {
    const key = conversationId || 'global';
    if (this.messageCallbacks.has(key)) {
      const callbacks = this.messageCallbacks.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * S'abonner aux indicateurs de frappe
   * @param {Function} callback - Fonction de callback
   * @param {string|number} conversationId - ID de la conversation (optionnel)
   */
  onTyping(callback, conversationId = null) {
    const key = conversationId || 'global';
    if (!this.typingCallbacks.has(key)) {
      this.typingCallbacks.set(key, []);
    }
    this.typingCallbacks.get(key).push(callback);
  }

  /**
   * Se désabonner des indicateurs de frappe
   * @param {Function} callback - Fonction de callback
   * @param {string|number} conversationId - ID de la conversation (optionnel)
   */
  offTyping(callback, conversationId = null) {
    const key = conversationId || 'global';
    if (!this.typingCallbacks.has(key)) {
      const callbacks = this.typingCallbacks.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * S'abonner aux mises à jour de conversation
   * @param {Function} callback - Fonction de callback
   * @param {string|number} conversationId - ID de la conversation (optionnel)
   */
  onConversationUpdate(callback, conversationId = null) {
    const key = conversationId || 'global';
    if (!this.conversationCallbacks.has(key)) {
      this.conversationCallbacks.set(key, []);
    }
    this.conversationCallbacks.get(key).push(callback);
  }

  /**
   * S'abonner aux changements de présence
   * @param {Function} callback - Fonction de callback
   */
  onPresenceChange(callback) {
    if (!this.presenceCallbacks.has('presence')) {
      this.presenceCallbacks.set('presence', []);
    }
    this.presenceCallbacks.get('presence').push(callback);
  }

  /**
   * S'abonner aux notifications système
   * @param {Function} callback - Fonction de callback
   */
  onNotification(callback) {
    if (!this.notificationCallbacks.has('notification')) {
      this.notificationCallbacks.set('notification', []);
    }
    this.notificationCallbacks.get('notification').push(callback);
  }

  /**
   * S'abonner aux changements de connexion WebSocket
   * @param {Function} callback - Fonction de callback
   */
  onConnectionChange(callback) {
    if (!this.connectionCallbacks.has('connection')) {
      this.connectionCallbacks.set('connection', []);
    }
    this.connectionCallbacks.get('connection').push(callback);
  }

  // ===== NOTIFICATION DES CALLBACKS =====
  
  /**
   * Notifier les callbacks de messages
   * @param {Object} message - Message reçu
   */
  notifyMessageCallbacks(message) {
    // Notifier les callbacks globaux
    if (this.messageCallbacks.has('global')) {
      this.messageCallbacks.get('global').forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('❌ [messagingApi] Erreur dans le callback de message:', error);
        }
      });
    }

    // Notifier les callbacks spécifiques à la conversation
    if (message.conversationId && this.messageCallbacks.has(message.conversationId)) {
      this.messageCallbacks.get(message.conversationId).forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('❌ [messagingApi] Erreur dans le callback de message:', error);
        }
      });
    }
  }

  /**
   * Notifier les callbacks de frappe
   * @param {Object} data - Données de frappe
   */
  notifyTypingCallbacks(data) {
    // Notifier les callbacks globaux
    if (this.typingCallbacks.has('global')) {
      this.typingCallbacks.get('global').forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ [messagingApi] Erreur dans le callback de frappe:', error);
        }
      });
    }

    // Notifier les callbacks spécifiques à la conversation
    if (data.conversationId && this.typingCallbacks.has(data.conversationId)) {
      this.typingCallbacks.get(data.conversationId).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ [messagingApi] Erreur dans le callback de frappe:', error);
        }
      });
    }
  }

  /**
   * Notifier les callbacks de conversation
   * @param {Object} data - Données de conversation
   */
  notifyConversationCallbacks(data) {
    if (this.conversationCallbacks.has('global')) {
      this.conversationCallbacks.get('global').forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ [messagingApi] Erreur dans le callback de conversation:', error);
        }
      });
    }

    if (data.conversationId && this.conversationCallbacks.has(data.conversationId)) {
      this.conversationCallbacks.get(data.conversationId).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ [messagingApi] Erreur dans le callback de conversation:', error);
        }
      });
    }
  }

  /**
   * Notifier les callbacks de présence
   * @param {string} status - Statut de présence
   * @param {Object} data - Données utilisateur
   */
  notifyPresenceCallbacks(status, data) {
    if (this.presenceCallbacks.has('presence')) {
      this.presenceCallbacks.get('presence').forEach(callback => {
        try {
          callback(status, data);
        } catch (error) {
          console.error('❌ [messagingApi] Erreur dans le callback de présence:', error);
        }
      });
    }
  }

  /**
   * Notifier les callbacks de notification
   * @param {Object} data - Données de notification
   */
  notifyNotificationCallbacks(data) {
    if (this.notificationCallbacks.has('notification')) {
      this.notificationCallbacks.get('notification').forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ [messagingApi] Erreur dans le callback de notification:', error);
        }
      });
    }
  }

  /**
   * Notifier les callbacks de connexion
   * @param {string} status - Statut de connexion
   * @param {Error} error - Erreur (optionnel)
   */
  notifyConnectionCallbacks(status, error = null) {
    if (this.connectionCallbacks.has('connection')) {
      this.connectionCallbacks.get('connection').forEach(callback => {
        try {
          callback(status, error);
        } catch (error) {
          console.error('❌ [messagingApi] Erreur dans le callback de connexion:', error);
        }
      });
    }
  }

  // ===== GESTION DE LA CONNEXION WEBSOCKET =====
  
  /**
   * Vérifier l'état de la connexion WebSocket
   * @returns {Object} État de la connexion
   */
  getWebSocketStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }

  /**
   * Déconnecter le WebSocket
   */
  disconnectWebSocket() {
    if (this.socket) {
      console.log('🔌 [messagingApi] Déconnexion WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      
      // Nettoyer tous les callbacks
      this.messageCallbacks.clear();
      this.typingCallbacks.clear();
      this.conversationCallbacks.clear();
      this.presenceCallbacks.clear();
      this.notificationCallbacks.clear();
      this.connectionCallbacks.clear();
    }
  }

  /**
   * Fonction utilitaire pour déterminer si un message appartient à un utilisateur
   * @param {Object} message - Message à vérifier
   * @param {Object} user - Utilisateur actuel
   * @returns {boolean} True si le message appartient à l'utilisateur
   */
  isMessageFromUser(message, user) {
    // Vérification de sécurité
    if (!message || !user || !user.id || !user.type) {
      return false;
    }

    // Vérifier expediteur_id directement
    if (message.expediteur_id && message.expediteur_id === user.id) {
      return true;
    }

    // Vérifier expediteur_info
    if (message.expediteur_info && message.expediteur_info.id && message.expediteur_info.id === user.id) {
      return true;
    }

    // Vérifier sender (ancien format)
    if (message.sender && message.sender.id && message.sender.id === user.id) {
      return true;
    }

    return false;
  }

  /**
   * Normaliser un message pour la structure expediteur_info
   * @param {Object} message - Message brut du serveur
   * @returns {Object} Message normalisé
   */
  normalizeMessageForDisplay(message) {
    if (!message) return null;

    // Structure attendue par le composant React
    return {
      id_message: message.id || message.id_message,
      contenu: message.contenu || message.content,
      date_envoi: message.date_envoi || message.timestamp,
      expediteur_id: message.expediteur_id || message.sender?.id,
      expediteur_type: message.expediteur_type || message.sender?.type,
      expediteur_info: {
        id: message.expediteur_id || message.sender?.id,
        type: message.expediteur_type || message.sender?.type,
        nom: message.expediteur_nom || message.sender?.nom || 'Utilisateur',
        prenom: message.expediteur_prenom || message.sender?.prenom || ''
      }
    };
  }

  /**
   * Vérifier si une requête peut être effectuée (throttling)
   * @param {string} key - Clé unique pour la requête
   * @param {number} delay - Délai minimum en ms
   * @returns {boolean} True si la requête peut être effectuée
   */
  canMakeRequest(key, delay = THROTTLE_DELAY) {
    const now = Date.now();
    const lastRequest = requestThrottle.get(key);
    
    if (!lastRequest || (now - lastRequest) >= delay) {
      requestThrottle.set(key, now);
      return true;
    }
    
    console.log(`⏳ [messagingApi] Requête throttlée pour ${key}, attente...`);
    return false;
  }

  /**
   * Invalider le cache pour une clé spécifique
   * @param {string} key - Clé du cache à invalider
   */
  invalidateCache(key) {
    this.userInfoCache.delete(key);
    this.conversationCache.delete(key);
    this.messageCache.delete(key);
    console.log(`🗑️ [messagingApi] Cache invalidé pour: ${key}`);
  }
}

// Instance unique du service
const messagingService = new MessagingService();

export default messagingService;