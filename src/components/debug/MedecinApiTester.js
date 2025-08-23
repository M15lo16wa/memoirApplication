import React, { useState } from 'react';
import medecinApi from '../../services/api/medecinApi';
import messagingService from '../../services/api/messagingApi';
import { FaSpinner, FaCheck, FaTimes, FaDatabase, FaComments, FaEnvelope } from 'react-icons/fa';

const MedecinApiTester = () => {
    const [testResults, setTestResults] = useState({});
    const [loading, setLoading] = useState(false);

    const runTest = async (testName, testFunction) => {
        setLoading(true);
        try {
            const result = await testFunction();
            setTestResults(prev => ({
                ...prev,
                [testName]: { success: true, data: result, error: null }
            }));
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                [testName]: { success: false, data: null, error: error.message }
            }));
        } finally {
            setLoading(false);
        }
    };

    const testDashboardStats = () => medecinApi.getDashboardStats();
    const testRecentMessages = () => medecinApi.getRecentMessages(3);
    const testPatients = () => medecinApi.getPatients('', 1, 5);
    const testAgenda = () => medecinApi.getAgenda(null, 1, 5);
    const testNotifications = () => medecinApi.getNotifications(1, 5);
    
    // Nouveaux tests pour la messagerie
    const testMessagingInitialization = async () => {
      const medecin = JSON.parse(localStorage.getItem('medecin') || '{}');
      if (!medecin.id && !medecin.id_professionnel) {
        throw new Error('Aucun médecin connecté');
      }
      const medecinId = medecin.id_professionnel || medecin.id;
      return await messagingService.initializeMessaging(medecinId);
    };
    
    const testRouteCompatibility = async () => {
      const medecin = JSON.parse(localStorage.getItem('medecin') || '{}');
      if (!medecin.id && !medecin.id_professionnel) {
        throw new Error('Aucun médecin connecté');
      }
      const medecinId = medecin.id_professionnel || medecin.id;
      // Utiliser une ordonnance de test
      return await messagingService.testRouteCompatibility(15);
    };
    
    const testSimulatedConversations = async () => {
      const medecin = JSON.parse(localStorage.getItem('medecin') || '{}');
      if (!medecin.id && !medecin.id_professionnel) {
        throw new Error('Aucun médecin connecté');
      }
      const medecinId = medecin.id_professionnel || medecin.id;
      return messagingService.getSimulatedConversations(medecinId);
    };

    const runAllTests = async () => {
        setLoading(true);
        const tests = [
            { name: 'Statistiques Dashboard', func: testDashboardStats },
            { name: 'Messages Récents', func: testRecentMessages },
            { name: 'Liste Patients', func: testPatients },
            { name: 'Agenda', func: testAgenda },
            { name: 'Notifications', func: testNotifications },
            { name: 'Initialisation Messagerie', func: testMessagingInitialization },
            { name: 'Compatibilité Routes', func: testRouteCompatibility },
            { name: 'Conversations Simulées', func: testSimulatedConversations }
        ];

        for (const test of tests) {
            await runTest(test.name, test.func);
        }
        setLoading(false);
    };

    const getTestIcon = (testName) => {
        const result = testResults[testName];
        if (!result) return <FaDatabase className="text-gray-400" />;
        return result.success ? 
            <FaCheck className="text-green-500" /> : 
            <FaTimes className="text-red-500" />;
    };

    const getTestStatus = (testName) => {
        const result = testResults[testName];
        if (!result) return 'Non testé';
        return result.success ? 'Succès' : 'Échec';
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    🧪 Test des API Médecin
                </h3>
                <button
                    onClick={runAllTests}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                    {loading ? <FaSpinner className="animate-spin mr-2" /> : '🧪'}
                    Tester Toutes les API
                </button>
            </div>

            <div className="space-y-4">
                {[
                    'Statistiques Dashboard',
                    'Messages Récents', 
                    'Liste Patients',
                    'Agenda',
                    'Notifications'
                ].map((testName) => (
                    <div key={testName} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                {getTestIcon(testName)}
                                <span className="font-medium">{testName}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className={`text-sm px-2 py-1 rounded ${
                                    getTestStatus(testName) === 'Succès' ? 'bg-green-100 text-green-800' :
                                    getTestStatus(testName) === 'Échec' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {getTestStatus(testName)}
                                </span>
                                <button
                                    onClick={() => {
                                        const testMap = {
                                            'Statistiques Dashboard': testDashboardStats,
                                            'Messages Récents': testRecentMessages,
                                            'Liste Patients': testPatients,
                                            'Agenda': testAgenda,
                                            'Notifications': testNotifications
                                        };
                                        runTest(testName, testMap[testName]);
                                    }}
                                    disabled={loading}
                                    className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                                >
                                    Tester
                                </button>
                            </div>
                        </div>
                        
                        {testResults[testName] && (
                            <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                                {testResults[testName].success ? (
                                    <div>
                                        <p className="text-green-700 font-medium">✅ Données reçues :</p>
                                        <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                                            {JSON.stringify(testResults[testName].data, null, 2)}
                                        </pre>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-red-700 font-medium">❌ Erreur :</p>
                                        <p className="text-red-600 text-xs mt-1">
                                            {testResults[testName].error}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📋 Instructions de test :</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Cliquez sur "Tester Toutes les API" pour vérifier toutes les fonctionnalités</li>
                    <li>• Ou testez individuellement chaque API avec le bouton "Tester"</li>
                    <li>• Vérifiez que les données sont bien reçues de l'API</li>
                    <li>• En cas d'erreur, vérifiez que le backend est démarré et accessible</li>
                </ul>
            </div>
        </div>
    );
};

export default MedecinApiTester;
