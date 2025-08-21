import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  isMedecinAuthenticated, 
  isPatientAuthenticated, 
  getUserType,
  isAuthenticated
} from './authApi';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
    </div>
  </div>
);

// Route protégée intelligente qui détermine automatiquement le type d'utilisateur
export const ProtectedRoute = ({ children, allowedUserTypes = ['medecin', 'patient'] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      console.log('🔍 ProtectedRoute - Vérification authentification...');
      console.log('  - URL actuelle:', location.pathname);
      console.log('  - Timestamp:', new Date().toISOString());
      console.log('  - Types autorisés:', allowedUserTypes);
      
      // ✅ NOUVEAU : Logs détaillés des tokens
      const token = localStorage.getItem('token');
      const jwt = localStorage.getItem('jwt');
      const medecin = localStorage.getItem('medecin');
      const patient = localStorage.getItem('patient');
      
      console.log('  - 🔑 Tokens disponibles:');
      console.log('    - token:', token ? `✅ Présent (${token.substring(0, 30)}...)` : '❌ Absent');
      console.log('    - jwt:', jwt ? `✅ Présent (${jwt.substring(0, 30)}...)` : '❌ Absent');
      console.log('    - medecin:', medecin ? `✅ Présent (${medecin.substring(0, 50)}...)` : '❌ Absent');
      console.log('    - patient:', patient ? `✅ Présent (${patient.substring(0, 50)}...)` : '❌ Absent');
      
      const currentUserType = getUserType();
      const isMedecin = isMedecinAuthenticated();
      const isPatient = isPatientAuthenticated();
      const isGeneralAuth = isAuthenticated();
      
      console.log('  - 🔍 Résultats des vérifications:');
      console.log('    - Type d\'utilisateur détecté:', currentUserType);
      console.log('    - Médecin authentifié:', isMedecin);
      console.log('    - Patient authentifié:', isPatient);
      console.log('    - Authentification générale:', isGeneralAuth);
      
      if (currentUserType && allowedUserTypes.includes(currentUserType)) {
        console.log('✅ ProtectedRoute - Utilisateur autorisé, affichage du contenu');
        setIsUserAuthenticated(true);
      } else {
        console.log('❌ ProtectedRoute - Accès non autorisé - redirection vers connexion');
        console.log('  - Raison: currentUserType =', currentUserType, 'allowedUserTypes =', allowedUserTypes);
        
        let message = "Veuillez vous connecter pour accéder à cette page";
        if (allowedUserTypes.length === 1) {
          if (allowedUserTypes[0] === 'medecin') {
            message = "Veuillez vous connecter en tant que médecin pour accéder à cette page";
          } else if (allowedUserTypes[0] === 'patient') {
            message = "Veuillez vous connecter pour accéder à votre espace patient";
          }
        }
        
        console.log('  - Redirection vers /connexion avec message:', message);
        navigate("/connexion", { 
          state: { 
            from: location.pathname,
            message: message
          } 
        });
      }
      setIsLoading(false);
    };

    console.log('🔐 ProtectedRoute - useEffect déclenché');
    console.log('  - Dépendances:', { navigate: !!navigate, location: location.pathname, allowedUserTypes });
    checkAuth();
  }, [navigate, location, allowedUserTypes]);

  if (isLoading) return <LoadingScreen />;
  return isUserAuthenticated ? children : null;
};

// Route protégée spécifiquement pour les médecins
export const ProtectedMedecinRoute = ({ children }) => {
  console.log('🔐 ProtectedMedecinRoute - Rendu du composant');
  return <ProtectedRoute allowedUserTypes={['medecin']}>{children}</ProtectedRoute>;
};

// Route protégée spécifiquement pour les patients
export const ProtectedPatientRoute = ({ children }) => {
  return <ProtectedRoute allowedUserTypes={['patient']}>{children}</ProtectedRoute>;
};

// Route protégée pour les médecins ET les patients
export const ProtectedMedecinOrPatientRoute = ({ children }) => {
  return <ProtectedRoute allowedUserTypes={['medecin', 'patient']}>{children}</ProtectedRoute>;
};

// Route protégée pour les administrateurs (utilise l'authentification générale)
export const ProtectedAdminRoute = ({ children }) => {
  return <ProtectedRoute allowedUserTypes={['medecin', 'user']}>{children}</ProtectedRoute>;
};

// Export par défaut pour la rétrocompatibilité (route intelligente par défaut)
export default ProtectedRoute;