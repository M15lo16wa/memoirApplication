// src/pages/Medecin.js

import React, { useState, useEffect } from "react";
import MedHeader from "../components/layout/headerMed";
import { ProtectedMedecinRoute } from "../services/api/protectedRoute";
import { FaComments, FaCalendarAlt, FaUserInjured, FaChartBar, FaSearch, FaSpinner, FaUser } from "react-icons/fa";
// Widget supprimé - géré côté serveur

// Import des composants de messagerie
import { ChatMessage } from "../messaging";
// signalingService supprimé - géré côté serveur
import { getPatientsByMedecin } from "../services/api/patientApi";


function Medecin() {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [dashboardStats] = useState({
        patientsAujourdhui: 0,
        rendezVous: 0,
        messagesPatients: 0
    });
    const [recentMessages, setRecentMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // État pour la messagerie sécurisée
    const [showMessaging, setShowMessaging] = useState(false);
    const [showPatientSelection, setShowPatientSelection] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [role, setRole] = useState(null);
    const [jwtToken, setJwtToken] = useState(null);

    
    // État pour la liste des patients
    const [patients, setPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);





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
        console.log('🔍 [useEffect] Déclenchement - userId:', userId, 'role:', role, 'jwtToken:', jwtToken ? 'Présent' : 'Absent');
        
        if (userId && role && jwtToken) {
            console.log('✅ [useEffect] Conditions remplies, chargement des données...');
            
            const loadRecentMessages = async () => {
                try {
                    setLoading(true);
                    // Fonctionnalité gérée côté serveur
                    const response = { success: true, conversations: [] };
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
        } else {
            console.log('❌ [useEffect] Conditions non remplies, pas de chargement');
        }
    }, [userId, role, jwtToken]);

    // Surveiller les changements du state dashboardStats
    useEffect(() => {
        console.log('🔄 [useEffect - dashboardStats] State mis à jour:', dashboardStats);
    }, [dashboardStats]);


    // Charger la liste des patients depuis le serveur
    const loadPatients = async () => {
        try {
            setLoadingPatients(true);
            setError(null);
            
            if (!userId) {
                console.error('❌ ID utilisateur non disponible pour charger les patients');
                setError("ID utilisateur non disponible");
                return;
            }
            
            console.log('🔍 Chargement des patients pour le médecin:', userId);
            const patientsData = await getPatientsByMedecin(userId);
            
            if (patientsData && Array.isArray(patientsData)) {
                console.log('✅ Patients récupérés:', patientsData.length);
                setPatients(patientsData);
            } else {
                console.warn('⚠️ Aucun patient trouvé ou format de réponse invalide');
                setPatients([]);
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement des patients:', error);
            setError(`Erreur lors du chargement des patients: ${error.message}`);
            setPatients([]);
        } finally {
            setLoadingPatients(false);
        }
    };

    // Fonction pour ouvrir la sélection de patient
    const handleOpenPatientSelection = () => {
        setShowPatientSelection(true);
        loadPatients();
    };

    // Fonction pour sélectionner un patient et créer une conversation
    const handleSelectPatient = (patientId) => {
        const selectedPatient = patients.find(p => (p.id || p.id_patient) === patientId);
        if (selectedPatient) {
            console.log('✅ Patient sélectionné:', selectedPatient);
            setSelectedPatientId(patientId);
            setShowPatientSelection(false);
            setShowMessaging(true);
            setSelectedConversationId(null); // Nouvelle conversation
            setError(null); // Nettoyer les erreurs
        } else {
            console.error('❌ Patient non trouvé avec l\'ID:', patientId);
            setError("Patient non trouvé");
        }
    };

    // Fonction pour fermer la messagerie
    const handleCloseMessaging = () => {
        setShowMessaging(false);
        setSelectedPatientId(null);
        setSelectedConversationId(null);
    };


    const renderContent = () => {
        if (activeSection === 'messaging') {
            return (
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Messagerie Sécurisée</h2>
                    
                    {/* Boutons d'action pour la messagerie */}
                    {userId && role && jwtToken && !showMessaging && (
                        <div className="text-center py-8 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={handleOpenPatientSelection}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <FaUserInjured className="w-5 h-5" />
                                    <span>Nouvelle conversation avec un patient</span>
                                </button>
                                
                                <button
                                    onClick={() => setShowMessaging(true)}
                                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <FaComments className="w-5 h-5" />
                                    <span>Voir les conversations existantes</span>
                                </button>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-4">
                                Choisissez une option pour accéder à la messagerie sécurisée
                            </p>
                        </div>
                    )}
                    
                    {/* Interface de sélection de patient */}
                    {userId && role && jwtToken && showPatientSelection && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-gray-800">Sélectionner un patient</h3>
                                <button
                                    onClick={() => setShowPatientSelection(false)}
                                    className="text-gray-500 hover:text-gray-700 text-sm"
                                >
                                    ← Retour
                                </button>
                            </div>
                            
                            {/* Barre de recherche */}
                            <div className="mb-6">
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un patient par nom, prénom ou numéro de sécurité sociale..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            {/* Messages d'erreur */}
                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-red-800 text-sm">{error}</span>
                                        <button
                                            onClick={() => setError(null)}
                                            className="text-red-600 hover:text-red-800 text-lg"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Liste des patients */}
                            <div className="space-y-3">
                                {loadingPatients ? (
                                    <div className="text-center py-8">
                                        <FaSpinner className="animate-spin mx-auto text-blue-500 text-2xl mb-2" />
                                        <p className="text-gray-600">Chargement des patients...</p>
                                    </div>
                                ) : patients.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FaUser className="mx-auto text-gray-400 text-3xl mb-2" />
                                        <p className="text-gray-600">Aucun patient trouvé</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {error ? 'Erreur lors du chargement' : 'Vous n\'avez pas encore de patients assignés'}
                                        </p>
                                        {!error && (
                                            <button
                                                onClick={loadPatients}
                                                className="mt-3 text-blue-600 hover:text-blue-800 text-sm underline"
                                            >
                                                Réessayer
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    patients
                                        .filter(patient => {
                                            const searchLower = searchTerm.toLowerCase();
                                            const nom = (patient.nom || '').toLowerCase();
                                            const prenom = (patient.prenom || '').toLowerCase();
                                            const numeroAssure = (patient.numero_assure || patient.numero_securite_sociale || '').toLowerCase();
                                            
                                            return nom.includes(searchLower) || 
                                                   prenom.includes(searchLower) || 
                                                   numeroAssure.includes(searchLower);
                                        })
                                        .map(patient => {
                                            // Gérer différents formats de données patient
                                            const patientId = patient.id || patient.id_patient;
                                            const nom = patient.nom || 'N/A';
                                            const prenom = patient.prenom || 'N/A';
                                            const numeroAssure = patient.numero_assure || patient.numero_securite_sociale || 'N/A';
                                            
                                            return (
                                                <div
                                                    key={patientId}
                                                    onClick={() => handleSelectPatient(patientId)}
                                                    className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <FaUser className="text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">
                                                                    {prenom} {nom}
                                                                </h4>
                                                                <p className="text-sm text-gray-600">
                                                                    N° Sécurité Sociale: {numeroAssure}
                                                                </p>
                                                                {patient.date_naissance && (
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        Né(e) le: {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.location.href = `/webrtc?patient=${patientId}`;
                                                                }}
                                                                className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                                                                title="Appel vidéo"
                                                            >
                                                                📹
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.location.href = `/webrtc?patient=${patientId}&type=audio`;
                                                                }}
                                                                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                                                                title="Appel audio"
                                                            >
                                                                🎤
                                                            </button>
                                                            <div className="text-blue-600">
                                                                <FaComments className="w-5 h-5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Interface de messagerie avec ChatMessage */}
                    {userId && role && jwtToken && showMessaging && (
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        {selectedPatientId ? 'Nouvelle conversation' : 'Conversations existantes'}
                                    </h3>
                                    {selectedPatientId && (
                                        <div className="text-sm text-gray-600 mt-1">
                                            <p className="font-medium">
                                                Patient sélectionné: {patients.find(p => (p.id || p.id_patient) === selectedPatientId)?.prenom} {patients.find(p => (p.id || p.id_patient) === selectedPatientId)?.nom}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                ID: {selectedPatientId}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center space-x-3">
                                    {/* Fonctionnalité d'appel supprimée */}
                                    <button
                                        onClick={handleCloseMessaging}
                                        className="text-gray-500 hover:text-gray-700 text-sm"
                                    >
                                        ← Retour
                                    </button>
                                </div>
                            </div>
                            
                            <div className="h-96">
                                <ChatMessage
                                    userId={userId}
                                    role={role}
                                    token={jwtToken}
                                    conversationId={selectedConversationId}
                                    patientId={selectedPatientId}
                                />
                            </div>
                        </div>
                    )}

                    {/* Interface d'appel supprimée - Utiliser la page WebRTC dédiée */}
                    
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
                     

                     
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FaCalendarAlt className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    {loading ? <FaSpinner className="animate-spin" /> : <p className="text-2xl font-semibold">{dashboardStats.rendezVous}</p>}
                                    <p className="text-gray-600">Rendez-vous</p>
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
                    
                    {/* Section WebRTC */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Communication WebRTC</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => window.location.href = '/webrtc'}
                                className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                            >
                                <div className="text-center">
                                    <div className="text-3xl mb-2">📹</div>
                                    <p className="font-medium text-green-800">Conférences Vidéo</p>
                                    <p className="text-sm text-green-600">Appels vidéo avec patients</p>
                                </div>
                            </button>
                            <button
                                onClick={() => window.location.href = '/webrtc?type=audio'}
                                className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                            >
                                <div className="text-center">
                                    <div className="text-3xl mb-2">🎤</div>
                                    <p className="font-medium text-blue-800">Appels Audio</p>
                                    <p className="text-sm text-blue-600">Communication vocale</p>
                                </div>
                            </button>
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
                            
                            {/* Bouton WebRTC */}
                            <button
                                onClick={() => window.location.href = '/webrtc'}
                                className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-green-600 font-medium text-sm flex items-center"
                            >
                                <span className="mr-2">📹</span>
                                WebRTC
                            </button>
                            
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
                
                {/* Interface d'appel supprimée */}
            </div>
        </ProtectedMedecinRoute>
    );
}

export default Medecin;