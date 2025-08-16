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
        const jwtToken = localStorage.getItem('jwt');
        const generalToken = localStorage.getItem('token');
        
        if (jwtToken) {
            config.headers.Authorization = `Bearer ${jwtToken}`;
        } else if (generalToken) {
            config.headers.Authorization = `Bearer ${generalToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ================================
// GESTION 2FA
// ================================

// Configuration initiale du 2FA
export const setup2FA = async () => {
    try {
        const response = await api.post('/auth/setup-2fa');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la configuration 2FA";
    }
};

// Validation du code 2FA
export const verify2FA = async (token) => {
    try {
        const response = await api.post('/auth/verify-2fa', { token });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la validation 2FA";
    }
};

// Validation de session 2FA
export const validate2FASession = async (twoFactorToken) => {
    try {
        const response = await api.post('/auth/validate-2fa-session', { twoFactorToken });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la validation de session 2FA";
    }
};

// Utilisation d'un code de récupération
export const verifyRecoveryCode = async (recoveryCode) => {
    try {
        const response = await api.post('/auth/verify-recovery-code', { recoveryCode });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la validation du code de récupération";
    }
};

// Désactivation du 2FA
export const disable2FA = async () => {
    try {
        const response = await api.post('/auth/disable-2fa');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la désactivation 2FA";
    }
};

// Génération de nouveaux codes de récupération
export const generateRecoveryCodes = async () => {
    try {
        const response = await api.post('/auth/generate-recovery-codes');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la génération des codes de récupération";
    }
};

// Vérification du statut 2FA
export const get2FAStatus = async () => {
    try {
        const response = await api.get('/auth/2fa-status');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la récupération du statut 2FA";
    }
};

export default {
    setup2FA,
    verify2FA,
    validate2FASession,
    verifyRecoveryCode,
    disable2FA,
    generateRecoveryCodes,
    get2FAStatus
};