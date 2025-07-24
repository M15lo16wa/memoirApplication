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
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor to handle 401 errors (unauthorized) patient
api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("jwt");
        localStorage.removeItem("token");
        localStorage.removeItem("medecin");
        localStorage.removeItem("patient");
        window.location = "/connexion";
      }
      return Promise.reject(error);
    }
  );

// 1-) connexion d'un utilisateur
export const login = async (identifiant) => {
    try {
        const response = await api.post(`/auth/login`, identifiant);
        // Stocker le token dans localStorage
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur de connexion";
    }
};

// Vérifier si l'utilisateur est authentifié
export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

// 2-) inscription d'un utilisateur
export const register = async(user) => {
    try{
        const response = await api.post(`/auth/register`,  {user});
        return response.data;
    }catch(error){
        throw error.response?.data?.message || "Erreur d'inscription";
    }
};

// 3-) deconnexion d'un utilisateur
export const logout = async () => {
    try {
        const response = await api.post("/auth/logout");
        // Stockes d'un token :
        localStorage.removeItem("token");
        console.log("Deconnexion reussie");
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur de deconnexion";
    }
};

// 4-) informations sur la session d'un utilisateur
export const me = async() => {
    try{
        const response = await api.get(`/auth/me`);
        return response.data;
    }catch(error){
        throw error.response?.data?.message || "Erreur de récupération des informations de la session";
    }
};

// 5-) modification du mot de passe d'un utilisateur
export const changePassword = async (user) => {
    try {
        const response = await api.put(`/auth/change-password`, { user });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur de modification du mot de passe";
    }
};

// authentification pour le patient
// 1-) Authentification pour le patient
export const loginPatient = async (identifiant) => {
    try {
      const response = await api.post(`/patient/auth/login`, identifiant);
      const { token, data } = response.data;
      
      if (token) {
        localStorage.setItem("jwt", token);
        localStorage.setItem("patient", JSON.stringify(data.patient));
      }
      
      return data.patient; // Returns patient data including numero_dossier
    } catch (error) {
      throw error.response?.data?.message || "Erreur de connexion";
    }
  };

  // 2-)Récupération du profil patient
export const getPatientProfile = async () => {
    try {
      const response = await api.get(`/patient/auth/me`);
      const { data } = response.data;
      
      // Update stored patient data
      localStorage.setItem("patient", JSON.stringify(data.patient));
      
      return data.patient; // Return patient data including numero_dossier
    } catch (error) {
      throw error.response?.data?.message || "Erreur de récupération du profil patient";
    }
  };

// 3-)  deconnexion du profil patient
  export const logoutPatient = async () => {
    try {
      await api.post(`/patient/auth/logout`);
      localStorage.removeItem("jwt");
      localStorage.removeItem("patient");
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
      // Remove token and patient data even if the request fails
      localStorage.removeItem("jwt");
      localStorage.removeItem("patient");
    }
  };

// 4-) Récupéreration des données du patient depuis localStorage
export const getStoredPatient = () => {
    const patient = localStorage.getItem("patient");
    return patient ? JSON.parse(patient) : null;
  };

// authentification pour le professionnel de santé
export const loginMedecin = async (identifiant) => {
    try {
        const response = await api.post(`/ProfessionnelSante/auth/login`, identifiant);
        // Stocker le token si présent
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur de connexion";
    }
};

// recuperation du profil professionnel de santé
export const getMedecinProfile = async () => {
    try {
        const response = await api.get(`/ProfessionnelSante/auth/me`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur de récupération du profil médecin";
    }
};

// 5-) deconnexion du profil professionnel de santé
export const logoutMedecin = async () => {
    try {
        await api.post(`/ProfessionnelSante/auth/logout`);
        localStorage.removeItem("token");
    } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
        // Remove token even if the request fails
        localStorage.removeItem("token");
    }
};

// 6-) informations sur la session d'un professionnel de santé
export const meMedecin = async () => {
    try {
        const response = await api.get(`/ProfessionnelSante/auth/me`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur de récupération des informations de la session";
    }
};

// 7-) modification du mot de passe d'un professionnel de santé
export const changePasswordMedecin = async (user) => {
    try {
        const response = await api.put(`/ProfessionnelSante/auth/change-password`, { user });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Erreur de modification du mot de passe";
    }
};

export default {
    login,
    register,
    logout,
    me,
    changePassword,
    loginPatient,
    getPatientProfile,
    logoutPatient,
    getStoredPatient,
    loginMedecin,
    getMedecinProfile
};
