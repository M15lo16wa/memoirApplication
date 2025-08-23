// src/components/messaging/SecureMessaging.js

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaPaperPlane, FaTimes, FaShieldAlt, FaUserMd, FaUser, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import useSecureMessaging from '../../hooks/useSecureMessaging';
import messagingService from '../../services/api/messagingApi';

// La définition du composant ne change pas
export const SecureMessaging = ({ 
  contextType, 
  contextId, 
  medecinInfo, 
  isOpen, 
  onClose 
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  const currentUser = useRef(messagingService.getCurrentUserFromToken()).current;
  const { messages, loading, error, sendMessage, conversationId } = useSecureMessaging(contextType, contextId, medecinInfo);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    if (senderId === undefined) return false;
    return Number(senderId) === Number(currentUser.id);
  }, [currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FaShieldAlt className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Messagerie Sécurisée</h3>
              <p className="text-sm text-gray-600">{contextType} #{contextId} (Conv ID: {conversationId || 'Chargement...'})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="w-6 h-6" />
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
            <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
                <FaExclamationTriangle className="mx-auto mb-2 text-lg" />
                Erreur: {error}
            </div>
          )}
          {!loading && messages.map((msg) => {
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
                <div className={`max-w-md p-3 rounded-lg ${isOwn ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                  {isOwn ? (
                    <p className="text-xs font-bold mb-1 text-right text-blue-200">Vous</p>
                  ) : (
                    <p className={`text-xs font-bold mb-1 ${senderType === 'patient' ? 'text-green-700' : 'text-blue-700'}`}>
                      {senderName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs mt-2 opacity-75 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  {msg.status === 'error' && <p className="text-xs text-red-300 mt-1">Échec</p>}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="border-t p-4 bg-white">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={conversationId ? "Tapez votre message..." : "Chargement de la conversation..."}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || !conversationId}
            />
            <button onClick={handleSendMessage} disabled={!message.trim() || loading || !conversationId} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureMessaging;

// === CORRECTION CLÉ ===
// On supprime "export default SecureMessaging;"
// Le mot-clé "export" est maintenant directement sur la définition du composant.