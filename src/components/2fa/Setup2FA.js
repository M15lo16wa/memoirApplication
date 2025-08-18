import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { setup2FA, verifyAndEnable2FA, validate2FASession } from '../../services/api/twoFactorApi';
import { FaShieldAlt, FaCheckCircle } from 'react-icons/fa';

function Setup2FA({ onSetupComplete, onCancel, userData = null, isLoginFlow = false, tempTokenId = null, generatedToken = null }) {
    const [step, setStep] = useState('setup'); // 'setup', 'verify', 'success'
    const [qrCodeData, setQrCodeData] = useState(null);
    const [secret, setSecret] = useState(''); // secret de configuration reçu du serveur
    const [loginSecret, setLoginSecret] = useState(''); // secret de connexion déjà activé (si présent dans userData)
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

            const params = (() => {
                if (userData.numero_assure) {
                    return { userType: 'patient', identifier: userData.numero_assure, userId: userData.id_patient || userData.id || userData.userId ? String(userData.id_patient || userData.id || userData.userId) : undefined };
                }
                if (userData.numero_adeli) {
                    return { userType: 'professionnel', identifier: userData.numero_adeli, userId: userData.id || userData.id_professionnel || userData.userId ? String(userData.id || userData.id_professionnel || userData.userId) : undefined };
                }
                if (userData.email) {
                    return { userType: 'professionnel', identifier: userData.email, userId: userData.id || userData.userId ? String(userData.id || userData.userId) : undefined };
                }
                if (userData.id || userData.userId) {
                    return { userType: userData.type === 'patient' ? 'patient' : 'professionnel', identifier: String(userData.id || userData.userId), userId: String(userData.id || userData.userId) };
                }
                throw new Error("Impossible de déterminer 'userType' et 'identifier' pour setup2FA");
            })();

            const response = await setup2FA(params);
            if (response && response.status === 'success' && response.data) {
                const payload = response.data;
                
                // 🔍 DÉBOGAGE DÉTAILLÉ - Traçage du secret reçu
                console.log('🔐 DEBUG - Réponse complète de setup2FA:', response);
                console.log('🔐 DEBUG - Payload extrait:', payload);
                
                // Secret EXACTEMENT tel que renvoyé par le serveur
                const receivedSecret = payload.secret || payload.two_factor_secret || payload.setupSecret || payload.totpSecret || '';
                console.log('🔐 DEBUG - Secret extrait:', {
                    receivedSecret: receivedSecret || 'VIDE',
                    length: receivedSecret ? receivedSecret.length : 0,
                    fromSecret: payload.secret || 'NON TROUVÉ',
                    fromTwoFactorSecret: payload.two_factor_secret || 'NON TROUVÉ',
                    fromSetupSecret: payload.setupSecret || 'NON TROUVÉ',
                    fromTotpSecret: payload.totpSecret || 'NON TROUVÉ'
                });
                
                setSecret(receivedSecret);
                
                // QR EXACTEMENT tel que renvoyé par le serveur (data:image... ou otpauth://...)
                const qrFromServer = payload.qrCode || payload.qrCodeData || payload.totpUrl || payload.otpauthUrl || null;
                console.log('📱 DEBUG - QR Code reçu:', {
                    qrFromServer: qrFromServer || 'NON FOURNI',
                    type: qrFromServer ? (qrFromServer.startsWith('data:image/') ? 'IMAGE_BASE64' : 'URL_OTPAUTH') : 'AUCUN',
                    fromQrCode: payload.qrCode || 'NON TROUVÉ',
                    fromQrCodeData: payload.qrCodeData || 'NON TROUVÉ',
                    fromTotpUrl: payload.totpUrl || 'NON TROUVÉ',
                    fromOtpauthUrl: payload.otpauthUrl || 'NON TROUVÉ'
                });
                
                setQrCodeData(qrFromServer);
                setRecoveryCodes(payload.recoveryCodes || []);
                setStep('setup');
            } else {
                throw new Error("Réponse invalide de l'API de configuration 2FA");
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
    }, [userData, isLoginFlow, tempTokenId, generatedToken]);

    useEffect(() => {
        if (!userData) return;
        // Si c'est un flux de connexion avec 2FA déjà activé, passer directement à la vérification
        if (isLoginFlow && userData.two_factor_enabled && tempTokenId && generatedToken) {
            console.log('🔐 DEBUG - Initialisation en mode connexion avec 2FA existant');
            setLoginSecret(userData.two_factor_secret);
            setStep('verify');
            return;
        }
        // Si un secret 2FA existe déjà côté compte, on est en phase de vérification (aucun QR local, aucun secret local)
        if (userData.two_factor_secret) {
            setLoginSecret(userData.two_factor_secret);
            setStep('verify');
            return;
        }
        // Sinon, on lance la configuration (et on n'utilise QUE ce que renvoie le serveur)
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
                        console.log('🔐 DEBUG - JWT de l\'API validate2FASession:', {
                            fromVerificationResult: verificationResult.token || 'NON TROUVÉ',
                            fromVerificationResultData: verificationResult.data.token || 'NON TROUVÉ',
                            apiJWT: apiJWT || 'NON TROUVÉ'
                        });
                        
                        // Stocker les tokens selon le type d'utilisateur
                        if (userData.type === 'patient' || userData.numero_assure) {
                            // Patient - PRIORITÉ AUX TOKENS ORIGINAUX DE LA PREMIÈRE AUTHENTIFICATION
                            let finalToken = null;
                            
                            if (apiJWT) {
                                // 🔑 TOKEN JWT DE L'API EN PRIORITÉ ABSOLUE
                                finalToken = apiJWT;
                                localStorage.setItem('jwt', finalToken);
                                console.log('🔐 DEBUG - JWT de l\'API validate2FASession stocké:', finalToken.substring(0, 20) + '...');
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
                                // 🔑 TOKEN JWT DE L'API EN PRIORITÉ ABSOLUE
                                finalToken = apiJWT;
                                localStorage.setItem('token', finalToken);
                                console.log('🔐 DEBUG - JWT de l\'API validate2FASession stocké:', finalToken.substring(0, 20) + '...');
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
                                console.log('🔐 DEBUG - Données médecin mises à jour stockées:', profData);
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

    const isImageQr = typeof qrCodeData === 'string' && qrCodeData.startsWith('data:image/');

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

            {step === 'setup' && (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="inline-block p-4 bg-gray-50 rounded-lg">
                            {qrCodeData ? (
                                <>
                                    {isImageQr ? (
                                        <img src={qrCodeData} alt="QR Code 2FA" className="mx-auto" width={200} height={200} />
                                    ) : (
                                        <QRCodeSVG value={qrCodeData} size={200} className="mx-auto" />
                                    )}
                                </>
                            ) : (
                                <div className="p-8 text-gray-500 text-sm">
                                    Le serveur n'a pas fourni d'image QR. Utilisez le secret ci-dessous dans votre application d'authentification.
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-600 mt-2">Secret (exact serveur): {secret || 'Non fourni'}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Instructions de configuration :</h4>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Ouvrez votre application d'authentification (Google Authenticator, etc.).</li>
                            <li>Si le QR est affiché, scannez-le. Sinon, ajoutez un compte avec le secret ci-dessus.</li>
                            <li>Entrez le code à 6 chiffres généré ci-dessous pour valider.</li>
                        </ol>
                    </div>
                    <button onClick={() => setStep('verify')} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">J'ai configuré l'application, continuer</button>
                    <button onClick={onCancel} className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">Annuler</button>
                </div>
            )}

            {step === 'verify' && (
                <form onSubmit={handleVerification} className="space-y-4">
                    {loginSecret && (
                        <p className="text-xs text-gray-500">Mode vérification: votre compte a déjà un 2FA activé.</p>
                    )}
                    <div>
                        <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">Code de vérification</label>
                        <input type="text" id="verificationCode" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="123456" maxLength="6" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                        <p className="text-xs text-gray-500 mt-1">Saisissez le code à 6 chiffres affiché dans votre application d'authentification</p>
                    </div>
                    <div className="flex space-x-3">
                        <button type="button" onClick={() => setStep('setup')} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">Retour</button>
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Valider</button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default Setup2FA;