import axios from "axios";

const API_URL = "http://localhost:3000/api";

// Configuration de débogage pour identifier le problème
console.log('🔧 Configuration API:', {
    baseURL: API_URL,
    userAgent: navigator.userAgent,
    origin: window.location.origin,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    port: window.location.port
});

// 🔍 DEBUG TEMPORAIRE - Vérification des tokens stockés
console.log('🔐 DEBUG - Tokens stockés dans localStorage:');
const allTokens = {};
Object.keys(localStorage).forEach(key => {
    if (key.includes('token') || key.includes('jwt') || key.includes('auth')) {
        const value = localStorage.getItem(key);
        allTokens[key] = {
            value: value,
            length: value ? value.length : 0,
            preview: value ? value.substring(0, 50) + '...' : 'null',
            isJWT: value ? value.startsWith('eyJ') : false
        };
    }
});
console.table(allTokens);

// 🔍 DEBUG TEMPORAIRE - Vérification des données utilisateur
console.log('👤 DEBUG - Données utilisateur stockées:');
const userData = {
    medecin: localStorage.getItem('medecin') ? 'Présent' : 'Absent',
    patient: localStorage.getItem('patient') ? 'Présent' : 'Absent',
    user: localStorage.getItem('user') ? 'Présent' : 'Absent'
};
console.table(userData);

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
        const token = getValidAuthToken();
        console.log('🌐 DEBUG - Requête API interceptée:', {
            url: config.url,
            method: config.method?.toUpperCase(),
            hasToken: !!token,
            tokenPreview: token ? `${token.substring(0, 20)}...` : 'Aucun',
            tokenLength: token ? token.length : 0,
            tokenFormat: token ? (token.startsWith('eyJ') ? 'JWT standard' : 'Non-JWT') : 'N/A',
            fullHeaders: config.headers,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`
        });
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔐 DEBUG - Header Authorization ajouté:', `Bearer ${token.substring(0, 20)}...`);
            console.log('🔐 DEBUG - Headers complets après ajout:', config.headers);
        } else {
            console.log('⚠️ DEBUG - Aucun token disponible pour cette requête');
        }
        
        return config;
    },
    (error) => {
        console.error('❌ DEBUG - Erreur dans l\'intercepteur de requête:', error);
        return Promise.reject(error);
    }
);

// Interceptor pour gérer les erreurs d'authentification
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Gérer automatiquement les erreurs 401 (token expiré)
        if (error.response?.status === 401 && !error.config._retry) {
            console.log('🔄 Erreur 401 détectée, analyse du problème...');
            
            // Log détaillé de l'erreur 401
            console.log('🚨 Détails de l\'erreur 401:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response.status,
                message: error.response.data?.message || 'Non spécifié',
                tokenUsed: error.config?.headers?.Authorization ? 'Oui' : 'Non',
                tokenPreview: error.config?.headers?.Authorization ? 
                    error.config.headers.Authorization.substring(0, 50) + '...' : 'Aucun',
                serverResponse: error.response.data,
                requestHeaders: error.config?.headers,
                baseURL: error.config?.baseURL
            });
            
            // Vérifier l'état des tokens au moment de l'erreur
            console.log('🔍 État des tokens lors de l\'erreur 401:');
            const tokenStatus = {
                jwt: localStorage.getItem('jwt') ? 'Présent' : 'Absent',
                token: localStorage.getItem('token') ? 'Présent' : 'Absent',
                originalJWT: localStorage.getItem('originalJWT') ? 'Présent' : 'Absent',
                firstConnectionToken: localStorage.getItem('firstConnectionToken') ? 'Présent' : 'Absent'
            };
            console.log(tokenStatus);
            
            // Tentative de rafraîchissement automatique
            try {
                console.log('🔄 Tentative de rafraîchissement automatique...');
                error.config._retry = true;
                
                const newToken = await attemptTokenRefresh();
                
                if (newToken) {
                    console.log('✅ Token rafraîchi avec succès, retentative de la requête originale...');
                    error.config.headers.Authorization = `Bearer ${newToken}`;
                    return api.request(error.config);
                } else {
                    console.log('❌ Impossible de rafraîchir le token');
                    
                    // Tentative de reconnexion automatique
                    console.log('🔄 Tentative de reconnexion automatique...');
                    const reconnectSuccess = await attemptAutoReconnect();
                    
                    if (reconnectSuccess) {
                        console.log('✅ Reconnexion réussie, retentative de la requête originale...');
                        return api.request(error.config);
                    } else {
                        console.log('❌ Reconnexion échouée, redirection vers la connexion...');
                        window.location.href = '/connexion';
                        return Promise.reject(error);
                    }
                }
            } catch (refreshError) {
                console.error('❌ Erreur lors du rafraîchissement automatique:', refreshError);
                
                // Tentative de reconnexion en dernier recours
                try {
                    const reconnectSuccess = await attemptAutoReconnect();
                    if (reconnectSuccess) {
                        return api.request(error.config);
                    }
                } catch (reconnectError) {
                    console.error('❌ Reconnexion échouée:', reconnectError);
                }
                
                window.location.href = '/connexion';
                return Promise.reject(error);
            }
        }
        
        return Promise.reject(error);
    }
);



// Intercepteur de réponse pour logger les erreurs d'authentification
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Log détaillé de toutes les erreurs pour le débogage
        if (error.response) {
            console.log('🚨 DEBUG - Erreur de réponse détaillée:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                headers: error.response.headers,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers,
                    baseURL: error.config?.baseURL,
                    fullURL: `${error.config?.baseURL || ''}${error.config?.url || ''}`
                }
            });
        } else if (error.request) {
            console.log('🚨 DEBUG - Erreur de requête (pas de réponse):', {
                request: error.request,
                message: error.message
            });
        } else {
            console.log('🚨 DEBUG - Erreur générale:', error.message);
        }
        
        // Log spécifique pour les erreurs 401
        if (error.response?.status === 401) {
            console.log('🚨 DEBUG - Erreur 401 détectée:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response.status,
                message: error.response.data?.message || 'Non spécifié',
                tokenUsed: error.config?.headers?.Authorization ? 'Oui' : 'Non',
                tokenPreview: error.config?.headers?.Authorization ? 
                    error.config.headers.Authorization.substring(0, 30) + '...' : 'Aucun'
            });
            
            // Log de l'état des tokens au moment de l'erreur
            console.log('🔍 DEBUG - État des tokens lors de l\'erreur 401:', {
                jwt: localStorage.getItem('jwt') ? 'Présent' : 'Absent',
                token: localStorage.getItem('token') ? 'Présent' : 'Absent',
                firstConnectionToken: localStorage.getItem('firstConnectionToken') ? 'Présent' : 'Absent',
                medecin: localStorage.getItem('medecin') ? 'Présent' : 'Absent'
            });
        }
        
        return Promise.reject(error);
    }
);

// Fonction utilitaire pour nettoyer les données d'authentification
const clearAuthData = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("token");
    localStorage.removeItem("medecin");
    localStorage.removeItem("patient");
    // ✅ CORRECTION : Nettoyer aussi les tokens temporaires 2FA
    localStorage.removeItem("tempTokenId");
    // ⚠️ NE PAS supprimer firstConnectionToken et originalJWT pendant une session active
    console.log('🧹 clearAuthData - Nettoyage effectué, conservation de firstConnectionToken et originalJWT');
};

// ✅ NOUVELLE FONCTION : Tentative de reconnexion automatique
const attemptAutoReconnect = async () => {
    console.log('🔄 Tentative de reconnexion automatique...');
    
    try {
        // Récupérer les informations de connexion stockées
        const medecinData = localStorage.getItem('medecin');
        const patientData = localStorage.getItem('patient');
        
        if (medecinData) {
            try {
                const parsedMedecin = JSON.parse(medecinData);
                if (parsedMedecin.numero_adeli) {
                    console.log('🔄 Tentative de reconnexion médecin avec:', parsedMedecin.numero_adeli);
                    
                    // Appel de connexion sans mot de passe (juste pour vérifier l'identifiant)
                    const response = await axios.post('http://localhost:3000/api/ProfessionnelSante/auth/check-identifier', {
                        numero_adeli: parsedMedecin.numero_adeli
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.data.success) {
                        console.log('✅ Identifiant médecin vérifié, tentative de récupération du profil...');
                        
                        // Essayer de récupérer le profil avec les données stockées
                        const profileResponse = await axios.get('http://localhost:3000/api/ProfessionnelSante/profile', {
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        });
                        
                        if (profileResponse.data && profileResponse.data.professionnel) {
                            console.log('✅ Profil médecin récupéré, mise à jour des données...');
                            localStorage.setItem('medecin', JSON.stringify(profileResponse.data.professionnel));
                            return true;
                        }
                    }
                }
            } catch (e) {
                console.log('⚠️ Erreur lors de la reconnexion médecin:', e.message);
            }
        }
        
        if (patientData) {
            try {
                const parsedPatient = JSON.parse(patientData);
                if (parsedPatient.numero_assure) {
                    console.log('🔄 Tentative de reconnexion patient avec:', parsedPatient.numero_assure);
                    
                    // Appel de connexion sans mot de passe (juste pour vérifier l'identifiant)
                    const response = await axios.post('http://localhost:3000/api/patient/auth/check-identifier', {
                        numero_assure: parsedPatient.numero_assure
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.data.success) {
                        console.log('✅ Identifiant patient vérifié, tentative de récupération du profil...');
                        
                        // Essayer de récupérer le profil avec les données stockées
                        const profileResponse = await axios.get('http://localhost:3000/api/patient/auth/me', {
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        });
                        
                        if (profileResponse.data && profileResponse.data.data && profileResponse.data.data.patient) {
                            console.log('✅ Profil patient récupéré, mise à jour des données...');
                            localStorage.setItem('patient', JSON.stringify(profileResponse.data.data.patient));
                            return true;
                        }
                    }
                }
            } catch (e) {
                console.log('⚠️ Erreur lors de la reconnexion patient:', e.message);
            }
        }
        
        console.log('❌ Reconnexion automatique échouée');
        return false;
        
    } catch (error) {
        console.error('❌ Erreur lors de la reconnexion automatique:', error);
        return false;
    }
};

// ✅ NOUVELLE FONCTION : Tentative de rafraîchissement automatique du token
const attemptTokenRefresh = async () => {
    console.log('🔄 Tentative de rafraîchissement automatique du token...');
    
    try {
        // Déterminer le type d'utilisateur et l'endpoint approprié
        const medecinData = localStorage.getItem('medecin');
        const patientData = localStorage.getItem('patient');
        
        let endpoint = '';
        let payload = {};
        
        if (medecinData) {
            try {
                const parsedMedecin = JSON.parse(medecinData);
                if (parsedMedecin.numero_adeli) {
                    endpoint = '/ProfessionnelSante/auth/refresh-token';
                    payload = { numero_adeli: parsedMedecin.numero_adeli };
                }
            } catch (e) {
                console.log('⚠️ Erreur parsing données médecin:', e.message);
            }
        } else if (patientData) {
            try {
                const parsedPatient = JSON.parse(patientData);
                if (parsedPatient.numero_assure) {
                    endpoint = '/patient/auth/refresh-token';
                    payload = { numero_assure: parsedPatient.numero_assure };
                }
            } catch (e) {
                console.log('⚠️ Erreur parsing données patient:', e.message);
            }
        }
        
        if (!endpoint) {
            console.log('❌ Impossible de déterminer l\'endpoint de rafraîchissement');
            return null;
        }
        
        console.log('🔄 Appel de rafraîchissement sur:', endpoint, 'avec payload:', payload);
        
        // Appel à l'API de rafraîchissement (sans token pour éviter les boucles)
        const response = await axios.post(`http://localhost:3000/api${endpoint}`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (response.data.token || response.data.jwt) {
            const newToken = response.data.token || response.data.jwt;
            console.log('✅ Nouveau token obtenu:', newToken.substring(0, 30) + '...');
            
            // Mettre à jour le token approprié selon le type d'utilisateur
            if (endpoint.includes('patient')) {
                localStorage.setItem('jwt', newToken);
                localStorage.setItem('originalJWT', newToken);
            } else {
                localStorage.setItem('token', newToken);
                localStorage.setItem('originalJWT', newToken);
            }
            
            return newToken;
        }
        
        console.log('❌ Aucun token reçu de l\'API de rafraîchissement');
        return null;
        
    } catch (error) {
        console.error('❌ Erreur lors du rafraîchissement automatique:', error);
        return null;
    }
};

// ✅ CORRECTION : Fonction pour récupérer le bon token d'authentification
const getValidAuthToken = () => {
    console.log('🔍 DEBUG - getValidAuthToken - Début de la recherche...');
    
    // ✅ PRIORITÉ 1 : originalJWT (le plus fiable - JWT de première connexion)
    const originalJWT = localStorage.getItem('originalJWT');
    console.log('🔍 DEBUG - originalJWT trouvé:', originalJWT ? `${originalJWT.substring(0, 20)}...` : 'Absent');
    if (originalJWT && !originalJWT.startsWith('temp_') && !originalJWT.startsWith('auth_')) {
        console.log('✅ originalJWT trouvé et valide - Longueur:', originalJWT.length);
        console.log('🔍 DEBUG - Format originalJWT:', originalJWT.startsWith('eyJ') ? 'Format JWT standard' : 'Format non-JWT');
        return originalJWT;
    }
    
    // ✅ PRIORITÉ 2 : firstConnectionToken (fallback)
    const firstConnectionToken = localStorage.getItem('firstConnectionToken');
    console.log('🔍 DEBUG - firstConnectionToken trouvé:', firstConnectionToken ? `${firstConnectionToken.substring(0, 20)}...` : 'Absent');
    if (firstConnectionToken && !firstConnectionToken.startsWith('temp_') && !firstConnectionToken.startsWith('auth_')) {
        console.log('✅ firstConnectionToken trouvé et valide - Longueur:', firstConnectionToken.length);
        console.log('🔍 DEBUG - Format firstConnectionToken:', firstConnectionToken.startsWith('eyJ') ? 'Format JWT standard' : 'Format non-JWT');
        return firstConnectionToken;
    }

    // ✅ PRIORITÉ 3 : JWT actuel (si disponible et valide)
    const jwtToken = localStorage.getItem('jwt');
    console.log('🔍 DEBUG - JWT trouvé:', jwtToken ? `${jwtToken.substring(0, 20)}...` : 'Absent');
    if (jwtToken && !jwtToken.startsWith('temp_') && !jwtToken.startsWith('auth_')) {
        console.log('✅ JWT trouvé et valide - Longueur:', jwtToken.length);
        console.log('🔍 DEBUG - Format JWT:', jwtToken.startsWith('eyJ') ? 'Format JWT standard' : 'Format non-JWT');
        return jwtToken;
    }

    // ✅ PRIORITÉ 4 : Token général (fallback) - VÉRIFICATION STRICTE
    const generalToken = localStorage.getItem('token') || localStorage.getItem('generalToken');
    console.log('🔍 DEBUG - Token général trouvé:', generalToken ? `${generalToken.substring(0, 20)}...` : 'Absent');
    
    if (generalToken) {
        console.log('🔍 DEBUG - Analyse du token général:', {
            longueur: generalToken.length,
            commenceParEyJ: generalToken.startsWith('eyJ'),
            commenceParTemp: generalToken.startsWith('temp_'),
            commenceParAuth: generalToken.startsWith('auth_'),
            format: generalToken.startsWith('eyJ') ? 'JWT standard' : 'Non-JWT'
        });
        
        // ✅ VÉRIFICATION STRICTE : Le token doit être un JWT valide
        if (generalToken.startsWith('eyJ') && generalToken.length > 100 && !generalToken.startsWith('temp_') && !generalToken.startsWith('auth_')) {
            console.log('✅ Token général JWT valide trouvé - Longueur:', generalToken.length);
            return generalToken;
        } else {
            console.log('❌ Token général rejeté - Format invalide ou temporaire');
        }
    }

    // ✅ PRIORITÉ 5 : Vérifier les tokens stockés dans les données utilisateur (originalToken/originalJWT)
    const medecinData = localStorage.getItem('medecin');
    if (medecinData) {
        try {
            const parsedMedecin = JSON.parse(medecinData);
            console.log('🔍 DEBUG - Données médecin parsées, clés disponibles:', Object.keys(parsedMedecin));
            
            if (parsedMedecin.originalJWT && !parsedMedecin.originalJWT.startsWith('temp_') && !parsedMedecin.originalJWT.startsWith('auth_')) {
                console.log('✅ JWT original du médecin trouvé dans les données stockées - Longueur:', parsedMedecin.originalJWT.length);
                console.log('🔍 DEBUG - Format JWT original:', parsedMedecin.originalJWT.startsWith('eyJ') ? 'Format JWT standard' : 'Format non-JWT');
                return parsedMedecin.originalJWT;
            }
            if (parsedMedecin.originalToken && !parsedMedecin.originalToken.startsWith('temp_') && !parsedMedecin.originalToken.startsWith('auth_')) {
                console.log('✅ Token original du médecin trouvé dans les données stockées - Longueur:', parsedMedecin.originalToken.length);
                console.log('🔍 DEBUG - Format token original:', parsedMedecin.originalToken.startsWith('eyJ') ? 'Format JWT standard' : 'Format non-JWT');
                return parsedMedecin.originalToken;
            }
        } catch (error) {
            console.log('⚠️ Erreur lors du parsing des données médecin:', error.message);
        }
    }

    console.log('❌ Aucun token d\'authentification valide trouvé');
    
    // 🔍 DIAGNOSTIC COMPLET : Analyser tous les tokens disponibles
    console.log('🔍 DIAGNOSTIC COMPLET - Analyse de tous les tokens:');
    
    const allTokens = {
        originalJWT: localStorage.getItem('originalJWT'),
        firstConnectionToken: localStorage.getItem('firstConnectionToken'),
        jwt: localStorage.getItem('jwt'),
        token: localStorage.getItem('token'),
        medecin: localStorage.getItem('medecin')
    };
    
    Object.entries(allTokens).forEach(([key, value]) => {
        if (value) {
            console.log(`  🔍 ${key}:`, {
                present: 'Présent',
                longueur: value.length,
                preview: value.substring(0, 30) + '...',
                format: value.startsWith('eyJ') ? 'JWT standard' : 'Non-JWT',
                commenceParTemp: value.startsWith('temp_'),
                commenceParAuth: value.startsWith('auth_'),
                valide: value.startsWith('eyJ') && value.length > 100 && !value.startsWith('temp_') && !value.startsWith('auth_')
            });
        } else {
            console.log(`  ❌ ${key}: Absent`);
        }
    });
    
    // 🔍 VÉRIFIER LES DONNÉES MÉDECIN STOCKÉES
    if (allTokens.medecin) {
        try {
            const parsedMedecin = JSON.parse(allTokens.medecin);
            console.log('🔍 Données médecin stockées:', {
                clés: Object.keys(parsedMedecin),
                aOriginalJWT: !!parsedMedecin.originalJWT,
                aOriginalToken: !!parsedMedecin.originalToken,
                originalJWTValide: parsedMedecin.originalJWT ? (parsedMedecin.originalJWT.startsWith('eyJ') && parsedMedecin.originalJWT.length > 100) : false,
                originalTokenValide: parsedMedecin.originalToken ? (parsedMedecin.originalToken.startsWith('eyJ') && parsedMedecin.originalToken.length > 100) : false
            });
        } catch (error) {
            console.log('⚠️ Erreur parsing données médecin:', error.message);
        }
    }
    
    // 🚨 DERNIER RECOURS : Tentative de récupération d'urgence
    console.log('🚨 DERNIER RECOURS - Tentative de récupération d\'urgence...');
    const emergencyToken = emergencyTokenRecovery();
    if (emergencyToken) {
        console.log('✅ RÉCUPÉRATION D\'URGENCE RÉUSSIE - Token restauré');
        return emergencyToken;
    }
    
    return null;
};

// ✅ CORRECTION : Fonction pour nettoyer les tokens temporaires
const cleanupTemporaryTokens = () => {
    console.log('🧹 Nettoyage des tokens temporaires...');
    
    const keysToCheck = ['tempTokenId', 'tempToken', 'temp_'];
    let cleanedCount = 0;
    
    // ✅ CORRECTION : Vérifier si un token valide existe avant de nettoyer
    const hasValidToken = !!(localStorage.getItem('jwt') || localStorage.getItem('token'));
    
    if (hasValidToken) {
        console.log('🔐 Token valide détecté, nettoyage sélectif des tokens temporaires uniquement');
        
        // Ne nettoyer que les clés qui commencent par 'temp_' ET qui ne sont pas le token principal
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                // ✅ CORRECTION : Ne pas supprimer le token principal même s'il commence par 'temp_'
                if (value && value.startsWith('temp_') && key !== 'token') {
                    console.log(`🧹 Suppression du token temporaire: ${key}`);
                    localStorage.removeItem(key);
                    cleanedCount++;
                }
            }
        }
    } else {
            console.log('⚠️ Aucun token valide détecté, nettoyage complet des tokens temporaires');
            
            // Nettoyer tous les tokens temporaires
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    const value = localStorage.getItem(key);
                    if (value && keysToCheck.some(tempKey => value.startsWith(tempKey))) {
                        console.log(`🧹 Suppression du token temporaire: ${key}`);
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                }
            }
        }
    
    console.log(`✅ ${cleanedCount} tokens temporaires nettoyés`);
    return cleanedCount;
};

// 🚨 FONCTION DE RÉCUPÉRATION D'URGENCE : Essayer de restaurer un token valide
const emergencyTokenRecovery = () => {
    console.log('🚨 RÉCUPÉRATION D\'URGENCE - Tentative de restauration d\'un token valide...');
    
    // 1. Vérifier les données médecin stockées
    const medecinData = localStorage.getItem('medecin');
    if (medecinData) {
        try {
            const parsedMedecin = JSON.parse(medecinData);
            console.log('🔍 Données médecin disponibles pour récupération:', Object.keys(parsedMedecin));
            
            // Essayer de récupérer originalJWT ou originalToken
            if (parsedMedecin.originalJWT && parsedMedecin.originalJWT.startsWith('eyJ') && parsedMedecin.originalJWT.length > 100) {
                console.log('✅ RÉCUPÉRATION RÉUSSIE - originalJWT restauré depuis les données stockées');
                localStorage.setItem('jwt', parsedMedecin.originalJWT);
                localStorage.setItem('token', parsedMedecin.originalJWT);
                return parsedMedecin.originalJWT;
            }
            
            if (parsedMedecin.originalToken && parsedMedecin.originalToken.startsWith('eyJ') && parsedMedecin.originalToken.length > 100) {
                console.log('✅ RÉCUPÉRATION RÉUSSIE - originalToken restauré depuis les données stockées');
                localStorage.setItem('jwt', parsedMedecin.originalToken);
                localStorage.setItem('token', parsedMedecin.originalToken);
                return parsedMedecin.originalToken;
            }
            
        } catch (error) {
            console.log('⚠️ Erreur lors de la récupération d\'urgence:', error.message);
        }
    }
    
    console.log('❌ RÉCUPÉRATION D\'URGENCE ÉCHOUÉE - Aucun token valide trouvé');
    return null;
};

// ✅ CORRECTION : Fonction pour vérifier l'état d'authentification
export const checkAuthenticationStatus = () => {
    console.log('🔍 Vérification de l\'état d\'authentification...');
    
    const jwtToken = localStorage.getItem('jwt') || localStorage.getItem('jwtToken');
    const generalToken = localStorage.getItem('token') || localStorage.getItem('generalToken');
    const tempTokenId = localStorage.getItem('tempTokenId');
    
    const status = {
        jwtToken: jwtToken ? '✅ Présent' : '❌ Absent',
        generalToken: generalToken ? '✅ Présent' : '❌ Absent',
        tempTokenId: tempTokenId ? '✅ Présent' : '❌ Absent',
        hasValidToken: !!(jwtToken || (generalToken && !generalToken.startsWith('temp_'))),
        needsCleanup: !!(tempTokenId && tempTokenId.startsWith('temp_'))
    };
    
    console.log('📊 État d\'authentification:', status);
    return status;
};

// ================================
// AUTHENTIFICATION GÉNÉRALE
// ================================

export const login = async (identifiant) => {
    try {
        const response = await api.post(`/auth/login`, identifiant);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur de connexion";
    }
};

export const register = async (user) => {
    try {
        const response = await api.post(`/auth/register`, { user });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur d'inscription";
    }
};

export const logout = async () => {
    try {
        const response = await api.post("/auth/logout");
        localStorage.removeItem("token");
        console.log("Déconnexion réussie");
        return response.data;
    } catch (error) {
        // Nettoyer même en cas d'erreur
        localStorage.removeItem("token");
        throw error.response?.data?.message || "Erreur de déconnexion";
    }
};

export const me = async () => {
    try {
        const response = await api.get(`/auth/me`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur de récupération des informations de la session";
    }
};

export const changePassword = async (user) => {
    try {
        const response = await api.put(`/auth/change-password`, { user });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur de modification du mot de passe";
    }
};

export const isAuthenticated = () => {
    console.log('🔍 isAuthenticated - Vérification authentification générale...');
    
    const token = localStorage.getItem('token');
    const jwt = localStorage.getItem('jwt');
    
    console.log('  - 🔑 Tokens vérifiés:');
    console.log('    - token:', token ? `✅ Présent (${token.substring(0, 30)}...)` : '❌ Absent');
    console.log('    - jwt:', jwt ? `✅ Présent (${jwt.substring(0, 30)}...)` : '❌ Absent');
    
    const hasToken = !!(token || jwt);
    console.log('  - ✅ Résultat authentification générale:', hasToken ? 'Authentifié' : 'Non authentifié');
    
    return hasToken;
};

// ================================
// AUTHENTIFICATION PATIENT
// ================================

export const loginPatient = async (identifiant) => {
    try {
        console.log('🔵 Tentative de connexion patient avec:', identifiant);
        const response = await api.post(`/patient/auth/login`, identifiant);
        console.log('🔵 Réponse complète du serveur:', response.data);
        
        // Gérer différentes structures de réponse possibles
        let token = null;
        let patientData = null;
        
        // Vérifier si la 2FA est requise AVANT de traiter le token
        const requires2FA = response.data?.status === 'requires2FA' || 
                           response.data?.requires2FA || 
                           response.data?.message?.includes('2FA') ||
                           response.data?.message?.includes('double facteur') ||
                           response.data?.message?.includes('authentification') ||
                           response.data?.two_factor_required ||
                           response.data?.data?.two_factor_required;
        
        console.log('🔍 Analyse de la réponse 2FA:', {
            status: response.data?.status,
            requires2FA: response.data?.requires2FA,
            message: response.data?.message,
            two_factor_required: response.data?.two_factor_required,
            data_two_factor: response.data?.data?.two_factor_required,
            finalDecision: requires2FA
        });
        
        if (requires2FA) {
            console.log('🔐 2FA requise - pas de stockage du token pour le moment');
            // Ne pas stocker le token si la 2FA est requise
            // Le token sera stocké après validation 2FA réussie
        } else {
            // Connexion normale - extraire et stocker le token
            if (response.data.token) {
                token = response.data.token;
            } else if (response.data.data && response.data.data.token) {
                token = response.data.data.token;
            }
            
            if (response.data.data && response.data.data.patient) {
                patientData = response.data.data.patient;
            } else if (response.data.patient) {
                patientData = response.data.patient;
            } else if (response.data.data) {
                patientData = response.data.data;
            }
            
            console.log('🔵 Token extrait:', token);
            console.log('🔵 Données patient extraites:', patientData);
            
            if (token && patientData) {
                localStorage.setItem("jwt", token);
                localStorage.setItem("patient", JSON.stringify(patientData));
                console.log('🔵 Données stockées dans localStorage');
            } else {
                console.error('🔵 Données manquantes - token:', !!token, 'patientData:', !!patientData);
            }
        }
        
        return response.data;
    } catch (error) {
        console.error('🔵 Erreur de connexion patient:', error);
        throw error.response?.data?.message || "Erreur de connexion patient";
    }
};

export const getPatientProfile = async () => {
    try {
        const response = await api.get(`/patient/auth/me`);
        const patientProfile = response.data;
        if (patientProfile && patientProfile.data && patientProfile.data.patient) {
            localStorage.setItem("patient", JSON.stringify(patientProfile.data.patient));
            return patientProfile.data.patient;
        }
        return null;
    } catch (error) {
        console.error("Erreur lors de la récupération du profil patient:", error);
        if (error.response?.status === 401) {
            localStorage.removeItem("jwt");
            localStorage.removeItem("patient");
        }
        throw error;
    }
};

export const logoutPatient = async () => {
    try {
        await api.post(`/patient/auth/logout`);
    } catch (error) {
        console.error("Erreur lors de la déconnexion patient:", error);
    } finally {
        // Nettoyer les données même en cas d'erreur
        localStorage.removeItem("jwt");
        localStorage.removeItem("patient");
    }
};

export const getStoredPatient = () => {
    try {
        const patient = localStorage.getItem("patient");
        return patient ? JSON.parse(patient) : null;
    } catch (error) {
        console.error('Erreur lors du parsing des données patient:', error);
        localStorage.removeItem("patient");
        return null;
    }
};

export const isPatientAuthenticated = () => {
    const token = localStorage.getItem('jwt');
    const patient = getStoredPatient();
    return !!(token && patient);
};

// ================================
// AUTHENTIFICATION PROFESSIONNEL DE SANTÉ
// ================================

export const loginMedecin = async (identifiant) => {
    try {
        // Nettoyer les tokens existants pour éviter les conflits
        localStorage.removeItem('jwt');
        
        const response = await api.post(`/ProfessionnelSante/auth/login`, identifiant);
        console.log('🔍 Réponse complète du serveur:', response.data);
        
        if (response.data.token) {
            // ✅ SOLUTION SIMPLIFIÉE : Stocker le JWT de première connexion de manière systématique
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('firstConnectionToken', response.data.token);
            localStorage.setItem('originalJWT', response.data.token); // 🔑 JWT pour réutilisation systématique
            
            console.log('🔐 LOGIN - JWT de première connexion conservé:', {
                token: response.data.token.substring(0, 20) + '...',
                stockéeDans: ['token', 'firstConnectionToken', 'originalJWT'],
                longueur: response.data.token.length
            });
            
            // ✅ AUSSI : Stocker dans les données utilisateur pour accès facile
            if (response.data.data && response.data.data.professionnel) {
                response.data.data.professionnel.originalToken = response.data.token;
                response.data.data.professionnel.originalJWT = response.data.token;
            } else if (response.data.professionnel) {
                response.data.professionnel.originalToken = response.data.token;
                response.data.professionnel.originalJWT = response.data.token;
            }
        }
        
        // Stocker les données du médecin - analyser la structure exacte
        let medecinData = null;
        
        // Log détaillé de la structure
        console.log('📊 Structure de la réponse:');
        console.log('  - response.data:', response.data);
        console.log('  - response.data.data:', response.data.data);
        console.log('  - response.data.data.professionnel:', response.data.data?.professionnel);
        console.log('  - response.data.data.medecin:', response.data.data?.medecin);
        
        // Essayer différentes structures possibles
        if (response.data.medecin) {
            medecinData = response.data.medecin;
            console.log('✅ Données trouvées dans response.data.medecin');
        } else if (response.data.professionnel) {
            medecinData = response.data.professionnel;
            console.log('✅ Données trouvées dans response.data.professionnel');
        } else if (response.data.data && response.data.data.professionnel) {
            medecinData = response.data.data.professionnel;
            console.log('✅ Données trouvées dans response.data.data.professionnel');
        } else if (response.data.data && response.data.data.medecin) {
            medecinData = response.data.data.medecin;
            console.log('✅ Données trouvées dans response.data.data.medecin');
        } else if (response.data.data) {
            // Si data existe mais pas de sous-propriété spécifique, utiliser data directement
            medecinData = response.data.data;
            console.log('✅ Utilisation de response.data.data directement');
        }
        
        if (medecinData) {
            console.log('✅ Données médecin extraites:', medecinData);
            
            // Vérifier si les données contiennent les informations nécessaires
            if (!medecinData.nom && !medecinData.prenom) {
                console.log('⚠️ Données extraites mais nom/prénom manquants, recherche dans la structure...');
                
                // Chercher dans les propriétés imbriquées
                const allKeys = Object.keys(medecinData);
                console.log('🔍 Toutes les clés disponibles:', allKeys);
                
                // Essayer de trouver les informations dans d'autres propriétés
                for (const key of allKeys) {
                    const value = medecinData[key];
                    if (typeof value === 'object' && value !== null) {
                        console.log(`🔍 Exploration de ${key}:`, value);
                        if (value.nom || value.prenom || value.specialite) {
                            medecinData = { ...medecinData, ...value };
                            console.log('✅ Informations trouvées dans', key, ':', value);
                            break;
                        }
                    }
                }
            }
            
            localStorage.setItem('medecin', JSON.stringify(medecinData));
        } else {
            console.log('⚠️ Aucune donnée médecin trouvée dans la réponse');
            
            // Essayer d'extraire les informations du token
            if (response.data.token) {
                const tokenInfo = extractMedecinFromToken(response.data.token);
                if (tokenInfo) {
                    console.log('✅ Utilisation des informations du token');
                    localStorage.setItem('medecin', JSON.stringify(tokenInfo));
                } else {
                    // Créer un objet médecin minimal
                    const minimalMedecin = {
                        id: response.data.data?.professionnel_id || response.data.data?.medecin_id || 'unknown',
                        nom: 'Médecin',
                        prenom: 'Connecté',
                        role: 'medecin',
                        specialite: 'Généraliste'
                    };
                    localStorage.setItem('medecin', JSON.stringify(minimalMedecin));
                    console.log('📦 Médecin minimal créé:', minimalMedecin);
                }
            } else {
                // Créer un objet médecin minimal
                const minimalMedecin = {
                    id: response.data.data?.professionnel_id || response.data.data?.medecin_id || 'unknown',
                    nom: 'Médecin',
                    prenom: 'Connecté',
                    role: 'medecin',
                    specialite: 'Généraliste'
                };
                localStorage.setItem('medecin', JSON.stringify(minimalMedecin));
                console.log('📦 Médecin minimal créé:', minimalMedecin);
            }
        }
        
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur de connexion médecin";
    }
};

export const getMedecinProfile = async () => {
    try {
        const response = await api.get(`/ProfessionnelSante/auth/me`);
        // On s'assure de la structure
        const professionnel = response.data?.data?.professionnel || response.data?.professionnel;
        if (professionnel) {
            localStorage.setItem('medecin', JSON.stringify(professionnel));
        }
        return response.data;
    } catch (error) {
        // Ne pas lancer d'erreur pour éviter la déconnexion automatique
        // Retourner les données stockées localement si disponibles
        const storedMedecin = getStoredMedecin();
        if (storedMedecin) {
            return { data: { professionnel: storedMedecin } };
        }
        throw error;
    }
};

export const logoutMedecin = async () => {
    try {
        await api.post(`/ProfessionnelSante/auth/logout`);
        console.log("✅ Déconnexion médecin réussie côté serveur");
    } catch (error) {
        console.error("Erreur lors de la déconnexion médecin:", error);
    } finally {
        // Nettoyer les données même en cas d'erreur
        localStorage.removeItem("token");
        localStorage.removeItem("medecin");
        console.log("🗑️ Token et données médecin supprimés du localStorage");
    }
};

export const changePasswordMedecin = async (user) => {
    try {
        const response = await api.put(`/ProfessionnelSante/auth/change-password`, { user });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur de modification du mot de passe";
    }
};

export const getStoredMedecin = () => {
    try {
        console.log('🔍 getStoredMedecin - Récupération des données médecin...');
        
        const medecinRaw = localStorage.getItem("medecin");
        console.log('  - Données brutes récupérées:', medecinRaw ? `✅ Présentes (${medecinRaw.length} chars)` : '❌ Absentes');
        
        if (!medecinRaw) {
            console.log('  - ❌ Aucune donnée médecin trouvée dans localStorage');
            return null;
        }
        
        // ✅ NOUVEAU : Vérification du format des données
        let medecin = null;
        try {
            medecin = JSON.parse(medecinRaw);
            console.log('  - ✅ Données JSON parsées avec succès');
        } catch (parseError) {
            console.error('  - ❌ Erreur lors du parsing JSON:', parseError.message);
            console.log('  - 🔍 Tentative de nettoyage des données...');
            
            // Tentative de nettoyage des données corrompues
            try {
                const cleanedData = medecinRaw.replace(/[^\x20-\x7E]/g, ''); // Supprimer les caractères non-ASCII
                medecin = JSON.parse(cleanedData);
                console.log('  - ✅ Données nettoyées et parsées avec succès');
            } catch (cleanError) {
                console.error('  - ❌ Impossible de nettoyer les données:', cleanError.message);
                localStorage.removeItem("medecin");
                return null;
            }
        }
        
        if (medecin) {
            console.log('  - 📊 Données médecin récupérées:');
            console.log('    - Type:', typeof medecin);
            console.log('    - Clés disponibles:', Object.keys(medecin));
            console.log('    - ID:', medecin.id_professionnel || medecin.id || 'N/A');
            console.log('    - Nom:', medecin.nom || 'N/A');
            console.log('    - Prénom:', medecin.prenom || 'N/A');
        }
        
        return medecin;
        
    } catch (error) {
        console.error('❌ getStoredMedecin - Erreur générale:', error);
        console.log('  - 🔍 Tentative de nettoyage des données corrompues...');
        
        try {
            localStorage.removeItem("medecin");
            console.log('  - ✅ Données médecin supprimées du localStorage');
        } catch (cleanupError) {
            console.error('  - ❌ Erreur lors du nettoyage:', cleanupError.message);
        }
        
        return null;
    }
};

export const isMedecinAuthenticated = () => {
    console.log('🔍 isMedecinAuthenticated - Début de la vérification...');
    
    const token = localStorage.getItem('token');
    const medecin = getStoredMedecin();
    
    // ✅ NOUVEAU : Logs détaillés des tokens et données
    console.log('  - 🔑 Token récupéré:', token ? `✅ Présent (${token.substring(0, 30)}...)` : '❌ Absent');
    console.log('  - 👨‍⚕️ Données médecin récupérées:', medecin ? '✅ Présentes' : '❌ Absentes');
    
    if (medecin) {
        console.log('  - 📊 Détails des données médecin:');
        console.log('    - ID:', medecin.id_professionnel || medecin.id || 'N/A');
        console.log('    - Nom:', medecin.nom || 'N/A');
        console.log('    - Prénom:', medecin.prenom || 'N/A');
        console.log('    - Rôle:', medecin.role || 'N/A');
        console.log('    - Spécialité:', medecin.specialite || 'N/A');
    }
    
    // ✅ NOUVEAU : Vérification détaillée de l'authentification
    const hasToken = !!token;
    const hasMedecinData = !!medecin;
    const isAuth = hasToken && hasMedecinData;
    
    console.log('  - 🔍 Analyse de l\'authentification:');
    console.log('    - Token présent:', hasToken);
    console.log('    - Données médecin présentes:', hasMedecinData);
    console.log('    - Résultat final:', isAuth ? '✅ Authentifié' : '❌ Non authentifié');
    
    if (!isAuth) {
        console.log('  - ⚠️ Raison de l\'échec:');
        if (!hasToken) console.log('    - Token manquant');
        if (!hasMedecinData) console.log('    - Données médecin manquantes');
    }
    
    return isAuth;
};

// Fonction pour récupérer les informations complètes du médecin
export const fetchMedecinDetails = async () => {
    try {
        console.log('🔍 Récupération des détails du médecin...');
        
        // ✅ CORRECTION : Nettoyer les tokens temporaires d'abord
        cleanupTemporaryTokens();
        
        // ✅ CORRECTION : Récupérer le bon token d'authentification
        const authToken = getValidAuthToken();
        if (!authToken) {
            console.log('❌ Aucun token d\'authentification valide disponible');
            throw new Error('Token d\'authentification manquant');
        }
        
        console.log('🔑 Token d\'authentification utilisé:', authToken.substring(0, 20) + '...');
        
        // ✅ CORRECTION : Configurer l'API avec le bon token
        const response = await api.get('/ProfessionnelSante/profile', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('✅ Réponse reçue de /ProfessionnelSante/profile:', response.data);
        
        if (response.data && response.data.professionnel) {
            const medecinData = response.data.professionnel;
            
            // ✅ CORRECTION : S'assurer que la spécialité est bien récupérée
            if (!medecinData.specialite && medecinData.specialite_id) {
                console.log('🔍 Spécialité ID trouvée, récupération des détails...');
                try {
                    const specialiteResponse = await api.get(`/ProfessionnelSante/specialite/${medecinData.specialite_id}`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    if (specialiteResponse.data && specialiteResponse.data.nom) {
                        medecinData.specialite = specialiteResponse.data.nom;
                        console.log('✅ Spécialité récupérée:', medecinData.specialite);
                    }
                } catch (specialiteError) {
                    console.log('⚠️ Impossible de récupérer la spécialité, utilisation de la valeur par défaut');
                    medecinData.specialite = 'Généraliste';
                }
            }
            
            localStorage.setItem('medecin', JSON.stringify(medecinData));
            console.log('✅ Données médecin mises à jour:', medecinData);
            return medecinData;
        }
        
        console.log('⚠️ Structure de réponse inattendue:', response.data);
        return null;
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des détails:', error);
        
        if (error.response) {
            console.error('🔍 Détails de l\'erreur:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                headers: error.response.headers
            });
        }
        
        // ✅ CORRECTION : Tentative de récupération des données stockées localement
        console.log('🔍 Tentative de récupération des données stockées localement...');
        const storedMedecin = getStoredMedecin();
        if (storedMedecin) {
            console.log('✅ Utilisation des données stockées localement:', storedMedecin);
            return storedMedecin;
        }
        
        throw error;
    }
};

// ✅ NOUVELLE FONCTION : Récupérer la liste des patients
export const fetchPatientsList = async () => {
    try {
        console.log('🔍 Récupération de la liste des patients...');
        
        // ✅ CORRECTION : Nettoyer les tokens temporaires d'abord
        cleanupTemporaryTokens();
        
        // ✅ CORRECTION : Récupérer le bon token d'authentification
        const authToken = getValidAuthToken();
        if (!authToken) {
            console.log('❌ Aucun token d\'authentification valide disponible');
            throw new Error('Token d\'authentification manquant');
        }
        
        console.log('🔑 Token d\'authentification utilisé:', authToken.substring(0, 20) + '...');
        
        // ✅ AMÉLIORATION : Essayer plusieurs endpoints possibles
        let response = null;
        let endpoint = '';
        
        // Essayer d'abord l'endpoint principal
        try {
            endpoint = '/ProfessionnelSante/patients';
            console.log('🔍 Tentative avec endpoint:', endpoint);
            response = await api.get(endpoint, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            console.log('✅ Réponse reçue de', endpoint, ':', response.data);
        } catch (error) {
            console.log('⚠️ Échec avec', endpoint, ', tentative avec endpoint alternatif...');
            
            // Essayer l'endpoint alternatif
            try {
                endpoint = '/ProfessionnelSante/patient/list';
                console.log('🔍 Tentative avec endpoint alternatif:', endpoint);
                response = await api.get(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                console.log('✅ Réponse reçue de', endpoint, ':', response.data);
            } catch (error2) {
                console.log('⚠️ Échec avec', endpoint, ', tentative avec endpoint de base...');
                
                // Essayer l'endpoint de base
                try {
                    endpoint = '/ProfessionnelSante/patient';
                    console.log('🔍 Tentative avec endpoint de base:', endpoint);
                    response = await api.get(endpoint, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    console.log('✅ Réponse reçue de', endpoint, ':', response.data);
                } catch (error3) {
                    console.error('❌ Tous les endpoints ont échoué pour la récupération des patients');
                    throw error3;
                }
            }
        }
        
        if (response && response.data) {
            console.log('🔍 Structure de la réponse analysée:', {
                hasData: !!response.data,
                dataType: typeof response.data,
                isArray: Array.isArray(response.data),
                keys: response.data ? Object.keys(response.data) : [],
                dataPreview: response.data ? JSON.stringify(response.data).substring(0, 200) + '...' : 'null'
            });
            
            let patients = [];
            
            // ✅ GESTION INTELLIGENTE DES STRUCTURES DE RÉPONSE
            if (response.data.patients && Array.isArray(response.data.patients)) {
                // Structure : { patients: [...] }
                patients = response.data.patients;
                console.log('✅ Patients extraits de response.data.patients:', patients.length);
            } else if (response.data.patient && Array.isArray(response.data.patient)) {
                // Structure : { patient: [...] }
                patients = response.data.patient;
                console.log('✅ Patients extraits de response.data.patient:', patients.length);
            } else if (response.data.data && Array.isArray(response.data.data)) {
                // Structure : { data: [...] }
                patients = response.data.data;
                console.log('✅ Patients extraits de response.data.data:', patients.length);
            } else if (Array.isArray(response.data)) {
                // Structure : [...] directement
                patients = response.data;
                console.log('✅ Patients extraits directement de response.data:', patients.length);
            } else if (response.data.results && Array.isArray(response.data.results)) {
                // Structure : { results: [...] }
                patients = response.data.results;
                console.log('✅ Patients extraits de response.data.results:', patients.length);
            } else {
                console.log('⚠️ Structure de réponse non reconnue, tentative d\'extraction manuelle...');
                
                // Essayer de trouver des patients dans la réponse
                const searchForPatients = (obj, depth = 0) => {
                    if (depth > 3) return null; // Éviter la récursion infinie
                    
                    for (const [key, value] of Object.entries(obj)) {
                        if (Array.isArray(value) && value.length > 0) {
                            // Vérifier si c'est un tableau de patients
                            const firstItem = value[0];
                            if (firstItem && (firstItem.nom || firstItem.prenom || firstItem.numero_assure || firstItem.id_patient)) {
                                console.log('✅ Patients trouvés dans', key, ':', value.length);
                                return value;
                            }
                        } else if (typeof value === 'object' && value !== null) {
                            const result = searchForPatients(value, depth + 1);
                            if (result) return result;
                        }
                    }
                    return null;
                };
                
                const foundPatients = searchForPatients(response.data);
                if (foundPatients) {
                    patients = foundPatients;
                    console.log('✅ Patients extraits par recherche récursive:', patients.length);
                }
            }
            
            if (patients.length > 0) {
                console.log('✅ Liste des patients récupérée avec succès:', {
                    count: patients.length,
                    firstPatient: patients[0],
                    lastPatient: patients[patients.length - 1],
                    sampleNames: patients.slice(0, 3).map(p => p.nom || p.prenom || 'N/A')
                });
                return patients;
            } else {
                console.log('⚠️ Aucun patient trouvé dans la réponse');
                return [];
            }
        }
        
        console.log('⚠️ Réponse invalide ou vide');
        return [];
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la liste des patients:', error);
        
        if (error.response) {
            console.error('🔍 Détails de l\'erreur:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                headers: error.response.headers
            });
        }
        
        return [];
    }
};

// ✅ NOUVELLE FONCTION : Récupérer les dossiers patients
export const fetchPatientFiles = async () => {
    try {
        console.log('🔍 Récupération des dossiers patients...');
        
        // ✅ CORRECTION : Nettoyer les tokens temporaires d'abord
        cleanupTemporaryTokens();
        
        // ✅ CORRECTION : Récupérer le bon token d'authentification
        const authToken = getValidAuthToken();
        if (!authToken) {
            console.log('❌ Aucun token d\'authentification valide disponible');
            throw new Error('Token d\'authentification manquant');
        }
        
        console.log('🔑 Token d\'authentification utilisé:', authToken.substring(0, 20) + '...');
        
        const response = await api.get(`/ProfessionnelSante/dossiers-patients`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('✅ Dossiers patients reçus:', response.data);
        
        if (response.data && response.data.dossiers) {
            return response.data.dossiers;
        } else if (response.data && Array.isArray(response.data)) {
            return response.data;
        }
        
        return [];
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des dossiers patients:', error);
        
        if (error.response) {
            console.error('🔍 Détails de l\'erreur:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
        
        return [];
    }
};

// ✅ NOUVELLE FONCTION : Récupérer un dossier patient spécifique
export const fetchPatientFile = async (patientId) => {
    try {
        console.log(`🔍 Récupération du dossier patient ${patientId}...`);
        
        // ✅ CORRECTION : Nettoyer les tokens temporaires d'abord
        cleanupTemporaryTokens();
        
        // ✅ CORRECTION : Récupérer le bon token d'authentification
        const authToken = getValidAuthToken();
        if (!authToken) {
            console.log('❌ Aucun token d\'authentification valide disponible');
            throw new Error('Token d\'authentification manquant');
        }
        
        console.log('🔑 Token d\'authentification utilisé:', authToken.substring(0, 20) + '...');
        
        const response = await api.get(`/ProfessionnelSante/dossier-patient/${patientId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('✅ Dossier patient reçu:', response.data);
        
        if (response.data && response.data.dossier) {
            return response.data.dossier;
        } else if (response.data) {
            return response.data;
        }
        
        return null;
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération du dossier patient ${patientId}:`, error);
        
        if (error.response) {
            console.error('🔍 Détails de l\'erreur:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
        
        return null;
    }
};

// ✅ NOUVELLE FONCTION : Récupérer les consultations
export const fetchConsultations = async () => {
    try {
        console.log('🔍 Récupération des consultations...');
        
        // ✅ CORRECTION : Nettoyer les tokens temporaires d'abord
        cleanupTemporaryTokens();
        
        // ✅ CORRECTION : Récupérer le bon token d'authentification
        const authToken = getValidAuthToken();
        if (!authToken) {
            console.log('❌ Aucun token d\'authentification valide disponible');
            throw new Error('Token d\'authentification manquant');
        }
        
        console.log('🔑 Token d\'authentification utilisé:', authToken.substring(0, 20) + '...');
        
        const response = await api.get(`/ProfessionnelSante/consultations`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('✅ Consultations reçues:', response.data);
        
        if (response.data && response.data.consultations) {
            return response.data.consultations;
        } else if (response.data && Array.isArray(response.data)) {
            return response.data;
        }
        
        return [];
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des consultations:', error);
        
        if (error.response) {
            console.error('🔍 Détails de l\'erreur:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
        
        return [];
    }
};

// ================================
// UTILITAIRES
// ================================

// Fonction pour déterminer le type d'utilisateur connecté
export const getUserType = () => {
    console.log('🔍 getUserType - Détermination du type d\'utilisateur...');
    
    // ✅ NOUVEAU : Logs détaillés de chaque vérification
    console.log('  - 🔍 Vérification patient...');
    const isPatient = isPatientAuthenticated();
    console.log('    - Résultat:', isPatient ? '✅ Patient authentifié' : '❌ Patient non authentifié');
    
    if (isPatient) {
        console.log('  - ✅ Type d\'utilisateur déterminé: patient');
        return 'patient';
    }
    
    console.log('  - 🔍 Vérification médecin...');
    const isMedecin = isMedecinAuthenticated();
    console.log('    - Résultat:', isMedecin ? '✅ Médecin authentifié' : '❌ Médecin non authentifié');
    
    if (isMedecin) {
        console.log('  - ✅ Type d\'utilisateur déterminé: medecin');
        return 'medecin';
    }
    
    console.log('  - 🔍 Vérification authentification générale...');
    const isGeneralAuth = isAuthenticated();
    console.log('    - Résultat:', isGeneralAuth ? '✅ Authentification générale' : '❌ Pas d\'authentification générale');
    
    if (isGeneralAuth) {
        console.log('  - ✅ Type d\'utilisateur déterminé: user');
        return 'user';
    }
    
    console.log('  - ❌ Aucun type d\'utilisateur déterminé');
    return null;
};

// Fonction pour obtenir les données de l'utilisateur connecté
export const getCurrentUser = () => {
    const userType = getUserType();
    
    switch (userType) {
        case 'patient':
            return { type: 'patient', data: getStoredPatient() };
        case 'medecin':
            return { type: 'medecin', data: getStoredMedecin() };
        default:
            return null;
    }
};

// ================================
// RÉCUPÉRATION JWT APRÈS VALIDATION 2FA
// ================================

export const getValidJWTAfter2FA = async (userType, identifier, credentials = null) => {
    try {
        console.log('🔐 DEBUG - Tentative de récupération JWT après validation 2FA:', {
            userType,
            identifier: identifier ? `${identifier.substring(0, 20)}...` : 'N/A',
            hasCredentials: !!credentials
        });
        
        // ✅ TENTATIVE 1: Utiliser le JWT original stocké lors de la première connexion
        const originalJWT = localStorage.getItem('originalJWT');
        const firstConnectionToken = localStorage.getItem('firstConnectionToken');
        
        if (originalJWT || firstConnectionToken) {
            const validJWT = originalJWT || firstConnectionToken;
            console.log('✅ JWT original trouvé et réutilisé:', validJWT.substring(0, 30) + '...');
            
            // Stocker dans la bonne clé selon le type d'utilisateur
            if (userType === 'patient') {
                localStorage.setItem('jwt', validJWT);
                console.log('🔐 JWT patient restauré après 2FA');
            } else {
                localStorage.setItem('token', validJWT);
                console.log('🔐 JWT professionnel restauré après 2FA');
            }
            
            return validJWT;
        }
        
        // ✅ TENTATIVE 2: FAIRE UN VRAI APPEL DE CONNEXION AU SERVEUR
        console.log('⚠️ Aucun JWT original trouvé, appel API de connexion...');
        
        let loginResponse = null;
        
        if (userType === 'patient') {
            // Appel de connexion patient
            console.log('🔐 Appel de connexion patient...');
            loginResponse = await loginPatient({ numero_assure: identifier, ...credentials });
        } else {
            // Appel de connexion médecin
            console.log('🔐 Appel de connexion médecin...');
            loginResponse = await loginMedecin({ numero_adeli: identifier, ...credentials });
        }
        
        console.log('🔐 Réponse de connexion reçue:', loginResponse);
        
        // Extraire le JWT de la réponse de connexion
        let newJWT = null;
        
        if (loginResponse.token) {
            newJWT = loginResponse.token;
        } else if (loginResponse.data && loginResponse.data.token) {
            newJWT = loginResponse.data.token;
        } else if (loginResponse.jwt) {
            newJWT = loginResponse.jwt;
        }
        
        if (newJWT) {
            console.log('✅ Vrai JWT obtenu du serveur via connexion:', newJWT.substring(0, 30) + '...');
            
            // Stocker le nouveau JWT
            if (userType === 'patient') {
                localStorage.setItem('jwt', newJWT);
                localStorage.setItem('originalJWT', newJWT);
            } else {
                localStorage.setItem('token', newJWT);
                localStorage.setItem('originalJWT', newJWT);
            }
            
            return newJWT;
        }
        
        throw new Error('Aucun JWT valide obtenu de la connexion serveur');
        
    } catch (error) {
        console.error('❌ ERREUR lors de la récupération JWT après 2FA:', error);
        
        // ✅ TENTATIVE 3: Essayer un refresh token en dernier recours
        console.log('⚠️ Tentative de refresh token en dernier recours...');
        
        try {
            let endpoint = '';
            let payload = {};
            
            if (userType === 'patient') {
                endpoint = '/patient/auth/refresh-token';
                payload = { numero_assure: identifier };
            } else {
                endpoint = '/ProfessionnelSante/auth/refresh-token';
                payload = { numero_adeli: identifier };
            }
            
            const response = await api.post(endpoint, payload);
            
            if (response.data.token || response.data.jwt) {
                const refreshJWT = response.data.token || response.data.jwt;
                console.log('✅ JWT obtenu via refresh token:', refreshJWT.substring(0, 30) + '...');
                
                // Stocker le JWT de refresh
                if (userType === 'patient') {
                    localStorage.setItem('jwt', refreshJWT);
                    localStorage.setItem('originalJWT', refreshJWT);
                } else {
                    localStorage.setItem('token', refreshJWT);
                    localStorage.setItem('originalJWT', refreshJWT);
                }
                
                return refreshJWT;
            }
        } catch (refreshError) {
            console.error('❌ Refresh token également échoué:', refreshError);
        }
        
        // 🚨 DERNIER RECOURS : Créer un JWT temporaire
        console.log('🚨 Création d\'un JWT temporaire en dernier recours...');
        
        const tempJWT = `temp_jwt_${userType}_${Date.now()}`;
        
        if (userType === 'patient') {
            localStorage.setItem('jwt', tempJWT);
        } else {
            localStorage.setItem('token', tempJWT);
        }
        
        console.log('🔐 JWT temporaire créé:', tempJWT);
        return tempJWT;
    }
};

// Déconnexion universelle
export const logoutAll = async () => {
    const userType = getUserType();
    
    try {
        switch (userType) {
            case 'patient':
                await logoutPatient();
                break;
            case 'medecin':
                await logoutMedecin();
                break;
            default:
                await logout();
                break;
        }
    } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
    } finally {
        clearAuthData();
        // Nettoyer aussi les tokens de première connexion lors de la déconnexion complète
        localStorage.removeItem('originalJWT');
        localStorage.removeItem('firstConnectionToken');
    }
};

// Fonction pour décoder un token JWT
const decodeJWT = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Erreur lors du décodage du JWT:', error);
        return null;
    }
};

// Fonction pour extraire les informations du médecin depuis le token
const extractMedecinFromToken = (token) => {
    const decoded = decodeJWT(token);
    if (decoded) {
        console.log('🔍 Token décodé:', decoded);
        
        // Chercher les informations du médecin dans le token
        const medecinInfo = {
            id: decoded.professionnel_id || decoded.medecin_id || decoded.id,
            role: decoded.role || 'medecin',
            // Autres informations qui pourraient être dans le token
            ...decoded
        };
        
        console.log('✅ Informations extraites du token:', medecinInfo);
        return medecinInfo;
    }
    return null;
};

const authApi = {
    // Authentification générale
    login,
    register,
    logout,
    me,
    changePassword,
    isAuthenticated,
    
    // Authentification patient
    loginPatient,
    getPatientProfile,
    logoutPatient,
    getStoredPatient,
    isPatientAuthenticated,
    
    // Authentification médecin
    loginMedecin,
    getMedecinProfile,
    logoutMedecin,
    getStoredMedecin,
    isMedecinAuthenticated,
    changePasswordMedecin,
    fetchMedecinDetails,
    fetchPatientsList,
    fetchPatientFiles,
    fetchPatientFile,
    fetchConsultations,
    
    // Utilitaires
    getUserType,
    getCurrentUser,
    logoutAll,
    clearAuthData,
    cleanupTemporaryTokens,
    checkAuthenticationStatus,
    
    // Récupération JWT après 2FA
    getValidJWTAfter2FA
};

export default authApi;