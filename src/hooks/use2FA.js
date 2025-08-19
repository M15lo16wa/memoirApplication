import { useState, useCallback, useEffect } from 'react';
// Importer les fonctions 2FA du service API
import { validate2FASession, create2FASession, send2FATOTPCode } from '../services/api/twoFactorApi';

/**
 * Hook personnalisé pour la gestion de la protection 2FA basée sur l'email.
 * Il intercepte les erreurs 403, affiche une modale de validation,
 * et ré-exécute l'action initiale après une validation réussie.
 */
export const use2FA = () => {
  // --- ÉTATS INTERNES DU HOOK ---

  // Gère la visibilité de la modale de saisie du code 2FA
  const [show2FAModal, setShow2FAModal] = useState(false);
  
  // Stocke l'action qui a été interrompue et qui doit être exécutée après validation
  const [pendingAction, setPendingAction] = useState(null);
  
  // Gère l'état de chargement pendant la validation du code
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Stocke les messages d'erreur de validation (ex: "Code invalide")
  const [validationError, setValidationError] = useState('');
  
  // Stocke l'identifiant de session temporaire 2FA
  const [tempTokenId, setTempTokenId] = useState(null);

  // --- NOUVEAUX ÉTATS POUR LA GESTION EMAIL ---
  
  // Gère l'état de l'envoi du code TOTP par email
  const [emailSent, setEmailSent] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [userDataFor2FA, setUserDataFor2FA] = useState(null);

  // --- FONCTIONS DE GESTION DU FLUX 2FA ---

  /**
   * Fonction pour démarrer le compteur avant renvoi d'email
   */
  const startCountdown = useCallback((seconds) => {
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
  }, []);

  /**
   * Fonction pour envoyer le code TOTP par email
   */
  const sendTOTPCode = useCallback(async (userData) => {
    if (!userData) {
      setEmailError('Données utilisateur manquantes');
      return false;
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
        return true;
      }
      
      return false;
      
    } catch (error) {
      setEmailError('Erreur lors de l\'envoi du code TOTP');
      console.error('❌ Erreur envoi TOTP:', error);
      return false;
    } finally {
      setEmailLoading(false);
    }
  }, [startCountdown]);

  /**
   * Fonction pour renvoyer le code TOTP
   */
  const handleResendEmail = useCallback(async () => {
    if (!canResend || !userDataFor2FA) return;
    
    try {
      await sendTOTPCode(userDataFor2FA);
    } catch (error) {
      console.error('Erreur lors du renvoi:', error);
    }
  }, [canResend, userDataFor2FA, sendTOTPCode]);

  /**
   * Construction des paramètres utilisateur pour les appels API
   */
  const buildUserParams = useCallback((userData) => {
    if (!userData) throw new Error('Données utilisateur manquantes');
    
    if (userData.numero_assure) {
      return {
        userType: 'patient',
        identifier: userData.numero_assure,
        userId: userData.id_patient || userData.id || userData.userId ? String(userData.id_patient || userData.id || userData.userId) : undefined,
      };
    }
    if (userData.numero_adeli) {
      return {
        userType: 'professionnel',
        identifier: userData.numero_adeli,
        userId: userData.id || userData.id_professionnel || userData.userId ? String(userData.id || userData.id_professionnel || userData.userId) : undefined,
      };
    }
    if (userData.email) {
      return {
        userType: 'professionnel',
        identifier: userData.email,
        userId: userData.id || userData.userId ? String(userData.id || userData.userId) : undefined,
      };
    }
    if (userData.id || userData.userId) {
      return {
        userType: userData.type === 'patient' ? 'patient' : 'professionnel',
        identifier: String(userData.id || userData.userId),
        userId: String(userData.id || userData.userId),
      };
    }
    throw new Error("Impossible de déterminer 'userType' et 'identifier' pour create2FASession");
  }, []);

  /**
   * 1. Fonction pour créer une session temporaire 2FA
   * @param {Object} userData - Les données utilisateur
   */
  const createTemporary2FASession = useCallback(async (userData) => {
    try {
      console.log('🔐 Création session temporaire 2FA pour:', userData);
      
      // Stocker les données utilisateur pour l'envoi d'email
      setUserDataFor2FA(userData);
      
      // Construire les paramètres pour l'API: { userType, identifier, userId? }
      const params = buildUserParams(userData);

      console.log('�� Paramètres create2FASession construits:', params);

      const sessionResult = await create2FASession(params);
      console.log('✅ Session temporaire 2FA créée:', sessionResult);
      
      // Harmoniser selon doc API: success + data.tempTokenId
      const tempId = sessionResult?.data?.tempTokenId || sessionResult?.tempTokenId;
      if (tempId) {
        setTempTokenId(tempId);
        console.log('�� TempTokenId stocké dans le hook:', tempId);
        
        // Envoyer automatiquement le code TOTP par email
        const emailSent = await sendTOTPCode(userData);
        if (emailSent) {
          console.log('📧 Code TOTP envoyé automatiquement après création de session');
        }
        
        return tempId;
      } else {
        throw new Error('Session temporaire 2FA invalide - tempTokenId manquant');
      }
    } catch (error) {
      console.error('❌ Erreur création session temporaire 2FA:', error);
      throw error;
    }
  }, [buildUserParams, sendTOTPCode]);

  /**
   * 2. Fonction principale de validation.
   * C'est elle qui est appelée par le composant `Validate2FA` lorsque l'utilisateur soumet le code.
   * @param {string} code - Le code à 6 chiffres entré par l'utilisateur.
   */
  const handle2FAValidation = useCallback(async (code) => {
    // On ne fait rien si une validation est déjà en cours
    if (isSubmitting) return;

    console.log(`🔐 Tentative de validation du code 2FA : ${code}`);
    setIsSubmitting(true);
    setValidationError('');

    // Vérifier que le tempTokenId est présent
    if (!tempTokenId) {
      setValidationError('Session temporaire 2FA manquante - veuillez vous reconnecter');
      setIsSubmitting(false);
      return;
    }

    try {
      // Appel à l'API pour valider la session avec le code fourni
      const result = await validate2FASession(code, tempTokenId);
      
      console.log('✅ Session 2FA validée avec succès !', result);
      setShow2FAModal(false); // On ferme la modale
      setValidationError(''); // Réinitialiser l'erreur
      setEmailError(''); // Réinitialiser l'erreur email

      // Si la validation réussit, on exécute l'action qui était en attente
      if (pendingAction) {
        console.log('🚀 Exécution de l\'action mise en attente...');
        try {
          // On utilise .func() car on a stocké l'action sous cette forme
          await pendingAction.func(...pendingAction.args);
          // Réinitialiser l'action après exécution réussie
          setPendingAction(null);
        } catch (actionError) {
          console.error('❌ Erreur lors de l\'exécution de l\'action en attente:', actionError);
          // L'action a échoué mais la 2FA était valide
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors de la validation du code 2FA:', error);
      
      // Gestion améliorée des erreurs
      let errorMessage = 'Code 2FA invalide ou expiré. Veuillez réessayer.';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // On stocke le message d'erreur pour l'afficher à l'utilisateur
      setValidationError(errorMessage);
      
      // Ne pas réinitialiser l'action en cas d'erreur pour permettre une nouvelle tentative
      console.log('🔄 Erreur de validation - action maintenue en attente pour nouvelle tentative');
    
    } finally {
      // Dans tous les cas, on réinitialise l'état de soumission
      setIsSubmitting(false);
    }
  }, [isSubmitting, pendingAction, tempTokenId]);

  /**
   * Gère l'annulation par l'utilisateur depuis la modale.
   */
  const handle2FACancel = useCallback(() => {
    console.log('❌ Annulation de la 2FA par l\'utilisateur.');
    setShow2FAModal(false);
    setPendingAction(null);
    setValidationError('');
    setEmailError('');
    setEmailSent(false);
    setEmailAddress('');
    setCountdown(0);
    setCanResend(false);
  }, []);

  /**
   * 3. Le "wrapper" qui protège une fonction.
   * C'est la fonction la plus importante à exporter.
   * @param {Function} action - La fonction asynchrone à protéger (ex: `getPatientRecord`).
   * @returns {Function} - Une nouvelle fonction qui gère la logique 2FA.
   */
  const with2FAProtection = useCallback((action) => {
    // On retourne une fonction asynchrone qui accepte les mêmes arguments que l'action originale
    return async (...args) => {
      try {
        // On tente d'exécuter l'action directement.
        // Si la session 2FA est déjà validée, cela fonctionnera.
        console.log('▶️ Tentative d\'exécution de l\'action protégée...');
        return await action(...args);

      } catch (error) {
        // On vérifie si l'erreur est bien celle que le backend nous envoie pour demander la 2FA.
        // On se base sur le statut 403 et un mot-clé dans le message pour être précis.
        if (error.response?.status === 403 && error.response?.data?.message?.includes('Veuillez valider')) {
          console.log('🔐 Backend requiert une validation 2FA. Affichage de la modale.');
          
          // On sauvegarde l'action et ses arguments pour l'exécuter plus tard
          setPendingAction({ func: action, args: args });
          
          // On affiche la modale pour que l'utilisateur puisse saisir son code
          setShow2FAModal(true);
          
          return null; // On interrompt le flux d'exécution normal

        } else {
          // Si ce n'est pas une erreur de 2FA, on ne la gère pas ici et on la relance.
          console.error('Une erreur non liée à la 2FA est survenue:', error);
          throw error;
        }
      }
    };
  }, []);

  /**
   * Fonction pour réinitialiser complètement l'état du hook
   */
  const reset2FAState = useCallback(() => {
    setShow2FAModal(false);
    setPendingAction(null);
    setValidationError('');
    setEmailError('');
    setEmailSent(false);
    setEmailAddress('');
    setCountdown(0);
    setCanResend(false);
    setEmailLoading(false);
    setUserDataFor2FA(null);
    setTempTokenId(null);
  }, []);

  // --- VALEURS RETOURNÉES PAR LE HOOK ---
  // On retourne tout ce dont les composants auront besoin pour interagir avec le hook.
  return {
    // États de base 2FA
    show2FAModal,       // Pour savoir s'il faut afficher la modale
    isSubmitting,       // Pour afficher un spinner/loader dans la modale
    validationError,    // Pour afficher les erreurs de validation
    tempTokenId,        // L'identifiant de session temporaire
    
    // Nouveaux états pour la gestion email
    emailSent,          // Si l'email a été envoyé
    emailAddress,       // L'adresse email où le code a été envoyé
    countdown,          // Le compteur avant de pouvoir renvoyer
    canResend,          // Si on peut renvoyer l'email
    emailLoading,       // État de chargement pour l'envoi d'email
    emailError,         // Erreur lors de l'envoi d'email
    
    // Fonctions principales
    with2FAProtection,  // La fonction "wrapper" pour protéger les actions
    handle2FAValidation,// La fonction à passer à la prop `onSubmit` de la modale
    handle2FACancel,    // La fonction à passer à la prop `onCancel` de la modale
    createTemporary2FASession, // Pour créer une session temporaire 2FA
    
    // Nouvelles fonctions pour la gestion email
    sendTOTPCode,       // Pour envoyer le code TOTP
    handleResendEmail,  // Pour renvoyer le code TOTP
    reset2FAState,      // Pour réinitialiser complètement l'état
  };
};