import React, { useState, useEffect } from 'react';
import { checkAuthenticationStatus, cleanupTemporaryTokens } from '../../services/api/authApi';

const TestTokenFix = () => {
    const [authStatus, setAuthStatus] = useState(null);
    const [cleanedTokens, setCleanedTokens] = useState(0);
    const [localStorageState, setLocalStorageState] = useState({});

    const checkAuth = () => {
        console.log('🧪 Test: Vérification de l\'état d\'authentification...');
        const status = checkAuthenticationStatus();
        setAuthStatus(status);
        console.log('🧪 Test: État d\'authentification:', status);
        updateLocalStorageState();
    };

    const cleanTokens = () => {
        console.log('🧪 Test: Nettoyage des tokens temporaires...');
        const count = cleanupTemporaryTokens();
        setCleanedTokens(count);
        console.log('🧪 Test: Tokens nettoyés:', count);
        updateLocalStorageState();
        checkAuth();
    };

    const updateLocalStorageState = () => {
        const state = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                state[key] = {
                    value: value ? value.substring(0, 50) + '...' : 'null',
                    length: value ? value.length : 0,
                    isTemp: value && value.startsWith('temp_'),
                    isJWT: value && value.startsWith('eyJ'),
                    isToken: value && !value.startsWith('temp_') && !value.startsWith('eyJ')
                };
            }
        }
        setLocalStorageState(state);
    };

    const simulate2FASuccess = () => {
        console.log('🧪 Test: Simulation d\'une validation 2FA réussie...');
        
        // Simuler un token d'authentification valide
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_token_for_testing';
        localStorage.setItem('token', mockToken);
        
        // Nettoyer le token temporaire
        localStorage.removeItem('tempTokenId');
        
        console.log('🧪 Test: Token simulé stocké, tempTokenId nettoyé');
        updateLocalStorageState();
        checkAuth();
    };

    const clearAllTokens = () => {
        console.log('🧪 Test: Suppression de tous les tokens...');
        localStorage.removeItem('jwt');
        localStorage.removeItem('token');
        localStorage.removeItem('tempTokenId');
        localStorage.removeItem('medecin');
        localStorage.removeItem('patient');
        
        console.log('🧪 Test: Tous les tokens supprimés');
        updateLocalStorageState();
        checkAuth();
    };

    useEffect(() => {
        checkAuth();
        updateLocalStorageState();
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">🧪 Test de Correction des Tokens (Post-2FA)</h1>
            
            {/* État d'authentification */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-blue-800 mb-3">🔑 État d'Authentification</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-medium text-blue-700">JWT Token:</p>
                        <p className="text-lg font-bold text-blue-900">{authStatus?.jwtToken || 'Chargement...'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-700">Token Général:</p>
                        <p className="text-lg font-bold text-blue-900">{authStatus?.generalToken || 'Chargement...'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-700">Token Valide:</p>
                        <p className={`text-lg font-bold ${authStatus?.hasValidToken ? 'text-green-900' : 'text-red-900'}`}>
                            {authStatus?.hasValidToken ? '✅ Oui' : '❌ Non'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-700">Nécessite Nettoyage:</p>
                        <p className={`text-lg font-bold ${authStatus?.needsCleanup ? 'text-red-900' : 'text-green-900'}`}>
                            {authStatus?.needsCleanup ? '⚠️ Oui' : '✅ Non'}
                        </p>
                    </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                    <button
                        onClick={checkAuth}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                        🔍 Vérifier
                    </button>
                    
                    <button
                        onClick={cleanTokens}
                        className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                    >
                        🧹 Nettoyer Tokens
                    </button>
                    
                    <button
                        onClick={simulate2FASuccess}
                        className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
                    >
                        🎭 Simuler 2FA Réussi
                    </button>
                    
                    <button
                        onClick={clearAllTokens}
                        className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                    >
                        🗑️ Effacer Tout
                    </button>
                </div>
                
                {cleanedTokens > 0 && (
                    <div className="mt-3 text-sm text-green-700">
                        ✅ <strong>{cleanedTokens}</strong> token(s) temporaire(s) nettoyé(s)
                    </div>
                )}
            </div>

            {/* État du localStorage */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-green-800 mb-3">💾 État du localStorage</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-green-100">
                                <th className="px-3 py-2 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Clé</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Valeur</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Longueur</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Type</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-green-200">
                            {Object.entries(localStorageState).map(([key, data]) => (
                                <tr key={key} className="hover:bg-green-50">
                                    <td className="px-3 py-2 text-sm font-medium text-green-900">{key}</td>
                                    <td className="px-3 py-2 text-sm text-green-700 font-mono text-xs">
                                        {data.value}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-green-700">{data.length}</td>
                                    <td className="px-3 py-2 text-sm">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            data.isTemp ? 'bg-red-100 text-red-800' :
                                            data.isJWT ? 'bg-blue-100 text-blue-800' :
                                            data.isToken ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {data.isTemp ? 'Temporaire' :
                                             data.isJWT ? 'JWT' :
                                             data.isToken ? 'Token' :
                                             'Autre'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {Object.keys(localStorageState).length === 0 && (
                    <p className="text-sm text-green-600 italic">Aucune donnée dans localStorage</p>
                )}
            </div>

            {/* Instructions de test */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">📋 Instructions de Test</h3>
                    <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                        <li>Vérifiez l'état d'authentification initial</li>
                        <li>Simulez une validation 2FA réussie</li>
                        <li>Vérifiez que le token valide est stocké</li>
                        <li>Testez le nettoyage des tokens temporaires</li>
                        <li>Vérifiez que le token principal reste</li>
                    </ol>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">🎯 Objectifs de la Correction</h3>
                    <ul className="list-disc list-inside space-y-2 text-purple-700">
                        <li>✅ Stocker le vrai token après validation 2FA</li>
                        <li>✅ Ne pas supprimer le token principal</li>
                        <li>✅ Nettoyer uniquement les tokens temporaires</li>
                        <li>✅ Permettre la récupération des données</li>
                        <li>✅ Maintenir l'authentification active</li>
                    </ul>
                </div>
            </div>

            {/* Résumé de l'état */}
            <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-indigo-800 mb-2">📊 Résumé de l'État</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-sm font-medium text-indigo-700">Tokens Temporaires</p>
                        <p className="text-2xl font-bold text-indigo-900">
                            {Object.values(localStorageState).filter(data => data.isTemp).length}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-indigo-700">Tokens Valides</p>
                        <p className="text-2xl font-bold text-indigo-900">
                            {Object.values(localStorageState).filter(data => data.isJWT || data.isToken).length}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-indigo-700">Authentification</p>
                        <p className={`text-2xl font-bold ${authStatus?.hasValidToken ? 'text-green-900' : 'text-red-900'}`}>
                            {authStatus?.hasValidToken ? '✅ Active' : '❌ Inactive'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestTokenFix;
