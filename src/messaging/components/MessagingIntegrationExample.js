// src/messaging/components/MessagingIntegrationExample.js
// Exemple de composant React conforme au guide d'intégration

import React, { useState, useEffect } from 'react';
import { signalingService } from '../index';

const MessagingIntegrationExample = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [availableMedecins, setAvailableMedecins] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Étape 1 : Initialisation du service
    initializeService();
    
    // Nettoyer à la déconnexion
    return () => {
      signalingService.cleanup();
    };
  }, []);

  const initializeService = async () => {
    try {
      // Initialiser le service
      signalingService.initialize();
      
      // Se connecter au WebSocket
      const connected = signalingService.connect();
      
      if (connected) {
        setIsConnected(true);
        
        // Étape 2 : Vérifier l'authentification
        const user = signalingService.getUserInfo();
        if (!user || !user.primaryToken) {
          console.error('Utilisateur non authentifié');
          return;
        }
        
        setUserInfo(user);
        console.log('Utilisateur connecté:', user);
        
        // Charger les données initiales
        await loadInitialData();
        
        // Écouter les événements WebSocket
        setupEventListeners();
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      // Charger les conversations
      await loadConversations();
      
      // Charger les utilisateurs disponibles
      if (userInfo?.userType === 'medecin') {
        await loadAvailablePatients();
      } else if (userInfo?.userType === 'patient') {
        await loadAvailableMedecins();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const setupEventListeners = () => {
    // Écouter les nouveaux messages
    signalingService.on('message:received', handleNewMessage);
    
    // Écouter les événements WebRTC
    signalingService.on('webrtc:offer', handleWebRTCOffer);
    signalingService.on('webrtc:answer', handleWebRTCAnswer);
    signalingService.on('webrtc:ice_candidates', handleICECandidates);
    
    // Écouter les mises à jour de conversation
    signalingService.on('conversation:updated', handleConversationUpdate);
  };

  // Étape 3 : Récupération des conversations
  const loadConversations = async () => {
    try {
      const result = await signalingService.getUserConversations();
      if (result.success) {
        setConversations(result.conversations);
        console.log('Conversations chargées:', result.conversations);
      } else {
        console.error('Erreur lors du chargement des conversations:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    }
  };

  // Étape 4 : Création de conversations
  const createConversation = async (targetUserId) => {
    try {
      let result;
      
      if (userInfo.userType === 'medecin') {
        // Médecin créant une conversation avec un patient
        result = await signalingService.createConversation(
          targetUserId, 
          null, // medecinId sera automatiquement récupéré du token
          'prescription_followup'
        );
      } else {
        // Patient créant une conversation avec un médecin
        result = await signalingService.createConversation(
          null, // patientId sera automatiquement récupéré du token
          targetUserId,
          'prescription_question'
        );
      }
      
      if (result.success) {
        console.log('Conversation créée:', result.conversation);
        // Recharger la liste des conversations
        await loadConversations();
      } else {
        console.error('Erreur lors de la création de la conversation:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
    }
  };

  // Étape 5 : Envoi de messages
  const sendMessage = async (content) => {
    if (!selectedConversation) return;
    
    try {
      const result = await signalingService.sendMessage(
        selectedConversation.id,
        content,
        'text'
      );
      
      if (result.success) {
        console.log('Message envoyé:', result.message);
        // Ajouter le message à la liste locale
        setMessages(prev => [...prev, result.message]);
      } else {
        console.error('Erreur lors de l\'envoi du message:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  // Étape 6 : Sessions WebRTC
  const createWebRTCSession = async (targetUserId) => {
    try {
      const result = await signalingService.createWebRTCSession(
        targetUserId,
        'consultation'
      );
      
      if (result.success) {
        console.log('Session WebRTC créée:', result.session);
        console.log('Code de conférence:', result.conferenceCode);
        console.log('URL de conférence:', result.conferenceUrl);
      } else {
        console.error('Erreur lors de la création de la session WebRTC:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors de la création de la session WebRTC:', error);
    }
  };

  const joinWebRTCSession = async (sessionId) => {
    try {
      const result = await signalingService.joinWebRTCSession(sessionId);
      
      if (result.success) {
        console.log('Session rejointe:', result.session);
      } else {
        console.error('Erreur lors de la jointure de la session:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors de la jointure de la session:', error);
    }
  };

  // Gestion des autorisations
  const loadAvailablePatients = async () => {
    try {
      const result = await signalingService.getMedecinCommunicablePatients();
      if (result.success) {
        setAvailablePatients(result.patients);
        console.log('Patients disponibles:', result.patients);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
    }
  };

  const loadAvailableMedecins = async () => {
    try {
      const result = await signalingService.getPatientCommunicableMedecins();
      if (result.success) {
        setAvailableMedecins(result.medecins);
        console.log('Médecins disponibles:', result.medecins);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des médecins:', error);
    }
  };

  const checkAuthorization = async (targetUserId) => {
    try {
      const result = await signalingService.checkCommunicationAuthorization(
        userInfo.userType === 'patient' ? userInfo.userId : targetUserId,
        userInfo.userType === 'medecin' ? userInfo.userId : targetUserId
      );
      
      if (result.success) {
        const { canCommunicate, reason } = result.authorization;
        if (canCommunicate) {
          console.log('Communication autorisée:', reason);
          return true;
        } else {
          console.log('Communication non autorisée');
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification des autorisations:', error);
      return false;
    }
  };

  // Gestionnaires d'événements
  const handleNewMessage = (data) => {
    console.log('Nouveau message reçu:', data);
    if (data.conversation.id === selectedConversation?.id) {
      setMessages(prev => [...prev, data.message]);
    }
  };

  const handleWebRTCOffer = (data) => {
    console.log('Offre WebRTC reçue:', data);
    // Gérer l'offre WebRTC
  };

  const handleWebRTCAnswer = (data) => {
    console.log('Réponse WebRTC reçue:', data);
    // Gérer la réponse WebRTC
  };

  const handleICECandidates = (data) => {
    console.log('Candidats ICE reçus:', data);
    // Gérer les candidats ICE
  };

  const handleConversationUpdate = (data) => {
    console.log('Conversation mise à jour:', data);
    // Mettre à jour la liste des conversations
    loadConversations();
  };

  // Diagnostic
  const getDiagnosticInfo = () => {
    const diagnostic = signalingService.getDiagnosticInfo();
    const status = signalingService.getConnectionStatus();
    console.log('Diagnostic du service:', diagnostic);
    console.log('Statut de connexion:', status);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Service de Messagerie - Exemple d'Intégration</h2>
      
      {/* Statut de connexion */}
      <div style={{ 
        padding: '10px', 
        marginBottom: '20px',
        backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
        border: `1px solid ${isConnected ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '4px'
      }}>
        <strong>Statut :</strong> {isConnected ? '✅ Connecté' : '❌ Déconnecté'}
        {userInfo && (
          <div>
            <strong>Utilisateur :</strong> {userInfo.userType} (ID: {userInfo.userId})
          </div>
        )}
      </div>

      {/* Boutons de diagnostic */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={getDiagnosticInfo} style={{ marginRight: '10px' }}>
          Diagnostic
        </button>
        <button onClick={loadConversations} style={{ marginRight: '10px' }}>
          Recharger Conversations
        </button>
        <button onClick={loadInitialData}>
          Recharger Tout
        </button>
      </div>

      {/* Liste des conversations */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Conversations ({conversations.length})</h3>
        {conversations.map(conv => (
          <div 
            key={conv.id}
            onClick={() => setSelectedConversation(conv)}
            style={{ 
              padding: '10px', 
              margin: '5px 0',
              backgroundColor: selectedConversation?.id === conv.id ? '#e3f2fd' : '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <strong>{conv.patient?.nom || conv.professionnel?.nom}</strong>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Type: {conv.type_conversation} | Messages: {conv.message_count || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Utilisateurs disponibles */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Utilisateurs Disponibles</h3>
        {userInfo?.userType === 'medecin' && (
          <div>
            <h4>Patients ({availablePatients.length})</h4>
            {availablePatients.map(patient => (
              <div key={patient.id} style={{ 
                padding: '5px', 
                margin: '2px 0',
                backgroundColor: '#f9f9f9',
                border: '1px solid #eee',
                borderRadius: '4px'
              }}>
                {patient.nom} {patient.prenom}
                <button 
                  onClick={() => createConversation(patient.id)}
                  style={{ marginLeft: '10px', fontSize: '12px' }}
                >
                  Créer Conversation
                </button>
                <button 
                  onClick={() => createWebRTCSession(patient.id)}
                  style={{ marginLeft: '5px', fontSize: '12px' }}
                >
                  Appel Vidéo
                </button>
              </div>
            ))}
          </div>
        )}
        
        {userInfo?.userType === 'patient' && (
          <div>
            <h4>Médecins ({availableMedecins.length})</h4>
            {availableMedecins.map(medecin => (
              <div key={medecin.id} style={{ 
                padding: '5px', 
                margin: '2px 0',
                backgroundColor: '#f9f9f9',
                border: '1px solid #eee',
                borderRadius: '4px'
              }}>
                {medecin.nom} {medecin.prenom}
                <button 
                  onClick={() => createConversation(medecin.id)}
                  style={{ marginLeft: '10px', fontSize: '12px' }}
                >
                  Créer Conversation
                </button>
                <button 
                  onClick={() => createWebRTCSession(medecin.id)}
                  style={{ marginLeft: '5px', fontSize: '12px' }}
                >
                  Appel Vidéo
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages de la conversation sélectionnée */}
      {selectedConversation && (
        <div>
          <h3>Messages - {selectedConversation.patient?.nom || selectedConversation.professionnel?.nom}</h3>
          <div style={{ 
            height: '200px', 
            overflowY: 'auto', 
            border: '1px solid #ddd', 
            padding: '10px',
            marginBottom: '10px'
          }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ 
                margin: '5px 0',
                padding: '5px',
                backgroundColor: msg.sender === userInfo?.userType ? '#e3f2fd' : '#f5f5f5',
                borderRadius: '4px'
              }}>
                <strong>{msg.sender}:</strong> {msg.content}
                <div style={{ fontSize: '10px', color: '#666' }}>
                  {new Date(msg.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          
          {/* Zone d'envoi de message */}
          <div>
            <input 
              type="text" 
              placeholder="Tapez votre message..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage(e.target.value);
                  e.target.value = '';
                }
              }}
              style={{ width: '70%', padding: '5px' }}
            />
            <button 
              onClick={(e) => {
                const input = e.target.previousSibling;
                sendMessage(input.value);
                input.value = '';
              }}
              style={{ marginLeft: '10px', padding: '5px 10px' }}
            >
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingIntegrationExample;
