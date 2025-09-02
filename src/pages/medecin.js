// src/pages/Medecin.js

import React, { useState, useEffect, useCallback } from "react";
import MedHeader from "../components/layout/headerMed";
import { ProtectedMedecinRoute } from "../services/api/protectedRoute";
import { FaComments, FaCalendarAlt, FaUserInjured, FaChartBar, FaSearch, FaSpinner, FaBell, FaUser, FaVideo } from "react-icons/fa";
import WebRTCWidget from "../messaging/components/WebRTCWidget";

// Import des composants de messagerie
import { MessagingButton, MessagingWidget, ChatMessage } from "../messaging";
import signalingService from "../services/signalingService";
import { getPatientsByMedecin } from "../services/api/patientApi";
import { getRendezVousByMedecin } from "../services/api/rendezVous";

function Medecin() {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [callActive, setCallActive] = useState(false);
    const [dashboardStats, setDashboardStats] = useState({
        patientsAujourdhui: 0,
        rendezVous: 0,
        messagesPatients: 0
    });
    const [recentMessages, setRecentMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // État pour la messagerie sécurisée
    const [showMessaging, setShowMessaging] = useState(false);
    const [showPatientSelection, setShowPatientSelection] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [role, setRole] = useState(null);
    const [jwtToken, setJwtToken] = useState(null);
    
    // État pour la liste des patients
    const [patients, setPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    // États pour les appels WebRTC
    const [activeCall, setActiveCall] = useState(null);
    const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, connected, ended
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [conferenceLink, setConferenceLink] = useState(null);

    const handleSend = useCallback(() => {
        if (input.trim()) {
            signalingService.emit('sendMessage', input);
            setMessages(prev => [...prev, { sender: "medecin", content: input }]);
            setInput('');
        }
    }, [input]);

    const handleStartCall = useCallback(() => {
        signalingService.emit('startCall');
        setCallActive(true);
    }, []);

    // Récupérer les informations d'authentification au montage du composant
    useEffect(() => {
        const token = localStorage.getItem('token') || localStorage.getItem('jwt');
        const medecinData = localStorage.getItem('medecin');
        
        if (token && medecinData) {
            try {
                const medecin = JSON.parse(medecinData);
                setUserId(medecin.id_professionnel || medecin.id);
                setRole('medecin');
                setJwtToken(token);
                console.log('✅ Médecin connecté:', medecin.nom, medecin.prenom);
            } catch (error) {
                console.error('Erreur lors du parsing des données médecin:', error);
            }
        }
    }, []);

    // Charger les messages récents depuis le service de messagerie
    useEffect(() => {
        console.log('🔍 [useEffect] Déclenchement - userId:', userId, 'role:', role, 'jwtToken:', jwtToken ? 'Présent' : 'Absent');
        
        if (userId && role && jwtToken) {
            console.log('✅ [useEffect] Conditions remplies, chargement des données...');
            
            const loadRecentMessages = async () => {
                try {
                    setLoading(true);
                    const response = await signalingService.getUserConversations();
                    if (response.success && response.conversations) {
                        // Trier par date et prendre les plus récents
                        const sortedConversations = response.conversations
                            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
                            .slice(0, 3);
                        setRecentMessages(sortedConversations);
                    }
                } catch (error) {
                    console.error('Erreur lors du chargement des messages récents:', error);
                } finally {
                    setLoading(false);
                }
            };
            
            loadRecentMessages();
            console.log('🔄 [useEffect] Appel de loadDashboardStats...');
            loadDashboardStats(); // Charger aussi les statistiques du tableau de bord
        } else {
            console.log('❌ [useEffect] Conditions non remplies, pas de chargement');
        }
    }, [userId, role, jwtToken]);

    // Surveiller les changements du state dashboardStats
    useEffect(() => {
        console.log('🔄 [useEffect - dashboardStats] State mis à jour:', dashboardStats);
    }, [dashboardStats]);

    // Charger les statistiques du tableau de bord
    const loadDashboardStats = async () => {
        try {
            if (!userId) {
                console.error('❌ ID utilisateur non disponible pour charger les statistiques');
                return;
            }
            
            console.log('🔍 Chargement des statistiques pour le médecin:', userId);
            
            // Charger le nombre de rendez-vous
            const rendezVousData = await getRendezVousByMedecin(userId);
            console.log('🔍 [loadDashboardStats] Données brutes des rendez-vous:', rendezVousData);
            console.log('🔍 [loadDashboardStats] Type des données:', typeof rendezVousData);
            console.log('🔍 [loadDashboardStats] Clés des données:', Object.keys(rendezVousData || {}));
            
            let rendezVousCount = 0;
            
            if (rendezVousData && Array.isArray(rendezVousData)) {
                rendezVousCount = rendezVousData.length;
                console.log('🔍 [loadDashboardStats] Données directes (array):', rendezVousData);
            } else if (rendezVousData && rendezVousData.data && Array.isArray(rendezVousData.data)) {
                rendezVousCount = rendezVousData.data.length;
                console.log('🔍 [loadDashboardStats] Données dans .data (array):', rendezVousData.data);
            } else if (rendezVousData && rendezVousData.data && rendezVousData.data.rendezVous && Array.isArray(rendezVousData.data.rendezVous)) {
                rendezVousCount = rendezVousData.data.rendezVous.length;
                console.log('🔍 [loadDashboardStats] Données dans .data.rendezVous (array):', rendezVousData.data.rendezVous);
            } else if (rendezVousData && rendezVousData.rendezVous && Array.isArray(rendezVousData.rendezVous)) {
                rendezVousCount = rendezVousData.rendezVous.length;
                console.log('🔍 [loadDashboardStats] Données dans .rendezVous (array):', rendezVousData.rendezVous);
            } else if (rendezVousData && rendezVousData.appointments && Array.isArray(rendezVousData.appointments)) {
                rendezVousCount = rendezVousData.appointments.length;
                console.log('🔍 [loadDashboardStats] Données dans .appointments (array):', rendezVousData.appointments);
            } else {
                console.warn('⚠️ [loadDashboardStats] Format de données non reconnu:', rendezVousData);
                console.log('🔍 [loadDashboardStats] Structure complète:', JSON.stringify(rendezVousData, null, 2));
            }
            
            console.log('✅ [loadDashboardStats] Nombre de rendez-vous final:', rendezVousCount);
            
            setDashboardStats(prev => {
                const newStats = {
                    ...prev,
                    rendezVous: rendezVousCount
                };
                console.log('🔄 [loadDashboardStats] Mise à jour des stats:', newStats);
                return newStats;
            });
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des statistiques:', error);
        }
    };

    // Charger la liste des patients depuis le serveur
    const loadPatients = async () => {
        try {
            setLoadingPatients(true);
            setError(null);
            
            if (!userId) {
                console.error('❌ ID utilisateur non disponible pour charger les patients');
                setError("ID utilisateur non disponible");
                return;
            }
            
            console.log('🔍 Chargement des patients pour le médecin:', userId);
            const patientsData = await getPatientsByMedecin(userId);
            
            if (patientsData && Array.isArray(patientsData)) {
                console.log('✅ Patients récupérés:', patientsData.length);
                setPatients(patientsData);
            } else {
                console.warn('⚠️ Aucun patient trouvé ou format de réponse invalide');
                setPatients([]);
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement des patients:', error);
            setError(`Erreur lors du chargement des patients: ${error.message}`);
            setPatients([]);
        } finally {
            setLoadingPatients(false);
        }
    };

    // Fonction pour ouvrir la sélection de patient
    const handleOpenPatientSelection = () => {
        setShowPatientSelection(true);
        loadPatients();
    };

    // Fonction pour sélectionner un patient et créer une conversation
    const handleSelectPatient = (patientId) => {
        const selectedPatient = patients.find(p => (p.id || p.id_patient) === patientId);
        if (selectedPatient) {
            console.log('✅ Patient sélectionné:', selectedPatient);
            setSelectedPatientId(patientId);
            setShowPatientSelection(false);
            setShowMessaging(true);
            setSelectedConversationId(null); // Nouvelle conversation
            setError(null); // Nettoyer les erreurs
        } else {
            console.error('❌ Patient non trouvé avec l\'ID:', patientId);
            setError("Patient non trouvé");
        }
    };

    // Fonction pour fermer la messagerie
    const handleCloseMessaging = () => {
        setShowMessaging(false);
        setSelectedPatientId(null);
        setSelectedConversationId(null);
    };

    // Fonction pour démarrer un appel vidéo
    const handleStartVideoCall = async (patientId) => {
        try {
            console.log('🎥 Démarrage d\'un appel vidéo avec le patient:', patientId);
            console.log('🔍 État actuel - activeCall:', activeCall, 'callStatus:', callStatus);
            
            // Initialiser le service de signalisation si nécessaire
            if (!signalingService.isConnected()) {
                console.log('🔌 Initialisation du service de signalisation...');
                signalingService.initialize();
                signalingService.connectSocket(userId, role, jwtToken);
            }
            
            // Créer une session WebRTC pour l'appel vidéo avec code de conférence
            console.log('📡 Création de la session WebRTC avec code de conférence...');
            const result = await signalingService.createWebRTCSessionWithConferenceLink(
                `temp_conv_${patientId}_${userId}`, // ID de conversation temporaire
                'audio_video',
                null, // SDP offer sera généré par le composant vidéo
                true // Générer un lien de conférence
            );
            
            console.log('📡 Résultat de création de session:', result);
            
            if (result.success) {
                console.log('✅ Session WebRTC vidéo créée:', result.session);
                
                // Afficher le code de conférence si généré
                if (result.conferenceLink) {
                    console.log('🔐 Code de conférence généré:', result.conferenceLink);
                    setConferenceLink(result.conferenceLink);
                }
                
                // Utiliser la nouvelle fonction pour ouvrir l'interface vidéo
                openVideoInterface(result, 'video');
                
                // Émettre l'événement pour démarrer l'appel
                signalingService.emit('start_video_call', {
                    conversationId: `temp_conv_${patientId}_${userId}`,
                    sessionId: result.session.id,
                    patientId: patientId,
                    medecinId: userId,
                    conferenceLink: result.conferenceLink
                });
                
                console.log('✅ Appel vidéo initié avec succès');
            } else {
                console.error('❌ Erreur lors de la création de la session vidéo:', result.error);
                setError(`Erreur lors de la création de la session vidéo: ${result.error}`);
            }
        } catch (error) {
            console.error('❌ Erreur lors du démarrage de l\'appel vidéo:', error);
            setError(`Erreur lors du démarrage de l'appel vidéo: ${error.message}`);
        }
    };

    // Fonction pour démarrer un appel audio
    const handleStartAudioCall = async (patientId) => {
        try {
            console.log('📞 Démarrage d\'un appel audio avec le patient:', patientId);
            
            // Initialiser le service de signalisation si nécessaire
            if (!signalingService.isConnected()) {
                signalingService.initialize();
                signalingService.connectSocket(userId, role, jwtToken);
            }
            
            // Créer une session WebRTC pour l'appel audio avec code de conférence
            const result = await signalingService.createWebRTCSessionWithConferenceLink(
                `temp_conv_${patientId}_${userId}`, // ID de conversation temporaire
                'audio_only',
                null, // SDP offer sera généré par le composant audio
                true // Générer un lien de conférence
            );
            
            if (result.success) {
                console.log('✅ Session WebRTC audio créée:', result.session);
                
                // Afficher le code de conférence si généré
                if (result.conferenceLink) {
                    console.log('🔐 Code de conférence généré:', result.conferenceLink);
                    setConferenceLink(result.conferenceLink);
                }
                
                // Utiliser la nouvelle fonction pour ouvrir l'interface audio
                openVideoInterface(result, 'audio');
                
                // Émettre l'événement pour démarrer l'appel
                signalingService.emit('start_audio_call', {
                    conversationId: `temp_conv_${patientId}_${userId}`,
                    sessionId: result.session.id,
                    patientId: patientId,
                    medecinId: userId,
                    conferenceLink: result.conferenceLink
                });
                
                console.log('✅ Appel audio initié avec succès');
            } else {
                console.error('❌ Erreur lors de la création de la session audio:', result.error);
                setError(`Erreur lors de la création de la session audio: ${result.error}`);
            }
        } catch (error) {
            console.error('❌ Erreur lors du démarrage de l\'appel audio:', error);
            setError(`Erreur lors du démarrage de l'appel audio: ${error.message}`);
        }
    };

    // Fonction pour démarrer le flux vidéo local
    const startLocalVideoStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            setLocalStream(stream);
            console.log('✅ Flux vidéo local démarré');
        } catch (error) {
            console.error('❌ Erreur lors de la capture vidéo locale:', error);
            setError('Impossible d\'accéder à la caméra/microphone');
        }
    };

    // Fonction pour ouvrir l'interface vidéo avec les données du serveur
    const openVideoInterface = (serverResponse, desiredType = null) => {
        try {
            console.log('🎬 Ouverture de l\'interface vidéo avec la réponse serveur:', serverResponse);
            console.log('🔍 Structure complète de la réponse:', JSON.stringify(serverResponse, null, 2));
            
            // Vérifier la structure de la réponse et s'adapter
            let sessionData, conversationData;
            
            if (serverResponse.session) {
                // Structure avec .session
                sessionData = serverResponse.session;
                conversationData = serverResponse.conversation;
            } else if (serverResponse.id) {
                // Structure directe (session créée directement)
                sessionData = serverResponse;
                conversationData = serverResponse;
            } else {
                console.error('❌ Structure de réponse serveur non reconnue:', serverResponse);
                setError('Structure de réponse serveur non reconnue');
                return;
            }
            
            console.log('🔍 Session data extraite:', sessionData);
            console.log('🔍 Conversation data extraite:', conversationData);
            
            // Récupérer l'ID du patient depuis le contexte actuel
            const currentPatientId = selectedPatientId;
            const currentPatient = patients.find(p => (p.id || p.id_patient) === currentPatientId);
            const patientName = currentPatient ? `${currentPatient.prenom} ${currentPatient.nom}` : 'Patient inconnu';
            
            // Créer l'objet d'appel avec les vraies données du serveur
            const callData = {
                type: desiredType || (sessionData.type === 'audio_video' || sessionData.session_type === 'audio_video' ? 'video' : 'audio'),
                sessionId: sessionData.id || sessionData.session_id,
                patientId: currentPatientId,
                patientName: patientName,
                conversationId: conversationData?.id || conversationData?.conversation_id || `temp_conv_${currentPatientId}_${userId}`,
                serverData: serverResponse // Stocker toute la réponse serveur pour référence
            };

            console.log('📞 Données d\'appel finales:', callData);
            console.log('🔍 État avant mise à jour - activeCall:', activeCall, 'callStatus:', callStatus);

            // Mettre à jour l'état de l'appel
            setActiveCall(callData);
            setCallStatus('connecting');
            
            // Nettoyer les erreurs précédentes
            setError(null);
            
            console.log('✅ Interface vidéo ouverte avec succès');
            console.log('🔍 État après mise à jour - activeCall devrait être:', callData);
            
            // Démarrer automatiquement la capture vidéo si c'est un appel vidéo
            if (callData.type === 'video') {
                startLocalVideoStream();
            }
            
            // Émettre l'événement pour notifier le serveur que l'interface est ouverte
            if (signalingService.isConnected()) {
                signalingService.emit('video_interface_opened', {
                    sessionId: callData.sessionId,
                    conversationId: callData.conversationId,
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'ouverture de l\'interface vidéo:', error);
            setError(`Erreur lors de l'ouverture de l'interface vidéo: ${error.message}`);
        }
    };

    // Fonction pour terminer l'appel
    const handleEndCall = async () => {
        try {
            if (activeCall) {
                console.log('📞 Terminaison de l\'appel:', activeCall.sessionId);
                
                // Terminer la session WebRTC côté serveur
                if (signalingService.isConnected()) {
                    await signalingService.endWebRTCSession(activeCall.sessionId);
                }
                
                // Émettre l'événement de fin d'appel
                signalingService.emit('end_call', {
                    sessionId: activeCall.sessionId,
                    conversationId: activeCall.conversationId
                });
                
                // Nettoyer les flux
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                    setLocalStream(null);
                }
                setRemoteStream(null);
                
                // Réinitialiser l'état de l'appel
                setActiveCall(null);
                setCallStatus('idle');
                
                console.log('✅ Appel terminé avec succès');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la terminaison de l\'appel:', error);
            setError(`Erreur lors de la terminaison de l'appel: ${error.message}`);
        }
    };

    const renderContent = () => {
        if (activeSection === 'messaging') {
            return (
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Messagerie Sécurisée</h2>
                    
                    {/* Boutons d'action pour la messagerie */}
                    {userId && role && jwtToken && !showMessaging && (
                        <div className="text-center py-8 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={handleOpenPatientSelection}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <FaUserInjured className="w-5 h-5" />
                                    <span>Nouvelle conversation avec un patient</span>
                                </button>
                                
                                <button
                                    onClick={() => setShowMessaging(true)}
                                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <FaComments className="w-5 h-5" />
                                    <span>Voir les conversations existantes</span>
                                </button>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-4">
                                Choisissez une option pour accéder à la messagerie sécurisée
                            </p>
                        </div>
                    )}
                    
                    {/* Interface de sélection de patient */}
                    {userId && role && jwtToken && showPatientSelection && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-gray-800">Sélectionner un patient</h3>
                                <button
                                    onClick={() => setShowPatientSelection(false)}
                                    className="text-gray-500 hover:text-gray-700 text-sm"
                                >
                                    ← Retour
                                </button>
                            </div>
                            
                            {/* Barre de recherche */}
                            <div className="mb-6">
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un patient par nom, prénom ou numéro de sécurité sociale..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            {/* Messages d'erreur */}
                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-red-800 text-sm">{error}</span>
                                        <button
                                            onClick={() => setError(null)}
                                            className="text-red-600 hover:text-red-800 text-lg"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Liste des patients */}
                            <div className="space-y-3">
                                {loadingPatients ? (
                                    <div className="text-center py-8">
                                        <FaSpinner className="animate-spin mx-auto text-blue-500 text-2xl mb-2" />
                                        <p className="text-gray-600">Chargement des patients...</p>
                                    </div>
                                ) : patients.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FaUser className="mx-auto text-gray-400 text-3xl mb-2" />
                                        <p className="text-gray-600">Aucun patient trouvé</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {error ? 'Erreur lors du chargement' : 'Vous n\'avez pas encore de patients assignés'}
                                        </p>
                                        {!error && (
                                            <button
                                                onClick={loadPatients}
                                                className="mt-3 text-blue-600 hover:text-blue-800 text-sm underline"
                                            >
                                                Réessayer
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    patients
                                        .filter(patient => {
                                            const searchLower = searchTerm.toLowerCase();
                                            const nom = (patient.nom || '').toLowerCase();
                                            const prenom = (patient.prenom || '').toLowerCase();
                                            const numeroAssure = (patient.numero_assure || patient.numero_securite_sociale || '').toLowerCase();
                                            
                                            return nom.includes(searchLower) || 
                                                   prenom.includes(searchLower) || 
                                                   numeroAssure.includes(searchLower);
                                        })
                                        .map(patient => {
                                            // Gérer différents formats de données patient
                                            const patientId = patient.id || patient.id_patient;
                                            const nom = patient.nom || 'N/A';
                                            const prenom = patient.prenom || 'N/A';
                                            const numeroAssure = patient.numero_assure || patient.numero_securite_sociale || 'N/A';
                                            
                                            return (
                                                <div
                                                    key={patientId}
                                                    onClick={() => handleSelectPatient(patientId)}
                                                    className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <FaUser className="text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">
                                                                    {prenom} {nom}
                                                                </h4>
                                                                <p className="text-sm text-gray-600">
                                                                    N° Sécurité Sociale: {numeroAssure}
                                                                </p>
                                                                {patient.date_naissance && (
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        Né(e) le: {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-blue-600">
                                                            <FaComments className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Interface de messagerie avec ChatMessage */}
                    {userId && role && jwtToken && showMessaging && (
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        {selectedPatientId ? 'Nouvelle conversation' : 'Conversations existantes'}
                                    </h3>
                                    {selectedPatientId && (
                                        <div className="text-sm text-gray-600 mt-1">
                                            <p className="font-medium">
                                                Patient sélectionné: {patients.find(p => (p.id || p.id_patient) === selectedPatientId)?.prenom} {patients.find(p => (p.id || p.id_patient) === selectedPatientId)?.nom}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                ID: {selectedPatientId}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center space-x-3">
                                    {/* Boutons WebRTC - Appels vidéo et audio */}
                                    {selectedPatientId && (
                                        <div className="flex space-x-2 mr-4">
                                            <button
                                                onClick={() => handleStartVideoCall(selectedPatientId)}
                                                disabled={activeCall !== null}
                                                className={`p-3 rounded-lg transition-colors flex items-center space-x-2 ${
                                                    activeCall ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                                                }`}
                                                title={activeCall ? "Appel en cours..." : "Démarrer un appel vidéo avec le patient"}
                                            >
                                                <FaVideo className="w-4 h-4" />
                                                <span className="text-sm">Appel Vidéo</span>
                                            </button>
                                            
                                        </div>
                                    )}
                                    <button
                                        onClick={handleCloseMessaging}
                                        className="text-gray-500 hover:text-gray-700 text-sm"
                                    >
                                        ← Retour
                                    </button>
                                </div>
                            </div>
                            
                            <div className="h-96">
                                <ChatMessage
                                    userId={userId}
                                    role={role}
                                    token={jwtToken}
                                    conversationId={selectedConversationId}
                                    patientId={selectedPatientId}
                                />
                            </div>
                        </div>
                    )}

                    {/* Interface d'appel WebRTC */}
                    {console.log('🔍 RENDU - activeCall:', activeCall, 'callStatus:', callStatus, 'Type:', typeof activeCall)}
                    {activeCall && (
                        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        Appel {activeCall.type === 'video' ? 'Vidéo' : 'Audio'} - {activeCall.patientName}
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            callStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                                            callStatus === 'connected' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {callStatus === 'connecting' ? 'Connexion...' :
                                             callStatus === 'connected' ? 'Connecté' : 'En cours'}
                                        </span>
                                        <button
                                            onClick={handleEndCall}
                                            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                                            title="Terminer l'appel"
                                        >
                                            Terminer
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Affichage du code de conférence */}
                                {conferenceLink && (
                                    <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-green-600">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                                <span className="text-sm font-medium text-green-800">Code de conférence généré</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(conferenceLink);
                                                    // Afficher une notification de copie
                                                    setError(null); // Nettoyer les erreurs précédentes
                                                    setTimeout(() => {
                                                        setError('Code de conférence copié !');
                                                        setTimeout(() => setError(null), 2000);
                                                    }, 100);
                                                }}
                                                className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                                                title="Copier le code"
                                            >
                                                Copier
                                            </button>
                                        </div>
                                        <div className="mt-3 text-center">
                                            <div className="bg-white border-2 border-green-300 rounded-lg p-4 inline-block">
                                                <p className="text-xs text-green-600 mb-1">Code de conférence</p>
                                                <p className="text-2xl font-bold text-green-800 font-mono tracking-wider">
                                                    {conferenceLink}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-center">
                                            <p className="text-xs text-green-600">
                                                Partagez ce code avec le patient pour qu'il puisse rejoindre l'appel
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* WebRTCWidget: gère le flux vidéo et l'offre SDP */}
                                    {activeCall.type === 'video' && (
                                        <div className="lg:col-span-2">
                                            <WebRTCWidget
                                                conversationId={activeCall.conversationId}
                                                isInitiator={true}
                                                onClose={handleEndCall}
                                            />
                                        </div>
                                    )}
                                    
                                    {/* Interface audio retirée */}
                                </div>
                                
                                                                 <div className="mt-6 text-center text-sm text-gray-600">
                                     <p>Session ID: {activeCall.sessionId}</p>
                                     <p>Patient: {activeCall.patientName}</p>
                                 </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Fallback si pas d'authentification */}
                    {(!userId || !role || !jwtToken) && (
                        <div className="text-center py-8">
                            <div className="text-yellow-600 mb-4">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-yellow-800 mb-2">Authentification requise</h3>
                            <p className="text-yellow-700">
                                Veuillez vous connecter pour accéder à la messagerie sécurisée.
                            </p>
                        </div>
                    )}
                </div>
            );
        }
        
        // dashboard par défaut
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Section principale du tableau de bord */}
                <div className="lg:col-span-2 space-y-6">
                                         <h2 className="text-xl font-semibold">Tableau de Bord</h2>
                     

                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FaCalendarAlt className="w-6 h-6 text-green-600" />
                                </div>
                                                                 <div className="ml-4">
                                     {loading ? <FaSpinner className="animate-spin" /> : <p className="text-2xl font-semibold">{dashboardStats.rendezVous}</p>}
                                     <p className="text-gray-600">Rendez-vous</p>
                                 </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <FaComments className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div className="ml-4">
                                    {loading ? <FaSpinner className="animate-spin" /> : <p className="text-2xl font-semibold">{dashboardStats.messagesPatients}</p>}
                                    <p className="text-gray-600">Conversations</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Widget des messages récents */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Messages Récents</h3>
                            <button onClick={() => setActiveSection('messaging')} className="text-blue-600 hover:text-blue-800 text-sm">Voir tout</button>
                        </div>
                        <div className="space-y-3">
                            {loading ? <div className="text-center p-4"><FaSpinner className="animate-spin mx-auto" /></div> :
                                recentMessages.length > 0 ? (
                                    recentMessages.slice(0, 3).map((msg) => ( // Afficher les 3 plus récents
                                        <div key={msg.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                            <p className="font-semibold text-sm">{msg.patient?.prenom} {msg.patient?.nom}</p>
                                            <p className="text-gray-600 text-sm truncate">{msg.content}</p>
                                            <p className="text-xs text-gray-400 mt-1 text-right">{new Date(msg.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">Aucun message récent.</p>
                                )}
                        </div>
                        
                        {/* Bouton d'accès rapide à la messagerie */}
                        {userId && role && jwtToken && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setActiveSection('messaging')}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <FaComments className="w-4 h-4" />
                                    <span>Accéder à la messagerie</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <ProtectedMedecinRoute>
            <div className="min-h-screen bg-gray-50">
                <MedHeader />

                {/* Navigation */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex space-x-8">
                            {['dashboard', 'messaging'].map((section) => (
                                <button
                                    key={section}
                                    onClick={() => setActiveSection(section)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeSection === section
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {section === 'dashboard' ? <FaChartBar className="inline mr-2" /> : <FaComments className="inline mr-2" />}
                                    {section === 'dashboard' ? 'Tableau de Bord' : 'Messagerie'}
                                </button>
                            ))}
                            
                            {/* Indicateur de statut de connexion */}
                            <div className="ml-auto flex items-center space-x-2">
                                {userId && role && jwtToken ? (
                                    <div className="flex items-center space-x-2 text-green-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm">Connecté</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2 text-red-600">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span className="text-sm">Non connecté</span>
                                    </div>
                                )}
                            </div>
                        </nav>
                    </div>
                </div>

                {/* Contenu principal */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {renderContent()}
                </main>
            </div>
        </ProtectedMedecinRoute>
    );
}

export default Medecin;