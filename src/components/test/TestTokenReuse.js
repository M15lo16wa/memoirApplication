import React, { useState, useEffect } from 'react';
import { fetchPatientsList, fetchPatientFiles, getValidAuthToken, checkAuthenticationStatus } from '../../services/api/authApi';

function TestTokenReuse() {
    const [status, setStatus] = useState('idle');
    const [results, setResults] = useState({});
    const [error, setError] = useState(null);

    const testTokenReuse = async () => {
        setStatus('testing');
        setError(null);
        setResults({});

        try {
            console.log('🧪 Test de réutilisation des tokens...');

            // 1. Vérifier l'état d'authentification
            console.log('🔍 1. Vérification de l\'état d\'authentification...');
            const authStatus = checkAuthenticationStatus();
            console.log('📊 État d\'authentification:', authStatus);

            // 2. Récupérer le token valide
            console.log('🔍 2. Récupération du token d\'authentification...');
            const validToken = getValidAuthToken();
            console.log('🔑 Token valide récupéré:', validToken ? `${validToken.substring(0, 30)}...` : 'Aucun');

            if (!validToken) {
                throw new Error('Aucun token d\'authentification valide trouvé');
            }

            // 3. Tester la récupération des patients
            console.log('🔍 3. Test de récupération de la liste des patients...');
            const patients = await fetchPatientsList();
            console.log('✅ Patients récupérés:', patients.length);

            // 4. Tester la récupération des dossiers
            console.log('🔍 4. Test de récupération des dossiers patients...');
            const files = await fetchPatientFiles();
            console.log('✅ Dossiers récupérés:', files.length);

            setResults({
                authStatus,
                validToken: validToken ? `${validToken.substring(0, 30)}...` : 'Aucun',
                patientsCount: patients.length,
                filesCount: files.length,
                patients: patients.slice(0, 3), // Afficher les 3 premiers patients
                files: files.slice(0, 3) // Afficher les 3 premiers dossiers
            });

            setStatus('success');
            console.log('🎉 Test de réutilisation des tokens réussi !');

        } catch (error) {
            console.error('❌ Erreur lors du test:', error);
            setError(error.message);
            setStatus('error');
        }
    };

    const clearResults = () => {
        setResults({});
        setError(null);
        setStatus('idle');
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🧪 Test de Réutilisation des Tokens
            </h2>
            
            <p className="text-gray-600 mb-4">
                Ce composant teste la réutilisation des tokens de première connexion après validation 2FA.
            </p>

            <div className="space-y-4">
                <button
                    onClick={testTokenReuse}
                    disabled={status === 'testing'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {status === 'testing' ? 'Test en cours...' : 'Lancer le test'}
                </button>

                <button
                    onClick={clearResults}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 ml-2"
                >
                    Effacer les résultats
                </button>
            </div>

            {status === 'testing' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-center text-blue-600 mt-2">Test en cours...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="mt-6 space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Test réussi !</h3>
                        <p className="text-green-700">La réutilisation des tokens fonctionne correctement.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">🔑 État d'authentification</h4>
                            <pre className="text-sm text-blue-800 bg-white p-2 rounded overflow-auto">
                                {JSON.stringify(results.authStatus, null, 2)}
                            </pre>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">🔐 Token utilisé</h4>
                            <p className="text-sm text-blue-800 bg-white p-2 rounded font-mono">
                                {results.validToken}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-2">👥 Patients récupérés</h4>
                            <p className="text-green-700 mb-2">Nombre total : {results.patientsCount}</p>
                            {results.patients && results.patients.length > 0 && (
                                <div className="space-y-2">
                                    {results.patients.map((patient, index) => (
                                        <div key={index} className="text-sm bg-white p-2 rounded border">
                                            <strong>{patient.nom} {patient.prenom}</strong>
                                            <br />
                                            ID: {patient.id_patient || patient.id || 'N/A'}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-2">📁 Dossiers récupérés</h4>
                            <p className="text-green-700 mb-2">Nombre total : {results.filesCount}</p>
                            {results.files && results.files.length > 0 && (
                                <div className="space-y-2">
                                    {results.files.map((file, index) => (
                                        <div key={index} className="text-sm bg-white p-2 rounded border">
                                            <strong>Dossier {index + 1}</strong>
                                            <br />
                                            ID: {file.id || file.id_dossier || 'N/A'}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">❌ Test échoué</h3>
                    <p className="text-red-700 mb-2">Erreur : {error}</p>
                    <p className="text-sm text-red-600">
                        Vérifiez que vous êtes connecté avec 2FA et que des tokens sont disponibles.
                    </p>
                </div>
            )}
        </div>
    );
}

export default TestTokenReuse;
