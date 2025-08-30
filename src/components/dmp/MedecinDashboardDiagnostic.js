import React, { useState } from 'react';
import * as dmpApi from '../../services/api/dmpApi';
import * as signalingService from '../../services/signalingService';

const MedecinDashboardDiagnostic = () => {
    const [diagnosticResults, setDiagnosticResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [testMedecinId, setTestMedecinId] = useState('79');

    const addDiagnosticResult = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setDiagnosticResults(prev => [...prev, { message, type, timestamp }]);
    };

    const clearResults = () => {
        setDiagnosticResults([]);
    };

    const testMedecinConnection = async () => {
        try {
            setIsLoading(true);
            addDiagnosticResult('🔍 Test de connexion du médecin...', 'info');

            // Vérifier les données du médecin dans localStorage
            const medecinData = localStorage.getItem('medecin');
            if (medecinData) {
                try {
                    const medecin = JSON.parse(medecinData);
                    addDiagnosticResult(`✅ Médecin trouvé dans localStorage: ${medecin.prenom} ${medecin.nom}`, 'success');
                    addDiagnosticResult(`📋 ID: ${medecin.id_professionnel}`, 'info');
                    addDiagnosticResult(`📋 Spécialité: ${medecin.specialite || 'Non spécifiée'}`, 'info');
                } catch (e) {
                    addDiagnosticResult(`❌ Erreur de parsing des données médecin: ${e.message}`, 'error');
                }
            } else {
                addDiagnosticResult('❌ Aucun médecin trouvé dans localStorage', 'error');
            }

        } catch (error) {
            addDiagnosticResult(`❌ Erreur lors du test de connexion: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const testPatientsAPI = async () => {
        try {
            setIsLoading(true);
            addDiagnosticResult('🔍 Test de l\'API getPatientsByMedecin...', 'info');

            const result = await dmpApi.getPatientsByMedecin(testMedecinId);
            addDiagnosticResult(`📨 Réponse API patients: ${JSON.stringify(result, null, 2)}`, 'success');

            if (result?.data?.patients) {
                addDiagnosticResult(`✅ Patients trouvés: ${result.data.patients.length}`, 'success');
                result.data.patients.forEach((patient, index) => {
                    addDiagnosticResult(`📋 Patient ${index + 1}: ${patient.nom} ${patient.prenom} (ID: ${patient.id_patient})`, 'info');
                });
            } else {
                addDiagnosticResult('⚠️ Aucun patient trouvé ou structure de réponse inattendue', 'warning');
            }

        } catch (error) {
            addDiagnosticResult(`❌ Erreur API patients: ${error.message}`, 'error');
            if (error.response) {
                addDiagnosticResult(`📋 Status: ${error.response.status}`, 'error');
                addDiagnosticResult(`📋 Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const testRendezVousAPI = async () => {
        try {
            setIsLoading(true);
            addDiagnosticResult('🔍 Test de l\'API getRendezVousByMedecin...', 'info');

            const result = await dmpApi.getRendezVousByMedecin(testMedecinId);
            addDiagnosticResult(`📨 Réponse API rendez-vous: ${JSON.stringify(result, null, 2)}`, 'success');

            if (result?.data?.rendezVous) {
                addDiagnosticResult(`✅ Rendez-vous trouvés: ${result.data.rendezVous.length}`, 'success');
                result.data.rendezVous.forEach((rdv, index) => {
                    addDiagnosticResult(`📋 RDV ${index + 1}: ${rdv.date} à ${rdv.heure} - ${rdv.patient_nom}`, 'info');
                });
            } else {
                addDiagnosticResult('⚠️ Aucun rendez-vous trouvé ou structure de réponse inattendue', 'warning');
            }

        } catch (error) {
            addDiagnosticResult(`❌ Erreur API rendez-vous: ${error.message}`, 'error');
            if (error.response) {
                addDiagnosticResult(`📋 Status: ${error.response.status}`, 'error');
                addDiagnosticResult(`📋 Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const testMessagesAPI = async () => {
        try {
            setIsLoading(true);
            addDiagnosticResult('🔍 Test de l\'API getMessagesRecents...', 'info');

            const result = await dmpApi.getMessagesRecents(testMedecinId);
            addDiagnosticResult(`📨 Réponse API messages: ${JSON.stringify(result, null, 2)}`, 'success');

            if (result?.data?.messages) {
                addDiagnosticResult(`✅ Messages trouvés: ${result.data.messages.length}`, 'success');
                result.data.messages.forEach((msg, index) => {
                    addDiagnosticResult(`📋 Message ${index + 1}: ${msg.expediteur_nom} - ${msg.contenu?.substring(0, 50)}...`, 'info');
                });
            } else {
                addDiagnosticResult('⚠️ Aucun message trouvé ou structure de réponse inattendue', 'warning');
            }

        } catch (error) {
            addDiagnosticResult(`❌ Erreur API messages: ${error.message}`, 'error');
            if (error.response) {
                addDiagnosticResult(`📋 Status: ${error.response.status}`, 'error');
                addDiagnosticResult(`📋 Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const testConversationsAPI = async () => {
        try {
            setIsLoading(true);
            addDiagnosticResult('🔍 Test de l\'API getUserConversations...', 'info');

            const result = await signalingService.getUserConversations();
            addDiagnosticResult(`📨 Réponse API conversations: ${JSON.stringify(result, null, 2)}`, 'success');

            if (result?.conversations) {
                addDiagnosticResult(`✅ Conversations trouvées: ${result.conversations.length}`, 'success');
                result.conversations.forEach((conv, index) => {
                    addDiagnosticResult(`📋 Conversation ${index + 1}: ID ${conv.id} - ${conv.type_conversation}`, 'info');
                });
            } else {
                addDiagnosticResult('⚠️ Aucune conversation trouvée ou structure de réponse inattendue', 'warning');
            }

        } catch (error) {
            addDiagnosticResult(`❌ Erreur API conversations: ${error.message}`, 'error');
            if (error.response) {
                addDiagnosticResult(`📋 Status: ${error.response.status}`, 'error');
                addDiagnosticResult(`📋 Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const testAllAPIs = async () => {
        addDiagnosticResult('🚀 Démarrage du diagnostic complet...', 'info');
        
        await testMedecinConnection();
        await testPatientsAPI();
        await testRendezVousAPI();
        await testMessagesAPI();
        await testConversationsAPI();
        
        addDiagnosticResult('✅ Diagnostic complet terminé', 'success');
    };

    const checkAPIEndpoints = () => {
        addDiagnosticResult('🔍 Vérification des endpoints API...', 'info');
        
        // Vérifier les fonctions exportées
        const dmpApiFunctions = Object.keys(dmpApi);
        const signalingFunctions = Object.keys(signalingService);
        
        addDiagnosticResult(`📋 Fonctions dmpApi disponibles: ${dmpApiFunctions.join(', ')}`, 'info');
        addDiagnosticResult(`📋 Fonctions signalingService disponibles: ${signalingFunctions.join(', ')}`, 'info');
        
        // Vérifier les fonctions spécifiques
        const requiredFunctions = [
            'getPatientsByMedecin',
            'getRendezVousByMedecin', 
            'getMessagesRecents',
            'getNotificationsByMedecin'
        ];
        
        requiredFunctions.forEach(func => {
            if (typeof dmpApi[func] === 'function') {
                addDiagnosticResult(`✅ ${func}: Fonction disponible`, 'success');
            } else {
                addDiagnosticResult(`❌ ${func}: Fonction manquante`, 'error');
            }
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">🔍 Diagnostic Tableau de Bord Médecin</h2>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-2 text-blue-800">ℹ️ Objectif du Diagnostic</h3>
                <p className="text-sm text-blue-700">
                    Ce composant diagnostique les problèmes avec les APIs du tableau de bord médecin :
                    connexion, récupération des patients, rendez-vous, messages et conversations.
                </p>
            </div>

            {/* Configuration de test */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID du Médecin de Test
                </label>
                <input
                    type="text"
                    value={testMedecinId}
                    onChange={(e) => setTestMedecinId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="ID du médecin"
                />
            </div>

            {/* Boutons de test */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <button
                    onClick={testMedecinConnection}
                    disabled={isLoading}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    🔌 Test Connexion Médecin
                </button>

                <button
                    onClick={testPatientsAPI}
                    disabled={isLoading}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    👥 Test API Patients
                </button>

                <button
                    onClick={testRendezVousAPI}
                    disabled={isLoading}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    📅 Test API Rendez-vous
                </button>

                <button
                    onClick={testMessagesAPI}
                    disabled={isLoading}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    📨 Test API Messages
                </button>

                <button
                    onClick={testConversationsAPI}
                    disabled={isLoading}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    💬 Test API Conversations
                </button>

                <button
                    onClick={testAllAPIs}
                    disabled={isLoading}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    🚀 Test Complet
                </button>
            </div>

            {/* Boutons utilitaires */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={checkAPIEndpoints}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                    🔍 Vérifier Endpoints
                </button>

                <button
                    onClick={clearResults}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                    🗑️ Effacer Résultats
                </button>
            </div>

            {/* Résultats du diagnostic */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Résultats du Diagnostic</h3>
                
                {diagnosticResults.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucun diagnostic exécuté</p>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {diagnosticResults.map((result, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded border-l-4 ${
                                    result.type === 'success' ? 'border-green-500 bg-green-50' :
                                    result.type === 'error' ? 'border-red-500 bg-red-50' :
                                    result.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                                    'border-blue-500 bg-blue-50'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className={`text-sm ${
                                            result.type === 'success' ? 'text-green-800' :
                                            result.type === 'error' ? 'text-red-800' :
                                            result.type === 'warning' ? 'text-yellow-800' :
                                            'text-blue-800'
                                        }`}>
                                            {result.message}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500 ml-2">{result.timestamp}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-yellow-800">📋 Instructions de Diagnostic</h3>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                    <li>Configurez l'ID du médecin de test</li>
                    <li>Utilisez "Test Complet" pour diagnostiquer toutes les APIs</li>
                    <li>Vérifiez les erreurs dans la console du navigateur</li>
                    <li>Vérifiez que les endpoints côté serveur existent</li>
                    <li>Vérifiez les permissions et l'authentification</li>
                </ol>
            </div>

            {/* Informations sur le service */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-blue-800">ℹ️ Informations sur le Service</h3>
                <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>URL de base dmpApi:</strong> {dmpApi.default?.defaults?.baseURL || 'Non définie'}</p>
                    <p><strong>URL de base signalingService:</strong> {signalingService.default?.baseURL || 'Non définie'}</p>
                    <p><strong>Token JWT:</strong> {localStorage.getItem('jwt') ? '✅ Présent' : '❌ Absent'}</p>
                    <p><strong>Token générique:</strong> {localStorage.getItem('token') ? '✅ Présent' : '❌ Absent'}</p>
                </div>
            </div>
        </div>
    );
};

export default MedecinDashboardDiagnostic;
