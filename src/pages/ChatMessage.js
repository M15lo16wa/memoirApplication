// src/pages/ChatMessage.js
import React from 'react';
import MessagingWidget from '../messaging/components/MessagingWidget';

const ChatMessage = () => {
  // À adapter selon votre logique d'authentification
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  // conversationId et toUserId peuvent être passés via params ou props

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <MessagingWidget
        userId={userId}
        role={role}
        token={token}
        // conversationId={...}
        // toUserId={...}
      />
    </div>
  );
};

export default ChatMessage;
