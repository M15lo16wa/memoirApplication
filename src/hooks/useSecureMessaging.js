// src/hooks/useSecureMessaging.js

import { useState, useEffect, useCallback, useRef } from 'react';
import messagingService from '../services/api/messagingApi';

const useSecureMessaging = (contextType, contextId, initialMedecinInfo) => {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUserRef = useRef(messagingService.getCurrentUserFromToken());

  // Charger l'historique initial des messages
  useEffect(() => {
    if (!contextType || !contextId) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const history = await messagingService.getMessageHistory(contextType, contextId);

        if (history.conversation) {
            const convId = history.conversation.id || history.conversation.id_conversation;
            setConversationId(convId);
            setMessages(history.messages || []);
            messagingService.joinConversation(convId);
        } else {
            setMessages([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [contextType, contextId]);

  // S'abonner aux nouveaux messages en temps réel via WebSocket
  useEffect(() => {
    if (!conversationId) return;
    const handleNewMessage = (newMessage) => {
      // Le backend envoie l'ID de conv dans la propriété `conversation_id` ou `conversationId`
      const msgConvId = newMessage.conversation_id || newMessage.conversationId;
      if (Number(msgConvId) === Number(conversationId)) {
        setMessages(prevMessages => {
          if (prevMessages.some(msg => msg.id === newMessage.id)) return prevMessages;
          return [...prevMessages, newMessage];
        });
      }
    };
    const unsubscribe = messagingService.onNewMessage(handleNewMessage);
    return unsubscribe;
  }, [conversationId]);


  // Fonction pour envoyer un message
  const sendMessage = useCallback(async (content) => {
    const currentUser = currentUserRef.current;

    // === CORRECTION CLÉ : VÉRIFICATION DE SÉCURITÉ ===
    if (!currentUser) {
        const errorMessage = "Erreur: Utilisateur non authentifié. Impossible d'envoyer le message.";
        console.error(`❌ [useSecureMessaging] ${errorMessage}`);
        setError(errorMessage); // Met à jour l'état pour afficher l'erreur dans l'UI
        return; // Arrête l'exécution pour éviter le crash
    }
    // ===============================================

    if (!content.trim() || !conversationId) {
      console.error("❌ Envoi impossible : contenu vide ou ID de conversation manquant.");
      return;
    }
    
    const tempMessage = {
      id: `temp_${Date.now()}`,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending',
      expediteur_info: { id: currentUser.id, type: currentUser.role, nom: 'Vous', prenom: '' },
      sender: { id: currentUser.id, type: currentUser.role, name: 'Vous' }
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const messageData = {
        contenu: content.trim(),
        type_message: 'texte',
      };
      
      const sentMessage = await messagingService.sendMessageToConversation(conversationId, messageData);
      setMessages(prev => prev.map(msg => (msg.id === tempMessage.id ? sentMessage : msg)));
    
    } catch (err) {
      console.error("❌ [useSecureMessaging] Erreur lors de l'envoi du message:", err);
      setMessages(prev => prev.map(msg => (msg.id === tempMessage.id ? { ...tempMessage, status: 'error' } : msg)));
    }
  }, [conversationId]);

  return { messages, loading, error, sendMessage, conversationId };
};

export default useSecureMessaging;