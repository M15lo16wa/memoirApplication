// src/messaging/components/ConferencePage.js
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import WebRTCWidget from './WebRTCWidget';

// Page simple qui héberge le widget WebRTC en auto-join via l'URL
const ConferencePage = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const conferenceCode = searchParams.get('code');

  console.log('🎥 ConferencePage - Paramètres reçus:', {
    sessionId,
    conferenceCode,
    fullUrl: window.location.href
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        {/* Informations de debug */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f5e8', borderRadius: '8px', fontSize: '14px', border: '1px solid #4caf50' }}>
          <strong>✅ Interface de conférence WebRTC</strong><br/>
          <div style={{ marginTop: '8px' }}>
            <strong>Session ID:</strong> {sessionId || 'Non spécifié'}<br/>
            <strong>Code de conférence:</strong> {conferenceCode || 'Non spécifié'}<br/>
            <strong>URL complète:</strong> {window.location.href}
          </div>
          <div style={{ marginTop: '10px', padding: '8px', background: '#f0f8ff', borderRadius: '4px', fontSize: '12px' }}>
            <strong>ℹ️ Note:</strong> Cette interface utilise HTTPS sur le port 3001 (React) pour l'affichage et le port 3443 (WebSocket) pour la communication temps réel. WebRTC nécessite HTTPS pour fonctionner.
          </div>
        </div>
        
        <WebRTCWidget 
          conversationId={sessionId} 
          isInitiator={false} 
          initialConferenceLink={conferenceCode} 
          onClose={() => { window.close?.(); }} 
        />
      </div>
    </div>
  );
};

export default ConferencePage;



