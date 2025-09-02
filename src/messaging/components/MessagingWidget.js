// src/messaging/components/MessagingWidget.js
import React, { useState, useEffect, useCallback } from 'react';
import { FaComments, FaSpinner, FaPaperPlane } from 'react-icons/fa';
import signalingService from '../../services/signalingService';

const MessagingWidget = ({ userId, role, token, conversationId, toUserId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialiser la connexion
  useEffect(() => {
    if (userId && role && token) {
      console.log('🔌 Initialisation du widget de messagerie:', { userId, role, conversationId });
      
      // Initialiser le service
      signalingService.initialize();
      
      // Se connecter
      const socket = signalingService.connectSocket(userId, role, token);

      if (socket) {
        socket.on('connect', () => {
          console.log('✅ Widget connecté au service de messagerie');
          setIsConnected(true);
          setError(null);

          if (conversationId) {
            signalingService.joinConversation(conversationId);
            loadMessageHistory();
          }
        });

        socket.on('disconnect', (reason) => {
          console.log('❌ Widget déconnecté du service de messagerie');
          setIsConnected(false);
          setError("Connexion perdue");
        });

        socket.on('connect_error', (error) => {
          console.error('❌ Erreur de connexion widget:', error);
          setError("Erreur de connexion au serveur");
        });

        // Écouter les nouveaux messages
        socket.on('new_message', (data) => {
          console.log('📨 Nouveau message reçu dans le widget:', data);
          if (data.conversationId === conversationId) {
            setMessages(prev => [...prev, {
              id: data.messageId || Date.now(),
              sender: data.senderId === userId ? role : (role === 'patient' ? 'medecin' : 'patient'),
              content: data.message || data.contenu,
              timestamp: data.timestamp || new Date().toISOString(),
              type: data.type || data.type_message || 'text'
            }]);
          }
        });

        // Vérifier l'état de connexion immédiatement
        if (socket.connected) {
          console.log('✅ Widget déjà connecté');
          setIsConnected(true);
          if (conversationId) {
            loadMessageHistory();
          }
        }
      } else {
        console.error('❌ Impossible de créer la connexion WebSocket pour le widget');
        setError("Impossible de se connecter au service de messagerie");
      }

      return () => {
        if (conversationId) {
          signalingService.leaveConversation(conversationId);
        }
        signalingService.closeConnection();
      };
    }
  }, [userId, role, token, conversationId]);

  // Charger l'historique des messages
  const loadMessageHistory = useCallback(async () => {
    try {
      setLoading(true);
      if (conversationId) {
        const response = await signalingService.getConversationMessages(conversationId, 50, 0);
        if (response.success) {
          const formattedMessages = response.messages.map(msg => ({
            id: msg.id,
            sender: msg.expediteur_id === userId ? role : (role === 'patient' ? 'medecin' : 'patient'),
            content: msg.contenu || msg.content,
            timestamp: msg.timestamp || new Date().toISOString(),
            type: msg.type_message || msg.type || 'text'
          }));
          setMessages(formattedMessages);
          console.log('✅ Historique des messages chargé:', formattedMessages.length);
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
  const handleSend = useCallback(async () => {
    if (input.trim() && isConnected) {
      try {
        if (conversationId) {
          const result = await signalingService.sendMessage(conversationId, input.trim(), 'texte');
          if (result.success) {
            // Ajouter le message localement
            setMessages(prev => [...prev, {
              id: Date.now(),
              sender: role,
              content: input.trim(),
              timestamp: new Date().toISOString(),
              type: 'text'
            }]);
            setInput("");
            console.log('✅ Message envoyé avec succès');
          } else {
            setError("Erreur lors de l'envoi du message");
          }
        } else if (toUserId) {
          // Créer une nouvelle conversation
          const result = await signalingService.createConversation(
            role === 'patient' ? userId : toUserId,
            role === 'medecin' ? userId : toUserId,
            'patient_medecin'
          );
          
          if (result.success && result.conversation?.id) {
            const newConversationId = result.conversation.id;
            signalingService.joinConversation(newConversationId);
            
            // Envoyer le message dans la nouvelle conversation
            const sendResult = await signalingService.sendMessage(newConversationId, input.trim(), 'texte');
            if (sendResult.success) {
              setMessages([{
                id: Date.now(),
                sender: role,
                content: input.trim(),
                timestamp: new Date().toISOString(),
                type: 'text'
              }]);
              setInput("");
              console.log('✅ Nouvelle conversation créée et message envoyé');
            }
          } else {
            setError("Erreur lors de la création de la conversation");
          }
        }
      } catch (err) {
        console.error("Erreur lors de l'envoi du message:", err);
        setError("Erreur lors de l'envoi du message");
      }
    }
  }, [input, isConnected, conversationId, toUserId, role, userId]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-md">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaComments className="text-blue-500" />
          Messagerie
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ×
          </button>
        )}
      </div>

      {/* Statut de connexion */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm text-gray-600">
          {isConnected ? 'Connecté' : 'Déconnecté'}
        </span>
      </div>

      {/* Messages */}
      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <FaSpinner className="animate-spin text-blue-500 mr-2" />
            <span className="text-gray-600">Chargement...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <FaComments className="text-2xl mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun message</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded-lg text-sm ${
                msg.sender === role
                  ? "bg-blue-100 text-blue-800 ml-8"
                  : "bg-gray-100 text-gray-700 mr-8"
              }`}
            >
              <div className="font-medium text-xs mb-1">
                {msg.sender === role ? "Moi" : (msg.sender === 'patient' ? 'Patient' : 'Médecin')}
              </div>
              <div>{msg.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Zone de saisie */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Écrire un message..."
          disabled={!isConnected}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !isConnected}
          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaPaperPlane className="text-sm" />
        </button>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
          {error}
        </div>
      )}
    </div>
  );
};

export default MessagingWidget;
