// src/components/debug/ApiDirectTester.js

import React, { useState } from 'react';
import { FaDatabase, FaBug, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

const API_DIRECT_TESTER = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rawConversations, setRawConversations] = useState([]);

  const testApiDirectly = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      const medecin = JSON.parse(localStorage.getItem('medecin') || '{}');
      if (!medecin.id && !medecin.id_professionnel) {
        setTestResults([{ status: "error", message: "Aucun médecin connecté" }]);
        return;
      }

      const results = [];
      results.push({ status: "info", message: "🔍 Test direct de l'API..." });

      // Récupérer le token JWT
      const token = [
        localStorage.getItem('originalJWT'),
        localStorage.getItem('firstConnectionToken'),
        localStorage.getItem('jwt'),
        localStorage.getItem('token'),
      ].find(t => t && t.startsWith('eyJ'));

      if (!token) {
        results.push({ status: "error", message: "❌ Aucun token JWT valide trouvé" });
        setTestResults(results);
        return;
      }

      results.push({ status: "success", message: "✅ Token JWT trouvé" });

      // Test 1: Récupérer les conversations brutes depuis l'API
      try {
        const response = await axios.get(
          `http://localhost:3000/api/messaging/medecin/${medecin.id_professionnel || medecin.id}/conversations`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.status === 'success') {
          const rawConvs = response.data.data.conversations;
          setRawConversations(rawConvs);
          results.push({ 
            status: "success", 
            message: `✅ API conversations: ${rawConvs.length} conversation(s) récupérée(s)` 
          });

          // Analyser la structure brute
          if (rawConvs.length > 0) {
            const firstConv = rawConvs[0];
            results.push({ 
              status: "info", 
              message: `📋 Structure de la première conversation:` 
            });
            results.push({ 
              status: "info", 
              message: `   - Champs disponibles: ${Object.keys(firstConv).join(', ')}` 
            });
            
            // Identifier les champs d'ID
            const idFields = Object.keys(firstConv).filter(key => 
              key.toLowerCase().includes('id') || key.toLowerCase().includes('conversation')
            );
            results.push({ 
              status: "info", 
              message: `   - Champs d'ID: ${idFields.join(', ')}` 
            });

            // Tester chaque champ d'ID
            for (const field of idFields.slice(0, 3)) { // Tester les 3 premiers
              const fieldValue = firstConv[field];
              if (fieldValue) {
                try {
                  const msgResponse = await axios.get(
                    `http://localhost:3000/api/messaging/conversation/${fieldValue}/messages`,
                    {
                      headers: { Authorization: `Bearer ${token}` }
                    }
                  );

                  if (msgResponse.data.status === 'success') {
                    results.push({ 
                      status: "success", 
                      message: `🎯 Champ ${field}=${fieldValue}: SUCCÈS - ${msgResponse.data.data.messages?.length || 0} message(s)` 
                    });
                  } else {
                    results.push({ 
                      status: "warning", 
                      message: `⚠️ Champ ${field}=${fieldValue}: Réponse invalide` 
                    });
                  }
                } catch (error) {
                  results.push({ 
                    status: "error", 
                    message: `❌ Champ ${field}=${fieldValue}: ${error.response?.data?.message || error.message}` 
                  });
                }
              }
            }
          }
        } else {
          results.push({ 
            status: "error", 
            message: `❌ API conversations: Réponse invalide - ${response.data.message || 'Status non success'}` 
          });
        }
      } catch (error) {
        results.push({ 
          status: "error", 
          message: `❌ API conversations: ${error.response?.data?.message || error.message}` 
        });
      }

      setTestResults(results);
      
    } catch (error) {
      setTestResults([{ status: "error", message: `Erreur générale: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border z-40 max-w-2xl max-h-96 overflow-y-auto">
      <div className="flex items-center space-x-3 mb-3">
        <FaDatabase className="text-indigo-600" />
        <h3 className="font-semibold text-sm">Test Direct de l'API</h3>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={testApiDirectly}
          disabled={loading}
          className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Test en cours...' : 'Tester l\'API directement'}
        </button>
        
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Résultats :</h4>
            {testResults.map((result, index) => (
              <div key={index} className={`p-2 rounded border text-xs ${getStatusColor(result.status)}`}>
                <div className="flex items-center space-x-2">
                  <span>{getStatusIcon(result.status)}</span>
                  <span className="opacity-75">{result.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Données brutes de l'API */}
        {rawConversations.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium">Données brutes de l'API</summary>
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono overflow-x-auto">
              <pre>{JSON.stringify(rawConversations.slice(0, 2), null, 2)}</pre>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default API_DIRECT_TESTER;
