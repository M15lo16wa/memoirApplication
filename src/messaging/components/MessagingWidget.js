// src/messaging/components/MessagingWidget.js
import React, { useState, useEffect, useCallback } from 'react';
import { FaComments, FaSpinner, FaPaperPlane } from 'react-icons/fa';

const MessagingWidget = ({ userId, role, token, conversationId, toUserId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fonctionnalité gérée côté serveur
    console.log('📞 Service de signalisation supprimé - géré côté serveur');
    setIsConnected(true);
    setLoading(false);
  }, [userId, role, token]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !isConnected) return;

    try {
      // Simulation - remplacer par un vrai appel API
      const newMessage = {
        id: Date.now(),
        sender: role,
        content: input.trim(),
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInput("");
      console.log('📞 Message simulé envoyé:', newMessage);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  }, [input, isConnected, role]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col z-50">
      {/* En-tête */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaComments />
          <span className="font-semibold">Messagerie</span>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 text-lg"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <FaSpinner className="animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <FaComments className="text-2xl mx-auto mb-2 opacity-50" />
            <p>Aucun message</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={`msg-${msg.id}-${index}`}
              className={`flex ${msg.sender === role ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  msg.sender === role
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <div className="text-sm">{msg.content}</div>
                <div className={`text-xs mt-1 ${
                  msg.sender === role ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Zone de saisie */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Écrire un message..."
            disabled={!isConnected}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !isConnected}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagingWidget;