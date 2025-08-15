import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dmpApi from '../services/api/dmpApi';



const DMPPatientView = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessStatus, setAccessStatus] = useState('loading');
  const [patient, setPatient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [autoMesures, setAutoMesures] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [quitting, setQuitting] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Vérifier le statut d'accès
        const statusRes = await dmpApi.getAccessStatus(patientId);
        setAccessStatus(statusRes?.accessStatus || statusRes?.status || 'not_authorized');

        if ((statusRes?.status || statusRes?.accessStatus) !== 'authorized' && (statusRes?.status || statusRes?.accessStatus) !== 'active') {
          setLoading(false);
          return; // ne pas charger les données si non autorisé ou non actif
        }

        // 2) Charger l'ensemble des données du dossier de manière sécurisée
        const dossierData = await dmpApi.getSecureDossierForMedecin(patientId);
        setPatient(dossierData?.patient || dossierData);
        setDocuments(Array.isArray(dossierData?.documents) ? dossierData.documents : []);
        setAutoMesures(Array.isArray(dossierData?.autoMesures) ? dossierData.autoMesures : []);
      } catch (e) {
        setError(e.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    if (patientId) {
      loadAll();
    }
  }, [patientId]);

  const handleQuitterDossier = () => {
    // Afficher la modal de confirmation
    setShowConfirmation(true);
  };

  const handleConfirmQuitter = async () => {
    try {
      setQuitting(true);
      setShowConfirmation(false);
      
      console.log('�� Révocation automatique de l\'accès au dossier patient...');
      
      // Récupérer l'ID du professionnel connecté
      const storedMedecin = JSON.parse(localStorage.getItem('medecin') || '{}');
      const professionnelId = storedMedecin?.id || storedMedecin?.id_professionnel;
      
      if (professionnelId && patientId) {
        // ✅ ÉTAPE 1: Récupérer l'ID de l'autorisation active
        const verification = await dmpApi.verifierAccesMedecinPatient(professionnelId, patientId);
        
        if (verification.hasAccess && verification.authorization) {
          const autorisationId = verification.authorization.id_acces;
          console.log('�� Autorisation trouvée:', autorisationId);
          
          // ✅ ÉTAPE 2: Désactiver l'autorisation avec son ID
          await dmpApi.desactiverAutorisationMedecin(
            autorisationId, // ✅ ID de l'autorisation
            'Accès désactivé automatiquement lors de la fermeture du dossier'
          );
          console.log('✅ Accès désactivé avec succès');
          
          // ✅ ÉTAPE 3: Vérifier que l'accès a bien été désactivé
          const verificationFinale = await dmpApi.verifierAccesMedecinPatient(professionnelId, patientId);
          if (verificationFinale.hasAccess) {
            console.warn('⚠️ L\'accès n\'a pas été complètement désactivé');
          } else {
            console.log('✅ Vérification confirmée: accès désactivé');
          }
        } else {
          console.log('ℹ️ Aucune autorisation active trouvée');
        }
      }
      
      // Rediriger vers le DMP
      navigate('/dmp');
    } catch (error) {
      console.error('❌ Erreur lors de la désactivation de l\'accès:', error);
      // Même en cas d'erreur, on quitte le dossier
      navigate('/dmp');
    } finally {
      setQuitting(false);
    }
  };

  const handleCancelQuitter = () => {
    setShowConfirmation(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Chargement du dossier patient...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex justify-center items-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleQuitterDossier}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Retour au DMP
          </button>
        </div>
      </div>
    );
  }

  if (accessStatus !== 'authorized' && accessStatus !== 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex justify-center items-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Accès non autorisé</h2>
          <p className="text-gray-600 mb-6">Le statut actuel est: {String(accessStatus)}</p>
          <button
            onClick={handleQuitterDossier}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Retour au DMP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header avec bouton de retour */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleQuitterDossier}
                disabled={quitting}
                className={`flex items-center space-x-2 font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg ${
                  quitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {quitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Révocation en cours...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Quitter dossier patient</span>
                  </>
                )}
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-800">Dossier DMP du Patient</h1>
            </div>
            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Accès autorisé</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Informations du patient */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                {patient?.prenom} {patient?.nom}
              </h2>
              <p className="text-gray-600 text-lg">Patient #{patientId}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Date de naissance</p>
                  <p className="text-gray-800 font-semibold">{patient?.date_naissance || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Groupe sanguin</p>
                  <p className="text-gray-800 font-semibold">{patient?.groupe_sanguin || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Statut</p>
                  <p className="text-gray-800 font-semibold capitalize">{accessStatus}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents et Auto-mesures */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Documents */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Documents</h3>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {documents.length}
              </span>
            </div>
            
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Aucun document disponible</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-indigo-300 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">
                          {doc.nom || doc.titre || 'Document'}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span>{doc.type || doc.format || 'Document'}</span>
                          </span>
                        </div>
                      </div>
                      {doc.url && (
                        <a 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center space-x-2"
                          href={doc.url} 
                          target="_blank" 
                          rel="noreferrer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span>Ouvrir</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto-mesures */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Auto-mesures</h3>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {autoMesures.length}
              </span>
            </div>
            
            {autoMesures.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Aucune auto-mesure disponible</p>
              </div>
            ) : (
              <div className="space-y-3">
                {autoMesures.map((m) => (
                  <div key={m.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-green-300 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800 capitalize">
                        {m.type}
                      </h4>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        {m.date_mesure}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-green-600">
                        {m.valeur}
                        {m.valeur_secondaire ? `/${m.valeur_secondaire}` : ''}
                      </span>
                      <span className="text-gray-600 font-medium">
                        {m.unite}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de confirmation pour quitter le dossier */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quitter le dossier patient</h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir quitter le dossier de <strong>{patient?.prenom} {patient?.nom}</strong> ? 
                <br /><br />
                <span className="text-orange-600 font-medium">
                  ⚠️ Votre accès sera automatiquement révoqué et vous devrez faire une nouvelle demande pour y accéder à nouveau.
                </span>
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleCancelQuitter}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmQuitter}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Quitter et révoquer l'accès
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DMPPatientView;


