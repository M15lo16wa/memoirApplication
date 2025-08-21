import React, { useState, useEffect, useRef } from 'react';
import { checkAuthenticationStatus, getValidAuthToken } from '../../services/api/authApi';

const AuthenticationDebugger = () => {
    const [authHistory, setAuthHistory] = useState([]);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [localStorageHistory, setLocalStorageHistory] = useState([]);
    const intervalRef = useRef(null);
    const lastStatusRef = useRef(null);

    // Fonction pour capturer l'état actuel de localStorage
    const captureLocalStorageState = () => {
        const state = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                state[key] = {
                    value: value ? value.substring(0, 50) + '...' : 'null',
                    length: value ? value.length : 0,
                    timestamp: new Date().toISOString()
                };
            }
        }
        return state;
    };

    // Fonction pour vérifier l'authentification
    const checkAuth = () => {
        try {
            console.log('🔍 AuthenticationDebugger - Vérification authentification...');
            
            // Vérifier l'état d'authentification
            const status = checkAuthenticationStatus();
            const authToken = getValidAuthToken();
            const localStorageState = captureLocalStorageState();
            
            const currentTime = new Date().toISOString();
            
            // Créer un objet de statut complet
            const fullStatus = {
                timestamp: currentTime,
                status: status,
                authToken: authToken ? {
                    present: true,
                    preview: authToken.substring(0, 30) + '...',
                    length: authToken.length
                } : {
                    present: false,
                    preview: 'null',
                    length: 0
                },
                localStorage: localStorageState,
                url: window.location.href,
                userAgent: navigator.userAgent.substring(0, 100) + '...'
            };
            
            // Vérifier s'il y a eu un changement
            const hasChanged = !lastStatusRef.current || 
                JSON.stringify(lastStatusRef.current.status) !== JSON.stringify(status) ||
                lastStatusRef.current.authToken.present !== fullStatus.authToken.present;
            
            if (hasChanged) {
                console.log('🔄 AuthenticationDebugger - Changement détecté:', {
                    previous: lastStatusRef.current,
                    current: fullStatus
                });
                
                // Ajouter à l'historique
                setAuthHistory(prev => [...prev, {
                    ...fullStatus,
                    changeType: lastStatusRef.current ? 'update' : 'initial',
                    previousStatus: lastStatusRef.current
                }]);
                
                // Mettre à jour le statut actuel
                setCurrentStatus(fullStatus);
                lastStatusRef.current = fullStatus;
                
                // Capturer l'état localStorage
                setLocalStorageHistory(prev => [...prev, {
                    timestamp: currentTime,
                    state: localStorageState,
                    changeType: hasChanged ? 'auth_change' : 'monitoring'
                }]);
            }
            
            return fullStatus;
            
        } catch (error) {
            console.error('❌ AuthenticationDebugger - Erreur lors de la vérification:', error);
            return {
                timestamp: new Date().toISOString(),
                error: error.message,
                status: null,
                authToken: null,
                localStorage: captureLocalStorageState()
            };
        }
    };

    // Démarrer/arrêter la surveillance
    const toggleMonitoring = () => {
        if (isMonitoring) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setIsMonitoring(false);
            console.log('⏹️ AuthenticationDebugger - Surveillance arrêtée');
        } else {
            setIsMonitoring(true);
            console.log('▶️ AuthenticationDebugger - Surveillance démarrée');
            
            // Vérification immédiate
            checkAuth();
            
            // Vérification toutes les 2 secondes
            intervalRef.current = setInterval(checkAuth, 2000);
        }
    };

    // Vérification manuelle
    const manualCheck = () => {
        console.log('🔍 AuthenticationDebugger - Vérification manuelle...');
        checkAuth();
    };

    // Nettoyer l'historique
    const clearHistory = () => {
        setAuthHistory([]);
        setLocalStorageHistory([]);
        console.log('🧹 AuthenticationDebugger - Historique nettoyé');
    };

    // Effet de nettoyage
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Vérification initiale
    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <div className="max-w-7xl mx-auto p-6 bg-gray-50">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">🔍 Debugger d'Authentification</h1>
                
                {/* Contrôles */}
                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={toggleMonitoring}
                        className={`px-4 py-2 rounded font-medium ${
                            isMonitoring 
                                ? 'bg-red-500 text-white hover:bg-red-600' 
                                : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                    >
                        {isMonitoring ? '⏹️ Arrêter la Surveillance' : '▶️ Démarrer la Surveillance'}
                    </button>
                    
                    <button
                        onClick={manualCheck}
                        className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600"
                    >
                        🔍 Vérification Manuelle
                    </button>
                    
                    <button
                        onClick={clearHistory}
                        className="px-4 py-2 bg-gray-500 text-white rounded font-medium hover:bg-gray-600"
                    >
                        🧹 Nettoyer l'Historique
                    </button>
                </div>

                {/* Statut actuel */}
                {currentStatus && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h2 className="text-lg font-semibold text-blue-800 mb-3">📊 Statut Actuel</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-blue-700">Timestamp:</p>
                                <p className="text-sm text-blue-900">{currentStatus.timestamp}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-700">URL:</p>
                                <p className="text-sm text-blue-900">{currentStatus.url}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-700">Token d'Auth:</p>
                                <p className={`text-sm font-bold ${currentStatus.authToken.present ? 'text-green-900' : 'text-red-900'}`}>
                                    {currentStatus.authToken.present ? '✅ Présent' : '❌ Absent'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-700">Longueur Token:</p>
                                <p className="text-sm text-blue-900">{currentStatus.authToken.length}</p>
                            </div>
                        </div>
                        
                        {/* Détails du statut */}
                        {currentStatus.status && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-blue-700">JWT Token:</p>
                                    <p className="text-sm text-blue-900">{currentStatus.status.jwtToken}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-blue-700">Token Général:</p>
                                    <p className="text-sm text-blue-900">{currentStatus.status.generalToken}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-blue-700">Token Valide:</p>
                                    <p className={`text-sm font-bold ${currentStatus.status.hasValidToken ? 'text-green-900' : 'text-red-900'}`}>
                                        {currentStatus.status.hasValidToken ? '✅ Oui' : '❌ Non'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Historique des changements */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h2 className="text-lg font-semibold text-green-800 mb-3">📈 Historique des Changements ({authHistory.length})</h2>
                    
                    {authHistory.length === 0 ? (
                        <p className="text-green-700">Aucun changement détecté pour le moment.</p>
                    ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {authHistory.slice(-10).reverse().map((entry, index) => (
                                <div key={index} className="bg-white p-3 rounded border">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-medium text-gray-700">
                                            {entry.changeType === 'initial' ? '🆕 Initial' : '🔄 Mise à jour'}
                                        </span>
                                        <span className="text-xs text-gray-500">{entry.timestamp}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="font-medium">Token:</span>
                                            <span className={`ml-1 ${entry.authToken.present ? 'text-green-600' : 'text-red-600'}`}>
                                                {entry.authToken.present ? '✅ Présent' : '❌ Absent'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium">URL:</span>
                                            <span className="ml-1 text-gray-600">{entry.url}</span>
                                        </div>
                                    </div>
                                    
                                    {entry.previousStatus && (
                                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                            <span className="font-medium">Changement détecté:</span>
                                            <div className="mt-1">
                                                <span className="text-gray-600">Avant:</span>
                                                <span className={`ml-1 ${entry.previousStatus.authToken.present ? 'text-green-600' : 'text-red-600'}`}>
                                                    {entry.previousStatus.authToken.present ? '✅ Token présent' : '❌ Token absent'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Après:</span>
                                                <span className={`ml-1 ${entry.authToken.present ? 'text-green-600' : 'text-red-600'}`}>
                                                    {entry.authToken.present ? '✅ Token présent' : '❌ Token absent'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* État localStorage */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-purple-800 mb-3">💾 État localStorage ({localStorageHistory.length})</h2>
                    
                    {localStorageHistory.length === 0 ? (
                        <p className="text-purple-700">Aucun état localStorage capturé pour le moment.</p>
                    ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {localStorageHistory.slice(-5).reverse().map((entry, index) => (
                                <div key={index} className="bg-white p-3 rounded border">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-purple-700">
                                            {entry.changeType === 'auth_change' ? '🔐 Changement Auth' : '📊 Monitoring'}
                                        </span>
                                        <span className="text-xs text-gray-500">{entry.timestamp}</span>
                                    </div>
                                    
                                    <div className="text-xs">
                                        <span className="font-medium">Clés:</span>
                                        <span className="ml-1 text-gray-600">
                                            {Object.keys(entry.state).join(', ')}
                                        </span>
                                    </div>
                                    
                                    {/* Détails des clés importantes */}
                                    <div className="mt-2 space-y-1">
                                        {Object.entries(entry.state).map(([key, value]) => (
                                            <div key={key} className="text-xs">
                                                <span className="font-medium text-gray-700">{key}:</span>
                                                <span className="ml-1 text-gray-600">
                                                    {value.value} ({value.length} chars)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">📋 Instructions d'Utilisation</h3>
                    <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                        <li>Démarrez la surveillance pour suivre les changements d'authentification en temps réel</li>
                        <li>Naviguez entre les onglets pour déclencher les vérifications d'authentification</li>
                        <li>Observez l'historique pour identifier quand et pourquoi la déconnexion se produit</li>
                        <li>Vérifiez l'état localStorage pour voir si les tokens sont supprimés</li>
                        <li>Utilisez la vérification manuelle pour tester à tout moment</li>
                    </ol>
                    <p className="mt-3 text-sm text-yellow-600">
                        <strong>Note:</strong> Ce debugger vous aidera à identifier pourquoi vous êtes déconnecté lors de la navigation entre onglets.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthenticationDebugger;
