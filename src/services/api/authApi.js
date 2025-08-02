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
        
        // Pour les routes médecin, utiliser le token général
        if (config.url && config.url.includes('/ProfessionnelSante/')) {
            if (generalToken) {
                config.headers.Authorization = `Bearer ${generalToken}`;
            }
        } else if (jwtToken) {
            // Pour les autres routes, prioriser le JWT
            config.headers.Authorization = `Bearer ${jwtToken}`;
        } else if (generalToken) {
            config.headers.Authorization = `Bearer ${generalToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor pour gérer les erreurs d'authentification
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // On laisse la gestion du 401 au composant appelant
        return Promise.reject(error);
    }
);

// Fonction utilitaire pour nettoyer les données d'authentification
const clearAuthData = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("token");
    localStorage.removeItem("medecin");
    localStorage.removeItem("patient");
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
    return !!(localStorage.getItem('token') || localStorage.getItem('jwt'));
};

// ================================
// AUTHENTIFICATION PATIENT
// ================================

export const loginPatient = async (identifiant) => {
    try {
        const response = await api.post(`/patient/auth/login`, identifiant);
        const { token, data } = response.data;
        if (token && data && data.patient) {
            localStorage.setItem("jwt", token);
            localStorage.setItem("patient", JSON.stringify(data.patient));
        }
        return response.data;
    } catch (error) {
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
            localStorage.setItem('token', response.data.token);
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
        const medecin = localStorage.getItem("medecin");
        return medecin ? JSON.parse(medecin) : null;
    } catch (error) {
        console.error('Erreur lors du parsing des données médecin:', error);
        localStorage.removeItem("medecin");
        return null;
    }
};

export const isMedecinAuthenticated = () => {
    const token = localStorage.getItem('token');
    const medecin = getStoredMedecin();
    
    console.log('🔍 Vérification authentification médecin:');
    console.log('  - Token:', token ? '✅ Présent' : '❌ Absent');
    console.log('  - Données médecin:', medecin ? '✅ Présentes' : '❌ Absentes');
    console.log('  - Données médecin détaillées:', medecin);
    
    const isAuth = !!(token && medecin);
    console.log('  - Résultat authentification:', isAuth ? '✅ Authentifié' : '❌ Non authentifié');
    
    return isAuth;
};

// Fonction pour récupérer les informations complètes du médecin
export const fetchMedecinDetails = async () => {
    try {
        console.log('🔍 Récupération des détails du médecin...');
        const response = await api.get(`/ProfessionnelSante/profile`);
        console.log('✅ Détails médecin reçus:', response.data);
        
        if (response.data && response.data.professionnel) {
            const medecinData = response.data.professionnel;
            localStorage.setItem('medecin', JSON.stringify(medecinData));
            console.log('✅ Données médecin mises à jour:', medecinData);
            return medecinData;
        }
        
        return null;
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des détails:', error);
        return null;
    }
};

// ================================
// UTILITAIRES
// ================================

// Fonction pour déterminer le type d'utilisateur connecté
export const getUserType = () => {
    if (isPatientAuthenticated()) return 'patient';
    if (isMedecinAuthenticated()) return 'medecin';
    if (isAuthenticated()) return 'user';
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
    
    // Utilitaires
    getUserType,
    getCurrentUser,
    logoutAll,
    clearAuthData
};

export default authApi;