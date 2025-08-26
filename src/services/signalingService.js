import { io } from 'socket.io-client';

// Fonction améliorée pour récupérer le token d'authentification valide
const getValidAuthToken = () => {
    // Priorité 1: Token principal (token ou jwt)
    const mainToken = localStorage.getItem('token') || localStorage.getItem('jwt');
    if (mainToken) {
        console.log('🔑 SignalingService - Token principal trouvé:', mainToken.substring(0, 20) + '...');
        return mainToken;
    }
    
    // Priorité 2: Vérifier s'il y a un patient connecté avec son token
    const patientData = localStorage.getItem('patient');
    if (patientData) {
        try {
            const patient = JSON.parse(patientData);
            if (patient.token) {
                console.log('🔑 SignalingService - Token patient trouvé:', patient.token.substring(0, 20) + '...');
                return patient.token;
            }
        } catch (error) {
            console.warn('⚠️ SignalingService - Erreur parsing données patient:', error);
        }
    }
    
    // Priorité 3: Vérifier s'il y a un médecin connecté avec son token
    const medecinData = localStorage.getItem('medecin');
    if (medecinData) {
        try {
            const medecin = JSON.parse(medecinData);
            if (medecin.token) {
                console.log('🔑 SignalingService - Token médecin trouvé:', medecin.token.substring(0, 20) + '...');
                return medecin.token;
            }
        } catch (error) {
            console.warn('⚠️ SignalingService - Erreur parsing données médecin:', error);
        }
    }
    
    console.warn('⚠️ SignalingService - Aucun token valide trouvé');
    return null;
};

class SignalingService {
    socket = null;
    baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

    connect() {
        // Ne crée qu'une seule instance de socket
        if (this.socket) {
            console.log('🔍 SignalingService - Socket déjà connecté, réutilisation de l\'instance existante');
            return this.socket;
        }

        const token = getValidAuthToken();
        if (!token) {
            console.error("❌ SignalingService - Connexion impossible, token manquant.");
            return null;
        }
        
        // Déterminer le type d'utilisateur pour les logs
        let userType = 'inconnu';
        let userId = 'inconnu';
        
        const patientData = localStorage.getItem('patient');
        const medecinData = localStorage.getItem('medecin');
        
        if (patientData) {
            try {
                const patient = JSON.parse(patientData);
                userType = 'patient';
                userId = patient.id_patient || patient.id || 'inconnu';
            } catch (error) {
                console.warn('⚠️ SignalingService - Erreur parsing patient data:', error);
            }
        } else if (medecinData) {
            try {
                const medecin = JSON.parse(medecinData);
                userType = 'médecin';
                userId = medecin.id_professionnel || medecin.id || 'inconnu';
            } catch (error) {
                console.warn('⚠️ SignalingService - Erreur parsing medecin data:', error);
            }
        }
        
        console.log(`🚀 SignalingService - Tentative de connexion Socket.IO pour ${userType} (ID: ${userId}) à:`, this.baseURL);
        console.log(`🔑 SignalingService - Token utilisé: ${token.substring(0, 20)}...`);
        
        // Connexion Socket.IO à l'endpoint principal
        this.socket = io(this.baseURL, { 
            auth: { token },
            transports: ['websocket', 'polling'], // Fallback sur polling si websocket échoue
            path: '/socket.io/', // Chemin par défaut de Socket.IO
            timeout: 20000, // Timeout de 20 secondes
            forceNew: true // Forcer une nouvelle connexion
        });

        this.socket.on('connect', () => {
            console.log('✅ Service de signalisation connecté avec succès');
            console.log('  - Socket ID:', this.socket.id);
            console.log('  - URL:', this.baseURL);
            console.log('  - Transport:', this.socket.io.engine.transport.name);
        });
        
        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Service de signalisation déconnecté:', reason);
        });
        
        this.socket.on('connect_error', (err) => {
            console.error('❌ Erreur de connexion au service:', err.message);
            console.error('  - Détails:', err);
            console.error('  - Vérifiez que le serveur supporte Socket.IO');
        });

        return this.socket;
    }

    // Méthode générique pour envoyer un événement
    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        } else {
            console.error(`Impossible d'émettre l'événement '${event}', le socket n'est pas connecté.`);
        }
    }

    // Méthode générique pour écouter un événement
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    // Méthode pour nettoyer un listener
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    // ===== NOUVELLES MÉTHODES POUR L'API MESSAGING =====

    // Récupérer les conversations de l'utilisateur
    async getUserConversations() {
        try {
            const token = getValidAuthToken();
            const response = await fetch(`${this.baseURL}/api/messaging/conversations`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
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

    // Récupérer les messages d'une conversation
    async getConversationMessages(conversationId, page = 1, limit = 50) {
        try {
            const token = getValidAuthToken();
            const response = await fetch(
                `${this.baseURL}/api/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
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
                messages: data.data?.messages || [],
                pagination: data.data?.pagination || {}
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des messages:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Envoyer un message dans une conversation
    async sendMessage(conversationId, content, type = 'texte', metadata = {}) {
        try {
            const token = getValidAuthToken();
            const response = await fetch(
                `${this.baseURL}/api/messaging/conversations/${conversationId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
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
            
            // Émettre l'événement WebSocket pour la diffusion en temps réel
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

    // Créer une nouvelle conversation
    async createConversation(participants, type = 'patient_medecin', titre = null) {
        try {
            const token = getValidAuthToken();
            const { patient_id, professionnel_id } = participants;
            
            const response = await fetch(`${this.baseURL}/api/messaging/conversations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patient_id,
                    professionnel_id,
                    type_conversation: type,
                    titre: titre || `Conversation ${patient_id}-${professionnel_id}`
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
            console.error('Erreur lors de la création de conversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Récupérer les conversations avec messages non lus
    async getUnreadConversations() {
        try {
            const token = getValidAuthToken();
            const response = await fetch(`${this.baseURL}/api/messaging/conversations/unread`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
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
            console.error('Erreur lors de la récupération des conversations non lues:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Marquer un message comme lu
    async markMessageAsRead(messageId) {
        try {
            const token = getValidAuthToken();
            const response = await fetch(
                `${this.baseURL}/api/messaging/messages/${messageId}/read`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Erreur lors du marquage du message:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Méthodes WebSocket pour la messagerie
    joinConversation(conversationId) {
        this.emit('join_conversation', { conversationId });
    }

    leaveConversation(conversationId) {
        this.emit('leave_conversation', { conversationId });
    }

    setUserPresence(status = 'online') {
        this.emit('user_presence', { status });
    }

    // Méthodes pour la compatibilité avec l'ancien code
    connectSocket(userId, userType, token) {
        console.log('🔍 SignalingService - connectSocket appelé avec:', { 
            userId, 
            userType, 
            token: !!token,
            tokenLength: token ? token.length : 0
        });
        
        // Vérifier si on a déjà un token valide
        const currentToken = getValidAuthToken();
        console.log('🔍 SignalingService - Token actuel disponible:', !!currentToken);
        
        try {
            const socket = this.connect();
            if (socket) {
                console.log('✅ SignalingService - Connexion Socket.IO réussie');
                console.log('  - Socket ID:', socket.id);
                console.log('  - User Type:', userType);
                console.log('  - User ID:', userId);
                return socket;
            } else {
                console.error('❌ SignalingService - Échec de la connexion Socket.IO');
                return null;
            }
        } catch (error) {
            console.error('❌ SignalingService - Erreur lors de la connexion Socket.IO:', error);
            return null;
        }
    }

    closeConnection() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Méthode de diagnostic pour vérifier l'état de l'authentification
    diagnoseAuthState() {
        console.log('🔍 SignalingService - Diagnostic de l\'état d\'authentification:');
        
        const token = localStorage.getItem('token');
        const jwt = localStorage.getItem('jwt');
        const patientData = localStorage.getItem('patient');
        const medecinData = localStorage.getItem('medecin');
        
        console.log('  - token principal:', token ? '✅ Présent' : '❌ Absent');
        console.log('  - jwt:', jwt ? '✅ Présent' : '❌ Absent');
        console.log('  - patient data:', patientData ? '✅ Présent' : '❌ Absent');
        console.log('  - medecin data:', medecinData ? '✅ Présent' : '❌ Absent');
        
        if (patientData) {
            try {
                const patient = JSON.parse(patientData);
                console.log('  - Patient ID:', patient.id_patient || patient.id);
                console.log('  - Patient token:', patient.token ? '✅ Présent' : '❌ Absent');
            } catch (error) {
                console.warn('  - Erreur parsing patient data:', error);
            }
        }
        
        if (medecinData) {
            try {
                const medecin = JSON.parse(medecinData);
                console.log('  - Médecin ID:', medecin.id_professionnel || medecin.id);
                console.log('  - Médecin token:', medecin.token ? '✅ Présent' : '❌ Absent');
            } catch (error) {
                console.warn('  - Erreur parsing medecin data:', error);
            }
        }
        
        const validToken = getValidAuthToken();
        console.log('  - Token valide trouvé:', validToken ? '✅ Oui' : '❌ Non');
        
        return {
            hasValidToken: !!validToken,
            token: validToken,
            userType: patientData ? 'patient' : medecinData ? 'medecin' : 'unknown'
        };
    }

    onMessageReceived(callback) {
        this.on('new_message', callback);
    }

    onNotification(callback) {
        this.on('notification', callback);
    }
}

// Exporter une instance unique pour toute l'application
const signalingService = new SignalingService();
export default signalingService;