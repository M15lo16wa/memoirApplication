// src/components/messaging/MessagingButton.js

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FaComments, FaSpinner } from 'react-icons/fa';
import SecureMessaging from './SecureMessaging';
import messagingService from '../../services/api/messagingApi';

const MessagingButton = ({
  contextType,
  contextId,
  className = '',
  contextTitle,
  medecinInfo,
  currentUserName,
  currentUserRole
}) => {
  const [showMessaging, setShowMessaging] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpenMessaging = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!contextType || !contextId) {
      setError('Configuration de la messagerie incomplète.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Utilise la nouvelle méthode pour créer ou trouver une conversation
      const conversation = await messagingService.findOrCreateConversationForContext(
        contextType, 
        contextId,
        medecinInfo
      );
      
      if (conversation && conversation.id_conversation) {
        setConversationId(conversation.id_conversation);
        setShowMessaging(true);
      } else {
        throw new Error("Impossible de créer ou récupérer la conversation");
      }
    } catch (error) {
      console.error("Erreur au démarrage de la conversation:", error);
      setError(error.message || "Impossible de démarrer la conversation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseMessaging = () => {
    setShowMessaging(false);
    setConversationId(null);
    setError(null);
  };

  if (!contextType || !contextId) return null;

  return (
    <>
      <button
        onClick={handleOpenMessaging}
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={contextTitle || `Discuter à propos de ${contextType} #${contextId}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <FaSpinner className="animate-spin" />
        ) : (
          <FaComments />
        )}
        <span>
          {isLoading 
            ? 'Chargement...' 
            : (contextTitle ? 'Discuter' : `Discuter de ${contextType}`)
          }
        </span>
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {showMessaging && conversationId && createPortal(
        <SecureMessaging
          conversationId={conversationId}
          isOpen={showMessaging}
          onClose={handleCloseMessaging}
          contextType={contextType}
          contextId={contextId}
        />,
        document.body
      )}
    </>
  );
};

export default MessagingButton;