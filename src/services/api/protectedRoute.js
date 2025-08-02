import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  isMedecinAuthenticated, 
  getStoredMedecin, 
  isPatientAuthenticated, 
  getStoredPatient,
  getUserType
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      console.log('🔍 ProtectedRoute - Vérification authentification...');
      
      const currentUserType = getUserType();
      const isMedecin = isMedecinAuthenticated();
      const isPatient = isPatientAuthenticated();
      
      console.log('  - Type d\'utilisateur détecté:', currentUserType);
      console.log('  - Médecin authentifié:', isMedecin);
      console.log('  - Patient authentifié:', isPatient);
      console.log('  - Types autorisés:', allowedUserTypes);
      
      if (currentUserType && allowedUserTypes.includes(currentUserType)) {
        console.log('✅ Utilisateur autorisé, affichage du contenu');
        setIsAuthenticated(true);
        setUserType(currentUserType);
      } else {
        console.log('❌ Accès non autorisé - redirection vers connexion');
        
        let message = "Veuillez vous connecter pour accéder à cette page";
        if (allowedUserTypes.length === 1) {
          if (allowedUserTypes[0] === 'medecin') {
            message = "Veuillez vous connecter en tant que médecin pour accéder à cette page";
          } else if (allowedUserTypes[0] === 'patient') {
            message = "Veuillez vous connecter pour accéder à votre espace patient";
          }
        }
        
        navigate("/connexion", { 
          state: { 
            from: location.pathname,
            message: message
          } 
        });
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate, location, allowedUserTypes]);

  if (isLoading) return <LoadingScreen />;
  return isAuthenticated ? children : null;
};

// Route protégée spécifiquement pour les médecins
export const ProtectedMedecinRoute = ({ children }) => {
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

// Export par défaut pour la rétrocompatibilité (route intelligente par défaut)
export default ProtectedRoute;