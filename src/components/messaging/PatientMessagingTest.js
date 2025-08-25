// src/components/messaging/PatientMessagingTest.js

import React, { useState } from 'react';
import { FaComments, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import useMessaging from '../../hooks/useMessaging';
import messagingService from '../../services/api/messagingApi';

const PatientMessagingTest = () => {
  const [showStatus, setShowStatus] = useState(false);
  const { isConnected } = useMessaging();

  const handleTestWebSocket = () => {
    setShowStatus(true);
    console.log('🔍 [PatientMessagingTest] Test WebSocket côté patient');
    console.log('  - Statut connexion:', isConnected);
    console.log('  - Service disponible:', !!messagingService);
    console.log('  - Token utilisateur:', messagingService.getCurrentUserFromToken());
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 border z-40">
      <div className="flex items-center space-x-3 mb-3">
        <FaComments className="text-blue-600" />
        <h3 className="font-semibold text-sm">Test WebSocket Patient</h3>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={handleTestWebSocket}
          className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Tester WebSocket
        </button>
        
        {showStatus && (
          <div className="text-xs space-y-1">
            <div className="flex items-center space-x-2">
              <span>Connexion:</span>
              {isConnected ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <FaTimesCircle className="text-red-500" />
              )}
            </div>
            <div className="text-gray-600">
              {isConnected ? 'WebSocket actif' : 'WebSocket inactif'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientMessagingTest;
