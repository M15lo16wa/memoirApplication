import React, { useState } from 'react';
import { FaShieldAlt, FaTimes, FaCheck } from 'react-icons/fa';

// Importez la fonction de validation 2FA du service API
import { validate2FASession } from '../../services/api/twoFactorApi';

/**
 * Composant de validation 2FA pour la protection des dossiers patients
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
      console.log('🔐 Validate2FA - Tentative de validation avec le code:', code2FA);
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
              Saisissez le code à 6 chiffres reçu
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
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

        {/* Aide */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Vous n'avez pas reçu de code ?{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 underline"
              onClick={() => setError('Fonctionnalité de renvoi à implémenter')}
            >
              Renvoyer le code
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Validate2FA;