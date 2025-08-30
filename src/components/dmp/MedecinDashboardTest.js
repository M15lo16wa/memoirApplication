import React, { useState } from 'react';
import MedecinDashboard from './MedecinDashboard';

const MedecinDashboardTest = () => {
    const [showDashboard, setShowDashboard] = useState(false);
    const [testMedecinData, setTestMedecinData] = useState({
        id_professionnel: '79',
        nom: 'Sakura',
        prenom: 'Saza',
        specialite: 'Cardiologie',
        service: 'Cardiologie'
    });

    const handleTestDashboard = () => {
        // Simuler un médecin connecté
        localStorage.setItem('medecin', JSON.stringify(testMedecinData));
        setShowDashboard(true);
    };

    const handleCloseDashboard = () => {
        setShowDashboard(false);
        localStorage.removeItem('medecin');
    };

    const updateTestData = (field, value) => {
        setTestMedecinData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">🧪 Test Tableau de Bord Médecin avec Service Rendez-vous</h2>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-2 text-blue-800">ℹ️ Objectif du Test</h3>
                <p className="text-sm text-blue-700">
                    Ce test vérifie que le tableau de bord du médecin fonctionne avec le service <strong>rendezVous.js</strong> :
                    récupération des patients, rendez-vous, messages et affichage de l'onglet Agenda.
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
                        value={testMedecinData.id_professionnel}
                        onChange={(e) => updateTestData('id_professionnel', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="ID du médecin"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du Médecin
                    </label>
                    <input
                        type="text"
                        value={testMedecinData.nom}
                        onChange={(e) => updateTestData('nom', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Nom du médecin"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom du Médecin
                    </label>
                    <input
                        type="text"
                        value={testMedecinData.prenom}
                        onChange={(e) => updateTestData('prenom', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Prénom du médecin"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Spécialité
                    </label>
                    <input
                        type="text"
                        value={testMedecinData.specialite}
                        onChange={(e) => updateTestData('specialite', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Spécialité"
                    />
                </div>
            </div>

            {/* Bouton de test */}
            <div className="text-center mb-6">
                <button
                    onClick={handleTestDashboard}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg font-medium"
                >
                    🧪 Tester le Tableau de Bord Médecin
                </button>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-2 text-yellow-800">📋 Instructions de Test</h3>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                    <li>Configurez les informations du médecin de test</li>
                    <li>Cliquez sur "Tester le Tableau de Bord Médecin"</li>
                    <li>Vérifiez que le tableau de bord s'affiche avec les données du serveur</li>
                    <li>Testez l'onglet "Agenda" pour voir les rendez-vous groupés par date</li>
                    <li>Vérifiez que les statistiques s'affichent correctement</li>
                    <li>Vérifiez que les données se chargent depuis le service rendezVous.js</li>
                </ol>
            </div>

            {/* Informations sur le service */}
            <div className="bg-green-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-2 text-green-800">🔧 Service Utilisé</h3>
                <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Service principal:</strong> <code>rendezVous.js</code></p>
                    <p><strong>Fonctions utilisées:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><code>getPatientsByMedecin(medecinId)</code> - Récupération des patients</li>
                        <li><code>getRendezVousByMedecin(medecinId)</code> - Récupération des RDV</li>
                        <li><code>getMessagesRecents(medecinId)</code> - Récupération des messages</li>
                        <li><code>getNotificationsByMedecin(medecinId)</code> - Récupération des notifications</li>
                    </ul>
                    <p><strong>Onglets disponibles:</strong> Tableau de Bord + Agenda</p>
                </div>
            </div>

            {/* Informations de debug */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">🔍 Informations de Debug</h3>
                <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>État actuel:</strong> {showDashboard ? 'Tableau de bord ouvert' : 'Tableau de bord fermé'}</p>
                    <p><strong>Médecin simulé:</strong> Dr. {testMedecinData.prenom} {testMedecinData.nom}</p>
                    <p><strong>ID médecin:</strong> {testMedecinData.id_professionnel}</p>
                    <p><strong>Spécialité:</strong> {testMedecinData.specialite}</p>
                    <p><strong>Service:</strong> {testMedecinData.service}</p>
                    <p><strong>Token JWT:</strong> {localStorage.getItem('jwt') ? '✅ Présent' : '❌ Absent'}</p>
                    <p><strong>Token générique:</strong> {localStorage.getItem('token') ? '✅ Présent' : '❌ Absent'}</p>
                </div>
            </div>

            {/* Interface du tableau de bord de test */}
            {showDashboard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
                        {/* En-tête */}
                        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                            <h3 className="text-xl font-bold">🧪 Test - Tableau de Bord Médecin avec Service Rendez-vous</h3>
                            <button
                                onClick={handleCloseDashboard}
                                className="text-white hover:text-gray-200 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        
                        {/* Tableau de bord */}
                        <div className="flex-1 overflow-auto p-4">
                            <MedecinDashboard />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedecinDashboardTest;
