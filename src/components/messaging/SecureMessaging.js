// src/components/messaging/SecureMessaging.js

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaPaperPlane, FaTimes, FaShieldAlt, FaUserMd, FaUser, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import useSecureMessaging from '../../hooks/useSecureMessaging';
import messagingService from '../../services/api/messagingApi';

const SecureMessaging = ({ 
  conversationId: conversationIdProp, 
  isOpen, 
  onClose,
  contextType,
  contextId
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  const currentUser = useRef(messagingService.getCurrentUserFromToken()).current;
  
  const { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    conversationId,
    conversationData
  } = useSecureMessaging(conversationIdProp);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    await sendMessage(message);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isOwnMessage = useCallback((msg) => {
    if (!msg || !currentUser) return false;
    const senderId = msg.expediteur_info?.id || msg.sender?.id;
    return senderId !== undefined && Number(senderId) === Number(currentUser.id);
  }, [currentUser]);

  const getConversationTitle = () => {
    if (conversationData?.titre) {
      return conversationData.titre;
    }
    if (contextType && contextId) {
      return `${contextType.charAt(0).toUpperCase() + contextType.slice(1)} #${contextId}`;
    }
    return `Conversation ${conversationId || '...'}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <FaShieldAlt className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Messagerie Sécurisée</h3>
              <p className="text-sm text-gray-600">{getConversationTitle()}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
            title="Fermer"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Zone des messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loading && (
            <div className="flex justify-center items-center h-full text-gray-500">
              <FaSpinner className="animate-spin text-blue-500 text-2xl" />
              <span className="ml-3">Chargement des messages...</span>
            </div>
          )}
          
          {error && (
            <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg mb-4 border border-red-200">
              <FaExclamationTriangle className="mx-auto mb-2 text-lg" />
              <div className="font-medium">Erreur</div>
              <div className="text-sm">{error}</div>
            </div>
          )}
          
          {!loading && !error && messages.length === 0 && (
            <div className="text-center text-gray-500 p-8">
              <FaShieldAlt className="mx-auto mb-3 text-3xl text-gray-300" />
              <p>Aucun message dans cette conversation.</p>
              <p className="text-sm">Commencez à échanger de manière sécurisée !</p>
            </div>
          )}
          
          {!loading && !error && messages.map((msg) => {
            const isOwn = isOwnMessage(msg);
            const senderName = msg.sender?.name || 'Utilisateur';
            const senderType = msg.expediteur_info?.type || msg.sender?.type;

            return (
              <div key={msg.id} className={`flex items-end mb-4 gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && (
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${senderType === 'patient' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {senderType === 'patient' ? <FaUser/> : <FaUserMd/>}
                  </div>
                )}
                
                <div className={`max-w-md p-3 rounded-lg ${isOwn ? 'bg-blue-600 text-white' : 'bg-white border shadow-sm'}`}>
                  {!isOwn && (
                    <p className={`text-xs font-bold mb-1 ${senderType === 'patient' ? 'text-green-700' : 'text-blue-700'}`}>
                      {senderName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs opacity-75">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    {msg.status === 'sending' && <FaSpinner className="w-3 h-3 animate-spin opacity-75" />}
                    {msg.status === 'error' && (
                      <span className="text-xs text-red-300 flex items-center">
                        <FaExclamationTriangle className="w-3 h-3 mr-1" />
                        Échec
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="border-t p-4 bg-white">
          {error && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}
          
          <div className="flex items-end space-x-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={conversationId ? "Tapez votre message..." : "Chargement de la conversation..."}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[40px] max-h-32"
              rows={1}
              disabled={loading || !conversationId}
              style={{ 
                height: 'auto',
                minHeight: '40px'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
            <button 
              onClick={handleSendMessage} 
              disabled={!message.trim() || loading || !conversationId} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[44px] h-10"
              title="Envoyer le message"
            >
              <FaPaperPlane className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Appuyez sur Entrée pour envoyer, Maj+Entrée pour un saut de ligne</span>
            <span>🔒 Chiffré de bout en bout</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureMessaging;