import React, { useState, useEffect } from 'react';
import { FaWifi, FaExclamationTriangle, FaCheckCircle, FaSync } from 'react-icons/fa';
import useMessaging from '../../hooks/useMessaging';

const WebSocketDiagnostic = () => {
  const [diagnosticInfo, setDiagnosticInfo] = useState({
    token: null,
    tokenValid: false,
    connectionAttempts: 0,
    lastError: null,
    serverStatus: 'unknown'
  });

  const { 
    isConnected, 
    socketId, 
    connectWebSocket, 
    disconnectWebSocket,
    service 
  } = useMessaging();

  // Vérifier le token d'authentification
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('jwt') || 
                   localStorage.getItem('firstConnectionToken') || 
                   localStorage.getItem('originalJWT');
      
      if (token) {
        try {
          // Vérifier si le token est un JWT valide
          const parts = token.split('.');
          const isValid = parts.length === 3 && 
                         parts[0].length > 0 && 
                         parts[1].length > 0 && 
                         parts[2].length > 0;
          
          setDiagnosticInfo(prev => ({
            ...prev,
            token: token.substring(0, 20) + '...',
            tokenValid: isValid
          }));
        } catch (error) {
          setDiagnosticInfo(prev => ({
            ...prev,
            token: 'Token invalide',
            tokenValid: false
          }));
        }
      } else {
        setDiagnosticInfo(prev => ({
          ...prev,
          token: 'Aucun token trouvé',
          tokenValid: false
        }));
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tester la connexion au serveur
  const testServerConnection = async () => {
    try {
      setDiagnosticInfo(prev => ({ ...prev, serverStatus: 'testing' }));
      
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setDiagnosticInfo(prev => ({ ...prev, serverStatus: 'online' }));
      } else {
        setDiagnosticInfo(prev => ({ ...prev, serverStatus: 'error' }));
      }
    } catch (error) {
      setDiagnosticInfo(prev => ({ 
        ...prev, 
        serverStatus: 'offline',
        lastError: error.message 
      }));
    }
  };

  // Forcer la connexion WebSocket
  const forceWebSocketConnection = () => {
    const token = localStorage.getItem('jwt') || 
                 localStorage.getItem('firstConnectionToken') || 
                 localStorage.getItem('originalJWT');
    
    if (token) {
      console.log('🔌 [WebSocketDiagnostic] Forçage de la connexion WebSocket...');
      connectWebSocket(token);
      setDiagnosticInfo(prev => ({ 
        ...prev, 
        connectionAttempts: prev.connectionAttempts + 1 
      }));
    } else {
      console.warn('⚠️ [WebSocketDiagnostic] Aucun token disponible pour la connexion');
    }
  };

  // Vider le cache et reconnecter
  const clearCacheAndReconnect = () => {
    try {
      service.clearCache();
      console.log('🗑️ [WebSocketDiagnostic] Cache vidé');
      
      // Reconnecter après un court délai
      setTimeout(() => {
        forceWebSocketConnection();
      }, 1000);
    } catch (error) {
      console.error('❌ [WebSocketDiagnostic] Erreur lors du nettoyage du cache:', error);
    }
  };

  // Obtenir le statut du serveur
  const getServerStatusIcon = () => {
    switch (diagnosticInfo.serverStatus) {
      case 'online':
        return <FaCheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <FaExclamationTriangle className="w-4 h-4 text-red-500" />;
      case 'testing':
        return <FaSync className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <FaExclamationTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getServerStatusText = () => {
    switch (diagnosticInfo.serverStatus) {
      case 'online':
        return 'Serveur en ligne';
      case 'offline':
        return 'Serveur hors ligne';
      case 'testing':
        return 'Test en cours...';
      default:
        return 'Statut inconnu';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        <FaWifi className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Diagnostic WebSocket</h3>
      </div>

      {/* Statut de la connexion */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Connexion WebSocket:</span>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-white text-xs rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </span>
            {isConnected && socketId && (
              <span className="text-xs text-gray-600" title={`Socket ID: ${socketId}`}>
                ID: {socketId.substring(0, 8)}...
              </span>
            )}
          </div>
        </div>

        {/* Token d'authentification */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Token JWT:</span>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-white text-xs rounded-full ${diagnosticInfo.tokenValid ? 'bg-green-500' : 'bg-red-500'}`}>
              {diagnosticInfo.tokenValid ? 'Valide' : 'Invalide'}
            </span>
            <span className="text-xs text-gray-600 font-mono">
              {diagnosticInfo.token}
            </span>
          </div>
        </div>

        {/* Statut du serveur */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Serveur:</span>
          <div className="flex items-center space-x-2">
            {getServerStatusIcon()}
            <span className="text-sm text-gray-600">{getServerStatusText()}</span>
          </div>
        </div>

        {/* Informations de diagnostic */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Tentatives de connexion:</span>
          <span className="text-sm text-gray-600">{diagnosticInfo.connectionAttempts}</span>
        </div>

        {diagnosticInfo.lastError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-sm font-medium text-red-700">Dernière erreur:</span>
            <p className="text-xs text-red-600 mt-1">{diagnosticInfo.lastError}</p>
          </div>
        )}
      </div>

      {/* Actions de diagnostic */}
      <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={testServerConnection}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <FaSync className="w-4 h-4" />
          <span>Tester le serveur</span>
        </button>

        <button
          onClick={forceWebSocketConnection}
          className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <FaWifi className="w-4 h-4" />
          <span>Forcer la connexion</span>
        </button>

        <button
          onClick={clearCacheAndReconnect}
          className="px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
        >
          <FaSync className="w-4 h-4" />
          <span>Vider cache + reconnecter</span>
        </button>
      </div>

      {/* Logs de diagnostic */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Logs de diagnostic:</h4>
        <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono max-h-32 overflow-y-auto">
          <div>🔍 [WebSocketDiagnostic] Composant monté</div>
          <div>🔍 [WebSocketDiagnostic] Vérification du token...</div>
          <div>🔍 [WebSocketDiagnostic] Statut de connexion: {isConnected ? 'Connecté' : 'Déconnecté'}</div>
          {socketId && <div>🔍 [WebSocketDiagnostic] Socket ID: {socketId}</div>}
          {diagnosticInfo.lastError && <div>❌ [WebSocketDiagnostic] Erreur: {diagnosticInfo.lastError}</div>}
        </div>
      </div>
    </div>
  );
};

export default WebSocketDiagnostic;
