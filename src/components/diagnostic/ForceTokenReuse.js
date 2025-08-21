import React, { useState } from 'react';
import { getValidAuthToken } from '../../services/api/authApi';

const ForceTokenReuse = () => {
    const [diagnosticResults, setDiagnosticResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setDiagnosticResults(prev => [...prev, { timestamp, message, type }]);
    };

    const analyzeCurrentState = () => {
        addLog('🔍 Analyse de l\'état actuel des tokens...', 'info');
        
        // Analyser tous les tokens disponibles
        const jwt = localStorage.getItem('jwt');
        const token = localStorage.getItem('token');
        const firstConnectionToken = localStorage.getItem('firstConnectionToken');
        const originalToken = localStorage.getItem('originalToken');
        const tempTokenId = localStorage.getItem('tempTokenId');
        const medecin = localStorage.getItem('medecin');
        
        addLog('📊 État actuel du localStorage:', 'info');
        addLog(`   - jwt: ${jwt ? `${jwt.substring(0, 30)}...` : 'Absent'}`, 'info');
        addLog(`   - token: ${token ? `${token.substring(0, 30)}...` : 'Absent'}`, 'info');
        addLog(`   - firstConnectionToken: ${firstConnectionToken ? `${firstConnectionToken.substring(0, 30)}...` : 'Absent'}`, 'info');
        addLog(`   - originalToken: ${originalToken ? `${originalToken.substring(0, 30)}...` : 'Absent'}`, 'info');
        addLog(`   - tempTokenId: ${tempTokenId ? `${tempTokenId.substring(0, 30)}...` : 'Absent'}`, 'info');
        addLog(`   - medecin: ${medecin ? 'Présent' : 'Absent'}`, 'info');
        
        // Analyser le token actuel utilisé
        const currentToken = getValidAuthToken();
        addLog(`🔑 Token actuellement utilisé: ${currentToken ? `${currentToken.substring(0, 30)}...` : 'Aucun'}`, 'info');
        
        if (currentToken) {
            addLog(`📏 Longueur: ${currentToken.length} caractères`, 'info');
            addLog(`🔐 Format: ${currentToken.startsWith('eyJ') ? 'JWT standard' : 'Non-JWT'}`, 'info');
            addLog(`🚫 Type: ${currentToken.startsWith('temp_') ? 'Temporaire' : currentToken.startsWith('auth_') ? 'Auth temporaire' : 'Permanent'}`, 'info');
        }
        
        return { jwt, token, firstConnectionToken, originalToken, tempTokenId, currentToken };
    };

    const forceTokenReuse = () => {
        addLog('🔧 Tentative de forçage de la réutilisation du firstConnectionToken...', 'info');
        
        const { firstConnectionToken, originalToken, currentToken } = analyzeCurrentState();
        
        if (!firstConnectionToken && !originalToken) {
            addLog('❌ Aucun token de première connexion disponible', 'error');
            addLog('💡 Solution: Reconnectez-vous pour générer un nouveau token', 'info');
            return false;
        }
        
        // Priorité au firstConnectionToken, puis originalToken
        const tokenToUse = firstConnectionToken || originalToken;
        
        if (tokenToUse.startsWith('temp_') || tokenToUse.startsWith('auth_')) {
            addLog('⚠️ Le token disponible est temporaire, pas idéal', 'warning');
        }
        
        // Forcer l'utilisation du bon token
        if (tokenToUse.startsWith('eyJ')) {
            // C'est un JWT, le stocker dans jwt
            localStorage.setItem('jwt', tokenToUse);
            addLog(`✅ JWT stocké dans 'jwt': ${tokenToUse.substring(0, 30)}...`, 'success');
        } else {
            // C'est un token général, le stocker dans token
            localStorage.setItem('token', tokenToUse);
            addLog(`✅ Token stocké dans 'token': ${tokenToUse.substring(0, 30)}...`, 'success');
        }
        
        // Nettoyer les tokens temporaires
        if (localStorage.getItem('tempTokenId')) {
            localStorage.removeItem('tempTokenId');
            addLog('🧹 tempTokenId supprimé', 'info');
        }
        
        // Vérifier le résultat
        const newToken = getValidAuthToken();
        if (newToken === tokenToUse) {
            addLog('✅ Token correctement appliqué!', 'success');
            return true;
        } else {
            addLog('❌ Échec de l\'application du token', 'error');
            return false;
        }
    };

    const clearAllTokens = () => {
        addLog('🗑️ Nettoyage complet de tous les tokens...', 'warning');
        
        localStorage.removeItem('jwt');
        localStorage.removeItem('token');
        localStorage.removeItem('firstConnectionToken');
        localStorage.removeItem('originalToken');
        localStorage.removeItem('tempTokenId');
        localStorage.removeItem('medecin');
        localStorage.removeItem('patient');
        
        addLog('✅ Tous les tokens supprimés', 'success');
        addLog('💡 Reconnectez-vous pour générer de nouveaux tokens', 'info');
    };

    const restoreFromMedecinData = () => {
        addLog('🔍 Tentative de restauration depuis les données médecin...', 'info');
        
        const medecinData = localStorage.getItem('medecin');
        if (!medecinData) {
            addLog('❌ Aucune donnée médecin disponible', 'error');
            return false;
        }
        
        try {
            const parsedMedecin = JSON.parse(medecinData);
            addLog('📋 Données médecin parsées:', 'info');
            addLog(`   - Clés disponibles: ${Object.keys(parsedMedecin).join(', ')}`, 'info');
            
            if (parsedMedecin.originalToken) {
                localStorage.setItem('token', parsedMedecin.originalToken);
                addLog(`✅ Token original restauré: ${parsedMedecin.originalToken.substring(0, 30)}...`, 'success');
                return true;
            }
            
            if (parsedMedecin.originalJWT) {
                localStorage.setItem('jwt', parsedMedecin.originalJWT);
                addLog(`✅ JWT original restauré: ${parsedMedecin.originalJWT.substring(0, 30)}...`, 'success');
                return true;
            }
            
            addLog('❌ Aucun token original trouvé dans les données médecin', 'error');
            return false;
            
        } catch (error) {
            addLog(`❌ Erreur lors du parsing des données médecin: ${error.message}`, 'error');
            return false;
        }
    };

    const runFullDiagnostic = () => {
        setDiagnosticResults([]);
        addLog('🚀 Démarrage du diagnostic complet...', 'info');
        
        // Étape 1: Analyse de l'état actuel
        const state = analyzeCurrentState();
        
        // Étape 2: Tentative de restauration depuis les données médecin
        if (restoreFromMedecinData()) {
            addLog('✅ Restauration réussie depuis les données médecin', 'success');
        } else {
            addLog('⚠️ Restauration depuis les données médecin échouée', 'warning');
        }
        
        // Étape 3: Forçage de la réutilisation
        if (forceTokenReuse()) {
            addLog('✅ Réutilisation du token forcée avec succès', 'success');
        } else {
            addLog('❌ Échec de la réutilisation du token', 'error');
        }
        
        // Étape 4: Vérification finale
        const finalToken = getValidAuthToken();
        addLog('🔍 Vérification finale:', 'info');
        addLog(`   - Token final: ${finalToken ? `${finalToken.substring(0, 30)}...` : 'Aucun'}`, 'info');
        
        if (finalToken && !finalToken.startsWith('temp_') && !finalToken.startsWith('auth_')) {
            addLog('🎉 SUCCÈS: Token valide restauré!', 'success');
        } else {
            addLog('💡 RECOMMANDATION: Reconnectez-vous pour résoudre le problème', 'info');
        }
    };

    const clearLogs = () => {
        setDiagnosticResults([]);
    };

    const exportLogs = () => {
        const logsText = diagnosticResults
            .map(log => `[${log.timestamp}] ${log.message}`)
            .join('\n');
        
        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `force-token-reuse-${new Date().toISOString().slice(0, 19)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                🔧 Force Token Reuse - Diagnostic Avancé
            </h2>
            
            <div className="mb-6 space-y-3">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={runFullDiagnostic}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? '⏳ Diagnostic en cours...' : '🚀 Diagnostic Complet'}
                    </button>
                    
                    <button
                        onClick={analyzeCurrentState}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        🔍 Analyser l'État
                    </button>
                    
                    <button
                        onClick={forceTokenReuse}
                        disabled={isLoading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                        🔧 Forcer Réutilisation
                    </button>
                    
                    <button
                        onClick={restoreFromMedecinData}
                        disabled={isLoading}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                        📋 Restaurer depuis Médecin
                    </button>
                </div>
                
                <div className="flex gap-3">
                    <button
                        onClick={clearAllTokens}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        🗑️ Nettoyer Tout
                    </button>
                    
                    <button
                        onClick={clearLogs}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        🗑️ Effacer Logs
                    </button>
                    
                    <button
                        onClick={exportLogs}
                        disabled={diagnosticResults.length === 0}
                        className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
                    >
                        📥 Exporter Logs
                    </button>
                </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 mb-3">📋 Logs du Diagnostic</h3>
                
                {diagnosticResults.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        Aucun diagnostic effectué. Cliquez sur "Diagnostic Complet" pour commencer.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {diagnosticResults.map((log, index) => (
                            <div
                                key={index}
                                className={`p-2 rounded text-sm font-mono ${
                                    log.type === 'error' ? 'bg-red-100 text-red-800' :
                                    log.type === 'success' ? 'bg-green-100 text-green-800' :
                                    log.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
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

export default ForceTokenReuse;
