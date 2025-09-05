// src/components/webrtc/WebRTCProvider.jsx
import React, { createContext, useContext } from 'react';

/**
 * Contexte WebRTC
 * Permet de partager l'état WebRTC entre les composants
 */
const WebRTCContext = createContext();

/**
 * Provider WebRTC
 * Fournit le contexte WebRTC aux composants enfants
 */
export const WebRTCProvider = ({ children }) => {
  const value = {
    // Le contexte sera rempli par les composants qui l'utilisent
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte WebRTC
 */
export const useWebRTCContext = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTCContext doit être utilisé dans un WebRTCProvider');
  }
  return context;
};

export default WebRTCProvider;