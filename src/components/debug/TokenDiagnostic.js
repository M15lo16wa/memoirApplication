import React, { useState, useEffect } from 'react';

const TokenDiagnostic = () => {
    const [tokenState, setTokenState] = useState({});
    const [localStorageState, setLocalStorageState] = useState({});

    const analyzeTokens = () => {
        const tokens = {
            jwt: localStorage.getItem('jwt'),
            token: localStorage.getItem('token'),
            firstConnectionToken: localStorage.getItem('firstConnectionToken'),
            tempTokenId: localStorage.getItem('tempTokenId'),
            medecin: localStorage.getItem('medecin'),
            patient: localStorage.getItem('patient')
        };

        const analysis = {};
        Object.keys(tokens).forEach(key => {
            const token = tokens[key];
            if (token) {
                try {
                    // Essayer de parser si c'est du JSON
                    const parsed = JSON.parse(token);
                    analysis[key] = {
                        present: true,
                        type: 'JSON',
                        length: token.length,
                        keys: Object.keys(parsed),
                        preview: token.substring(0, 50) + '...'
                    };
                } catch {
                    // C'est un token simple
                    analysis[key] = {
                        present: true,
                        type: 'Token',
                        length: token.length,
                        startsWithEyJ: token.startsWith('eyJ'),
                        startsWithTemp: token.startsWith('temp_'),
                        startsWithAuth: token.startsWith('auth_'),
                        preview: token.substring(0, 30) + '...'
                    };
                }
            } else {
                analysis[key] = { present: false };
            }
        });

        setTokenState(analysis);
    };

    const analyzeLocalStorage = () => {
        const allKeys = Object.keys(localStorage);
        const analysis = {};
        
        allKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                analysis[key] = {
                    length: value.length,
                    preview: value.substring(0, 50) + '...',
                    isToken: key.includes('token') || key.includes('jwt'),
                    isData: key === 'medecin' || key === 'patient'
                };
            }
        });

        setLocalStorageState(analysis);
    };

    const clearAllTokens = () => {
        const tokenKeys = ['jwt', 'token', 'firstConnectionToken', 'tempTokenId'];
        tokenKeys.forEach(key => localStorage.removeItem(key));
        analyzeTokens();
        analyzeLocalStorage();
    };

    const testTokenRetrieval = () => {
        console.log('🔍 TEST - Test de récupération des tokens...');
        
        // Simuler getValidAuthToken
        const jwtToken = localStorage.getItem('jwt');
        const generalToken = localStorage.getItem('token');
        const firstConnectionToken = localStorage.getItem('firstConnectionToken');
        
        console.log('🔍 TEST - Tokens trouvés:', {
            jwt: jwtToken ? `${jwtToken.substring(0, 20)}...` : 'Absent',
            token: generalToken ? `${generalToken.substring(0, 20)}...` : 'Absent',
            firstConnectionToken: firstConnectionToken ? `${firstConnectionToken.substring(0, 20)}...` : 'Absent'
        });

        // Tester la logique de priorité
        let finalToken = null;
        if (jwtToken && !jwtToken.startsWith('temp_')) {
            finalToken = jwtToken;
            console.log('✅ JWT prioritaire sélectionné');
        } else if (generalToken && !generalToken.startsWith('temp_')) {
            finalToken = generalToken;
            console.log('✅ Token général sélectionné');
        } else if (firstConnectionToken && !firstConnectionToken.startsWith('temp_')) {
            finalToken = firstConnectionToken;
            console.log('✅ FirstConnectionToken sélectionné');
        }

        console.log('🔍 TEST - Token final sélectionné:', finalToken ? `${finalToken.substring(0, 30)}...` : 'Aucun');
        return finalToken;
    };

    useEffect(() => {
        analyzeTokens();
        analyzeLocalStorage();
    }, []);

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">🔍 Diagnostic des Tokens</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* État des tokens */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">🔑 État des Tokens</h3>
                    <div className="space-y-2">
                        {Object.entries(tokenState).map(([key, info]) => (
                            <div key={key} className="border-l-4 border-blue-400 pl-3">
                                <div className="font-medium text-gray-700">{key}:</div>
                                {info.present ? (
                                    <div className="text-sm text-gray-600">
                                        <div>Type: {info.type}</div>
                                        <div>Longueur: {info.length}</div>
                                        {info.startsWithEyJ !== undefined && (
                                            <div>Format JWT: {info.startsWithEyJ ? '✅ Oui' : '❌ Non'}</div>
                                        )}
                                        {info.startsWithTemp !== undefined && (
                                            <div>Temp: {info.startsWithTemp ? '⚠️ Oui' : '✅ Non'}</div>
                                        )}
                                        {info.startsWithAuth !== undefined && (
                                            <div>Auth: {info.startsWithAuth ? '⚠️ Oui' : '✅ Non'}</div>
                                        )}
                                        <div className="text-xs text-gray-500 mt-1">Aperçu: {info.preview}</div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500">Absent</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* État du localStorage */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">📦 État du LocalStorage</h3>
                    <div className="space-y-2">
                        {Object.entries(localStorageState).map(([key, info]) => (
                            <div key={key} className="border-l-4 border-green-400 pl-3">
                                <div className="font-medium text-gray-700">{key}:</div>
                                <div className="text-sm text-gray-600">
                                    <div>Longueur: {info.length}</div>
                                    <div>Type: {info.isToken ? '🔑 Token' : info.isData ? '📊 Données' : '📝 Autre'}</div>
                                    <div className="text-xs text-gray-500 mt-1">Aperçu: {info.preview}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
                <div className="flex space-x-3">
                    <button
                        onClick={analyzeTokens}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        🔄 Actualiser l'analyse
                    </button>
                    <button
                        onClick={testTokenRetrieval}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        🧪 Tester la récupération
                    </button>
                    <button
                        onClick={clearAllTokens}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        🗑️ Nettoyer tous les tokens
                    </button>
                </div>

                {/* Résumé */}
                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                    <h4 className="font-semibold text-yellow-800 mb-2">💡 Analyse</h4>
                    <div className="text-sm text-yellow-700">
                        <div>• <strong>JWT</strong>: {tokenState.jwt?.present ? '✅ Présent' : '❌ Absent'}</div>
                        <div>• <strong>Token</strong>: {tokenState.token?.present ? '✅ Présent' : '❌ Absent'}</div>
                        <div>• <strong>FirstConnectionToken</strong>: {tokenState.firstConnectionToken?.present ? '✅ Présent' : '❌ Absent'}</div>
                        <div>• <strong>Problème identifié</strong>: {!tokenState.firstConnectionToken?.present ? '❌ FirstConnectionToken manquant' : '✅ Tokens disponibles'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TokenDiagnostic;
