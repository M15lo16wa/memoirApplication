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
        // Prioriser le token JWT pour les patients
        const jwtToken = localStorage.getItem('jwt');
        const generalToken = localStorage.getItem('token');
        
        console.log('🔑 Tokens disponibles:', {
            jwtToken: jwtToken ? 'Présent' : 'Absent',
            generalToken: generalToken ? 'Présent' : 'Absent'
        });
        
        // Pour les routes médecin, utiliser le token général
        if (config.url && config.url.includes('/ProfessionnelSante/')) {
            if (generalToken) {
                config.headers.Authorization = `Bearer ${generalToken}`;
                console.log('🔑 Token médecin ajouté:', generalToken.substring(0, 20) + '...');
            }
        } else if (jwtToken) {
            // Pour les autres routes, prioriser le JWT
            config.headers.Authorization = `Bearer ${jwtToken}`;
            console.log('🔐 JWT patient ajouté:', jwtToken.substring(0, 20) + '...');
        } else if (generalToken) {
            config.headers.Authorization = `Bearer ${generalToken}`;
            console.log('🔑 Token général ajouté:', generalToken.substring(0, 20) + '...');
        } else {
            console.log('⚠️ Aucun token disponible pour l\'authentification');
        }
        
        // 🔍 DÉBOGAGE DÉTAILLÉ - Afficher l'URL et le token utilisé
        console.log('🔍 DEBUG - Requête authentifiée:', {
            url: config.url,
            method: config.method,
            tokenUsed: config.headers.Authorization ? config.headers.Authorization.substring(0, 25) + '...' : 'AUCUN',
            isPatientRoute: config.url.includes('/patient/') || config.url.includes('/access/patient/'),
            isMedecinRoute: config.url.includes('/ProfessionnelSante/'),
            isGeneralRoute: !config.url.includes('/patient/') && !config.url.includes('/ProfessionnelSante/')
        });
        
        console.log('📋 Headers de la requête:', config.headers);
        console.log('📦 Body de la requête:', config.data);
        console.log('🌐 URL appelée:', config.url);
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor pour gérer les erreurs d'authentification
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // On laisse la gestion des erreurs au composant appelant
        return Promise.reject(error);
    }
);

// ================================
// FONCTIONS 2FA PRINCIPALES
// ================================

/**
 * Configuration initiale du 2FA pour un utilisateur
 * @param {Object} params - Paramètres de configuration
 * @param {string} params.userType - Type d'utilisateur ('patient' ou 'professionnel')
 * @param {string} params.identifier - Identifiant de l'utilisateur
 * @param {string} params.userId - ID de l'utilisateur (optionnel)
 * @returns {Promise<Object>} Réponse de l'API
 */
export const setup2FA = async (params) => {
    try {
        console.log('🔧 Setup2FA - Paramètres reçus:', params);
        
        // Vérifier que les paramètres requis sont présents
        if (!params.userType || !params.identifier) {
            throw new Error('userType et identifier sont requis pour setup2FA');
        }
        
        // CORRECTION : Utiliser la route avec tirets comme définie dans le backend
        const response = await api.post('/auth/setup-2fa', params);
        console.log('✅ Setup2FA - Réponse reçue:', response.data);
        
        // 🔍 DÉBOGAGE DÉTAILLÉ - Vérifier le contenu de la réponse
        if (response.data && response.data.data) {
            const payload = response.data.data;
            console.log('🔐 DEBUG - Contenu de response.data.data:', {
                secret: payload.secret || 'NON TROUVÉ',
                two_factor_secret: payload.two_factor_secret || 'NON TROUVÉ',
                setupSecret: payload.setupSecret || 'NON TROUVÉ',
                totpSecret: payload.totpSecret || 'NON TROUVÉ',
                qrCode: payload.qrCode ? 'PRÉSENT' : 'ABSENT',
                qrCodeData: payload.qrCodeData ? 'PRÉSENT' : 'ABSENT',
                totpUrl: payload.totpUrl ? 'PRÉSENT' : 'ABSENT',
                otpauthUrl: payload.otpauthUrl ? 'PRÉSENT' : 'ABSENT',
                status: response.data.status || 'NON TROUVÉ'
            });
        } else {
            console.log('⚠️ DEBUG - Structure de réponse inattendue:', response.data);
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Setup2FA - Erreur:', error);
        throw error;
    }
};

/**
 * Création d'une session 2FA temporaire
 * @param {Object} params - Paramètres de la session
 * @param {string} params.userType - Type d'utilisateur ('patient' ou 'professionnel')
 * @param {string} params.identifier - Identifiant de l'utilisateur
 * @param {string} params.userId - ID de l'utilisateur (optionnel)
 * @returns {Promise<Object>} Réponse de l'API avec tempTokenId
 */
export const create2FASession = async (params) => {
    try {
        console.log('�� Create2FASession - Paramètres reçus:', params);
        
        // Vérifier que les paramètres requis sont présents
        if (!params.userType || !params.identifier) {
            throw new Error('userType et identifier sont requis pour create2FASession');
        }
        
        // CORRECTION : Utiliser la route avec tirets comme définie dans le backend
        const response = await api.post('/auth/create-2fa-session', params);
        console.log('✅ Create2FASession - Réponse reçue:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('❌ Create2FASession - Erreur:', error);
        throw error;
    }
};

/**
 * Validation d'une session 2FA avec un code
 * @param {string} twoFactorToken - Code 2FA à 6 chiffres
 * @param {string} tempTokenId - Identifiant de session temporaire
 * @returns {Promise<Object>} Réponse de validation avec token final
 */
export const validate2FASession = async (twoFactorToken, tempTokenId) => {
    try {
        console.log('�� Validate2FASession - Validation avec:', { twoFactorToken, tempTokenId });
        
        // CORRECTION : Utiliser la route avec tirets comme définie dans le backend
        const response = await api.post('/auth/validate-2fa-session', {
            twoFactorToken,
            tempTokenId
        });
        
        console.log('✅ Validate2FASession - Réponse reçue:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('❌ Validate2FASession - Erreur:', error);
        throw error;
    }
};

/**
 * Vérification et activation du 2FA (pour la configuration initiale)
 * @param {string} verificationCode - Code de vérification
 * @returns {Promise<Object>} Réponse de vérification
 */
export const verifyAndEnable2FA = async (verificationCode) => {
    try {
        console.log('�� VerifyAndEnable2FA - Code reçu:', verificationCode);
        
        const response = await api.post('/auth/verify-2FA', {
            token: verificationCode
        });
        
        console.log('✅ VerifyAndEnable2FA - Réponse reçue:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('❌ VerifyAndEnable2FA - Erreur:', error);
        throw error;
    }
};

/**
 * Désactivation du 2FA
 * @returns {Promise<Object>} Réponse de désactivation
 */
export const disable2FA = async () => {
    try {
        console.log('🔐 Disable2FA - Désactivation demandée');
        
        const response = await api.post('/auth/disable2FA');
        
        console.log('✅ Disable2FA - Réponse reçue:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('❌ Disable2FA - Erreur:', error);
        throw error;
    }
};

/**
 * Génération de nouveaux codes de récupération
 * @returns {Promise<Object>} Réponse avec nouveaux codes
 */
export const generateRecoveryCodes = async () => {
    try {
        console.log('🔐 GenerateRecoveryCodes - Génération demandée');
        
        const response = await api.post('/auth/generateRecoveryCodes');
        
        console.log('✅ GenerateRecoveryCodes - Réponse reçue:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('❌ GenerateRecoveryCodes - Erreur:', error);
        throw error;
    }
};

/**
 * Validation d'un code de récupération
 * @param {string} recoveryCode - Code de récupération
 * @returns {Promise<Object>} Réponse de validation
 */
export const verifyRecoveryCode = async (recoveryCode) => {
    try {
        console.log('�� VerifyRecoveryCode - Code reçu:', recoveryCode);
        
        const response = await api.post('/auth/verifyRecoveryCode', {
            recoveryCode
        });
        
        console.log('✅ VerifyRecoveryCode - Réponse reçue:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('❌ VerifyRecoveryCode - Erreur:', error);
        throw error;
    }
};

// ================================
// FONCTIONS UTILITAIRES
// ================================

/**
 * Vérifie si le 2FA est activé pour l'utilisateur actuel
 * @returns {Promise<boolean>} True si le 2FA est activé
 */
export const is2FAEnabled = async () => {
    try {
        const response = await api.get('/auth/me');
        const user = response.data?.data?.user || response.data?.user;
        
        return user && user.two_factor_enabled === true;
    } catch (error) {
        console.error('❌ Is2FAEnabled - Erreur:', error);
        return false;
    }
};

/**
 * Récupère le statut 2FA de l'utilisateur actuel
 * @returns {Promise<Object>} Statut 2FA
 */
export const get2FAStatus = async () => {
    try {
        const response = await api.get('/auth/me');
        const user = response.data?.data?.user || response.data?.user;
        
        return {
            enabled: user?.two_factor_enabled === true,
            secret: user?.two_factor_secret,
            recoveryCodes: user?.recoveryCodes || []
        };
    } catch (error) {
        console.error('❌ Get2FAStatus - Erreur:', error);
        throw error;
    }
};

// ================================
// EXPORT PAR DÉFAUT
// ================================

const twoFactorApi = {
    // Fonctions principales
    setup2FA,
    create2FASession,
    validate2FASession,
    verifyAndEnable2FA,
    disable2FA,
    generateRecoveryCodes,
    verifyRecoveryCode,
    
    // Fonctions utilitaires
    is2FAEnabled,
    get2FAStatus
};

export default twoFactorApi;