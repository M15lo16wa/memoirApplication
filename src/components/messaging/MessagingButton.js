// src/components/messaging/MessagingButton.js

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FaComments, FaTimes, FaShieldAlt } from 'react-icons/fa';

// === CORRECTION CLÉ ===
// On utilise un import nommé { SecureMessaging } pour correspondre à l'export nommé.
import { SecureMessaging } from './SecureMessaging';

const MessagingButton = ({ contextType, contextId, contextTitle, className = '', medecinInfo = null, currentUserName = null, currentUserRole = null }) => {
  const [showMessaging, setShowMessaging] = useState(false);

  const handleOpenMessaging = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!contextType || !contextId) {
      alert('Configuration de la messagerie incomplète.');
      return;
    }
    setShowMessaging(true);
  };

  const handleCloseMessaging = () => {
    setShowMessaging(false);
  };

  if (!contextType || !contextId) return null;

  return (
    <>
      <button
        onClick={handleOpenMessaging}
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
        title={`Discuter à propos de ${contextType} #${contextId}`}
      >
        <FaComments />
        <span>Discuter</span>
      </button>

      {showMessaging && createPortal(
        <SecureMessaging
          contextType={contextType}
          contextId={contextId}
          medecinInfo={medecinInfo}
          isOpen={showMessaging}
          onClose={handleCloseMessaging}
          currentUserName={currentUserName}
          currentUserRole={currentUserRole}
        />,
        document.body
      )}
    </>
  );
};

export default MessagingButton;