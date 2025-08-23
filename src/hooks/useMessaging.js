import { useEffect, useCallback, useState } from 'react';
import messagingService from '../services/api/messagingApi';

const useMessaging = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    socketId: null
  });

  // Se connecter au WebSocket via messagingApi
  const connectWebSocket = useCallback((token) => {
    if (token) {
      messagingService.connectWebSocket(token);
    }
  }, []);

  // Se déconnecter
  const disconnectWebSocket = useCallback(() => {
    messagingService.disconnectWebSocket();
  }, []);

  // Écouter les changements de connexion
  useEffect(() => {
    const handleConnectionChange = (status, error) => {
      const statusInfo = messagingService.getWebSocketStatus();
      setConnectionStatus(statusInfo);
      
      if (status === 'error') {
        console.error('❌ Erreur WebSocket:', error);
      }
    };

    messagingService.onConnectionChange(handleConnectionChange);

    // Initialiser l'état de connexion
    setConnectionStatus(messagingService.getWebSocketStatus());

    return () => {
      // Note: messagingService gère déjà le nettoyage
    };
  }, []);

  return {
    // État de connexion
    connectionStatus,
    isConnected: connectionStatus.isConnected,
    socketId: connectionStatus.socketId,

    // Méthodes de connexion WebSocket
    connectWebSocket,
    disconnectWebSocket,

    // Méthodes de conversation WebSocket
    joinConversation: messagingService.joinConversation.bind(messagingService),
    leaveConversation: messagingService.leaveConversation.bind(messagingService),

    // Méthodes de messagerie WebSocket
    onNewMessage: messagingService.onNewMessage.bind(messagingService),
    offNewMessage: messagingService.offNewMessage.bind(messagingService),
    onTyping: messagingService.onTyping.bind(messagingService),
    offTyping: messagingService.offTyping.bind(messagingService),

    // 🔌 NOUVELLES MÉTHODES POUR VOTRE SERVEUR WEBSOCKET
    onConversationUpdate: messagingService.onConversationUpdate.bind(messagingService),
    onPresenceChange: messagingService.onPresenceChange.bind(messagingService),
    onNotification: messagingService.onNotification.bind(messagingService),

    // Méthodes d'émission WebSocket
    emitTyping: messagingService.emitTyping.bind(messagingService),
    emitMessageSent: messagingService.emitMessageSent.bind(messagingService),

    // 🔑 NOUVELLES MÉTHODES DE RÉCUPÉRATION DES CONVERSATIONS
    getMedecinConversations: messagingService.getMedecinConversations.bind(messagingService),
    getConversationMessages: messagingService.getConversationMessages.bind(messagingService),
    getConversationParticipants: messagingService.getConversationParticipants.bind(messagingService),
    getUserInfo: messagingService.getUserInfo.bind(messagingService),

    // 🔑 NOUVELLES MÉTHODES D'HISTORIQUE
    getMessageHistory: messagingService.getMessageHistory.bind(messagingService),
    getOrdonnanceHistory: messagingService.getOrdonnanceHistory.bind(messagingService),

    // 🔑 NOUVELLES MÉTHODES DE CRÉATION ET GESTION
    createConversation: messagingService.createConversation.bind(messagingService),
    createConversationFromContext: messagingService.createConversationFromContext.bind(messagingService),
    sendMessageToConversation: messagingService.sendMessageToConversation.bind(messagingService),
    checkMessagingPermissions: messagingService.checkMessagingPermissions.bind(messagingService),

    // 🔑 NOUVELLES MÉTHODES UTILITAIRES
    normalizeConversations: messagingService.normalizeConversations.bind(messagingService),
    normalizeMessages: messagingService.normalizeMessages.bind(messagingService),
    enrichMessagesWithUserInfo: messagingService.enrichMessagesWithUserInfo.bind(messagingService),
    extractContextFromTitle: messagingService.extractContextFromTitle.bind(messagingService),
    extractContextIdFromTitle: messagingService.extractContextIdFromTitle.bind(messagingService),

    // 🔑 NOUVELLES MÉTHODES DE GESTION DU CACHE
    getFromCache: messagingService.getFromCache.bind(messagingService),
    setCache: messagingService.setCache.bind(messagingService),
    invalidateMedecinCache: messagingService.invalidateMedecinCache.bind(messagingService),
    invalidateConversationCache: messagingService.invalidateConversationCache.bind(messagingService),
    clearCache: messagingService.clearCache.bind(messagingService),

    // 🔑 NOUVELLES MÉTHODES DE GESTION DES MESSAGES
    isMessageFromUser: messagingService.isMessageFromUser.bind(messagingService),
    normalizeMessageForDisplay: messagingService.normalizeMessageForDisplay.bind(messagingService),

    // Service direct (pour les opérations HTTP + WebSocket)
    service: messagingService
  };
};

export default useMessaging;