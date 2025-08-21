import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaPaperclip, FaMicrophone, FaSmile, FaTimes, FaShieldAlt, FaUserMd, FaUser } from 'react-icons/fa';
import useSecureMessaging from '../../hooks/useSecureMessaging';

const SecureMessaging = ({ contextType, contextId, onClose, isOpen }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const {
    messages,
    isConnected,
    loading,
    error,
    typingUsers,
    sendMessage,
    sendMessageAsMedecin,
    markMessageAsRead,
    sendTypingIndicator,
    getContextInfo,
    canAccessMessaging,
    currentUser,
    isPatient,
    isMedecin
  } = useSecureMessaging(contextType, contextId);

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Marquer les messages comme lus quand ils sont visibles
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.status === 'sent' && msg.sender.id !== currentUser?.id) {
        markMessageAsRead(msg.id);
      }
    });
  }, [messages, currentUser, markMessageAsRead]);

  // Gérer la frappe
  useEffect(() => {
    let timeout;
    if (isTyping) {
      sendTypingIndicator(true);
      timeout = setTimeout(() => {
        setIsTyping(false);
        sendTypingIndicator(false);
      }, 1000);
    }
    return () => clearTimeout(timeout);
  }, [isTyping, sendTypingIndicator]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      if (isPatient) {
        await sendMessage(message.trim());
      } else if (isMedecin) {
        await sendMessageAsMedecin(message.trim());
      }
      
      setMessage('');
      setIsTyping(false);
      sendTypingIndicator(false);
      
      // Focus sur l'input après envoi
      inputRef.current?.focus();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const getMessageBubbleClass = (message) => {
    const isOwnMessage = message.sender.id === currentUser?.id;
    const isSystemMessage = message.type === 'system';
    
    if (isSystemMessage) {
      return 'bg-gray-100 text-gray-600 text-center text-sm py-2 px-4 rounded-lg mx-auto max-w-xs';
    }
    
    if (isOwnMessage) {
      return 'bg-blue-500 text-white ml-auto max-w-xs lg:max-w-md';
    } else {
      return 'bg-gray-200 text-gray-800 mr-auto max-w-xs lg:max-w-md';
    }
  };

  const getSenderInfo = (message) => {
    if (message.type === 'system') return null;
    
    const isOwnMessage = message.sender.id === currentUser?.id;
    if (isOwnMessage) return null;
    
    return (
      <div className="flex items-center space-x-2 mb-1">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
          message.sender.type === 'medecin' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
        }`}>
          {message.sender.type === 'medecin' ? <FaUserMd /> : <FaUser />}
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {message.sender.name}
        </span>
      </div>
    );
  };

  if (!canAccessMessaging()) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <FaShieldAlt className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Accès non autorisé</h3>
            <p className="text-gray-600 mb-4">
              Vous n'avez pas l'autorisation d'accéder à cette messagerie.
            </p>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contextInfo = getContextInfo();

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{contextInfo.icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{contextInfo.title}</h3>
              <p className="text-sm text-gray-600">{contextInfo.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Statut de connexion */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500">
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
            
            {/* Indicateur de frappe */}
            {typingUsers.length > 0 && (
              <div className="text-xs text-gray-500 italic">
                {typingUsers[0].name} est en train d'écrire...
              </div>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Zone des messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Connexion en cours...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-600">
              <p>Erreur de connexion: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-blue-600 hover:underline"
              >
                Réessayer
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">💬</div>
              <p>Aucun message pour le moment</p>
              <p className="text-sm">Commencez la conversation !</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const showDate = index === 0 || 
                formatDate(msg.timestamp) !== formatDate(messages[index - 1]?.timestamp);
              
              return (
                <div key={msg.id}>
                  {/* Séparateur de date */}
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  
                  {/* Message */}
                  <div className="flex flex-col space-y-1">
                    {getSenderInfo(msg)}
                    <div className={`px-4 py-2 rounded-lg ${getMessageBubbleClass(msg)}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">
                          {formatTime(msg.timestamp)}
                        </span>
                        {msg.status === 'read' && (
                          <span className="text-xs opacity-70">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            {/* Boutons d'action */}
            <div className="flex space-x-1">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Joindre un fichier"
              >
                <FaPaperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Enregistrer un message vocal"
              >
                <FaMicrophone className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Emojis"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <FaSmile className="w-4 h-4" />
              </button>
            </div>
            
            {/* Zone de texte */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={message}
                onChange={handleTyping}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="1"
                style={{ minHeight: '40px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              
              {/* Indicateur de frappe */}
              {isTyping && (
                <div className="absolute -top-6 left-0 text-xs text-gray-500">
                  Vous écrivez...
                </div>
              )}
            </div>
            
            {/* Bouton d'envoi */}
            <button
              type="submit"
              disabled={!message.trim() || !isConnected}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Envoyer le message"
            >
              <FaPaperPlane className="w-4 h-4" />
            </button>
          </form>
          
          {/* Sélecteur d'emojis (simplifié) */}
          {showEmojiPicker && (
            <div className="mt-2 p-2 bg-gray-100 rounded-lg">
              <div className="grid grid-cols-8 gap-1">
                {['😊', '👍', '❤️', '🎉', '🔥', '💯', '👏', '🙏'].map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="text-xl hover:bg-gray-200 rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecureMessaging;
