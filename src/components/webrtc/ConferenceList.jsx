// src/components/webrtc/ConferenceList.jsx
import React, { useState, useEffect } from 'react';

/**
 * Composant de liste des conférences WebRTC
 * Affiche les conférences disponibles pour le médecin ou le patient
 */
const ConferenceList = ({
    userType,
    user,
    token,
    serverUrl = 'http://localhost:3000',
    onCreateConference,
    onJoinConference,
    onError
}) => {
    // États
    const [conferences, setConferences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joinCode, setJoinCode] = useState('');

    // Charger les conférences
    useEffect(() => {
        loadConferences();
    }, []);

    const loadConferences = async () => {
        try {
            setIsLoading(true);
            setError(null);

            console.log('📋 [WebRTC] Chargement des conférences depuis l\'API...');

            // Utiliser le service WebRTC pour charger les conférences
            const webrtcService = new (await import('../../services/webrtc.service.js')).default();
            await webrtcService.initialize(token, null, userType, user);

            const conferencesData = await webrtcService.getUserConferences();
            console.log('📊 [WebRTC] Réponse API conférences:', conferencesData);

            setConferences(Array.isArray(conferencesData) ? conferencesData : []);
            setIsLoading(false);
            console.log('✅ [WebRTC] Conférences chargées:', conferencesData);

        } catch (error) {
            console.error('❌ [WebRTC] Erreur chargement conférences:', error);
            setError(`Erreur de chargement: ${error.message}`);
            setConferences([]); // S'assurer que conferences est toujours un tableau
            setIsLoading(false);
            if (onError) {
                onError(error);
            }
        }
    };

    const handleJoinByCode = async () => {
        if (!joinCode.trim()) {
            setError('Veuillez saisir un code de conférence');
            return;
        }

        try {
            setError(null);

            // Utiliser le service WebRTC pour rejoindre la conférence
            const webrtcService = new (await import('../../services/webrtc.service.js')).default();
            await webrtcService.initialize(token, joinCode, userType, user);

            const conferenceData = await webrtcService.joinConferenceByCode(joinCode);
            console.log('✅ [WebRTC] Conférence rejointe:', conferenceData);

            if (onJoinConference) {
                onJoinConference({
                    conferenceCode: joinCode,
                    conferenceData: conferenceData
                });
            }

        } catch (error) {
            console.error('❌ [WebRTC] Erreur join by code:', error);
            setError(error.message);
            if (onError) {
                onError(error);
            }
        }
    };

    const handleJoinConference = (conference) => {
        if (onJoinConference) {
            onJoinConference({
                conferenceCode: conference.conference_code,
                conferenceData: conference
            });
        }
    };

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

    // Écran de chargement
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des conférences...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Section de création (médecins uniquement) */}
            {userType === 'medecin' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Créer une nouvelle conférence
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Créez une conférence pour consulter un patient en vidéo.
                    </p>
                    <button
                        onClick={onCreateConference}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        🎥 Créer une conférence
                    </button>
                </div>
            )}

            {/* Section de jonction par code (patients uniquement) */}
            {userType === 'patient' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Rejoindre une conférence
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Saisissez le code de conférence fourni par votre médecin.
                    </p>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="Code de conférence (ex: ABC1234567)"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={10}
                        />
                        <button
                            onClick={handleJoinByCode}
                            disabled={!joinCode.trim()}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            Rejoindre
                        </button>
                    </div>
                    {error && (
                        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* Liste des conférences */}
            <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {userType === 'medecin' ? 'Mes conférences' : 'Conférences disponibles'}
                    </h2>
                </div>

                <div className="p-6">
                    {!conferences || conferences.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">📹</div>
                            <p className="text-gray-600">
                                {userType === 'medecin'
                                    ? 'Aucune conférence créée'
                                    : 'Aucune conférence disponible'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(conferences || []).map((conference) => (
                                <div
                                    key={conference.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
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
                                            {conference.status === 'active' || conference.status === 'initiated' ? (
                                                <button
                                                    onClick={() => handleJoinConference(conference)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    Rejoindre
                                                </button>
                                            ) : (
                                                <span className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                                                    Terminée
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bouton de rafraîchissement */}
            <div className="text-center">
                <button
                    onClick={loadConferences}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                    �� Actualiser
                </button>
            </div>
        </div>
    );
};

export default ConferenceList;