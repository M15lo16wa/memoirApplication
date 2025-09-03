import React, { useState, useEffect } from 'react';
import { signalingService } from '../index';

const MessagingTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
  };

  const testGetUserConversations = async () => {
    try {
      setIsLoading(true);
      addTestResult('🔍 Test de récupération des conversations...', 'info');
      
      const result = await signalingService.getUserConversations();
      addTestResult(`📨 Réponse: ${JSON.stringify(result, null, 2)}`, result.success ? 'success' : 'error');
      
      if (result.success) {
        addTestResult(`✅ Conversations trouvées: ${result.conversations?.length || 0}`, 'success');
        if (result.conversations && result.conversations.length > 0) {
          result.conversations.forEach((conv, index) => {
            addTestResult(`📝 Conversation ${index + 1}: ID=${conv.id}, Type=${conv.type_conversation}, Titre=${conv.titre}`, 'info');
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

  const testCreateConversation = async () => {
    try {
      setIsLoading(true);
      addTestResult('🔍 Test de création de conversation...', 'info');
      
      // Test avec des IDs fictifs pour vérifier la structure de l'API
      const result = await signalingService.createConversation(999, 888, 'patient_medecin', 'Test Conversation');
      addTestResult(`📨 Réponse création: ${JSON.stringify(result, null, 2)}`, result.success ? 'success' : 'error');
      
      if (result.success) {
        addTestResult(`✅ Conversation créée avec ID: ${result.conversation?.id}`, 'success');
      } else {
        addTestResult(`❌ Erreur création: ${result.error}`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ Exception création: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🧪 Test de la Messagerie</h2>
      
      {/* Boutons de test */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={testGetUserConversations}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? '⏳' : '🔍'} Tester Récupération Conversations
        </button>
        
        <button
          onClick={testCreateConversation}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? '⏳' : '➕'} Tester Création Conversation
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
    </div>
  );
};

export default MessagingTest;
