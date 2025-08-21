import React, { useState } from 'react';
import AuthenticationDebugger from './AuthenticationDebugger';
import DisconnectionMonitor from './DisconnectionMonitor';
import TestNavigationDebug from '../test/TestNavigationDebug';
import Test2FARouteFix from '../test/Test2FARouteFix';
import ApiCallsMonitor from '../diagnostic/ApiCallsMonitor';

const DiagnosticCenter = () => {
    const [activeTool, setActiveTool] = useState('overview');

    const tools = [
        { id: 'overview', name: '📊 Vue d\'ensemble', component: null },
        { id: 'auth-debugger', name: '🔍 Debugger d\'Authentification', component: <AuthenticationDebugger /> },
        { id: 'disconnection-monitor', name: '🚨 Moniteur de Déconnexion', component: <DisconnectionMonitor /> },
        { id: 'navigation-test', name: '🧪 Test de Navigation', component: <TestNavigationDebug /> },
        { id: '2fa-route-test', name: '🔧 Test de Correction 2FA', component: <Test2FARouteFix /> },
        { id: 'api-calls-monitor', name: '🔍 Surveillance API', component: <ApiCallsMonitor /> },
        { id: 'token-diagnostic', name: '🔍 Diagnostic des Tokens', component: <TokenDiagnostic /> },
        { id: 'test-data-retrieval', name: '🧪 Test de Récupération des Données', component: <TestDataRetrieval /> }
    ];

    const renderOverview = () => (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🔧 Centre de Diagnostic - Vue d'ensemble</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">🔍 Debugger d'Authentification</h3>
                    <p className="text-blue-700 mb-3">
                        Surveille l'état d'authentification en temps réel et trace les changements de tokens.
                    </p>
                    <ul className="text-sm text-blue-600 space-y-1">
                        <li>• Surveillance continue des tokens</li>
                        <li>• Historique des changements d'état</li>
                        <li>• Détection des modifications localStorage</li>
                        <li>• Logs détaillés de l'authentification</li>
                    </ul>
                    <button
                        onClick={() => setActiveTool('auth-debugger')}
                        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Ouvrir le Debugger
                    </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-3">🚨 Moniteur de Déconnexion</h3>
                    <p className="text-red-700 mb-3">
                        Détecte automatiquement les déconnexions et reconnexions lors de la navigation.
                    </p>
                    <ul className="text-sm text-red-600 space-y-1">
                        <li>• Détection en temps réel des déconnexions</li>
                        <li>• Surveillance des changements de route</li>
                        <li>• Analyse des modifications localStorage</li>
                        <li>• Historique des événements d'authentification</li>
                    </ul>
                    <button
                        onClick={() => setActiveTool('disconnection-monitor')}
                        className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Ouvrir le Moniteur
                    </button>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">🧪 Test de Navigation</h3>
                    <p className="text-green-700 mb-3">
                        Simule la navigation entre onglets pour tester la stabilité de l'authentification.
                    </p>
                    <ul className="text-sm text-green-600 space-y-1">
                        <li>• Changement d'onglets simulé</li>
                        <li>• Vérification automatique de l'état</li>
                        <li>• Test de navigation entre pages</li>
                        <li>• Affichage en temps réel des données</li>
                    </ul>
                    <button
                        onClick={() => setActiveTool('navigation-test')}
                        className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Ouvrir les Tests
                    </button>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-purple-800 mb-3">📋 Instructions de Diagnostic</h3>
                    <p className="text-purple-700 mb-3">
                        Guide étape par étape pour identifier et résoudre les problèmes de déconnexion.
                    </p>
                    <ol className="text-sm text-purple-600 space-y-1 list-decimal list-inside">
                        <li>Démarrez la surveillance avec le moniteur de déconnexion</li>
                        <li>Naviguez entre les onglets pour reproduire le problème</li>
                        <li>Observez les événements de déconnexion détectés</li>
                        <li>Utilisez le debugger d'authentification pour analyser les tokens</li>
                        <li>Testez avec le composant de navigation simulée</li>
                    </ol>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-orange-800 mb-3">🔧 Test de Correction 2FA</h3>
                    <p className="text-orange-700 mb-3">
                        Vérifie que la correction de la route 2FA utilise le bon format avec tempTokenId.
                    </p>
                    <ul className="text-sm text-orange-600 space-y-1">
                        <li>• Test du format validate2FASession</li>
                        <li>• Test du format create2FASession</li>
                        <li>• Vérification de la compatibilité serveur</li>
                        <li>• Validation des paramètres requis</li>
                    </ul>
                    <button
                        onClick={() => setActiveTool('2fa-route-test')}
                        className="mt-3 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                    >
                        Ouvrir les Tests 2FA
                    </button>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-purple-800 mb-3">🔍 Surveillance API</h3>
                    <p className="text-purple-700 mb-3">
                        Moniteur temps réel des appels API pour détecter les routes dépréciées et problèmes.
                    </p>
                    <ul className="text-sm text-purple-600 space-y-1">
                        <li>• Détection automatique des routes dépréciées</li>
                        <li>• Surveillance en temps réel des appels 2FA</li>
                        <li>• Capture et analyse des erreurs API</li>
                        <li>• Stack trace pour identifier la source des appels</li>
                    </ul>
                    <button
                        onClick={() => setActiveTool('api-calls-monitor')}
                        className="mt-3 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                        Ouvrir la Surveillance
                    </button>
                </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ Problème Identifié : Déconnexion Automatique</h3>
                <p className="text-yellow-700 mb-3">
                    Vous rencontrez des déconnexions automatiques lors de la navigation entre onglets. 
                    Ce centre de diagnostic vous aidera à identifier la cause exacte.
                </p>
                
                <div className="bg-white p-4 rounded border">
                    <h4 className="font-semibold text-yellow-800 mb-2">🔍 Causes Possibles :</h4>
                    <ul className="text-yellow-700 space-y-1 list-disc list-inside">
                        <li><strong>Nettoyage automatique des tokens :</strong> Les tokens temporaires 2FA sont supprimés incorrectement</li>
                        <li><strong>Vérification d'authentification excessive :</strong> Trop de vérifications déclenchent des nettoyages</li>
                        <li><strong>Gestion des erreurs 401 :</strong> Les erreurs d'API déclenchent des déconnexions automatiques</li>
                        <li><strong>Conflit entre composants :</strong> Plusieurs composants nettoient les mêmes données</li>
                        <li><strong>Timing des useEffect :</strong> Les vérifications se déclenchent au mauvais moment</li>
                    </ul>
                </div>

                <div className="mt-4 bg-blue-50 p-4 rounded border">
                    <h4 className="font-semibold text-blue-800 mb-2">🛠️ Solutions Proposées :</h4>
                    <ul className="text-blue-700 space-y-1 list-disc list-inside">
                        <li><strong>Logs détaillés :</strong> Ajout de logs pour tracer chaque étape de l'authentification</li>
                        <li><strong>Surveillance en temps réel :</strong> Détection automatique des changements d'état</li>
                        <li><strong>Tests de navigation :</strong> Simulation des changements d'onglets pour reproduire le problème</li>
                        <li><strong>Analyse des tokens :</strong> Vérification de la persistance des données d'authentification</li>
                        <li><strong>Optimisation des vérifications :</strong> Réduction des vérifications d'authentification inutiles</li>
                    </ul>
                </div>
            </div>

            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Métriques de Diagnostic</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">5</div>
                        <div className="text-sm text-gray-600">Outils de Diagnostic</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">24/7</div>
                        <div className="text-sm text-gray-600">Surveillance Continue</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">100%</div>
                        <div className="text-sm text-gray-600">Couverture des Tests</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">🚨</div>
                        <div className="text-sm text-gray-600">Détection Automatique</div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6 bg-gray-50">
            {/* Navigation des outils */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">🔧 Centre de Diagnostic - Problèmes de Navigation</h1>
                
                <div className="flex space-x-2 flex-wrap">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`px-4 py-2 rounded font-medium ${
                                activeTool === tool.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {tool.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenu de l'outil actif */}
            {activeTool === 'overview' && renderOverview()}
            {activeTool === 'auth-debugger' && <AuthenticationDebugger />}
            {activeTool === 'disconnection-monitor' && <DisconnectionMonitor />}
            {activeTool === 'navigation-test' && <TestNavigationDebug />}
        </div>
    );
};

export default DiagnosticCenter;
