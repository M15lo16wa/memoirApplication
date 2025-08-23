// src/components/messaging/MedecinMessaging.js

import React, { useState, useEffect, useCallback } from 'react';
import { FaComments, FaUser, FaSearch, FaFilter, FaPlus, FaEye } from 'react-icons/fa';
import SecureMessaging from './SecureMessaging';
import messagingService from '../../services/api/messagingApi';
import { getPatients } from '../../services/api/patientApi';
import useMessaging from '../../hooks/useMessaging';

const MedecinMessaging = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { isConnected: wsConnected } = useMessaging();

  const getCurrentMedecin = useCallback(() => {
    const medecinData = localStorage.getItem('medecin');
    return medecinData ? JSON.parse(medecinData) : null;
  }, []);

  const loadConversations = useCallback(async () => {
    const medecin = getCurrentMedecin();
    if (!medecin) return;
    
    setLoading(true);
    try {
      const convs = await messagingService.getMedecinConversations(medecin.id_professionnel || medecin.id);
      setConversations(convs);
    } catch (error) {
      console.error("❌ Erreur chargement conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [getCurrentMedecin]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // S'abonner aux nouveaux messages pour rafraîchir la liste
  useEffect(() => {
    const unsubscribe = messagingService.onNewMessage((newMessage) => {
      console.log('📬 Un nouveau message est arrivé, rafraîchissement de la liste...');
      loadConversations();
    });
    return unsubscribe;
  }, [loadConversations]);

  const handleOpenConversation = (conversation) => {
    setSelectedConversation(conversation);
  };
  
  const handleCloseMessaging = () => {
    setSelectedConversation(null);
    loadConversations(); // Recharger au cas où des messages ont été lus
  };
  
  const filteredConversations = conversations.filter(conv => {
    const patientName = `${conv.patient?.prenom || ''} ${conv.patient?.nom || ''}`.toLowerCase();
    return patientName.includes(searchTerm.toLowerCase());
  });

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Messagerie Sécurisée</h3>
              <p className="text-sm text-gray-500">{conversations.length} conversation(s)</p>
            </div>
            <div className={`p-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} title={wsConnected ? 'Connecté en temps réel' : 'Déconnecté du temps réel'}></div>
        </div>

        {/* Barre de recherche */}
        <div className="p-4 border-b">
            <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                    type="text"
                    placeholder="Rechercher par patient..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
            </div>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center p-8">Chargement...</div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleOpenConversation(conv)}
                className="p-4 border-b cursor-pointer hover:bg-gray-50 flex items-start space-x-3"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaUser className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                        <p className="font-semibold truncate">{conv.patient.prenom} {conv.patient.nom}</p>
                        <p className="text-xs text-gray-500">{new Date(conv.lastActivity).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{conv.lastMessage?.content || 'Aucun message'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de messagerie */}
      {selectedConversation && (
        <SecureMessaging
          contextType={selectedConversation.contextType}
          contextId={selectedConversation.contextId}
          medecinInfo={getCurrentMedecin()}
          isOpen={!!selectedConversation}
          onClose={handleCloseMessaging}
        />
      )}
    </>
  );
};

export default MedecinMessaging;
