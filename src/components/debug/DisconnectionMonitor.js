import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const DisconnectionMonitor = () => {
    const [disconnectionEvents, setDisconnectionEvents] = useState([]);
    const [currentState, setCurrentState] = useState({});
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [lastKnownState, setLastKnownState] = useState(null);
    const location = useLocation();
    const intervalRef = useRef(null);
    const previousLocationRef = useRef(location.pathname);

    // Fonction pour capturer l'état actuel
    const captureCurrentState = () => {
        const state = {
            timestamp: new Date().toISOString(),
            url: location.pathname,
            localStorage: {},
            sessionStorage: {},
            cookies: document.cookie ? document.cookie.split(';').length : 0,
            userAgent: navigator.userAgent.substring(0, 100) + '...',
            memory: performance.memory ? {
                usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
                totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB'
            } : 'Non disponible'
        };

        // Capturer localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                state.localStorage[key] = {
                    value: value ? value.substring(0, 50) + '...' : 'null',
                    length: value ? value.length : 0,
                    timestamp: new Date().toISOString()
                };
            }
        }

        // Capturer sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key) {
                const value = sessionStorage.getItem(key);
                state.sessionStorage[key] = {
                    value: value ? value.substring(0, 50) + '...' : 'null',
                    length: value ? value.length : 0,
                    timestamp: new Date().toISOString()
                };
            }
        }

        return state;
    };

    // Fonction pour détecter les changements d'état
    const detectStateChanges = () => {
        try {
            const currentState = captureCurrentState();
            
            // Vérifier s'il y a eu un changement de localisation
            const locationChanged = previousLocationRef.current !== location.pathname;
            if (locationChanged) {
                console.log('🔄 DisconnectionMonitor - Changement de localisation détecté:', {
                    from: previousLocationRef.current,
                    to: location.pathname,
                    timestamp: currentState.timestamp
                });
                previousLocationRef.current = location.pathname;
            }

            // Vérifier s'il y a eu un changement d'état d'authentification
            if (lastKnownState) {
                const authChanges = [];
                
                // Vérifier les changements dans localStorage
                const currentKeys = Object.keys(currentState.localStorage);
                const previousKeys = Object.keys(lastKnownState.localStorage);
                
                // Nouvelles clés ajoutées
                const addedKeys = currentKeys.filter(key => !previousKeys.includes(key));
                if (addedKeys.length > 0) {
                    authChanges.push(`Nouvelles clés ajoutées: ${addedKeys.join(', ')}`);
                }
                
                // Clés supprimées
                const removedKeys = previousKeys.filter(key => !currentKeys.includes(key));
                if (removedKeys.length > 0) {
                    authChanges.push(`Clés supprimées: ${removedKeys.join(', ')}`);
                }
                
                // Changements de valeurs pour les clés importantes
                const importantKeys = ['token', 'jwt', 'medecin', 'patient', 'professionnel'];
                importantKeys.forEach(key => {
                    if (currentState.localStorage[key] && lastKnownState.localStorage[key]) {
                        const currentValue = currentState.localStorage[key].value;
                        const previousValue = lastKnownState.localStorage[key].value;
                        if (currentValue !== previousValue) {
                            authChanges.push(`Changement de valeur pour ${key}: ${previousValue} → ${currentValue}`);
                        }
                    }
                });
                
                // Détecter les déconnexions
                const wasAuthenticated = lastKnownState.localStorage.token || lastKnownState.localStorage.jwt;
                const isAuthenticated = currentState.localStorage.token || currentState.localStorage.jwt;
                
                if (wasAuthenticated && !isAuthenticated) {
                    const disconnectionEvent = {
                        timestamp: currentState.timestamp,
                        type: 'disconnection',
                        reason: 'Token supprimé ou modifié',
                        details: authChanges,
                        previousState: lastKnownState,
                        currentState: currentState,
                        location: location.pathname
                    };
                    
                    console.log('🚨 DisconnectionMonitor - DÉCONNEXION DÉTECTÉE:', disconnectionEvent);
                    setDisconnectionEvents(prev => [...prev, disconnectionEvent]);
                }
                
                // Détecter les reconnexions
                if (!wasAuthenticated && isAuthenticated) {
                    const reconnectionEvent = {
                        timestamp: currentState.timestamp,
                        type: 'reconnection',
                        reason: 'Nouveau token détecté',
                        details: authChanges,
                        previousState: lastKnownState,
                        currentState: currentState,
                        location: location.pathname
                    };
                    
                    console.log('✅ DisconnectionMonitor - RECONNEXION DÉTECTÉE:', reconnectionEvent);
                    setDisconnectionEvents(prev => [...prev, reconnectionEvent]);
                }
                
                // Si des changements d'authentification sont détectés
                if (authChanges.length > 0) {
                    console.log('⚠️ DisconnectionMonitor - Changements d\'authentification détectés:', authChanges);
                }
            }
            
            // Mettre à jour l'état actuel et le dernier état connu
            setCurrentState(currentState);
            setLastKnownState(currentState);
            
            return currentState;
            
        } catch (error) {
            console.error('❌ DisconnectionMonitor - Erreur lors de la détection des changements:', error);
            return null;
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
            console.log('⏹️ DisconnectionMonitor - Surveillance arrêtée');
        } else {
            setIsMonitoring(true);
            console.log('▶️ DisconnectionMonitor - Surveillance démarrée');
            
            // Capture immédiate
            const initialState = captureCurrentState();
            setCurrentState(initialState);
            setLastKnownState(initialState);
            
            // Surveillance toutes les 1 seconde
            intervalRef.current = setInterval(detectStateChanges, 1000);
        }
    };

    // Nettoyer l'historique
    const clearHistory = () => {
        setDisconnectionEvents([]);
        console.log('🧹 DisconnectionMonitor - Historique nettoyé');
    };

    // Effet de nettoyage
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Surveillance des changements de localisation
    useEffect(() => {
        if (isMonitoring && lastKnownState) {
            console.log('🔄 DisconnectionMonitor - Changement de route détecté:', {
                from: previousLocationRef.current,
                to: location.pathname,
                timestamp: new Date().toISOString()
            });
            
            // Vérifier l'état après le changement de route
            setTimeout(() => {
                detectStateChanges();
            }, 100);
        }
    }, [location.pathname]);

    return (
        <div className="max-w-7xl mx-auto p-6 bg-gray-50">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">🚨 Moniteur de Déconnexion</h1>
                
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
                        onClick={clearHistory}
                        className="px-4 py-2 bg-gray-500 text-white rounded font-medium hover:bg-gray-600"
                    >
                        🧹 Nettoyer l'Historique
                    </button>
                </div>

                {/* État actuel */}
                {currentState.timestamp && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h2 className="text-lg font-semibold text-blue-800 mb-3">📊 État Actuel</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-blue-700">Timestamp:</p>
                                <p className="text-sm text-blue-900">{currentState.timestamp}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-700">URL:</p>
                                <p className="text-sm text-blue-900">{currentState.url}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-700">Clés localStorage:</p>
                                <p className="text-sm text-blue-900">{Object.keys(currentState.localStorage).length}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-700">Cookies:</p>
                                <p className="text-sm text-blue-900">{currentState.cookies}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Événements de déconnexion */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <h2 className="text-lg font-semibold text-red-800 mb-3">🚨 Événements de Déconnexion ({disconnectionEvents.length})</h2>
                    
                    {disconnectionEvents.length === 0 ? (
                        <p className="text-red-700">Aucun événement de déconnexion détecté pour le moment.</p>
                    ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {disconnectionEvents.slice(-10).reverse().map((event, index) => (
                                <div key={index} className={`bg-white p-3 rounded border ${
                                    event.type === 'disconnection' ? 'border-red-300' : 'border-green-300'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-sm font-medium ${
                                            event.type === 'disconnection' ? 'text-red-700' : 'text-green-700'
                                        }`}>
                                            {event.type === 'disconnection' ? '🚨 Déconnexion' : '✅ Reconnexion'}
                                        </span>
                                        <span className="text-xs text-gray-500">{event.timestamp}</span>
                                    </div>
                                    
                                    <div className="text-sm mb-2">
                                        <span className="font-medium">Raison:</span>
                                        <span className="ml-1 text-gray-600">{event.reason}</span>
                                    </div>
                                    
                                    <div className="text-sm mb-2">
                                        <span className="font-medium">Localisation:</span>
                                        <span className="ml-1 text-gray-600">{event.location}</span>
                                    </div>
                                    
                                    {event.details && event.details.length > 0 && (
                                        <div className="text-xs bg-gray-50 p-2 rounded">
                                            <span className="font-medium">Détails:</span>
                                            <ul className="mt-1 space-y-1">
                                                {event.details.map((detail, detailIndex) => (
                                                    <li key={detailIndex} className="text-gray-600">• {detail}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* État localStorage actuel */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <h2 className="text-lg font-semibold text-purple-800 mb-3">💾 État localStorage Actuel</h2>
                    
                    {Object.keys(currentState.localStorage || {}).length === 0 ? (
                        <p className="text-purple-700">Aucune clé localStorage trouvée.</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {Object.entries(currentState.localStorage || {}).map(([key, value]) => (
                                <div key={key} className="bg-white p-2 rounded border text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-purple-700">{key}:</span>
                                        <span className="text-xs text-gray-500">{value.timestamp}</span>
                                    </div>
                                    <div className="text-gray-600">
                                        {value.value} ({value.length} chars)
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
                        <li>Démarrez la surveillance pour détecter les déconnexions en temps réel</li>
                        <li>Naviguez entre les onglets et les pages pour déclencher les vérifications</li>
                        <li>Observez les événements de déconnexion dans la section rouge</li>
                        <li>Vérifiez l'état localStorage pour identifier les tokens supprimés</li>
                        <li>Utilisez les logs de la console pour plus de détails</li>
                    </ol>
                    <p className="mt-3 text-sm text-yellow-600">
                        <strong>Note:</strong> Ce moniteur vous aidera à identifier exactement quand et pourquoi vous êtes déconnecté lors de la navigation.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DisconnectionMonitor;
