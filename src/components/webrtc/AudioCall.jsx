// src/components/webrtc/AudioCall.jsx
import React from 'react';

/**
 * Composant d'appel audio
 * Interface pour les appels audio uniquement
 */
const AudioCall = ({ 
  isConnected, 
  isMuted, 
  onToggleAudio, 
  onEndCall,
  participantName = 'Participant'
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      {/* Avatar */}
      <div className="mb-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">👤</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-800">
          {participantName}
        </h3>
        <p className="text-gray-600">
          {isConnected ? 'En appel' : 'Connexion...'}
        </p>
      </div>

      {/* Statut de connexion */}
      <div className="mb-6">
        <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
          isConnected ? 'bg-green-500' : 'bg-yellow-500'
        }`}></div>
        <p className="text-sm text-gray-600">
          {isConnected ? 'Connecté' : 'Connexion en cours...'}
        </p>
      </div>

      {/* Contrôles */}
      <div className="flex items-center justify-center space-x-4">
        {/* Bouton Audio */}
        <button
          onClick={onToggleAudio}
          className={`p-4 rounded-full transition-colors ${
            isMuted 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-gray-600 hover:bg-gray-500'
          }`}
          title={isMuted ? 'Activer le micro' : 'Couper le micro'}
        >
          <span className="text-2xl">
            {isMuted ? '��' : '��'}
          </span>
        </button>

        {/* Bouton Terminer */}
        <button
          onClick={onEndCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          title="Terminer l'appel"
        >
          <span className="text-2xl">📞</span>
        </button>
      </div>

      {/* Informations */}
      <div className="mt-6 text-sm text-gray-500">
        <p>Appel audio en cours</p>
        {isMuted && (
          <p className="text-red-600">Micro coupé</p>
        )}
      </div>
    </div>
  );
};

export default AudioCall;