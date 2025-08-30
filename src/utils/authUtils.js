/**
 * Utilitaires d'authentification pour éviter les appels API inutiles
 */

/**
 * Vérifie si l'utilisateur est authentifié en cherchant un token valide
 * @returns {boolean} True si l'utilisateur est authentifié
 */
export const isAuthenticated = () => {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('jwt') || 
                  localStorage.getItem('medecin') || 
                  localStorage.getItem('professionnel') || 
                  localStorage.getItem('patient');
    
    return !!token;
};

/**
 * Vérifie si l'utilisateur est un professionnel de santé
 * @returns {boolean} True si l'utilisateur est un professionnel
 */
export const isHealthcareProfessional = () => {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('medecin') || 
                  localStorage.getItem('professionnel');
    
    return !!token;
};

/**
 * Vérifie si l'utilisateur est un patient
 * @returns {boolean} True si l'utilisateur est un patient
 */
export const isPatient = () => {
    const token = localStorage.getItem('jwt') || 
                  localStorage.getItem('patient');
    
    return !!token;
};

/**
 * Récupère le type d'utilisateur actuel
 * @returns {string|null} 'professionnel', 'patient', ou null si non authentifié
 */
export const getUserType = () => {
    if (isHealthcareProfessional()) {
        return 'professionnel';
    } else if (isPatient()) {
        return 'patient';
    }
    return null;
};

/**
 * Récupère le token d'authentification actuel
 * @returns {string|null} Le token ou null si non authentifié
 */
export const getCurrentToken = () => {
    return localStorage.getItem('token') || 
           localStorage.getItem('jwt') || 
           localStorage.getItem('medecin') || 
           localStorage.getItem('professionnel') || 
           localStorage.getItem('patient') || 
           null;
};

/**
 * Vérifie si l'utilisateur peut accéder aux fonctionnalités DMP
 * @returns {boolean} True si l'accès DMP est autorisé
 */
export const canAccessDMP = () => {
    return isAuthenticated() && (isHealthcareProfessional() || isPatient());
};

/**
 * Log d'authentification pour le débogage
 * @param {string} context - Contexte de l'appel (nom du composant/fonction)
 */
export const logAuthStatus = (context) => {
    console.log(`🔐 [${context}] Statut d'authentification:`, {
        isAuthenticated: isAuthenticated(),
        userType: getUserType(),
        hasToken: !!getCurrentToken(),
        tokenPreview: getCurrentToken() ? getCurrentToken().substring(0, 20) + '...' : 'N/A'
    });
};
