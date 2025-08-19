import React, { useState, useEffect, useCallback } from 'react';
import { setup2FA, verifyAndEnable2FA, validate2FASession, send2FATOTPCode, resend2FAEmail } from '../../services/api/twoFactorApi';
import { FaShieldAlt, FaCheckCircle, FaEnvelope, FaKey, FaClock, FaRedo } from 'react-icons/fa';

function Setup2FA({ onSetupComplete, onCancel, userData = null, isLoginFlow = false, tempTokenId = null, generatedToken = null }) {
    const [step, setStep] = useState('setup'); // 'setup', 'verify', 'success'
    const [secret, setSecret] = useState(''); // secret de configuration reçu du serveur
    const [loginSecret, setLoginSecret] = useState(''); // secret de connexion déjà activé (si présent dans userData)
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Nouveaux états pour la gestion email
    const [emailSent, setEmailSent] = useState(false);
    const [emailAddress, setEmailAddress] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [canResend, setCanResend] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [lastEmailSent, setLastEmailSent] = useState(null);

    // Fonction pour démarrer le compteur
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

    // Fonction pour envoyer le code TOTP (mode connexion)
    const sendTOTPCode = useCallback(async (params) => {
        try {
            setEmailLoading(true);
            setEmailError('');
            
            const response = await send2FATOTPCode(params);
            
            if (response.status === 'success') {
                setEmailSent(true);
                setEmailAddress(response.data.email);
                setLastEmailSent(new Date());
                startCountdown(30); // 30 secondes
                setStep('verify');
                console.log('✅ Code TOTP envoyé avec succès');
            }
            
        } catch (error) {
            setEmailError('Erreur lors de l\'envoi du code TOTP');
            console.error('❌ Erreur TOTP:', error);
        } finally {
            setEmailLoading(false);
        }
    }, [startCountdown]);

    // Fonction pour envoyer l'email de configuration (mode setup)
    const sendSetupEmail = useCallback(async (params) => {
        try {
            setEmailLoading(true);
            setEmailError('');
            
            const response = await setup2FA(params);
            
            if (response.status === 'success') {
                setEmailSent(true);
                setEmailAddress(response.data.user.email);
                setSecret(response.data.secret);
                setRecoveryCodes(response.data.recoveryCodes || []);
                setLastEmailSent(new Date());
                startCountdown(300); // 5 minutes
                setStep('setup');
                console.log('✅ Email de configuration envoyé avec succès');
            }
            
        } catch (error) {
            setEmailError('Erreur lors de l\'envoi de l\'email de configuration');
            console.error('❌ Erreur setup:', error);
        } finally {
            setEmailLoading(false);
        }
    }, [startCountdown]);

    // Fonction de renvoi d'email
    const handleResendEmail = useCallback(async () => {
        if (!canResend) return;
        
        try {
            setEmailLoading(true);
            const params = buildUserParams(userData);
            
            if (isLoginFlow) {
                await sendTOTPCode(params);
            } else {
                await resend2FAEmail(params);
            }
            
            setLastEmailSent(new Date());
            startCountdown(isLoginFlow ? 30 : 300);
            
        } catch (error) {
            setEmailError('Erreur lors du renvoi');
        } finally {
            setEmailLoading(false);
        }
    }, [canResend, isLoginFlow, userData, sendTOTPCode, startCountdown]);

    // Construction des paramètres utilisateur
    const buildUserParams = useCallback((userData) => {
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
        throw new Error("Impossible de déterminer 'userType' et 'identifier' pour setup2FA");
    }, []);

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

            const params = buildUserParams(userData);

            if (isLoginFlow && userData.two_factor_enabled) {
                // Mode CONNEXION : envoyer directement le code TOTP
                console.log('🔐 DEBUG - Mode connexion, envoi du code TOTP');
                await sendTOTPCode(params);
            } else {
                // Mode CONFIGURATION : envoyer le secret Base32
                console.log('🔐 DEBUG - Mode configuration, envoi de l\'email de setup');
                await sendSetupEmail(params);
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
            
            let verificationResult;
            
            if (isLoginFlow && tempTokenId && generatedToken) {
                // 🔐 FLUX DE CONNEXION : Utiliser validate2FASession avec tempTokenId et generatedToken
                console.log('🔐 DEBUG - Appel validate2FASession pour connexion');
                verificationResult = await validate2FASession(verificationCode, tempTokenId);
            } else {
                // 🔧 FLUX DE CONFIGURATION : Utiliser verifyAndEnable2FA (sans tempTokenId)
                console.log('🔐 DEBUG - Appel verifyAndEnable2FA pour configuration');
                verificationResult = await verifyAndEnable2FA(verificationCode);
            }
            
            if (verificationResult && (verificationResult.success || verificationResult.status === 'success')) {
                console.log('✅ DEBUG - Vérification 2FA réussie:', verificationResult);
                
                // 🔐 STOCKAGE DES TOKENS D'AUTHENTIFICATION SI FOURNIS PAR L'API
                if (isLoginFlow && verificationResult.data) {
                    try {
                        const authData = verificationResult.data;
                        console.log('🔐 DEBUG - Données d\'authentification reçues:', authData);
                        
                        // 🔑 PRIORITÉ ABSOLUE AU TOKEN JWT DE L'API validate2FASession
                        const apiJWT = verificationResult.token || verificationResult.data.token;
                        console.log('�� DEBUG - JWT de l\'API validate2FASession:', {
                            fromVerificationResult: verificationResult.token || 'NON TROUVÉ',
                            fromVerificationResultData: verificationResult.data.token || 'NON TROUVÉ',
                            apiJWT: apiJWT || 'NON TROUVÉ'
                        });
                        
                        // Stocker les tokens selon le type d'utilisateur
                        if (userData.type === 'patient' || userData.numero_assure) {
                            // Patient - PRIORITÉ AUX TOKENS ORIGINAUX DE LA PREMIÈRE AUTHENTIFICATION
                            let finalToken = null;
                            
                            if (apiJWT) {
                                // �� TOKEN JWT DE L'API EN PRIORITÉ ABSOLUE
                                finalToken = apiJWT;
                                localStorage.setItem('jwt', finalToken);
                                console.log('�� DEBUG - JWT de l\'API validate2FASession stocké:', finalToken.substring(0, 20) + '...');
                            } else if (userData.originalJWT) {
                                finalToken = userData.originalJWT;
                                localStorage.setItem('jwt', finalToken);
                                console.log('🔐 DEBUG - JWT original patient réutilisé:', finalToken.substring(0, 20) + '...');
                            } else if (authData.jwt) {
                                finalToken = authData.jwt;
                                localStorage.setItem('jwt', finalToken);
                                console.log('🔐 DEBUG - JWT patient de l\'API stocké:', finalToken.substring(0, 20) + '...');
                            } else if (authData.token) {
                                finalToken = authData.token;
                                localStorage.setItem('jwt', finalToken);
                                console.log('🔐 DEBUG - Token patient de l\'API stocké:', finalToken.substring(0, 20) + '...');
                            } else if (authData.accessToken) {
                                finalToken = authData.accessToken;
                                localStorage.setItem('jwt', finalToken);
                                console.log('🔐 DEBUG - AccessToken patient de l\'API stocké:', finalToken.substring(0, 20) + '...');
                            } else {
                                // Si aucun token disponible, utiliser le tempTokenId comme fallback
                                console.log('⚠️ DEBUG - Aucun token disponible, utilisation du tempTokenId');
                                localStorage.setItem('jwt', tempTokenId);
                            }
                            
                            // Stocker les données patient mises à jour
                            const patientData = {
                                ...userData,
                                ...authData.patient,
                                ...authData.user,
                                // S'assurer que l'ID est présent
                                id_patient: userData.id_patient || userData.id || authData.patient?.id || authData.user?.id
                            };
                            localStorage.setItem('patient', JSON.stringify(patientData));
                            console.log('🔐 DEBUG - Données patient mises à jour stockées:', patientData);
                            
                        } else if (userData.type === 'professionnel' || userData.numero_adeli || userData.email) {
                            // Professionnel - PRIORITÉ AUX TOKENS ORIGINAUX DE LA PREMIÈRE AUTHENTIFICATION
                            let finalToken = null;
                            
                            if (apiJWT) {
                                // �� TOKEN JWT DE L'API EN PRIORITÉ ABSOLUE
                                finalToken = apiJWT;
                                localStorage.setItem('token', finalToken);
                                console.log('�� DEBUG - JWT de l\'API validate2FASession stocké:', finalToken.substring(0, 20) + '...');
                            } else if (userData.originalToken) {
                                finalToken = userData.originalToken;
                                localStorage.setItem('token', finalToken);
                                console.log('🔐 DEBUG - Token original professionnel réutilisé:', finalToken.substring(0, 20) + '...');
                            } else if (userData.originalJWT) {
                                finalToken = userData.originalJWT;
                                localStorage.setItem('token', finalToken);
                                console.log('🔐 DEBUG - JWT original professionnel réutilisé:', finalToken.substring(0, 20) + '...');
                            } else if (authData.token) {
                                finalToken = authData.token;
                                localStorage.setItem('token', finalToken);
                                console.log('🔐 DEBUG - Token professionnel de l\'API stocké:', finalToken.substring(0, 20) + '...');
                            } else if (authData.accessToken) {
                                finalToken = authData.accessToken;
                                localStorage.setItem('token', finalToken);
                                console.log('🔐 DEBUG - AccessToken professionnel de l\'API stocké:', finalToken.substring(0, 20) + '...');
                            } else {
                                // Si aucun token disponible, utiliser le tempTokenId comme fallback
                                console.log('⚠️ DEBUG - Aucun token disponible, utilisation du tempTokenId');
                                localStorage.setItem('token', tempTokenId);
                            }
                            
                            // Stocker les données professionnel mises à jour
                            const profData = {
                                ...userData,
                                ...authData.professionnel,
                                ...authData.user,
                                // S'assurer que l'ID est présent
                                id: userData.id || userData.id_professionnel || authData.professionnel?.id || authData.user?.id
                            };
                            
                            if (userData.numero_adeli) {
                                localStorage.setItem('medecin', JSON.stringify(profData));
                                console.log('�� DEBUG - Données médecin mises à jour stockées:', profData);
                            }
                        }
                        
                        // Stocker le tempTokenId pour référence
                        if (tempTokenId) {
                            localStorage.setItem('tempTokenId', tempTokenId);
                            console.log('🔐 DEBUG - tempTokenId stocké pour référence:', tempTokenId);
                        }
                        
                        console.log('🔐 DEBUG - localStorage après stockage des tokens API:', {
                            jwt: localStorage.getItem('jwt'),
                            token: localStorage.getItem('token'),
                            tempTokenId: localStorage.getItem('tempTokenId'),
                            patient: localStorage.getItem('patient'),
                            medecin: localStorage.getItem('medecin')
                        });
                        
                    } catch (error) {
                        console.error('❌ DEBUG - Erreur lors du stockage des tokens API:', error);
                    }
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

            {error && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {emailError && (
                <div className="mb-4 p-3 bg-orange-50 border-l-4 border-orange-500 text-orange-700 rounded-r">
                    <p className="text-sm">{emailError}</p>
                </div>
            )}

            {step === 'setup' && (
                <div className="space-y-6">
                    {/* Nouveau design centré sur l'email */}
                    <div className="text-center">
                        <div className="inline-block p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                            <FaEnvelope className="mx-auto h-16 w-16 text-blue-600 mb-4" />
                            
                            {emailSent ? (
                                <>
                                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                                        Email envoyé avec succès !
                                    </h3>
                                    <p className="text-sm text-blue-700 mb-3">
                                        Vérifiez votre boîte de réception à l'adresse :
                                    </p>
                                    <p className="text-lg font-mono text-blue-800 bg-white p-3 rounded border">
                                        {emailAddress}
                                    </p>
                                    
                                    {/* Compteur et bouton de renvoi */}
                                    <div className="mt-4">
                                        {countdown > 0 ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <FaClock className="text-blue-600" />
                                                <p className="text-sm text-blue-600">
                                                    Renvoi possible dans {countdown}s
                                                </p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleResendEmail}
                                                disabled={emailLoading}
                                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 mx-auto"
                                            >
                                                <FaRedo className="text-sm" />
                                                <span>{emailLoading ? 'Envoi...' : 'Renvoyer l\'email'}</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="p-4">
                                    <p className="text-gray-600">Envoi de l'email de configuration...</p>
                                    {emailLoading && (
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
                        disabled={!emailSent || countdown > 0}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        J'ai configuré l'application, continuer
                    </button>
                    
                    <button onClick={onCancel} className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                        Annuler
                    </button>
                </div>
            )}

            {step === 'verify' && (
                <div className="space-y-4">
                    {/* Affichage spécial pour le mode connexion */}
                    {isLoginFlow && emailSent && (
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
                    {isLoginFlow && emailSent && (
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-blue-700 mb-2">
                                Code envoyé à : <strong>{emailAddress}</strong>
                            </p>
                            {countdown > 0 ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <FaClock className="text-blue-600" />
                                    <p className="text-xs text-blue-600">
                                        Code valide pendant encore {countdown}s
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