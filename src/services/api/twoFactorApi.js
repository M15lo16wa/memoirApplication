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

/**
 * Crée une session temporaire pour la validation 2FA.
 * Cette fonction doit être appelée après la connexion initiale réussie.
 * @param {Object} userData - Les données utilisateur reçues lors de la connexion
 */
export const create2FASession = async (userData) => {
    try {
        console.log('🔐 create2FASession - Création session temporaire 2FA...', { userData });
        
        // Validation des données requises
        if (!userData || !userData.id) {
            throw new Error('Type d\'utilisateur et identifiant requis. Veuillez fournir l\'identifiant ou vous reconnecter.');
        }
        
        if (!userData.type) {
            throw new Error('Type d\'utilisateur manquant. Veuillez vous reconnecter.');
        }
        
        console.log('✅ Validation des données réussie:', {
            userId: userData.id,
            userType: userData.type
        });
        
        const requestData = { 
            userId: userData.id,
            userType: userData.type
        };
        
        console.log('📤 Données envoyées au backend:', requestData);
        console.log('🔗 Endpoint appelé: POST /auth/create-2fa-session');
        
        // Vérifier l'authentification
        const token = localStorage.getItem('jwt') || localStorage.getItem('token');
        console.log('🔑 Token d\'authentification:', token ? 'Présent' : 'Absent');
        
        const response = await api.post('/auth/create-2fa-session', requestData);
        
        console.log('✅ Session temporaire 2FA créée:', response.data);
        
        // Analyser la structure de la réponse
        const sessionData = response.data;
        console.log('🔍 Structure de la réponse:', {
            hasTempTokenId: !!sessionData.tempTokenId,
            hasQrCodeData: !!sessionData.qrCodeData,
            hasSecret: !!sessionData.secret,
            hasTotpUrl: !!sessionData.totpUrl,
            hasRecoveryCodes: !!sessionData.recoveryCodes,
            hasData: !!sessionData.data,
            hasSession: !!sessionData.session,
            hasToken: !!sessionData.token,
            allKeys: Object.keys(sessionData)
        });
        
        // Vérifier les données QR code
        if (sessionData.qrCodeData) {
            console.log('🎯 Données QR code reçues:', sessionData.qrCodeData);
        } else {
            console.warn('⚠️ Données QR code manquantes dans la réponse backend');
        }
        
        // Vérifier le secret
        if (sessionData.secret) {
            console.log('🔑 Secret 2FA reçu:', sessionData.secret);
        } else {
            console.warn('⚠️ Secret 2FA manquant dans la réponse backend');
        }
        
        // Vérifier si tempTokenId est présent
        if (!sessionData.tempTokenId) {
            console.warn('⚠️ tempTokenId manquant dans la réponse backend');
            console.warn('📋 Réponse complète:', sessionData);
        }
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Erreur création session temporaire 2FA:', error);
        console.error('📊 Détails de l\'erreur:', {
            status: error.response?.status,
            message: error.response?.data?.message,
            data: error.response?.data,
            headers: error.response?.headers
        });
        
        // Si c'est une erreur 400, afficher plus de détails
        if (error.response?.status === 400) {
            console.error('🚨 Erreur 400 - Données reçues du backend:', error.response.data);
            throw new Error(`Erreur 400: ${error.response.data.message || 'Données invalides'}`);
        }
        
        // Gestion améliorée des erreurs
        if (error.message && error.message.includes('Type d\'utilisateur')) {
            throw error.message; // Erreur de validation des données
        } else if (error.response?.data?.message) {
            throw error.response.data.message; // Erreur du serveur
        } else {
            throw "Erreur lors de la création de la session 2FA";
        }
    }
};

/**
 * Vérifie le code initial pour activer la 2FA.
 * Appelle POST /api/auth/verify-2fa
 * @param {string} token - Le code à 6 chiffres de l'application d'authentification.
 */
export const verifyAndEnable2FA = async (token) => {
    try {
        const response = await api.post('/auth/verify-2fa', { token });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Code de vérification invalide.";
    }
};

/**
 * Valide le code 2FA pour une session ou une action protégée.
 * C'est la fonction la plus importante pour le hook use2FA.
 * Appelle POST /api/auth/validate-2fa-session
 * @param {string} twoFactorToken - Le code à 6 chiffres.
 * @param {string} tempTokenId - L'identifiant de session temporaire (obligatoire)
 */
export const validate2FASession = async (twoFactorToken, tempTokenId = null) => {
    try {
        console.log('🔐 validate2FASession - Appel API...', { twoFactorToken, tempTokenId });
        
        // Vérifier que le tempTokenId est présent
        if (!tempTokenId) {
            throw new Error('Identifiant de session temporaire requis pour la validation 2FA');
        }
        
        const response = await api.post('/auth/validate-2fa-session', { 
            twoFactorToken,
            tempTokenId 
        });
        
        console.log('✅ validate2FASession - Réponse reçue:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ validate2FASession - Erreur:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            error: error
        });
        
        // Gestion améliorée des erreurs
        if (error.response?.status === 400) {
            throw error.response.data.message || 'Code 2FA invalide ou expiré';
        } else if (error.response?.status === 401) {
            throw 'Session expirée - veuillez vous reconnecter';
        } else if (error.response?.status === 404) {
            throw 'Service 2FA non disponible';
        } else if (error.response?.status === 500) {
            throw 'Erreur serveur lors de la validation 2FA';
        } else if (error.message.includes('fetch')) {
            throw 'Impossible de contacter le serveur - vérifiez votre connexion';
        } else {
            throw error.response?.data?.message || error.message || 'Code 2FA invalide ou expiré';
        }
    }
};



/**
 * Désactive la 2FA pour l'utilisateur.
 * Appelle POST /api/auth/disable-2fa
 */
export const disable2FA = async () => {
    try {
        const response = await api.post('/auth/disable-2fa');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur lors de la désactivation de la 2FA.";
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
    create2FASession,
    verifyAndEnable2FA,
    validate2FASession,
    verifyRecoveryCode,
    disable2FA,
    generateRecoveryCodes,
    get2FAStatus
};