import React, { useState, useEffect } from 'react';
import { fetchPatientsList, fetchPatientFiles, fetchConsultations, checkAuthenticationStatus } from '../../services/api/authApi';

const TestDataRecovery = () => {
    const [patients, setPatients] = useState([]);
    const [dossiers, setDossiers] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [authStatus, setAuthStatus] = useState(null);
    const [testResults, setTestResults] = useState({});

    const checkAuth = () => {
        console.log('🧪 Test: Vérification de l\'état d\'authentification...');
        const status = checkAuthenticationStatus();
        setAuthStatus(status);
        console.log('🧪 Test: État d\'authentification:', status);
    };

    const testDataRecovery = async () => {
        setLoading(true);
        setError(null);
        setTestResults({});
        
        try {
            console.log('🧪 Test: Test de récupération des données...');
            
            // Test 1: Récupération des patients
            console.log('🧪 Test 1: Récupération des patients...');
            let patientsResult = { success: false, count: 0, error: null };
            try {
                const patientsList = await fetchPatientsList();
                patientsResult = { success: true, count: patientsList.length, error: null };
                setPatients(patientsList);
                console.log('✅ Test 1 réussi:', patientsList.length, 'patients récupérés');
            } catch (err) {
                patientsResult = { success: false, count: 0, error: err.message };
                console.error('❌ Test 1 échoué:', err.message);
            }
            
            // Test 2: Récupération des dossiers
            console.log('🧪 Test 2: Récupération des dossiers...');
            let dossiersResult = { success: false, count: 0, error: null };
            try {
                const dossiersList = await fetchPatientFiles();
                dossiersResult = { success: true, count: dossiersList.length, error: null };
                setDossiers(dossiersList);
                console.log('✅ Test 2 réussi:', dossiersList.length, 'dossiers récupérés');
            } catch (err) {
                dossiersResult = { success: false, count: 0, error: err.message };
                console.error('❌ Test 2 échoué:', err.message);
            }
            
            // Test 3: Récupération des consultations
            console.log('🧪 Test 3: Récupération des consultations...');
            let consultationsResult = { success: false, count: 0, error: null };
            try {
                const consultationsList = await fetchConsultations();
                consultationsResult = { success: true, count: consultationsList.length, error: null };
                setConsultations(consultationsList);
                console.log('✅ Test 3 réussi:', consultationsList.length, 'consultations récupérées');
            } catch (err) {
                consultationsResult = { success: false, count: 0, error: err.message };
                console.error('❌ Test 3 échoué:', err.message);
            }
            
            // Résumé des tests
            const results = {
                patients: patientsResult,
                dossiers: dossiersResult,
                consultations: consultationsResult,
                overallSuccess: patientsResult.success && dossiersResult.success && consultationsResult.success,
                totalData: patientsResult.count + dossiersResult.count + consultationsResult.count
            };
            
            setTestResults(results);
            console.log('🧪 Test: Résumé des tests:', results);
            
        } catch (err) {
            console.error('🧪 Test: Erreur générale lors des tests:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const testSingleEndpoint = async (endpointName, fetchFunction) => {
        setLoading(true);
        setError(null);
        
        try {
            console.log(`🧪 Test: Test de l'endpoint ${endpointName}...`);
            const data = await fetchFunction();
            
            const result = {
                success: true,
                count: Array.isArray(data) ? data.length : 0,
                error: null,
                data: data
            };
            
            console.log(`✅ Test ${endpointName} réussi:`, result);
            return result;
            
        } catch (err) {
            const result = {
                success: false,
                count: 0,
                error: err.message,
                data: []
            };
            
            console.error(`❌ Test ${endpointName} échoué:`, err.message);
            return result;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">🧪 Test de Récupération des Données (Post-Correction Tokens)</h1>
            
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
                        onClick={testDataRecovery}
                        disabled={loading || !authStatus?.hasValidToken}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        {loading ? 'Chargement...' : '🚀 Test Complet des Données'}
                    </button>
                </div>
            </div>

            {/* Résultats des tests */}
            {Object.keys(testResults).length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h2 className="text-lg font-semibold text-green-800 mb-3">📊 Résultats des Tests</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                            <p className="text-sm font-medium text-green-700">Patients</p>
                            <p className={`text-2xl font-bold ${testResults.patients?.success ? 'text-green-900' : 'text-red-900'}`}>
                                {testResults.patients?.success ? testResults.patients.count : '❌'}
                            </p>
                            <p className="text-xs text-green-600">
                                {testResults.patients?.success ? 'Récupération réussie' : 'Échec'}
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <p className="text-sm font-medium text-green-700">Dossiers</p>
                            <p className={`text-2xl font-bold ${testResults.dossiers?.success ? 'text-green-900' : 'text-red-900'}`}>
                                {testResults.dossiers?.success ? testResults.dossiers.count : '❌'}
                            </p>
                            <p className="text-xs text-green-600">
                                {testResults.dossiers?.success ? 'Récupération réussie' : 'Échec'}
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <p className="text-sm font-medium text-green-700">Consultations</p>
                            <p className={`text-2xl font-bold ${testResults.consultations?.success ? 'text-green-900' : 'text-red-900'}`}>
                                {testResults.consultations?.success ? testResults.consultations.count : '❌'}
                            </p>
                            <p className="text-xs text-green-600">
                                {testResults.consultations?.success ? 'Récupération réussie' : 'Échec'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <p className="text-sm font-medium text-green-700">Statut Global</p>
                        <p className={`text-3xl font-bold ${testResults.overallSuccess ? 'text-green-900' : 'text-red-900'}`}>
                            {testResults.overallSuccess ? '✅ SUCCÈS' : '❌ ÉCHEC'}
                        </p>
                        <p className="text-sm text-green-600">
                            Total: {testResults.totalData} éléments récupérés
                        </p>
                    </div>
                    
                    {/* Détails des erreurs */}
                    {!testResults.overallSuccess && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                            <h3 className="text-sm font-medium text-red-800 mb-2">❌ Détails des Erreurs</h3>
                            <div className="space-y-2">
                                {testResults.patients?.error && (
                                    <div className="text-sm text-red-700">
                                        <strong>Patients:</strong> {testResults.patients.error}
                                    </div>
                                )}
                                {testResults.dossiers?.error && (
                                    <div className="text-sm text-red-700">
                                        <strong>Dossiers:</strong> {testResults.dossiers.error}
                                    </div>
                                )}
                                {testResults.consultations?.error && (
                                    <div className="text-sm text-red-700">
                                        <strong>Consultations:</strong> {testResults.consultations.error}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Affichage des erreurs */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>❌ Erreur:</strong> {error}
                </div>
            )}

            {/* Données récupérées */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Patients */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-blue-800 mb-3">👥 Patients</h2>
                    <p className="text-3xl font-bold text-blue-900 mb-2">{patients.length}</p>
                    <p className="text-sm text-blue-600">Nombre de patients récupérés</p>
                    
                    {patients.length > 0 && (
                        <div className="mt-3">
                            <h3 className="text-sm font-medium text-blue-700 mb-2">Liste des patients:</h3>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {patients.slice(0, 5).map((patient, index) => (
                                    <div key={index} className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                                        {patient.nom || patient.prenom || `Patient ${index + 1}`}
                                    </div>
                                ))}
                                {patients.length > 5 && (
                                    <div className="text-xs text-blue-500 italic">
                                        ... et {patients.length - 5} autres
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Dossiers */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-green-800 mb-3">📁 Dossiers</h2>
                    <p className="text-3xl font-bold text-green-900 mb-2">{dossiers.length}</p>
                    <p className="text-sm text-green-600">Nombre de dossiers récupérés</p>
                    
                    {dossiers.length > 0 && (
                        <div className="mt-3">
                            <h3 className="text-sm font-medium text-green-700 mb-2">Liste des dossiers:</h3>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {dossiers.slice(0, 5).map((dossier, index) => (
                                    <div key={index} className="text-xs text-green-600 bg-green-100 p-2 rounded">
                                        {dossier.nom || dossier.prenom || `Dossier ${index + 1}`}
                                    </div>
                                ))}
                                {dossiers.length > 5 && (
                                    <div className="text-xs text-green-500 italic">
                                        ... et {dossiers.length - 5} autres
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Consultations */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-purple-800 mb-3">🏥 Consultations</h2>
                    <p className="text-3xl font-bold text-purple-900 mb-2">{consultations.length}</p>
                    <p className="text-sm text-purple-600">Nombre de consultations récupérées</p>
                    
                    {consultations.length > 0 && (
                        <div className="mt-3">
                            <h3 className="text-sm font-medium text-purple-700 mb-2">Liste des consultations:</h3>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {consultations.slice(0, 5).map((consultation, index) => (
                                    <div key={index} className="text-xs text-purple-600 bg-purple-100 p-2 rounded">
                                        {consultation.date || consultation.patient || `Consultation ${index + 1}`}
                                    </div>
                                ))}
                                {consultations.length > 5 && (
                                    <div className="text-xs text-purple-500 italic">
                                        ... et {consultations.length - 5} autres
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">📋 Instructions de Test</h3>
                <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                    <li>Vérifiez que l'authentification est active (token valide présent)</li>
                    <li>Lancez le test complet des données</li>
                    <li>Vérifiez que toutes les récupérations réussissent</li>
                    <li>Vérifiez que le nombre de données correspond à vos attentes</li>
                    <li>Si des erreurs persistent, vérifiez la configuration des tokens</li>
                </ol>
                <p className="mt-3 text-sm text-yellow-600">
                    <strong>Note:</strong> Ce test vérifie que la correction des tokens permet bien la récupération des vraies données.
                </p>
            </div>
        </div>
    );
};

export default TestDataRecovery;
