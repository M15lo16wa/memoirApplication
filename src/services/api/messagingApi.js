import axios from "axios";

const API_URL = "http://localhost:3000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwt') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

class MessagingApi {
    // Créer une nouvelle conversation
    async createConversation(patientId, medecinId, type = 'patient_medecin') {
        try {
            console.log('🔍 Envoi requête création conversation:', { patientId, medecinId, type });
            const response = await api.post('/messaging/conversations', {
                patientId,
                medecinId,
                type
            });
            console.log('📨 Réponse serveur création conversation:', {
                status: response.status,
                data: response.data
            });
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la création de conversation:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    }

    // Récupérer les conversations d'un utilisateur
    async getUserConversations(userId, userRole) {
        try {
            const response = await api.get(`/messaging/conversations/${userRole}/${userId}`, {
                // Empêcher la mise en cache avec un paramètre timestamp
                params: { _: Date.now() }
            });
            console.log('💬 Réponse serveur conversations:', { status: response.status, data: response.data });

            // Normaliser la réponse
            let conversations;
            if (Array.isArray(response.data)) {
                conversations = response.data;
            } else {
                conversations = response.data?.conversations || response.data?.data?.conversations || [];
            }

            return { success: true, conversations };
        } catch (error) {
            if (error.response && error.response.status === 304) {
                console.warn('⚠️ Conversations non modifiées (304) - maintien de l\'état actuel');
                return { success: true, conversations: [] };
            }
            console.error('❌ Erreur lors de la récupération des conversations:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    }

    // Récupérer les messages d'une conversation
    async getConversationMessages(conversationId, limit = 50, offset = 0) {
        try {
            const response = await api.get(`/messaging/conversations/${conversationId}/messages`, {
                // Empêcher la mise en cache avec un paramètre timestamp
                params: { limit, offset, _: Date.now() }
            });
            console.log('📨 Réponse serveur messages:', { status: response.status, data: response.data });

            // Normaliser la réponse
            let messages;
            if (Array.isArray(response.data)) {
                messages = response.data;
            } else {
                messages = response.data?.messages || response.data?.data?.messages || [];
            }

            return { success: true, messages };
        } catch (error) {
            if (error.response && error.response.status === 304) {
                console.warn('⚠️ Messages non modifiés (304) - maintien de l\'état actuel');
                return { success: true, messages: [] };
            }
            console.error('❌ Erreur lors de la récupération des messages:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    }

    // Envoyer un message
    async sendMessage(conversationId, content, type = 'text') {
        try {
            console.log('📤 Envoi message:', { conversationId, content, type });
            const response = await api.post(`/messaging/conversations/${conversationId}/messages`, {
                content,
                type
            });
            console.log('📨 Réponse serveur envoi message:', { status: response.status, data: response.data });

            // Normaliser la réponse
            let message;
            if (response.data && (response.data.id || response.data.id_message)) {
                // Réponse directe du serveur (objet message)
                message = response.data;
            } else if (response.data && response.data.message) {
                // Réponse avec structure success/message
                message = response.data.message;
            } else {
                // Créer un message temporaire si la structure n'est pas reconnue
                message = {
                    id: `temp_${Date.now()}`,
                    content: content,
                    type: type,
                    timestamp: new Date().toISOString(),
                    sender: 'user' // Sera déterminé côté composant
                };
            }

            return { success: true, message };
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi du message:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    }

    // Récupérer les messages récents (pour les médecins)
    async getRecentMessages(limit = 5) {
        try {
            const response = await api.get(`/messaging/messages/recent?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des messages récents:', error);
            throw error;
        }
    }
}

export default new MessagingApi();
