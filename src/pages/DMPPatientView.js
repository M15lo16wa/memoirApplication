import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDMP } from '../context/DMPContext';
import DMPHistory from '../components/dmp/DMPHistory';
import { getDMP, getHistoriqueMedical, getAutorisations } from '../services/api/dmpApi';

function DMPPatientView() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { state: dmpState, actions } = useDMP();
  const [activeTab, setActiveTab] = useState('overview');
  const [dmpData, setDmpData] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [autorisations, setAutorisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('loading');

  // Vérifier que l'utilisateur est un patient connecté
  const checkPatientAuthorization = useCallback(() => {
    const jwtToken = localStorage.getItem('jwt');
    const patientData = localStorage.getItem('patient');
    
    if (!jwtToken || !patientData) {
      console.warn('⚠️ Accès refusé: Utilisateur non connecté en tant que patient');
      return false;
    }
    
    try {
      const patient = JSON.parse(patientData);
      // Vérifier que l'utilisateur connecté correspond au patient demandé
      if (patientId && patient.id !== parseInt(patientId) && patient.id_patient !== parseInt(patientId)) {
        console.warn('⚠️ Accès refusé: Tentative d\'accès au dossier d\'un autre patient');
        return false;
      }
      
      console.log('✅ Patient autorisé à consulter son dossier DMP');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des autorisations patient:', error);
      return false;
    }
  }, [patientId]);

  // Charger les données DMP
  const loadDMPData = useCallback(async () => {
    if (!checkPatientAuthorization()) {
      setCurrentStatus('unauthorized');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Chargement des données DMP pour le patient:', patientId);
      
      // Charger les données en parallèle
      const [dmpResponse, historiqueResponse, autorisationsResponse] = await Promise.all([
        getDMP(patientId),
        getHistoriqueMedical(patientId),
        getAutorisations(patientId)
      ]);
      
      setDmpData(dmpResponse?.data || dmpResponse);
      setHistorique(historiqueResponse?.data || historiqueResponse || []);
      setAutorisations(autorisationsResponse?.data || autorisationsResponse || []);
      setCurrentStatus('authorized');
      
      console.log('✅ Données DMP chargées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données DMP:', error);
      setError('Impossible de charger les données DMP');
      setCurrentStatus('error');
    } finally {
      setLoading(false);
    }
  }, [patientId, checkPatientAuthorization]);

  // Effet initial
  useEffect(() => {
    if (patientId) {
      loadDMPData();
    }
  }, [patientId, loadDMPData]);

  // Si l'utilisateur n'est pas autorisé, afficher un message d'erreur
  if (currentStatus === 'unauthorized') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Accès non autorisé</h2>
          <p className="text-gray-600 mb-6">
            Vous n'êtes pas autorisé à consulter ce dossier médical.
          </p>
          <button
            onClick={() => navigate('/connexion')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Si en cours de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre dossier DMP...</p>
        </div>
      </div>
    );
  }

  // Si erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadDMPData}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon Dossier Médical Partagé</h1>
              <p className="text-gray-600">Gérez votre dossier médical et suivez les accès</p>
            </div>
            <button
              onClick={() => navigate('/dmp')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Retour au DMP
            </button>
          </div>
        </div>
      </div>

      {/* Navigation des onglets */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historique des accès
            </button>
            <button
              onClick={() => setActiveTab('authorizations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'authorizations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Autorisations
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Vue d'ensemble de votre dossier</h2>
            {dmpData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Informations générales</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Statut:</span> {dmpData.statut || 'Actif'}</p>
                    <p><span className="font-medium">Date de création:</span> {dmpData.date_creation ? new Date(dmpData.date_creation).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
                    <p><span className="font-medium">Dernière mise à jour:</span> {dmpData.date_mise_a_jour ? new Date(dmpData.date_mise_a_jour).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Statistiques</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nombre d'accès:</span> {historique.length}</p>
                    <p><span className="font-medium">Autorisations actives:</span> {autorisations.filter(auth => auth.statut === 'ACTIVE').length}</p>
                    <p><span className="font-medium">Demandes en attente:</span> {autorisations.filter(auth => auth.statut === 'EN_ATTENTE').length}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Aucune donnée disponible</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Historique des accès à votre dossier</h2>
            <DMPHistory patientId={parseInt(patientId)} />
          </div>
        )}

        {activeTab === 'authorizations' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Vos autorisations d'accès</h2>
            {autorisations.length > 0 ? (
              <div className="space-y-4">
                {autorisations.map((auth, index) => (
                  <div key={auth.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {auth.nom_medecin || auth.nom_professionnel || 'Professionnel de santé'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Type: {auth.type_acces || 'Accès standard'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Date: {auth.date_creation ? new Date(auth.date_creation).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        auth.statut === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        auth.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                        auth.statut === 'REVOQUE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {auth.statut === 'ACTIVE' ? 'Active' :
                         auth.statut === 'EN_ATTENTE' ? 'En attente' :
                         auth.statut === 'REVOQUE' ? 'Révoquée' :
                         auth.statut}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucune autorisation trouvée</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DMPPatientView;


