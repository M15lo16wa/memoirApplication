import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaTimes, FaCheck, FaEnvelope, FaClock, FaRedo } from 'react-icons/fa';

// Importez les fonctions 2FA du service API
import { validate2FASession, send2FATOTPCode } from '../../services/api/twoFactorApi';

/**
 * Composant de validation 2FA pour la protection des dossiers patients
 * Version adaptée pour le système 2FA basé sur l'email
 */
const Validate2FA = ({ 
  onSuccess, 
  onCancel, 
  isRequired = true, 
  message = "Vérification 2FA requise pour accéder aux dossiers patients",
  userData = null,
  tempTokenId = null 
}) => {
  const [code2FA, setCode2FA] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Nouveaux états pour la gestion email
  const [emailSent, setEmailSent] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Fonction pour démarrer le compteur
  const startCountdown = (seconds) => {
    setCountdown(seconds);
    setCanResend(false);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Fonction pour envoyer le code TOTP par email
  const sendTOTPCode = async () => {
    if (!userData) {
      setEmailError('Données utilisateur manquantes');
      return;
    }

    try {
      setEmailLoading(true);
      setEmailError('');
      
      // Construction des paramètres selon le type d'utilisateur
      const params = buildUserParams(userData);
      
      const response = await send2FATOTPCode(params);
      
      if (response.status === 'success') {
        setEmailSent(true);
        setEmailAddress(response.data.email);
        startCountdown(30); // 30 secondes
        console.log('✅ Code TOTP envoyé avec succès à:', response.data.email);
      }
      
    } catch (error) {
      setEmailError('Erreur lors de l\'envoi du code TOTP');
      console.error('❌ Erreur envoi TOTP:', error);
    } finally {
      setEmailLoading(false);
    }
  };

  // Construction des paramètres utilisateur
  const buildUserParams = (userData) => {
    if (userData.numero_assure) {
      return { 
        userType: 'patient', 
        identifier: userData.numero_assure, 
        userId: userData.id_patient || userData.id || userData.userId ? String(userData.id_patient || userData.id || userData.userId) : undefined 
      };
    }
    if (userData.numero_adeli) {
      return { 
        userType: 'professionnel', 
        identifier: userData.numero_adeli, 
        userId: userData.id || userData.id_professionnel || userData.userId ? String(userData.id || userData.id_professionnel || userData.userId) : undefined 
      };
    }
    if (userData.email) {
      return { 
        userType: 'professionnel', 
        identifier: userData.email, 
        userId: userData.id || userData.userId ? String(userData.id || userData.userId) : undefined 
      };
    }
    if (userData.id || userData.userId) {
      return { 
        userType: userData.type === 'patient' ? 'patient' : 'professionnel', 
        identifier: String(userData.id || userData.userId), 
        userId: String(userData.id || userData.userId) 
      };
    }
    throw new Error("Impossible de déterminer 'userType' et 'identifier'");
  };

  // Fonction de renvoi d'email
  const handleResendEmail = async () => {
    if (!canResend) return;
    
    try {
      await sendTOTPCode();
    } catch (error) {
      console.error('Erreur lors du renvoi:', error);
    }
  };

  // Envoyer automatiquement le code TOTP au montage du composant
  useEffect(() => {
    if (userData && !emailSent && !emailLoading) {
      sendTOTPCode();
    }
  }, [userData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation stricte du code 2FA
    if (!code2FA.trim()) {
      setError('Veuillez saisir le code 2FA');
      return;
    }

    // Le code 2FA doit être exactement 6 chiffres
    if (code2FA.length !== 6) {
      setError('Le code 2FA doit contenir exactement 6 chiffres');
      return;
    }

    // Vérifier que le code ne contient que des chiffres
    if (!/^\d{6}$/.test(code2FA)) {
      setError('Le code 2FA doit contenir uniquement des chiffres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('�� Validate2FA - Tentative de validation avec le code:', code2FA);
      console.log('👤 Contexte utilisateur:', userData);
      
      // Vérifier que le tempTokenId est présent
      if (!tempTokenId) {
        throw new Error('Session temporaire 2FA manquante - veuillez vous reconnecter');
      }
      
      // Appel à la fonction du service API
      const validationResult = await validate2FASession(code2FA, tempTokenId);
      console.log('✅ Validate2FA - Résultat de validation:', validationResult);
      
      // Vérifier que la validation a réussi
      if (validationResult && validationResult.success) {
        console.log('🎉 Validate2FA - Validation 2FA réussie !');
        
        // Stocker le token si fourni
        if (validationResult.token) {
          localStorage.setItem('token', validationResult.token);
          console.log('🔑 Token stocké:', validationResult.token);
        }
        
        // Stocker les données utilisateur si fournies
        if (validationResult.user) {
          if (validationResult.userType === 'patient') {
            localStorage.setItem('patient', JSON.stringify(validationResult.user));
          } else if (validationResult.userType === 'medecin' || validationResult.userType === 'admin') {
            localStorage.setItem('medecin', JSON.stringify(validationResult.user));
          }
          console.log('👤 Données utilisateur stockées');
        }
        
        // Appeler le callback de succès
        onSuccess();
      } else {
        throw new Error('Réponse de validation 2FA invalide');
      }
      
    } catch (error) {
      console.error('❌ Validate2FA - Erreur lors de la validation:', error);
      
      // Gestion améliorée des erreurs
      let errorMessage = 'Code 2FA invalide. Veuillez réessayer.';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Messages d'erreur plus spécifiques
      if (errorMessage.includes('expiré')) {
        errorMessage = 'Code 2FA expiré. Veuillez vous reconnecter.';
      } else if (errorMessage.includes('invalide')) {
        errorMessage = 'Code 2FA incorrect. Vérifiez et réessayez.';
      } else if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      }
      
      setError(errorMessage);
      
      // Logs détaillés pour le débogage
      console.log('💡 Validate2FA - Conseils de débogage:', {
        codeSaisi: code2FA,
        messageErreur: errorMessage,
        suggestion: 'Vérifiez que le code correspond au token généré par le backend',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCode2FA('');
    setError('');
    setEmailError('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* En-tête */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FaShieldAlt className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Vérification 2FA
          </h2>
          <p className="text-gray-600">
            {message}
          </p>
        </div>

        {/* Informations sur l'envoi du code TOTP */}
        {emailSent && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <FaEnvelope className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Code TOTP envoyé</span>
            </div>
            <p className="text-xs text-blue-700 text-center mb-2">
              Vérifiez votre boîte de réception à l'adresse :
            </p>
            <p className="text-sm font-mono text-blue-800 bg-white p-2 rounded border text-center">
              {emailAddress}
            </p>
            
            {/* Compteur et bouton de renvoi */}
            <div className="mt-3 text-center">
              {countdown > 0 ? (
                <div className="flex items-center justify-center space-x-2">
                  <FaClock className="text-blue-600 text-sm" />
                  <p className="text-xs text-blue-600">
                    Renvoi possible dans {countdown}s
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleResendEmail}
                  disabled={emailLoading}
                  className="text-xs text-blue-600 underline hover:text-blue-800 flex items-center space-x-1 mx-auto"
                >
                  <FaRedo className="text-xs" />
                  <span>Renvoyer le code</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code2FA" className="block text-sm font-medium text-gray-700 mb-2">
              Code de vérification
            </label>
            <input
              id="code2FA"
              type="text"
              value={code2FA}
              onChange={(e) => setCode2FA(e.target.value)}
              placeholder="123456"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono tracking-widest"
              maxLength="6"
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Saisissez le code à 6 chiffres reçu par email
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Message d'erreur email */}
          {emailError && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-600 text-center">{emailError}</p>
            </div>
          )}

          {/* Informations utilisateur si disponibles */}
          {userData && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                <strong>Utilisateur:</strong> {userData.nom || userData.email || 'N/A'}
              </p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors disabled:opacity-50"
            >
              <FaTimes className="inline mr-2" />
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={loading || !code2FA.trim() || code2FA.length !== 6}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Vérification...
                </div>
              ) : (
                <>
                  <FaCheck className="inline mr-2" />
                  Valider
                </>
              )}
            </button>
          </div>
        </form>

        {/* Aide et instructions */}
        <div className="mt-6 space-y-3">
          {/* Instructions pour l'utilisateur */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-medium text-green-900 mb-2 text-center">
              📧 Comment procéder :
            </h4>
            <ol className="text-xs text-green-800 space-y-1 list-decimal list-inside">
              <li>Vérifiez votre boîte de réception</li>
              <li>Ouvrez l'email contenant le code TOTP</li>
              <li>Saisissez le code à 6 chiffres ci-dessus</li>
              <li>Cliquez sur "Valider" pour continuer</li>
            </ol>
          </div>

          {/* Informations sur le délai */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Le code TOTP expire dans 30 secondes. Si vous ne l'avez pas reçu, 
              utilisez le bouton "Renvoyer le code" ci-dessus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Validate2FA;