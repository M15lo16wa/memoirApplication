import { useState, useEffect, useCallback, useRef } from 'react';
import messagingService from '../services/api/messagingApi';

const useSecureMessaging = (contextType, contextId, medecinInfo = null) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversationParticipants, setConversationParticipants] = useState([]);

  // Références pour éviter les re-renders
  const contextTypeRef = useRef(contextType);
  const contextIdRef = useRef(contextId);
  const medecinInfoRef = useRef(medecinInfo);

  // Mise à jour des refs quand les props changent
  useEffect(() => {
    contextTypeRef.current = contextType;
    contextIdRef.current = contextId;
    medecinInfoRef.current = medecinInfo;
  }, [contextType, contextId, medecinInfo]);

  // Déterminer le type d'utilisateur actuel
  const determineCurrentUser = useCallback(() => {
    try {
      // PRIORITÉ ABSOLUE : Vérifier d'abord le localStorage pour l'utilisateur connecté
      const patientData = localStorage.getItem('patient');
      const medecinData = localStorage.getItem('medecin');
      
      // Si on a des données patient dans localStorage, on est connecté en tant que patient
      if (patientData) {
        const patient = JSON.parse(patientData);
        return {
          id: patient.id || patient.id_patient,
          type: 'patient',
          name: `${patient.prenom || 'Patient'} ${patient.nom || ''}`.trim(),
          data: patient
        };
      }
      
      // Si on a des données médecin dans localStorage, on est connecté en tant que médecin
      if (medecinData) {
        const medecin = JSON.parse(medecinData);
        return {
          id: medecin.id_professionnel || medecin.id,
          type: 'medecin',
          name: `Dr. ${medecin.nom || 'Médecin'} ${medecin.prenom || ''}`.trim(),
          data: medecin
        };
      }

      // FALLBACK : Utiliser medecinInfo seulement si aucune session n'est trouvée
      if (medecinInfoRef.current) {
        const medecin = medecinInfoRef.current;
        return {
          id: medecin.id_professionnel || medecin.id,
          type: 'medecin',
          name: `Dr. ${medecin.nom || 'Médecin'} ${medecin.prenom || ''}`.trim(),
          data: medecin
        };
      }

      // Fallback - utilisateur générique
      return {
        id: 'anonymous',
        type: 'patient',
        name: 'Utilisateur',
        data: null
      };
    } catch (error) {
      console.error('Erreur lors de la détermination de l\'utilisateur:', error);
      return {
        id: 'anonymous',
        type: 'patient',
        name: 'Utilisateur',
        data: null
      };
    }
  }, []);

  // Vérifier les permissions d'accès
  const canAccessMessaging = useCallback(() => {
    if (!contextTypeRef.current || !contextIdRef.current) {
      console.warn('Contexte invalide:', contextTypeRef.current, contextIdRef.current);
      return false;
    }

    const user = determineCurrentUser();
    if (!user || user.id === 'anonymous') {
      console.warn('Utilisateur non authentifié');
      return false;
    }

    return true;
  }, [determineCurrentUser]);

  // Obtenir les informations du contexte
  const getContextInfo = useCallback(() => {
    const contextType = contextTypeRef.current;
    const contextId = contextIdRef.current;
    const medecin = medecinInfoRef.current;

    const baseInfo = {
      contextType,
      contextId,
      medecin: medecin ? {
        id: medecin.id_professionnel || medecin.id,
        nom: medecin.nom || 'Médecin',
        prenom: medecin.prenom || '',
        specialite: medecin.specialite || medecin.speciality
      } : null
    };

    switch (contextType) {
      case 'ordonnance':
        return {
          ...baseInfo,
          title: `Messages - Ordonnance #${contextId}`,
          description: 'Discussion sécurisée concernant votre ordonnance',
          icon: '💊'
        };
      case 'examen':
        return {
          ...baseInfo,
          title: `Messages - Examen #${contextId}`,
          description: 'Discussion sécurisée concernant vos résultats d\'examen',
          icon: '🔬'
        };
      case 'consultation':
      default:
        return {
          ...baseInfo,
          title: `Messages - Consultation #${contextId}`,
          description: 'Discussion sécurisée avec votre médecin',
          icon: '🏥'
        };
    }
  }, []);

  // 🔑 NOUVELLE MÉTHODE : Charger les participants de la conversation
  const loadConversationParticipants = useCallback(async (convId) => {
    if (!convId) return;
    
    try {
      console.log('👥 [useSecureMessaging] Chargement des participants de la conversation:', convId);
      const participants = await messagingService.getConversationParticipants(convId);
      
      if (participants && Array.isArray(participants)) {
        setConversationParticipants(participants);
        console.log('✅ Participants chargés:', participants.length);
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors du chargement des participants:', error);
    }
  }, []);

  // Charger les messages existants
  const loadMessages = useCallback(async () => {
    if (!canAccessMessaging()) {
      setLoading(false);
      setError('Accès non autorisé');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const contextType = contextTypeRef.current;
      const contextId = contextIdRef.current;
      const user = determineCurrentUser();

      console.log('🔄 Chargement des messages pour:', { contextType, contextId, user: user.type });

      // 🔧 APPROCHE AMÉLIORÉE : Utiliser les nouvelles méthodes du service
      let result = null;
      
      try {
        if (contextType === 'ordonnance') {
          result = await messagingService.getOrdonnanceHistory(contextId, 1, 50);
        } else if (contextType === 'consultation') {
          result = await messagingService.getMessageHistory(contextId, 1, 50, 'consultation');
        } else {
          result = await messagingService.getMessageHistory(contextId, 1, 50, contextType);
        }

        if (result && result.messages) {
          // 🔑 NOUVELLE APPROCHE : Normaliser les messages avec les participants
          let normalizedMessages = result.messages;
          
          // Si on a des participants de conversation, les utiliser pour enrichir les messages
          if (result.conversation && result.conversation.participants) {
            normalizedMessages = messagingService.normalizeMessages(result.messages, result.conversation.participants);
          } else if (conversationParticipants.length > 0) {
            normalizedMessages = messagingService.normalizeMessages(result.messages, conversationParticipants);
          } else {
            // Fallback : normaliser sans participants
            normalizedMessages = messagingService.normalizeMessages(result.messages);
          }
          
          // 🔑 NOUVELLE APPROCHE : Enrichir avec les informations utilisateur
          try {
            normalizedMessages = await messagingService.enrichMessagesWithUserInfo(normalizedMessages);
          } catch (enrichError) {
            console.warn('⚠️ Erreur lors de l\'enrichissement des messages:', enrichError);
            // Continuer avec les messages normalisés
          }
          
          setMessages(normalizedMessages);
          
          // Extraire l'ID de conversation si disponible
          if (result.conversation) {
            const convId = result.conversation.id || result.conversation.id_conversation;
            setConversationId(convId);
            
            // 🔑 NOUVELLE APPROCHE : Charger les participants de la conversation
            if (convId) {
              loadConversationParticipants(convId);
            }
          }
          
          console.log('✅ Messages chargés et normalisés depuis l\'API:', normalizedMessages.length);
          setIsConnected(true);
          return;
        }
      } catch (apiError) {
        console.error('❌ Erreur lors de la récupération des messages:', apiError);
        setError('Erreur lors du chargement des messages');
      }

      // Si aucun message trouvé, initialiser avec un état vide
      setMessages([]);
      setIsConnected(true);

    } catch (error) {
      console.error('❌ Erreur générale lors du chargement des messages:', error);
      setError('Erreur lors du chargement des messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [canAccessMessaging, determineCurrentUser, conversationParticipants, loadConversationParticipants]);

  // MÉTHODE UNIFIÉE : Envoyer un message (pour tous les types d'utilisateurs)
  const sendMessageUnified = useCallback(async (content) => {
    if (!content.trim()) return null;

    const user = determineCurrentUser();
    console.log('📤 Envoi de message unifié:', { userType: user.type, userId: user.id });

    try {
      const contextType = contextTypeRef.current;
      const contextId = contextIdRef.current;

      // Créer le message localement d'abord
      console.log('🔍 [useSecureMessaging] Création message avec utilisateur:', {
        userId: user.id,
        userType: user.type,
        userName: user.name
      });
      
      const newMessage = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        type: 'text',
        sender: {
          id: user.id,
          type: user.type,
          name: user.name
        },
        recipient: {
          id: user.type === 'medecin' ? 'patient' : 'medecin',
          type: user.type === 'medecin' ? 'patient' : 'medecin',
          name: user.type === 'medecin' ? 'Patient' : `Dr. ${medecinInfoRef.current?.nom || 'Médecin'}`
        },
        timestamp: new Date().toISOString(),
        status: 'sending'
      };
      
      console.log('🔍 [useSecureMessaging] Message créé:', {
        messageId: newMessage.id,
        sender: newMessage.sender,
        recipient: newMessage.recipient
      });

      // Mettre à jour l'état immédiatement pour une meilleure UX
      setMessages(prev => {
        const duplicate = prev.find(msg => 
          msg.content === newMessage.content && 
          Math.abs(new Date(msg.timestamp) - new Date(newMessage.timestamp)) < 1000
        );
        
        if (duplicate) {
          console.log('🔄 Message en double détecté, ignoré:', duplicate.id);
          return prev;
        }
        
        return [...prev, newMessage];
      });

      // 🔧 CORRECTION : Créer une conversation si elle n'existe pas
      let targetConversationId = conversationId;
      
      if (!targetConversationId) {
        console.log('🔄 Création d\'une nouvelle conversation pour le contexte:', { contextType, contextId });
        
        try {
          // Créer une conversation depuis le contexte
          const conversationResult = await messagingService.createConversationFromContext(
            contextType,
            contextId,
            user.type === 'patient' ? user.id : null,
            user.type === 'medecin' ? user.id : medecinInfoRef.current?.id_professionnel || medecinInfoRef.current?.id
          );
          
          if (conversationResult && conversationResult.conversationId) {
            targetConversationId = conversationResult.conversationId;
            setConversationId(targetConversationId);
            console.log('✅ Nouvelle conversation créée:', targetConversationId);
          } else {
            console.warn('⚠️ Impossible de créer une conversation, utilisation du contexte comme fallback');
            targetConversationId = contextId;
          }
        } catch (convError) {
          console.warn('⚠️ Erreur lors de la création de conversation, utilisation du contexte:', convError);
          targetConversationId = contextId;
        }
      }

      // 🔌 ENVOI VIA API REST (priorité pour la fiabilité)
      try {
        console.log('🌐 Envoi via API REST vers:', targetConversationId);
        
        const sentMessage = await messagingService.sendMessageToConversation(targetConversationId, {
          contenu: newMessage.content,
          type_message: newMessage.type,
          expediteur_id: newMessage.sender.id,
          expediteur_type: newMessage.sender.type,
          destinataire_id: newMessage.recipient.id,
          destinataire_type: newMessage.recipient.type,
          context_type: contextType,
          context_id: contextId
        });
        
        console.log('✅ Message envoyé avec succès via API:', sentMessage);
        
        // Remplacer le message temporaire par le message confirmé
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? sentMessage : msg
        ));
        
        // 🔌 Notifier le WebSocket si connecté
        if (messagingService.getWebSocketStatus().isConnected) {
          console.log('🔌 Notification WebSocket du message envoyé');
          console.log('🔍 [DEBUG] État WebSocket:', messagingService.getWebSocketStatus());
          console.log('🔍 [DEBUG] Message à notifier:', sentMessage);
          messagingService.emitMessageSent(sentMessage);
        } else {
          console.warn('⚠️ WebSocket non connecté, impossible de notifier en temps réel');
          console.log('🔍 [DEBUG] État WebSocket actuel:', messagingService.getWebSocketStatus());
        }
        
      } catch (apiError) {
        console.error('❌ Erreur API lors de l\'envoi:', apiError);
        
        // Marquer le message temporaire comme échoué
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'error', error: apiError.message }
            : msg
        ));
        
        // Optionnel : Retirer le message temporaire après un délai
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
        }, 5000);
        
        throw apiError; // Propager l'erreur pour la gestion côté composant
      }

      return newMessage;

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message unifié:', error);
      throw error;
    }
  }, [determineCurrentUser, conversationId, medecinInfoRef]);

  // Marquer un message comme lu
  const markMessageAsRead = useCallback(async (messageId) => {
    try {
      // Mettre à jour localement
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'read', date_lecture: new Date().toISOString() } : msg
      ));

      // Note: L'API pour marquer comme lu pourrait être implémentée ici
      console.log('✅ Message marqué comme lu:', messageId);
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme lu:', error);
    }
  }, []);

  // Indicateur de frappe
  const sendTypingIndicator = useCallback((isTyping) => {
    if (conversationId && messagingService.getWebSocketStatus().isConnected) {
      console.log('👀 Envoi indicateur de frappe WebSocket:', isTyping);
      messagingService.emitTyping(conversationId, isTyping);
    } else {
      console.log('👀 Indicateur de frappe (fallback):', isTyping);
    }
  }, [conversationId]);

  // 🔑 NOUVELLE MÉTHODE : Rafraîchir les messages et participants
  const refreshMessages = useCallback(async () => {
    console.log('🔄 [useSecureMessaging] Rafraîchissement des messages...');
    await loadMessages();
  }, [loadMessages]);

  // Initialisation - CORRIGÉ : Pas de dépendance à loadMessages
  useEffect(() => {
    const user = determineCurrentUser();
    setCurrentUser(user);
    
    if (contextType && contextId) {
      // Appel direct sans dépendance pour éviter la boucle
      const initMessages = async () => {
        try {
          setLoading(true);
          setError(null);

          const contextType = contextTypeRef.current;
          const contextId = contextIdRef.current;
          const user = determineCurrentUser();

          console.log('🔄 [useSecureMessaging] Chargement initial des messages pour:', { contextType, contextId, user: user.type });

          let result = null;
          
          try {
            if (contextType === 'ordonnance') {
              result = await messagingService.getOrdonnanceHistory(contextId, 1, 50);
            } else if (contextType === 'consultation') {
              result = await messagingService.getMessageHistory(contextId, 1, 50, 'consultation');
            } else {
              result = await messagingService.getMessageHistory(contextId, 1, 50, contextType);
            }

            if (result && result.messages) {
              let normalizedMessages = result.messages;
              
              if (result.conversation && result.conversation.participants) {
                normalizedMessages = messagingService.normalizeMessages(result.messages, result.conversation.participants);
              } else {
                normalizedMessages = messagingService.normalizeMessages(result.messages);
              }
              
              try {
                normalizedMessages = await messagingService.enrichMessagesWithUserInfo(normalizedMessages);
              } catch (enrichError) {
                console.warn('⚠️ Erreur lors de l\'enrichissement des messages:', enrichError);
              }
              
              setMessages(normalizedMessages);
              
              if (result.conversation) {
                const convId = result.conversation.id || result.conversation.id_conversation;
                setConversationId(convId);
                
                if (convId) {
                  loadConversationParticipants(convId);
                }
              }
              
              console.log('✅ [useSecureMessaging] Messages initiaux chargés:', normalizedMessages.length);
              setIsConnected(true);
            } else {
              setMessages([]);
              setIsConnected(true);
            }
          } catch (apiError) {
            console.error('❌ [useSecureMessaging] Erreur lors de la récupération des messages:', apiError);
            setError('Erreur lors du chargement des messages');
            setMessages([]);
          }
        } catch (error) {
          console.error('❌ Erreur générale lors du chargement initial:', error);
          setError('Erreur lors du chargement des messages');
          setMessages([]);
        } finally {
          setLoading(false);
        }
      };
      
      initMessages();
    }
  }, [contextType, contextId, determineCurrentUser, loadConversationParticipants]);

  // 🔌 INTÉGRATION WEBSOCKET VIA MESSAGINGAPI - CORRIGÉ : Pas de dépendance à refreshMessages
  useEffect(() => {
    // Se connecter au WebSocket si on a un utilisateur
    if (currentUser && currentUser.id !== 'anonymous') {
      const token = localStorage.getItem('jwt') || 
                   localStorage.getItem('firstConnectionToken') || 
                   localStorage.getItem('originalJWT');
      
      if (token) {
        console.log('🔌 Connexion WebSocket pour utilisateur:', currentUser.type, currentUser.id);
        messagingService.connectWebSocket(token);
        
        // Écouter les nouveaux messages
        messagingService.onNewMessage((message) => {
          console.log('📨 Nouveau message reçu via WebSocket:', message);
          
          try {
            const normalizedMessage = messagingService.normalizeMessageForDisplay(message);
            if (normalizedMessage) {
              setMessages(prev => {
                const exists = prev.some(msg => 
                  msg.id === normalizedMessage.id_message || 
                  msg.id === normalizedMessage.id
                );
                
                if (!exists) {
                  console.log('➕ Nouveau message ajouté via WebSocket:', normalizedMessage.id_message);
                  return [...prev, normalizedMessage];
                } else {
                  console.log('🔄 Message WebSocket déjà présent, ignoré:', normalizedMessage.id_message);
                  return prev;
                }
              });
            }
          } catch (normalizeError) {
            console.warn('⚠️ Erreur lors de la normalisation du message WebSocket:', normalizeError);
            setMessages(prev => [...prev, message]);
          }
        });
        
        // Écouter les indicateurs de frappe
        messagingService.onTyping((data) => {
          console.log('👀 Indicateur de frappe reçu:', data);
          setTypingUsers(prev => {
            const filtered = prev.filter(user => user.id !== data.userId);
            if (data.isTyping) {
              return [...filtered, { id: data.userId, name: data.userName, timestamp: data.timestamp }];
            }
            return filtered;
          });
        });
        
        // 🔑 NOUVELLES ÉCOUTES : Mises à jour de conversation et notifications
        messagingService.onConversationUpdate((data) => {
          console.log('🔄 Conversation mise à jour via WebSocket:', data);
          if (data.conversationId === conversationId) {
            // Appel direct sans dépendance pour éviter la boucle
            loadMessages();
          }
        });
        
        messagingService.onNotification((notification) => {
          console.log('🔔 Notification WebSocket reçue:', notification);
          if (notification.type === 'new_message' && notification.conversationId === conversationId) {
            // Appel direct sans dépendance pour éviter la boucle
            loadMessages();
          }
        });
      }
    }

    // Nettoyage à la déconnexion
    return () => {
      if (conversationId) {
        messagingService.leaveConversation(conversationId);
      }
    };
  }, [currentUser, conversationId, loadMessages]);

  // Rejoindre la conversation WebSocket quand elle change
  useEffect(() => {
    if (conversationId && messagingService.getWebSocketStatus().isConnected) {
      console.log('🚪 Rejoindre la conversation WebSocket:', conversationId);
      messagingService.joinConversation(conversationId);
      
      // 🔑 NOUVELLE APPROCHE : Charger les participants quand on rejoint
      loadConversationParticipants(conversationId);
    }
  }, [conversationId, loadConversationParticipants]);

  // Nettoyage automatique des messages temporaires anciens
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setMessages(prev => {
        try {
          const now = Date.now();
          const cleanedMessages = prev.filter(msg => {
            // Vérifier que msg.id existe et est une chaîne
            if (!msg.id || typeof msg.id !== 'string') {
              return true; // Garder le message pour éviter la perte de données
            }
            
            // Garder les messages avec des IDs réels
            if (!msg.id.startsWith('temp_')) return true;
            
            // Retirer les messages temporaires de plus de 30 secondes
            if (msg.timestamp) {
              const messageTime = new Date(msg.timestamp).getTime();
              if (isNaN(messageTime)) {
                return true; // Garder le message
              }
              
              if (now - messageTime > 30000) {
                return false; // Supprimer le message temporaire ancien
              }
            } else {
              return true; // Garder le message
            }
            
            return true;
          });
          
          if (cleanedMessages.length !== prev.length) {
            console.log('🧹 [useSecureMessaging] Nettoyage des messages temporaires terminé');
          }
          
          return cleanedMessages;
        } catch (error) {
          console.error('❌ [useSecureMessaging] Erreur lors du nettoyage des messages temporaires:', error);
          return prev; // Retourner l'état précédent en cas d'erreur
        }
      });
    }, 10000); // Toutes les 10 secondes

    return () => clearInterval(cleanupInterval);
  }, []);

  // 🔌 Gestion des messages WebSocket reçus
  const handleWebSocketMessage = useCallback((message) => {
    console.log('📨 [useSecureMessaging] Message WebSocket reçu:', message);
    
    // Vérifier que le message appartient à cette conversation
    if (message.conversation_id === conversationId || message.conversationId === conversationId) {
      console.log('✅ [useSecureMessaging] Message appartient à cette conversation, ajout au state');
      
      setMessages(prev => {
        // Éviter les doublons
        const messageExists = prev.some(msg => msg.id === message.id);
        if (messageExists) {
          console.log('⚠️ [useSecureMessaging] Message déjà présent, ignoré');
          return prev;
        }
        
        // Normaliser le message reçu
        const normalizedMessage = {
          id: message.id,
          content: message.content,
          type: message.type || 'text',
          expediteur_info: {
            id: message.sender?.id || message.expediteur_id,
            type: message.sender?.type || message.expediteur_type,
            name: message.sender?.name || message.expediteur_nom
          },
          destinataire_info: {
            id: message.recipient?.id || message.destinataire_id,
            type: message.recipient?.type || message.destinataire_type,
            name: message.recipient?.name || message.destinataire_nom
          },
          timestamp: message.timestamp || new Date().toISOString(),
          status: 'received'
        };
        
        console.log('📝 [useSecureMessaging] Message normalisé ajouté:', normalizedMessage);
        return [...prev, normalizedMessage];
      });
    } else {
      console.log('⚠️ [useSecureMessaging] Message reçu pour une autre conversation:', message.conversation_id);
    }
  }, [conversationId]);

  // 🔌 Gestion de la confirmation d'envoi
  const handleMessageSent = useCallback((data) => {
    console.log('✅ [useSecureMessaging] Confirmation d\'envoi reçue:', data);
    
    if (data.conversation_id === conversationId || data.conversationId === conversationId) {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.message_id || msg.id === data.messageId) {
          return { ...msg, status: 'sent' };
        }
        return msg;
      }));
    }
  }, [conversationId]);

  // 🔌 Gestion des erreurs de message
  const handleMessageError = useCallback((error) => {
    console.error('❌ [useSecureMessaging] Erreur de message WebSocket:', error);
    
    if (error.message_id) {
      setMessages(prev => prev.map(msg => {
        if (msg.id === error.message_id) {
          return { ...msg, status: 'error', error: error.message };
        }
        return msg;
      }));
    }
  }, []);

  // 🔌 Configuration des écouteurs WebSocket
  useEffect(() => {
    if (!messagingService || !conversationId) return;

    console.log('🔌 [useSecureMessaging] Configuration des écouteurs WebSocket pour la conversation:', conversationId);

    // S'abonner aux événements
    messagingService.onNewMessage(handleWebSocketMessage);
    messagingService.onMessageSent(handleMessageSent);
    messagingService.onMessageError(handleMessageError);

    // Rejoindre automatiquement la conversation WebSocket
    if (messagingService.getWebSocketStatus().isConnected) {
      console.log('🚪 [useSecureMessaging] Rejoindre la conversation WebSocket:', conversationId);
      messagingService.joinConversation(conversationId);
    }

    // Nettoyage des écouteurs
    return () => {
      console.log('🧹 [useSecureMessaging] Nettoyage des écouteurs WebSocket');
      messagingService.offNewMessage(handleWebSocketMessage);
      messagingService.offMessageSent(handleMessageSent);
      messagingService.offMessageError(handleMessageError);
      
      // Quitter la conversation WebSocket
      if (conversationId) {
        messagingService.leaveConversation(conversationId);
      }
    };
  }, [conversationId, handleWebSocketMessage, handleMessageSent, handleMessageError]);

  // Propriétés dérivées
  const isPatient = currentUser?.type === 'patient';
  const isMedecin = currentUser?.type === 'medecin';

  return {
    // État
    messages,
    isConnected,
    loading,
    error,
    typingUsers,
    currentUser,
    sessionData,
    conversationId,
    conversationParticipants, // 🔑 NOUVEAU : Participants de la conversation

    // Propriétés dérivées
    isPatient,
    isMedecin,

    // Actions
    sendMessageUnified,
    markMessageAsRead,
    sendTypingIndicator,
    loadMessages,
    refreshMessages, // 🔑 NOUVEAU : Rafraîchir les messages
    loadConversationParticipants, // 🔑 NOUVEAU : Charger les participants

    // Utilitaires
    getContextInfo,
    canAccessMessaging
  };
};

export default useSecureMessaging;