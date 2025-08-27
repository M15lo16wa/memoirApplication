import { io } from 'socket.io-client';

/**
 * Récupération COMPLÈTE de tous les tokens disponibles
 */
const getAllAvailableTokens = () => {
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

    // Log de diagnostic
    console.log('�� TOKENS DISPONIBLES:', {
        jwt: tokens.jwt ? '✅ Présent' : '❌ Absent',
        token: tokens.token ? '✅ Présent' : '❌ Absent',
        patient: tokens.patient ? `✅ ID: ${tokens.patientId}` : '❌ Absent',
        medecin: tokens.medecin ? `✅ ID: ${tokens.medecinId}` : '❌ Absent',
        userType: tokens.userType || '❌ Non déterminé',
        primaryToken: tokens.primaryToken ? '✅ Disponible' : '❌ Absent'
    });

    return tokens;
};

/**
 * Service de signalisation avec récupération complète des tokens
 */
class SignalingService {
    socket = null;
    baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    tokens = null;
    userInfo = null;

    /**
     * Initialiser le service avec tous les tokens disponibles
     */
    initialize() {
        this.tokens = getAllAvailableTokens();
        this.userInfo = {
            userType: this.tokens.userType,
            userId: this.tokens.userId,
            role: this.tokens.professionnelRole,
            primaryToken: this.tokens.primaryToken
        };

        console.log('🚀 Service de signalisation initialisé avec:', this.userInfo);
        return this;
    }

    /**
     * Se connecter au WebSocket avec le token approprié
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

        console.log('🔌 Tentative de connexion WebSocket...');
        
        this.socket = io(`${this.baseURL}/messaging`, {
            auth: {
                token: this.tokens.primaryToken,
                userType: this.userInfo.userType,
                userId: this.userInfo.userId,
                role: this.userInfo.role
            },
            transports: ['websocket'],
            timeout: 10000
        });

        this.setupSocketListeners();
        return true;
    }

    /**
     * Se connecter au WebSocket avec des paramètres spécifiques
     * Compatible avec l'ancien code qui appelle connectSocket
     */
    connectSocket(userId, role, token) {
        // Initialiser le service si ce n'est pas déjà fait
        if (!this.tokens) {
            this.initialize();
        }

        // Si des paramètres spécifiques sont fournis, les utiliser
        if (userId && role && token) {
            this.userInfo = {
                userType: role === 'patient' ? 'patient' : 'medecin',
                userId: userId,
                role: role,
                primaryToken: token
            };
            this.tokens.primaryToken = token;
        }

        // Se connecter
        this.connect();
        
        // Retourner le socket pour compatibilité
        return this.socket;
    }

    /**
     * Configurer tous les écouteurs d'événements
     */
    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('✅ Service de signalisation connecté pour:', {
                userType: this.userInfo.userType,
                userId: this.userInfo.userId,
                role: this.userInfo.role
            });
            
            // Émettre l'événement de présence
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
            console.error('❌ Erreur de connexion WebSocket:', error.message);
            
            // Tentative de reconnexion automatique
            if (error.message.includes('token') || error.message.includes('auth')) {
                console.log('�� Tentative de reconnexion avec nouveau token...');
                setTimeout(() => {
                    this.refreshTokensAndReconnect();
                }, 2000);
            }
        });

        // Écouter les événements de messagerie
        this.socket.on('new_message', (data) => {
            console.log('�� Nouveau message reçu:', data);
            this.handleNewMessage(data);
        });

        this.socket.on('notification', (data) => {
            console.log('�� Notification reçue:', data);
            this.handleNotification(data);
        });

        this.socket.on('user_status_change', (data) => {
            console.log('�� Changement de statut utilisateur:', data);
            this.handleUserStatusChange(data);
        });
    }

    /**
     * Rafraîchir les tokens et se reconnecter
     */
    refreshTokensAndReconnect() {
        console.log('🔄 Rafraîchissement des tokens...');
        this.tokens = getAllAvailableTokens();
        this.userInfo = {
            userType: this.tokens.userType,
            userId: this.tokens.userId,
            role: this.tokens.professionnelRole,
            primaryToken: this.tokens.primaryToken
        };
        
        if (this.tokens.primaryToken) {
            this.connect();
        }
    }

    /**
     * Émettre un événement WebSocket
     */
    emit(event, data) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
        } else {
            console.error(`❌ Impossible d'émettre '${event}', socket non connecté`);
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

    // ===== MÉTHODES DE MESSAGERIE =====

    /**
     * Récupérer les conversations de l'utilisateur connecté
     */
    async getUserConversations() {
        try {
            const response = await fetch(`${this.baseURL}/api/messaging/conversations`, {
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
            console.error('❌ Erreur lors de la récupération des conversations:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Envoyer un message
     */
    async sendMessage(conversationId, content, type = 'texte', metadata = {}) {
        try {
            const response = await fetch(
                `${this.baseURL}/api/messaging/conversations/${conversationId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.tokens.primaryToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contenu: content,
                        type_message: type,
                        metadata
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
            console.error('❌ Erreur lors de l\'envoi du message:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ===== GESTION DES ÉVÉNEMENTS =====

    handleNewMessage(data) {
        // Gérer les nouveaux messages
        console.log('�� Traitement nouveau message:', data);
    }

    handleNotification(data) {
        // Gérer les notifications
        console.log('🔔 Traitement notification:', data);
    }

    handleUserStatusChange(data) {
        // Gérer les changements de statut
        console.log('👤 Traitement changement statut:', data);
    }

    // ===== MÉTHODES UTILITAIRES =====

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
        if (!this.socket) return 'disconnected';
        if (this.socket.connected) return 'connected';
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

    /**
     * Créer une conversation
     */
    async createConversation(participants, type = 'private') {
        try {
            const response = await fetch(`${this.baseURL}/api/messaging/conversations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.tokens.primaryToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    participants,
                    type
                })
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
            console.error('❌ Erreur lors de la création de la conversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtenir les messages d'une conversation
     */
    async getConversationMessages(conversationId, page = 1, limit = 50) {
        try {
            const response = await fetch(
                `${this.baseURL}/api/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
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
            console.error('❌ Erreur lors de la récupération des messages:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }




}

// Exporter une instance unique
const signalingService = new SignalingService();
export default signalingService;