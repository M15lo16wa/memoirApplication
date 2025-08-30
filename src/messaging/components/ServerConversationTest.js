import React, { useState } from 'react';
import signalingService from '../../services/signalingService';

const ServerConversationTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testMedecinId, setTestMedecinId] = useState('79');
  const [testPatientId, setTestPatientId] = useState('7');

  const addTestResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
  };

  const testCreateConversation = async () => {
    try {
      setIsLoading(true);
      addTestResult('🔍 Test de création de conversation côté serveur...', 'info');
      
      console.log('🧪 Test avec:', { patientId: testPatientId, medecinId: testMedecinId });
      
      const result = await signalingService.createConversation(
        testPatientId,  // ID du patient (premier paramètre)
        testMedecinId,  // ID du médecin (deuxième paramètre)
        'patient_medecin'
      );
      
      addTestResult(`📨 Réponse création: ${JSON.stringify(result, null, 2)}`, result.success ? 'success' : 'error');
      
      if (result.success) {
        addTestResult(`✅ Conversation créée avec ID: ${result.conversation?.id}`, 'success');
        addTestResult(`📝 Type: ${result.conversation?.type_conversation}`, 'info');
        addTestResult(`👤 Patient ID: ${result.conversation?.patient_id}`, 'info');
        addTestResult(`👨‍⚕️ Médecin ID: ${result.conversation?.medecin_id}`, 'info');
        
        // Tester l'envoi de message dans cette conversation
        if (result.conversation?.id) {
          addTestResult('🔄 Test d\'envoi de message dans la nouvelle conversation...', 'info');
          await testSendMessage(result.conversation.id);
        }
      } else {
        addTestResult(`❌ Erreur création: ${result.error}`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ Exception création: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testSendMessage = async (conversationId) => {
    try {
      addTestResult(`📤 Test d'envoi de message dans la conversation ${conversationId}...`, 'info');
      
      const result = await signalingService.sendMessage(
        conversationId,
        'Test de message depuis le composant de test',
        'texte'
      );
      
      addTestResult(`📨 Réponse envoi: ${JSON.stringify(result, null, 2)}`, result.success ? 'success' : 'error');
      
      if (result.success) {
        addTestResult(`✅ Message envoyé avec succès dans la conversation ${conversationId}`, 'success');
      } else {
        addTestResult(`❌ Erreur envoi: ${result.error}`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ Exception envoi: ${error.message}`, 'error');
    }
  };

  const testGetUserConversations = async () => {
    try {
      setIsLoading(true);
      addTestResult('🔍 Test de récupération des conversations...', 'info');
      
      const result = await signalingService.getUserConversations();
      addTestResult(`📨 Réponse conversations: ${JSON.stringify(result, null, 2)}`, result.success ? 'success' : 'error');
      
      if (result.success) {
        addTestResult(`✅ Conversations trouvées: ${result.conversations?.length || 0}`, 'success');
        if (result.conversations && result.conversations.length > 0) {
          result.conversations.forEach((conv, index) => {
            addTestResult(`📝 Conversation ${index + 1}: ID=${conv.id}, Type=${conv.type_conversation}`, 'info');
          });
        }
      } else {
        addTestResult(`❌ Erreur: ${result.error}`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ Exception: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🧪 Test Création Conversation Côté Serveur</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">ℹ️ Objectif du Test</h3>
        <p className="text-sm text-blue-700">
          Ce test vérifie que les conversations sont créées côté serveur avec des IDs numériques valides,
          évitant ainsi le problème des IDs temporaires comme "temp_1756472687576".
        </p>
      </div>

      {/* Configuration de test */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID du Patient de Test
          </label>
          <input
            type="text"
            value={testPatientId}
            onChange={(e) => setTestPatientId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            placeholder="ID du patient"
          />
        </div>
        <div>
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
      </div>

      {/* Boutons de test */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={testCreateConversation}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? '⏳' : '➕'} Tester Création Conversation
        </button>
        
        <button
          onClick={testGetUserConversations}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? '⏳' : '🔍'} Tester Récupération Conversations
        </button>
        
        <button
          onClick={clearResults}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          🗑️ Effacer Résultats
        </button>
      </div>

      {/* Résultats des tests */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Résultats des Tests</h3>
        
        {testResults.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun test exécuté</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  result.type === 'success' ? 'border-green-500 bg-green-50' :
                  result.type === 'error' ? 'border-red-500 bg-red-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm ${
                      result.type === 'success' ? 'text-green-800' :
                      result.type === 'error' ? 'text-red-800' :
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

      {/* Informations sur le service */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">ℹ️ Informations sur le Service</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>URL de base:</strong> {signalingService.baseURL}</p>
          <p><strong>Token primaire:</strong> {signalingService.tokens?.primaryToken ? '✅ Présent' : '❌ Absent'}</p>
          <p><strong>Token secondaire:</strong> {signalingService.tokens?.secondaryToken ? '✅ Présent' : '❌ Absent'}</p>
          <p><strong>Socket connecté:</strong> {signalingService.socket?.connected ? '✅ Oui' : '❌ Non'}</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-yellow-800">📋 Instructions de Test</h3>
        <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Configurez les IDs de patient et médecin</li>
          <li>Cliquez sur "Tester Création Conversation"</li>
          <li>Vérifiez que l'ID retourné est numérique (pas "temp_...")</li>
          <li>Vérifiez que le message de test s'envoie correctement</li>
          <li>Utilisez "Tester Récupération Conversations" pour vérifier la persistance</li>
        </ol>
      </div>
    </div>
  );
};

export default ServerConversationTest;
