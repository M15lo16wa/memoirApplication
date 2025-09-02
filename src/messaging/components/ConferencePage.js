// src/messaging/components/ConferencePage.js
import React from 'react';
import WebRTCWidget from './WebRTCWidget';

// Page simple qui héberge le widget WebRTC en auto-join via l'URL
const ConferencePage = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <WebRTCWidget conversationId={null} isInitiator={false} initialConferenceLink={null} onClose={() => { window.close?.(); }} />
    </div>
  );
};

export default ConferencePage;



