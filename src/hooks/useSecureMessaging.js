// src/hooks/useSecureMessaging.js

import { useState, useEffect, useCallback, useRef } from 'react';
import messagingService from '../services/api/messagingApi';

const useSecureMessaging = (conversationIdProp) => {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(conversationIdProp);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUserRef = useRef(messagingService.getCurrentUserFromToken());

  // === CORRECTION CLÉ ===
  // Le hook est simplifié pour ne dépendre que de l'ID de la conversation.
  useEffect(() => {
    if (!conversationIdProp) {
        setLoading(false);
        setError("Aucun identifiant de conversation n'a été fourni.");
        return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);


        // On appelle la fonction qui charge les messages par l'ID de la conversation.
        const result = await messagingService.getConversationMessages(conversationIdProp);

        if (result && result.conversation) {
            setConversationId(result.conversation.id);
            setMessages(result.messages || []);
            // S'assurer de rejoindre la "room" WebSocket pour les messages en temps réel
            messagingService.joinConversation(result.conversation.id);
        } else {
            // Si la conversation n'est pas trouvée, result.conversation sera null.
            throw new Error("La conversation n'a pas pu être chargée ou n'existe pas.");
        }
      } catch (err) {
        console.error("❌ [useSecureMessaging] Erreur lors du chargement des messages:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    // On ré-exécute cet effet si l'ID de la conversation change
  }, [conversationIdProp]);

  // S'abonner aux nouveaux messages en temps réel via WebSocket
  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (newMessage) => {
      const msgConvId = newMessage.conversation_id || newMessage.conversationId;
      if (Number(msgConvId) === Number(conversationId)) {
        setMessages(prevMessages => {
          // Évite d'ajouter un message déjà présent
          if (prevMessages.some(msg => msg.id === newMessage.id)) return prevMessages;
          return [...prevMessages, newMessage];
        });
      }
    };
    
    const unsubscribe = messagingService.onNewMessage(handleNewMessage);
    
    // Se désabonner lors du démontage du composant ou si l'ID change
    return () => unsubscribe();
  }, [conversationId]);

  // Fonction pour envoyer un message
  const sendMessage = useCallback(async (content) => {
    const currentUser = currentUserRef.current;
    if (!currentUser || !conversationId) {
        const errorMessage = !currentUser ? "Utilisateur non authentifié." : "ID de conversation manquant.";
        setError(errorMessage);
        return;
    }
    if (!content.trim()) return;
    
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
      const messageData = { contenu: content.trim() };
      const sentMessage = await messagingService.sendMessageToConversation(conversationId, messageData);
      // Remplace le message temporaire par le message confirmé par le serveur
      setMessages(prev => prev.map(msg => (msg.id === tempMessage.id ? sentMessage : msg)));
    } catch (err) {
      // Met à jour le statut du message temporaire en cas d'échec
      setMessages(prev => prev.map(msg => (msg.id === tempMessage.id ? { ...tempMessage, status: 'error' } : msg)));
      setError("L'envoi du message a échoué.");
    }
  }, [conversationId]);

  return { messages, loading, error, sendMessage, conversationId };
};

export default useSecureMessaging;