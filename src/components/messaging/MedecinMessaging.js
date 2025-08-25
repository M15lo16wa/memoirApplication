// src/components/messaging/MedecinMessaging.js

import React, { useState, useEffect, useCallback } from 'react';
import { FaUser, FaSearch, FaComments, FaClock, FaCircle } from 'react-icons/fa';
import SecureMessaging from './SecureMessaging'; 
import messagingService from '../../services/api/messagingApi';
import useMessaging from '../../hooks/useMessaging';

const MedecinMessaging = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  
  const { isConnected: wsConnected } = useMessaging();

  const getCurrentMedecin = useCallback(() => {
    const medecinData = localStorage.getItem('medecin');
    try {
      return medecinData ? JSON.parse(medecinData) : null;
    } catch (e) {
      console.error("Erreur de parsing des données médecin du localStorage", e);
      return null;
    }
  }, []);

  const loadConversations = useCallback(async () => {
    const medecin = getCurrentMedecin();
    if (!medecin) {
      setError("Informations médecin non disponibles");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const convs = await messagingService.getMedecinConversations(
        medecin.id_professionnel || medecin.id
      );
      setConversations(convs);
    } catch (error) {
      console.error("❌ Erreur chargement conversations:", error);
      setError("Impossible de charger les conversations: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [getCurrentMedecin]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // S'abonner aux nouveaux messages pour rafraîchir la liste
  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      console.log('📬 Nouveau message reçu, mise à jour de la liste des conversations...');
      
      // Mettre à jour la conversation concernée dans la liste
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (Number(conv.id) === Number(newMessage.conversation_id || newMessage.conversationId)) {
            return {
              ...conv,
              lastMessage: {
                content: newMessage.content,
                timestamp: newMessage.timestamp,
                sender: { type: newMessage.sender?.type || 'unknown' }
              },
              lastActivity: newMessage.timestamp
            };
          }
          return conv;
        });
      });
    };

    const unsubscribe = messagingService.onNewMessage(handleNewMessage);
    return () => unsubscribe();
  }, []);

  const handleOpenConversation = (conversation) => {
    setSelectedConversation(conversation);
  };
  
  const handleCloseMessaging = () => {
    setSelectedConversation(null);
    // Optionnel: recharger les conversations pour mettre à jour les statuts "lu/non lu"
    loadConversations();
  };
  
  const filteredConversations = conversations.filter(conv => {
    const patientName = `${conv.patient?.prenom || ''} ${conv.patient?.nom || ''}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return patientName.includes(searchLower) || 
           conv.titre?.toLowerCase().includes(searchLower);
  });

  const formatLastActivity = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <FaComments className="mr-2 text-blue-600" />
                Messagerie Sécurisée
              </h3>
              <p className="text-sm text-gray-500">
                {conversations.length} conversation(s)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                  wsConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                <FaCircle className="w-2 h-2" />
                <span>{wsConnected ? 'En ligne' : 'Hors ligne'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par patient ou sujet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
            <button 
              onClick={loadConversations} 
              className="ml-2 text-red-600 hover:text-red-800 underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              Chargement des conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <FaComments className="mx-auto mb-3 text-3xl text-gray-300" />
              {searchTerm ? (
                <p>Aucune conversation ne correspond à votre recherche.</p>
              ) : (
                <div>
                  <p className="mb-2">Aucune conversation pour le moment.</p>
                  <p className="text-sm">Les nouvelles conversations apparaîtront ici automatiquement.</p>
                </div>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleOpenConversation(conv)}
                className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex items-center space-x-3"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUser className="text-blue-600 w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {conv.patient?.prenom} {conv.patient?.nom}
                    </h4>
                    <div className="flex items-center space-x-1 text-xs text-gray-500 flex-shrink-0 ml-2">
                      <FaClock className="w-3 h-3" />
                      <span>{formatLastActivity(conv.lastActivity)}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1 truncate font-medium">
                    {conv.titre || 'Conversation'}
                  </p>
                  
                  <p className="text-sm text-gray-500 truncate">
                    {conv.lastMessage?.content || 'Aucun message'}
                  </p>
                </div>
                
                {/* Indicateur de nouveaux messages (optionnel) */}
                <div className="flex-shrink-0">
                  {/* Vous pouvez ajouter ici un badge pour les messages non lus */}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de messagerie */}
      {selectedConversation && (
        <SecureMessaging
          conversationId={selectedConversation.id} 
          isOpen={!!selectedConversation}
          onClose={handleCloseMessaging}
          contextType={selectedConversation.contextType}
          contextId={selectedConversation.contextId}
        />
      )}
    </>
  );
};

export default MedecinMessaging;