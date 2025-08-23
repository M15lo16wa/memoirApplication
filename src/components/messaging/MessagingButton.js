import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FaComments, FaTimes, FaShieldAlt } from 'react-icons/fa';
import SecureMessaging from './SecureMessaging';

const MessagingButton = ({ contextType, contextId, contextTitle, className = '', medecinInfo = null, currentUserName = null, currentUserRole = null }) => {
  const [showMessaging, setShowMessaging] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const getContextIcon = () => {
    switch (contextType) {
      case 'ordonnance':
        return '💊';
      case 'examen':
        return '🔬';
      case 'consultation':
        return '🏥';
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
      case 'consultation':
        return 'Discutez de votre consultation et obtenez des conseils de suivi de votre médecin.';
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
      case 'consultation':
        return 'Discuter de la consultation';
      default:
        return 'Discuter avec le médecin';
    }
  };

  const handleOpenMessaging = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Validation des paramètres requis
    if (!contextType || !contextId) {
      console.error('❌ MessagingButton: Paramètres manquants:', { contextType, contextId });
      alert('Configuration de la messagerie incomplète. Contactez l\'administrateur.');
      return;
    }

    console.log('🔒 MessagingButton: Ouverture de la messagerie', {
      contextType,
      contextId,
      contextTitle,
      medecinInfo: medecinInfo ? 'disponible' : 'non disponible'
    });
    
    // 🔍 DEBUG DÉTAILLÉ de medecinInfo
    if (medecinInfo) {
      console.log('🔍 [MessagingButton] Structure complète de medecinInfo:', medecinInfo);
      console.log('🔍 [MessagingButton] Propriétés disponibles:', Object.keys(medecinInfo));
      console.log('🔍 [MessagingButton] IDs disponibles:', {
        id: medecinInfo.id,
        id_professionnel: medecinInfo.id_professionnel,
        id_medecin: medecinInfo.id_medecin,
        medecin_id: medecinInfo.medecin_id
      });
      console.log('🔍 [MessagingButton] Informations de base:', {
        nom: medecinInfo.nom,
        prenom: medecinInfo.prenom,
        specialite: medecinInfo.specialite
      });
      console.log('🔍 [MessagingButton] Informations de prescription:', {
        prescriptionId: medecinInfo.prescriptionId,
        prescriptionType: medecinInfo.prescriptionType,
        contextId: contextId,
        contextType: contextType
      });
    } else {
      console.warn('⚠️ [MessagingButton] medecinInfo est null/undefined');
    }
    
    setShowMessaging(true);
    setShowInfo(false);
  };

  const handleCloseMessaging = () => {
    console.log('🔒 MessagingButton: Fermeture de la messagerie');
    setShowMessaging(false);
  };

  // Vérifier si le bouton peut être affiché
  const canShowButton = contextType && contextId;

  if (!canShowButton) {
    console.warn('⚠️ MessagingButton: Paramètres insuffisants pour afficher le bouton', {
      contextType,
      contextId
    });
    return null;
  }

  return (
    <>
      {/* Bouton de messagerie */}
      <div className={`relative ${className}`}>
        <button
          onClick={handleOpenMessaging}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title={`Ouvrir la messagerie pour ${contextType} #${contextId}`}
        >
          <FaComments className="w-4 h-4" />
          <span className="text-sm font-medium">{getButtonText()}</span>
        </button>
        
        {/* Indicateur d'info */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowInfo(!showInfo);
          }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Informations sur la messagerie"
        >
          <FaShieldAlt className="w-3 h-3" />
        </button>
        
        {/* Info tooltip */}
        {showInfo && (
          <div className="absolute bottom-full right-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
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
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    <span>Contexte: {contextType} #{contextId}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfo(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            
            {/* Flèche */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
          </div>
        )}
      </div>

      {/* Composant de messagerie rendu dans un portail pour être complètement indépendant */}
      {showMessaging && createPortal(
        <SecureMessaging
          contextType={contextType}
          contextId={contextId}
          medecinInfo={medecinInfo}
          isOpen={showMessaging}
          onClose={handleCloseMessaging}
          currentUserName={currentUserName}
          currentUserRole={currentUserRole}
        />,
        document.body
      )}
    </>
  );
};

export default MessagingButton;