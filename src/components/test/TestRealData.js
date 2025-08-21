import React, { useState, useEffect } from 'react';
import { fetchPatientsList, fetchPatientFiles, fetchConsultations, checkAuthenticationStatus, cleanupTemporaryTokens } from '../../services/api/authApi';

const TestRealData = () => {
    const [patients, setPatients] = useState([]);
    const [dossiers, setDossiers] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [authStatus, setAuthStatus] = useState(null);
    const [cleanedTokens, setCleanedTokens] = useState(0);

    const checkAuth = () => {
        console.log('🧪 Test: Vérification de l\'état d\'authentification...');
        const status = checkAuthenticationStatus();
        setAuthStatus(status);
        console.log('🧪 Test: État d'authentification:', status);
    };

    const cleanTokens = () => {
        console.log('🧪 Test: Nettoyage des tokens temporaires...');
        const count = cleanupTemporaryTokens();
        setCleanedTokens(count);
        console.log('🧪 Test: Tokens nettoyés:', count);
    };

    const testFetchPatients = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🧪 Test: Récupération de la liste des patients...');
            const patientsList = await fetchPatientsList();
            console.log('🧪 Test: Patients reçus:', patientsList);
            setPatients(patientsList);
        } catch (err) {
            console.error('🧪 Test: Erreur lors de la récupération des patients:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const testFetchDossiers = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🧪 Test: Récupération des dossiers patients...');
            const dossiersList = await fetchPatientFiles();
            console.log('🧪 Test: Dossiers reçus:', dossiersList);
            setDossiers(dossiersList);
        } catch (err) {
            console.error('🧪 Test: Erreur lors de la récupération des dossiers:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const testFetchConsultations = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🧪 Test: Récupération des consultations...');
            const consultationsList = await fetchConsultations();
            console.log('🧪 Test: Consultations reçues:', consultationsList);
            setConsultations(consultationsList);
        } catch (err) {
            console.error('🧪 Test: Erreur lors de la récupération des consultations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const testAll = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🧪 Test: Récupération de toutes les données...');
            
            // Test patients
            const patientsList = await fetchPatientsList();
            setPatients(patientsList);
            console.log('🧪 Test: Patients récupérés:', patientsList.length);
            
            // Test dossiers
            const dossiersList = await fetchPatientFiles();
            setDossiers(dossiersList);
            console.log('🧪 Test: Dossiers récupérés:', dossiersList.length);
            
            // Test consultations
            const consultationsList = await fetchConsultations();
            setConsultations(consultationsList);
            console.log('🧪 Test: Consultations récupérées:', consultationsList.length);
            
        } catch (err) {
            console.error('🧪 Test: Erreur lors des tests:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">🧪 Test des Données Réelles (Sans Simulation)</h1>
            
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
                </div>
                
                {cleanedTokens > 0 && (
                    <div className="mt-3 text-sm text-green-700">
                        ✅ <strong>{cleanedTokens}</strong> token(s) temporaire(s) nettoyé(s)
                    </div>
                )}
            </div>

            {/* Boutons de test */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                    onClick={testFetchPatients}
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading ? 'Chargement...' : '🔍 Test Patients (Vraies Données)'}
                </button>
                
                <button
                    onClick={testFetchDossiers}
                    disabled={loading}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                    {loading ? 'Chargement...' : '📁 Test Dossiers (Vraies Données)'}
                </button>
                
                <button
                    onClick={testFetchConsultations}
                    disabled={loading}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
                >
                    {loading ? 'Chargement...' : '🏥 Test Consultations (Vraies Données)'}
                </button>
                
                <button
                    onClick={testAll}
                    disabled={loading}
                    className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
                >
                    {loading ? 'Chargement...' : '🚀 Test Tout (Vraies Données)'}
                </button>
            </div>

            {/* Affichage des erreurs */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>❌ Erreur:</strong> {error}
                </div>
            )}

            {/* Résultats des tests */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Patients */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-blue-800 mb-3">👥 Patients (Vraies Données)</h2>
                    <p className="text-3xl font-bold text-blue-900 mb-2">{patients.length}</p>
                    <p className="text-sm text-blue-600">Nombre réel de patients</p>
                    
                    {patients.length > 0 && (
                        <div className="mt-3">
                            <h3 className="text-sm font-medium text-blue-700 mb-2">Liste des patients:</h3>
                            <div className="space-y-1">
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
                    <h2 className="text-lg font-semibold text-green-800 mb-3">📁 Dossiers (Vraies Données)</h2>
                    <p className="text-3xl font-bold text-green-900 mb-2">{dossiers.length}</p>
                    <p className="text-sm text-green-600">Nombre réel de dossiers</p>
                    
                    {dossiers.length > 0 && (
                        <div className="mt-3">
                            <h3 className="text-sm font-medium text-green-700 mb-2">Liste des dossiers:</h3>
                            <div className="space-y-1">
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
                    <h2 className="text-lg font-semibold text-purple-800 mb-3">🏥 Consultations (Vraies Données)</h2>
                    <p className="text-3xl font-bold text-purple-900 mb-2">{consultations.length}</p>
                    <p className="text-sm text-purple-600">Nombre réel de consultations</p>
                    
                    {consultations.length > 0 && (
                        <div className="mt-3">
                            <h3 className="text-sm font-medium text-purple-700 mb-2">Liste des consultations:</h3>
                            <div className="space-y-1">
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
                    <li>Vérifiez d'abord l'état d'authentification</li>
                    <li>Si des tokens temporaires sont présents, nettoyez-les</li>
                    <li>Testez la récupération des patients (sans simulation)</li>
                    <li>Vérifiez que vous obtenez le vrai nombre de patients</li>
                    <li>Testez aussi les dossiers et consultations</li>
                </ol>
                <p className="mt-3 text-sm text-yellow-600">
                    <strong>Note:</strong> Ce composant récupère les vraies données de votre API, sans aucune simulation.
                </p>
            </div>
        </div>
    );
};

export default TestRealData;
