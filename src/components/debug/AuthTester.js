import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AuthTester = () => {
    const [testResults, setTestResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const addResult = (message, type = 'info') => {
        setTestResults(prev => [...prev, { 
            id: Date.now(), 
            message, 
            type, 
            timestamp: new Date().toLocaleTimeString() 
        }]);
    };

    const testDirectAPI = async () => {
        setIsLoading(true);
        addResult('🧪 Début des tests d\'API directe...', 'info');
        
        try {
            // Test 1: Vérifier la connectivité de base
            addResult('🔍 Test 1: Vérification de la connectivité...', 'info');
            const baseResponse = await axios.get('http://localhost:3000/api/health', {
                timeout: 5000
            });
            addResult(`✅ Connectivité OK: ${baseResponse.status}`, 'success');
        } catch (error) {
            addResult(`❌ Erreur de connectivité: ${error.message}`, 'error');
        }

        try {
            // Test 2: Test sans token
            addResult('🔍 Test 2: Test sans token...', 'info');
            const noTokenResponse = await axios.get('http://localhost:3000/api/access/patient/status', {
                timeout: 5000
            });
            addResult(`✅ Réponse sans token: ${noTokenResponse.status}`, 'success');
        } catch (error) {
            if (error.response?.status === 401) {
                addResult(`✅ Comportement attendu: 401 sans token`, 'success');
            } else {
                addResult(`❌ Erreur inattendue: ${error.message}`, 'error');
            }
        }

        try {
            // Test 3: Test avec token actuel
            addResult('🔍 Test 3: Test avec token actuel...', 'info');
            const currentToken = localStorage.getItem('jwt') || localStorage.getItem('token') || localStorage.getItem('originalJWT');
            
            if (currentToken) {
                addResult(`🔑 Token trouvé: ${currentToken.substring(0, 50)}...`, 'info');
                
                const withTokenResponse = await axios.get('http://localhost:3000/api/access/patient/status', {
                    headers: {
                        'Authorization': `Bearer ${currentToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                });
                addResult(`✅ Réponse avec token: ${withTokenResponse.status}`, 'success');
            } else {
                addResult('❌ Aucun token trouvé dans localStorage', 'error');
            }
        } catch (error) {
            if (error.response?.status === 401) {
                addResult(`❌ Token rejeté par le serveur: ${error.response.data?.message || 'Non spécifié'}`, 'error');
                
                // Analyser la réponse du serveur
                addResult(`🔍 Détails de la réponse serveur:`, 'info');
                addResult(`   - Status: ${error.response.status}`, 'info');
                addResult(`   - Message: ${error.response.data?.message || 'Non spécifié'}`, 'info');
                addResult(`   - Headers: ${JSON.stringify(error.response.headers, null, 2)}`, 'info');
            } else {
                addResult(`❌ Erreur inattendue: ${error.message}`, 'error');
            }
        }

        try {
            // Test 4: Test avec différents headers
            addResult('🔍 Test 4: Test avec différents headers...', 'info');
            const currentToken = localStorage.getItem('jwt') || localStorage.getItem('token') || localStorage.getItem('originalJWT');
            
            if (currentToken) {
                const headersVariations = [
                    { 'Authorization': `Bearer ${currentToken}` },
                    { 'Authorization': `Bearer ${currentToken}`, 'Accept': 'application/json' },
                    { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
                    { 'Authorization': `Bearer ${currentToken}`, 'Accept': 'application/json', 'Content-Type': 'application/json' }
                ];

                for (let i = 0; i < headersVariations.length; i++) {
                    try {
                        const response = await axios.get('http://localhost:3000/api/access/patient/status', {
                            headers: headersVariations[i],
                            timeout: 5000
                        });
                        addResult(`✅ Headers ${i + 1} OK: ${response.status}`, 'success');
                        break;
                    } catch (error) {
                        if (error.response?.status === 401) {
                            addResult(`❌ Headers ${i + 1} rejetés: 401`, 'error');
                        } else {
                            addResult(`❌ Headers ${i + 1} erreur: ${error.message}`, 'error');
                        }
                    }
                }
            }
        } catch (error) {
            addResult(`❌ Erreur lors du test des headers: ${error.message}`, 'error');
        }

        setIsLoading(false);
        addResult('🏁 Tests terminés', 'info');
    };

    const clearResults = () => {
        setTestResults([]);
    };

    const exportResults = () => {
        const resultsText = testResults.map(r => `[${r.timestamp}] ${r.type.toUpperCase()}: ${r.message}`).join('\n');
        const blob = new Blob([resultsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'auth-test-results.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">🧪 Testeur d'Authentification</h2>
            
            <div className="mb-4 space-x-2">
                <button
                    onClick={testDirectAPI}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {isLoading ? '🔄 Test en cours...' : '🚀 Lancer les Tests'}
                </button>
                
                <button
                    onClick={clearResults}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    🗑️ Effacer
                </button>
                
                <button
                    onClick={exportResults}
                    disabled={testResults.length === 0}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                    📥 Exporter
                </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.map(result => (
                    <div
                        key={result.id}
                        className={`p-3 rounded border-l-4 ${
                            result.type === 'success' ? 'border-green-500 bg-green-50' :
                            result.type === 'error' ? 'border-red-500 bg-red-50' :
                            'border-blue-500 bg-blue-50'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-sm">{result.message}</span>
                            <span className="text-xs text-gray-500 ml-2">{result.timestamp}</span>
                        </div>
                    </div>
                ))}
                
                {testResults.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        Aucun test exécuté. Cliquez sur "Lancer les Tests" pour commencer.
                    </div>
                )}
            </div>

            <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold mb-2">📋 Informations Système:</h3>
                <div className="text-sm space-y-1">
                    <div>🌐 URL de base: http://localhost:3000/api</div>
                    <div>🔑 Tokens stockés: {Object.keys(localStorage).filter(k => k.includes('token') || k.includes('jwt')).length}</div>
                    <div>👤 Données utilisateur: {localStorage.getItem('medecin') ? 'Médecin' : localStorage.getItem('patient') ? 'Patient' : 'Aucune'}</div>
                    <div>⏰ Heure locale: {new Date().toLocaleString()}</div>
                </div>
            </div>
        </div>
    );
};

export default AuthTester;
