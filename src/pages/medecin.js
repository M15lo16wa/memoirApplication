// src/pages/Medecin.js

import React, { useState, useEffect, useCallback } from "react";
import MedHeader from "../components/layout/headerMed";
import { ProtectedMedecinRoute } from "../services/api/protectedRoute";
import { FaComments, FaCalendarAlt, FaUserInjured, FaChartBar, FaSearch, FaSpinner, FaBell, FaUser } from "react-icons/fa";

// Import des composants de messagerie
import { MessagingButton, MessagingWidget } from "../messaging/components";
import signalingService from "../services/signalingService";

function Medecin() {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [callActive, setCallActive] = useState(false);
    const [remoteStream, setRemoteStream] = useState(null);
    const [dashboardStats, setDashboardStats] = useState({
        patientsAujourdhui: 0,
        rdvRestants: 0,
        messagesPatients: 0
    });
    const [recentMessages, setRecentMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // État pour la messagerie sécurisée
    const [showMessaging, setShowMessaging] = useState(false);
    const [userId, setUserId] = useState(null);
    const [role, setRole] = useState(null);
    const [jwtToken, setJwtToken] = useState(null);

    const handleSend = useCallback(() => {
        if (input.trim()) {
            signalingService.emit('sendMessage', input);
            setMessages(prev => [...prev, { sender: "medecin", content: input }]);
            setInput('');
        }
    }, [input]);

    const handleStartCall = useCallback(() => {
        signalingService.emit('startCall');
        setCallActive(true);
    }, []);

    // Récupérer les informations d'authentification au montage du composant
    useEffect(() => {
        const token = localStorage.getItem('token') || localStorage.getItem('jwt');
        const medecinData = localStorage.getItem('medecin');
        
        if (token && medecinData) {
            try {
                const medecin = JSON.parse(medecinData);
                setUserId(medecin.id_professionnel || medecin.id);
                setRole('medecin');
                setJwtToken(token);
                console.log('✅ Médecin connecté:', medecin.nom, medecin.prenom);
            } catch (error) {
                console.error('Erreur lors du parsing des données médecin:', error);
            }
        }
    }, []);

    // Charger les messages récents depuis le service de messagerie
    useEffect(() => {
        if (userId && role && jwtToken) {
            const loadRecentMessages = async () => {
                try {
                    setLoading(true);
                    const response = await signalingService.getUserConversations();
                    if (response.success && response.conversations) {
                        // Trier par date et prendre les plus récents
                        const sortedConversations = response.conversations
                            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
                            .slice(0, 3);
                        setRecentMessages(sortedConversations);
                    }
                } catch (error) {
                    console.error('Erreur lors du chargement des messages récents:', error);
                } finally {
                    setLoading(false);
                }
            };
            
            loadRecentMessages();
        }
    }, [userId, role, jwtToken]);

    const renderContent = () => {
        if (activeSection === 'messaging') {
            return (
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Messagerie Sécurisée</h2>
                    
                    {/* Bouton d'ouverture de la messagerie */}
                    {userId && role && jwtToken && !showMessaging && (
                        <div className="text-center py-8">
                            <MessagingButton
                                userId={userId}
                                role={role}
                                token={jwtToken}
                                onClick={() => setShowMessaging(true)}
                            />
                            <p className="text-sm text-gray-600 mt-4">
                                Cliquez sur le bouton ci-dessus pour accéder à la messagerie sécurisée
                            </p>
                        </div>
                    )}
                    
                    {/* Widget de messagerie */}
                    {userId && role && jwtToken && showMessaging && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Messagerie avec les patients</h3>
                                <button
                                    onClick={() => setShowMessaging(false)}
                                    className="text-gray-500 hover:text-gray-700 text-sm"
                                >
                                    ← Retour
                                </button>
                            </div>
                            <MessagingWidget
                                userId={userId}
                                role={role}
                                token={jwtToken}
                                conversationId={null}
                                onClose={() => setShowMessaging(false)}
                            />
                        </div>
                    )}
                    
                    {/* Fallback si pas d'authentification */}
                    {(!userId || !role || !jwtToken) && (
                        <div className="text-center py-8">
                            <div className="text-yellow-600 mb-4">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-yellow-800 mb-2">Authentification requise</h3>
                            <p className="text-yellow-700">
                                Veuillez vous connecter pour accéder à la messagerie sécurisée.
                            </p>
                        </div>
                    )}
                </div>
            );
        }
        
        // dashboard par défaut
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
                        
                        {/* Bouton d'accès rapide à la messagerie */}
                        {userId && role && jwtToken && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setActiveSection('messaging')}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <FaComments className="w-4 h-4" />
                                    <span>Accéder à la messagerie</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
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
                                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeSection === section
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {section === 'dashboard' ? <FaChartBar className="inline mr-2" /> : <FaComments className="inline mr-2" />}
                                    {section === 'dashboard' ? 'Tableau de Bord' : 'Messagerie'}
                                </button>
                            ))}
                            
                            {/* Indicateur de statut de connexion */}
                            <div className="ml-auto flex items-center space-x-2">
                                {userId && role && jwtToken ? (
                                    <div className="flex items-center space-x-2 text-green-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm">Connecté</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2 text-red-600">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span className="text-sm">Non connecté</span>
                                    </div>
                                )}
                            </div>
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