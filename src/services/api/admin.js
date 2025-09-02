import axios from "axios";

const API_URL = "http://192.168.4.81:3000/api";

// Configuration de l'API d'administration
const adminApi = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

// Intercepteur pour ajouter le token d'authentification
adminApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || 
                    localStorage.getItem('jwt') || 
                    localStorage.getItem('authToken') ||
                    localStorage.getItem('originalJWT') ||
                    localStorage.getItem('firstConnectionToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs de réponse
adminApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            window.location.href = '/connexion';
        }
        return Promise.reject(error);
    }
);

// ===== CRUD UTILISATEURS =====

// Récupérer tous les utilisateurs avec filtres
export const getAllUsers = async (filters = {}) => {
    try {
        const response = await adminApi.get('/admin/users', { params: filters });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        throw error;
    }
};

// Récupérer un utilisateur par ID
export const getUserById = async (userId) => {
    try {
        const response = await adminApi.get(`/admin/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        throw error;
    }
};

// Créer un nouvel utilisateur
export const createUser = async (userData) => {
    try {
        const response = await adminApi.post('/admin/users', userData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        throw error;
    }
};

// Mettre à jour un utilisateur
export const updateUser = async (userId, userData) => {
    try {
        const response = await adminApi.put(`/admin/users/${userId}`, userData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        throw error;
    }
};

// Supprimer un utilisateur
export const deleteUser = async (userId) => {
    try {
        const response = await adminApi.delete(`/admin/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        throw error;
    }
};

// Activer/Désactiver un utilisateur
export const toggleUserStatus = async (userId, isActive) => {
    try {
        const response = await adminApi.patch(`/admin/users/${userId}/status`, { 
            isActive 
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la modification du statut:', error);
        throw error;
    }
};

// ===== GESTION DES RÔLES ET PERMISSIONS =====

// Récupérer tous les rôles disponibles
export const getAllRoles = async () => {
    try {
        const response = await adminApi.get('/admin/roles');
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des rôles:', error);
        throw error;
    }
};

// Récupérer les permissions d'un rôle
export const getRolePermissions = async (roleId) => {
    try {
        const response = await adminApi.get(`/admin/roles/${roleId}/permissions`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des permissions:', error);
        throw error;
    }
};

// Modifier le rôle d'un utilisateur
export const updateUserRole = async (userId, newRole) => {
    try {
        const response = await adminApi.patch(`/admin/users/${userId}/role`, { 
            role: newRole 
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la modification du rôle:', error);
        throw error;
    }
};

// Créer un nouveau rôle
export const createRole = async (roleData) => {
    try {
        const response = await adminApi.post('/admin/roles', roleData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création du rôle:', error);
        throw error;
    }
};

// Mettre à jour un rôle
export const updateRole = async (roleId, roleData) => {
    try {
        const response = await adminApi.put(`/admin/roles/${roleId}`, roleData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la mise à jour du rôle:', error);
        throw error;
    }
};

// Supprimer un rôle
export const deleteRole = async (roleId) => {
    try {
        const response = await adminApi.delete(`/admin/roles/${roleId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression du rôle:', error);
        throw error;
    }
};

// ===== GESTION DES PROFILS =====

// Récupérer le profil d'un utilisateur
export const getUserProfile = async (userId) => {
    try {
        const response = await adminApi.get(`/admin/users/${userId}/profile`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        throw error;
    }
};

// Mettre à jour le profil d'un utilisateur
export const updateUserProfile = async (userId, profileData) => {
    try {
        const response = await adminApi.put(`/admin/users/${userId}/profile`, profileData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        throw error;
    }
};

// Réinitialiser le mot de passe d'un utilisateur
export const resetUserPassword = async (userId) => {
    try {
        const response = await adminApi.post(`/admin/users/${userId}/reset-password`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la réinitialisation du mot de passe:', error);
        throw error;
    }
};

// ===== GESTION DES PATIENTS =====

// Récupérer tous les patients avec filtres
export const getAllPatients = async (filters = {}) => {
    try {
        const response = await adminApi.get('/patient', { params: filters });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des patients:', error);
        throw error;
    }
};

// Récupérer un patient par ID
export const getPatientById = async (patientId) => {
    try {
        const response = await adminApi.get(`/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du patient:', error);
        throw error;
    }
};

// Créer un nouveau patient
export const createPatient = async (patientData) => {
    try {
        const response = await adminApi.post('/patient', patientData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création du patient:', error);
        throw error;
    }
};

// Mettre à jour un patient
export const updatePatient = async (patientId, patientData) => {
    try {
        const response = await adminApi.put(`/patient/${patientId}`, patientData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la mise à jour du patient:', error);
        throw error;
    }
};

// Supprimer un patient
export const deletePatient = async (patientId) => {
    try {
        const response = await adminApi.delete(`/patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression du patient:', error);
        throw error;
    }
};

// Récupérer l'historique médical d'un patient
export const getPatientMedicalHistory = async (patientId) => {
    try {
        const response = await adminApi.get(`/admin/patients/${patientId}/medical-history`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique médical:', error);
        throw error;
    }
};

// Récupérer les rendez-vous d'un patient
export const getPatientAppointments = async (patientId) => {
    try {
        const response = await adminApi.get(`/admin/patients/${patientId}/appointments`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        throw error;
    }
};

// ===== GESTION DES PROFESSIONNELS DE SANTÉ =====

// Récupérer tous les professionnels de santé
export const getAllHealthcareProfessionals = async (filters = {}) => {
    try {
        console.log('🔍 Récupération des professionnels de santé...');
        console.log('🔍 Filtres appliqués:', filters);
        
        const response = await adminApi.get('/professionnelSante', { params: filters });
        
        if (response.data && response.data.status === 'success') {
            console.log('✅ Succès! Nombre de professionnels:', response.data.results);
            return response.data;
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des professionnels de santé:', error);
        throw error;
    }
};

// Récupérer un professionnel de santé par ID
export const getHealthcareProfessionalById = async (Id) => {
    try {
        const response = await adminApi.get(`/professionnelSante/${Id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du professionnel de santé:', error);
        throw error;
    }
};

// Créer un nouveau professionnel de santé
export const createHealthcareProfessional = async (professionalData) => {
    try {
        const response = await adminApi.post('/professionnelSante', professionalData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création du professionnel de santé:', error);
        throw error;
    }
};

// Mettre à jour un professionnel de santé
export const updateHealthcareProfessional = async (Id, professionalData) => {
    try {
        const response = await adminApi.patch(`/professionnelSante/${Id}`, professionalData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la mise à jour du professionnel de santé:', error);
        throw error;
    }
};

// Supprimer un professionnel de santé
export const deleteHealthcareProfessional = async (Id) => {
    try {
        const response = await adminApi.delete(`/professionnelSante/${Id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression du professionnel de santé:', error);
        throw error;
    }
};

// ===== GESTION DES SERVICES MÉDICAUX =====

// ✅ Routes corrigées
export const getAllMedicalServices = async (filters = {}) => {
    try {
        const response = await adminApi.get('/service-sante', { params: filters });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des services médicaux:', error);
        throw error;
    }
};

export const getMedicalServiceById = async (serviceId) => {
    try {
        const response = await adminApi.get(`/service-sante/${serviceId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du service médical:', error);
        throw error;
    }
};

export const createMedicalService = async (serviceData) => {
    try {
        const response = await adminApi.post('/service-sante', serviceData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création du service médical:', error);
        throw error;
    }
};

export const updateMedicalService = async (serviceId, serviceData) => {
    try {
        const response = await adminApi.patch(`/service-sante/${serviceId}`, serviceData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la mise à jour du service médical:', error);
        throw error;
    }
};

export const deleteMedicalService = async (serviceId) => {
    try {
        const response = await adminApi.delete(`/service-sante/${serviceId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression du service médical:', error);
        throw error;
    }
};

// ===== GESTION DES HÔPITAUX =====

// Récupérer tous les hôpitaux
export const getAllHospitals = async (filters = {}) => {
    try {
        // ✅ Route corrigée
        const response = await adminApi.get('/hopital', { params: filters });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des hôpitaux:', error);
        throw error;
    }
};

// Récupérer un hôpital par ID
export const getHospitalById = async (hospitalId) => {
    try {
        // ✅ Route corrigée
        const response = await adminApi.get(`/hopital/${hospitalId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'hôpital:', error);
        throw error;
    }
};

// Créer un nouvel hôpital
export const createHospital = async (hospitalData) => {
    try {
        // ✅ Route corrigée
        const response = await adminApi.post('/hopital', hospitalData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création de l\'hôpital:', error);
        throw error;
    }
};

// Mettre à jour un hôpital
export const updateHospital = async (hospitalId, hospitalData) => {
    try {
        // ✅ Route corrigée (changé de PUT à PATCH pour cohérence)
        const response = await adminApi.patch(`/hopital/${hospitalId}`, hospitalData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'hôpital:', error);
        throw error;
    }
};

// Supprimer un hôpital
export const deleteHospital = async (hospitalId) => {
    try {
        // ✅ Route corrigée
        const response = await adminApi.delete(`/hopital/${hospitalId}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'hôpital:', error);
        throw error;
    }
};

// Récupérer les services d'un hôpital
export const getHospitalServices = async (hospitalId) => {
    try {
        // ✅ Route corrigée
        const response = await adminApi.get(`/hopital/${hospitalId}/services`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des services de l\'hôpital:', error);
        throw error;
    }
};

// Récupérer les professionnels d'un hôpital
export const getHospitalProfessionals = async (hospitalId) => {
    try {
        // ✅ Route corrigée
        const response = await adminApi.get(`/hopital/${hospitalId}/professionals`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des professionnels de l\'hôpital:', error);
        throw error;
    }
};

// ===== MONITORING ET SURVEILLANCE =====

// Récupérer les statistiques du tableau de bord
export const getDashboardStats = async () => {
    try {
        const response = await adminApi.get('/admin/dashboard/stats');
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        throw error;
    }
};

// Récupérer les statistiques des utilisateurs
export const getUserStats = async (period = 'month') => {
    try {
        const response = await adminApi.get('/admin/dashboard/user-stats', { 
            params: { period } 
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des stats utilisateurs:', error);
        throw error;
    }
};

// Récupérer les sessions actives
export const getActiveSessions = async () => {
    try {
        const response = await adminApi.get('/admin/monitoring/sessions/active');
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des sessions:', error);
        throw error;
    }
};

// Récupérer les logs d'activité
export const getActivityLogs = async (filters = {}) => {
    try {
        const response = await adminApi.get('/admin/monitoring/logs/activity', { 
            params: filters 
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des logs:', error);
        throw error;
    }
};

// Récupérer les logs de sécurité
export const getSecurityLogs = async (filters = {}) => {
    try {
        const response = await adminApi.get('/admin/monitoring/logs/security', { 
            params: filters 
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des logs de sécurité:', error);
        throw error;
    }
};

// Récupérer les métriques de performance
export const getPerformanceMetrics = async (period = 'day') => {
    try {
        const response = await adminApi.get('/admin/monitoring/performance', { 
            params: { period } 
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des métriques:', error);
        throw error;
    }
};

// Récupérer les alertes système
export const getSystemAlerts = async (severity = 'all') => {
    try {
        const response = await adminApi.get('/admin/monitoring/alerts', { 
            params: { severity } 
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des alertes:', error);
        throw error;
    }
};

// Marquer une alerte comme résolue
export const resolveAlert = async (alertId) => {
    try {
        const response = await adminApi.patch(`/admin/monitoring/alerts/${alertId}/resolve`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la résolution de l\'alerte:', error);
        throw error;
    }
};

export default adminApi;

