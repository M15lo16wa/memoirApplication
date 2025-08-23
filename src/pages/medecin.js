// src/pages/Medecin.js

import React, { useState, useEffect, useCallback } from "react";
import MedHeader from "../components/layout/headerMed";
import { ProtectedMedecinRoute } from "../services/api/protectedRoute";
import { FaComments, FaCalendarAlt, FaUserInjured, FaChartBar, FaSearch, FaSpinner, FaBell, FaUser } from "react-icons/fa";

// Importez les composants que nous avons corrigés
import MedecinMessaging from "../components/messaging/MedecinMessaging"; 
import messagingService from "../services/api/messagingApi";

// Simulez une API pour les statistiques pour ne pas bloquer le projet
const medecinApi = {
    getDashboardStats: () => Promise.resolve({ patientsAujourdhui: 5, rdvRestants: 3, consultationsSemaine: 12 }),
    getPatients: () => Promise.resolve({ patients: [{id: 1, prenom: "Jean", nom: "Dupont"}]}),
    getAgenda: () => Promise.resolve({ rdv: [{id: 1, patient: { prenom: "Marie", nom: "Curie" }, motif: "Suivi"}]})
};

function Medecin() {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [dashboardStats, setDashboardStats] = useState({ patientsAujourdhui: 0, rdvRestants: 0, messagesPatients: 0, consultationsSemaine: 0 });
    const [recentMessages, setRecentMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const getCurrentMedecin = useCallback(() => {
        const medecinData = localStorage.getItem('medecin');
        return medecinData ? JSON.parse(medecinData) : null;
    }, []);

    // Charger les données du tableau de bord (statistiques ET messages récents)
    const loadDashboardData = useCallback(async () => {
        const medecin = getCurrentMedecin();
        if (!medecin) return;
        
        setLoading(true);
        try {
            // Charger les statistiques et les conversations en parallèle
            const [stats, conversations] = await Promise.all([
                medecinApi.getDashboardStats(),
                messagingService.getMedecinConversations(medecin.id_professionnel || medecin.id)
            ]);

            // Extraire les messages les plus récents des conversations
            const messages = conversations
                .filter(conv => conv.lastMessage) // Garder uniquement les conversations avec des messages
                .map(conv => ({
                    ...conv.lastMessage,
                    id: conv.id, // Utiliser l'ID de la conversation comme clé unique
                    patient: conv.patient,
                    titreConversation: conv.titre,
                }))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Trier par date décroissante
            
            setDashboardStats({ ...stats, messagesPatients: messages.length });
            setRecentMessages(messages);
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement du tableau de bord:', error);
        } finally {
            setLoading(false);
        }
    }, [getCurrentMedecin]);

    useEffect(() => {
        // Charger les données uniquement pour la section dashboard
        if (activeSection === 'dashboard') {
            loadDashboardData();
        }
    }, [activeSection, loadDashboardData]);

    // Écouter les nouveaux messages en temps réel pour mettre à jour le dashboard
    useEffect(() => {
        const unsubscribe = messagingService.onNewMessage(() => {
            console.log("🔔 Nouveau message reçu, rafraîchissement du dashboard...");
            if (activeSection === 'dashboard') {
                loadDashboardData();
            }
        });

        // Se connecter au WebSocket au montage de la page
        messagingService.connectWebSocket();

        return () => {
            unsubscribe(); // Nettoyer l'abonnement
        };
    }, [activeSection, loadDashboardData]);

    // Fonction pour afficher le contenu de la section active
    const renderContent = () => {
        switch (activeSection) {
            // Le composant MedecinMessaging gère maintenant TOUTE la logique de la messagerie
            case 'messaging':
                return <MedecinMessaging />;

            // Le tableau de bord affiche les messages récents chargés depuis le service
            case 'dashboard':
            default:
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Section principale du tableau de bord */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-xl font-semibold">Tableau de Bord</h2>
                            {/* ... Vos cartes de statistiques ... */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <FaUserInjured className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="ml-4">
                                            {loading ? <FaSpinner className="animate-spin" /> : <p className="text-2xl font-semibold">{dashboardStats.patientsAujourdhui}</p>}
                                            <p className="text-gray-600">Patients</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-md p-6">
                                     <div className="flex items-center">
                                         <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                             <FaCalendarAlt className="w-6 h-6 text-green-600" />
                                         </div>
                                         <div className="ml-4">
                                            {loading ? <FaSpinner className="animate-spin" /> : <p className="text-2xl font-semibold">{dashboardStats.rdvRestants}</p>}
                                             <p className="text-gray-600">RDV restants</p>
                                         </div>
                                     </div>
                                 </div>
                                 <div className="bg-white rounded-lg shadow-md p-6">
                                     <div className="flex items-center">
                                         <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                             <FaComments className="w-6 h-6 text-yellow-600" />
                                         </div>
                                         <div className="ml-4">
                                             {loading ? <FaSpinner className="animate-spin" /> : <p className="text-2xl font-semibold">{dashboardStats.messagesPatients}</p>}
                                             <p className="text-gray-600">Conversations</p>
                                         </div>
                                     </div>
                                 </div>
                            </div>
                        </div>

                        {/* Widget des messages récents */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Messages Récents</h3>
                                    <button onClick={() => setActiveSection('messaging')} className="text-blue-600 hover:text-blue-800 text-sm">Voir tout</button>
                                </div>
                                <div className="space-y-3">
                                    {loading ? <div className="text-center p-4"><FaSpinner className="animate-spin mx-auto" /></div> :
                                    recentMessages.length > 0 ? (
                                        recentMessages.slice(0, 3).map((msg) => ( // Afficher les 3 plus récents
                                            <div key={msg.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                                <p className="font-semibold text-sm">{msg.patient?.prenom} {msg.patient?.nom}</p>
                                                <p className="text-gray-600 text-sm truncate">{msg.content}</p>
                                                <p className="text-xs text-gray-400 mt-1 text-right">{new Date(msg.timestamp).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-4">Aucun message récent.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <ProtectedMedecinRoute>
            <div className="min-h-screen bg-gray-50">
                <MedHeader />
                
                {/* Navigation */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex space-x-8">
                            {['dashboard', 'messaging'].map((section) => (
                                <button
                                    key={section}
                                    onClick={() => setActiveSection(section)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                                        activeSection === section
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                  {section === 'dashboard' ? <FaChartBar className="inline mr-2" /> : <FaComments className="inline mr-2" />}
                                  {section === 'dashboard' ? 'Tableau de Bord' : 'Messagerie'}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
                
                {/* Contenu principal */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {renderContent()}
                </main>
            </div>
        </ProtectedMedecinRoute>
    );
}

export default Medecin;