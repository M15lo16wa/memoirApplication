// src/services/signalingService.js
import { io } from 'socket.io-client';

/**
 * Service de signalisation adapté pour utiliser les endpoints du module de messagerie médecin-patient
 * Compatible avec le serveur central sur http://localhost:3000
 */
class SignalingService {
    socket = null;
    // Configuration pour le serveur central
    centralApiBaseURL = 'http://localhost:3000'; // Serveur central local
    tokens = null;
    userInfo = null;

    /**
     * Récupération COMPLÈTE de tous les tokens disponibles
     */
    getAllAvailableTokens() {
        const tokens = {
            // Tokens généraux
            jwt: localStorage.getItem('jwt'),
            token: localStorage.getItem('token'),
            
            // Token patient
            patient: null,
            patientId: null,
            patientRole: 'patient',
            
            // Token médecin
            medecin: null,
            medecinId: null,
            medecinRole: 'medecin',
            
            // Token professionnel de santé
            professionnel: null,
            professionnelId: null,
            professionnelRole: null,
            
            // Informations utilisateur
            userType: null,
            userId: null,
            primaryToken: null
        };

        // Récupérer les données patient
        try {
            const patientData = localStorage.getItem('patient');
            if (patientData) {
                const patient = JSON.parse(patientData);
                tokens.patient = patient;
                tokens.patientId = patient.id_patient;
                tokens.userType = 'patient';
                tokens.userId = patient.id_patient;
                tokens.professionnelRole = 'patient';
            }
        } catch (e) {
            console.error('Erreur parsing patient data:', e);
        }

        // Récupérer les données médecin
        try {
            const medecinData = localStorage.getItem('medecin');
            if (medecinData) {
                const medecin = JSON.parse(medecinData);
                tokens.medecin = medecin;
                tokens.medecinId = medecin.id_professionnel;
                tokens.userType = 'medecin';
                tokens.userId = medecin.id_professionnel;
                tokens.professionnelRole = 'medecin';
            }
        } catch (e) {
            console.error('Erreur parsing medecin data:', e);
        }

        // Déterminer le token principal à utiliser
        if (tokens.jwt) {
            tokens.primaryToken = tokens.jwt;
        } else if (tokens.token) {
            tokens.primaryToken = tokens.token;
        } else if (tokens.patient?.token) {
            tokens.primaryToken = tokens.patient.token;
        } else if (tokens.medecin?.token) {
            tokens.primaryToken = tokens.medecin.token;
        }

        return tokens;
    }

    /**
     * Initialiser le service avec tous les tokens disponibles
     */
    initialize() {
        this.tokens = this.getAllAvailableTokens();
        this.userInfo = {
            userType: this.tokens.userType,
            userId: this.tokens.userId,
            role: this.tokens.professionnelRole,
            primaryToken: this.tokens.primaryToken
        };

        console.log('🚀 Service de signalisation initialisé avec:', this.userInfo);
        console.log('🔗 URL configurée:', {
            centralApi: this.centralApiBaseURL
        });
        return this;
    }

    /**
     * Se connecter au WebSocket du serveur central
     */
    connect() {
        if (this.socket) {
            console.log('🔄 Reconnexion du service de signalisation...');
            this.socket.disconnect();
        }

        if (!this.tokens.primaryToken) {
            console.error('❌ Aucun token valide disponible pour la connexion');
            return false;
        }

        console.log('🔌 Tentative de connexion WebSocket serveur central...');
        
        try {
            this.socket = io(this.centralApiBaseURL, {
                auth: {
                    token: this.tokens.primaryToken,
                    userType: this.userInfo.userType,
                    userId: this.userInfo.userId,
                    role: this.userInfo.role
                },
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true,
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000,
                upgrade: true,
                rememberUpgrade: false
            });

            this.setupSocketListeners();
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la création de la connexion WebSocket:', error);
            return false;
        }
    }

    /**
     * Se connecter au WebSocket avec des paramètres spécifiques
     */
    connectSocket(userId, role, token) {
        if (!this.tokens) {
            this.initialize();
        }

        if (userId && role && token) {
            this.userInfo = {
                userType: role === 'patient' ? 'patient' : 'medecin',
                userId: userId,
                role: role,
                primaryToken: token
            };
            this.tokens.primaryToken = token;
        }

        this.connect();
        return this.socket;
    }

    /**
     * Configurer tous les écouteurs d'événements
     */
    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('✅ Connexion WebSocket serveur central établie');
            console.log('✅ Service de signalisation connecté pour:', {
                userType: this.userInfo.userType,
                userId: this.userInfo.userId,
                role: this.userInfo.role
            });
            
            this.emit('user_online', {
                userId: this.userInfo.userId,
                userType: this.userInfo.userType,
                role: this.userInfo.role
            });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Service de signalisation déconnecté:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Erreur de connexion WebSocket:', error);
        });

        // Écouter les événements de messagerie
        this.socket.on('new_message', (data) => {
            console.log('💬 Nouveau message reçu:', data);
            this.handleNewMessage(data);
        });

        // Écouter les événements WebRTC
        this.socket.on('webrtc_offer', (data) => {
            console.log('🎥 Offre WebRTC reçue:', data);
            this.emit('webrtc:offer', data);
        });

        this.socket.on('webrtc_answer', (data) => {
            console.log('🎥 Réponse WebRTC reçue:', data);
            this.emit('webrtc:answer', data);
        });

        this.socket.on('webrtc_ice_candidates', (data) => {
            console.log('🎥 Candidats ICE reçus:', data);
            this.emit('webrtc:ice_candidates', data);
        });

        this.socket.on('webrtc_session_created', (data) => {
            console.log('🎥 Session WebRTC créée:', data);
            this.emit('webrtc:session_created', data);
        });

        this.socket.on('webrtc_session_ended', (data) => {
            console.log('🎥 Session WebRTC terminée:', data);
            this.emit('webrtc:session_ended', data);
        });
    }

    /**
     * Émettre un événement WebSocket
     */
    emit(event, data) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
        } else {
            console.error(`Impossible d'émettre '${event}', socket non connecté`);
        }
    }

    /**
     * Écouter un événement WebSocket
     */
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    /**
     * Arrêter d'écouter un événement
     */
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    /**
     * Déconnecter le WebSocket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // ===== MÉTHODES DE MESSAGERIE VIA SERVEUR CENTRAL =====

    /**
     * Récupérer les conversations de l'utilisateur via le serveur central
     */
    async getUserConversations() {
        try {
            const endpoint = this.userInfo.userType === 'patient' 
                ? '/api/messaging/medecin-patient/patient/conversations'
                : '/api/messaging/medecin-patient/medecin/conversations';

            const response = await fetch(`${this.centralApiBaseURL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.tokens.primaryToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                conversations: data.data?.conversations || []
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des conversations:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Créer une conversation via le serveur central
     */
    async createConversation(patientId, medecinId, typeConversation = 'prescription_followup') {
        try {
            const endpoint = this.userInfo.userType === 'patient' 
                ? '/api/messaging/medecin-patient/patient/conversations'
                : '/api/messaging/medecin-patient/medecin/conversations';

            const body = this.userInfo.userType === 'patient' 
                ? { professionnelId: medecinId, typeConversation }
                : { patientId, typeConversation };

            const response = await fetch(`${this.centralApiBaseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.tokens.primaryToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                conversation: data.data?.conversation
            };
        } catch (error) {
            console.error('Erreur lors de la création de la conversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Envoyer un message via le serveur central
     */
    async sendMessage(conversationId, content, messageType = 'text', fileData = null) {
        try {
            const response = await fetch(
                `${this.centralApiBaseURL}/api/messaging/medecin-patient/conversations/${conversationId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.tokens.primaryToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: content,
                        messageType: messageType,
                        fileData: fileData
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Émettre l'événement WebSocket
            this.emit('message_sent', {
                conversationId,
                message: data.data?.message
            });

            return {
                success: true,
                message: data.data?.message
            };
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Récupérer les messages d'une conversation via le serveur central
     */
    async getConversationMessages(conversationId, page = 1, limit = 50) {
        try {
            const response = await fetch(
                `${this.centralApiBaseURL}/api/messaging/medecin-patient/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.tokens.primaryToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                messages: data.data?.messages || []
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des messages:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Marquer un message comme lu
     */
    async markMessageAsRead(messageId) {
        try {
            const response = await fetch(
                `${this.centralApiBaseURL}/api/messaging/medecin-patient/messages/${messageId}/read`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.tokens.primaryToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                message: data.data?.message
            };
        } catch (error) {
            console.error('Erreur lors du marquage du message comme lu:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Marquer tous les messages d'une conversation comme lus
     */
    async markAllMessagesAsRead(conversationId) {
        try {
            const response = await fetch(
                `${this.centralApiBaseURL}/api/messaging/medecin-patient/conversations/${conversationId}/read-all`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.tokens.primaryToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                messagesMarkedAsRead: data.data?.messagesMarkedAsRead
            };
        } catch (error) {
            console.error('Erreur lors du marquage de tous les messages comme lus:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ===== MÉTHODES WEBRTC VIA SERVEUR CENTRAL =====

    /**
     * Créer une session WebRTC via le serveur central
     */
    async createWebRTCSession(patientId, sessionType = 'consultation') {
        try {
            const response = await fetch(`${this.centralApiBaseURL}/api/messaging/medecin-patient/webrtc/sessions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.tokens.primaryToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patientId: patientId,
                    sessionType: sessionType
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                session: data.data?.session,
                conferenceCode: data.data?.session?.conference_code,
                conferenceUrl: data.data?.session?.conference_url
            };
        } catch (error) {
            console.error('❌ Erreur lors de la création de la session WebRTC:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Rejoindre une session WebRTC via le serveur central
     */
    async joinWebRTCSession(sessionId) {
        try {
            console.log('🎯 Tentative de jointure de session WebRTC:', sessionId);
            
            const response = await fetch(`${this.centralApiBaseURL}/api/messaging/medecin-patient/webrtc/sessions/${sessionId}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.tokens.primaryToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Émettre l'événement WebSocket pour rejoindre la session
            this.emit('join_webrtc_session', {
                sessionId: sessionId,
                userInfo: this.userInfo
            });

            return {
                success: true,
                session: data.data?.session,
                participant: data.data?.participant
            };
        } catch (error) {
            console.error('❌ Erreur lors de la jointure de session WebRTC:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ===== MÉTHODES D'AUTORISATION =====

    /**
     * Obtenir les patients avec lesquels un médecin peut communiquer
     */
    async getMedecinCommunicablePatients() {
        try {
            const response = await fetch(`${this.centralApiBaseURL}/api/messaging/medecin-patient/medecin/patients`, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.primaryToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                patients: data.data?.patients || []
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des patients:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtenir les médecins avec lesquels un patient peut communiquer
     */
    async getPatientCommunicableMedecins() {
        try {
            const response = await fetch(`${this.centralApiBaseURL}/api/messaging/medecin-patient/patient/medecins`, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.primaryToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                medecins: data.data?.medecins || []
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des médecins:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Vérifier les autorisations de communication
     */
    async checkCommunicationAuthorization(patientId, professionnelId) {
        try {
            const params = new URLSearchParams();
            if (patientId) {
                params.append('patientId', patientId);
            }
            if (professionnelId) {
                params.append('professionnelId', professionnelId);
            }

            const response = await fetch(`${this.centralApiBaseURL}/api/messaging/medecin-patient/authorization/check?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.primaryToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                authorization: data.data?.authorization
            };
        } catch (error) {
            console.error('Erreur lors de la vérification des autorisations:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ===== MÉTHODES UTILITAIRES =====

    /**
     * Récupérer le code de conférence depuis l'URL
     */
    getConferenceCodeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('code');
    }

    /**
     * Récupérer l'ID de session depuis l'URL
     */
    getSessionIdFromURL() {
        const pathParts = window.location.pathname.split('/');
        const conferenceIndex = pathParts.indexOf('conference');
        if (conferenceIndex !== -1 && pathParts[conferenceIndex + 1]) {
            return pathParts[conferenceIndex + 1];
        }
        return null;
    }

    /**
     * Obtenir les informations de l'utilisateur connecté
     */
    getUserInfo() {
        return this.userInfo;
    }

    /**
     * Vérifier si le service est connecté
     */
    isConnected() {
        return this.socket && this.socket.connected;
    }

    /**
     * Obtenir le statut de connexion
     */
    getConnectionStatus() {
        if (!this.socket) {
            return 'disconnected';
        }
        if (this.socket.connected) {
            return 'connected';
        }
        return 'connecting';
    }

    /**
     * Nettoyer les ressources
     */
    cleanup() {
        this.disconnect();
        this.tokens = null;
        this.userInfo = null;
    }

    // ===== MÉTHODES DE COMPATIBILITÉ =====

    /**
     * Rejoindre une conversation
     */
    joinConversation(conversationId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('join_conversation', { conversationId });
            console.log('✅ Rejoint la conversation:', conversationId);
        }
    }

    /**
     * Quitter une conversation
     */
    leaveConversation(conversationId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('leave_conversation', { conversationId });
            console.log('✅ Quitté la conversation:', conversationId);
        }
    }

    /**
     * Fermer la connexion
     */
    closeConnection() {
        if (this.socket) {
            this.socket.disconnect();
            console.log('🔌 Connexion fermée');
        }
    }

    /**
     * Écouter les messages reçus
     */
    onMessageReceived(callback) {
        if (this.socket) {
            this.socket.on('receive_message', callback);
        }
    }

    // ===== GESTION DES ÉVÉNEMENTS =====

    handleNewMessage(data) {
        console.log('Traitement nouveau message:', data);
    }

    handleNotification(data) {
        console.log('Traitement notification:', data);
    }

    /**
     * Diagnostic complet du service
     */
    getDiagnosticInfo() {
        return {
            serviceInitialized: !!this.tokens,
            socketExists: !!this.socket,
            socketConnected: this.socket?.connected || false,
            centralApiBaseURL: this.centralApiBaseURL,
            tokens: this.tokens ? {
                hasJWT: !!this.tokens.jwt,
                hasToken: !!this.tokens.token,
                hasPatient: !!this.tokens.patient,
                hasMedecin: !!this.tokens.medecin,
                hasPrimaryToken: !!this.tokens.primaryToken
            } : null,
            userInfo: this.userInfo,
            connectionStatus: this.socket ? {
                connected: this.socket.connected,
                id: this.socket.id,
                disconnected: this.socket.disconnected
            } : null
        };
    }
}

// Exporter une instance unique
const signalingService = new SignalingService();
export default signalingService;
