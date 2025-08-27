import React, { useState, useEffect } from 'react';
import signalingService from '../../services/signalingService';

const MessagingDiagnostic = () => {
    const [diagnosticInfo, setDiagnosticInfo] = useState(null);
    const [testResults, setTestResults] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // Récupérer les informations de diagnostic
    const getDiagnosticInfo = () => {
        const info = signalingService.getDiagnosticInfo();
        setDiagnosticInfo(info);
        console.log('🔍 Diagnostic du service de messagerie:', info);
    };

    // Tester la connexion WebSocket
    const testWebSocketConnection = async () => {
        setIsLoading(true);
        setTestResults(prev => ({ ...prev, websocket: 'testing' }));

        try {
            // Initialiser le service
            signalingService.initialize();
            
            // Tenter la connexion
            const success = signalingService.connect();
            
            if (success) {
                setTestResults(prev => ({ ...prev, websocket: 'success' }));
                console.log('✅ Test WebSocket réussi');
            } else {
                setTestResults(prev => ({ ...prev, websocket: 'failed' }));
                console.log('❌ Test WebSocket échoué');
            }
        } catch (error) {
            setTestResults(prev => ({ ...prev, websocket: 'error' }));
            console.error('❌ Erreur lors du test WebSocket:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Tester l'API de messagerie
    const testMessagingAPI = async () => {
        setIsLoading(true);
        setTestResults(prev => ({ ...prev, api: 'testing' }));

        try {
            const tokens = signalingService.tokens;
            if (!tokens?.primaryToken) {
                setTestResults(prev => ({ ...prev, api: 'no_token' }));
                return;
            }

            const response = await fetch('http://localhost:3000/api/messaging/health', {
                headers: {
                    'Authorization': `Bearer ${tokens.primaryToken}`
                }
            });

            if (response.ok) {
                setTestResults(prev => ({ ...prev, api: 'success' }));
                console.log('✅ Test API messagerie réussi');
            } else {
                setTestResults(prev => ({ ...prev, api: 'failed', status: response.status }));
                console.log('❌ Test API messagerie échoué:', response.status);
            }
        } catch (error) {
            setTestResults(prev => ({ ...prev, api: 'error', message: error.message }));
            console.error('❌ Erreur lors du test API:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Vérifier les tokens disponibles
    const checkTokens = () => {
        const tokens = {
            jwt: localStorage.getItem('jwt'),
            token: localStorage.getItem('token'),
            patient: localStorage.getItem('patient'),
            medecin: localStorage.getItem('medecin'),
            professionnel: localStorage.getItem('professionnel')
        };

        setTestResults(prev => ({ ...prev, tokens }));
        console.log('🔍 Tokens disponibles:', tokens);
    };

    useEffect(() => {
        getDiagnosticInfo();
        checkTokens();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'text-green-600';
            case 'failed': return 'text-red-600';
            case 'error': return 'text-red-600';
            case 'testing': return 'text-yellow-600';
            case 'no_token': return 'text-orange-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return '✅';
            case 'failed': return '❌';
            case 'error': return '🚨';
            case 'testing': return '⏳';
            case 'no_token': return '⚠️';
            default: return '❓';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🔍 Diagnostic du Service de Messagerie</h2>
            
            {/* Informations de diagnostic */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">État du Service</h3>
                {diagnosticInfo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-700 mb-2">Service</h4>
                            <div className="space-y-1 text-sm">
                                <div>Initialisé: {diagnosticInfo.serviceInitialized ? '✅' : '❌'}</div>
                                <div>Socket existe: {diagnosticInfo.socketExists ? '✅' : '❌'}</div>
                                <div>Socket connecté: {diagnosticInfo.socketConnected ? '✅' : '❌'}</div>
                                <div>URL de base: {diagnosticInfo.baseURL}</div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-700 mb-2">Tokens</h4>
                            {diagnosticInfo.tokens && (
                                <div className="space-y-1 text-sm">
                                    <div>JWT: {diagnosticInfo.tokens.hasJWT ? '✅' : '❌'}</div>
                                    <div>Token: {diagnosticInfo.tokens.hasToken ? '✅' : '❌'}</div>
                                    <div>Patient: {diagnosticInfo.tokens.hasPatient ? '✅' : '❌'}</div>
                                    <div>Médecin: {diagnosticInfo.tokens.hasMedecin ? '✅' : '❌'}</div>
                                    <div>Token principal: {diagnosticInfo.tokens.hasPrimaryToken ? '✅' : '❌'}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Tests */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Tests de Connexion</h3>
                <div className="flex gap-4 mb-4">
                    <button
                        onClick={testWebSocketConnection}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? '⏳' : '🔌'} Tester WebSocket
                    </button>
                    
                    <button
                        onClick={testMessagingAPI}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {isLoading ? '⏳' : '🌐'} Tester API
                    </button>
                    
                    <button
                        onClick={checkTokens}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        🔑 Vérifier Tokens
                    </button>
                </div>

                {/* Résultats des tests */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2">WebSocket</h4>
                        <div className={`text-lg ${getStatusColor(testResults.websocket)}`}>
                            {getStatusIcon(testResults.websocket)} {testResults.websocket || 'Non testé'}
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2">API Messagerie</h4>
                        <div className={`text-lg ${getStatusColor(testResults.api)}`}>
                            {getStatusIcon(testResults.api)} {testResults.api || 'Non testé'}
                        </div>
                        {testResults.status && <div className="text-sm text-gray-600">Status: {testResults.status}</div>}
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2">Tokens</h4>
                        <div className="text-sm space-y-1">
                            {testResults.tokens && Object.entries(testResults.tokens).map(([key, value]) => (
                                <div key={key}>
                                    {key}: {value ? '✅' : '❌'}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions de débogage */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Actions de Débogage</h3>
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        🗑️ Nettoyer localStorage
                    </button>
                    
                    <button
                        onClick={() => {
                            if (signalingService.socket) {
                                signalingService.socket.disconnect();
                                console.log('🔌 Socket déconnecté manuellement');
                            }
                        }}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                        🔌 Déconnecter Socket
                    </button>
                    
                    <button
                        onClick={() => {
                            getDiagnosticInfo();
                            checkTokens();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        🔄 Actualiser
                    </button>
                </div>
            </div>

            {/* Logs de la console */}
            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Instructions</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                        <strong>Pour diagnostiquer le problème :</strong>
                    </p>
                    <ol className="list-decimal list-inside text-yellow-800 text-sm mt-2 space-y-1">
                        <li>Vérifiez que le serveur backend est démarré sur localhost:3000</li>
                        <li>Vérifiez que l'endpoint /messaging est accessible</li>
                        <li>Vérifiez que vous avez un token JWT valide</li>
                        <li>Regardez la console du navigateur pour les erreurs</li>
                        <li>Testez la connexion WebSocket et l'API</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default MessagingDiagnostic;
