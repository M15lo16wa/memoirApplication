// src/messaging/components/chatMessage.js
import React, { useState, useEffect, useCallback } from "react";
import { signalingService } from '../index';
import { FaComments, FaSpinner, FaPlus, FaUser, FaUserMd, FaVideo } from "react-icons/fa";
import WebRTCWidget from './WebRTCWidget';

export default function ChatMessage({ userId: propUserId, role: propRole, token: propToken, conversationId: propConversationId, medecinId: propMedecinId, patientId: propPatientId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(propConversationId);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [showCallWidget, setShowCallWidget] = useState(false);
  const [callType, setCallType] = useState(null); // 'video' | 'audio'
  const [conferenceLink, setConferenceLink] = useState(null);
  
  // Utiliser les props ou fallback sur localStorage
  const [userId, setUserId] = useState(() => {
    if (propUserId) return propUserId;
    
    const patientData = localStorage.getItem('patient');
    if (patientData) {
      try {
        const patient = JSON.parse(patientData);
        return patient.id_patient || patient.id || null;
      } catch (e) {}
    }
    const medecinData = localStorage.getItem('medecin');
    if (medecinData) {
      try {
        const medecin = JSON.parse(medecinData);
        return medecin.id_professionnel || medecin.id || null;
      } catch (e) {}
    }
    return null;
  });
  
  const [userRole, setUserRole] = useState(() => {
    if (propRole) return propRole;
    if (localStorage.getItem('patient')) return 'patient';
    if (localStorage.getItem('medecin')) return 'medecin';
    return 'patient';
  });

  // Mettre à jour la conversation sélectionnée quand la prop change
  useEffect(() => {
    if (propConversationId && propConversationId !== selectedConversation) {
      setSelectedConversation(propConversationId);
      // Charger les messages de la nouvelle conversation
      if (propConversationId) {
        loadConversationMessages(propConversationId);
      }
    }
  }, [propConversationId]);

  // Initialiser le service de signalisation
  useEffect(() => {
    if (userId && userRole) {
      console.log('🔌 Initialisation du service de messagerie:', { userId, userRole });
      
      // ✅ Initialiser le service avec la nouvelle méthode
      signalingService.initialize();
      
      // ✅ Se connecter au WebSocket avec la nouvelle méthode
      const socket = signalingService.connectSocket(userId, userRole, propToken);
      
      if (socket) {
        // ✅ Utiliser les méthodes du service pour configurer les écouteurs
        signalingService.on('connect', () => {
          console.log('✅ Connecté au service de messagerie');
          setIsConnected(true);
          setError(null);
          
          // Charger les conversations une fois connecté
          loadUserConversations();
        });

        signalingService.on('disconnect', (reason) => {
          console.log('❌ Déconnecté du service de messagerie:', reason);
          setIsConnected(false);
          setError("Connexion perdue");
        });

        signalingService.on('connect_error', (error) => {
          console.error('❌ Erreur de connexion messagerie:', error);
          setIsConnected(false);
          setError("Erreur de connexion au serveur");
        });

        // Capture du lien de conférence via socket
        signalingService.on('webrtc:session_created', (data) => {
          const link = data?.conferenceLink || data?.conference_link || data?.conference_code || data?.session?.conference_link || data?.session?.conference_code || null;
          if (link) {
            setConferenceLink(link);
            console.log('🔐 Lien de conférence (socket):', link);
          }
        });

        // ✅ Écouter les nouveaux messages avec la nouvelle méthode
        signalingService.on('new_message', (data) => {
          console.log('📨 Nouveau message reçu:', data);
          if (data.conversationId === selectedConversation) {
            setMessages(prev => [...prev, {
              id: data.messageId || Date.now(),
              sender: data.senderId === userId ? userRole : (userRole === 'patient' ? 'medecin' : 'patient'),
              content: data.message,
              timestamp: data.timestamp || new Date().toISOString(),
              type: data.type || 'text'
            }]);
          }
        });

        // ✅ Vérifier l'état de connexion immédiatement
        if (signalingService.isConnected()) {
          console.log('✅ Socket déjà connecté');
          setIsConnected(true);
          loadUserConversations();
        }
      } else {
        console.error('❌ Impossible de créer la connexion WebSocket');
        setError("Impossible de se connecter au service de messagerie");
      }
    }
    
    // Cleanup function
    return () => {
      // ✅ Utiliser la méthode de nettoyage du service
      signalingService.cleanup();
    };
  }, [userId, userRole, propToken]);

  const loadUserConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Chargement des conversations pour l\'utilisateur:', { userId, userRole });
      
      // ✅ Utiliser la méthode du service
      const result = await signalingService.getUserConversations();
      console.log('�� Réponse du serveur pour les conversations:', result);
      
      if (result.success) {
        // Éviter les doublons en utilisant un Map avec l'ID comme clé
        const uniqueConversations = Array.from(
          new Map((result.conversations || []).map(conv => [conv.id, conv])).values()
        );
        
        console.log('✅ Conversations uniques trouvées:', uniqueConversations);
        setConversations(uniqueConversations);
        
        // Si aucune conversation n'est sélectionnée et qu'il y en a, sélectionner la première
        if (!selectedConversation && uniqueConversations.length > 0) {
          const firstConversation = uniqueConversations[0];
          setSelectedConversation(firstConversation.id);
          await loadConversationMessages(firstConversation.id);
        }
        
        console.log('✅ Conversations chargées:', uniqueConversations.length);
      } else {
        console.error('❌ Erreur lors du chargement des conversations:', result.error);
        setError(`Erreur lors du chargement des conversations: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des conversations:', error);
      setError(`Erreur lors du chargement des conversations: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Chargement des messages pour la conversation:', conversationId);
      
      // ✅ Utiliser la méthode du service
      const result = await signalingService.getConversationMessages(conversationId, 50, 0);
      console.log('�� Réponse du serveur pour les messages:', result);
      
      if (result.success) {
        // Éviter les doublons en utilisant un Map avec l'ID comme clé
        const uniqueMessages = Array.from(
          new Map((result.messages || []).map(msg => [msg.id, msg])).values()
        );
        
        console.log('📝 Messages uniques trouvés:', uniqueMessages);
        
        // Formater les messages pour l'affichage
        const formattedMessages = uniqueMessages.map(msg => {
          const isOwnMessage = msg.expediteur_id === userId || msg.sender_id === userId;
          const sender = isOwnMessage ? userRole : (userRole === 'patient' ? 'medecin' : 'patient');
          
          const formattedMsg = {
            id: msg.id || msg.message_id,
            sender: sender,
            content: msg.contenu || msg.content || msg.message || 'Message sans contenu',
            timestamp: msg.timestamp || msg.created_at || msg.date_creation || new Date().toISOString(),
            type: msg.type_message || msg.type || 'texte'
          };
          
          console.log('�� Message formaté:', formattedMsg);
          return formattedMsg;
        });
        
        setMessages(formattedMessages);
        console.log('✅ Messages chargés et formatés:', formattedMessages.length);
      } else {
        console.error('❌ Erreur lors du chargement des messages:', result.error);
        setError(`Erreur lors du chargement des messages: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des messages:', error);
      setError(`Erreur lors du chargement des messages: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async (targetUserId) => {
    // Seuls les médecins peuvent créer de nouvelles conversations
    if (userRole !== 'medecin') {
      console.log('❌ Seuls les médecins peuvent créer de nouvelles conversations');
      setError("Seuls les médecins peuvent créer de nouvelles conversations");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Utiliser le patientId fourni en prop ou demander à l'utilisateur
      const patientId = propPatientId || targetUserId;
      
      if (!patientId) {
        setError("Veuillez sélectionner un patient pour créer une conversation");
        setIsLoading(false);
        return;
      }
      
      console.log('🔍 Création d\'une nouvelle conversation:', { medecinId: userId, patientId, type: 'patient_medecin' });
      
      // ✅ Utiliser la méthode du service
      const result = await signalingService.createConversation(
        patientId,  // ID du patient (premier paramètre)
        userId,     // ID du médecin (deuxième paramètre)
        'patient_medecin'
      );
      
      console.log('📨 Réponse de création de conversation:', result);
      
      if (result.success && result.conversation) {
        console.log('✅ Nouvelle conversation créée:', result.conversation);
        
        // Ajouter la nouvelle conversation à la liste locale
        const newConversation = result.conversation;
        setConversations(prev => {
          const updated = [...prev, newConversation];
          console.log('📝 Conversations mises à jour:', updated);
          return updated;
        });
        
        // Sélectionner la nouvelle conversation
        setSelectedConversation(newConversation.id);
        setMessages([]);
        
        // Recharger les conversations depuis le serveur pour s'assurer de la synchronisation
        setTimeout(() => {
          loadUserConversations();
        }, 1000);
        
        console.log('✅ Conversation créée et sélectionnée avec succès');
      } else {
        console.error('❌ Erreur lors de la création de conversation:', result.error);
        setError(`Erreur lors de la création de conversation: ${result.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de conversation:', error);
      setError(`Erreur lors de la création de conversation: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !isConnected) return;
    
    try {
      let targetConversationId = selectedConversation;
      
      // Si pas de conversation sélectionnée mais qu'on a un médecin ID, essayer d'en créer une
      if (!targetConversationId && propMedecinId && userRole === 'patient') {
        console.log('🔍 Pas de conversation sélectionnée, tentative d\'initiation avec le médecin:', propMedecinId);
        const newConversation = await initiateConversationWithMedecin(propMedecinId);
        if (newConversation) {
          targetConversationId = newConversation.id;
          console.log('✅ Conversation créée côté serveur pour l\'envoi du message');
        } else {
          setError("Impossible d'initier une conversation avec ce médecin");
          return;
        }
      }
      
      if (!targetConversationId) {
        setError("Veuillez sélectionner une conversation ou un médecin pour envoyer un message");
        return;
      }

      console.log('🔍 Envoi du message dans la conversation:', targetConversationId);
      
      // ✅ Utiliser la méthode du service
      const result = await signalingService.sendMessage(
        targetConversationId, 
        inputMessage.trim(), 
        'texte'
      );
      
      if (result.success) {
        // Ajouter le message localement
        const newMessage = {
          id: Date.now(),
          sender: userRole,
          content: inputMessage.trim(),
          timestamp: new Date().toISOString(),
          type: 'text'
        };
        
        setMessages(prev => [...prev, newMessage]);
        setInputMessage("");
        console.log('✅ Message envoyé avec succès');
      } else {
        console.error('❌ Erreur lors de l\'envoi du message:', result.error);
        setError(`Erreur lors de l'envoi du message: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      setError(`Erreur lors de l'envoi du message: ${error.message}`);
    }
  };

  // ✅ NOUVELLE FONCTION : Démarrer un appel vidéo
  const startVideoCall = async () => {
    if (!selectedConversation) {
      setError("Veuillez sélectionner une conversation pour démarrer un appel vidéo");
      return;
    }

    try {
      console.log('🎥 Démarrage d\'un appel vidéo pour la conversation:', selectedConversation);

      // ✅ Utiliser la méthode du service pour créer une session WebRTC avec code de conférence
      const result = await signalingService.createWebRTCSessionWithConferenceLink(
        selectedConversation,
        'audio_video',
        null, // SDP offer sera généré par le composant vidéo
        true // Générer un code de conférence
      );

      if (result.success) {
        console.log('✅ Session WebRTC créée:', result.session);
        if (result.conferenceLink) {
          setConferenceLink(result.conferenceLink);
          console.log('�� Lien de conférence (REST):', result.conferenceLink);
        }
        // Émettre l'événement pour démarrer l'appel
        signalingService.emit('start_video_call', {
          conversationId: selectedConversation,
          sessionId: result.session.id
        });
        // Ouvrir le widget WebRTC en initiateur
        setCallType('video');
        setShowCallWidget(true);
      } else {
        setError(`Erreur lors de la création de la session vidéo: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du démarrage de l\'appel vidéo:', error);
      setError(`Erreur lors du démarrage de l'appel vidéo: ${error.message}`);
    }
  };

  const handleConversationSelect = (conversationId) => {
    setSelectedConversation(conversationId);
    loadConversationMessages(conversationId);
  };

  // Fonction pour trouver une conversation avec un médecin spécifique
  const findConversationWithMedecin = (medecinId) => {
    if (userRole !== 'patient') return null;
    
    const conversation = conversations.find(conv => 
      conv.type_conversation === 'patient_medecin' && 
      (conv.participants?.includes(medecinId) || conv.medecin_id === medecinId)
    );
    
    if (conversation) {
      setSelectedConversation(conversation.id);
      loadConversationMessages(conversation.id);
      return conversation;
    }
    
    return null;
  };

  // Effet pour automatiquement sélectionner une conversation avec le médecin si fourni
  useEffect(() => {
    if (propMedecinId && userRole === 'patient' && conversations.length > 0) {
      const conversation = findConversationWithMedecin(propMedecinId);
      if (!conversation) {
        setError("Aucune conversation trouvée avec ce médecin. Contactez votre médecin pour démarrer une conversation.");
      }
    }
  }, [propMedecinId, conversations, userRole]);

  // Fonction pour permettre aux patients d'initier une conversation
  const initiateConversationWithMedecin = async (medecinId) => {
    if (userRole !== 'patient') {
      console.log('❌ Seuls les patients peuvent initier des conversations');
      return null;
    }

    try {
      console.log('🔍 Tentative d\'initiation de conversation avec le médecin:', medecinId);
      
      // Vérifier d'abord s'il y a déjà une conversation
      const existingConversation = findConversationWithMedecin(medecinId);
      if (existingConversation) {
        console.log('✅ Conversation existante trouvée, pas besoin d\'en créer une nouvelle');
        return existingConversation;
      }

      // Créer une vraie conversation côté serveur
      console.log('📝 Création d\'une vraie conversation côté serveur...');
      
      // ✅ Utiliser le service de signalisation pour créer la conversation
      const result = await signalingService.createConversation(
        userId,        // ID du patient (premier paramètre)
        medecinId,     // ID du médecin (deuxième paramètre)
        'patient_medecin'
      );

      if (result.success && result.conversation) {
        console.log('✅ Conversation créée côté serveur:', result.conversation);
        
        // Ajouter la nouvelle conversation à la liste locale
        const newConversation = result.conversation;
        setConversations(prev => {
          const updated = [...prev, newConversation];
          console.log('📝 Conversations mises à jour:', updated);
          return updated;
        });
        
        // Sélectionner la nouvelle conversation
        setSelectedConversation(newConversation.id);
        setMessages([]);
        
        return newConversation;
      } else {
        console.error('❌ Erreur lors de la création de conversation côté serveur:', result.error);
        setError(`Impossible de créer une conversation avec ce médecin: ${result.error || 'Erreur inconnue'}`);
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initiation de la conversation:', error);
      setError(`Erreur lors de la création de conversation: ${error.message}`);
      return null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedConversation) {
        sendMessage();
      } else if (userRole === 'medecin') {
        // Seuls les médecins peuvent créer de nouvelles conversations
        if (propPatientId) {
          createNewConversation();
        } else {
          setError("Veuillez d'abord sélectionner un patient pour créer une conversation");
        }
      } else if (userRole === 'patient' && propMedecinId) {
        // Pour les patients avec un médecin ID, permettre l'envoi direct
        sendMessage();
      } else {
        // Pour les patients sans médecin ID, afficher un message d'information
        setError("Veuillez sélectionner une conversation existante ou un médecin pour envoyer un message");
      }
    }
  };

  const getStatusColor = () => {
    if (isConnected) return 'text-green-600';
    if (error) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusText = () => {
    if (isConnected) return 'Connecté';
    if (error) return 'Erreur';
    return 'Connexion...';
  };

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      <div className="bg-white h-full flex flex-col overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaComments className="text-2xl" />
              <h1 className="text-2xl font-bold">Messagerie Sécurisée</h1>
            </div>
            <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
          </div>
          <p className="text-blue-100 mt-2">
            {userRole === 'patient' ? 'Patient' : 'Médecin'} - ID: {userId}
            {userRole === 'medecin' && propPatientId && (
              <span className="block text-sm text-blue-200 mt-1">
                Patient sélectionné: ID {propPatientId}
              </span>
            )}
          </p>
        </div>

        {/* Contenu principal */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Liste des conversations */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">Conversations</h2>
                <button
                  onClick={loadUserConversations}
                  className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50"
                  title="Rafraîchir les conversations"
                  disabled={isLoading}
                >
                  ��
                </button>
              </div>
              {userRole === 'medecin' ? (
                <button
                  onClick={() => createNewConversation()}
                  disabled={!isConnected || isLoading || (!propPatientId && !selectedConversation)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <FaPlus className="text-sm" />
                  <span>
                    {propPatientId ? 'Créer conversation avec ce patient' : 'Nouvelle conversation'}
                  </span>
                </button>
              ) : (
                <div className="text-center p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Seuls les médecins peuvent créer de nouvelles conversations
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <FaSpinner className="animate-spin text-blue-500 mr-2" />
                  <span>Chargement...</span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <FaComments className="text-3xl mx-auto mb-2 opacity-50" />
                  <p>Aucune conversation</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv, index) => (
                    <div
                      key={`conv-${conv.id}-${index}`}
                      onClick={() => handleConversationSelect(conv.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${
                        selectedConversation === conv.id ? 'bg-blue-100 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                          {conv.type_conversation === 'patient_medecin' ? <FaUserMd /> : <FaUser />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {conv.titre || `Conversation ${conv.id}`}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {conv.type_conversation === 'patient_medecin' ? 'Patient-Médecin' : 'Autre'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Zone de messages */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedConversation ? (
              <>
                {/* En-tête de la conversation avec boutons d'appel */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">
                      Conversation {selectedConversation}
                    </h3>
                    <div className="flex items-center space-x-3">
                      {conferenceLink && (
                        <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded">
                          <span className="text-xs">Lien:</span>
                          <code className="text-xs font-semibold">{conferenceLink}</code>
                          <button
                            onClick={() => navigator.clipboard.writeText(String(conferenceLink))}
                            className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded"
                            title="Copier le lien"
                          >
                            Copier
                          </button>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <button
                          onClick={startVideoCall}
                          disabled={!isConnected}
                          className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Démarrer un appel vidéo"
                        >
                          <FaVideo className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {showCallWidget && (
                  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-2">
                      <WebRTCWidget
                        conversationId={selectedConversation}
                        isInitiator={true}
                        initialConferenceLink={conferenceLink}
                        onClose={() => setShowCallWidget(false)}
                      />
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FaComments className="text-2xl mx-auto mb-2 opacity-50" />
                      <p>Aucun message</p>
                      <p className="text-sm">Envoyez un message pour démarrer la conversation</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={`msg-${msg.id}-${index}-${msg.timestamp}`}
                        className={`flex ${msg.sender === userRole ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.sender === userRole
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <div className="text-sm font-medium mb-1">
                            {msg.sender === userRole ? 'Moi' : (msg.sender === 'patient' ? 'Patient' : 'Médecin')}
                          </div>
                          <div className="text-sm">{msg.content}</div>
                          <div className={`text-xs mt-1 ${
                            msg.sender === userRole ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Zone de saisie */}
                <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Écrire un message..."
                      disabled={!isConnected}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || !isConnected || isLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Envoyer
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full">
                {/* Zone centrale pour le message d'information */}
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FaComments className="text-4xl mx-auto mb-4 opacity-50" />
                    {userRole === 'medecin' ? (
                      <>
                        <p className="text-lg">Sélectionnez une conversation</p>
                        <p className="text-sm">ou créez-en une nouvelle</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg">Sélectionnez une conversation</p>
                        <p className="text-sm">avec votre médecin pour envoyer un message</p>
                        {propMedecinId && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                              Médecin ID: {propMedecinId}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Zone de saisie par défaut - TOUJOURS VISIBLE ET ACCESSIBLE */}
                <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={userRole === 'medecin' 
                        ? propPatientId 
                          ? "Écrire un message... (appuyez sur Entrée pour créer une conversation)"
                          : "Sélectionnez d'abord un patient pour créer une conversation"
                        : propMedecinId
                          ? "Écrire un message au médecin... (appuyez sur Entrée pour envoyer)"
                          : "Écrire un message au médecin..."
                      }
                      disabled={!isConnected}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    {userRole === 'medecin' ? (
                      <button
                        onClick={() => {
                          if (inputMessage.trim()) {
                            createNewConversation();
                          }
                        }}
                        disabled={!inputMessage.trim() || !isConnected || isLoading || !propPatientId}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!propPatientId ? "Sélectionnez d'abord un patient" : ""}
                      >
                        {propPatientId ? 'Créer conversation' : 'Sélectionner patient'}
                      </button>
                    ) : propMedecinId ? (
                      <button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || !isConnected || isLoading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Envoyer un message au médecin"
                      >
                        Envoyer au médecin
                      </button>
                    ) : (
                      <div className="text-center px-4 py-2 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Sélectionnez une conversation existante
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-6 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-red-800 text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
