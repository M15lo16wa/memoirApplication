import { useState, useEffect, useRef, useCallback } from 'react';
import WebRTCService from '../services/webrtc.service';

/**
 * Hook personnalisé pour gérer WebRTC
 * Simplifie l'utilisation du service WebRTC dans les composants
 */
const useWebRTC = (token, conferenceCode, userType, user) => {
  // États
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Refs
  const webrtcServiceRef = useRef(null);

  // Initialiser le service WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const service = new WebRTCService();
      webrtcServiceRef.current = service;

      // Définir les callbacks
      service.setCallbacks({
        onConnectionChange: (connected) => {
          setIsConnected(connected);
        },
        onParticipantJoined: (newParticipants) => {
          setParticipants(prev => [...prev, ...newParticipants]);
        },
        onParticipantLeft: (participant) => {
          setParticipants(prev => 
            prev.filter(p => p.id !== participant.participantId)
          );
        },
        onRemoteStream: (stream) => {
          setRemoteStream(stream);
        },
        onError: (error) => {
          console.error('❌ [useWebRTC] Erreur:', error);
          setError(error.message);
        }
      });

      // Initialiser le service
      const success = await service.initialize(token, conferenceCode, userType, user);
      
      if (!success) {
        throw new Error('Échec de l\'initialisation WebRTC');
      }

      // Démarrer la conférence si c'est un médecin
      if (userType === 'medecin') {
        await service.startConference();
      }

      // Récupérer le flux local
      const localStream = service.getLocalStream();
      if (localStream) {
        setLocalStream(localStream);
      }

      setIsLoading(false);

    } catch (error) {
      console.error('❌ [useWebRTC] Erreur initialisation:', error);
      setError(error.message);
      setIsLoading(false);
    }
  }, [token, conferenceCode, userType, user]);

  // Nettoyer le service
  const cleanup = useCallback(() => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.cleanup();
      webrtcServiceRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setParticipants([]);
    setIsConnected(false);
  }, []);

  // Initialiser au montage
  useEffect(() => {
    if (token && conferenceCode && userType && user) {
      initializeWebRTC();
    }

    return () => {
      cleanup();
    };
  }, [initializeWebRTC, cleanup]);

  // Fonctions de contrôle
  const toggleAudio = useCallback(() => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.toggleAudio();
      setIsMuted(webrtcServiceRef.current.getIsMuted());
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.toggleVideo();
      setIsVideoOff(webrtcServiceRef.current.getIsVideoOff());
    }
  }, []);

  const leaveConference = useCallback(() => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.leaveConference();
    }
    cleanup();
  }, [cleanup]);

  return {
    // États
    isConnected,
    isMuted,
    isVideoOff,
    participants,
    isLoading,
    error,
    localStream,
    remoteStream,
    
    // Fonctions
    toggleAudio,
    toggleVideo,
    leaveConference,
    initializeWebRTC,
    cleanup
  };
};

export default useWebRTC;