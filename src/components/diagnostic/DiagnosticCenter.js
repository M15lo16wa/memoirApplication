import React, { useState } from 'react';
import SimpleDataTest from './SimpleDataTest';

const DiagnosticCenter = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: '📊 Vue d\'ensemble', component: OverviewTab },
        { id: 'tokens', label: '🔑 État des Tokens', component: TokensTab },
        { id: 'test', label: '🧪 Test Simple', component: SimpleDataTest }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || OverviewTab;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    🏥 Centre de Diagnostic - Application Mémoire
                </h1>
                <p className="text-gray-600">
                    Diagnostic des problèmes d'authentification et de récupération de données.
                </p>
            </div>

            {/* Navigation par onglets */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Contenu de l'onglet actif */}
            <div className="bg-white rounded-lg shadow">
                <ActiveComponent />
            </div>
        </div>
    );
};

// Composant Vue d'ensemble
const OverviewTab = () => {
    return (
        <div className="p-6 space-y-6">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    🔍 Problème Identifié
                </h2>
                <p className="text-gray-600 mb-4">
                    Après validation 2FA, le système utilise un token temporaire au lieu du token de première connexion, causant des erreurs 401.
                </p>
                <div className="text-sm text-gray-500">
                    <strong>Symptômes :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Erreurs 401 "Token invalide" sur toutes les requêtes API</li>
                        <li>Tableaux vides (patients, dossiers, consultations)</li>
                        <li>Token temporaire `auth_1755656457605_iuktbqvhw` au lieu d'un JWT valide</li>
                        <li>Le `firstConnectionToken` n'est pas réutilisé</li>
                    </ul>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-lg shadow-lg border-l-4 border-red-500">
                    <h3 className="text-lg font-semibold text-red-900 mb-3">🚨 Problème Actuel</h3>
                    <p className="text-gray-600 mb-3">
                        Le token stocké après 2FA est un token temporaire généré par le frontend, pas le token original de la première connexion.
                    </p>
                    <div className="text-sm text-gray-500">
                        <strong>Token actuel :</strong> <code className="bg-gray-100 px-2 py-1 rounded">auth_1755656457605_iuktbqvhw</code>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow-lg border-l-4 border-green-500">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">✅ Solution Prévue</h3>
                    <p className="text-gray-600 mb-3">
                        Réutiliser le `firstConnectionToken` stocké lors de la première connexion au lieu de générer un nouveau token.
                    </p>
                    <div className="text-sm text-gray-500">
                        <strong>Approche :</strong> Modification de la logique de réutilisation des tokens après validation 2FA.
                    </div>
                </div>
            </div>

            <div className="p-6 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ Actions Requises</h3>
                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                    <li><strong>Vérifier le stockage :</strong> S'assurer que le `firstConnectionToken` est bien stocké lors de la première connexion</li>
                    <li><strong>Modifier la logique 2FA :</strong> Forcer la réutilisation du `firstConnectionToken` après validation 2FA</li>
                    <li><strong>Nettoyer les tokens temporaires :</strong> Supprimer les tokens générés par le frontend</li>
                    <li><strong>Tester la récupération :</strong> Vérifier que les données (patients, dossiers) se chargent correctement</li>
                </ol>
            </div>
        </div>
    );
};

// Composant État des Tokens
const TokensTab = () => {
    const [tokenInfo, setTokenInfo] = useState(null);

    const analyzeTokens = () => {
        const tokens = {
            jwt: localStorage.getItem('jwt'),
            token: localStorage.getItem('token'),
            firstConnectionToken: localStorage.getItem('firstConnectionToken'),
            originalToken: localStorage.getItem('originalToken'),
            tempTokenId: localStorage.getItem('tempTokenId'),
            medecin: localStorage.getItem('medecin'),
            patient: localStorage.getItem('patient')
        };

        setTokenInfo(tokens);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">🔑 État des Tokens</h2>
                <button
                    onClick={analyzeTokens}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    🔍 Analyser les Tokens
                </button>
            </div>

            {tokenInfo && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-2">JWT</h3>
                            <div className="text-sm">
                                {tokenInfo.jwt ? (
                                    <div>
                                        <div className="text-green-600">✅ Présent</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {tokenInfo.jwt.substring(0, 30)}...
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Longueur: {tokenInfo.jwt.length} caractères
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-red-600">❌ Absent</div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-2">Token Général</h3>
                            <div className="text-sm">
                                {tokenInfo.token ? (
                                    <div>
                                        <div className="text-green-600">✅ Présent</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {tokenInfo.token.substring(0, 30)}...
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Longueur: {tokenInfo.token.length} caractères
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Type: {tokenInfo.token.startsWith('eyJ') ? 'JWT' : 'Non-JWT'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-red-600">❌ Absent</div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-2">FirstConnectionToken</h3>
                            <div className="text-sm">
                                {tokenInfo.firstConnectionToken ? (
                                    <div>
                                        <div className="text-green-600">✅ Présent</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {tokenInfo.firstConnectionToken.substring(0, 30)}...
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Longueur: {tokenInfo.firstConnectionToken.length} caractères
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Type: {tokenInfo.firstConnectionToken.startsWith('eyJ') ? 'JWT' : 'Non-JWT'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-red-600">❌ Absent</div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-2">OriginalToken</h3>
                            <div className="text-sm">
                                {tokenInfo.originalToken ? (
                                    <div>
                                        <div className="text-green-600">✅ Présent</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {tokenInfo.originalToken.substring(0, 30)}...
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Longueur: {tokenInfo.originalToken.length} caractères
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-red-600">❌ Absent</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">📊 Résumé</h3>
                        <div className="text-sm text-blue-800">
                            <div><strong>Problème identifié :</strong> Le token actuel n'est pas un JWT valide</div>
                            <div><strong>Solution :</strong> Réutiliser le firstConnectionToken ou originalToken</div>
                            <div><strong>Action :</strong> Modifier la logique de réutilisation après validation 2FA</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiagnosticCenter;
