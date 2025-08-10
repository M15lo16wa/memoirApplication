import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaClock, FaCheck, FaTimes, FaEye, 
  FaUser, FaCalendar, FaFileMedical, FaBell 
} from 'react-icons/fa';
import { getStoredMedecin } from '../services/api/authApi';
import { getAutorisationsDemandees, verifierAcces, getDureeRestante } from '../services/api/dmpApi';

const DMPDemandesAcces = () => {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [medecinProfile, setMedecinProfile] = useState(null);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer le profil médecin depuis le localStorage
      const storedMedecin = getStoredMedecin();
      if (storedMedecin) {
        setMedecinProfile(storedMedecin);
      }

      // Charger les demandes d'accès envoyées
      await loadDemandesAcces();

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadDemandesAcces = async () => {
    try {
      const result = await getAutorisationsDemandees();
      console.log('Demandes d\'accès reçues:', result);
      setDemandes(result.data?.autorisations || []);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      setError('Erreur lors du chargement des demandes d\'accès');
    }
  };

  const handleVerifierAcces = async (patientId) => {
    try {
      const result = await verifierAcces(medecinProfile.id, patientId);
      console.log('Vérification d\'accès:', result);
      
      if (result.acces_autorise) {
        alert('✅ Accès autorisé - Vous pouvez consulter le DMP de ce patient');
      } else {
        alert('❌ Accès non autorisé ou expiré');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification d\'accès:', error);
      alert('Erreur lors de la vérification d\'accès');
    }
  };

  const handleVoirDureeRestante = async (autorisationId) => {
    try {
      const result = await getDureeRestante(autorisationId);
      console.log('Durée restante:', result);
      
      const minutesRestantes = result.duree_restante_minutes || 0;
      const heures = Math.floor(minutesRestantes / 60);
      const minutes = minutesRestantes % 60;
      
      if (minutesRestantes > 0) {
        alert(`⏰ Durée restante: ${heures}h ${minutes}min`);
      } else {
        alert('⏰ Accès expiré');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la durée:', error);
      alert('Erreur lors de la vérification de la durée restante');
    }
  };

  const handleVoirDetails = (demande) => {
    setSelectedDemande(demande);
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
          Inconnu
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
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des demandes d'accès...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <FaArrowLeft className="mr-2" />
                Retour
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Mes demandes d'accès DMP</h1>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Dossier Médical Partagé
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">
                  Dr. {medecinProfile?.prenom || ''} {medecinProfile?.nom || ''}
                </p>
                <p className="text-xs text-gray-500">
                  {medecinProfile?.specialite || 'Médecin'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaBell className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaClock className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En attente</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {demandes.filter(d => d.statut === 'en_attente').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaCheck className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Acceptées</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {demandes.filter(d => d.statut === 'acceptee').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaTimes className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Refusées</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {demandes.filter(d => d.statut === 'refusee').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaFileMedical className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{demandes.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des demandes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Demandes d'accès envoyées</h2>
            <p className="text-sm text-gray-600">Historique de vos demandes d'accès aux DMP des patients</p>
          </div>
          
          {demandes.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaFileMedical className="text-gray-400 text-xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande d'accès</h3>
              <p className="text-gray-600">Vous n'avez pas encore envoyé de demandes d'accès aux DMP des patients.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {demandes.map((demande) => (
                <div key={demande.id_acces} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaUser className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {demande.patient?.prenom} {demande.patient?.nom}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Dossier: {demande.patient?.numero_dossier || demande.patient?.id}
                        </p>
                        <p className="text-sm text-gray-500">
                          Type d'accès: {getTypeAccesLabel(demande.type_acces)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Durée demandée: {demande.duree} minutes
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(demande.statut)}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleVoirDetails(demande)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        
                        {demande.statut === 'acceptee' && (
                          <>
                            <button
                              onClick={() => handleVerifierAcces(demande.patient_id)}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                              title="Vérifier l'accès"
                            >
                              <FaCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVoirDureeRestante(demande.id_acces)}
                              className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Voir la durée restante"
                            >
                              <FaClock className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {demande.raison_demande && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Raison de la demande:</span> {demande.raison_demande}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      <FaCalendar className="inline mr-1" />
                      Demande envoyée le {new Date(demande.date_creation).toLocaleDateString('fr-FR')}
                    </span>
                    {demande.date_reponse && (
                      <span>
                        Réponse le {new Date(demande.date_reponse).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de détails */}
      {showDetailsModal && selectedDemande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Détails de la demande d'accès</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Patient</h4>
                <p className="text-gray-700">
                  {selectedDemande.patient?.prenom} {selectedDemande.patient?.nom}
                </p>
                <p className="text-sm text-gray-500">
                  Dossier: {selectedDemande.patient?.numero_dossier || selectedDemande.patient?.id}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Type d'accès</h4>
                <p className="text-gray-700">{getTypeAccesLabel(selectedDemande.type_acces)}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Durée demandée</h4>
                <p className="text-gray-700">{selectedDemande.duree} minutes</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Raison de la demande</h4>
                <p className="text-gray-700">{selectedDemande.raison_demande}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Statut</h4>
                <div className="flex items-center">
                  {getStatusBadge(selectedDemande.statut)}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Dates</h4>
                <p className="text-sm text-gray-600">
                  Demande envoyée: {new Date(selectedDemande.date_creation).toLocaleString('fr-FR')}
                </p>
                {selectedDemande.date_reponse && (
                  <p className="text-sm text-gray-600">
                    Réponse: {new Date(selectedDemande.date_reponse).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>
              
              {selectedDemande.commentaire_reponse && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Commentaire de réponse</h4>
                  <p className="text-gray-700">{selectedDemande.commentaire_reponse}</p>
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
    </div>
  );
};

export default DMPDemandesAcces;
