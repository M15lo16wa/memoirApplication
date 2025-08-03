import React, { useState } from 'react';
import { getUserType, getCurrentUser } from '../../services/api/authApi';

const AuthStatus = () => {
  const [isVisible, setIsVisible] = useState(true);
  const userType = getUserType();
  const currentUser = getCurrentUser();

  // Ne pas afficher si l'utilisateur n'est pas connecté
  if (!userType) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-800">Statut d'authentification</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 text-sm"
          title="Fermer"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1 text-sm">
        <p><span className="font-semibold">Type:</span> {userType || 'Non connecté'}</p>
        {currentUser && currentUser.data && (
          <>
            <p><span className="font-semibold">Nom:</span> {currentUser.data.nom || currentUser.data.prenom || 'N/A'}</p>
            <p><span className="font-semibold">ID:</span> {currentUser.data.id || 'N/A'}</p>
            {currentUser.data.specialite && (
              <p><span className="font-semibold">Spécialité:</span> {currentUser.data.specialite}</p>
            )}
          </>
        )}
      </div>
      <div className="mt-2">
        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
          userType ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {userType ? 'Connecté' : 'Non connecté'}
        </span>
      </div>
    </div>
  );
};

export default AuthStatus; 