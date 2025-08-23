import React from 'react';
import { FaWifi, FaWifiSlash, FaSync, FaExclamationTriangle } from 'react-icons/fa';

const WebSocketStatus = ({ 
  isConnected, 
  socketId, 
  connectionStatus, 
  lastEvent,
  reconnectAttempts = 0 
}) => {
  const getStatusColor = () => {
    if (isConnected) return 'text-green-600';
    if (reconnectAttempts > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (isConnected) return <FaWifi className="w-4 h-4" />;
    if (reconnectAttempts > 0) return <FaSync className="w-4 h-4 animate-spin" />;
    return <FaWifiSlash className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isConnected) return 'WebSocket connecté';
    if (reconnectAttempts > 0) return `Reconnexion... (${reconnectAttempts})`;
    return 'WebSocket déconnecté';
  };

  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border">
      <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      
      {isConnected && socketId && (
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500">ID:</span>
          <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {socketId.substring(0, 8)}...
          </span>
        </div>
      )}
      
      {lastEvent && (
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500">Dernier événement:</span>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
            {lastEvent}
          </span>
        </div>
      )}
      
      {reconnectAttempts > 5 && (
        <div className="flex items-center space-x-1 text-yellow-600">
          <FaExclamationTriangle className="w-3 h-3" />
          <span className="text-xs">Problème de connexion</span>
        </div>
      )}
    </div>
  );
};

export default WebSocketStatus;
