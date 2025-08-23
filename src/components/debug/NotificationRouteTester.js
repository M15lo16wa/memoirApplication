import React, { useState } from 'react';
import medecinApi from '../../services/api/medecinApi';
import { FaSpinner, FaCheck, FaTimes, FaBell, FaInfoCircle } from 'react-icons/fa';

const NotificationRouteTester = () => {
    const [testResults, setTestResults] = useState({});
    const [loading, setLoading] = useState(false);
    const [sessionInfo, setSessionInfo] = useState(null);

    const getSessionInfo = () => {
        const sessionId = medecinApi.getMedecinSessionId();
        setSessionInfo({
            sessionId,
            localStorage: localStorage.getItem('medecin'),
            parsed: localStorage.getItem('medecin') ? JSON.parse(localStorage.getItem('medecin')) : null
        });
        return sessionId;
    };

    const testNotificationRoute = async () => {
        setLoading(true);
        try {
            const sessionId = getSessionInfo();
            console.log('🧪 Test de la route des notifications avec session ID:', sessionId);
            
            const result = await medecinApi.getNotifications(1, 5);
            
            setTestResults(prev => ({
                ...prev,
                notifications: { 
                    success: true, 
                    data: result, 
                    error: null,
                    sessionId,
                    url: `/prescription/notifications?professionnel_id=${sessionId}&page=1&limit=5`
                }
            }));
            
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                notifications: { 
                    success: false, 
                    data: null, 
                    error: error.message,
                    sessionId: getSessionInfo(),
                    url: `/prescription/notifications?professionnel_id=${getSessionInfo()}&page=1&limit=5`
                }
            }));
        } finally {
            setLoading(false);
        }
    };

    const testMarkAsRead = async () => {
        if (!testResults.notifications?.data?.data?.notifications?.[0]?.id_notification) {
            alert('Aucune notification disponible pour tester le marquage comme lu');
            return;
        }

        setLoading(true);
        try {
            const notificationId = testResults.notifications.data.data.notifications[0].id_notification;
            const sessionId = getSessionInfo();
            
            console.log('🧪 Test du marquage comme lu pour la notification:', notificationId);
            
            const result = await medecinApi.markNotificationAsRead(notificationId);
            
            setTestResults(prev => ({
                ...prev,
                markAsRead: { 
                    success: true, 
                    data: result, 
                    error: null,
                    notificationId,
                    sessionId,
                    url: `/prescription/notifications/${notificationId}/read`
                }
            }));
            
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                markAsRead: { 
                    success: false, 
                    data: null, 
                    error: error.message,
                    notificationId: testResults.notifications?.data?.data?.notifications?.[0]?.id_notification,
                    sessionId: getSessionInfo(),
                    url: `/prescription/notifications/${testResults.notifications?.data?.data?.notifications?.[0]?.id_notification}/read`
                }
            }));
        } finally {
            setLoading(false);
        }
    };

    const clearResults = () => {
        setTestResults({});
        setSessionInfo(null);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    🔔 Test de la Route des Notifications
                </h3>
                <div className="flex space-x-2">
                    <button
                        onClick={getSessionInfo}
                        className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
                    >
                        📋 Info Session
                    </button>
                    <button
                        onClick={clearResults}
                        className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm"
                    >
                        🗑️ Effacer
                    </button>
                </div>
            </div>

            {/* Informations de session */}
            {sessionInfo && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-medium text-blue-900 mb-2">📋 Informations de Session :</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>Session ID :</strong> {sessionInfo.sessionId}</p>
                        <p><strong>LocalStorage (raw) :</strong> {sessionInfo.localStorage ? 'Présent' : 'Absent'}</p>
                        {sessionInfo.parsed && (
                            <div>
                                <p><strong>Données parsées :</strong></p>
                                <pre className="text-xs bg-blue-100 p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(sessionInfo.parsed, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tests */}
            <div className="space-y-4">
                {/* Test des notifications */}
                <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <FaBell className="text-blue-500" />
                            <span className="font-medium">Test Récupération Notifications</span>
                        </div>
                        <button
                            onClick={testNotificationRoute}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : '🧪 Tester'}
                        </button>
                    </div>
                    
                    {testResults.notifications && (
                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                            <div className="flex items-center space-x-2 mb-2">
                                {testResults.notifications.success ? 
                                    <FaCheck className="text-green-500" /> : 
                                    <FaTimes className="text-red-500" />
                                }
                                <span className={`font-medium ${
                                    testResults.notifications.success ? 'text-green-700' : 'text-red-700'
                                }`}>
                                    {testResults.notifications.success ? '✅ Succès' : '❌ Échec'}
                                </span>
                            </div>
                            
                            <p className="text-gray-600 mb-1">
                                <strong>URL testée :</strong> {testResults.notifications.url}
                            </p>
                            
                            {testResults.notifications.success ? (
                                <div>
                                    <p className="text-green-700 font-medium mb-1">📊 Données reçues :</p>
                                    <pre className="text-xs text-gray-600 bg-white p-2 rounded overflow-x-auto">
                                        {JSON.stringify(testResults.notifications.data, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-red-700 font-medium mb-1">❌ Erreur :</p>
                                    <p className="text-red-600 text-xs">
                                        {testResults.notifications.error}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Test du marquage comme lu */}
                {testResults.notifications?.success && (
                    <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FaInfoCircle className="text-green-500" />
                                <span className="font-medium">Test Marquage Comme Lu</span>
                            </div>
                            <button
                                onClick={testMarkAsRead}
                                disabled={loading}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : '✅ Tester'}
                            </button>
                        </div>
                        
                        {testResults.markAsRead && (
                            <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                                <div className="flex items-center space-x-2 mb-2">
                                    {testResults.markAsRead.success ? 
                                        <FaCheck className="text-green-500" /> : 
                                        <FaTimes className="text-red-500" />
                                    }
                                    <span className={`font-medium ${
                                        testResults.markAsRead.success ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                        {testResults.markAsRead.success ? '✅ Succès' : '❌ Échec'}
                                    </span>
                                </div>
                                
                                <p className="text-gray-600 mb-1">
                                    <strong>URL testée :</strong> {testResults.markAsRead.url}
                                </p>
                                
                                {testResults.markAsRead.success ? (
                                    <div>
                                        <p className="text-green-700 font-medium mb-1">📊 Résultat :</p>
                                        <pre className="text-xs text-gray-600 bg-white p-2 rounded overflow-x-auto">
                                            {JSON.stringify(testResults.markAsRead.data, null, 2)}
                                        </pre>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-red-700 font-medium mb-1">❌ Erreur :</p>
                                        <p className="text-red-600 text-xs">
                                            {testResults.markAsRead.error}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <h4 className="font-medium text-yellow-900 mb-2">📋 Instructions de test :</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• <strong>1.</strong> Cliquez sur "📋 Info Session" pour voir les informations de session du médecin</li>
                    <li>• <strong>2.</strong> Cliquez sur "🧪 Tester" pour tester la récupération des notifications de prescription</li>
                    <li>• <strong>3.</strong> Si le test des notifications réussit, testez le marquage comme lu</li>
                    <li>• <strong>4.</strong> Vérifiez que les URLs correspondent à la route existante : <code>/prescription/notifications?professionnel_id={'{session_id}'}</code></li>
                </ul>
            </div>

            {/* Affichage des notifications de prescription */}
            {testResults.notifications?.success && testResults.notifications.data?.data?.notifications && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-medium text-green-900 mb-3">📋 Notifications de Prescription Récupérées :</h4>
                    <div className="space-y-3">
                        {testResults.notifications.data.data.notifications.map((notification, index) => (
                            <div key={index} className="p-3 bg-white rounded-lg border border-green-200">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                        {notification.type_notification || 'Prescription'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {notification.date_creation ? 
                                            new Date(notification.date_creation).toLocaleDateString('fr-FR') : 'Date inconnue'
                                        }
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">
                                    {notification.message || 'Aucun contenu'}
                                </p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>Statut: {notification.statut || 'Non lue'}</span>
                                    <span>ID: {notification.id_notification}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Informations de pagination */}
                    {testResults.notifications.data.data.pagination && (
                        <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800">
                            <p><strong>Pagination :</strong> Page {testResults.notifications.data.data.pagination.page} sur {testResults.notifications.data.data.pagination.totalPages} 
                            ({testResults.notifications.data.data.pagination.total} notifications au total)</p>
                        </div>
                    )}
                </div>
            )}

            {/* Résumé des routes */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">🔗 Routes utilisées :</h4>
                <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>GET :</strong> <code>/prescription/notifications?professionnel_id={'{session_id}'}&page=1&limit=5</code></p>
                    <p><strong>PATCH :</strong> <code>/prescription/notifications/{'{notification_id}'}/read</code></p>
                </div>
            </div>
        </div>
    );
};

export default NotificationRouteTester;
