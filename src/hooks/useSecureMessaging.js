// src/hooks/useSecureMessaging.js

import { useState, useEffect, useCallback, useRef } from 'react';
import messagingService from '../services/api/messagingApi';

const useSecureMessaging = (contextType, contextId) => {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUserRef = useRef(messagingService.getCurrentUserFromToken());

  useEffect(() => {
    // Sécurité : Ne rien faire si l'ID n'est pas valide
    if (!contextId) {
        setLoading(false);
        setError("Aucun identifiant de conversation n'a été fourni.");
        return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`🔄 [useSecureMessaging] Chargement des messages pour la conversation #${contextId}`);

        // === CORRECTION CLÉ ===
        // On appelle la fonction qui charge les messages par l'ID de la conversation.
        const result = await messagingService.getConversationMessages(contextId);

        if (result && result.conversation) {
            setConversationId(result.conversation.id);
            setMessages(result.messages || []);
            messagingService.joinConversation(result.conversation.id);
        } else {
            throw new Error("La conversation n'a pas pu être chargée.");
        }
      } catch (err) {
        console.error("❌ [useSecureMessaging] Erreur lors du chargement des messages:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [contextId]); // Le hook ne dépend que de l'ID de la conversation

  // S'abonner aux nouveaux messages en temps réel via WebSocket
  useEffect(() => {
    if (!conversationId) return;
    const handleNewMessage = (newMessage) => {
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

  // Fonction pour envoyer un message (inchangée, mais confirmée correcte)
  const sendMessage = useCallback(async (content) => {
    const currentUser = currentUserRef.current;
    if (!currentUser) {
        const errorMessage = "Erreur: Utilisateur non authentifié.";
        setError(errorMessage);
        return;
    }
    if (!content.trim() || !conversationId) return;
    
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
      const messageData = { contenu: content.trim(), type_message: 'texte' };
      const sentMessage = await messagingService.sendMessageToConversation(conversationId, messageData);
      setMessages(prev => prev.map(msg => (msg.id === tempMessage.id ? sentMessage : msg)));
    } catch (err) {
      setMessages(prev => prev.map(msg => (msg.id === tempMessage.id ? { ...tempMessage, status: 'error' } : msg)));
    }
  }, [conversationId]);

  return { messages, loading, error, sendMessage, conversationId };
};

export default useSecureMessaging;