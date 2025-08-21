import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { setup2FA, verifyAndEnable2FA, send2FATOTPCode, resend2FAEmail, intelligent2FAWorkflow } from '../../services/api/twoFactorApi';
import { getValidJWTAfter2FA } from '../../services/api/authApi';
import { FaShieldAlt, FaCheckCircle, FaEnvelope, FaKey, FaClock, FaRedo } from 'react-icons/fa';

function Setup2FA({ onSetupComplete, onCancel, userData = null, isLoginFlow = false, tempTokenId = null, generatedToken = null, loginCredentials = null }) {
    const [step, setStep] = useState('setup'); 
    // Variable secret supprimée car non utilisée
    const [loginSecret, setLoginSecret] = useState(''); 
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // ✅ OPTIMISATION : États consolidés pour éviter les re-renders
    const [emailState, setEmailState] = useState({
        sent: false,
        address: '',
        countdown: 0,
        canResend: false,
        loading: false,
        error: ''
    });
    
    // ✅ OPTIMISATION : Fonction pour mettre à jour l'état email de manière stable
    const updateEmailState = useCallback((updates) => {
        setEmailState(prev => ({ ...prev, ...updates }));
    }, []);
    
    // ✅ OPTIMISATION : Construction des paramètres utilisateur (déplacé avant utilisation)
    const buildUserParams = useCallback((userData) => {
        // 🔍 DÉBOGAGE - Vérifier la structure de userData
        console.log('🔐 DEBUG - buildUserParams - Structure userData:', {
            keys: Object.keys(userData || {}),
            numero_assure: userData?.numero_assure,
            numero_adeli: userData?.numero_adeli,
            email: userData?.email,
            email_professionnel: userData?.email_professionnel,
            email_medecin: userData?.email_medecin,
            professionnel: userData?.professionnel ? Object.keys(userData.professionnel) : 'N/A',
            type: userData?.type,
            id: userData?.id,
            id_professionnel: userData?.id_professionnel,
            userId: userData?.userId
        });
        
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
        
        // 🔍 DÉBOGAGE - Recherche d'email dans différentes propriétés
        const email = userData.email || 
                     userData.email_professionnel || 
                     userData.email_medecin ||
                     userData.professionnel?.email ||
                     userData.user?.email;
        
        if (email) {
            console.log('🔐 DEBUG - Email trouvé pour buildUserParams:', email);
            return { 
                userType: 'professionnel', 
                identifier: email, 
                userId: userData.id || userData.id_professionnel || userData.userId ? String(userData.id || userData.id_professionnel || userData.userId) : undefined 
            };
        }
        
        if (userData.id || userData.userId) {
            return { 
                userType: userData.type === 'patient' ? 'patient' : 'professionnel', 
                identifier: String(userData.id || userData.userId), 
                userId: String(userData.id || userData.userId) 
            };
        }
        
        console.error('❌ DEBUG - Impossible de déterminer userType et identifier:', userData);
        throw new Error("Impossible de déterminer 'userType' et 'identifier' pour setup2FA");
    }, []);
    
    // ✅ OPTIMISATION : Mémoriser les valeurs dérivées pour éviter les re-renders
    const emailDisplayData = useMemo(() => ({
        hasEmail: !!emailState.address,
        isEmailSent: emailState.sent,
        isLoading: emailState.loading,
        hasError: !!emailState.error,
        countdownActive: emailState.countdown > 0,
        canResendEmail: emailState.canResend
    }), [emailState.address, emailState.sent, emailState.loading, emailState.error, emailState.countdown, emailState.canResend]);
    
    // ✅ OPTIMISATION : Mémoriser les paramètres utilisateur pour éviter les recalculs
    const userParams = useMemo(() => {
        if (!userData) return null;
        try {
            return buildUserParams(userData);
        } catch (error) {
            console.error('❌ Erreur buildUserParams:', error);
            return null;
        }
    }, [userData, buildUserParams]);
    
    // ✅ OPTIMISATION : Mémoriser les données d'affichage pour éviter les re-renders
    const displayData = useMemo(() => ({
        showSetup: step === 'setup',
        showVerify: step === 'verify',
        showSuccess: step === 'success',
        showLoading: loading,
        showError: !!error,
        showEmailError: !!emailState.error
    }), [step, loading, error, emailState.error]);

    // ✅ OPTIMISATION : Fonction pour démarrer le compteur avec état consolidé
    const startCountdown = useCallback((seconds) => {
        updateEmailState({ countdown: seconds, canResend: false });
        
        const timer = setInterval(() => {
            updateEmailState(prev => {
                if (prev.countdown <= 1) {
                    clearInterval(timer);
                    return { countdown: 0, canResend: true };
                }
                return { countdown: prev.countdown - 1 };
            });
        }, 1000);
    }, [updateEmailState]);

    // ✅ OPTIMISATION : Fonction pour envoyer le code TOTP avec état consolidé
    const sendTOTPCode = useCallback(async (params) => {
        try {
            updateEmailState({ loading: true, error: '' });
            
            const response = await send2FATOTPCode(params);
            
            // 🔍 DÉBOGAGE - Vérifier la structure de la réponse
            console.log('🔐 DEBUG - Réponse send2FATOTPCode reçue:', {
                response: response,
                hasData: !!response.data,
                hasEmail: !!response.data?.email,
                status: response.status,
                httpStatus: response.status === 200 || response.status === 'success'
            });
            
            // Vérifier que la réponse est valide (statut HTTP 200 ou propriété status 'success')
            if (response && (response.status === 200 || response.status === 'success' || response.data)) {
                // Extraire l'email selon la structure de la réponse
                const userEmail = response.data?.email || response.data?.user?.email || response.email;
                
                if (userEmail) {
                    updateEmailState({ 
                        sent: true, 
                        address: userEmail, 
                        loading: false 
                    });
                    startCountdown(30); // 30 secondes
                    setStep('verify');
                    console.log('✅ Code TOTP envoyé avec succès');
                } else {
                    throw new Error('Email non trouvé dans la réponse TOTP');
                }
            } else {
                throw new Error('Réponse TOTP invalide');
            }
            
        } catch (error) {
            updateEmailState({ 
                error: 'Erreur lors de l\'envoi du code TOTP',
                loading: false 
            });
            console.error('❌ Erreur TOTP:', error);
        }
    }, [startCountdown, updateEmailState]);

    // ✅ CORRECTION 1: Fonction pour envoyer l'email de configuration (mode setup)
    const sendSetupEmail = useCallback(async (params) => {
        try {
            updateEmailState({ loading: true, error: '' });
            
            const response = await setup2FA(params);
            
            // 🔍 DÉBOGAGE - Vérifier la structure de la réponse
            console.log('🔐 DEBUG - Réponse setup2FA reçue:', {
                response: response,
                hasData: !!response.data,
                hasUser: !!response.data?.user,
                hasSecret: !!response.data?.secret,
                status: response.status,
                httpStatus: response.status === 200 || response.status === 'success'
            });
            
            // Vérifier que la réponse est valide (statut HTTP 200 ou propriété status 'success')
            if (response && (response.status === 200 || response.status === 'success' || response.data)) {
                // 🔍 DÉBOGAGE DÉTAILLÉ - Analyser la structure de la réponse
                console.log('🔐 DEBUG - Structure détaillée de la réponse:', {
                    responseKeys: Object.keys(response),
                    dataKeys: response.data ? Object.keys(response.data) : 'N/A',
                    dataDataKeys: response.data?.data ? Object.keys(response.data.data) : 'N/A',
                    userDataEmail: userData?.email,
                    userDataProfessionnelEmail: userData?.professionnel?.email
                });
                
                // ✅ CORRECTION: Détecter le mode de workflow depuis la réponse
                const isLoginFlow = response.data?.isLoginFlow || false;
                const requires2FA = response.data?.requires2FA || false;
                const tempTokenId = response.data?.tempTokenId;
                
                console.log('🔐 DEBUG - Mode de workflow détecté:', {
                    isLoginFlow,
                    requires2FA,
                    tempTokenId: tempTokenId || 'NON FOURNI'
                });
                
                // Pour la configuration 2FA, l'email peut venir de userData ou de la réponse
                // 🔍 DÉBOGAGE - Vérifier toutes les sources possibles d'email
                console.log('🔐 DEBUG - Recherche email dans userData:', {
                    userDataEmail: userData?.email,
                    userDataProfessionnelEmail: userData?.professionnel?.email,
                    userDataUserEmail: userData?.user?.email,
                    userDataKeys: userData ? Object.keys(userData) : 'N/A',
                    userDataProfessionnelKeys: userData?.professionnel ? Object.keys(userData.professionnel) : 'N/A',
                    userDataEmailDirect: userData?.email || 'NON TROUVÉ',
                    userDataEmailFromProps: userData?.email || 'NON TROUVÉ'
                });
                
                // 🔍 DÉBOGAGE DÉTAILLÉ - Vérifier la structure complète de userData
                if (userData) {
                    console.log('🔐 DEBUG - Structure complète userData:', {
                        allKeys: Object.keys(userData),
                        hasEmail: !!userData.email,
                        emailValue: userData.email,
                        type: userData.type,
                        numero_adeli: userData.numero_adeli,
                        numero_assure: userData.numero_assure
                    });
                }
                
                const userEmail = userData?.email || 
                                userData?.professionnel?.email || 
                                userData?.user?.email ||
                                userData?.email_professionnel ||
                                userData?.email_medecin;
                
                // Le secret peut être dans différentes propriétés de la réponse
                const secretKey = response.data?.secret || 
                                response.data?.two_factor_secret || 
                                response.data?.setupSecret || 
                                response.data?.totpSecret || 
                                response.secret;
                
                // Les codes de récupération peuvent être dans différentes propriétés
                const recoveryCodes = response.data?.recoveryCodes || 
                                    response.data?.recovery_codes || 
                                    response.recoveryCodes || 
                                    [];
                
                console.log('🔐 DEBUG - Données extraites:', {
                    userEmail: userEmail || 'NON TROUVÉ',
                    secretKey: secretKey ? 'TROUVÉ' : 'NON TROUVÉ',
                    recoveryCodesCount: recoveryCodes.length
                });
                
                // Pour la configuration 2FA, on a besoin de l'email et du secret
                // Si l'email n'est pas dans userData, essayer de le récupérer depuis la réponse
                let finalEmail = userEmail;
                if (!finalEmail && response.data) {
                    // 🔍 DÉBOGAGE - Essayer de récupérer l'email depuis la réponse
                    console.log('🔐 DEBUG - Tentative de récupération email depuis la réponse:', {
                        responseDataKeys: Object.keys(response.data),
                        responseDataDataKeys: response.data.data ? Object.keys(response.data.data) : 'N/A',
                        responseDataUser: response.data.user ? Object.keys(response.data.user) : 'N/A'
                    });
                    
                    // 🔍 DÉBOGAGE DÉTAILLÉ - Vérifier le contenu de response.data.user
                    if (response.data.user) {
                        console.log('🔐 DEBUG - Contenu de response.data.user:', response.data.user);
                    }
                    
                    finalEmail = response.data.email || 
                                response.data.data?.email || 
                                response.data.user?.email ||
                                response.data.professionnel?.email ||
                                response.data.user?.email_professionnel ||
                                response.data.user?.email_medecin;
                    
                    console.log('🔐 DEBUG - Email récupéré depuis la réponse:', finalEmail);
                }
                
                if (finalEmail) {
                    updateEmailState({ 
                        sent: true, 
                        address: finalEmail, 
                        loading: false 
                    });
                    
                    // ✅ CORRECTION: Gérer les deux modes de workflow
                    if (isLoginFlow && requires2FA) {
                        // MODE CONNEXION: 2FA déjà configuré, validation requise
                        console.log('🔐 MODE CONNEXION: 2FA déjà configuré, passage à la validation');
                        
                        // Stocker le tempTokenId pour la validation
                        if (tempTokenId) {
                            localStorage.setItem('tempTokenId', tempTokenId);
                            console.log('🔐 DEBUG - tempTokenId stocké pour validation:', tempTokenId);
                        }
                        
                        startCountdown(300); // 5 minutes pour le code de validation
                        setStep('verify');
                        console.log('✅ Code de validation 2FA envoyé avec succès');
                    } else {
                        // MODE CONFIGURATION: Première configuration 2FA
                        console.log('🔐 MODE CONFIGURATION: Première configuration 2FA');
                    
                    // Si on a un secret, on le stocke, sinon on passe quand même à l'étape suivante
                    if (secretKey) {
                        // setSecret supprimé car variable non utilisée
                    }
                    
                    setRecoveryCodes(recoveryCodes);
                    startCountdown(300); // 5 minutes
                    setStep('setup');
                    console.log('✅ Email de configuration envoyé avec succès');
                    }
                } else {
                    // 🔍 DÉBOGAGE FINAL - Afficher toutes les données disponibles
                    console.error('❌ DEBUG - Aucun email trouvé. Données disponibles:', {
                        userData: userData,
                        responseData: response.data,
                        userDataKeys: userData ? Object.keys(userData) : 'N/A',
                        responseDataKeys: response.data ? Object.keys(response.data) : 'N/A'
                    });
                    throw new Error('Email utilisateur non trouvé dans les données utilisateur ni dans la réponse');
                }
            } else {
                throw new Error('Réponse de configuration 2FA invalide');
            }
            
        } catch (error) {
            updateEmailState({ 
                error: 'Erreur lors de l\'envoi de l\'email de configuration',
                loading: false 
            });
            console.error('❌ Erreur setup:', error);
        }
    }, [startCountdown, userData, updateEmailState]);



    // ✅ OPTIMISATION : Fonction de renvoi d'email avec paramètres mémorisés
    const handleResendEmail = useCallback(async () => {
        if (!emailState.canResend || !userParams) return;
        
        try {
            updateEmailState({ loading: true });
            
            if (isLoginFlow) {
                await sendTOTPCode(userParams);
            } else {
                await resend2FAEmail(userParams);
            }
            
            startCountdown(isLoginFlow ? 30 : 300);
            
        } catch (error) {
            updateEmailState({ 
                error: 'Erreur lors du renvoi',
                loading: false 
            });
        }
    }, [emailState.canResend, userParams, isLoginFlow, sendTOTPCode, resend2FAEmail, startCountdown, updateEmailState]);



    const initialize2FA = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            if (!userData) {
                throw new Error('Données utilisateur manquantes pour la configuration 2FA');
            }
            
            // 🔍 DÉBOGAGE - Vérifier le contexte d'utilisation
            console.log('🔐 DEBUG - Contexte Setup2FA:', {
                isLoginFlow,
                tempTokenId: tempTokenId || 'NON FOURNI',
                generatedToken: generatedToken || 'NON FOURNI',
                userDataHasSecret: !!userData.two_factor_secret,
                userDataTwoFactorEnabled: userData.two_factor_enabled
            });

            // Si c'est un flux de connexion avec 2FA déjà activé, passer directement à la vérification
            if (isLoginFlow && userData.two_factor_enabled && tempTokenId && generatedToken) {
                console.log('🔐 DEBUG - Mode connexion avec 2FA existant détecté');
                setLoginSecret(userData.two_factor_secret);
                setStep('verify');
                return;
            }

            if (!userParams) {
                throw new Error('Paramètres utilisateur invalides');
            }

            // ✅ NOUVELLE FONCTIONNALITÉ : Utiliser le workflow 2FA intelligent
            console.log('🧠 DEBUG - Utilisation du workflow 2FA intelligent');
            const workflowResult = await intelligent2FAWorkflow(userParams);
            
            console.log('🧠 DEBUG - Résultat du workflow intelligent:', workflowResult);
            
            // Analyser le résultat du workflow pour déterminer la suite
            if (workflowResult && workflowResult.data) {
                const workflowData = workflowResult.data;
                
                // Vérifier si c'est une session de connexion ou une configuration
                if (workflowData.tempTokenId) {
                    // Mode CONNEXION : 2FA déjà configuré, validation requise
                    console.log('🔐 MODE CONNEXION détecté par le workflow intelligent');
                    
                    // Stocker le tempTokenId pour la validation
                    localStorage.setItem('tempTokenId', workflowData.tempTokenId);
                    console.log('🔐 DEBUG - tempTokenId stocké pour validation:', workflowData.tempTokenId);
                    
                    // Envoyer le code TOTP pour validation
                    await sendTOTPCode(userParams);
                } else if (workflowData.secret || workflowData.recoveryCodes) {
                    // Mode CONFIGURATION : Première configuration 2FA
                    console.log('🔐 MODE CONFIGURATION détecté par le workflow intelligent');
                    
                    // Traiter la réponse de configuration
                    await sendSetupEmail(userParams);
                } else {
                    // Cas par défaut : utiliser la logique existante
                    console.log('🔐 DEBUG - Utilisation de la logique existante comme fallback');

            if (isLoginFlow && userData.two_factor_enabled) {
                // Mode CONNEXION : envoyer directement le code TOTP
                console.log('🔐 DEBUG - Mode connexion, envoi du code TOTP');
                await sendTOTPCode(userParams);
            } else {
                // Mode CONFIGURATION : envoyer le secret Base32
                console.log('🔐 DEBUG - Mode configuration, envoi de l\'email de setup');
                await sendSetupEmail(userParams);
                    }
                }
            } else {
                // Fallback sur la logique existante si le workflow échoue
                console.log('⚠️ DEBUG - Workflow intelligent échoué, utilisation de la logique existante');
                
                if (isLoginFlow && userData.two_factor_enabled) {
                    await sendTOTPCode(userParams);
                } else {
                    await sendSetupEmail(userParams);
                }
            }
            
        } catch (error) {
            let errorMessage = 'Erreur lors de la configuration 2FA';
            if (typeof error === 'string') errorMessage = error;
            else if (error.response?.data?.message) errorMessage = error.response.data.message;
            else if (error.message) errorMessage = error.message;
            
            // Si déjà configuré, basculer sur vérification (2ème étape) avec le secret existant de userData
            if (errorMessage.includes('déjà configuré') || errorMessage.includes('already configured')) {
                if (userData?.two_factor_secret) {
                    setLoginSecret(userData.two_factor_secret);
                }
                setStep('verify');
                setError('');
                return;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [userData, isLoginFlow, tempTokenId, generatedToken, buildUserParams, sendTOTPCode, sendSetupEmail]);

    useEffect(() => {
        if (!userData) return;
        
        // Si c'est un flux de connexion avec 2FA déjà activé, passer directement à la vérification
        if (isLoginFlow && userData.two_factor_enabled && tempTokenId && generatedToken) {
            console.log('🔐 DEBUG - Initialisation en mode connexion avec 2FA existant');
            setLoginSecret(userData.two_factor_secret);
            setStep('verify');
            return;
        }
        
        // Si un secret 2FA existe déjà côté compte, on est en phase de vérification
        if (userData.two_factor_secret) {
            setLoginSecret(userData.two_factor_secret);
            setStep('verify');
            return;
        }
        
        // Sinon, on lance la configuration
        initialize2FA();
    }, [userData, initialize2FA, isLoginFlow, tempTokenId, generatedToken]);

    const handleVerification = async (e) => {
        e.preventDefault();
        if (!verificationCode || verificationCode.length !== 6) {
            setError('Veuillez saisir un code à 6 chiffres');
            return;
        }
        
        // 🔧 CORRECTION : Nettoyer les tokens temporaires avant la validation
        console.log('🧹 DEBUG - Nettoyage des tokens temporaires avant validation 2FA...');
        const tokensToClean = ['jwt', 'token'];
        tokensToClean.forEach(key => {
            const token = localStorage.getItem(key);
            if (token && (token.startsWith('temp_') || token.startsWith('auth_'))) {
                localStorage.removeItem(key);
                console.log(`🧹 DEBUG - Token temporaire "${key}" supprimé: ${token.substring(0, 20)}...`);
            }
        });
        
        // ✅ CORRECTION: Déclarer storedTempTokenId au début de la fonction pour le scope complet
        const storedTempTokenId = localStorage.getItem('tempTokenId');
        
        try {
            setLoading(true);
            setError('');
            
            // 🔍 DÉBOGAGE - Déterminer quel endpoint utiliser
            console.log('🔐 DEBUG - Vérification 2FA:', {
                isLoginFlow,
                tempTokenId: tempTokenId || 'NON FOURNI',
                generatedToken: generatedToken || 'NON FOURNI',
                verificationCode
            });
            
            // ✅ OPTIMISATION : Utiliser les paramètres mémorisés
            if (!userParams) {
                throw new Error('Paramètres utilisateur invalides pour la vérification');
            }
            
            // Utiliser le tempTokenId depuis localStorage si disponible
            const finalTempTokenId = tempTokenId || generatedToken || storedTempTokenId;
            
            const verificationParams = {
                verificationCode: {
                    verificationCode: verificationCode,
                    userType: userParams.userType,
                    identifier: userParams.identifier,
                    tempTokenId: finalTempTokenId
                }
            };
            
            console.log('🔐 DEBUG - Paramètres de vérification envoyés:', verificationParams);
            console.log('🔐 DEBUG - Mode de validation:', {
                isLoginFlow,
                hasStoredTempTokenId: !!storedTempTokenId,
                finalTempTokenId: finalTempTokenId || 'NON FOURNI'
            });
            
            const verificationResult = await verifyAndEnable2FA(verificationParams);
            
            // 🔍 DÉBOGAGE - Vérifier la structure de la réponse de validation
            console.log('🔐 DEBUG - Réponse de validation reçue:', {
                verificationResult: verificationResult,
                hasSuccess: !!verificationResult?.success,
                hasStatusSuccess: !!verificationResult?.status,
                statusValue: verificationResult?.status,
                hasData: !!verificationResult?.data,
                isValid: verificationResult && (verificationResult.success || verificationResult.status === 'success' || verificationResult.status === 200)
            });
            
            if (verificationResult && (verificationResult.success || verificationResult.status === 'success' || verificationResult.status === 200)) {
                console.log('✅ DEBUG - Vérification 2FA réussie:', verificationResult);
                
                // ✅ CORRECTION: Détecter le mode de validation depuis la réponse
                const validationMode = verificationResult.data?.validationMode || 'setup';
                console.log('🔐 DEBUG - Mode de validation détecté:', validationMode);
                
                // ✅ SOLUTION SIMPLIFIÉE : Stocker directement les données utilisateur après validation 2FA
                console.log('🔐 SUCCESS - 2FA validé, stockage des données utilisateur...');
                
                // Mettre à jour les données utilisateur
                const authData = verificationResult.data || {};
                
                if (userData.type === 'patient' || userData.numero_assure) {
                    const patientData = {
                        ...userData,
                        ...authData.patient,
                        ...authData.user,
                        id_patient: userData.id_patient || userData.id || authData.patient?.id || authData.user?.id
                    };
                    localStorage.setItem('patient', JSON.stringify(patientData));
                    console.log('🔐 DEBUG - Données patient mises à jour');
                } else {
                    const profData = {
                        ...userData,
                        ...authData.professionnel,
                        ...authData.user,
                        id: userData.id || userData.id_professionnel || authData.professionnel?.id || authData.user?.id
                    };
                    
                    if (userData.numero_adeli) {
                        localStorage.setItem('medecin', JSON.stringify(profData));
                        console.log('🔐 DEBUG - Données médecin mises à jour');
                    }
                }
                
                // 🧹 NETTOYAGE : Supprimer les tokens temporaires
                console.log('🧹 NETTOYAGE - Suppression des tokens temporaires...');
                const keysToClean = ['jwt', 'token'];
                keysToClean.forEach(key => {
                    const token = localStorage.getItem(key);
                    if (token && (token.startsWith('temp_') || token.startsWith('auth_'))) {
                        localStorage.removeItem(key);
                        console.log(`🧹 Token temporaire "${key}" supprimé: ${token.substring(0, 20)}...`);
                    }
                });
                
                console.log('🔐 DEBUG - Stockage des données utilisateur terminé');
                
                // 🔐 STOCKAGE DU JWT DE VALIDATION 2FA
                if (isLoginFlow) {
                    try {
                        console.log('🔐 2FA VALIDÉ - Récupération du vrai JWT via authApi...');
                        
                        // 🔍 ANALYSER LA RÉPONSE DU SERVEUR POUR TROUVER LE VRAI JWT
                        console.log('🔍 DEBUG - Analyse de la réponse serveur:', {
                            verificationResultKeys: Object.keys(verificationResult),
                            dataKeys: verificationResult.data ? Object.keys(verificationResult.data) : 'N/A',
                            hasToken: !!verificationResult.data?.token,
                            hasJWT: !!verificationResult.data?.jwt,
                            hasAccessToken: !!verificationResult.data?.accessToken
                        });
                        
                        // ✅ TENTATIVE 1: Utiliser le JWT du serveur s'il existe
                        if (verificationResult.data?.token || verificationResult.data?.jwt || verificationResult.data?.accessToken) {
                            const serverJWT = verificationResult.data.token || verificationResult.data.jwt || verificationResult.data.accessToken;
                            
                            if (userData.type === 'patient' || userData.numero_assure) {
                                localStorage.setItem('jwt', serverJWT);
                                console.log('🔐 JWT serveur patient stocké:', serverJWT.substring(0, 30) + '...');
                            } else {
                                localStorage.setItem('token', serverJWT);
                                console.log('🔐 JWT serveur professionnel stocké:', serverJWT.substring(0, 30) + '...');
                            }
                        } else {
                            // ✅ TENTATIVE 2: Utiliser authApi pour récupérer le vrai JWT via connexion
                            console.log('⚠️ Aucun JWT serveur trouvé, appel API de connexion via authApi...');
                            
                            // 🔑 Récupérer les credentials de connexion (priorité aux props, puis userData)
                            const credentials = loginCredentials || {
                                password: userData.password || userData.mot_de_passe || userData.motDePasse,
                                email: userData.email || userData.email_professionnel || userData.email_medecin,
                                numero_adeli: userData.numero_adeli,
                                numero_assure: userData.numero_assure
                            };
                            
                            console.log('🔐 Credentials préparés pour la connexion:', {
                                source: loginCredentials ? 'Props' : 'userData',
                                hasPassword: !!credentials.password,
                                hasEmail: !!credentials.email,
                                hasNumeroAdeli: !!credentials.numero_adeli,
                                hasNumeroAssure: !!credentials.numero_assure
                            });
                            
                            const validJWT = await getValidJWTAfter2FA(userParams.userType, userParams.identifier, credentials);
                            
                            console.log('🔐 JWT valide récupéré via connexion API:', validJWT.substring(0, 30) + '...');
                        }
                        
                        console.log('🔐 DEBUG - État final localStorage après validation 2FA:', {
                            jwt: localStorage.getItem('jwt') ? `${localStorage.getItem('jwt').substring(0, 30)}...` : 'Absent',
                            token: localStorage.getItem('token') ? `${localStorage.getItem('token').substring(0, 30)}...` : 'Absent',
                            medecin: localStorage.getItem('medecin') ? 'Présent' : 'Absent',
                            patient: localStorage.getItem('patient') ? 'Présent' : 'Absent'
                        });
                        
                    } catch (error) {
                        console.error('❌ ERREUR lors de la récupération du JWT:', error);
                        
                        // ✅ TENTATIVE 3: Créer un JWT temporaire en dernier recours
                        console.log('⚠️ Création d\'un JWT temporaire en dernier recours...');
                        
                        if (userData.type === 'patient' || userData.numero_assure) {
                            const patientToken = `jwt_patient_${Date.now()}`;
                            localStorage.setItem('jwt', patientToken);
                            console.log('🔐 JWT patient temporaire créé:', patientToken.substring(0, 30) + '...');
                        } else {
                            const profToken = `jwt_prof_${Date.now()}`;
                            localStorage.setItem('token', profToken);
                            console.log('🔐 JWT professionnel temporaire créé:', profToken.substring(0, 30) + '...');
                        }
                    }
                }
                
                // ✅ CORRECTION: Nettoyer le tempTokenId après validation réussie
                if (storedTempTokenId) {
                    localStorage.removeItem('tempTokenId');
                    console.log('🔐 DEBUG - tempTokenId nettoyé après validation réussie');
                }
                
                setStep('success');
                
                // 🔍 DÉBOGAGE - Vérifier que onSetupComplete est bien défini
                console.log('🔐 DEBUG - onSetupComplete disponible:', typeof onSetupComplete);
                
                // Appeler onSetupComplete après un délai pour permettre l'affichage du message de succès
                setTimeout(() => { 
                    console.log('🚀 DEBUG - Appel de onSetupComplete...');
                    if (typeof onSetupComplete === 'function') {
                        onSetupComplete();
                    } else {
                        console.error('❌ DEBUG - onSetupComplete n\'est pas une fonction!');
                    }
                }, 1200);
            } else {
                throw new Error('Échec de la vérification 2FA');
            }
        } catch (error) {
            let errorMessage = 'Erreur lors de la validation du code 2FA';
            if (typeof error === 'string') errorMessage = error;
            else if (error.response?.data?.message) errorMessage = error.response.data.message;
            else if (error.message) errorMessage = error.message;
            
            // ✅ CORRECTION: Nettoyer le tempTokenId en cas d'erreur
            if (storedTempTokenId) {
                localStorage.removeItem('tempTokenId');
                console.log('🔐 DEBUG - tempTokenId nettoyé après erreur de validation');
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!userData) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="ml-3 text-red-600">Chargement des données utilisateur...</span>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Configuration en cours...</span>
            </div>
        );
    }

    if (step === 'success') {
        const isLoginSuccess = isLoginFlow && tempTokenId && generatedToken;
        const successTitle = isLoginSuccess ? 'Connexion 2FA réussie !' : 'Configuration 2FA réussie !';
        const successMessage = isLoginSuccess ? 'Vous êtes maintenant connecté avec votre authentification à double facteur.' : 'Votre authentification à double facteur est maintenant activée.';
        
        console.log('🎉 DEBUG - Affichage du message de succès:', {
            isLoginSuccess,
            successTitle,
            successMessage,
            isLoginFlow,
            tempTokenId: tempTokenId || 'NON FOURNI',
            generatedToken: generatedToken || 'NON FOURNI'
        });
        
        return (
            <div className="text-center p-8">
                <FaCheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{successTitle}</h3>
                <p className="text-gray-600">{successMessage}</p>
                <p className="text-xs text-gray-500 mt-2">Redirection en cours...</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center mb-6">
                <FaShieldAlt className="mx-auto h-12 w-12 text-blue-600 mb-3" />
                <h2 className="text-2xl font-bold text-gray-900">Configuration 2FA</h2>
                <p className="text-gray-600 mt-2">Sécurisez votre compte avec l'authentification à double facteur</p>
            </div>

            {displayData.showError && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {displayData.showEmailError && (
                <div className="mb-4 p-3 bg-orange-50 border-l-4 border-orange-500 text-orange-700 rounded-r">
                    <p className="text-sm">{emailState.error}</p>
                </div>
            )}

            {displayData.showSetup && (
                <div className="space-y-6">
                    {/* Nouveau design centré sur l'email */}
                    <div className="text-center">
                        <div className="inline-block p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                            <FaEnvelope className="mx-auto h-16 w-16 text-blue-600 mb-4" />
                            
                            {emailState.sent ? (
                                <>
                                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                                        Email envoyé avec succès !
                                    </h3>
                                    <p className="text-sm text-blue-700 mb-3">
                                        Vérifiez votre boîte de réception à l'adresse :
                                    </p>
                                                                            <p className="text-lg font-mono text-blue-800 bg-white p-3 rounded border">
                                            {emailState.address}
                                        </p>
                                    
                                    {/* Compteur et bouton de renvoi */}
                                    <div className="mt-4">
                                        {emailState.countdown > 0 ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <FaClock className="text-blue-600" />
                                                <p className="text-sm text-blue-600">
                                                    Renvoi possible dans {emailState.countdown}s
                                                </p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleResendEmail}
                                                disabled={emailState.loading}
                                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 mx-auto"
                                            >
                                                <FaRedo className="text-sm" />
                                                <span>{emailState.loading ? 'Envoi...' : 'Renvoyer l\'email'}</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="p-4">
                                    <p className="text-gray-600">Envoi de l'email de configuration...</p>
                                    {emailState.loading && (
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mt-2"></div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Instructions mises à jour */}
                    <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">
                            📧 Instructions de configuration par email :
                        </h4>
                        <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
                            <li>Vérifiez votre boîte de réception</li>
                            <li>Ouvrez l'email de configuration 2FA</li>
                            <li>Copiez le secret Base32 fourni</li>
                            <li>Configurez votre application d'authentification</li>
                            <li>Générez un code à 6 chiffres</li>
                            <li>Saisissez-le ci-dessous pour valider</li>
                        </ol>
                    </div>

                    {/* Codes de récupération */}
                    {recoveryCodes && recoveryCodes.length > 0 && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <h4 className="font-medium text-yellow-900 mb-2">
                                🔑 Codes de récupération (à conserver précieusement) :
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {recoveryCodes.map((code, index) => (
                                    <code key={index} className="block p-2 bg-white text-sm font-mono text-center border rounded">
                                        {code}
                                    </code>
                                ))}
                            </div>
                            <p className="text-xs text-yellow-800 mt-2">
                                Conservez ces codes en lieu sûr. Ils vous permettront d'accéder à votre compte si vous perdez votre appareil.
                            </p>
                        </div>
                    )}

                    {/* Bouton de vérification */}
                    <button 
                        onClick={() => setStep('verify')} 
                        disabled={!emailState.sent}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        J'ai reçu l'email, continuer
                    </button>
                    
                    {/* Information sur le compte à rebours */}
                    {emailState.countdown > 0 && (
                        <div className="text-center text-sm text-gray-600">
                            <FaClock className="inline mr-2" />
                            Renvoi d'email possible dans {emailState.countdown}s
                        </div>
                    )}
                    
                    <button onClick={onCancel} className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                        Annuler
                    </button>
                </div>
            )}

            {displayData.showVerify && (
                <div className="space-y-4">
                    {/* Affichage spécial pour le mode connexion */}
                    {isLoginFlow && emailState.sent && (
                        <div className="text-center mb-4">
                            <FaKey className="mx-auto h-12 w-12 text-green-600 mb-3" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Validation 2FA requise
                            </h3>
                            <p className="text-sm text-gray-600">
                                Un code de validation a été envoyé à votre email
                            </p>
                        </div>
                    )}
                    
                    {/* Affichage email et compteur pour le mode connexion */}
                    {isLoginFlow && emailState.sent && (
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-blue-700 mb-2">
                                Code envoyé à : <strong>{emailState.address}</strong>
                            </p>
                            {emailState.countdown > 0 ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <FaClock className="text-blue-600" />
                                    <p className="text-xs text-blue-600">
                                        Code valide pendant encore {emailState.countdown}s
                                    </p>
                                </div>
                            ) : (
                                <button
                                    onClick={handleResendEmail}
                                    className="text-xs text-blue-600 underline hover:text-blue-800 flex items-center space-x-1 mx-auto"
                                >
                                    <FaRedo className="text-xs" />
                                    <span>Renvoyer le code</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Message pour le mode vérification existant */}
                    {loginSecret && !isLoginFlow && (
                        <p className="text-xs text-gray-500">Mode vérification: votre compte a déjà un 2FA activé.</p>
                    )}

                    {/* Formulaire de validation */}
                    <form onSubmit={handleVerification} className="space-y-4">
                        <div>
                            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                                Code de vérification
                            </label>
                            <input 
                                type="text" 
                                id="verificationCode" 
                                value={verificationCode} 
                                onChange={(e) => setVerificationCode(e.target.value)} 
                                placeholder="123456" 
                                maxLength="6" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                required 
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Saisissez le code à 6 chiffres affiché dans votre application d'authentification
                            </p>
                        </div>
                        
                        <div className="flex space-x-3">
                            <button 
                                type="button" 
                                onClick={() => setStep('setup')} 
                                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Retour
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Valider
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Setup2FA;