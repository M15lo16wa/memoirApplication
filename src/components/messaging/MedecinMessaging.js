import React, { useState, useEffect, useCallback } from 'react';
import { FaComments, FaUser, FaCalendarAlt, FaClock, FaReply, FaEye, FaBell, FaSearch, FaFilter, FaPlus, FaBug } from 'react-icons/fa';
import SecureMessaging from './SecureMessaging';
import messagingService from '../../services/api/messagingApi';
import { getPatients } from '../../services/api/patientApi';
import { getAllConsultations } from '../../services/api/medicalApi';
import useMessaging from '../../hooks/useMessaging';
import useSecureMessaging from '../../hooks/useSecureMessaging';
import WebSocketDiagnostic from '../debug/WebSocketDiagnostic';

const MedecinMessaging = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [showCreateConversation, setShowCreateConversation] = useState(false);
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // S'assurer que conversations est toujours un tableau
  const safeConversations = Array.isArray(conversations) ? conversations : [];
  
  // Récupérer le médecin connecté
  const getCurrentMedecin = useCallback(() => {
    const medecinData = localStorage.getItem('medecin');
    return medecinData ? JSON.parse(medecinData) : null;
  }, []);

  // 🔌 Hook unifié pour la messagerie (HTTP + WebSocket)
  const { 
    isConnected: wsConnected, 
    socketId, 
    connectWebSocket,
    onNewMessage, 
    onConversationUpdate, 
    onPresenceChange, 
    onNotification 
  } = useMessaging();

  // 🔌 Hook pour la messagerie sécurisée - Écouter l'ordonnance #15
  const {
    messages: secureMessages,
    loading: secureLoading,
    error: secureError,
    conversationId: secureConversationId,
    isConnected: secureConnected
  } = useSecureMessaging('ordonnance', 15, getCurrentMedecin());

  // 🔍 Log de l'état de la messagerie sécurisée
  useEffect(() => {
    console.log('🔌 [MedecinMessaging] État useSecureMessaging:', {
      messagesCount: secureMessages?.length || 0,
      conversationId: secureConversationId,
      isConnected: secureConnected,
      loading: secureLoading,
      error: secureError
    });
  }, [secureMessages, secureConversationId, secureConnected, secureLoading, secureError]);

  // Charger les données de base
  const loadBaseData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des données de base...');

      console.log('🔍 [MedecinMessaging] Chargement de la liste complète des patients...');
      
      const patientsData = await getPatients();
      console.log('👥 Patients chargés:', patientsData?.length || 0);

      if (patientsData && Array.isArray(patientsData) && patientsData.length > 0) {
        setPatients(patientsData);
        localStorage.setItem('patients_data', JSON.stringify(patientsData));
        console.log('✅ Liste complète des patients sauvegardée dans localStorage');
      } else {
        console.warn('⚠️ Aucun patient trouvé dans la base de données');
        setPatients([]);
      }
      
      // Charger les consultations
      const consultationsData = await getAllConsultations();
      console.log('🏥 Consultations disponibles:', consultationsData?.length || 0);
      if (consultationsData && Array.isArray(consultationsData)) {
        setConsultations(consultationsData);
        console.log('✅ Consultations sauvegardées pour référence');
      } else {
        console.warn('⚠️ Aucune consultation disponible');
      }
      
      console.log('✅ Chargement des données de base terminé');
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données de base:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  
// Charger les conversations du médecin depuis l'API
const loadConversations = useCallback(async () => {
  try {
    setLoading(true);
    const medecin = getCurrentMedecin();
    if (!medecin) {
      setConversations([]);
      setNewMessagesCount(0);
      return;
    }

    const medecinId = medecin.id_professionnel || medecin.id;
    console.log('🔄 Chargement des conversations pour le médecin:', medecinId);
    
    try {
      // Utiliser la nouvelle API de messagerie
      console.log('🔍 Appel API getConversationsMedecin avec ID:', medecinId);
      const response = await messagingService.getConversationsMedecin(medecinId, 1, 20);
      
      if (response && response.data && response.data.conversations) {
        const apiConversations = response.data.conversations;
        console.log('✅ Conversations récupérées depuis l\'API:', apiConversations.length);
        console.log('📋 Détail des conversations:', apiConversations);
        
        // 🔧 ADAPTATION : Utiliser la nouvelle structure avec patient_id et professionnel_id
        const enrichedConversations = apiConversations.map((conversation) => {
          // Extraire les informations du patient et du médecin depuis les participants
          const patientParticipant = conversation.participants?.find(p => p.patient_id);
          const medecinParticipant = conversation.participants?.find(p => p.professionnel_id);
          
          return {
            id: conversation.id_conversation,
            titre: conversation.titre,
            type_conversation: conversation.type_conversation,
            statut: conversation.statut,
            date_creation: conversation.date_creation,
            date_modification: conversation.date_modification,
            lastActivity: conversation.date_modification || conversation.date_creation,
            // �� NOUVELLE STRUCTURE : Utiliser patient_id et professionnel_id
            patient: patientParticipant ? {
              id: patientParticipant.patient_id,
              nom: patientParticipant.patient_info?.nom || 'Patient',
              prenom: patientParticipant.patient_info?.prenom || 'Inconnu'
            } : null,
            medecin: medecinParticipant ? {
              id: medecinParticipant.professionnel_id,
              nom: medecinParticipant.medecin_info?.nom || 'Médecin',
              prenom: medecinParticipant.medecin_info?.prenom || 'Inconnu'
            } : null,
            // Informations du dernier message
            lastMessage: conversation.dernier_message ? {
              content: conversation.dernier_message.contenu,
              sender: {
                id: conversation.dernier_message.expediteur_id,
                type: conversation.dernier_message.expediteur_type
              },
              timestamp: conversation.dernier_message.date_envoi
            } : null,
            // Compteurs
            unreadCount: conversation.dernier_message ? 
              (conversation.dernier_message.expediteur_id !== medecinId ? 1 : 0) : 0,
            messageCount: conversation.dernier_message ? 1 : 0,
            // Contexte (déduit du titre ou type)
            contextType: conversation.type_conversation === 'patient_medecin' ? 'consultation' : 'general',
            contextId: conversation.id_conversation,
            priority: 'normal'
          };
        });
        
        setConversations(enrichedConversations);
        
        // Compter les messages non lus
        const totalUnread = enrichedConversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setNewMessagesCount(totalUnread);
      } else {
        console.log('ℹ️ Aucune conversation disponible dans l\'API');
        setConversations([]);
        setNewMessagesCount(0);
      }
    } catch (apiError) {
      console.log('⚠️ API de messagerie non disponible:', apiError.message);
      setConversations([]);
      setNewMessagesCount(0);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de l\'API:', error);
    setConversations([]);
    setNewMessagesCount(0);
  } finally {
    setLoading(false);
  }
}, [getCurrentMedecin]);

  // Filtrer les conversations
  const filteredConversations = safeConversations.filter(conv => {
    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const patientName = `${conv.patient?.nom || ''} ${conv.patient?.prenom || ''}`.toLowerCase();
      const lastMessageContent = conv.lastMessage?.content?.toLowerCase() || '';
      
      if (!patientName.includes(searchLower) && !lastMessageContent.includes(searchLower)) {
        return false;
      }
    }
    
    // Filtre par type
    switch (filterType) {
      case 'unread':
        return conv.unreadCount > 0;
      case 'urgent':
        return conv.priority === 'high';
      case 'ordonnance':
        return conv.contextType === 'ordonnance';
      case 'examen':
        return conv.contextType === 'examen';
      case 'consultation':
        return conv.contextType === 'consultation';
      default:
        return true;
    }
  });

  // Ouvrir une conversation
  const handleOpenConversation = (conversation) => {
    console.log('🔍 Ouverture de la conversation:', conversation);
    
    // Vérifier que la conversation a les propriétés nécessaires
    if (!conversation.contextType || !conversation.contextId) {
      console.error('❌ Conversation invalide:', conversation);
      alert('Impossible d\'ouvrir cette conversation. Données manquantes.');
      return;
    }
    
    setSelectedConversation(conversation);
    setShowMessaging(true);
  };

  // Fermer la messagerie
  const handleCloseMessaging = () => {
    setShowMessaging(false);
    setSelectedConversation(null);
    // Recharger les conversations pour mettre à jour les compteurs
    loadConversations();
  };

  // Créer une nouvelle conversation
  const handleCreateConversation = async (e) => {
    e.preventDefault();
    
    if (!newConversationTitle.trim() || !selectedPatientId) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      const medecin = getCurrentMedecin();
      const medecinId = medecin?.id_professionnel || medecin?.id;
      
      // 🔧 NOUVELLE STRUCTURE : Utiliser patient_id et professionnel_id
      const conversationData = {
        titre: newConversationTitle.trim(),
        type_conversation: 'patient_medecin',
        participants: [
          { 
            participant_id: selectedPatientId, 
            participant_type: 'patient' 
          },
          { 
            participant_id: medecinId, 
            participant_type: 'medecin' 
          }
        ]
      };
      
      console.log('🔄 Création de conversation:', conversationData);
      const newConversation = await messagingService.createConversation(conversationData);
      console.log('✅ Nouvelle conversation créée:', newConversation);
      
      // Fermer le modal, réinitialiser les champs et rafraîchir la liste
      setShowCreateConversation(false);
      setNewConversationTitle('');
      setSelectedPatientId('');
      loadConversations();
      
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
      alert(`Erreur lors de la création: ${error.message}`);
    }
  };

  // Marquer toutes les conversations comme lues
  const markAllAsRead = async () => {
    try {
      // Mettre à jour l'état local
      setConversations(prev => prev.map(conv => ({ ...conv, unreadCount: 0 })));
      setNewMessagesCount(0);
      
      console.log('✅ Toutes les conversations marquées comme lues');
      
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  // Formater la date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  // Obtenir l'icône du contexte
  const getContextIcon = (contextType) => {
    switch (contextType) {
      case 'ordonnance':
        return '💊';
      case 'examen':
        return '🔬';
      case 'consultation':
        return '🏥';
      default:
        return '��';
    }
  };

  // Obtenir la couleur de priorité
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  // Obtenir le nom du contexte
  const getContextName = (contextType) => {
    switch (contextType) {
      case 'ordonnance':
        return 'Ordonnance';
      case 'examen':
        return 'Examen';
      case 'consultation':
        return 'Consultation';
      default:
        return 'Discussion';
    }
  };

  // Charger les données au montage
  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 🔌 INITIALISATION AUTOMATIQUE DE LA CONNEXION WEBSOCKET
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        // Récupérer le token d'authentification
        const token = localStorage.getItem('jwt') || 
                     localStorage.getItem('firstConnectionToken') || 
                     localStorage.getItem('originalJWT');
        
        if (token) {
          console.log('🔌 [MedecinMessaging] Initialisation automatique de la connexion WebSocket...');
          connectWebSocket(token);
        } else {
          console.warn('⚠️ [MedecinMessaging] Aucun token d\'authentification trouvé pour la connexion WebSocket');
        }
      } catch (error) {
        console.error('❌ [MedecinMessaging] Erreur lors de l\'initialisation WebSocket:', error);
      }
    };

    // Initialiser la connexion WebSocket après un court délai
    const timer = setTimeout(initializeWebSocket, 1000);
    
    return () => clearTimeout(timer);
  }, [connectWebSocket]);

  // 🔌 ÉCOUTE COMPLÈTE DES ÉVÉNEMENTS WEBSOCKET DE VOTRE SERVEUR
  useEffect(() => {
    if (wsConnected) {
      console.log('�� WebSocket connecté, écoute de tous les événements...');
      
      // 1. Nouveaux messages
      const handleNewMessage = (message) => {
        console.log('�� Nouveau message reçu via WebSocket:', message);
        setNewMessagesCount(prev => prev + 1);
        loadConversations();
      };
      
      // 2. Mises à jour de conversation
      const handleConversationUpdate = (data) => {
        console.log('🔄 Conversation mise à jour via WebSocket:', data);
        // Recharger les conversations pour avoir les données à jour
        loadConversations();
      };
      
      // 3. Changements de présence des utilisateurs
      const handlePresenceChange = (status, userData) => {
        console.log(`👤 Utilisateur ${status}:`, userData);
        // Optionnel : Mettre à jour l'interface pour montrer qui est en ligne
      };
      
      // 4. Notifications système
      const handleNotification = (notification) => {
        console.log('🔔 Notification WebSocket reçue:', notification);
        // Afficher la notification à l'utilisateur
        if (notification.type === 'new_conversation') {
          loadConversations(); // Recharger si nouvelle conversation
        }
      };
      
      // S'abonner à tous les événements
      onNewMessage(handleNewMessage);
      onConversationUpdate(handleConversationUpdate);
      onPresenceChange(handlePresenceChange);
      onNotification(handleNotification);
      
      // Nettoyage
      return () => {
        // Note: Le hook useMessaging gère déjà le nettoyage
      };
    }
  }, [wsConnected, onNewMessage, onConversationUpdate, onPresenceChange, onNotification, loadConversations]);

  // Recharger périodiquement (fallback si WebSocket déconnecté)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!wsConnected) {
        console.log('🔄 Rechargement périodique (WebSocket déconnecté)...');
        loadConversations();
        
        // 🔌 TENTATIVE DE RECONNEXION WEBSOCKET
        const token = localStorage.getItem('jwt') || 
                     localStorage.getItem('firstConnectionToken') || 
                     localStorage.getItem('originalJWT');
        
        if (token) {
          console.log('🔄 [MedecinMessaging] Tentative de reconnexion WebSocket...');
          connectWebSocket(token);
        }
      }
    }, 60000); // Toutes les 60 secondes

    return () => clearInterval(interval);
  }, [loadConversations, wsConnected, connectWebSocket]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaComments className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Messagerie Sécurisée</h3>
                         <p className="text-sm text-gray-600">
           {conversations.length === 0 ? 'Aucune conversation' : `${conversations.length} conversation(s)`}
           {newMessagesCount > 0 && (
             <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
               {newMessagesCount} nouveau(x)
             </span>
           )}
           {secureMessages && secureMessages.length > 0 && (
             <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
               {secureMessages.length} WebSocket
             </span>
           )}
           <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
             API
           </span>
                  {/* 🔌 Indicateur WebSocket avancé */}
                  <div className="flex items-center space-x-1">
                    <span className={`px-2 py-1 text-white text-xs rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}>
                      {wsConnected ? 'WS' : 'No WS'}
                    </span>
                    {wsConnected && socketId && (
                      <span className="px-1 py-1 bg-blue-500 text-white text-xs rounded-full" title={`Socket ID: ${socketId}`}>
                        {socketId.substring(0, 4)}...
                      </span>
                    )}
                    {/* 🔍 Indicateur de statut de connexion */}
                    <span className={`px-1 py-1 text-white text-xs rounded-full ${wsConnected ? 'bg-green-600' : 'bg-yellow-600'}`} title="Statut de connexion">
                      {wsConnected ? '✓' : '⏳'}
                    </span>
                  </div>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setShowCreateConversation(true);
                  // Réinitialiser les champs quand le modal s'ouvre
                  setNewConversationTitle('');
                  setSelectedPatientId('');
                }}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <FaPlus className="w-4 h-4" />
                <span>Nouvelle Conversation</span>
              </button>
              <button
                onClick={markAllAsRead}
                className="text-blue-600 hover:text-blue-800 text-sm"
                title="Marquer tout comme lu"
              >
                <FaEye className="w-4 h-4" />
              </button>
              <button
                onClick={loadConversations}
                className="text-gray-600 hover:text-gray-800 text-sm"
                title="Actualiser depuis l'API"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              {/* 🔍 Bouton de diagnostic WebSocket */}
              <button
                onClick={() => setShowDiagnostic(!showDiagnostic)}
                className={`text-sm px-2 py-1 rounded-lg transition-colors ${
                  showDiagnostic 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Diagnostic WebSocket"
              >
                <FaBug className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* Indicateur de source des données */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>💾 Connexion à l'API de messagerie + Liste complète des patients</span>
            <span>🔄 Dernière vérification: {new Date().toLocaleTimeString('fr-FR')}</span>
          </div>
          
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <FaFilter className="w-4 h-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes</option>
              <option value="unread">Non lues</option>
              <option value="urgent">Urgentes</option>
              <option value="consultation">Consultations</option>
              <option value="ordonnance">Ordonnances</option>
              <option value="examen">Examens</option>
            </select>
          </div>
        </div>

        {/* 📨 Messages WebSocket en temps réel - Intégré dans la page principale */}
        {secureMessages && secureMessages.length > 0 && (
          <div className="p-4 border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-green-800 flex items-center">
                📨 Messages en temps réel - Ordonnance #15
                <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                  {secureMessages.length}
                </span>
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${secureConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {secureConnected ? '🔌 Connecté' : '❌ Déconnecté'}
                </span>
                {secureConversationId && (
                  <span className="px-2 py-2 bg-blue-500 text-white text-xs rounded-full">
                    #{secureConversationId}
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {secureMessages.slice(-4).map((msg, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-green-800 text-sm">
                          {msg.expediteur_info?.name || msg.expediteur_info?.nom || 'Patient'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp || msg.date_envoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-gray-700 text-sm line-clamp-2">
                        {msg.content || msg.contenu || 'Message sans contenu'}
                      </div>
                    </div>
                    <div className="ml-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Nouveau
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {secureMessages.length > 4 && (
              <div className="mt-3 text-center">
                <span className="text-xs text-gray-600">
                  💡 Affichage des 4 derniers messages sur {secureMessages.length} reçus
                </span>
              </div>
            )}
          </div>
        )}

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Vérification de l'API...</span>
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleOpenConversation(conversation)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors border-l-4 hover:bg-gray-50 ${getPriorityColor(conversation.priority)}`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar patient */}
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaUser className="w-5 h-5 text-green-600" />
                    </div>
                    
                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 truncate">
                          {conversation.patient?.nom || 'Patient'} {conversation.patient?.prenom || 'Inconnu'}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {conversation.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(conversation.lastActivity)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg">{getContextIcon(conversation.contextType)}</span>
                        <span className="text-sm text-gray-600">
                          {getContextName(conversation.contextType)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500">
                          #{conversation.contextId}
                        </span>
                      </div>
                      
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 mt-2 truncate">
                          <span className="font-medium">
                            {conversation.lastMessage.sender.type === 'patient' ? 'Patient:' : 
                             conversation.lastMessage.sender.type === 'medecin' ? 'Vous:' : 'Système:'}
                          </span>
                          {' '}{conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <FaComments className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Aucune conversation disponible</p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm || filterType !== 'all' 
                    ? 'Modifiez vos critères de recherche'
                    : 'Créez votre première conversation sécurisée'
                  }
                </p>
                {!searchTerm && filterType === 'all' && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowCreateConversation(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Créer une conversation
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

                 {/* Statistiques rapides */}
         <div className="p-4 border-t border-gray-200 bg-gray-50">
           <div className="grid grid-cols-5 gap-4 text-center">
             <div>
               <p className="text-lg font-semibold text-blue-600">{conversations.length}</p>
               <p className="text-xs text-gray-500">Total</p>
             </div>
             <div>
               <p className="text-lg font-semibold text-red-600">{newMessagesCount}</p>
               <p className="text-xs text-gray-500">Non lus</p>
             </div>
             <div>
               <p className="text-lg font-semibold text-green-600">
                 {secureMessages ? secureMessages.length : 0}
               </p>
               <p className="text-xs text-gray-500">WebSocket</p>
             </div>
             <div>
               <p className="text-lg font-semibold text-yellow-600">
                 {safeConversations.filter(c => c.priority === 'high').length}
               </p>
               <p className="text-xs text-gray-500">Urgents</p>
             </div>
             <div>
               <p className="text-lg font-semibold text-purple-600">
                 {safeConversations.filter(c => c.contextType === 'ordonnance').length}
               </p>
               <p className="text-xs text-gray-500">Ordonnances</p>
             </div>
           </div>
         </div>

         
      </div>

      {/* Modal de création de conversation */}
      {showCreateConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                         <h3 className="text-lg font-semibold mb-4">Créer une nouvelle conversation</h3>
             <p className="text-sm text-gray-600 mb-4">
               Sélectionnez un patient depuis la liste complète de la base de données pour démarrer une conversation sécurisée.
             </p>
              
            <form onSubmit={handleCreateConversation}>
                
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Patient *
                  </label>
                                     <button
                     type="button"
                     onClick={async () => {
                       console.log('🔄 Rafraîchissement manuel de la liste des patients...');
                       await loadBaseData();
                     }}
                     className="text-xs text-blue-600 hover:text-blue-800 underline"
                     title="Rafraîchir la liste complète des patients depuis l'API"
                   >
                     🔄 Rafraîchir depuis l'API
                   </button>
                </div>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un patient</option>
                  {patients && patients.length > 0 ? (
                    patients.map(patient => (
                      <option key={patient.id || patient.id_patient} value={patient.id || patient.id_patient}>
                        {patient.prenom || ''} {patient.nom || ''} (ID: {patient.id || patient.id_patient})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Aucun patient disponible
                    </option>
                  )}
                </select>
                
                                 {/* 🔍 DEBUG : Afficher les informations sur la liste des patients */}
                 <div className="mt-1 text-xs text-gray-500">
                   {patients && patients.length > 0 ? (
                     <span className="text-green-600">
                       ✅ {patients.length} patient(s) disponible(s) dans la base de données
                     </span>
                   ) : (
                     <span className="text-red-600">
                       ⚠️ Aucun patient chargé depuis l'API
                     </span>
                   )}
                 </div>
                 
                 {/* 🔍 DEBUG : Afficher la liste des patients en mode debug */}
                 {process.env.NODE_ENV === 'development' && patients && patients.length > 0 && (
                   <details className="mt-2 text-xs text-gray-600">
                     <summary className="cursor-pointer hover:text-gray-800">
                       🔍 Debug: Liste complète des patients ({patients.length})
                     </summary>
                     <div className="mt-1 p-2 bg-gray-100 rounded text-xs max-h-32 overflow-y-auto">
                       {patients.map((patient, index) => (
                         <div key={index} className="mb-1 p-1 bg-white rounded border">
                           <strong>Patient {index + 1}:</strong> {patient.prenom || ''} {patient.nom || ''} 
                           <br />
                           <span className="text-gray-600">
                             ID: {patient.id || patient.id_patient || 'N/A'} | 
                             Statut: {patient.statut || 'N/A'}
                           </span>
                         </div>
                       ))}
                     </div>
                   </details>
                 )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de la conversation *
                </label>
                <input
                  type="text"
                  value={newConversationTitle}
                  onChange={(e) => setNewConversationTitle(e.target.value)}
                  required
                  placeholder="Ex: Suivi consultation"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    // Permettre les espaces et caractères spéciaux
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                />
                {/* Indicateur de longueur et validation en temps réel */}
                <div className="mt-1 text-xs text-gray-500">
                  {newConversationTitle.length}/100 caractères
                  {newConversationTitle.trim().length === 0 && (
                    <span className="text-red-500 ml-2">Le titre ne peut pas être vide</span>
                  )}
                </div>
              </div>
            
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateConversation(false);
                    setNewConversationTitle('');
                    setSelectedPatientId('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de messagerie */}
      {showMessaging && selectedConversation && (
        <SecureMessaging
          contextType={selectedConversation.contextType}
          contextId={selectedConversation.contextId}
          medecinInfo={getCurrentMedecin()}
          isOpen={showMessaging}
          onClose={handleCloseMessaging}
        />
      )}

      {/* 🔍 Modal de diagnostic WebSocket */}
      {showDiagnostic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-5/6 mx-4 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Diagnostic WebSocket</h3>
              <button
                onClick={() => setShowDiagnostic(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <WebSocketDiagnostic />
            </div>
          </div>
        </div>
      )}

      
    </>
  );
};

export default MedecinMessaging;