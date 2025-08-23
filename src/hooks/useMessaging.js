// src/hooks/useMessaging.js

import { useState, useEffect } from 'react';
import messagingService from '../services/api/messagingApi';

const useMessaging = () => {
  const [isConnected, setIsConnected] = useState(messagingService.isConnected);

  useEffect(() => {
    // S'assurer que la connexion est tentée au montage si nécessaire
    if (!messagingService.isConnected) {
        messagingService.connectWebSocket();
    }
    
    const handleConnectionChange = () => {
      setIsConnected(messagingService.isConnected);
    };

    // Cet écouteur est hypothétique, à implémenter dans le service si besoin.
    // Pour l'instant, on se base sur l'état interne du service.
    // messagingService.onConnectionChange(handleConnectionChange);

    const interval = setInterval(handleConnectionChange, 2000); // Vérifie l'état toutes les 2s

    return () => {
      clearInterval(interval);
      // messagingService.offConnectionChange(handleConnectionChange);
    };
  }, []);

  return { isConnected };
};

export default useMessaging;