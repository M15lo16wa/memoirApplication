import React, { useState } from 'react';
import { fetchPatientsList, fetchPatientFiles, getValidAuthToken } from '../../services/api/authApi';

const SimpleDataTest = () => {
    const [testResults, setTestResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setTestResults(prev => [...prev, { timestamp, message, type }]);
    };

    const testDataRetrieval = async () => {
        setTestResults([]);
        addLog('🚀 Test de récupération des données...', 'info');
        
        // Test 1: Vérifier le token
        const token = getValidAuthToken();
        if (token) {
            addLog(`✅ Token trouvé: ${token.substring(0, 30)}...`, 'success');
            addLog(`📏 Longueur: ${token.length} caractères`, 'info');
            addLog(`🔐 Format: ${token.startsWith('eyJ') ? 'JWT standard' : 'Non-JWT'}`, 'info');
        } else {
            addLog('❌ Aucun token trouvé', 'error');
            return;
        }

        setIsLoading(true);

        try {
            // Test 2: Liste des patients
            addLog('🔍 Test de récupération des patients...', 'info');
            const patients = await fetchPatientsList();
            addLog(`✅ Patients récupérés: ${patients.length} trouvés`, 'success');
            
            // Test 3: Dossiers patients
            addLog('🔍 Test de récupération des dossiers...', 'info');
            const files = await fetchPatientFiles();
            addLog(`✅ Dossiers récupérés: ${files.length} trouvés`, 'success');
            
            addLog('✅ Tous les tests terminés avec succès', 'success');
        } catch (error) {
            addLog(`❌ Erreur lors des tests: ${error.message}`, 'error');
            
            if (error.response) {
                addLog(`📊 Détails: Status ${error.response.status} - ${error.response.data?.message || 'Non spécifié'}`, 'info');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearLogs = () => {
        setTestResults([]);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                🧪 Test Simple de Récupération des Données
            </h2>
            
            <div className="mb-6 space-y-3">
                <div className="flex gap-3">
                    <button
                        onClick={testDataRetrieval}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? '⏳ Test en cours...' : '🚀 Tester la Récupération'}
                    </button>
                    
                    <button
                        onClick={clearLogs}
                        className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        🗑️ Effacer Logs
                    </button>
                </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 mb-3">📋 Résultats des Tests</h3>
                
                {testResults.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        Cliquez sur "Tester la Récupération" pour commencer.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {testResults.map((log, index) => (
                            <div
                                key={index}
                                className={`p-2 rounded text-sm font-mono ${
                                    log.type === 'error' ? 'bg-red-100 text-red-800' :
                                    log.type === 'success' ? 'bg-green-100 text-green-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}
                            >
                                <span className="text-gray-600">[{log.timestamp}]</span> {log.message}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SimpleDataTest;
