import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaCheck, FaTimes, FaClock, FaEye, FaUser, 
  FaCalendar, FaFileMedical, FaBell
} from 'react-icons/fa';
import { getAutorisations, accepterAutorisation, refuserAutorisation } from '../../services/api/dmpApi';

const AutorisationsList = ({ patientId = null, onUpdate }) => {
  const [autorisations, setAutorisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAutorisation, setSelectedAutorisation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [commentaire, setCommentaire] = useState('');
  const [raisonRefus, setRaisonRefus] = useState('');

  useEffect(() => {
    console.log('🔄 AutorisationsList: Chargement des autorisations...');
    loadAutorisations();
  }, [loadAutorisations]);

  const loadAutorisations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 AutorisationsList: Appel API getAutorisations...');
      const result = await getAutorisations(patientId);
      console.log('✅ AutorisationsList: Réponse API reçue:', result);

      const extractList = (payload) => {
        if (Array.isArray(payload)) {
          return payload;
        }
        if (Array.isArray(payload?.autorisations)) {
          return payload.autorisations;
        }
        if (Array.isArray(payload?.authorizations)) {
          return payload.authorizations;
        }
        if (Array.isArray(payload?.data?.autorisations)) {
          return payload.data.autorisations;
        }
        if (Array.isArray(payload?.data?.authorizations)) {
          return payload.data.authorizations;
        }
        if (Array.isArray(payload?.data)) {
          return payload.data;
        }
        if (Array.isArray(payload?.data?.data)) {
          return payload.data.data;
        }
        return [];
      };

      const autorisationsRaw = extractList(result?.data ?? result);
      const autorisationsData = (autorisationsRaw || []).map((a) => ({
        ...a,
        professionnel: a.professionnel || a.professionnelDemandeur || a.professionnel_demandeur || a.demandeur || a.professional || {},
        date_creation: a.date_creation || a.createdAt || a.date_debut || a.date_validation || a.updatedAt,
      }));

      console.log('📋 AutorisationsList: Données normalisées:', autorisationsData);
      setAutorisations(autorisationsData);
    } catch (error) {
      console.error('❌ AutorisationsList: Erreur lors du chargement des autorisations:', error);
      setError(`Erreur lors du chargement des autorisations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const handleAccept = async (autorisationId) => {
    console.log('✅ AutorisationsList: Tentative d\'acceptation pour ID:', autorisationId);
    setSelectedAutorisation(autorisations.find(a => a.id_acces === autorisationId));
    setActionType('accept');
    setShowActionModal(true);
  };

  const handleRefuse = async (autorisationId) => {
    console.log('❌ AutorisationsList: Tentative de refus pour ID:', autorisationId);
    setSelectedAutorisation(autorisations.find(a => a.id_acces === autorisationId));
    setActionType('refuse');
    setShowActionModal(true);
  };

  const handleConfirmAction = async () => {
    try {
      console.log('🔄 AutorisationsList: Confirmation d\'action:', actionType);
      
      if (actionType === 'accept') {
        await accepterAutorisation(selectedAutorisation.id_acces, commentaire);
        alert('Autorisation acceptée avec succès');
      } else if (actionType === 'refuse') {
        if (!raisonRefus.trim()) {
          alert('Veuillez indiquer une raison de refus');
          return;
        }
        await refuserAutorisation(selectedAutorisation.id_acces, raisonRefus);
        alert('Autorisation refusée');
      }
      
      // Recharger la liste
      await loadAutorisations();
      
      // Fermer le modal
      setShowActionModal(false);
      setSelectedAutorisation(null);
      setActionType(null);
      setCommentaire('');
      setRaisonRefus('');
      
      // Notifier le composant parent
      if (onUpdate) {
        console.log('🔄 AutorisationsList: Notification au composant parent');
        onUpdate();
      }
    } catch (error) {
      console.error('❌ AutorisationsList: Erreur lors de l\'action:', error);
      alert(`Erreur lors de l'action: ${error.message}`);
    }
  };

  const handleVoirDetails = (autorisation) => {
    console.log('👁️ AutorisationsList: Affichage des détails pour:', autorisation);
    setSelectedAutorisation(autorisation);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'en_attente':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FaClock className="mr-1" />
          En attente
        </span>;
      case 'acceptee':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheck className="mr-1" />
          Acceptée
        </span>;
      case 'refusee':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FaTimes className="mr-1" />
          Refusée
        </span>;
      case 'expiree':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <FaClock className="mr-1" />
          Expirée
        </span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status || 'Inconnu'}
        </span>;
    }
  };

  const getTypeAccesLabel = (type) => {
    switch (type) {
      case 'lecture':
        return 'Lecture seule';
      case 'ecriture':
        return 'Lecture et écriture';
      case 'administration':
        return 'Administration complète';
      default:
        return type || 'Non défini';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Chargement des autorisations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaBell className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erreur</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button 
              onClick={loadAutorisations}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('📊 AutorisationsList: Rendu avec', autorisations.length, 'autorisations');

  const testAPI = async () => {
    try {
      console.log('🧪 AutorisationsList: Test de l\'API...');
      const result = await getAutorisations(patientId);
      console.log('✅ AutorisationsList: Test API réussi:', result);
      alert('Test API réussi ! Vérifiez la console pour les détails.');
    } catch (error) {
      console.error('❌ AutorisationsList: Test API échoué:', error);
      alert(`Test API échoué: ${error.message}`);
    }
  };

  return (
    <div>
      {/* Bouton de test API */}
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Mode Debug</h4>
            <p className="text-xs text-yellow-700">Testez la connexion API</p>
          </div>
          <button
            onClick={testAPI}
            className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
          >
            Tester API
          </button>
        </div>
      </div>

      {autorisations.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaFileMedical className="text-gray-400 text-xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune autorisation</h3>
          <p className="text-gray-600">Aucune demande d'accès en attente ou autorisation active.</p>
          <button 
            onClick={loadAutorisations}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Actualiser
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {autorisations.map((autorisation) => (
            <div key={autorisation.id_acces} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaUser className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Dr. {autorisation.professionnel?.nom || 'Nom'} {autorisation.professionnel?.prenom || 'Prénom'}
                    </h4>
                    <p className="text-sm text-gray-600">{autorisation.professionnel?.specialite || 'Spécialité non définie'}</p>
                    <p className="text-sm text-gray-500">
                      Type d'accès: {getTypeAccesLabel(autorisation.type_acces)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Durée: {autorisation.duree || 'Non définie'} minutes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusBadge(autorisation.statut)}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleVoirDetails(autorisation)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Voir les détails"
                    >
                      <FaEye className="w-4 h-4" />
                    </button>
                    
                    {autorisation.statut === 'en_attente' && (
                      <>
                        <button
                          onClick={() => handleAccept(autorisation.id_acces)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          title="Accepter l'accès"
                        >
                          <FaCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRefuse(autorisation.id_acces)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Refuser l'accès"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {autorisation.raison_demande && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Raison de la demande:</span> {autorisation.raison_demande}
                  </p>
                </div>
              )}
              
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>
                  <FaCalendar className="inline mr-1" />
                  Demande reçue le {new Date(autorisation.date_creation).toLocaleDateString('fr-FR')}
                </span>
                {autorisation.date_reponse && (
                  <span>
                    Réponse le {new Date(autorisation.date_reponse).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de détails */}
      {showDetailsModal && selectedAutorisation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Détails de l'autorisation</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Professionnel de santé</h4>
                <p className="text-gray-700">
                  Dr. {selectedAutorisation.professionnel?.prenom || 'Prénom'} {selectedAutorisation.professionnel?.nom || 'Nom'}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedAutorisation.professionnel?.specialite || 'Spécialité non définie'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Type d'accès</h4>
                <p className="text-gray-700">{getTypeAccesLabel(selectedAutorisation.type_acces)}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Durée demandée</h4>
                <p className="text-gray-700">{selectedAutorisation.duree || 'Non définie'} minutes</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Raison de la demande</h4>
                <p className="text-gray-700">{selectedAutorisation.raison_demande || 'Non spécifiée'}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Statut</h4>
                <div className="flex items-center">
                  {getStatusBadge(selectedAutorisation.statut)}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Dates</h4>
                <p className="text-sm text-gray-600">
                  Demande reçue: {new Date(selectedAutorisation.date_creation).toLocaleString('fr-FR')}
                </p>
                {selectedAutorisation.date_reponse && (
                  <p className="text-sm text-gray-600">
                    Réponse: {new Date(selectedAutorisation.date_reponse).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>
              
              {selectedAutorisation.commentaire_reponse && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Commentaire de réponse</h4>
                  <p className="text-gray-700">{selectedAutorisation.commentaire_reponse}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'action (accepter/refuser) */}
      {showActionModal && selectedAutorisation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {actionType === 'accept' ? 'Accepter l\'accès' : 'Refuser l\'accès'}
              </h3>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedAutorisation(null);
                  setActionType(null);
                  setCommentaire('');
                  setRaisonRefus('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-4">
                {actionType === 'accept' 
                  ? 'Vous êtes sur le point d\'autoriser l\'accès à votre DMP pour ce professionnel de santé.'
                  : 'Vous êtes sur le point de refuser l\'accès à votre DMP pour ce professionnel de santé.'
                }
              </p>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Professionnel: Dr. {selectedAutorisation.professionnel?.prenom || 'Prénom'} {selectedAutorisation.professionnel?.nom || 'Nom'}
                </p>
                <p className="text-sm text-gray-600">
                  Type d'accès: {getTypeAccesLabel(selectedAutorisation.type_acces)}
                </p>
                <p className="text-sm text-gray-600">
                  Durée: {selectedAutorisation.duree || 'Non définie'} minutes
                </p>
              </div>
              
              {actionType === 'accept' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Ajouter un commentaire..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison du refus *
                  </label>
                  <textarea
                    value={raisonRefus}
                    onChange={(e) => setRaisonRefus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="3"
                    placeholder="Indiquez la raison du refus..."
                    required
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedAutorisation(null);
                  setActionType(null);
                  setCommentaire('');
                  setRaisonRefus('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-white rounded-md ${
                  actionType === 'accept' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionType === 'accept' ? 'Accepter' : 'Refuser'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutorisationsList;
