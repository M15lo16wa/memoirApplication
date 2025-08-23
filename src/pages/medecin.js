import React, { useState, useEffect } from "react";
import MedHeader from "../components/layout/headerMed";
import MedecinMessaging from "../components/messaging/MedecinMessaging";
import { ProtectedMedecinRoute } from "../services/api/protectedRoute";
import { FaComments, FaCalendarAlt, FaUserInjured, FaChartBar, FaSearch, FaSpinner, FaBell } from "react-icons/fa";
import medecinApi from "../services/api/medecinApi";

function Medecin() {
    const [activeSection, setActiveSection] = useState('dashboard');
    
    // États pour les données réelles de l'API
    const [dashboardStats, setDashboardStats] = useState({
        patientsAujourdhui: 0,
        rdvRestants: 0,
        messagesPatients: 0,
        consultationsSemaine: 0
    });
    const [recentMessages, setRecentMessages] = useState([]);
    const [patients, setPatients] = useState([]);
    const [agenda, setAgenda] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Détecter le hash dans l'URL pour ouvrir directement la messagerie
    useEffect(() => {
        if (window.location.hash === '#messaging') {
            setActiveSection('messaging');
        }
    }, []);

    // Charger les données du tableau de bord
    useEffect(() => {
        if (activeSection === 'dashboard') {
            loadDashboardData();
        }
    }, [activeSection]);

    // Charger les données du tableau de bord
    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // Charger les statistiques et messages en parallèle
            try {
                const [stats, messages] = await Promise.all([
                    medecinApi.getDashboardStats().catch(() => ({
                        patientsAujourdhui: 0,
                        rdvRestants: 0,
                        messagesPatients: 0,
                        consultationsSemaine: 0
                    })),
                    medecinApi.getRecentMessages(5).catch(() => [])
                ]);
                
                setDashboardStats(stats);
                setRecentMessages(messages);
            } catch (error) {
                console.error('❌ Erreur lors du chargement du tableau de bord:', error);
                // Utiliser des valeurs par défaut si tout échoue
                setDashboardStats({
                    patientsAujourdhui: 0,
                    rdvRestants: 0,
                    messagesPatients: 0,
                    consultationsSemaine: 0
                });
                setRecentMessages([]);
            }
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données du tableau de bord:', error);
        } finally {
            setLoading(false);
        }
    };

    // Rechercher des patients
    const searchPatients = async (term = '') => {
        try {
            setLoading(true);
            const result = await medecinApi.getPatients(term, 1, 20);
            setPatients(result.patients || []);
        } catch (error) {
            console.error('❌ Erreur lors de la recherche de patients:', error);
            setPatients([]);
        } finally {
            setLoading(false);
        }
    };

    // Charger l'agenda
    const loadAgenda = async () => {
        try {
            setLoading(true);
            const result = await medecinApi.getAgenda(null, 1, 20);
            setAgenda(result.rdv || []);
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'agenda:', error);
            setAgenda([]);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'messaging':
                return (
                    <div className="h-[calc(100vh-200px)]">
                        <MedecinMessaging />
                    </div>
                );
            case 'patients':
                return (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Recherche de Patients</h3>
                        <div className="flex items-center mb-4">
                            <FaSearch className="text-gray-400 mr-2" />
                            <input 
                                type="text" 
                                className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md" 
                                placeholder="Rechercher un patient..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchPatients(searchTerm)}
                            />
                            <button 
                                className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 disabled:opacity-50"
                                onClick={() => searchPatients(searchTerm)}
                                disabled={loading}
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : 'Rechercher'}
                            </button>
                        </div>
                        
                        {loading ? (
                            <div className="text-center py-8">
                                <FaSpinner className="animate-spin text-2xl text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600">Recherche en cours...</p>
                            </div>
                        ) : patients.length > 0 ? (
                            <div className="space-y-3">
                                {patients.map((patient) => (
                                    <div key={patient.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                                        <p className="text-sm font-medium text-gray-900">
                                            {patient.prenom} {patient.nom}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            ID: {patient.id_patient || patient.id} | 
                                            {patient.date_naissance ? ` Né(e) le: ${new Date(patient.date_naissance).toLocaleDateString('fr-FR')}` : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : searchTerm ? (
                            <p className="text-gray-600 text-center py-4">Aucun patient trouvé pour "{searchTerm}"</p>
                        ) : (
                            <p className="text-gray-600 text-center py-4">Entrez un nom pour rechercher des patients</p>
                        )}
                    </div>
                );
            case 'agenda':
                return (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Agenda du Jour</h3>
                            <button 
                                onClick={loadAgenda}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                                disabled={loading}
                            >
                                {loading ? <FaSpinner className="animate-spin inline mr-1" /> : 'Actualiser'}
                            </button>
                        </div>
                        
                        {loading ? (
                            <div className="text-center py-8">
                                <FaSpinner className="animate-spin text-2xl text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600">Chargement de l'agenda...</p>
                            </div>
                        ) : agenda.length > 0 ? (
                            <div className="space-y-3">
                                {agenda.map((rdv) => (
                                    <div key={rdv.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {rdv.patient?.prenom} {rdv.patient?.nom}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {rdv.motif || 'Consultation'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-medium text-blue-600">
                                                    {rdv.heure_debut ? new Date(rdv.heure_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {rdv.duree ? `${rdv.duree} min` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-600">Aucun rendez-vous aujourd'hui</p>
                                <p className="text-sm text-gray-500">Votre agenda est libre</p>
                            </div>
                        )}
                    </div>
                );
            default:
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Statistiques rapides */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* En-tête avec bouton de rafraîchissement */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Tableau de Bord</h2>
                                <button 
                                    onClick={loadDashboardData}
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                    disabled={loading}
                                >
                                    {loading ? <FaSpinner className="animate-spin mr-1" /> : 'Actualiser'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <FaUserInjured className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="ml-4">
                                            {loading ? (
                                                <FaSpinner className="animate-spin text-2xl text-gray-400" />
                                            ) : (
                                                <p className="text-2xl font-semibold text-gray-900">
                                                    {dashboardStats.patientsAujourdhui}
                                                </p>
                                            )}
                                            <p className="text-gray-600">Patients aujourd'hui</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                            <FaCalendarAlt className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div className="ml-4">
                                            {loading ? (
                                                <FaSpinner className="animate-spin text-2xl text-gray-400" />
                                            ) : (
                                                <p className="text-2xl font-semibold text-gray-900">
                                                    {dashboardStats.rdvRestants}
                                                </p>
                                            )}
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
                                            {loading ? (
                                                <FaSpinner className="animate-spin text-2xl text-gray-400" />
                                            ) : (
                                                <p className="text-2xl font-semibold text-gray-900">
                                                    {dashboardStats.messagesPatients}
                                                </p>
                                            )}
                                            <p className="text-gray-600">Messages patients</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Recherche de patients */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold mb-4">Recherche Rapide</h3>
                                <div className="flex items-center">
                                    <FaSearch className="text-gray-400 mr-2" />
                                    <input 
                                        type="text" 
                                        className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md" 
                                        placeholder="Rechercher un patient..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && searchPatients(searchTerm)}
                                    />
                                    <button 
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 disabled:opacity-50"
                                        onClick={() => searchPatients(searchTerm)}
                                        disabled={loading}
                                    >
                                        {loading ? <FaSpinner className="animate-spin" /> : 'Rechercher'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Widget de messagerie */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Messages Récents</h3>
                                    <button 
                                        onClick={() => setActiveSection('messaging')}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        Voir tout
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {loading ? (
                                        <div className="text-center py-4">
                                            <FaSpinner className="animate-spin text-lg text-gray-400 mx-auto mb-2" />
                                            <p className="text-xs text-gray-600">Chargement des messages...</p>
                                        </div>
                                    ) : recentMessages.length > 0 ? (
                                        recentMessages.slice(0, 2).map((message) => (
                                            <div key={message.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {message.patient?.prenom || message.sender?.name || 'Patient'}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {message.contenu || message.content || message.message || 'Message reçu'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {message.timestamp ? 
                                                        new Date(message.timestamp).toLocaleString('fr-FR', { 
                                                            day: '2-digit', 
                                                            month: '2-digit', 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        }) : message.date_creation ? 
                                                        new Date(message.date_creation).toLocaleString('fr-FR', { 
                                                            day: '2-digit', 
                                                            month: '2-digit', 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        }) : 'Récemment'
                                                    }
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4">
                                            <FaComments className="text-2xl text-gray-300 mx-auto mb-2" />
                                            <p className="text-xs text-gray-600">Aucun message récent</p>
                                        </div>
                                    )}
                                    
                                    <div className="text-center">
                                        <button 
                                            onClick={() => setActiveSection('messaging')}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            Voir toutes les conversations
                                        </button>
                                    </div>
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
                
                {/* Navigation tabs */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex space-x-8">
                            <button
                                onClick={() => setActiveSection('dashboard')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeSection === 'dashboard'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <FaChartBar className="inline w-4 h-4 mr-2" />
                                Tableau de Bord
                            </button>
                            
                            <button
                                onClick={() => setActiveSection('messaging')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeSection === 'messaging'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <FaComments className="inline w-4 h-4 mr-2" />
                                Messagerie
                            </button>
                            
                            <button
                                onClick={() => setActiveSection('patients')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeSection === 'patients'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <FaUserInjured className="inline w-4 h-4 mr-2" />
                                Patients
                            </button>
                            
                            <button
                                onClick={() => setActiveSection('agenda')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeSection === 'agenda'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <FaCalendarAlt className="inline w-4 h-4 mr-2" />
                                Agenda
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Contenu principal */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {renderContent()}
                </div>
            </div>
        </ProtectedMedecinRoute>
    );
}

export default Medecin;