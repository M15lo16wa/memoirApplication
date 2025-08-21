import React, { useState } from 'react';
import { FaComments, FaTimes, FaShieldAlt } from 'react-icons/fa';
import SecureMessaging from './SecureMessaging';

const MessagingButton = ({ contextType, contextId, contextTitle, className = '' }) => {
  const [showMessaging, setShowMessaging] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const getContextIcon = () => {
    switch (contextType) {
      case 'ordonnance':
        return '💊';
      case 'examen':
        return '🔬';
      default:
        return '💬';
    }
  };

  const getContextDescription = () => {
    switch (contextType) {
      case 'ordonnance':
        return 'Posez vos questions sur votre traitement et obtenez des explications de votre médecin.';
      case 'examen':
        return 'Demandez des explications sur vos résultats d\'analyses et obtenez des conseils personnalisés.';
      default:
        return 'Discutez directement avec votre médecin dans un environnement sécurisé.';
    }
  };

  const getButtonText = () => {
    switch (contextType) {
      case 'ordonnance':
        return 'Questions sur l\'ordonnance';
      case 'examen':
        return 'Explications des résultats';
      default:
        return 'Discuter avec le médecin';
    }
  };

  const handleOpenMessaging = () => {
    setShowMessaging(true);
    setShowInfo(false);
  };

  const handleCloseMessaging = () => {
    setShowMessaging(false);
  };

  return (
    <>
      {/* Bouton de messagerie */}
      <div className={`relative ${className}`}>
        <button
          onClick={handleOpenMessaging}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
        >
          <FaComments className="w-4 h-4" />
          <span className="text-sm font-medium">{getButtonText()}</span>
        </button>
        
        {/* Indicateur d'info */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="absolute -top-2 -right-2 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
          title="Informations sur la messagerie"
        >
          <FaShieldAlt className="w-3 h-3" />
        </button>
        
        {/* Info tooltip */}
        {showInfo && (
          <div className="absolute bottom-full right-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{getContextIcon()}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Messagerie sécurisée
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {getContextDescription()}
                </p>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <FaShieldAlt className="w-3 h-3 text-green-500" />
                    <span>Communication chiffrée et sécurisée</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaComments className="w-3 h-3 text-blue-500" />
                    <span>Réponse en temps réel de votre médecin</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span>Historique des conversations sauvegardé</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            
            {/* Flèche */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
          </div>
        )}
      </div>

      {/* Composant de messagerie */}
      <SecureMessaging
        contextType={contextType}
        contextId={contextId}
        isOpen={showMessaging}
        onClose={handleCloseMessaging}
      />
    </>
  );
};

export default MessagingButton;
