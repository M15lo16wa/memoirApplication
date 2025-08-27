// src/messaging/components/chatMessage.js
import React, { useState, useEffect, useCallback } from "react";
import signalingService from '../../services/signalingService';
import { FaComments, FaSpinner, FaPlus, FaUser, FaUserMd } from "react-icons/fa";

export default function ChatMessage({ userId: propUserId, role: propRole, token: propToken, conversationId: propConversationId, medecinId: propMedecinId, patientId: propPatientId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(propConversationId);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  
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
      
      // Initialiser le service
      signalingService.initialize();
      
      // Se connecter au WebSocket
      const socket = signalingService.connectSocket(userId, userRole, propToken);
      
      if (socket) {
        // Nettoyer les anciens événements avant d'en ajouter de nouveaux
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('new_message');
        
        socket.on('connect', () => {
          console.log('✅ Connecté au service de messagerie');
          setIsConnected(true);
          setError(null);
          
          // Charger les conversations une fois connecté
          loadUserConversations();
        });

        socket.on('disconnect', (reason) => {
          console.log('❌ Déconnecté du service de messagerie:', reason);
          setIsConnected(false);
          setError("Connexion perdue");
        });

        socket.on('connect_error', (error) => {
          console.error('❌ Erreur de connexion messagerie:', error);
          setIsConnected(false);
          setError("Erreur de connexion au serveur");
        });

        // Écouter les nouveaux messages
        socket.on('new_message', (data) => {
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

        // Vérifier l'état de connexion immédiatement
        if (socket.connected) {
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
      if (signalingService.socket) {
        signalingService.socket.off('connect');
        signalingService.socket.off('disconnect');
        signalingService.socket.off('connect_error');
        signalingService.socket.off('new_message');
      }
    };
  }, [userId, userRole, propToken]);

  const loadUserConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await signalingService.getUserConversations();
      if (result.success) {
        // Éviter les doublons en utilisant un Map avec l'ID comme clé
        const uniqueConversations = Array.from(
          new Map((result.conversations || []).map(conv => [conv.id, conv])).values()
        );
        setConversations(uniqueConversations);
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
      
      const result = await signalingService.getConversationMessages(conversationId, 50, 0);
      if (result.success) {
        // Éviter les doublons en utilisant un Map avec l'ID comme clé
        const uniqueMessages = Array.from(
          new Map((result.messages || []).map(msg => [msg.id, msg])).values()
        );
        setMessages(uniqueMessages);
        console.log('✅ Messages chargés:', uniqueMessages.length);
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
      
      const result = await signalingService.createConversation(
        userId,     // ID du médecin (utilisateur actuel)
        patientId,  // ID du patient
        'patient_medecin'
      );
      
      if (result.success) {
        console.log('✅ Nouvelle conversation créée:', result.conversation);
        await loadUserConversations();
        setSelectedConversation(result.conversation.id);
        setMessages([]);
      } else {
        console.error('❌ Erreur lors de la création de conversation:', result.error);
        setError(`Erreur lors de la création de conversation: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de conversation:', error);
      setError(`Erreur lors de la création de conversation: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedConversation || !isConnected) return;
    
    try {
      const result = await signalingService.sendMessage(
        selectedConversation, 
        inputMessage.trim(), 
        'texte'
      );
      
      if (result.success) {
        // Ajouter le message localement
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: userRole,
          content: inputMessage.trim(),
          timestamp: new Date().toISOString(),
          type: 'text'
        }]);
        
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
      } else {
        // Pour les patients, afficher un message d'information
        setError("Veuillez sélectionner une conversation existante pour envoyer un message");
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
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Conversations</h2>
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
                {/* En-tête de la conversation */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                  <h3 className="font-semibold text-gray-800">
                    Conversation {selectedConversation}
                  </h3>
                </div>

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
