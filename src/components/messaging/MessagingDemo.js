import React, { useState, useEffect } from 'react';
import { FaComments, FaUser, FaPlus, FaTrash, FaEye } from 'react-icons/fa';
import { getPatients } from '../../services/api/patientApi';
import { getAllConsultations } from '../../services/api/medicalApi';
import messagingService from '../../services/api/messagingApi';

const MessagingDemo = () => {
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Récupérer le médecin connecté
  const getCurrentMedecin = () => {
    const medecinData = localStorage.getItem('medecin');
    return medecinData ? JSON.parse(medecinData) : null;
  };

  // Charger les données de base
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger les patients
        const patientsData = await getPatients();
        if (patientsData && Array.isArray(patientsData)) {
          setPatients(patientsData);
          localStorage.setItem('patients_data', JSON.stringify(patientsData));
        }
        
        // Charger les consultations
        const consultationsData = await getAllConsultations();
        if (consultationsData && Array.isArray(consultationsData)) {
          setConsultations(consultationsData);
        }
        
        // Charger les conversations existantes
        await loadConversations();
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Charger les conversations
  const loadConversations = async () => {
    try {
      const medecin = getCurrentMedecin();
      if (!medecin) {
        return;
      }

      const medecinId = medecin.id_professionnel || medecin.id;
      const conversationsData = await messagingService.getMedecinConversations(medecinId);
      setConversations(conversationsData);
      
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    }
  };

  // Créer une conversation de démonstration
  const createDemoConversation = async () => {
    try {
      if (!selectedPatient || !selectedConsultation) {
        alert('Veuillez sélectionner un patient et une consultation');
        return;
      }

      const medecin = getCurrentMedecin();
      if (!medecin) {
        return;
      }

      const medecinId = medecin.id_professionnel || medecin.id;
      const consultation = consultations.find(c => c.id == selectedConsultation);
      const patient = patients.find(p => (p.id || p.id_patient) == selectedPatient);

      if (!consultation || !patient) {
        alert('Données invalides');
        return;
      }

      // Créer la session de messagerie
      const session = await messagingService.createConversationFromContext(
        'consultation',
        consultation.id,
        patient.id || patient.id_patient,
        medecinId
      );

      // Créer des messages de démonstration
      const demoMessages = [
        {
          id: `demo_1_${Date.now()}`,
          content: `Bonjour Dr. ${medecin.nom}, j'ai une question concernant ma consultation du ${new Date(consultation.date_consultation || Date.now()).toLocaleDateString('fr-FR')}`,
          type: 'text',
          sender: {
            id: patient.id || patient.id_patient,
            type: 'patient',
            name: `${patient.prenom} ${patient.nom}`
          },
          recipient: {
            id: medecinId,
            type: 'medecin',
            name: `Dr. ${medecin.nom || 'Médecin'}`
          },
          context: {
            type: 'consultation',
            id: consultation.id
          },
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1h ago
          status: 'sent',
          lu: false
        },
        {
          id: `demo_2_${Date.now()}`,
          content: `Bonjour ${patient.prenom}, je suis à votre disposition pour répondre à vos questions. Comment puis-je vous aider ?`,
          type: 'text',
          sender: {
            id: medecinId,
            type: 'medecin',
            name: `Dr. ${medecin.nom || 'Médecin'}`
          },
          recipient: {
            id: patient.id || patient.id_patient,
            type: 'patient',
            name: `${patient.prenom} ${patient.nom}`
          },
          context: {
            type: 'consultation',
            id: consultation.id
          },
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30min ago
          status: 'read',
          lu: true
        }
      ];

      // Sauvegarder dans localStorage
      const sessionKey = `messages_session_consultation_${consultation.id}_${patient.id || patient.id_patient}_${medecinId}`;
      localStorage.setItem(sessionKey, JSON.stringify(demoMessages));

      // Recharger les conversations
      await loadConversations();
      
      // Fermer le formulaire
      setShowCreateForm(false);
      setSelectedPatient('');
      setSelectedConsultation('');

      alert('Conversation de démonstration créée avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      alert('Erreur lors de la création de la conversation');
    }
  };

  // Supprimer une conversation
  const deleteConversation = async (conversationId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      try {
        // Supprimer via l'API
        await messagingService.deleteMessage(conversationId);
      } catch (apiError) {
        console.log('Suppression API échouée, suppression locale uniquement');
      }

      // Supprimer du localStorage
      const sessionKey = `messages_${conversationId}`;
      localStorage.removeItem(sessionKey);

      // Recharger les conversations
      await loadConversations();
      
      alert('Conversation supprimée');
    }
  };

  // Voir les messages d'une conversation
  const viewConversation = (conversationId) => {
    const sessionKey = `messages_${conversationId}`;
    const messages = JSON.parse(localStorage.getItem(sessionKey) || '[]');
    
    if (messages.length > 0) {
      console.log('Messages de la conversation:', messages);
      alert(`Conversation avec ${messages.length} message(s). Vérifiez la console pour voir les détails.`);
    } else {
      alert('Aucun message dans cette conversation');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Démo Messagerie</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <FaPlus className="w-4 h-4" />
          <span>Créer Conversation</span>
        </button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Créer une conversation de démonstration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Consultation
              </label>
              <select
                value={selectedConsultation}
                onChange={(e) => setSelectedConsultation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner une consultation</option>
                {consultations.map(consultation => (
                  <option key={consultation.id} value={consultation.id}>
                    Consultation #{consultation.id} - {new Date(consultation.date_consultation || Date.now()).toLocaleDateString('fr-FR')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-4">
            <button
              onClick={createDemoConversation}
              disabled={!selectedPatient || !selectedConsultation}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Créer la conversation
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des conversations */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Conversations existantes</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <span className="text-gray-600">Chargement...</span>
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <div key={conversation.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaComments className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {conversation.patient?.nom || 'Patient'} {conversation.patient?.prenom || 'Inconnu'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {conversation.contextType} #{conversation.contextId} • {conversation.messageCount} message(s)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {conversation.unreadCount} non lu(s)
                      </span>
                    )}
                    <button
                      onClick={() => viewConversation(conversation.id)}
                      className="text-blue-600 hover:text-blue-800 p-2"
                      title="Voir les messages"
                    >
                      <FaEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteConversation(conversation.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Supprimer"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaComments className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>Aucune conversation trouvée</p>
            <p className="text-sm">Créez votre première conversation de démonstration</p>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Statistiques</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{patients.length}</p>
            <p className="text-sm text-gray-600">Patients</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{consultations.length}</p>
            <p className="text-sm text-gray-600">Consultations</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{conversations.length}</p>
            <p className="text-sm text-gray-600">Conversations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingDemo;
