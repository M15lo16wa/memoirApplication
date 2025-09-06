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

      // Initialiser le flux média local via le service
      try {
        await service.initializeMedia();
        setLocalStream(service.localStream);
        console.log('📹 [useWebRTC] Flux local initialisé via service');
      } catch (mediaError) {
        console.error('❌ [useWebRTC] Erreur accès caméra/microphone:', mediaError);
        // Essayer une approche de fallback avec des contraintes plus simples
        try {
          console.log('🔄 [useWebRTC] Tentative avec contraintes simplifiées...');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: true
          });
          setLocalStream(stream);
          service.localStream = stream;
          console.log('✅ [useWebRTC] Flux local initialisé avec contraintes simplifiées');
        } catch (fallbackError) {
          console.error('❌ [useWebRTC] Erreur fallback:', fallbackError);
          throw new Error('Accès à la caméra/microphone refusé. Vérifiez les permissions du navigateur.');
        }
      }

      // Démarrer la conférence si c'est un médecin
      if (userType === 'medecin') {
        await service.startConference();
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
  }, [initializeWebRTC, cleanup, token, conferenceCode, userType, user]);

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

  // Fonctions de conférence
  const joinConference = useCallback(async (conferenceCode) => {
    if (webrtcServiceRef.current) {
      return await webrtcServiceRef.current.joinConference(conferenceCode);
    }
    throw new Error('Service WebRTC non initialisé');
  }, []);

  const endConference = useCallback(async (conferenceCode) => {
    if (webrtcServiceRef.current) {
      return await webrtcServiceRef.current.endConference(conferenceCode);
    }
    throw new Error('Service WebRTC non initialisé');
  }, []);

  // Configuration WebRTC par défaut
  const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

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
    config,
    
    // Fonctions
    toggleAudio,
    toggleVideo,
    leaveConference,
    joinConference,
    endConference,
    initializeWebRTC,
    cleanup
  };
};

export default useWebRTC;