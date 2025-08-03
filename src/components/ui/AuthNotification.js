import React, { useState, useEffect } from 'react';
import { getUserType, getCurrentUser } from '../../services/api/authApi';

const AuthNotification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const type = getUserType();
      const user = getCurrentUser();
      
      if (type && !userType) {
        // Première connexion détectée
        setUserType(type);
        setCurrentUser(user);
        setIsVisible(true);
        
        // Masquer automatiquement après 5 secondes
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      } else if (!type && userType) {
        // Déconnexion détectée
        setUserType(null);
        setCurrentUser(null);
        setIsVisible(true);
        
        // Masquer automatiquement après 3 secondes
        setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      }
    };

    // Vérifier l'authentification toutes les 2 secondes
    const interval = setInterval(checkAuth, 2000);
    
    // Vérification initiale
    checkAuth();

    return () => clearInterval(interval);
  }, [userType]);

  if (!isVisible) {
    return null;
  }

  const isConnected = !!userType;

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg border z-50 max-w-sm transition-all duration-300 ${
      isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <div>
            <p className={`font-semibold text-sm ${
              isConnected ? 'text-green-800' : 'text-red-800'
            }`}>
              {isConnected ? 'Connexion réussie' : 'Déconnexion'}
            </p>
            {isConnected && currentUser && currentUser.data && (
              <p className="text-xs text-gray-600">
                {currentUser.data.nom || currentUser.data.prenom || 'Utilisateur'} ({userType})
              </p>
            )}
          </div>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 text-sm ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default AuthNotification; 