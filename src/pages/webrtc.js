// src/pages/webrtc.js
import React, { useState, useEffect } from 'react';
import ConferenceList from '../components/webrtc/ConferenceList';
import ConferenceRoom from '../components/webrtc/ConferenceRoom';
import ConferenceCreate from '../components/webrtc/ConferenceCreate';
import WebRTCProvider from '../components/webrtc/WebRTCProvider';

/**
 * Page principale WebRTC
 * Interface pour les conférences vidéo médecin-patient
 */
const WebRTCPage = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'room', 'create'
  const [currentConference, setCurrentConference] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [userType, setUserType] = useState(null);

  // Charger les données utilisateur au montage
  useEffect(() => {
    loadUserData();
  }, []);

  // Gérer les événements de retour
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'webrtc-back-to-list') {
        setCurrentView('list');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadUserData = () => {
    try {
      // Essayer d'abord les clés de session médecin
      let storedUser = localStorage.getItem('medecin');
      let storedToken = localStorage.getItem('jwt') || localStorage.getItem('token');
      
      // Si pas de session médecin, essayer les clés générales
      if (!storedUser) {
        storedUser = localStorage.getItem('user');
      }
      
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setToken(storedToken);
        
        // Déterminer le type d'utilisateur
        if (userData.type === 'professionnel' && userData.role === 'medecin') {
          setUserType('medecin');
        } else if (userData.type === 'patient') {
          setUserType('patient');
        } else if (userData.role === 'medecin') {
          setUserType('medecin');
        } else {
          setUserType('other');
        }
        
        console.log('✅ [WebRTC] Utilisateur chargé:', userData);
        console.log('✅ [WebRTC] Type utilisateur:', userData.type, userData.role);
      } else {
        console.log('❌ [WebRTC] Aucune session trouvée');
        console.log('❌ [WebRTC] medecin:', localStorage.getItem('medecin'));
        console.log('❌ [WebRTC] jwt:', localStorage.getItem('jwt'));
        console.log('❌ [WebRTC] user:', localStorage.getItem('user'));
        console.log('❌ [WebRTC] token:', localStorage.getItem('token'));
      }
    } catch (error) {
      console.error('❌ [WebRTC] Erreur chargement utilisateur:', error);
    }
  };

  // Gestionnaires d'événements
  const handleCreateConference = () => {
    // Rediriger vers la page de création avec sélection de patient
    setCurrentView('create');
  };

  const handleJoinConference = (conferenceData) => {
    setCurrentConference(conferenceData);
    setCurrentView('room');
  };

  const handleLeaveConference = () => {
    setCurrentConference(null);
    setCurrentView('list');
  };


  const handleError = (error) => {
    console.error('❌ [WebRTC] Erreur:', error);
    alert(`Erreur WebRTC: ${error.message}`);
  };

  // Vérifier l'authentification avec logs de débogage
  console.log('🔍 [WebRTC] État actuel:', { user, token, userType });
  
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Authentification requise
          </h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder aux conférences WebRTC.
          </p>
          <div className="text-sm text-gray-500 mb-4">
            <p>Debug: user = {user ? '✅' : '❌'}</p>
            <p>Debug: token = {token ? '✅' : '❌'}</p>
          </div>
          <button
            onClick={() => window.location.href = '/connexion'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Vérifier le type d'utilisateur
  if (userType === 'other') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Accès non autorisé
          </h2>
          <p className="text-gray-600 mb-6">
            Seuls les médecins et patients peuvent accéder aux conférences WebRTC.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <WebRTCProvider>
      <div className="min-h-screen bg-gray-100">
        {/* En-tête */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Conférences WebRTC
                </h1>
                <p className="text-gray-600">
                  {userType === 'medecin' 
                    ? 'Gérez vos consultations vidéo' 
                    : 'Rejoignez vos consultations vidéo'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {user.nom || user.prenom || 'Utilisateur'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  userType === 'medecin' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {userType === 'medecin' ? 'Médecin' : 'Patient'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentView === 'list' && (
            <ConferenceList
              userType={userType}
              user={user}
              token={token}
              serverUrl="http://localhost:3000"
              onCreateConference={handleCreateConference}
              onJoinConference={handleJoinConference}
              onError={handleError}
            />
          )}

          {currentView === 'create' && (
            <ConferenceCreate
              userType={userType}
              user={user}
              token={token}
              serverUrl="http://localhost:3000"
              onConferenceCreated={(conferenceData) => {
                console.log('✅ [WebRTC] Conférence créée:', conferenceData);
                // Rejoindre la conférence créée
                handleJoinConference({
                  conferenceCode: conferenceData.conferenceCode || conferenceData.code,
                  conferenceData: conferenceData
                });
              }}
              onError={handleError}
              onBackToList={() => setCurrentView('list')}
            />
          )}

          {currentView === 'room' && currentConference && (
            <ConferenceRoom
              conferenceCode={currentConference.conferenceCode || currentConference.code}
              userType={userType}
              user={user}
              token={token}
              onEnd={handleLeaveConference}
            />
          )}
        </div>
      </div>
    </WebRTCProvider>
  );
};

export default WebRTCPage;