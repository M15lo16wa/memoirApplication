import React, { useState, useEffect, useCallback } from 'react';
import { getDMPAccessHistory } from '../../services/api/dmpApi';

function DMPHistory({ patientId = null }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getDMPAccessHistory(patientId);
      setHistory(data.data || data || []);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique DMP:', error);
      setError('Impossible de charger l\'historique des accès DMP');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getModeLabel = (mode) => {
    switch (mode) {
      case 'autorise_par_patient':
        return 'Autorisé par patient';
      case 'urgence':
        return 'Mode urgence';
      case 'connexion_secrete':
        return 'Connexion secrète';
      default:
        return mode;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-gray-600">Chargement de l'historique...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Erreur</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={loadHistory}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Historique des accès DMP
        </h3>
        <button
          onClick={loadHistory}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Actualiser
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun historique</h3>
          <p className="mt-1 text-sm text-gray-500">
            Aucun accès DMP n'a été enregistré pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={entry.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.statut)}`}>
                      {entry.statut === 'active' ? 'Actif' :
                       entry.statut === 'expired' ? 'Expiré' :
                       entry.statut === 'pending' ? 'En attente' : entry.statut}
                    </span>
                    <span className="text-sm text-gray-500">
                      {getModeLabel(entry.mode_acces)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Médecin:</span> {entry.medecin?.nom || 'Dr. Inconnu'}</p>
                    <p><span className="font-medium">Patient:</span> {entry.patient?.nom || 'Patient inconnu'}</p>
                    <p><span className="font-medium">Raison:</span> {entry.raison_acces}</p>
                    <p><span className="font-medium">Durée:</span> {entry.duree_acces} minutes</p>
                    <p><span className="font-medium">Créé le:</span> {formatDate(entry.date_creation)}</p>
                    {entry.date_fin && (
                      <p><span className="font-medium">Expire le:</span> {formatDate(entry.date_fin)}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {entry.statut === 'active' && (
                    <button
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Fermer l'accès"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    title="Voir détails"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DMPHistory; 