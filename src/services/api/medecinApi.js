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
        // Prioriser les JWT de première connexion et rejeter les tokens temporaires
        const candidates = [
            localStorage.getItem('originalJWT'),
            localStorage.getItem('firstConnectionToken'),
            localStorage.getItem('jwt'),
            localStorage.getItem('token'),
        ];
        
        let usedToken = null;
        for (const candidate of candidates) {
            if (
                candidate &&
                candidate.startsWith('eyJ') &&
                candidate.length > 100 &&
                !candidate.startsWith('temp_') &&
                !candidate.startsWith('auth_')
            ) {
                usedToken = candidate;
                break;
            }
        }
        
        if (usedToken) {
            config.headers.Authorization = `Bearer ${usedToken}`;
            console.log('🔐 [medecinApi] JWT valide utilisé pour Authorization:', `${usedToken.substring(0, 20)}...`);
        } else {
            console.warn('⚠️ [medecinApi] Aucun JWT valide disponible pour l\'authentification');
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Service pour les données du médecin
class MedecinService {
    // Récupérer l'ID de session du médecin connecté
    getMedecinSessionId() {
        try {
            const medecinData = localStorage.getItem('medecin');
            if (medecinData) {
                const medecin = JSON.parse(medecinData);
                return medecin.id_professionnel || medecin.id || 'default';
            }
            return 'default';
        } catch (error) {
            console.error('❌ Erreur lors de la récupération de l\'ID de session:', error);
            return 'default';
        }
    }

    // Récupérer les statistiques du médecin
    async getDashboardStats() {
        try {
            const response = await api.get('/medecin/dashboard/stats');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des statistiques:', error);
            // Retourner des statistiques vides en cas d'erreur (plus de données simulées)
            throw error;
        }
    }

    // Récupérer les messages récents des patients
    async getRecentMessages(limit = 5) {
        try {
            const response = await api.get(`/medecin/messages/recent?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des messages récents:', error);
            throw error;
        }
    }

    // Récupérer les patients du médecin
    async getPatients(searchTerm = '', page = 1, limit = 20) {
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            params.append('page', page);
            params.append('limit', limit);
            
            const response = await api.get(`/medecin/patients?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des patients:', error);
            throw error;
        }
    }

    // Récupérer l'agenda du médecin
    async getAgenda(date = null, page = 1, limit = 20) {
        try {
            const params = new URLSearchParams();
            if (date) params.append('date', date);
            params.append('page', page);
            params.append('limit', limit);
            
            const response = await api.get(`/medecin/agenda?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération de l\'agenda:', error);
            throw error;
        }
    }

    // Récupérer les notifications du médecin via la route existante des prescriptions
    async getNotifications(page = 1, limit = 20) {
        try {
            const sessionId = this.getMedecinSessionId();
            const url = `/prescription/notifications?professionnel_id=${sessionId}&page=${page}&limit=${limit}`;
            
            console.log('🔍 Récupération des notifications via:', url);
            console.log('🔍 Session ID du médecin:', sessionId);
            
            const response = await api.get(url);
            console.log('✅ Notifications récupérées avec succès:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des notifications:', error);
            console.error('  - URL tentée:', `/prescription/notifications?professionnel_id=${this.getMedecinSessionId()}`);
            console.error('  - Session ID:', this.getMedecinSessionId());
            console.error('  - Erreur complète:', error.response?.status, error.response?.data);
            
            // Plus de notifications par défaut - laisser l'erreur se propager
            throw error;
        }
    }

    // Marquer une notification comme lue via la route existante des prescriptions
    async markNotificationAsRead(notificationId) {
        try {
            const sessionId = this.getMedecinSessionId();
            const url = `/prescription/notifications/${notificationId}/read`;
            
            console.log('🔍 Marquage de notification comme lue via:', url);
            const response = await api.patch(url);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors du marquage de la notification:', error);
            throw error;
        }
    }
}

export default new MedecinService();
