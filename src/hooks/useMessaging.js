// src/hooks/useMessaging.js

import { useState, useEffect } from 'react';
import messagingService from '../services/api/messagingApi';

const useMessaging = () => {
  const [isConnected, setIsConnected] = useState(messagingService.isConnected);

  useEffect(() => {
    // S'assurer que la connexion WebSocket est établie
    if (!messagingService.isConnected) {
      messagingService.connectWebSocket();
    }

    // S'abonner aux changements d'état de connexion
    const unsubscribe = messagingService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    // Mettre à jour l'état initial
    setIsConnected(messagingService.isConnected);

    return () => {
      unsubscribe();
    };
  }, []);

  // Fonctions utiles pour la gestion des conversations
  const joinConversation = (conversationId) => {
    messagingService.joinConversation(conversationId);
  };

  const leaveConversation = (conversationId) => {
    messagingService.leaveConversation(conversationId);
  };

  const subscribeToMessages = (callback) => {
    return messagingService.onNewMessage(callback);
  };

  return { 
    isConnected,
    joinConversation,
    leaveConversation,
    subscribeToMessages
  };
};

export default useMessaging;