import React, { useState, useEffect } from 'react';

const TokenChecker = () => {
    const [tokens, setTokens] = useState({});
    const [refreshKey, setRefreshKey] = useState(0);

    const refreshTokens = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        const allTokens = {};
        
        // Récupérer tous les tokens
        Object.keys(localStorage).forEach(key => {
            if (key.includes('token') || key.includes('jwt') || key.includes('auth')) {
                const value = localStorage.getItem(key);
                allTokens[key] = {
                    value: value,
                    length: value ? value.length : 0,
                    preview: value ? value.substring(0, 50) + '...' : 'null',
                    isJWT: value ? value.startsWith('eyJ') : false,
                    isValid: value ? (value.startsWith('eyJ') && value.length > 100) : false
                };
            }
        });

        // Récupérer les données utilisateur
        const medecinData = localStorage.getItem('medecin');
        const patientData = localStorage.getItem('patient');
        
        if (medecinData) {
            try {
                const parsed = JSON.parse(medecinData);
                if (parsed.originalJWT) {
                    allTokens['medecin.originalJWT'] = {
                        value: parsed.originalJWT,
                        length: parsed.originalJWT.length,
                        preview: parsed.originalJWT.substring(0, 50) + '...',
                        isJWT: parsed.originalJWT.startsWith('eyJ'),
                        isValid: parsed.originalJWT.startsWith('eyJ') && parsed.originalJWT.length > 100
                    };
                }
                if (parsed.originalToken) {
                    allTokens['medecin.originalToken'] = {
                        value: parsed.originalToken,
                        length: parsed.originalToken.length,
                        preview: parsed.originalToken.substring(0, 50) + '...',
                        isJWT: parsed.originalToken.startsWith('eyJ'),
                        isValid: parsed.originalToken.startsWith('eyJ') && parsed.originalToken.length > 100
                    };
                }
            } catch (error) {
                console.error('Erreur parsing medecin:', error);
            }
        }

        if (patientData) {
            try {
                const parsed = JSON.parse(patientData);
                if (parsed.originalJWT) {
                    allTokens['patient.originalJWT'] = {
                        value: parsed.originalJWT,
                        length: parsed.originalJWT.length,
                        preview: parsed.originalJWT.substring(0, 50) + '...',
                        isJWT: parsed.originalJWT.startsWith('eyJ'),
                        isValid: parsed.originalJWT.startsWith('eyJ') && parsed.originalJWT.length > 100
                    };
                }
            } catch (error) {
                console.error('Erreur parsing patient:', error);
            }
        }

        setTokens(allTokens);
    }, [refreshKey]);

    const testToken = async (tokenKey, tokenValue) => {
        if (!tokenValue || !tokenValue.startsWith('eyJ')) {
            alert('Ce token n\'est pas un JWT valide');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/access/patient/status', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenValue}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = {
                status: response.status,
                ok: response.ok,
                message: response.ok ? 'Token valide' : `Erreur ${response.status}`
            };

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    result.message = errorData.message || `Erreur ${response.status}`;
                } catch (e) {
                    result.message = `Erreur ${response.status}`;
                }
            }

            alert(`Test du token ${tokenKey}:\n${result.message}`);
        } catch (error) {
            alert(`Erreur lors du test: ${error.message}`);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">🔍 Vérificateur de Tokens</h2>
                <button
                    onClick={refreshTokens}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    🔄 Actualiser
                </button>
            </div>

            <div className="space-y-3">
                {Object.entries(tokens).map(([key, token]) => (
                    <div
                        key={key}
                        className={`p-3 border rounded ${
                            token.isValid ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="font-semibold text-sm">{key}</div>
                                <div className="text-xs text-gray-600">
                                    Longueur: {token.length} | 
                                    Format: {token.isJWT ? 'JWT' : 'Non-JWT'} | 
                                    Statut: {token.isValid ? '✅ Valide' : '❌ Invalide'}
                                </div>
                                <div className="text-xs font-mono mt-1 break-all">
                                    {token.preview}
                                </div>
                            </div>
                            {token.isValid && (
                                <button
                                    onClick={() => testToken(key, token.value)}
                                    className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                >
                                    🧪 Tester
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {Object.keys(tokens).length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                        Aucun token trouvé dans localStorage
                    </div>
                )}
            </div>

            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
                <div className="font-semibold mb-2">📋 Informations:</div>
                <div>• Les tokens JWT commencent par "eyJ"</div>
                <div>• Un token valide doit faire plus de 100 caractères</div>
                <div>• Cliquez sur "Tester" pour vérifier un token avec l'API</div>
            </div>
        </div>
    );
};

export default TokenChecker;
