import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { setup2FA, verify2FA } from '../../services/api/twoFactorApi';
import { FaQrcode, FaMobile, FaShieldAlt, FaCheckCircle } from 'react-icons/fa';

function Setup2FA({ onSetupComplete, onCancel }) {
    const [step, setStep] = useState('setup'); // 'setup', 'verify', 'success'
    const [qrCodeData, setQrCodeData] = useState(null);
    const [secret, setSecret] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        initialize2FA();
    }, []);

    const initialize2FA = async () => {
        try {
            setLoading(true);
            const response = await setup2FA();
            
            if (response.data) {
                setQrCodeData(response.data.qrCode);
                setSecret(response.data.secret);
                setRecoveryCodes(response.data.recoveryCodes);
                setStep('setup');
            }
        } catch (error) {
            setError(error.message);
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
            await verify2FA(verificationCode);
            setStep('success');
            setTimeout(() => {
                onSetupComplete();
            }, 2000);
        } catch (error) {
            setError(error.message);
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
                    {/* QR Code */}
                    <div className="text-center">
                        <div className="inline-block p-4 bg-gray-50 rounded-lg">
                            {qrCodeData && (
                                <QRCodeSVG 
                                    value={qrCodeData} 
                                    size={200}
                                    className="mx-auto"
                                />
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

                    {/* Codes de récupération */}
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