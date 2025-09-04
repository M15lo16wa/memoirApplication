// src/messaging/components/chatMessage.js
import React, { useState, useEffect, useCallback } from "react";
import { FaComments, FaSpinner, FaPlus, FaUser, FaUserMd } from "react-icons/fa";
import messagingApi from "../../services/api/messagingApi";

export default function ChatMessage({ userId: propUserId, role: propRole, token: propToken, conversationId: propConversationId, medecinId: propMedecinId, patientId: propPatientId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(propConversationId);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  
  // Utiliser les props ou fallback sur localStorage
  const [userId] = useState(() => {
    if (propUserId) return propUserId;
    
    const patientData = localStorage.getItem('patient');
    if (patientData) {
      try {
        const patient = JSON.parse(patientData);
        return patient.id_patient || patient.id || null;
      } catch (e) {
        // Ignorer l'erreur
      }
    }
    const medecinData = localStorage.getItem('medecin');
    if (medecinData) {
      try {
        const medecin = JSON.parse(medecinData);
        return medecin.id_professionnel || medecin.id || null;
      } catch (e) {
        // Ignorer l'erreur
      }
    }
    return null;
  });
  
  const [userRole] = useState(() => {
    if (propRole) return propRole;
    if (localStorage.getItem('patient')) return 'patient';
    if (localStorage.getItem('medecin')) return 'medecin';
    return 'patient';
  });

  // Mettre à jour la conversation sélectionnée quand la prop change
  useEffect(() => {
    if (propConversationId && propConversationId !== selectedConversation) {
      setSelectedConversation(propConversationId);
    }
  }, [propConversationId, selectedConversation]);

  // Charger les conversations
  const loadUserConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      if (userId && userRole) {
        const result = await messagingApi.getUserConversations(userId, userRole);
        if (result.success) {
          setConversations(result.conversations || []);
        } else {
          setError(result.message || "Impossible de charger les conversations");
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement des conversations:", err);
      setError("Impossible de charger les conversations");
    } finally {
      setIsLoading(false);
    }
  }, [userId, userRole]);

  // Initialisation simplifiée
  useEffect(() => {
    if (userId && userRole) {
      console.log('🔌 Initialisation du service de messagerie:', { userId, userRole });
      setIsConnected(true);
      setError(null);
      // Charger les conversations au montage
      loadUserConversations();
    }
  }, [userId, userRole, loadUserConversations]);

  // Charger les messages d'une conversation
  const loadConversationMessages = useCallback(async (conversationId) => {
    try {
      setIsLoading(true);
      const result = await messagingApi.getConversationMessages(conversationId);
      console.log('📨 Messages chargés depuis le serveur:', result);
      
      if (result.success) {
        const rawMessages = result.messages || [];
        
        // Normaliser les messages pour l'affichage
        const formattedMessages = rawMessages.map((msg, index) => {
          console.log('🔍 Message brut:', msg);
          
          // CORRECTION: Le serveur retourne sender_id et sender_type
          let detectedSender;
          
          // Utiliser les données du serveur en priorité
          if (msg.sender_type === 'patient') {
            detectedSender = 'patient';
          } else if (msg.sender_type === 'professionnel' || msg.sender_type === 'medecin') {
            detectedSender = 'medecin';
          } else {
            // Fallback par alternance si les données serveur sont manquantes
            detectedSender = index % 2 === 0 ? 'patient' : 'medecin';
          }
          
          const formattedMsg = {
            id: msg.id || msg.id_message || `msg_${Date.now()}_${Math.random()}`,
            content: msg.content || msg.contenu || '',
            sender: detectedSender,
            originalSender: msg.sender, // Garder l'original pour debug
            sender_id: msg.sender_id, // Garder pour debug
            sender_type: msg.sender_type, // Garder pour debug
            timestamp: msg.timestamp || msg.date_envoi || new Date().toISOString(),
            type: msg.type || msg.type_message || 'text'
          };
          
          console.log('📝 Message formaté:', formattedMsg);
          return formattedMsg;
        });
        
        console.log('✅ Messages formatés:', formattedMessages);
        setMessages(formattedMessages);
      } else {
        setError(result.message || "Impossible de charger les messages");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des messages:", err);
      setError("Impossible de charger les messages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Créer une nouvelle conversation
  const createNewConversation = async (targetUserId) => {
    if (userRole !== 'medecin') {
      console.log('❌ Seuls les médecins peuvent créer de nouvelles conversations');
      setError("Seuls les médecins peuvent créer de nouvelles conversations");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      if (!targetUserId) {
        setError("Veuillez sélectionner un patient pour créer une conversation");
        setIsLoading(false);
        return;
      }
      
      console.log('🔍 Création d\'une nouvelle conversation:', { medecinId: userId, patientId: targetUserId });
      
      const result = await messagingApi.createConversation(targetUserId, userId, 'patient_medecin');
      
      console.log('📨 Réponse du serveur pour création conversation:', result);
      
      // Le serveur retourne directement l'objet conversation (code 201)
      // Vérifier si c'est un objet conversation ou une réponse avec success
      if (result && (result.id || result.id_conversation)) {
        // Réponse directe du serveur (objet conversation)
        const newConversation = result;
        setConversations(prev => [...prev, newConversation]);
        setSelectedConversation(newConversation.id || newConversation.id_conversation);
        setMessages([]);
        console.log('✅ Conversation créée et sélectionnée avec succès:', newConversation);
      } else if (result && result.success && result.conversation) {
        // Réponse avec structure success/conversation
        const newConversation = result.conversation;
        setConversations(prev => [...prev, newConversation]);
        setSelectedConversation(newConversation.id || newConversation.id_conversation);
        setMessages([]);
        console.log('✅ Conversation créée et sélectionnée avec succès:', newConversation);
      } else {
        setError(result.message || "Erreur lors de la création de conversation");
      }
    } catch (err) {
      console.error('❌ Erreur lors de la création de conversation:', err);
      setError(`Erreur lors de la création de conversation: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Envoyer un message
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !isConnected) {
      return;
    }

    try {
      if (selectedConversation) {
        const result = await messagingApi.sendMessage(selectedConversation, inputMessage.trim(), 'text');
        
        console.log('📨 Résultat envoi message:', result);
        
        if (result.success) {
          const newMessage = result.message;
          
          // Formater le message pour l'affichage
          const formattedMessage = {
            id: newMessage.id || newMessage.id_message || `msg_${Date.now()}`,
            content: newMessage.content || newMessage.contenu || inputMessage.trim(),
            sender: userRole, // L'expéditeur est l'utilisateur actuel
            timestamp: newMessage.timestamp || newMessage.date_envoi || new Date().toISOString(),
            type: newMessage.type || newMessage.type_message || 'text'
          };
          
          setMessages(prev => [...prev, formattedMessage]);
          setInputMessage("");
          console.log('✅ Message envoyé avec succès:', formattedMessage);
        } else {
          setError(result.message || "Erreur lors de l'envoi du message");
        }
      }
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);
      setError("Erreur lors de l'envoi du message");
    }
  }, [inputMessage, isConnected, selectedConversation, userRole]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleConversationSelect = (conversationId) => {
    setSelectedConversation(conversationId);
    setMessages([]);
    loadConversationMessages(conversationId);
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
                  🔄
                </button>
              </div>
              {userRole === 'medecin' ? (
                <button
                  onClick={() => createNewConversation(propPatientId)}
                  disabled={!isConnected || isLoading || !propPatientId}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <FaPlus className="text-sm" />
                  <span>
                    {propPatientId ? 'Créer conversation avec ce patient' : 'Sélectionner un patient'}
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
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">
                      Conversation {selectedConversation}
                    </h3>
                  </div>
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
                    messages.map((msg, index) => {
                      // Déterminer si le message est envoyé par l'utilisateur actuel
                      // Le serveur retourne déjà sender: "patient" ou "medecin"
                      const isOwnMessage = msg.sender === userRole;
                      
                      console.log('🎨 Affichage message:', {
                        msg,
                        isOwnMessage,
                        userRole,
                        sender: msg.sender,
                        originalSender: msg.originalSender,
                        comparison: msg.sender === userRole,
                        content: msg.content
                      });
                      
                      return (
                        <div
                          key={`msg-${msg.id}-${index}-${msg.timestamp}`}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwnMessage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            <div className="text-sm font-medium mb-1">
                              {isOwnMessage ? 'Moi' : (msg.sender === 'patient' ? 'Patient' : 'Médecin')}
                            </div>
                            <div className="text-sm">{msg.content}</div>
                            <div className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      );
                    })
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
                
                {/* Zone de saisie par défaut */}
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
                            createNewConversation(propPatientId);
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