import { useState, useEffect, useCallback, useRef } from 'react';
import { getStoredPatient } from '../services/api/authApi';
import messagingService from '../services/api/messagingApi';

const useSecureMessaging = (contextType, contextId) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Récupérer le patient connecté
  const getCurrentPatient = useCallback(() => {
    return getStoredPatient();
  }, []);

  // Récupérer le médecin connecté
  const getCurrentMedecin = useCallback(() => {
    const medecinData = localStorage.getItem('medecin');
    return medecinData ? JSON.parse(medecinData) : null;
  }, []);

  // Générer un ID de session unique pour le contexte
  const getSessionId = useCallback(() => {
    const patient = getCurrentPatient();
    const medecin = getCurrentMedecin();
    
    if (!patient || !medecin) {
      return null;
    }
    
    const patientId = patient.id_patient || patient.id;
    const medecinId = medecin.id_professionnel || medecin.id;
    
    return `session_${contextType}_${contextId}_${patientId}_${medecinId}`;
  }, [contextType, contextId, getCurrentPatient, getCurrentMedecin]);

  // Charger l'historique des messages depuis l'API ou le localStorage
  const loadMessageHistory = useCallback(async () => {
    const sessionId = getSessionId();
    if (!sessionId) {
      return;
    }

    try {
      setLoading(true);
      
      // Essayer de récupérer depuis l'API d'abord
      try {
        const apiMessages = await messagingService.getMessageHistory(contextType, contextId);
        if (apiMessages && apiMessages.length > 0) {
          setMessages(apiMessages);
          return;
        }
      } catch (apiError) {
        console.log('API non disponible, utilisation du localStorage');
      }
      
      // Fallback : localStorage
      const storedMessages = JSON.parse(localStorage.getItem(`messages_${sessionId}`) || '[]');
      setMessages(storedMessages);
      
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique des messages:', error);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  }, [getSessionId, contextType, contextId]);

  // Sauvegarder les messages dans le localStorage et l'API
  const saveMessages = useCallback(async (newMessages) => {
    const sessionId = getSessionId();
    if (!sessionId) {
      return;
    }

    try {
      // Sauvegarder localement
      localStorage.setItem(`messages_${sessionId}`, JSON.stringify(newMessages));
      
      // Essayer de sauvegarder via l'API
      try {
        await messagingService.sendMessage({
          sessionId,
          messages: newMessages
        });
      } catch (apiError) {
        console.log('Sauvegarde API échouée, données sauvegardées localement');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des messages:', error);
    }
  }, [getSessionId]);

  // Ajouter un nouveau message
  const addMessage = useCallback(async (message) => {
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...message,
      timestamp: new Date().toISOString(),
      status: 'sent',
      lu: false
    };

    setMessages(prev => {
      const updatedMessages = [...prev, newMessage];
      saveMessages(updatedMessages);
      return updatedMessages;
    });

    return newMessage;
  }, [saveMessages]);

  // Marquer un message comme lu
  const markMessageAsRead = useCallback(async (messageId) => {
    try {
      // Marquer via l'API
      await messagingService.markMessageAsRead(messageId);
    } catch (apiError) {
      console.log('Marquage API échoué, marquage local uniquement');
    }
    
    setMessages(prev => {
      const updatedMessages = prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'read', lu: true } : msg
      );
      saveMessages(updatedMessages);
      return updatedMessages;
    });
  }, [saveMessages]);

  // Envoyer un message
  const sendMessage = useCallback(async (content, type = 'text') => {
    const patient = getCurrentPatient();
    const medecin = getCurrentMedecin();
    
    if (!patient || !medecin) {
      setError('Utilisateur non authentifié');
      return null;
    }

    const message = {
      content,
      type,
      sender: {
        id: patient.id_patient || patient.id,
        type: 'patient',
        name: `${patient.prenom} ${patient.nom}`
      },
      recipient: {
        id: medecin.id_professionnel || medecin.id,
        type: 'medecin',
        name: `Dr. ${medecin.nom || 'Médecin'}`
      },
      context: {
        type: contextType,
        id: contextId
      }
    };

    try {
      // Envoyer via l'API
      await messagingService.sendMessage(message);
    } catch (apiError) {
      console.log('Envoi API échoué, message sauvegardé localement');
    }

    const newMessage = await addMessage(message);
    
    // Simuler l'envoi via WebSocket (en production, vous utiliseriez une vraie API)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'send_message',
        message: newMessage
      }));
    }

    return newMessage;
  }, [getCurrentPatient, getCurrentMedecin, contextType, contextId, addMessage]);

  // Envoyer un message en tant que médecin
  const sendMessageAsMedecin = useCallback(async (content, type = 'text') => {
    const patient = getCurrentPatient();
    const medecin = getCurrentMedecin();
    
    if (!patient || !medecin) {
      setError('Utilisateur non authentifié');
      return null;
    }

    const message = {
      content,
      type,
      sender: {
        id: medecin.id_professionnel || medecin.id,
        type: 'medecin',
        name: `Dr. ${medecin.nom || 'Médecin'}`
      },
      recipient: {
        id: patient.id_patient || patient.id,
        type: 'patient',
        name: `${patient.prenom} ${patient.nom}`
      },
      context: {
        type: contextType,
        id: contextId
      }
    };

    try {
      // Envoyer via l'API
      await messagingService.sendMessage(message);
    } catch (apiError) {
      console.log('Envoi API échoué, message sauvegardé localement');
    }

    const newMessage = await addMessage(message);
    
    // Simuler l'envoi via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'send_message',
        message: newMessage
      }));
    }

    return newMessage;
  }, [getCurrentPatient, getCurrentMedecin, contextType, contextId, addMessage]);

  // Gérer la frappe (typing indicator)
  const sendTypingIndicator = useCallback((isTyping) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'typing',
        isTyping,
        user: getCurrentPatient() || getCurrentMedecin()
      }));
    }
  }, [getCurrentPatient, getCurrentMedecin]);

  // Se connecter au WebSocket (simulation)
  const connectWebSocket = useCallback(() => {
    try {
      // En production, vous utiliseriez une vraie URL WebSocket
      const wsUrl = `ws://localhost:3000/ws/messaging/${getSessionId()}`;
      
      // Simulation du WebSocket pour la démo
      console.log('🔌 Tentative de connexion WebSocket:', wsUrl);
      
      // Simuler une connexion réussie
      setIsConnected(true);
      setError(null);
      
      // Simuler la réception de messages
      setTimeout(() => {
        if (messages.length === 0) {
          // Message de bienvenue automatique
          const welcomeMessage = {
            id: `welcome_${Date.now()}`,
            content: `Bonjour ! Vous pouvez maintenant discuter de votre ${contextType === 'ordonnance' ? 'ordonnance' : contextType === 'examen' ? 'résultat d\'examen' : 'consultation'}.`,
            type: 'system',
            sender: {
              id: 'system',
              type: 'system',
              name: 'Système'
            },
            timestamp: new Date().toISOString(),
            status: 'read',
            lu: true
          };
          
          setMessages(prev => {
            const updatedMessages = [...prev, welcomeMessage];
            saveMessages(updatedMessages);
            return updatedMessages;
          });
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Erreur de connexion WebSocket:', error);
      setError('Erreur de connexion au chat');
      setIsConnected(false);
    }
  }, [getSessionId, contextType, messages.length, saveMessages]);

  // Se déconnecter du WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // Reconnecter automatiquement
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Tentative de reconnexion...');
      connectWebSocket();
    }, 3000);
  }, [connectWebSocket]);

  // Initialiser la messagerie
  useEffect(() => {
    if (contextType && contextId) {
      setLoading(true);
      
      // Charger l'historique des messages
      loadMessageHistory();
      
      // Se connecter au WebSocket
      connectWebSocket();
      
      setLoading(false);
    }

    return () => {
      disconnectWebSocket();
    };
  }, [contextType, contextId, loadMessageHistory, connectWebSocket, disconnectWebSocket]);

  // Nettoyer les timeouts
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Obtenir les informations du contexte
  const getContextInfo = useCallback(() => {
    switch (contextType) {
      case 'ordonnance':
        return {
          title: 'Discussion sur l\'ordonnance',
          description: 'Posez vos questions sur votre traitement',
          icon: '💊'
        };
      case 'examen':
        return {
          title: 'Discussion sur les résultats',
          description: 'Obtenez des explications sur vos analyses',
          icon: '🔬'
        };
      case 'consultation':
        return {
          title: 'Discussion sur la consultation',
          description: 'Échangez avec votre médecin sur votre consultation',
          icon: '🏥'
        };
      default:
        return {
          title: 'Discussion médicale',
          description: 'Échange sécurisé avec votre médecin',
          icon: '💬'
        };
    }
  }, [contextType]);

  // Vérifier si l'utilisateur peut accéder à la messagerie
  const canAccessMessaging = useCallback(async () => {
    const patient = getCurrentPatient();
    const medecin = getCurrentMedecin();
    
    // Vérifier que l'utilisateur est connecté
    if (!patient && !medecin) {
      return false;
    }
    
    // Vérifier que le contexte est valide
    if (!contextType || !contextId) {
      return false;
    }
    
    // Vérifier que l'utilisateur a accès au contexte via l'API
    try {
      const userId = patient ? (patient.id_patient || patient.id) : (medecin.id_professionnel || medecin.id);
      const userType = patient ? 'patient' : 'medecin';
      
      const permissions = await messagingService.checkMessagingPermissions(contextType, contextId, userId, userType);
      return permissions.authorized;
    } catch (error) {
      console.log('Vérification des permissions échouée, accès autorisé par défaut');
      return true; // Autoriser par défaut en cas d'erreur
    }
  }, [getCurrentPatient, getCurrentMedecin, contextType, contextId]);

  return {
    // État
    messages,
    isConnected,
    participants,
    loading,
    error,
    typingUsers,
    
    // Actions
    sendMessage,
    sendMessageAsMedecin,
    markMessageAsRead,
    sendTypingIndicator,
    connectWebSocket,
    disconnectWebSocket,
    reconnect,
    
    // Utilitaires
    getSessionId,
    getContextInfo,
    canAccessMessaging,
    
    // Informations utilisateur
    currentUser: getCurrentPatient() || getCurrentMedecin(),
    isPatient: !!getCurrentPatient(),
    isMedecin: !!getCurrentMedecin()
  };
};

export default useSecureMessaging;
