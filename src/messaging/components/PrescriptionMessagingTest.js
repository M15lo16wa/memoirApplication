import React, { useState } from 'react';
import { ChatMessage } from './index';

const PrescriptionMessagingTest = () => {
  const [showMessaging, setShowMessaging] = useState(false);
  const [testMedecinId, setTestMedecinId] = useState('79'); // ID du médecin de test
  const [testPatientId, setTestPatientId] = useState('7'); // ID du patient de test

  const handleTestMessaging = () => {
    console.log('🧪 Test de messagerie avec prescription');
    console.log('📋 Médecin ID:', testMedecinId);
    console.log('👤 Patient ID:', testPatientId);
    setShowMessaging(true);
  };

  const handleCloseMessaging = () => {
    setShowMessaging(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🧪 Test Messagerie avec Prescription</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">ℹ️ Scénario de Test</h3>
        <p className="text-sm text-blue-700 mb-2">
          Ce test simule le comportement d'un patient qui clique sur le bouton "message" 
          d'une prescription pour contacter le médecin prescripteur.
        </p>
        <p className="text-sm text-blue-700">
          <strong>Patient ID:</strong> {testPatientId} | <strong>Médecin ID:</strong> {testMedecinId}
        </p>
      </div>

      {/* Configuration de test */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
      </div>

      {/* Bouton de test */}
      <div className="text-center mb-6">
        <button
          onClick={handleTestMessaging}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg font-medium"
        >
          🧪 Tester la Messagerie avec Prescription
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2 text-yellow-800">📋 Instructions de Test</h3>
        <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Cliquez sur "Tester la Messagerie avec Prescription"</li>
          <li>L'interface de messagerie s'ouvrira avec le médecin ID pré-rempli</li>
          <li>Tapez un message dans le champ de saisie</li>
          <li>Appuyez sur Entrée ou cliquez sur "Envoyer au médecin"</li>
          <li>Vérifiez que le message s'affiche et qu'une conversation temporaire est créée</li>
          <li>Vérifiez les logs dans la console pour le debugging</li>
        </ol>
      </div>

      {/* Interface de messagerie de test */}
      {showMessaging && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="text-xl font-bold">🧪 Test Messagerie - Patient vers Médecin</h3>
              <button
                onClick={handleCloseMessaging}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Interface de messagerie */}
            <div className="flex-1 overflow-hidden">
              <ChatMessage
                userId={testPatientId}
                role="patient"
                token="test-token"
                conversationId={null}
                medecinId={testMedecinId}
              />
            </div>
          </div>
        </div>
      )}

      {/* Informations de debug */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">🔍 Informations de Debug</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>État actuel:</strong> {showMessaging ? 'Interface ouverte' : 'Interface fermée'}</p>
          <p><strong>Médecin ID configuré:</strong> {testMedecinId}</p>
          <p><strong>Patient ID configuré:</strong> {testPatientId}</p>
          <p><strong>Rôle simulé:</strong> Patient</p>
          <p><strong>Token:</strong> Test (simulé)</p>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionMessagingTest;
