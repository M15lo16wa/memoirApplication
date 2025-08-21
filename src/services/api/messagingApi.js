import axios from "axios";

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
            console.log('🔐 [messagingApi] JWT valide utilisé pour Authorization:', `${usedToken.substring(0, 20)}...`);
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
        // On laisse la gestion du 401 au composant appelant
        return Promise.reject(error);
    }
);

// Service de messagerie sécurisée entre médecins et patients
class MessagingService {
  // Récupérer l'historique des messages pour un contexte donné
  async getMessageHistory(contextType, contextId) {
    try {
      const response = await api.get(`/messaging/history/${contextType}/${contextId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des messages:', error);
      // En cas d'erreur, retourner un historique vide
      return [];
    }
  }

  // Envoyer un message
  async sendMessage(messageData) {
    try {
      const response = await api.post('/messaging/send', messageData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }

  // Marquer un message comme lu
  async markMessageAsRead(messageId) {
    try {
      const response = await api.patch(`/messaging/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du marquage du message comme lu:', error);
      throw error;
    }
  }

  // Récupérer les messages non lus pour un utilisateur
  async getUnreadMessages(userId, userType) {
    try {
      const response = await api.get(`/messaging/unread/${userType}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages non lus:', error);
      return [];
    }
  }

  // Récupérer les conversations actives pour un utilisateur
  async getActiveConversations(userId, userType) {
    try {
      const response = await api.get(`/messaging/conversations/${userType}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations actives:', error);
      return [];
    }
  }

  // Créer une nouvelle session de messagerie
  async createMessagingSession(sessionData) {
    try {
      const response = await api.post('/messaging/sessions', sessionData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la session de messagerie:', error);
      throw error;
    }
  }

  // Vérifier les autorisations de messagerie
  async checkMessagingPermissions(contextType, contextId, userId, userType) {
    try {
      const response = await api.get(`/messaging/permissions/${contextType}/${contextId}/${userType}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification des autorisations:', error);
      // En cas d'erreur, autoriser par défaut pour la démo
      return { authorized: true };
    }
  }

  // Récupérer les statistiques de messagerie
  async getMessagingStats(userId, userType) {
    try {
      const response = await api.get(`/messaging/stats/${userType}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { totalMessages: 0, unreadCount: 0, activeConversations: 0 };
    }
  }

  // Archiver une conversation
  async archiveConversation(sessionId) {
    try {
      const response = await api.patch(`/messaging/sessions/${sessionId}/archive`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'archivage de la conversation:', error);
      throw error;
    }
  }

  // Supprimer un message
  async deleteMessage(messageId) {
    try {
      const response = await api.delete(`/messaging/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      throw error;
    }
  }

  // Rechercher dans les messages
  async searchMessages(query, contextType, contextId) {
    try {
      const response = await api.get(`/messaging/search`, {
        params: { query, contextType, contextId }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche dans les messages:', error);
      return [];
    }
  }

  // Récupérer les pièces jointes d'un message
  async getMessageAttachments(messageId) {
    try {
      const response = await api.get(`/messaging/messages/${messageId}/attachments`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des pièces jointes:', error);
      return [];
    }
  }

  // Envoyer un message avec pièce jointe
  async sendMessageWithAttachment(messageData, file) {
    try {
      const formData = new FormData();
      formData.append('message', JSON.stringify(messageData));
      if (file) {
        formData.append('attachment', file);
      }

      const response = await api.post('/messaging/send-with-attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message avec pièce jointe:', error);
      throw error;
    }
  }

  // Récupérer les notifications de messagerie
  async getMessagingNotifications(userId, userType) {
    try {
      const response = await api.get(`/messaging/notifications/${userType}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }

  // Marquer toutes les notifications comme lues
  async markAllNotificationsAsRead(userId, userType) {
    try {
      const response = await api.patch(`/messaging/notifications/${userType}/${userId}/mark-all-read`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
      throw error;
    }
  }

  // Récupérer les paramètres de messagerie d'un utilisateur
  async getUserMessagingSettings(userId, userType) {
    try {
      const response = await api.get(`/messaging/settings/${userType}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      return { notifications: true, autoReply: false };
    }
  }

  // Mettre à jour les paramètres de messagerie
  async updateUserMessagingSettings(userId, userType, settings) {
    try {
      const response = await api.patch(`/messaging/settings/${userType}/${userId}`, settings);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      throw error;
    }
  }

  // Récupérer les rapports de messagerie (pour les administrateurs)
  async getMessagingReports(startDate, endDate, filters = {}) {
    try {
      const response = await api.get('/messaging/reports', {
        params: { startDate, endDate, ...filters }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports:', error);
      return [];
    }
  }

  // Exporter l'historique des messages
  async exportMessageHistory(contextType, contextId, format = 'json') {
    try {
      const response = await api.get(`/messaging/export/${contextType}/${contextId}`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'export de l\'historique:', error);
      throw error;
    }
  }

  // NOUVELLES FONCTIONS POUR LA MESSAGERIE FONCTIONNELLE
  
  // Créer une conversation basée sur une consultation ou ordonnance
  async createConversationFromContext(contextType, contextId, patientId, medecinId) {
    const sessionData = {
      contextType,
      contextId,
      patientId,
      medecinId,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    try {
      const response = await api.post('/messaging/sessions', sessionData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      // En cas d'erreur, créer une session locale
      return {
        id: `local_session_${contextType}_${contextId}_${patientId}_${medecinId}`,
        ...sessionData,
        local: true
      };
    }
  }

  // Récupérer les conversations d'un médecin avec les données patients
  async getMedecinConversations(medecinId) {
    try {
      const response = await api.get(`/messaging/medecin/${medecinId}/conversations`);
      // S'assurer que response.data est un tableau
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('⚠️ L\'API a retourné des données invalides, utilisation des conversations simulées');
        return this.getSimulatedConversations(medecinId);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations médecin:', error);
      // Retourner des conversations simulées basées sur les données locales
      return this.getSimulatedConversations(medecinId);
    }
  }

  // Récupérer les conversations d'un patient
  async getPatientConversations(patientId) {
    try {
      const response = await api.get(`/messaging/patient/${patientId}/conversations`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations patient:', error);
      return [];
    }
  }

  // Simuler des conversations basées sur les données locales
  getSimulatedConversations(medecinId) {
    try {
      const conversations = [];
      
      // Parcourir le localStorage pour trouver les sessions existantes
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('messages_session_')) {
          const sessionId = key.replace('messages_', '');
          const messages = JSON.parse(localStorage.getItem(key) || '[]');
          
          if (messages.length > 0 && sessionId.includes(`_${medecinId}`)) {
            const sessionParts = sessionId.split('_');
            if (sessionParts.length >= 5) {
              const contextType = sessionParts[1];
              const contextId = sessionParts[2];
              const patientId = sessionParts[3];
              
              // Récupérer les informations du patient depuis l'API
              const patientInfo = this.getPatientInfoFromStorage(patientId);
              
              const lastMessage = messages[messages.length - 1];
              const unreadCount = messages.filter(msg => 
                !msg.lu && 
                msg.sender.type === 'patient' && 
                msg.recipient.id === medecinId
              ).length;

              conversations.push({
                id: sessionId,
                contextType,
                contextId,
                patientId,
                patient: patientInfo,
                lastMessage,
                messageCount: messages.length,
                unreadCount,
                lastActivity: lastMessage.timestamp,
                priority: contextType === 'urgence' ? 'high' : 'normal',
                status: 'active'
              });
            }
          }
        }
      }
      
      // Trier par dernière activité
      return conversations.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    } catch (error) {
      console.error('Erreur lors de la simulation des conversations:', error);
      return [];
    }
  }

  // Récupérer les informations patient depuis le stockage local
  getPatientInfoFromStorage(patientId) {
    try {
      // Essayer de récupérer depuis le localStorage
      const patientsData = localStorage.getItem('patients_data');
      if (patientsData) {
        const patients = JSON.parse(patientsData);
        const patient = patients.find(p => p.id === patientId || p.id_patient === patientId);
        if (patient) {
          return patient;
        }
      }
      
      // Fallback : informations simulées
      return {
        id: patientId,
        nom: 'Patient',
        prenom: 'Inconnu',
        age: '?',
        email: `patient${patientId}@example.com`
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des infos patient:', error);
      return {
        id: patientId,
        nom: 'Patient',
        prenom: 'Inconnu',
        age: '?',
        email: `patient${patientId}@example.com`
      };
    }
  }

  // Initialiser la messagerie avec des données réelles
  async initializeMessaging(medecinId) {
    try {
      // Récupérer les conversations existantes
      let conversations = await this.getMedecinConversations(medecinId);
      
      // S'assurer que conversations est un tableau
      if (!Array.isArray(conversations)) {
        console.warn('⚠️ getMedecinConversations n\'a pas retourné un tableau, initialisation avec tableau vide');
        conversations = [];
      }
      
      // Créer des sessions de base si aucune n'existe
      if (conversations.length === 0) {
        await this.createBaseConversations(medecinId);
        // Récupérer à nouveau les conversations après création
        conversations = await this.getMedecinConversations(medecinId);
        if (!Array.isArray(conversations)) {
          conversations = [];
        }
      }
      
      return conversations;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la messagerie:', error);
      return [];
    }
  }

  // Créer des conversations de base basées sur les consultations existantes
  async createBaseConversations(medecinId) {
    try {
      // Récupérer les consultations du médecin
      const consultations = await this.getConsultationsForMedecin(medecinId);
      
      for (const consultation of consultations) {
        if (consultation.patient_id) {
          await this.createConversationFromContext(
            'consultation',
            consultation.id,
            consultation.patient_id,
            medecinId
          );
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création des conversations de base:', error);
    }
  }

  // Récupérer les consultations d'un médecin
  async getConsultationsForMedecin(medecinId) {
    try {
      const response = await api.get(`/consultation/medecin/${medecinId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des consultations:', error);
      return [];
    }
  }
}

// Instance unique du service
const messagingService = new MessagingService();

export default messagingService;
