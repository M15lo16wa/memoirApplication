import React, { useState, useEffect, useCallback } from 'react';
import signalingService from '../../services/signalingService';

const MessagingWidget = ({ userId, role, token, conversationId, toUserId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialiser la connexion
  // 
  // Initialiser la connexion
  useEffect(() => {
    if (userId && role && token) {
      signalingService.connect();

      signalingService.on('connect', () => {
        console.log('✅ Connecté au service de messagerie');
        setIsConnected(true);
        setError(null);

        if (conversationId) {
          signalingService.joinConversation(conversationId);
          loadMessageHistory();
        }
      });

      signalingService.on('disconnect', () => {
        console.log('❌ Déconnecté du service de messagerie');
        setIsConnected(false);
        setError("Connexion perdue");
      });

      signalingService.on('connect_error', (error) => {
        console.error('❌ Erreur de connexion:', error);
        setError("Erreur de connexion au serveur");
      });

      // Écouter les nouveaux messages
      signalingService.onMessageReceived((data) => {
        console.log('�� Nouveau message reçu:', data);
        setMessages(prev => [...prev, {
          id: data.messageId || Date.now(),
          sender: data.expediteur_id === userId ? role : 'autre',
          content: data.contenu,
          timestamp: data.timestamp || new Date().toISOString(),
          type: data.type_message || 'text'
        }]);
      });

      return () => {
        if (conversationId) {
          signalingService.leaveConversation(conversationId);
        }
        signalingService.closeConnection();
      };
    }
  }, [userId, role, token, conversationId, loadMessageHistory]);
  // Charger l'historique des messages
  const loadMessageHistory = useCallback(async () => {
    try {
      setLoading(true);
      if (conversationId) {
        const response = await signalingService.getConversationMessages(conversationId, 1, 50);
        if (response.success) {
          const formattedMessages = response.messages.map(msg => ({
            id: msg.id,
            sender: msg.expediteur_id === userId ? role : 'autre',
            content: msg.contenu,
            timestamp: msg.timestamp || new Date().toISOString(),
            type: msg.type_message || 'text'
          }));
          setMessages(formattedMessages);
        } else {
          setError("Erreur lors du chargement des messages");
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement de l'historique:", err);
      setError("Impossible de charger les messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId, role]);

  // Envoyer un message
  const handleSend = useCallback(() => {
    if (input.trim() && isConnected) {
      try {
        if (conversationId) {
          signalingService.sendMessage(conversationId, input.trim());
        } else if (toUserId) {
          signalingService.createConversation([toUserId], 'private')
            .then(response => {
              if (response.success && response.conversation.id) {
                signalingService.joinConversation(response.conversation.id);
                signalingService.sendMessage(response.conversation.id, input.trim());
              }
            });
        }

        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: role,
          content: input.trim(),
          timestamp: new Date().toISOString(),
          type: 'text',
          pending: true
        }]);

        setInput("");
      } catch (err) {
        console.error("Erreur lors de l'envoi du message:", err);
        setError("Erreur lors de l'envoi du message");
      }
    }
  }, [input, isConnected, conversationId, toUserId, role]);
  // Rendu minimal pour éviter les erreurs React
  return (
    <div>
      {loading ? "Chargement..." : null}
      {error ? <div style={{color: 'red'}}>{error}</div> : null}
      <ul>
        {messages.map(msg => (
          <li key={msg.id}>{msg.content}</li>
        ))}
      </ul>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={handleSend} disabled={!isConnected}>Envoyer</button>
    </div>
  );
}

export default MessagingWidget;
