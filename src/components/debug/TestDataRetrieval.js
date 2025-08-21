import React, { useState } from 'react';
import { getValidAuthToken } from '../../services/api/authApi';
import { fetchPatientsList, fetchPatientFiles, fetchConsultations } from '../../services/api/authApi';

const TestDataRetrieval = () => {
    const [testResults, setTestResults] = useState({});
    const [loading, setLoading] = useState(false);

    const testTokenRetrieval = () => {
        console.log('🧪 TEST - Test de récupération des tokens...');
        
        const results = {};
        
        // Test 1: Vérifier getValidAuthToken
        try {
            const token = getValidAuthToken();
            results.tokenRetrieval = {
                success: !!token,
                token: token ? `${token.substring(0, 30)}...` : 'Aucun',
                length: token ? token.length : 0,
                format: token ? (token.startsWith('eyJ') ? 'JWT standard' : 'Non-JWT') : 'N/A'
            };
            console.log('✅ Test getValidAuthToken réussi:', results.tokenRetrieval);
        } catch (error) {
            results.tokenRetrieval = {
                success: false,
                error: error.message
            };
            console.error('❌ Test getValidAuthToken échoué:', error);
        }

        // Test 2: Vérifier localStorage
        try {
            const localStorageTokens = {
                jwt: localStorage.getItem('jwt'),
                token: localStorage.getItem('token'),
                firstConnectionToken: localStorage.getItem('firstConnectionToken'),
                tempTokenId: localStorage.getItem('tempTokenId')
            };
            
            results.localStorage = {
                success: true,
                tokens: Object.keys(localStorageTokens).map(key => ({
                    key,
                    present: !!localStorageTokens[key],
                    value: localStorageTokens[key] ? `${localStorageTokens[key].substring(0, 20)}...` : 'Absent',
                    length: localStorageTokens[key] ? localStorageTokens[key].length : 0
                }))
            };
            console.log('✅ Test localStorage réussi:', results.localStorage);
        } catch (error) {
            results.localStorage = {
                success: false,
                error: error.message
            };
            console.error('❌ Test localStorage échoué:', error);
        }

        setTestResults(results);
    };

    const testDataRetrieval = async () => {
        setLoading(true);
        console.log('🧪 TEST - Test de récupération des données...');
        
        const results = {};
        
        try {
            // Test 1: fetchPatientsList
            try {
                const patients = await fetchPatientsList();
                results.patients = {
                    success: true,
                    count: Array.isArray(patients) ? patients.length : 'Format inattendu',
                    data: patients
                };
                console.log('✅ Test fetchPatientsList réussi:', results.patients);
            } catch (error) {
                results.patients = {
                    success: false,
                    error: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                };
                console.error('❌ Test fetchPatientsList échoué:', error);
            }

            // Test 2: fetchPatientFiles
            try {
                const files = await fetchPatientFiles();
                results.files = {
                    success: true,
                    count: Array.isArray(files) ? files.length : 'Format inattendu',
                    data: files
                };
                console.log('✅ Test fetchPatientFiles réussi:', results.files);
            } catch (error) {
                results.files = {
                    success: false,
                    error: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                };
                console.error('❌ Test fetchPatientFiles échoué:', error);
            }

            // Test 3: fetchConsultations
            try {
                const consultations = await fetchConsultations();
                results.consultations = {
                    success: true,
                    count: Array.isArray(consultations) ? consultations.length : 'Format inattendu',
                    data: consultations
                };
                console.log('✅ Test fetchConsultations réussi:', results.consultations);
            } catch (error) {
                results.consultations = {
                    success: false,
                    error: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                };
                console.error('❌ Test fetchConsultations échoué:', error);
            }

        } catch (error) {
            console.error('❌ Erreur générale lors des tests:', error);
        } finally {
            setLoading(false);
        }

        setTestResults(prev => ({ ...prev, dataRetrieval: results }));
    };

    const clearTestResults = () => {
        setTestResults({});
    };

    const renderTestResult = (key, result) => {
        if (!result) return null;
        
        return (
            <div key={key} className={`p-4 rounded-lg border-l-4 ${
                result.success ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
            }`}>
                <h4 className="font-semibold text-gray-800 mb-2">{key}</h4>
                {result.success ? (
                    <div className="text-green-700">
                        {result.count && <div>Nombre: {result.count}</div>}
                        {result.token && <div>Token: {result.token}</div>}
                        {result.format && <div>Format: {result.format}</div>}
                        {result.length && <div>Longueur: {result.length}</div>}
                        {result.tokens && (
                            <div>
                                <div className="font-medium mb-2">Tokens localStorage:</div>
                                {result.tokens.map((token, idx) => (
                                    <div key={idx} className="text-sm ml-4">
                                        {token.key}: {token.present ? `${token.value} (${token.length})` : 'Absent'}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-red-700">
                        <div>Erreur: {result.error}</div>
                        {result.status && <div>Status: {result.status}</div>}
                        {result.data && <div>Données: {JSON.stringify(result.data)}</div>}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">🧪 Test de Récupération des Données</h2>
            
            <div className="mb-6 space-y-3">
                <div className="flex space-x-3">
                    <button
                        onClick={testTokenRetrieval}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        🔑 Tester la Récupération des Tokens
                    </button>
                    <button
                        onClick={testDataRetrieval}
                        disabled={loading}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        📊 Tester la Récupération des Données
                    </button>
                    <button
                        onClick={clearTestResults}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        🗑️ Effacer les Résultats
                    </button>
                </div>
            </div>

            {/* Résultats des tests */}
            {Object.keys(testResults).length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">📋 Résultats des Tests</h3>
                    
                    {/* Test des tokens */}
                    {testResults.tokenRetrieval && renderTestResult('Récupération des Tokens', testResults.tokenRetrieval)}
                    {testResults.localStorage && renderTestResult('État du LocalStorage', testResults.localStorage)}
                    
                    {/* Test des données */}
                    {testResults.dataRetrieval && (
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-700">📊 Tests de Récupération des Données</h4>
                            {testResults.dataRetrieval.patients && renderTestResult('Liste des Patients', testResults.dataRetrieval.patients)}
                            {testResults.dataRetrieval.files && renderTestResult('Dossiers Patients', testResults.dataRetrieval.files)}
                            {testResults.dataRetrieval.consultations && renderTestResult('Consultations', testResults.dataRetrieval.consultations)}
                        </div>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                <h4 className="font-semibold text-yellow-800 mb-2">💡 Instructions de Test</h4>
                <div className="text-sm text-yellow-700 space-y-2">
                    <div>1. <strong>Test des Tokens</strong>: Vérifie que getValidAuthToken retourne un token valide</div>
                    <div>2. <strong>Test des Données</strong>: Vérifie que les appels API fonctionnent avec le token</div>
                    <div>3. <strong>Diagnostic</strong>: Si les tests échouent, utilisez le composant TokenDiagnostic pour analyser l'état des tokens</div>
                    <div>4. <strong>Problème identifié</strong>: Le token de première connexion n'est pas conservé après validation 2FA</div>
                </div>
            </div>
        </div>
    );
};

export default TestDataRetrieval;
