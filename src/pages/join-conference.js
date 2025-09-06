// src/pages/join-conference.js
import React, { useState, useEffect } from 'react';
import { JoinConference, ConferenceRoom } from '../components/webrtc';
import '../components/webrtc/webrtc.css';

/**
 * Page pour rejoindre une conférence
 * Utilisée par les patients avec un lien de conférence
 */
const JoinConferencePage = () => {
    const [currentView, setCurrentView] = useState('join'); // 'join' ou 'room'
    const [conferenceData, setConferenceData] = useState(null);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [userType, setUserType] = useState('patient');
    const [error, setError] = useState(null);

    // Charger les données utilisateur au montage
    useEffect(() => {
        loadUserData();
        loadConferenceLinkFromURL();
    }, []);

    // Charger le lien de conférence depuis l'URL
    const loadConferenceLinkFromURL = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const linkParam = urlParams.get('link');
        
        if (linkParam) {
            console.log('🔗 [JoinConference] Lien détecté dans l\'URL:', linkParam);
            // Simuler la soumission automatique du formulaire
            setTimeout(() => {
                handleJoinConference({
                    conferenceCode: extractConferenceCode(linkParam),
                    conferenceLink: linkParam
                });
            }, 1000); // Délai pour laisser l'interface se charger
        }
    };

    // Extraire le code de conférence du lien
    const extractConferenceCode = (link) => {
        if (link.includes('/conference/')) {
            const parts = link.split('/conference/');
            return parts[1] || parts[0];
        } else if (link.includes('conferenceCode=')) {
            const urlParams = new URLSearchParams(link.split('?')[1]);
            return urlParams.get('conferenceCode');
        } else {
            return link.trim();
        }
    };

    const loadUserData = () => {
        try {
            // Pour les patients, chercher dans localStorage
            let storedUser = localStorage.getItem('user');
            let storedToken = localStorage.getItem('jwt') || localStorage.getItem('token');
            
            if (storedUser && storedToken) {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setToken(storedToken);
                setUserType('patient');
                console.log('✅ [JoinConference] Patient chargé:', userData);
            } else {
                console.log('❌ [JoinConference] Aucune session patient trouvée');
                // Créer une session temporaire pour les invités
                setUser({ id: 'guest', nom: 'Invité', prenom: 'Patient' });
                setToken('guest-token');
                setUserType('patient');
            }
        } catch (error) {
            console.error('❌ [JoinConference] Erreur chargement utilisateur:', error);
            setError('Erreur de chargement de la session');
        }
    };

    const handleJoinConference = async (conferenceInfo) => {
        try {
            console.log('🔗 [JoinConference] Rejoindre conférence:', conferenceInfo);
            setConferenceData(conferenceInfo);
            setCurrentView('room');
        } catch (error) {
            console.error('❌ [JoinConference] Erreur rejoindre conférence:', error);
            setError(error.message);
        }
    };

    const handleLeaveConference = () => {
        console.log('👋 [JoinConference] Quitter conférence');
        setCurrentView('join');
        setConferenceData(null);
        setError(null);
    };

    const handleError = (error) => {
        console.error('❌ [JoinConference] Erreur:', error);
        setError(error.message);
    };

    if (error && currentView === 'join') {
        return (
            <div className="webrtc-page">
                <div className="error-container">
                    <h2>Erreur</h2>
                    <p>{error}</p>
                    <button 
                        onClick={() => setError(null)}
                        className="btn btn-primary"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="webrtc-page">
            <div className="webrtc-container">
                {/* Bouton de retour vers le DMP */}
                <div className="webrtc-header">
                    <button
                        onClick={() => window.location.href = '/dmp'}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <span>←</span>
                        <span className="ml-2">Retour au DMP</span>
                    </button>
                </div>

                {currentView === 'join' && (
                    <JoinConference
                        onJoinConference={handleJoinConference}
                        onError={handleError}
                    />
                )}

                {currentView === 'room' && conferenceData && (
                    <ConferenceRoom
                        conferenceCode={conferenceData.conferenceCode}
                        userType={userType}
                        user={user}
                        token={token}
                        onEnd={handleLeaveConference}
                    />
                )}
            </div>
        </div>
    );
};

export default JoinConferencePage;
