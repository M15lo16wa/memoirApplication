// src/components/webrtc/ConferenceCard.jsx
import React from 'react';

/**
 * Composant de carte de conférence
 * Affiche les informations d'une conférence dans la liste
 */
const ConferenceCard = ({ 
  conference, 
  userType, 
  onJoinConference, 
  onViewDetails 
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'initiated': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'initiated': return 'En attente';
      case 'ended': return 'Terminée';
      default: return 'Inconnu';
    }
  };

  const canJoin = conference.status === 'active' || conference.status === 'initiated';

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-semibold text-gray-800">
              Conférence {conference.conference_code}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conference.status)}`}>
              {getStatusText(conference.status)}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Type:</strong> {conference.session_type || 'Consultation'}
            </p>
            <p>
              <strong>Créée le:</strong> {formatDate(conference.createdAt)}
            </p>
            {conference.expires_at && (
              <p>
                <strong>Expire le:</strong> {formatDate(conference.expires_at)}
              </p>
            )}
            {userType === 'medecin' && conference.patient_id && (
              <p>
                <strong>Patient:</strong> ID {conference.patient_id}
              </p>
            )}
            {userType === 'patient' && conference.professionnel_id && (
              <p>
                <strong>Médecin:</strong> ID {conference.professionnel_id}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canJoin ? (
            <button
              onClick={() => onJoinConference(conference)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Rejoindre
            </button>
          ) : (
            <span className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
              Terminée
            </span>
          )}
          
          <button
            onClick={() => onViewDetails(conference)}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Voir les détails"
          >
            👁️
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConferenceCard;