import React, { useState, useEffect } from 'react';
import { logout, logoutPatient, logoutMedecin, logoutAll, standardCleanup } from '../../services/api/authApi';

const TokenCleanupTester = () => {
    const [localStorageState, setLocalStorageState] = useState({});
    const [testResults, setTestResults] = useState([]);
    const [isTesting, setIsTesting] = useState(false);

    // Fonction pour récupérer l'état actuel du localStorage
    const getLocalStorageState = () => {
        const state = {};
        const keys = [
            'token', 'jwt', 'medecin', 'patient', 'tempTokenId', 
            'firstConnectionToken', 'originalJWT', 'user', 'auth'
        ];
        
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    const parsed = JSON.parse(value);
                    state[key] = {
                        present: true,
                        type: typeof parsed,
                        length: value.length,
                        preview: value.substring(0, 50) + '...'
                    };
                } catch {
                    state[key] = {
                        present: true,
                        type: 'string',
                        length: value.length,
                        preview: value.substring(0, 50) + '...'
                    };
                }
            } else {
                state[key] = { present: false };
            }
        });
        
        return state;
    };

    // Mettre à jour l'état du localStorage
    useEffect(() => {
        setLocalStorageState(getLocalStorageState());
        
        // Écouter les changements du localStorage
        const handleStorageChange = () => {
            setLocalStorageState(getLocalStorageState());
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Test de déconnexion générale
    const testGeneralLogout = async () => {
        setIsTesting(true);
        const results = [];
        
        try {
            // État avant déconnexion
            const beforeState = getLocalStorageState();
            results.push({ step: 'Avant déconnexion', state: beforeState });
            
            // Effectuer la déconnexion
            await logout();
            results.push({ step: 'Après logout()', state: getLocalStorageState() });
            
            // Vérifier le nettoyage
            const afterState = getLocalStorageState();
            const cleanupSuccess = !afterState.token?.present && !afterState.jwt?.present;
            
            results.push({ 
                step: 'Résultat', 
                success: cleanupSuccess,
                message: cleanupSuccess ? '✅ Tokens nettoyés avec succès' : '❌ Tokens non nettoyés'
            });
            
        } catch (error) {
            results.push({ 
                step: 'Erreur', 
                error: error.message,
                state: getLocalStorageState()
            });
        }
        
        setTestResults(prev => [...prev, { test: 'Déconnexion générale', results }]);
        setIsTesting(false);
    };

    // Test de déconnexion patient
    const testPatientLogout = async () => {
        setIsTesting(true);
        const results = [];
        
        try {
            const beforeState = getLocalStorageState();
            results.push({ step: 'Avant déconnexion patient', state: beforeState });
            
            await logoutPatient();
            results.push({ step: 'Après logoutPatient()', state: getLocalStorageState() });
            
            const afterState = getLocalStorageState();
            const cleanupSuccess = !afterState.jwt?.present && !afterState.patient?.present;
            
            results.push({ 
                step: 'Résultat', 
                success: cleanupSuccess,
                message: cleanupSuccess ? '✅ Données patient nettoyées' : '❌ Données patient non nettoyées'
            });
            
        } catch (error) {
            results.push({ 
                step: 'Erreur', 
                error: error.message,
                state: getLocalStorageState()
            });
        }
        
        setTestResults(prev => [...prev, { test: 'Déconnexion patient', results }]);
        setIsTesting(false);
    };

    // Test de déconnexion médecin
    const testMedecinLogout = async () => {
        setIsTesting(true);
        const results = [];
        
        try {
            const beforeState = getLocalStorageState();
            results.push({ step: 'Avant déconnexion médecin', state: beforeState });
            
            await logoutMedecin();
            results.push({ step: 'Après logoutMedecin()', state: getLocalStorageState() });
            
            const afterState = getLocalStorageState();
            const cleanupSuccess = !afterState.token?.present && !afterState.medecin?.present;
            
            results.push({ 
                step: 'Résultat', 
                success: cleanupSuccess,
                message: cleanupSuccess ? '✅ Données médecin nettoyées' : '❌ Données médecin non nettoyées'
            });
            
        } catch (error) {
            results.push({ 
                step: 'Erreur', 
                error: error.message,
                state: getLocalStorageState()
            });
        }
        
        setTestResults(prev => [...prev, { test: 'Déconnexion médecin', results }]);
        setIsTesting(false);
    };

    // Test de déconnexion universelle
    const testUniversalLogout = async () => {
        setIsTesting(true);
        const results = [];
        
        try {
            const beforeState = getLocalStorageState();
            results.push({ step: 'Avant déconnexion universelle', state: beforeState });
            
            await logoutAll();
            results.push({ step: 'Après logoutAll()', state: getLocalStorageState() });
            
            const afterState = getLocalStorageState();
            const cleanupSuccess = !afterState.token?.present && !afterState.jwt?.present && 
                                 !afterState.medecin?.present && !afterState.patient?.present;
            
            results.push({ 
                step: 'Résultat', 
                success: cleanupSuccess,
                message: cleanupSuccess ? '✅ Toutes les données nettoyées' : '❌ Nettoyage incomplet'
            });
            
        } catch (error) {
            results.push({ 
                step: 'Erreur', 
                error: error.message,
                state: getLocalStorageState()
            });
        }
        
        setTestResults(prev => [...prev, { test: 'Déconnexion universelle', results }]);
        setIsTesting(false);
    };

    // Test manuel de nettoyage
    const testManualCleanup = () => {
        const results = [];
        
        try {
            const beforeState = getLocalStorageState();
            results.push({ step: 'Avant nettoyage manuel', state: beforeState });
            
            // Nettoyage manuel
            localStorage.removeItem('token');
            localStorage.removeItem('jwt');
            localStorage.removeItem('medecin');
            localStorage.removeItem('patient');
            localStorage.removeItem('tempTokenId');
            
            const afterState = getLocalStorageState();
            results.push({ step: 'Après nettoyage manuel', state: afterState });
            
            const cleanupSuccess = !afterState.token?.present && !afterState.jwt?.present && 
                                 !afterState.medecin?.present && !afterState.patient?.present;
            
            results.push({ 
                step: 'Résultat', 
                success: cleanupSuccess,
                message: cleanupSuccess ? '✅ Nettoyage manuel réussi' : '❌ Nettoyage manuel incomplet'
            });
            
        } catch (error) {
            results.push({ 
                step: 'Erreur', 
                error: error.message,
                state: getLocalStorageState()
            });
        }
        
        setTestResults(prev => [...prev, { test: 'Nettoyage manuel', results }]);
    };

    // Test du nettoyage standardisé
    const testStandardCleanup = () => {
        const results = [];
        
        try {
            const beforeState = getLocalStorageState();
            results.push({ step: 'Avant nettoyage standardisé', state: beforeState });
            
            // Détecter le type d'utilisateur
            const userType = beforeState.medecin?.present ? 'medecin' : 
                           beforeState.patient?.present ? 'patient' : null;
            
            // Nettoyage standardisé
            standardCleanup(userType);
            
            const afterState = getLocalStorageState();
            results.push({ step: 'Après nettoyage standardisé', state: afterState });
            
            const cleanupSuccess = !afterState.token?.present && !afterState.jwt?.present && 
                                 !afterState.medecin?.present && !afterState.patient?.present;
            
            results.push({ 
                step: 'Résultat', 
                success: cleanupSuccess,
                message: cleanupSuccess ? '✅ Nettoyage standardisé réussi' : '❌ Nettoyage standardisé incomplet'
            });
            
        } catch (error) {
            results.push({ 
                step: 'Erreur', 
                error: error.message,
                state: getLocalStorageState()
            });
        }
        
        setTestResults(prev => [...prev, { test: 'Nettoyage standardisé', results }]);
    };

    // Effacer les résultats des tests
    const clearTestResults = () => {
        setTestResults([]);
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    🧹 Testeur de Nettoyage des Tokens
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* État actuel du localStorage */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">
                            📊 État actuel du localStorage
                        </h3>
                        <div className="space-y-2">
                            {Object.entries(localStorageState).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center">
                                    <span className="font-medium text-blue-700">{key}:</span>
                                    {value.present ? (
                                        <span className="text-green-600 text-sm">
                                            ✅ {value.type} ({value.length} chars)
                                        </span>
                                    ) : (
                                        <span className="text-gray-500 text-sm">❌ Absent</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Boutons de test */}
                    <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-green-800 mb-4">
                            🧪 Tests de déconnexion
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={testGeneralLogout}
                                disabled={isTesting}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                                🔓 Test Déconnexion Générale
                            </button>
                            
                            <button
                                onClick={testPatientLogout}
                                disabled={isTesting}
                                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                            >
                                👤 Test Déconnexion Patient
                            </button>
                            
                            <button
                                onClick={testMedecinLogout}
                                disabled={isTesting}
                                className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                            >
                                👨‍⚕️ Test Déconnexion Médecin
                            </button>
                            
                            <button
                                onClick={testUniversalLogout}
                                disabled={isTesting}
                                className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                            >
                                🌐 Test Déconnexion Universelle
                            </button>
                            
                            <button
                                onClick={testManualCleanup}
                                className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                                🧹 Test Nettoyage Manuel
                            </button>
                            
                            <button
                                onClick={testStandardCleanup}
                                className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                            >
                                🧽 Test Nettoyage Standardisé
                            </button>
                        </div>
                    </div>
                </div>

                {/* Résultats des tests */}
                {testResults.length > 0 && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                📋 Résultats des tests
                            </h3>
                            <button
                                onClick={clearTestResults}
                                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                            >
                                Effacer
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {testResults.map((testResult, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-700 mb-2">
                                        {testResult.test}
                                    </h4>
                                    
                                    <div className="space-y-2">
                                        {testResult.results.map((result, resultIndex) => (
                                            <div key={resultIndex} className="text-sm">
                                                <div className="font-medium text-gray-600">
                                                    {result.step}:
                                                </div>
                                                {result.success !== undefined ? (
                                                    <div className={`ml-4 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                                                        {result.message}
                                                    </div>
                                                ) : result.error ? (
                                                    <div className="ml-4 text-red-600">
                                                        ❌ {result.error}
                                                    </div>
                                                ) : (
                                                    <div className="ml-4 text-gray-500">
                                                        État: {Object.keys(result.state).filter(k => result.state[k].present).length} éléments présents
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-6 bg-yellow-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                        📖 Instructions d'utilisation
                    </h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Connectez-vous d'abord à l'application pour avoir des tokens à tester</li>
                        <li>• Utilisez les boutons de test pour vérifier le nettoyage des tokens</li>
                        <li>• Vérifiez que tous les tokens sont supprimés après déconnexion</li>
                        <li>• Les tests simulent les différents types de déconnexion</li>
                        <li>• Utilisez le bouton de rafraîchissement pour voir l'état actuel</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default TokenCleanupTester;
