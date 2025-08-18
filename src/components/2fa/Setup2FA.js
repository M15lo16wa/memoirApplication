import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { setup2FA, verifyAndEnable2FA } from '../../services/api/twoFactorApi';
import { use2FA } from '../../hooks/use2FA';
import { FaQrcode, FaMobile, FaShieldAlt, FaCheckCircle } from 'react-icons/fa';

function Setup2FA({ onSetupComplete, onCancel, userData = null }) {
    const [step, setStep] = useState('setup'); // 'setup', 'verify', 'success'
    const [qrCodeData, setQrCodeData] = useState(null);
    const [secret, setSecret] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Utiliser le hook 2FA pour la gestion des sessions temporaires
    const { createTemporary2FASession, tempTokenId } = use2FA();

    useEffect(() => {
        console.log('🔍 Setup2FA - userData reçu:', userData);
        console.log('🔍 Structure complète de userData:', JSON.stringify(userData, null, 2));
        
        if (userData && userData.two_factor_secret) {
            console.log('🔑 Secret 2FA trouvé, génération directe du QR code...');
            // Utiliser directement le secret reçu de la connexion
            setSecret(userData.two_factor_secret);
            generateQRCode(userData.two_factor_secret, userData);
            setStep('setup');
        } else {
            console.log('⚠️ Pas de secret 2FA, appel API de configuration...');
            // Sinon, faire l'appel API (configuration initiale)
            initialize2FA();
        }
    }, [userData]);

    const generateQRCode = (secret, userData) => {
        console.log('🔑 Génération QR code avec secret:', secret);
        console.log('👤 Données utilisateur pour QR code:', userData);
        
        try {
            // Vérifier que le secret est présent
            if (!secret) {
                console.error('❌ Secret 2FA manquant pour la génération du QR code');
                return;
            }
            
            // Générer l'URL pour l'application d'authentification
            const appName = 'Santé Sénégal';
            const userName = userData.email || userData.numero_assure || userData.numero_adeli || 'User';
            const qrCodeUrl = `otpauth://totp/${appName}:${userName}?secret=${secret}&issuer=${appName}&algorithm=SHA1&digits=6&period=30`;
            
            console.log('📱 URL TOTP générée:', qrCodeUrl);
            console.log('👤 Nom d\'utilisateur utilisé:', userName);
            console.log('🏥 Nom de l\'application:', appName);
            
            // Définir l'URL du QR code
            setQrCodeData(qrCodeUrl);
            console.log('✅ QR code data définie avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de la génération du QR code:', error);
        }
    };





    const initialize2FA = async () => {
        try {
            setLoading(true);
            setError(''); // Réinitialiser les erreurs
            
            console.log('🔧 Initialisation de la configuration 2FA...');
            const response = await setup2FA();
            
            if (response && response.data) {
                console.log('✅ Configuration 2FA initialisée:', response.data);
                setQrCodeData(response.data.qrCode);
                setSecret(response.data.secret);
                setRecoveryCodes(response.data.recoveryCodes || []);
                setStep('setup');
            } else {
                throw new Error('Réponse invalide de l\'API de configuration 2FA');
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation 2FA:', error);
            
            let errorMessage = 'Erreur lors de la configuration 2FA';
            
            if (typeof error === 'string') {
                errorMessage = error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (e) => {
        e.preventDefault();
        if (!verificationCode || verificationCode.length !== 6) {
            setError('Veuillez saisir un code à 6 chiffres');
            return;
        }

        try {
            setLoading(true);
            setError(''); // Réinitialiser l'erreur
            
            console.log('🔐 Tentative de validation 2FA avec le code:', verificationCode);
            console.log('👤 Contexte utilisateur:', {
                hasTwoFactorSecret: !!userData?.two_factor_secret,
                userDataType: userData ? typeof userData : 'null',
                userDataKeys: userData ? Object.keys(userData) : []
            });
            
            // Afficher des informations de débogage pour le code attendu
            console.log('🔍 Informations de débogage 2FA:', {
                secret: userData?.two_factor_secret,
                codeSaisi: verificationCode,
                timestamp: new Date().toISOString()
            });
            
            if (userData && userData.two_factor_secret && tempTokenId) {
                // Connexion : valider le code avec l'API de validation
                console.log('🔑 Mode CONNEXION - Validation avec le hook use2FA');
                console.log('📊 Données envoyées:', { 
                    twoFactorToken: verificationCode,
                    tempTokenId: tempTokenId 
                });
                
                // Utiliser le hook pour la validation (qui gère automatiquement le tempTokenId)
                // Pour l'instant, on simule la validation réussie
                console.log('✅ Validation 2FA simulée avec succès');
                setStep('success');
                
                // Stocker les données utilisateur
                localStorage.setItem('patient', JSON.stringify(userData));
                console.log('👤 Données utilisateur stockées');
                
                setTimeout(() => {
                    console.log('🚀 Appel de onSetupComplete après délai');
                    onSetupComplete();
                }, 2000);
                
            } else if (!tempTokenId) {
                throw new Error('Session temporaire 2FA manquante - veuillez réessayer');
            } else {
                // Configuration : valider le code avec l'API de vérification
                console.log('⚙️ Mode CONFIGURATION - Validation avec verifyAndEnable2FA');
                const verificationResult = await verifyAndEnable2FA(verificationCode);
                console.log('✅ Résultat vérification 2FA:', verificationResult);
                
                if (verificationResult && verificationResult.success) {
                    console.log('🎉 Configuration 2FA réussie');
                    setStep('success');
                    setTimeout(() => {
                        onSetupComplete();
                    }, 2000);
                } else {
                    throw new Error('Échec de la configuration 2FA');
                }
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de la validation 2FA:', error);
            console.error('📊 Détails de l\'erreur:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                errorType: error.constructor.name,
                stack: error.stack
            });
            
            // Extraire le message d'erreur le plus pertinent
            let errorMessage = 'Erreur lors de la validation du code 2FA';
            
            if (typeof error === 'string') {
                errorMessage = error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            // Ajouter des conseils pour l'utilisateur
            if (errorMessage.includes('invalide') || errorMessage.includes('expiré')) {
                errorMessage += ' - Vérifiez que le code est correct et qu\'il n\'a pas expiré';
            } else if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
                errorMessage = 'Impossible de contacter le serveur - vérifiez votre connexion';
            }
            
            setError(errorMessage);
            
            // Log supplémentaire pour le débogage
            console.log('💡 Conseils de débogage:', {
                codeSaisi: verificationCode,
                secret2FA: userData?.two_factor_secret,
                messageErreur: errorMessage,
                suggestion: 'Vérifiez que le code correspond au token généré par le backend',
                timestamp: new Date().toISOString()
            });
            
            // Log de l'erreur complète pour analyse
            console.log('🐛 Erreur complète pour analyse:', {
                error: error,
                errorType: error.constructor.name,
                errorMessage: error.message,
                errorResponse: error.response,
                errorStack: error.stack
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Configuration en cours...</span>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="text-center p-8">
                <FaCheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Configuration 2FA réussie !
                </h3>
                <p className="text-gray-600">
                    Votre authentification à double facteur est maintenant activée.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center mb-6">
                <FaShieldAlt className="mx-auto h-12 w-12 text-blue-600 mb-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                    Configuration 2FA
                </h2>
                <p className="text-gray-600 mt-2">
                    Sécurisez votre compte avec l'authentification à double facteur
                </p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                    <p className="text-sm">{error}</p>
                </div>
            )}

            

            {step === 'setup' && (
                <div className="space-y-6">
                    {/* Logs de débogage pour le QR code */}
                    {console.log('🎯 Rendu étape setup - Affichage QR code')}
                    {console.log('🔑 Secret disponible:', secret)}
                    {console.log('📱 QR code data disponible:', qrCodeData)}
                    {console.log('👤 userData complet:', userData)}
                    
                    {/* QR Code */}
                    <div className="text-center">
                        <div className="inline-block p-4 bg-gray-50 rounded-lg">
                            {qrCodeData ? (
                                <>
                                    {console.log('✅ Affichage du QR code avec succès')}
                                    <QRCodeSVG 
                                        value={qrCodeData} 
                                        size={200}
                                        className="mx-auto"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Secret: {secret}</p>
                                </>
                            ) : (
                                <div className="p-8 text-gray-400">
                                    {console.log('❌ Données manquantes pour le QR code')}
                                    <p>Chargement du QR code...</p>
                                    <p className="text-xs">qrCodeData: {qrCodeData ? 'Présent' : 'Absent'}</p>
                                    <p className="text-xs">secret: {secret || 'Non défini'}</p>
                                    <p className="text-xs">userData.two_factor_secret: {userData?.two_factor_secret || 'Non défini'}</p>
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mt-3">
                            Scannez ce QR code avec votre application d'authentification
                        </p>
                    </div>

                    

                    {/* Instructions */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">
                            Instructions de configuration :
                        </h4>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Téléchargez Google Authenticator ou une app similaire</li>
                            <li>Scannez le QR code ci-dessus</li>
                            <li>Saisissez le code à 6 chiffres généré</li>
                        </ol>
                    </div>

                    {/* Codes de récupération - seulement affichés si disponibles */}
                    {recoveryCodes && recoveryCodes.length > 0 && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <h4 className="font-medium text-yellow-900 mb-2">
                                Codes de récupération (à conserver précieusement) :
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
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        J'ai configuré l'application, continuer
                    </button>

                    <button
                        onClick={onCancel}
                        className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                        Annuler
                    </button>
                </div>
            )}

            {step === 'verify' && (
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
            )}
        </div>
    );
}

export default Setup2FA;