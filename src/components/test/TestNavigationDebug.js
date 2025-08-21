import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    checkAuthenticationStatus, 
    isMedecinAuthenticated, 
    getUserType,
    isAuthenticated,
    getStoredMedecin
} from '../../services/api/authApi';

const TestNavigationDebug = () => {
    const [currentTab, setCurrentTab] = useState('debug');
    const [authStatus, setAuthStatus] = useState(null);
    const [userType, setUserType] = useState(null);
    const [isMedecin, setIsMedecin] = useState(null);
    const [isGeneralAuth, setIsGeneralAuth] = useState(null);
    const [medecinData, setMedecinData] = useState(null);
    const [localStorageState, setLocalStorageState] = useState({});
    const navigate = useNavigate();

    // Fonction pour capturer l'état localStorage
    const captureLocalStorageState = () => {
        const state = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                state[key] = {
                    value: value ? value.substring(0, 50) + '...' : 'null',
                    length: value ? value.length : 0,
                    timestamp: new Date().toISOString()
                };
            }
        }
        return state;
    };

    // Fonction pour vérifier l'état complet
    const checkCompleteState = () => {
        console.log('🧪 TestNavigationDebug - Vérification complète de l\'état...');
        
        try {
            // Vérifier l'état d'authentification
            const status = checkAuthenticationStatus();
            setAuthStatus(status);
            
            // Vérifier le type d'utilisateur
            const type = getUserType();
            setUserType(type);
            
            // Vérifier l'authentification médecin
            const medecin = isMedecinAuthenticated();
            setIsMedecin(medecin);
            
            // Vérifier l'authentification générale
            const general = isAuthenticated();
            setIsGeneralAuth(general);
            
            // Récupérer les données médecin
            const medecinData = getStoredMedecin();
            setMedecinData(medecinData);
            
            // Capturer l'état localStorage
            const localStorageState = captureLocalStorageState();
            setLocalStorageState(localStorageState);
            
            console.log('🧪 TestNavigationDebug - État complet vérifié:', {
                status,
                type,
                medecin,
                general,
                medecinData,
                localStorageState
            });
            
        } catch (error) {
            console.error('❌ TestNavigationDebug - Erreur lors de la vérification:', error);
        }
    };

    // Vérification automatique lors du changement d'onglet
    useEffect(() => {
        console.log('🔄 TestNavigationDebug - Changement d\'onglet détecté:', currentTab);
        checkCompleteState();
    }, [currentTab]);

    // Vérification initiale
    useEffect(() => {
        console.log('🚀 TestNavigationDebug - Composant monté, vérification initiale...');
        checkCompleteState();
    }, []);

    // Navigation vers différentes pages pour tester
    const navigateToPage = (page) => {
        console.log('🧪 TestNavigationDebug - Navigation vers:', page);
        navigate(page);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 bg-gray-50">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">🧪 Test de Navigation et Debug d'Authentification</h1>
                
                {/* Onglets de test */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">📑 Onglets de Test</h2>
                    <div className="flex space-x-2 flex-wrap">
                        {['debug', 'patients', 'dossiers', 'consultations', 'profile'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setCurrentTab(tab)}
                                className={`px-4 py-2 rounded font-medium ${
                                    currentTab === tab
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Contenu des onglets */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">📋 Contenu de l'Onglet: {currentTab}</h2>
                    <div className="bg-gray-100 p-4 rounded">
                        {currentTab === 'debug' && (
                            <div>
                                <p>🔍 Onglet de debug - Vérification de l'état d'authentification</p>
                                <p>📊 Utilisez les boutons ci-dessous pour tester la navigation</p>
                            </div>
                        )}
                        {currentTab === 'patients' && (
                            <div>
                                <p>👥 Onglet patients - Simulation de la liste des patients</p>
                                <p>🔍 Vérification automatique de l'authentification lors du changement</p>
                            </div>
                        )}
                        {currentTab === 'dossiers' && (
                            <div>
                                <p>📁 Onglet dossiers - Simulation des dossiers patients</p>
                                <p>🔍 Vérification automatique de l'authentification lors du changement</p>
                            </div>
                        )}
                        {currentTab === 'consultations' && (
                            <div>
                                <p>🏥 Onglet consultations - Simulation des consultations</p>
                                <p>🔍 Vérification automatique de l'authentification lors du changement</p>
                            </div>
                        )}
                        {currentTab === 'profile' && (
                            <div>
                                <p>👤 Onglet profile - Simulation du profil médecin</p>
                                <p>🔍 Vérification automatique de l'authentification lors du changement</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contrôles de test */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">🎮 Contrôles de Test</h2>
                    <div className="flex space-x-4 flex-wrap">
                        <button
                            onClick={checkCompleteState}
                            className="px-4 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600"
                        >
                            🔍 Vérification Manuelle
                        </button>
                        
                        <button
                            onClick={() => navigateToPage('/medecin')}
                            className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600"
                        >
                            🏥 Page Médecin
                        </button>
                        
                        <button
                            onClick={() => navigateToPage('/dossier-patient')}
                            className="px-4 py-2 bg-purple-500 text-white rounded font-medium hover:bg-purple-600"
                        >
                            📁 Dossier Patient
                        </button>
                        
                        <button
                            onClick={() => navigateToPage('/connexion')}
                            className="px-4 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600"
                        >
                            🔐 Page Connexion
                        </button>
                    </div>
                </div>

                {/* État d'authentification */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h2 className="text-lg font-semibold text-blue-800 mb-3">🔑 État d'Authentification</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-blue-700">Type d'utilisateur:</p>
                            <p className="text-lg font-bold text-blue-900">{userType || 'Chargement...'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-700">Médecin authentifié:</p>
                            <p className={`text-lg font-bold ${isMedecin ? 'text-green-900' : 'text-red-900'}`}>
                                {isMedecin ? '✅ Oui' : '❌ Non'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-700">Authentification générale:</p>
                            <p className={`text-lg font-bold ${isGeneralAuth ? 'text-green-900' : 'text-red-900'}`}>
                                {isGeneralAuth ? '✅ Oui' : '❌ Non'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-700">Onglet actuel:</p>
                            <p className="text-lg font-bold text-blue-900">{currentTab}</p>
                        </div>
                    </div>
                    
                    {/* Détails du statut */}
                    {authStatus && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm font-medium text-blue-700">JWT Token:</p>
                                <p className="text-sm text-blue-900">{authStatus.jwtToken}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-700">Token Général:</p>
                                <p className="text-sm text-blue-900">{authStatus.generalToken}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-700">Token Valide:</p>
                                <p className={`text-sm font-bold ${authStatus.hasValidToken ? 'text-green-900' : 'text-red-900'}`}>
                                    {authStatus.hasValidToken ? '✅ Oui' : '❌ Non'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Données médecin */}
                {medecinData && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <h2 className="text-lg font-semibold text-green-800 mb-3">👨‍⚕️ Données Médecin</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-green-700">ID:</p>
                                <p className="text-lg font-bold text-green-900">{medecinData.id_professionnel || medecinData.id || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-700">Nom:</p>
                                <p className="text-lg font-bold text-green-900">{medecinData.nom || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-700">Prénom:</p>
                                <p className="text-lg font-bold text-green-900">{medecinData.prenom || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-700">Rôle:</p>
                                <p className="text-lg font-bold text-green-900">{medecinData.role || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* État localStorage */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-purple-800 mb-3">💾 État localStorage ({Object.keys(localStorageState).length} clés)</h2>
                    
                    {Object.keys(localStorageState).length === 0 ? (
                        <p className="text-purple-700">Aucune clé localStorage trouvée.</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {Object.entries(localStorageState).map(([key, value]) => (
                                <div key={key} className="bg-white p-2 rounded border text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-purple-700">{key}:</span>
                                        <span className="text-xs text-gray-500">{value.timestamp}</span>
                                    </div>
                                    <div className="text-gray-600">
                                        {value.value} ({value.length} chars)
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">📋 Instructions de Test</h3>
                    <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                        <li>Changez d'onglet pour voir la vérification automatique de l'authentification</li>
                        <li>Utilisez les boutons de navigation pour tester différentes pages</li>
                        <li>Observez les logs dans la console pour identifier les problèmes</li>
                        <li>Vérifiez que l'état d'authentification reste stable</li>
                        <li>Utilisez la vérification manuelle pour tester à tout moment</li>
                    </ol>
                    <p className="mt-3 text-sm text-yellow-600">
                        <strong>Note:</strong> Ce composant vous aide à identifier pourquoi vous êtes déconnecté lors de la navigation entre onglets.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TestNavigationDebug;
