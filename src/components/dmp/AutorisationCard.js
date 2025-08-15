import React, { useState } from 'react';
import { FaUser, FaClock, FaCheck, FaTimes, FaEye, FaCalendar } from 'react-icons/fa';
import { accepterAutorisation, refuserAutorisation, revokerAutorisation } from '../../services/api/dmpApi';

const AutorisationCard = ({ autorisation, onUpdate }) => {
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [commentaire, setCommentaire] = useState('');
  const [raisonRefus, setRaisonRefus] = useState('');
  const [raisonRevocation, setRaisonRevocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccept = () => {
    setActionType('accept');
    setShowActionModal(true);
  };

  const handleRefuse = () => {
    setActionType('refuse');
    setShowActionModal(true);
  };

  const handleRevoke = () => {
    setActionType('revoke');
    setShowActionModal(true);
  };

  const handleConfirmAction = async () => {
    try {
      setLoading(true);
      
      if (actionType === 'accept') {
        console.log('🔍 AutorisationCard: Appel de accepterAutorisation...');
        console.log('🔍 AutorisationCard: ID:', autorisation.id_acces || autorisation.id_acces_autorisation);
        console.log('🔍 AutorisationCard: Commentaire:', commentaire);
        await accepterAutorisation(autorisation.id_acces || autorisation.id_acces_autorisation, commentaire);
        alert('Autorisation acceptée avec succès');
      } else if (actionType === 'refuse') {
        if (!raisonRefus.trim()) {
          alert('Veuillez indiquer une raison de refus');
          return;
        }
        await refuserAutorisation(autorisation.id_acces || autorisation.id_acces_autorisation, raisonRefus);
        alert('Autorisation refusée');
      } else if (actionType === 'revoke') {
        if (!raisonRevocation.trim()) {
          alert('Veuillez indiquer une raison de révocation');
          return;
        }
        await revokerAutorisation(autorisation.id_acces || autorisation.id_acces_autorisation, raisonRevocation);
        alert('Accès révoqué avec succès');
      }
      
      // Notifier le composant parent pour recharger la liste
      if (onUpdate) {
        onUpdate();
      }
      
      // Fermer le modal
      setShowActionModal(false);
      setCommentaire('');
      setRaisonRefus('');
      setRaisonRevocation('');
      setActionType(null);
      
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
      alert(`Erreur lors de l'action: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, autorisation) => {
    // Gérer les demandes d'accès sans statut
    if (!status && autorisation.id_notification && autorisation.id_acces_autorisation) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <FaClock className="w-3 h-3 mr-1" />
        En attente
      </span>;
    }
    
    switch (status) {
      case 'attente_validation':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FaClock className="w-3 h-3 mr-1" />
          En attente
        </span>;
      case 'actif':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheck className="w-3 h-3 mr-1" />
          Actif
        </span>;
      case 'refuse':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FaTimes className="w-3 h-3 mr-1" />
          Refusé
        </span>;
      case 'expire':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <FaClock className="w-3 h-3 mr-1" />
          Expiré
        </span>;
      case 'revoke':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FaTimes className="w-3 h-3 mr-1" />
          Révoqué
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* En-tête avec statut */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FaUser className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Dr. {autorisation.professionnel?.prenom || autorisation.professionnelDemandeur?.prenom || 'Prénom'} {autorisation.professionnel?.nom || autorisation.professionnelDemandeur?.nom || 'Nom'}
              </h3>
              <p className="text-sm text-gray-600">
                {autorisation.professionnel?.specialite || autorisation.professionnelDemandeur?.specialite || 'Spécialité non définie'}
              </p>
            </div>
          </div>
          {getStatusBadge(autorisation.statut, autorisation)}
        </div>

        {/* Informations de la demande */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Type d'accès</h4>
            <p className="text-sm text-gray-900">{getTypeAccesLabel(autorisation.type_acces)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Durée demandée</h4>
            <p className="text-sm text-gray-900">{autorisation.duree_demandee || autorisation.duree || 'Non définie'} minutes</p>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Raison de la demande</h4>
            <p className="text-sm text-gray-900">{autorisation.raison_demande || 'Non spécifiée'}</p>
          </div>
        </div>

        {/* Date de création */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <FaCalendar className="w-4 h-4 mr-2" />
          Demande créée le {new Date(autorisation.date_creation).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        {/* Actions pour les demandes en attente */}
        {(autorisation.statut === 'attente_validation' || 
          (autorisation.id_notification && autorisation.id_acces_autorisation && !autorisation.statut)) && (
          <div className="flex space-x-3">
            <button
              onClick={handleAccept}
              className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <FaCheck className="w-4 h-4 mr-2" />
              Accepter
            </button>
            <button
              onClick={handleRefuse}
              className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              <FaTimes className="w-4 h-4 mr-2" />
              Refuser
            </button>
          </div>
        )}

        {/* Informations supplémentaires pour les autorisations actives */}
        {autorisation.statut === 'actif' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-800">
                <FaEye className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Accès actif</span>
              </div>
              <button
                onClick={handleRevoke}
                className="flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors shadow-sm"
              >
                <FaTimes className="w-3 h-3 mr-1" />
                Révoquer
              </button>
            </div>
            {autorisation.date_expiration && (
              <p className="text-xs text-green-700 mt-1">
                Expire le {new Date(autorisation.date_expiration).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal pour les actions */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionType === 'accept' ? 'Accepter la demande' : 
               actionType === 'refuse' ? 'Refuser la demande' : 
               'Révoquer l\'accès'}
            </h3>
            
            {actionType === 'accept' ? (
              <div className="mb-4">
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
            ) : actionType === 'refuse' ? (
              <div className="mb-4">
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
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de la révocation *
                </label>
                <textarea
                  value={raisonRevocation}
                  onChange={(e) => setRaisonRevocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="3"
                  placeholder="Indiquez la raison de la révocation..."
                  required
                />
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setCommentaire('');
                  setRaisonRefus('');
                  setRaisonRevocation('');
                  setActionType(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={loading || 
                  (actionType === 'refuse' && !raisonRefus.trim()) ||
                  (actionType === 'revoke' && !raisonRevocation.trim())
                }
                className={`flex-1 px-4 py-2 text-white rounded-md ${
                  actionType === 'accept' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Traitement...' : 
                 actionType === 'accept' ? 'Accepter' : 
                 actionType === 'refuse' ? 'Refuser' : 
                 'Révoquer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutorisationCard;
