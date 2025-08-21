import React, { useState, useEffect, useCallback } from 'react';
import { FaComments, FaUser, FaCalendarAlt, FaClock, FaReply, FaEye, FaBell, FaSearch, FaFilter, FaPlus } from 'react-icons/fa';
import SecureMessaging from './SecureMessaging';
import messagingService from '../../services/api/messagingApi';
import { getPatients } from '../../services/api/patientApi';
import { getAllConsultations } from '../../services/api/medicalApi';

const MedecinMessaging = () => {
  const [conversations, setConversations] = useState([]);
  
  // S'assurer que conversations est toujours un tableau
  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, unread, urgent, ordonnance, examen, consultation
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [showCreateConversation, setShowCreateConversation] = useState(false);
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedContext, setSelectedContext] = useState('consultation');
  const [selectedContextId, setSelectedContextId] = useState('');

  // Récupérer le médecin connecté
  const getCurrentMedecin = useCallback(() => {
    const medecinData = localStorage.getItem('medecin');
    return medecinData ? JSON.parse(medecinData) : null;
  }, []);

     // Charger les données de base
   const loadBaseData = useCallback(async () => {
    try {
      setLoading(true);
             console.log('🔄 Chargement des données de base...');
      
      // Charger les patients
      const patientsData = await getPatients();
      console.log('👥 Patients chargés:', patientsData?.length || 0);
      if (patientsData && Array.isArray(patientsData)) {
        setPatients(patientsData);
        // Stocker dans localStorage pour utilisation ultérieure
        localStorage.setItem('patients_data', JSON.stringify(patientsData));
        console.log('✅ Patients sauvegardés dans localStorage');
      } else {
        console.warn('⚠️ Aucun patient chargé ou données invalides');
      }
      
             // Charger les consultations (pour référence future)
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
      
      // Essayer de récupérer depuis l'API de messagerie
      try {
        const apiConversations = await messagingService.getMedecinConversations(medecinId);
        if (apiConversations && Array.isArray(apiConversations) && apiConversations.length > 0) {
          console.log('✅ Conversations récupérées depuis l\'API:', apiConversations.length);
          setConversations(apiConversations);
          
          // Compter les messages non lus
          const totalUnread = apiConversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
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

    // Créer une nouvelle conversation
  const createNewConversation = async () => {
    try {
      if (!selectedPatient || !selectedContextId) {
        alert('Veuillez sélectionner un patient et un contexte');
        return;
      }

      const medecin = getCurrentMedecin();
      if (!medecin) return;

      const medecinId = medecin.id_professionnel || medecin.id;
      
      console.log('🔍 Debug - Données sélectionnées:', {
        selectedPatient,
        selectedContextId,
        patientsCount: patients.length
      });
      
      // Trouver le patient sélectionné
      const selectedPatientData = patients.find(p => 
        (p.id || p.id_patient) == selectedPatient ||
        (p.id || p.id_patient) === parseInt(selectedPatient) ||
        (p.id || p.id_patient) === selectedPatient.toString()
      );
      
      if (!selectedPatientData) {
        alert('Patient introuvable. Vérifiez que les données sont chargées.');
        return;
      }

      // Créer la conversation via l'API de messagerie
      console.log('🔄 Création de la conversation via l\'API...');
      const newConversation = await messagingService.createConversationFromContext(
        selectedContext,
        selectedContextId,
        selectedPatient,
        medecinId
      );
      
      console.log('✅ Conversation créée via l\'API:', newConversation);

      // Fermer le modal
      setShowCreateConversation(false);
      setSelectedPatient('');
      setSelectedContext('consultation');
      setSelectedContextId('');

      // Recharger les vraies conversations depuis l'API
      console.log('🔄 Rechargement des conversations après création...');
      await loadConversations();
      
      alert('Conversation créée avec succès !');
       
     } catch (error) {
       console.error('Erreur lors de la création de la conversation:', error);
       alert('Erreur lors de la création de la conversation');
     }
   };

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
    setSelectedConversation(conversation);
    setShowMessaging(true);
  };

  // Fermer la messagerie
  const handleCloseMessaging = () => {
    setShowMessaging(false);
    setSelectedConversation(null);
    // Pas besoin de recharger car les conversations sont basées sur les vraies consultations
  };

  // Marquer toutes les conversations comme lues
  const markAllAsRead = async () => {
    try {
      const medecin = getCurrentMedecin();
      if (!medecin) return;

      const medecinId = medecin.id_professionnel || medecin.id;
      
      // Pour les vraies consultations, pas besoin d'appeler l'API
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
        return '💬';
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
     
     // Recharger périodiquement (plus fréquent quand il n'y a pas de conversations)
     const interval = setInterval(loadConversations, 30000); // Toutes les 30 secondes
     
     return () => clearInterval(interval);
   }, [loadConversations]);

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
                   <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                     API
                   </span>
                 </p>
               </div>
            </div>
            
            <div className="flex items-center space-x-2">
                             <button
                 onClick={() => setShowCreateConversation(true)}
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
            </div>
          </div>
        </div>

                 {/* Barre de recherche et filtres */}
         <div className="p-4 border-b border-gray-200 space-y-3">
           {/* Indicateur de source des données */}
           <div className="flex items-center justify-between text-xs text-gray-500">
             <span>💾 Connexion à l'API de messagerie</span>
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
                           {conversation.consultation?.motif || 'Consultation'}
                         </span>
                       </div>
                      
                                             {conversation.lastMessage && (
                         <p className="text-sm text-gray-600 mt-2 truncate">
                           <span className="font-medium">
                             {conversation.lastMessage.sender.type === 'system' ? 'Système:' : 'Consultation:'}
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
                   <button
                     onClick={() => setShowCreateConversation(true)}
                     className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                   >
                     Créer une conversation
                   </button>
                 )}
               </div>
             </div>
          )}
        </div>

                 {/* Statistiques rapides */}
         <div className="p-4 border-t border-gray-200 bg-gray-50">
           <div className="grid grid-cols-4 gap-4 text-center">
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
             
                           {loading && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                  ⏳ Chargement des patients en cours...
                </div>
              )}
             
                           {!loading && patients.length === 0 && (
                <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                  ⚠️ Aucun patient disponible. 
                  <button 
                    onClick={loadBaseData}
                    className="ml-2 underline hover:no-underline"
                  >
                    Cliquez ici pour recharger
                  </button>
                </div>
              )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.map(patient => (
                    <option key={patient.id || patient.id_patient} value={patient.id || patient.id_patient}>
                      {patient.nom} {patient.prenom}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de contexte
                </label>
                <select
                  value={selectedContext}
                  onChange={(e) => setSelectedContext(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="consultation">Consultation</option>
                  <option value="ordonnance">Ordonnance</option>
                  <option value="examen">Examen</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID du contexte
                </label>
                <input
                  type="text"
                  value={selectedContextId}
                  onChange={(e) => setSelectedContextId(e.target.value)}
                  placeholder="ID de la consultation/ordonnance/examen"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
                             <button
                 onClick={createNewConversation}
                 disabled={!selectedPatient || !selectedContextId || patients.length === 0}
                 className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Créer Conversation
               </button>
              <button
                onClick={() => setShowCreateConversation(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de messagerie */}
      {showMessaging && selectedConversation && (
        <SecureMessaging
          contextType={selectedConversation.contextType}
          contextId={selectedConversation.contextId}
          isOpen={showMessaging}
          onClose={handleCloseMessaging}
        />
      )}
    </>
  );
};

export default MedecinMessaging;
