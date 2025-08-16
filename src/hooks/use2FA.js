import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour la gestion de la protection 2FA
 * Utilisé pour protéger l'accès aux dossiers patients
 */
export const use2FA = () => {
  const [show2FA, setShow2FA] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  /**
   * Gère la validation réussie de la 2FA
   */
  const handle2FASuccess = useCallback(() => {
    console.log('✅ 2FA validée avec succès, exécution de l\'action en attente...');
    setShow2FA(false);
    setRequires2FA(false);
    
    // Exécuter l'action qui était en attente
    if (pendingAction) {
      pendingAction.func(...pendingAction.args);
      setPendingAction(null);
    }
  }, [pendingAction]);

  /**
   * Gère l'annulation de la 2FA
   */
  const handle2FACancel = useCallback(() => {
    console.log('❌ 2FA annulée par l\'utilisateur');
    setShow2FA(false);
    setRequires2FA(false);
    setPendingAction(null);
  }, []);

  /**
   * Wrapper pour protéger les accès aux dossiers patients
   * @param {Function} action - L'action à protéger
   * @param {string} actionName - Nom de l'action pour le logging
   * @returns {Function} - Fonction protégée par 2FA
   */
  const with2FAProtection = useCallback((action, actionName = 'Action') => {
    return async (...args) => {
      try {
        // Tentative d'exécution de l'action
        return await action(...args);
      } catch (error) {
        // Vérifier si la 2FA est requise
        if (error.response?.status === 403 && error.response?.data?.requires2FA) {
          console.log(`🔐 2FA requise pour ${actionName}`);
          setRequires2FA(true);
          setPendingAction({ name: actionName, func: action, args: args });
          setShow2FA(true);
          return null; // L'action sera exécutée après validation 2FA
        } else {
          // Re-lancer l'erreur si ce n'est pas une demande de 2FA
          throw error;
        }
      }
    };
  }, []);

  /**
   * Réinitialise l'état 2FA
   */
  const reset2FA = useCallback(() => {
    setShow2FA(false);
    setRequires2FA(false);
    setPendingAction(null);
  }, []);

  return {
    // États
    show2FA,
    requires2FA,
    pendingAction,
    
    // Actions
    handle2FASuccess,
    handle2FACancel,
    with2FAProtection,
    reset2FA,
    
    // Setters
    setShow2FA,
    setRequires2FA,
    setPendingAction
  };
};