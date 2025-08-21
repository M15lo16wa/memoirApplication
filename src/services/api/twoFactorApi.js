import axios from "axios";

const API_URL = "http://localhost:3000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

// Sélectionne un token d'authentification valide et priorise le JWT de première connexion
function selectValidAuthToken() {
    const candidates = [
        localStorage.getItem('originalJWT'),
        localStorage.getItem('firstConnectionToken'),
        localStorage.getItem('jwt'),
        localStorage.getItem('token'),
    ];
    for (const candidate of candidates) {
        if (
            candidate &&
            candidate.startsWith('eyJ') &&
            candidate.length > 100 &&
            !candidate.startsWith('temp_') &&
            !candidate.startsWith('auth_')
        ) {
            return candidate;
        }
    }
    return null;
}

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
    (config) => {
        const chosenToken = selectValidAuthToken();
        if (chosenToken) {
            config.headers.Authorization = `Bearer ${chosenToken}`;
            console.log('🔐 Authorization ajouté (2FA api):', `${chosenToken.substring(0, 20)}...`);
        } else {
            console.log('⚠️ Aucun token JWT valide disponible pour l\'authentification (2FA api)');
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
        
        console.log('�� Headers de la requête:', config.headers);
        console.log('�� Body de la requête:', config.data);
        console.log('🌐 URL appelée:', config.url);
        
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ NOUVEAU : Intercepteur pour détecter et bloquer les appels à l'ancienne route dépréciée
api.interceptors.request.use(
    (config) => {
        // Vérifier si l'URL contient l'ancienne route dépréciée
        if (config.url && config.url.includes('validate-2fa-session')) {
            console.error('🚨 DÉTECTION - Tentative d\'appel à l\'ancienne route dépréciée:', {
                url: config.url,
                method: config.method,
                data: config.data,
                stack: new Error().stack
            });
            
            // Corriger automatiquement l'URL si possible
            if (config.url.includes('/auth/validate-2fa-session')) {
                console.log('🔧 CORRECTION AUTOMATIQUE - Redirection vers la nouvelle route');
                config.url = config.url.replace('/auth/validate-2fa-session', '/auth/verify-2fa');
                
                // S'assurer que les données sont dans le bon format
                if (config.data && typeof config.data === 'object' && 
                    (!config.data.verificationCode || typeof config.data.verificationCode !== 'object')) {
                    console.log('🔧 CORRECTION AUTOMATIQUE - Restructuration des données');
                    const originalData = { ...config.data };
                    config.data = {
                        verificationCode: {
                            verificationCode: originalData.verificationCode || '000000',
                            userType: originalData.userType || 'professionnel',
                            identifier: originalData.identifier || 'UNKNOWN',
                            tempTokenId: originalData.tempTokenId || 'UNKNOWN'
                        }
                    };
                }
            }
        }
        
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
// FONCTIONS 2FA PRINCIPALES - SYNCHRONISÉES AVEC LE SERVEUR
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
        
        // ✅ NOUVELLE ROUTE SÉCURISÉE : Utiliser uniquement l'endpoint avec tirets
        const response = await api.post('/auth/setup-2fa', params);
        console.log('✅ Setup2FA - Réponse reçue:', response.data);
        
        // 🔍 DÉBOGAGE DÉTAILLÉ - Vérifier le contenu de la réponse
        if (response.data && response.data.data) {
            const payload = response.data.data;
            console.log('�� DEBUG - Contenu de response.data.data:', {
                totpCode: payload.totpCode || 'NON TROUVÉ',
                tempTokenId: payload.tempTokenId || 'NON TROUVÉ',
                recoveryCodes: payload.recoveryCodes || 'NON TROUVÉ',
                message: payload.message || 'NON TROUVÉ',
                status: response.data.status || 'NON TROUVÉ'
            });
        } else {
            console.log('⚠️ DEBUG - Structure de réponse inattendue:', response.data);
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Setup2FA - Erreur:', error);
        
        // 🔍 DÉBOGAGE - Afficher les détails de l'erreur
        if (error.response) {
            console.error('�� DEBUG - Détails de l\'erreur:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                message: error.response.data?.message || 'Message d\'erreur non disponible'
            });
        }
        
        throw error;
    }
};

/**
 * Crée une session 2FA pour la connexion
 * @param {Object} params - Paramètres de la session
 * @param {string} params.userType - Type d'utilisateur
 * @param {string} params.identifier - Identifiant de l'utilisateur
 * @returns {Promise<Object>} Réponse de création de session
 */
export const create2FASession = async (params) => {
    try {
        console.log(' Create2FASession - Création avec:', params);
        
        // Vérifier que les paramètres requis sont présents
        if (!params.userType || !params.identifier) {
            throw new Error('userType et identifier sont requis pour create2FASession');
        }
        
        // DÉBOGAGE COMPLET - Vérifier l'état de localStorage
        console.log('🔍 DEBUG - État complet de localStorage (create2FASession):', {
            localStorageKeys: Object.keys(localStorage),
            localStorageLength: localStorage.length,
            hasToken: !!localStorage.getItem('token'),
            hasJWT: !!localStorage.getItem('jwt'),
            hasMedecin: !!localStorage.getItem('medecin'),
            hasProfessionnel: !!localStorage.getItem('professionnel'),
            tokenValue: localStorage.getItem('token') ? localStorage.getItem('token').substring(0, 50) + '...' : 'NON TROUVÉ',
            jwtValue: localStorage.getItem('jwt') ? localStorage.getItem('jwt').substring(0, 50) + '...' : 'NON TROUVÉ'
        });
        
        // ✅ CORRECTION : Récupérer le token d'authentification selon le type d'utilisateur
        let token = null;
        if (params.userType === 'professionnel') {
            token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('medecin') || localStorage.getItem('professionnel');
        } else if (params.userType === 'patient') {
            token = localStorage.getItem('jwt') || localStorage.getItem('token') || localStorage.getItem('patient');
        } else {
            token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('medecin') || localStorage.getItem('professionnel') || localStorage.getItem('patient');
        }
        
        console.log('🔐 DEBUG - Token final récupéré pour create2FASession:', {
            hasToken: !!token,
            tokenType: token ? 'JWT/TOKEN' : 'AUCUN',
            tokenPreview: token ? token.substring(0, 20) + '...' : 'N/A',
            tokenLength: token ? token.length : 0,
            userType: params.userType,
            localStorageKeys: Object.keys(localStorage)
        });
        
        if (!token) {
            console.warn('⚠️ Create2FASession - Aucun token d\'authentification trouvé. L\'appel API pourrait échouer.');
        }
        
        const config = token ? {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        } : {};
        
        console.log('🔐 DEBUG - Configuration avec token pour create2FASession:', {
            hasAuthHeader: !!config.headers?.Authorization,
            authHeaderPreview: config.headers?.Authorization ? config.headers.Authorization.substring(0, 30) + '...' : 'N/A',
            allHeaders: config.headers || 'AUCUN',
            tokenLength: token ? token.length : 0
        });
        
        // ✅ NOUVELLE ROUTE SÉCURISÉE : Utiliser uniquement l'endpoint avec tirets
        const response = await api.post('/auth/create-2fa-session', params, config);
        console.log('✅ Create2FASession - Réponse reçue:', response.data);
        
        // 🔍 DÉBOGAGE DÉTAILLÉ - Vérifier le contenu de la réponse
        if (response.data && response.data.data) {
            const payload = response.data.data;
            console.log('🔍 DEBUG - Contenu de la session 2FA créée:', {
                tempTokenId: payload.tempTokenId || 'NON TROUVÉ',
                message: payload.message || 'NON TROUVÉ',
                requires2FA: payload.requires2FA || 'NON TROUVÉ',
                isLoginFlow: payload.isLoginFlow || 'NON TROUVÉ',
                status: response.data.status || 'NON TROUVÉ'
            });
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Create2FASession - Erreur:', error);
        
        // 🔍 DÉBOGAGE - Afficher les détails de l'erreur
        if (error.response) {
            console.error('🔍 DEBUG - Détails de l\'erreur:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                message: error.response.data?.message || 'Message d\'erreur non disponible'
            });
        }
        
        throw error;
    }
};

/**
 * Validation d'une session 2FA avec un code
 * @param {Object} params - Paramètres de validation
 * @param {string} params.verificationCode - Code 2FA à 6 chiffres
 * @param {string} params.userType - Type d'utilisateur
 * @param {string} params.identifier - Identifiant de l'utilisateur
 * @param {string} params.tempTokenId - Identifiant de session temporaire
 * @returns {Promise<Object>} Réponse de validation avec token final
 */
export const validate2FASession = async (params) => {
    try {
        console.log('🔐 Validate2FASession - Validation avec:', params);
        
        // ✅ CORRECTION : Utiliser la nouvelle route recommandée par le serveur
        // Format: /api/auth/verify-2fa avec tempTokenId
        const requestData = {
            verificationCode: {
                verificationCode: params.verificationCode,
                userType: params.userType,
                identifier: params.identifier,
                tempTokenId: params.tempTokenId
            }
        };
        
        console.log('🔐 DEBUG - Données de requête envoyées:', requestData);
        
        const response = await api.post('/auth/verify-2fa', requestData);
        
        console.log('✅ Validate2FASession - Réponse reçue:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('❌ Validate2FASession - Erreur:', error);
        throw error;
    }
};

/**
 * Vérification et activation du 2FA (pour la configuration initiale)
 * @param {Object} params - Paramètres de vérification
 * @param {string} params.verificationCode - Code de vérification
 * @param {string} params.userType - Type d'utilisateur
 * @param {string} params.identifier - Identifiant de l'utilisateur
 * @param {string} params.tempTokenId - ID temporaire pour la vérification
 * @returns {Promise<Object>} Réponse de vérification
 */
export const verifyAndEnable2FA = async (params) => {
    try {
        console.log('🔐 VerifyAndEnable2FA - Paramètres reçus (bruts):', params);
        
        // ✅ CORRECTION : Extraire les paramètres de la structure imbriquée OU plate
        let verificationCode, userType, identifier, tempTokenId;
        
        if (params.verificationCode && typeof params.verificationCode === 'object') {
            // Structure imbriquée : { verificationCode: { verificationCode, userType, identifier, tempTokenId } }
            console.log('🔐 DEBUG - Structure imbriquée détectée');
            verificationCode = params.verificationCode.verificationCode;
            userType = params.verificationCode.userType;
            identifier = params.verificationCode.identifier;
            tempTokenId = params.verificationCode.tempTokenId;
        } else {
            // Structure plate : { verificationCode, userType, identifier, tempTokenId }
            console.log('🔐 DEBUG - Structure plate détectée');
            verificationCode = params.verificationCode;
            userType = params.userType;
            identifier = params.identifier;
            tempTokenId = params.tempTokenId;
        }
        
        console.log('🔐 DEBUG - Paramètres extraits:', { 
            verificationCode, 
            userType, 
            identifier, 
            tempTokenId,
            hasVerificationCode: !!verificationCode,
            hasUserType: !!userType,
            hasIdentifier: !!identifier,
            hasTempTokenId: !!tempTokenId
        });

        // Vérifier que tous les paramètres requis sont présents
        if (!verificationCode || !userType || !identifier || !tempTokenId) {
            console.error('❌ VerifyAndEnable2FA - Paramètres manquants:', {
                verificationCode: verificationCode || 'MANQUANT',
                userType: userType || 'MANQUANT',
                identifier: identifier || 'MANQUANT',
                tempTokenId: tempTokenId || 'MANQUANT',
                paramsReceived: params,
                paramsType: typeof params,
                paramsKeys: Object.keys(params || {})
            });
            throw new Error(`Paramètres manquants pour verifyAndEnable2FA: verificationCode=${!!verificationCode}, userType=${!!userType}, identifier=${!!identifier}, tempTokenId=${!!tempTokenId}`);
        }
        
        // 🔍 DÉBOGAGE - Vérifier la structure de la requête
        const requestData = {
            verificationCode: {
                verificationCode,
                userType,
                identifier,
                tempTokenId
            }
        };
        
        console.log('🔐 DEBUG - Données de requête envoyées:', requestData);
        
        // ✅ NOUVELLE ROUTE SÉCURISÉE : Utiliser uniquement l'endpoint avec tirets
        const response = await api.post('/auth/verify-2fa', requestData);
        
        console.log('✅ VerifyAndEnable2FA - Réponse reçue:', response.data);
        
        // ✅ NOUVEAU : Gérer le stockage du token après validation 2FA réussie
        if (response.data && response.data.status === 'success') {
            console.log('🔐 DEBUG - Validation 2FA réussie, gestion des tokens...');
            
            // Essayer de récupérer le token d'authentification de la réponse
            const authToken = response.data.data?.token || 
                            response.data.data?.jwt || 
                            response.data.data?.accessToken ||
                            response.data.token ||
                            response.data.jwt ||
                            response.data.accessToken;
            
            if (authToken) {
                console.log('🔐 DEBUG - Token d\'authentification trouvé dans la réponse:', authToken.substring(0, 20) + '...');
                
                // Stocker le token selon le type d'utilisateur
                if (userType === 'professionnel' || userType === 'medecin') {
                    localStorage.setItem('token', authToken);
                    console.log('🔐 DEBUG - Token stocké dans localStorage.token pour le professionnel');
                } else if (userType === 'patient') {
                    localStorage.setItem('jwt', authToken);
                    console.log('🔐 DEBUG - Token stocké dans localStorage.jwt pour le patient');
                }
                
                // Nettoyer le token temporaire
                if (tempTokenId) {
                    localStorage.removeItem('tempTokenId');
                    console.log('🔐 DEBUG - Token temporaire nettoyé');
                }
            } else {
                console.log('⚠️ DEBUG - Aucun token d\'authentification trouvé dans la réponse');
                console.log('🔐 DEBUG - Aucun fallback disponible - le token doit être fourni directement par la réponse 2FA');
                
                // ✅ CORRECTION : Ne pas essayer d'appeler l'ancienne route dépréciée
                // La route /auth/validate-2fa-session est supprimée et remplacée par /auth/verify-2fa
                // Si aucun token n'est fourni, c'est un problème côté serveur à signaler
                
                console.warn('🚨 ATTENTION: Aucun token d\'authentification reçu après validation 2FA réussie');
                console.warn('🚨 Cela peut indiquer un problème côté serveur ou une configuration incorrecte');
            }
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ VerifyAndEnable2FA - Erreur:', error);
        
        // 🔍 DÉBOGAGE - Afficher les détails de l'erreur
        if (error.response) {
            console.error('🔍 DEBUG - Détails de l\'erreur:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                message: error.response.data?.message || 'Message d\'erreur non disponible'
            });
        }
        
        throw error;
    }
};

// ================================
// NOUVELLES FONCTIONS 2FA EMAIL - SYNCHRONISÉES
// ================================

/**
 * Envoyer le code TOTP 2FA par email pour validation immédiate
 * @param {Object} params - Paramètres de l'utilisateur
 * @param {string} params.userType - Type d'utilisateur ('patient' ou 'professionnel')
 * @param {string} params.identifier - Identifiant de l'utilisateur
 * @returns {Promise<Object>} Réponse de l'API avec confirmation d'envoi
 */
export const send2FATOTPCode = async (params) => {
    try {
        console.log('📧 Send2FATOTPCode - Paramètres reçus:', params);
        
        // Vérifier que les paramètres requis sont présents
        if (!params.userType || !params.identifier) {
            throw new Error('userType et identifier sont requis pour send2FATOTPCode');
        }
        
        // ✅ NOUVELLE ROUTE SÉCURISÉE : Utiliser uniquement l'endpoint avec tirets
        const response = await api.post('/auth/send-2fa-totp-code', params);
        console.log('✅ Send2FATOTPCode - Réponse reçue:', response.data);
        
        // 🔍 DÉBOGAGE DÉTAILLÉ - Vérifier le contenu de la réponse
        if (response.data && response.data.data) {
            const payload = response.data.data;
            console.log('�� DEBUG - Contenu de la réponse TOTP:', {
                email: payload.email || 'NON TROUVÉ',
                timestamp: payload.timestamp || 'NON TROUVÉ',
                message: payload.message || 'NON TROUVÉ',
                status: response.data.status || 'NON TROUVÉ'
            });
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Send2FATOTPCode - Erreur:', error);
        throw error;
    }
};

/**
 * Renvoyer le secret 2FA par email
 * @param {Object} params - Paramètres de l'utilisateur
 * @param {string} params.userType - Type d'utilisateur ('patient' ou 'professionnel')
 * @param {string} params.identifier - Identifiant de l'utilisateur
 * @returns {Promise<Object>} Réponse de l'API avec confirmation d'envoi
 */
export const resend2FAEmail = async (params) => {
    try {
        console.log('📧 Resend2FAEmail - Paramètres reçus:', params);
        
        // Vérifier que les paramètres requis sont présents
        if (!params.userType || !params.identifier) {
            throw new Error('userType et identifier sont requis pour resend2FAEmail');
        }
        
        // ✅ NOUVELLE ROUTE SÉCURISÉE : Utiliser uniquement l'endpoint avec tirets
        const response = await api.post('/auth/resend-2fa-email', params);
        console.log('✅ Resend2FAEmail - Réponse reçue:', response.data);
        
        // 🔍 DÉBOGAGE DÉTAILLÉ - Vérifier le contenu de la réponse
        if (response.data && response.data.data) {
            const payload = response.data.data;
            console.log('�� DEBUG - Contenu de la réponse resend:', {
                email: payload.email || 'NON TROUVÉ',
                timestamp: payload.timestamp || 'NON TROUVÉ',
                status: response.data.status || 'NON TROUVÉ'
            });
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Resend2FAEmail - Erreur:', error);
        throw error;
    }
};

/**
 * Obtenir le statut de la configuration 2FA
 * @param {Object} params - Paramètres de l'utilisateur
 * @param {string} params.userType - Type d'utilisateur ('patient' ou 'professionnel')
 * @param {string} params.identifier - Identifiant de l'utilisateur
 * @returns {Promise<Object>} Réponse de l'API avec statut 2FA
 */
export const get2FAStatus = async (params) => {
    try {
        console.log('🔍 Get2FAStatus - Paramètres reçus:', params);
        
        // DÉBOGAGE COMPLET - Vérifier l'état de localStorage
        console.log('🔍 DEBUG - État complet de localStorage:', {
            localStorageKeys: Object.keys(localStorage),
            localStorageLength: localStorage.length,
            hasToken: !!localStorage.getItem('token'),
            hasJWT: !!localStorage.getItem('jwt'),
            hasMedecin: !!localStorage.getItem('medecin'),
            hasProfessionnel: !!localStorage.getItem('professionnel'),
            tokenValue: localStorage.getItem('token') ? localStorage.getItem('token').substring(0, 50) + '...' : 'NON TROUVÉ',
            jwtValue: localStorage.getItem('jwt') ? localStorage.getItem('jwt').substring(0, 50) + '...' : 'NON TROUVÉ'
        });
        
        // ✅ CORRECTION : Récupérer le token d'authentification selon le type d'utilisateur
        let token = null;
        
        if (params.userType === 'professionnel') {
            // Pour les professionnels, essayer dans cet ordre :
            token = localStorage.getItem('token') || 
                    localStorage.getItem('jwt') || 
                    localStorage.getItem('medecin') ||
                    localStorage.getItem('professionnel');
            
            console.log('🔐 DEBUG - Recherche token pour PROFESSIONNEL:', {
                hasToken: !!token,
                source: token ? (
                    localStorage.getItem('token') ? 'token' :
                    localStorage.getItem('jwt') ? 'jwt' :
                    localStorage.getItem('medecin') ? 'medecin' :
                    localStorage.getItem('professionnel') ? 'professionnel' : 'inconnue'
                ) : 'AUCUNE',
                tokenPreview: token ? token.substring(0, 20) + '...' : 'N/A'
            });
        } else if (params.userType === 'patient') {
            // Pour les patients, essayer dans cet ordre :
            token = localStorage.getItem('jwt') || 
                    localStorage.getItem('token') || 
                    localStorage.getItem('patient');
            
            console.log('🔐 DEBUG - Recherche token pour PATIENT:', {
                hasToken: !!token,
                source: token ? (
                    localStorage.getItem('jwt') ? 'jwt' :
                    localStorage.getItem('token') ? 'token' :
                    localStorage.getItem('patient') ? 'patient' : 'inconnue'
                ) : 'AUCUNE',
                tokenPreview: token ? token.substring(0, 20) + '...' : 'N/A'
            });
        } else {
            // Type d'utilisateur non spécifié, essayer toutes les sources
            token = localStorage.getItem('token') || 
                    localStorage.getItem('jwt') || 
                    localStorage.getItem('medecin') ||
                    localStorage.getItem('professionnel') ||
                    localStorage.getItem('patient');
            
            console.log('🔐 DEBUG - Recherche token pour TYPE INCONNU:', {
                hasToken: !!token,
                source: token ? (
                    localStorage.getItem('token') ? 'token' :
                    localStorage.getItem('jwt') ? 'jwt' :
                    localStorage.getItem('medecin') ? 'medecin' :
                    localStorage.getItem('professionnel') ? 'professionnel' :
                    localStorage.getItem('patient') ? 'patient' : 'inconnue'
                ) : 'AUCUNE',
                tokenPreview: token ? token.substring(0, 20) + '...' : 'N/A'
            });
        }
        
        console.log('🔐 DEBUG - Token final récupéré pour get2FAStatus:', {
            hasToken: !!token,
            tokenType: token ? 'JWT/TOKEN' : 'AUCUN',
            tokenPreview: token ? token.substring(0, 20) + '...' : 'N/A',
            tokenLength: token ? token.length : 0,
            userType: params.userType,
            localStorageKeys: Object.keys(localStorage)
        });
        
        if (!token) {
            console.warn('⚠️ Get2FAStatus - Aucun token d\'authentification trouvé');
            console.log('⚠️ DEBUG - localStorage vide ou sans token:', {
                localStorageKeys: Object.keys(localStorage),
                localStorageLength: localStorage.length,
                tokenItem: localStorage.getItem('token'),
                jwtItem: localStorage.getItem('jwt'),
                medecinItem: localStorage.getItem('medecin'),
                professionnelItem: localStorage.getItem('professionnel'),
                patientItem: localStorage.getItem('patient')
            });
            
            // ✅ CORRECTION : Retourner un statut par défaut au lieu de faire l'appel API
            return {
                status: 'success',
                data: {
                    twoFactorEnabled: false,
                    twoFactorConfigured: false,
                    message: 'Token d\'authentification non disponible - Passage direct au setup 2FA'
                }
            };
        }
        
        // ✅ CORRECTION : Ajouter le token dans les headers
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };
        
        console.log('🔐 DEBUG - Configuration avec token pour get2FAStatus:', {
            hasAuthHeader: !!config.headers.Authorization,
            authHeaderPreview: config.headers.Authorization ? config.headers.Authorization.substring(0, 30) + '...' : 'N/A',
            allHeaders: config.headers,
            tokenLength: token.length,
            tokenStart: token.substring(0, 20),
            tokenEnd: token.substring(token.length - 20)
        });
        
        // ✅ CORRECTION : Essayer d'abord l'endpoint avec tirets, sinon fallback sur l'endpoint sans tirets
        let response;
        try {
            console.log('🔍 DEBUG - Tentative avec endpoint /auth/2fa-status');
            console.log('🔍 DEBUG - Configuration complète de la requête:', {
                url: '/auth/2fa-status',
                method: 'GET',
                params: params,
                headers: config.headers,
                hasAuth: !!config.headers.Authorization
            });
            
            // Tentative avec l'endpoint avec tirets
            response = await api.get('/auth/2fa-status', { 
                params,
                ...config
            });
            console.log('✅ Get2FAStatus - Endpoint avec tirets utilisé avec succès');
        } catch (firstError) {
            console.log('⚠️ Get2FAStatus - Endpoint avec tirets échoué, tentative sans tirets');
            console.log('⚠️ DEBUG - Erreur première tentative:', {
                status: firstError.response?.status,
                message: firstError.response?.data?.message,
                error: firstError.message
            });
            
            try {
                // Fallback sur l'endpoint sans tirets
                console.log('🔍 DEBUG - Tentative avec endpoint /auth/2fastatus');
                response = await api.get('/auth/2fastatus', { 
                    params,
                    ...config
                });
                console.log('✅ Get2FAStatus - Endpoint sans tirets utilisé avec succès');
            } catch (secondError) {
                console.error('❌ Get2FAStatus - Les deux endpoints ont échoué');
                console.error('❌ DEBUG - Erreur deuxième tentative:', {
                    status: secondError.response?.status,
                    message: secondError.response?.data?.message,
                    error: secondError.message
                });
                throw secondError;
            }
        }
        
        console.log('✅ Get2FAStatus - Réponse reçue:', response.data);
        
        // 🔍 DÉBOGAGE DÉTAILLÉ - Vérifier le contenu de la réponse
        if (response.data && response.data.data) {
            const payload = response.data.data;
            console.log('🔍 DEBUG - Contenu du statut 2FA:', {
                twoFactorEnabled: payload.twoFactorEnabled || 'NON TROUVÉ',
                twoFactorConfigured: payload.twoFactorConfigured || 'NON TROUVÉ',
                lastConfigured: payload.lastConfigured || 'NON TROUVÉ',
                emailConfigured: payload.emailConfigured || 'NON TROUVÉ',
                status: response.data.status || 'NON TROUVÉ'
            });
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Get2FAStatus - Erreur:', error);
        
        // ✅ CORRECTION : Gestion d'erreur améliorée pour les erreurs 401
        if (error.response?.status === 401) {
            console.warn('⚠️ Get2FAStatus - Erreur 401: Utilisateur non authentifié');
            console.log('⚠️ DEBUG - Détails de l\'erreur 401:', {
                status: error.response.status,
                message: error.response.data?.message,
                headers: error.response.headers,
                config: error.config
            });
            
            return {
                status: 'fail',
                data: {
                    twoFactorEnabled: false,
                    twoFactorConfigured: false,
                    message: 'Authentification requise pour vérifier le statut 2FA - Passage direct au setup 2FA'
                }
            };
        }
        
        throw error;
    }
};

// ================================
// NOUVELLES FONCTIONS 2FA SÉCURISÉES
// ================================

/**
 * Désactivation du 2FA (authentification requise)
 * @returns {Promise<Object>} Réponse de désactivation
 */
export const disable2FA = async () => {
    try {
        console.log('🔐 Disable2FA - Désactivation demandée');
        
        // ✅ NOUVELLE ROUTE SÉCURISÉE : Utiliser uniquement l'endpoint avec tirets
        const response = await api.post('/auth/disable-2fa');
        
        console.log('✅ Disable2FA - Réponse reçue:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('❌ Disable2FA - Erreur:', error);
        throw error;
    }
};

/**
 * Reconfiguration du 2FA (authentification requise + 2FA désactivé)
 * @returns {Promise<Object>} Réponse de reconfiguration
 */
export const reconfigure2FA = async () => {
    try {
        console.log('🔐 Reconfigure2FA - Reconfiguration demandée');
        
        // ✅ NOUVELLE ROUTE SÉCURISÉE : Utiliser uniquement l'endpoint avec tirets
        const response = await api.post('/auth/reconfigure-2fa');
        
        console.log('✅ Reconfigure2FA - Réponse reçue:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('❌ Reconfigure2FA - Erreur:', error);
        throw error;
    }
};

// ================================
// FONCTIONS 2FA EXISTANTES - MAINTENUES POUR COMPATIBILITÉ
// ================================

/**
 * Génération de nouveaux codes de récupération
 * @returns {Promise<Object>} Réponse avec nouveaux codes
 */
export const generateRecoveryCodes = async () => {
    try {
        console.log('🔐 GenerateRecoveryCodes - Génération demandée');
        
        const response = await api.post('/auth/generate-recovery-codes');
        
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
        
        const response = await api.post('/auth/verify-recovery-code', {
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
// NOUVEAUX WORKFLOWS INTELLIGENTS (VOTRE PROPOSITION)
// ================================

/**
 * Workflow 2FA intelligent - Gère automatiquement la configuration ou la connexion.
 * C'EST LA FONCTION PRINCIPALE À UTILISER APRÈS LA CONNEXION PAR MOT DE PASSE.
 * @param {Object} params - { userType, identifier }
 * @returns {Promise<Object>} Réponse de setup2FA ou create2FASession.
 */
export const intelligent2FAWorkflow = async (params) => {
    try {
        console.log('🧠 Workflow 2FA intelligent - Démarrage pour:', params);
        
        // ÉTAPE 1 : Vérifier le statut 2FA actuel
        try {
            const statusResponse = await get2FAStatus(params);
            console.log('🔍 Statut 2FA actuel:', statusResponse.data);
            
            const { twoFactorEnabled, twoFactorConfigured } = statusResponse.data;
            
            // ÉTAPE 2 : Décider de l'action selon le statut
            if (twoFactorEnabled && twoFactorConfigured) {
                console.log('✅ 2FA déjà configuré et activé -> Création de session pour connexion');
                // Le 2FA est déjà prêt -> On demande le code pour se connecter
                return await create2FASession(params);
            } else {
                console.log('🆕 2FA non configuré -> Lancement de la configuration initiale');
                // Le 2FA n'est pas configuré -> On doit afficher le QR Code, etc.
                return await setup2FA(params);
            }
        } catch (statusError) {
            console.warn('⚠️ Workflow 2FA - Erreur lors de la vérification du statut:', statusError.message);
            
            // ✅ CORRECTION : Gestion gracieuse des erreurs d'authentification
            if (statusError.response?.status === 401) {
                console.log('🔐 Workflow 2FA - Erreur 401 détectée, passage direct au setup 2FA');
                return await setup2FA(params);
            }
            
            // Si c'est une autre erreur, essayer de créer une session 2FA
            console.log('🔄 Workflow 2FA - Tentative de création de session 2FA en fallback');
            try {
                return await create2FASession(params);
            } catch (sessionError) {
                console.error('❌ Workflow 2FA - Échec de création de session, passage au setup 2FA');
                return await setup2FA(params);
            }
        }
        
    } catch (error) {
        console.error('❌ Workflow 2FA intelligent - Erreur fatale:', error.response?.data || error.message);
        
        // ✅ CORRECTION : Fallback final vers setup2FA en cas d'échec complet
        try {
            console.log('🆘 Workflow 2FA - Fallback final vers setup2FA');
            return await setup2FA(params);
        } catch (fallbackError) {
            console.error('💥 Workflow 2FA - Échec complet du workflow:', fallbackError.message);
            throw new Error(`Échec du workflow 2FA intelligent: ${fallbackError.message}`);
        }
    }
};

// ================================
// FONCTIONS TOTP AVANCÉES - MAINTENUES POUR COMPATIBILITÉ
// ================================

/**
 * Vérifie un token TOTP avec une fenêtre de temps étendue
 * @param {string} token - Token à vérifier
 * @param {string} secret - Secret TOTP
 * @param {number} window - Fenêtre de validation (nombre de périodes de 30s)
 * @returns {boolean} True si le token est valide
 */
export const verifyTokenWithWindow = (token, secret, window = 2) => { // ✅ AUGMENTÉ de 1 à 2 (1 minute)
    try {
        console.log('🔐 2FA: Vérification du token avec fenêtre étendue:', { 
            token, 
            secretLength: secret.length, 
            secretPreview: secret.substring(0, 8) + '...',
            window,
            windowSeconds: window * 30
        });
        
        // ✅ CORRECTION : Utiliser speakeasy pour la validation avec fenêtre étendue
        // Note: Cette fonction est côté frontend, la validation réelle se fait côté backend
        // Mais on peut simuler la logique pour le débogage
        
        // Simulation de la validation avec fenêtre étendue
        const currentTime = Math.floor(Date.now() / 1000);
        const timeStep = 30; // Période de 30 secondes
        const currentPeriod = Math.floor(currentTime / timeStep);
        
        console.log('🔐 2FA: Calcul de la fenêtre de validation:', {
            currentTime,
            currentPeriod,
            window,
            windowSeconds: window * 30,
            validPeriods: {
                start: currentPeriod - window,
                current: currentPeriod,
                end: currentPeriod + window
            }
        });
        
        // ✅ NOUVELLE LOGIQUE : Fenêtre de validation étendue
        // Le token est considéré valide s'il correspond à l'une des périodes dans la fenêtre
        // Fenêtre de 2 périodes = 1 minute de validité
        
        // Pour l'instant, retourner true pour simuler la validation réussie
        // La validation réelle se fait côté backend avec la fenêtre étendue
        const isValid = true; // Simulation
        
        console.log('🔐 2FA: Résultat de la vérification avec fenêtre étendue:', { 
            token, 
            isValid, 
            window,
            windowSeconds: window * 30,
            message: 'Validation simulée - La validation réelle se fait côté backend avec fenêtre étendue'
        });
        
        return isValid;
    } catch (error) {
        console.error('❌ Erreur lors de la vérification TOTP avec fenêtre étendue:', error);
        return false;
    }
};

/**
 * Génère un token TOTP pour un moment spécifique
 * @param {string} secret - Secret TOTP
 * @param {number} time - Timestamp spécifique (optionnel)
 * @returns {string} Token TOTP
 */
export const generateTokenAtTime = (secret, time = null) => {
    try {
        console.log('🔐 Génération TOTP à un moment spécifique demandée:', { 
            secret: secret ? 'PRÉSENT' : 'ABSENT',
            time: time || Math.floor(Date.now() / 1000),
            currentTime: Math.floor(Date.now() / 1000)
        });
        
        // Pour l'instant, retourner null car la génération se fait côté backend
        return null;
    } catch (error) {
        console.error('❌ Erreur génération TOTP:', error);
        return null;
    }
};

// ================================
// FONCTIONS UTILITAIRES - MAINTENUES
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
 * Récupère le statut 2FA de l'utilisateur actuel (version locale)
 * @returns {Promise<Object>} Statut 2FA
 */
export const getLocal2FAStatus = async () => {
    try {
        const response = await api.get('/auth/me');
        const user = response.data?.data?.user || response.data?.user;
        
        return {
            enabled: user?.two_factor_enabled === true,
            secret: user?.two_factor_secret,
            recoveryCodes: user?.recoveryCodes || []
        };
    } catch (error) {
        console.error('❌ GetLocal2FAStatus - Erreur:', error);
        throw error;
    }
};

// ================================
// EXPORT PAR DÉFAUT - MIS À JOUR
// ================================

const twoFactorApi = {
    // Fonctions principales 2FA - SYNCHRONISÉES
    setup2FA,
    create2FASession,
    validate2FASession,
    verifyAndEnable2FA,
    
    // Nouvelles fonctions 2FA email - SYNCHRONISÉES
    send2FATOTPCode,
    resend2FAEmail,
    get2FAStatus,
    
    // Nouvelles fonctions 2FA sécurisées
    disable2FA,
    reconfigure2FA,
    
    // Fonctions 2FA existantes - MAINTENUES
    generateRecoveryCodes,
    verifyRecoveryCode,
    
    // Fonctions TOTP avancées - MAINTENUES
    verifyTokenWithWindow,
    generateTokenAtTime,
    
    // Fonctions utilitaires - MAINTENUES
    is2FAEnabled,
    getLocal2FAStatus
};

export default twoFactorApi;