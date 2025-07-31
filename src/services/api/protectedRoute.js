import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  isMedecinAuthenticated, 
  getStoredMedecin, 
  isPatientAuthenticated, 
  getStoredPatient 
} from './authApi';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
    </div>
  </div>
);

// Route protégée pour les médecins
export const ProtectedMedecinRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      console.log('🔍 ProtectedMedecinRoute - Vérification authentification médecin...');
      const authenticated = isMedecinAuthenticated();
      const storedMedecin = getStoredMedecin();
      
      console.log('  - isMedecinAuthenticated():', authenticated);
      console.log('  - getStoredMedecin():', storedMedecin);
      
      if (authenticated && storedMedecin) {
        console.log('✅ Médecin authentifié, affichage du contenu');
        setIsAuthenticated(true);
      } else {
        console.log('❌ Accès non autorisé - redirection vers connexion');
        navigate("/connexion", { 
          state: { 
            from: location.pathname,
            message: "Veuillez vous connecter en tant que médecin pour accéder à cette page"
          } 
        });
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate, location]);

  if (isLoading) return <LoadingScreen />;
  return isAuthenticated ? children : null;
};

// Route protégée pour les patients
export const ProtectedPatientRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      console.log('🔍 ProtectedPatientRoute - Vérification authentification patient...');
      const authenticated = isPatientAuthenticated();
      const storedPatient = getStoredPatient();
      
      console.log('  - isPatientAuthenticated():', authenticated);
      console.log('  - getStoredPatient():', storedPatient);
      
      if (authenticated && storedPatient) {
        console.log('✅ Patient authentifié, affichage du contenu');
        setIsAuthenticated(true);
      } else {
        console.log('❌ Accès non autorisé - redirection vers connexion');
        navigate("/connexion", { 
          state: { 
            from: location.pathname,
            message: "Veuillez vous connecter pour accéder à votre espace patient"
          } 
        });
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate, location]);

  if (isLoading) return <LoadingScreen />;
  return isAuthenticated ? children : null;
};

// Export par défaut pour la rétrocompatibilité
export default ProtectedMedecinRoute;