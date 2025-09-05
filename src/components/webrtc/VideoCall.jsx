// src/components/webrtc/VideoCall.jsx
import React, { useRef, useEffect } from 'react';

/**
 * Composant d'appel vidéo
 * Interface simplifiée pour les appels vidéo
 */
const VideoCall = ({ 
  localStream, 
  remoteStream, 
  isConnected, 
  isMuted, 
  isVideoOff, 
  onToggleAudio, 
  onToggleVideo, 
  onEndCall 
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Mettre à jour les éléments vidéo
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="bg-gray-900 text-white rounded-lg overflow-hidden">
      {/* Zone vidéo */}
      <div className="relative p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vidéo distante */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
              Participant distant
            </div>
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="text-4xl mb-2">👤</div>
                  <p className="text-gray-400">En attente de connexion...</p>
                </div>
              </div>
            )}
          </div>

          {/* Vidéo locale */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
              Vous {isVideoOff && '(Vidéo coupée)'}
            </div>
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <div className="text-center">
                  <div className="text-4xl mb-2">📹</div>
                  <p className="text-gray-400">Vidéo coupée</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contrôles */}
      <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
        <div className="flex items-center justify-center space-x-4">
          {/* Bouton Audio */}
          <button
            onClick={onToggleAudio}
            className={`p-3 rounded-full transition-colors ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            title={isMuted ? 'Activer le micro' : 'Couper le micro'}
          >
            {isMuted ? '��' : '🎤'}
          </button>

          {/* Bouton Vidéo */}
          <button
            onClick={onToggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoOff 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            title={isVideoOff ? 'Activer la caméra' : 'Couper la caméra'}
          >
            {isVideoOff ? '��' : '📷'}
          </button>

          {/* Bouton Terminer */}
          <button
            onClick={onEndCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            title="Terminer l'appel"
          >
            ��
          </button>
        </div>

        {/* Statut de connexion */}
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>
            {isConnected 
              ? '✅ Connexion établie' 
              : '⏳ Connexion en cours...'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;