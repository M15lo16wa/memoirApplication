import React, { useEffect, useState } from 'react';
import { FaUserInjured, FaCalendarAlt, FaComments, FaEnvelope, FaUserMd, FaHospital, FaClock, FaCalendarDay, FaList, FaChartBar } from 'react-icons/fa';
import * as rendezVousApi from '../../services/api/rendezVous';
import { signalingService } from '../../messaging';

const MedecinDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dashboardData, setDashboardData] = useState({
        patients: [],
        rendezVous: [],
        conversations: [],
        messages: [],
        notifications: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Récupérer les données du médecin connecté
    const getMedecinData = () => {
        try {
            const medecinData = localStorage.getItem('medecin');
            if (medecinData) {
                return JSON.parse(medecinData);
            }
            return null;
        } catch (e) {
            console.error('Erreur lors de la récupération des données du médecin:', e);
            return null;
        }
    };

    // Charger les données du tableau de bord
    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const medecin = getMedecinData();
            if (!medecin) {
                throw new Error('Données du médecin non disponibles');
            }

            console.log('🔍 Chargement du tableau de bord pour le médecin:', medecin.id_professionnel);

            // Charger les patients du médecin
            let patientsResponse;
            try {
                console.log('📊 Tentative de chargement des patients...');
                patientsResponse = await rendezVousApi.getPatientsByMedecin(medecin.id_professionnel);
                console.log('📊 Patients récupérés:', patientsResponse);
            } catch (error) {
                console.warn('⚠️ Impossible de charger les patients:', error);
                console.warn('⚠️ Détails de l\'erreur:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                patientsResponse = { data: { patients: [] } };
            }

            // Charger les rendez-vous du médecin
            let rdvResponse;
            try {
                console.log('📅 Tentative de chargement des rendez-vous...');
                rdvResponse = await rendezVousApi.getRendezVousByMedecin(medecin.id_professionnel);
                console.log('📅 Rendez-vous récupérés:', rdvResponse);
            } catch (error) {
                console.warn('⚠️ Impossible de charger les rendez-vous:', error);
                console.warn('⚠️ Détails de l\'erreur:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                rdvResponse = { data: { rendezVous: [] } };
            }

            // Charger les conversations du médecin
            let conversationsResponse;
            try {
                console.log('💬 Tentative de chargement des conversations...');
                conversationsResponse = await signalingService.getUserConversations();
                console.log('💬 Conversations récupérées:', conversationsResponse);
            } catch (error) {
                console.warn('⚠️ Impossible de charger les conversations:', error);
                console.warn('⚠️ Détails de l\'erreur:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                conversationsResponse = { conversations: [] };
            }

            // Charger les messages récents
            let messagesResponse;
            try {
                console.log('📨 Tentative de chargement des messages...');
                messagesResponse = await rendezVousApi.getMessagesRecents(medecin.id_professionnel);
                console.log('📨 Messages récupérés:', messagesResponse);
            } catch (error) {
                console.warn('⚠️ Impossible de charger les messages:', error);
                console.warn('⚠️ Détails de l\'erreur:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                messagesResponse = { data: { messages: [] } };
            }

            // Charger les notifications
            let notificationsResponse;
            try {
                console.log('🔔 Tentative de chargement des notifications...');
                notificationsResponse = await rendezVousApi.getNotificationsByMedecin(medecin.id_professionnel);
                console.log('🔔 Notifications récupérées:', notificationsResponse);
            } catch (error) {
                console.warn('⚠️ Impossible de charger les notifications:', error);
                console.warn('⚠️ Détails de l\'erreur:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                notificationsResponse = { data: { notifications: [] } };
            }

            setDashboardData({
                patients: patientsResponse?.data?.patients || [],
                rendezVous: rdvResponse?.data?.rendezVous || [],
                conversations: conversationsResponse?.conversations || [],
                messages: messagesResponse?.data?.messages || [],
                notifications: notificationsResponse?.data?.notifications || []
            });

        } catch (error) {
            console.error('❌ Erreur lors du chargement du tableau de bord:', error);
            setError(`Erreur lors du chargement: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    // Calculer les statistiques
    const calculateStats = () => {
        const { patients, rendezVous, conversations, messages, notifications } = dashboardData;
        
        const rdvAujourdhui = rendezVous.filter(rdv => {
            const rdvDate = new Date(rdv.date);
            const aujourdhui = new Date();
            return rdvDate.toDateString() === aujourdhui.toDateString();
        });

        const rdvCetteSemaine = rendezVous.filter(rdv => {
            const rdvDate = new Date(rdv.date);
            const aujourdhui = new Date();
            const finSemaine = new Date(aujourdhui.getTime() + 7 * 24 * 60 * 60 * 1000);
            return rdvDate >= aujourdhui && rdvDate <= finSemaine;
        });

        return {
            totalPatients: patients.length,
            rdvAujourdhui: rdvAujourdhui.length,
            rdvCetteSemaine: rdvCetteSemaine.length,
            totalConversations: conversations.length,
            messagesNonLus: messages.filter(msg => !msg.lu).length,
            notificationsNonLues: notifications.filter(notif => !notif.lue).length
        };
    };

    // Formater les dates
    const formatDate = (dateString) => {
        try {
            if (!dateString) return 'Date non disponible';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Date invalide';
            
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Erreur de formatage de date:', error);
            return 'Date invalide';
        }
    };

    // Formater l'heure
    const formatTime = (timeString) => {
        try {
            if (!timeString) return '';
            return timeString.substring(0, 5); // Format HH:MM
        } catch (error) {
            return '';
        }
    };

    // Grouper les rendez-vous par date pour l'agenda
    const groupRendezVousByDate = () => {
        const { rendezVous } = dashboardData;
        const grouped = {};
        
        rendezVous.forEach(rdv => {
            const date = rdv.date || rdv.appointmentDate;
            if (date) {
                const dateKey = new Date(date).toDateString();
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push(rdv);
            }
        });
        
        return grouped;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Chargement du tableau de bord...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-6 mb-6">
                <div className="flex items-center justify-between">
                    <span className="text-red-800 text-sm">
                        <strong>Erreur:</strong> {error}
                    </span>
                    <button
                        onClick={loadDashboardData}
                        className="text-red-600 hover:text-red-800 text-sm underline"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const stats = calculateStats();
    const medecin = getMedecinData();
    const rendezVousGroupes = groupRendezVousByDate();

    // Composant pour l'onglet Dashboard
    const DashboardTab = () => (
        <div className="space-y-6">
            {/* En-tête du tableau de bord médecin */}
            <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-lg">
                <h1 className="text-2xl font-bold">Tableau de Bord Médecin</h1>
                <p className="text-green-100">
                    Bienvenue, Dr. {medecin?.prenom} {medecin?.nom}
                </p>
                {medecin && (
                    <div className="mt-4 text-sm">
                        <p>Spécialité: <span className="font-semibold">{medecin.specialite || 'Non spécifiée'}</span></p>
                        <p>Service: <span className="font-semibold">{medecin.service || 'Non spécifié'}</span></p>
                    </div>
                )}
            </div>

            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Patients */}
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <FaUserInjured className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Patients</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.totalPatients}</p>
                        </div>
                    </div>
                </div>

                {/* Rendez-vous restants */}
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                            <FaCalendarAlt className="text-green-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">RDV restants</p>
                            <p className="text-3xl font-bold text-green-600">{stats.rdvCetteSemaine}</p>
                            <p className="text-xs text-gray-500">Cette semaine</p>
                        </div>
                    </div>
                </div>

                {/* Conversations */}
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                            <FaComments className="text-purple-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Conversations</p>
                            <p className="text-3xl font-bold text-purple-600">{stats.totalConversations}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages récents */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center">
                        <FaEnvelope className="text-blue-500 mr-2" />
                        Messages Récents
                    </h2>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Voir tout
                    </button>
                </div>
                
                <div className="space-y-3">
                    {dashboardData.messages.length > 0 ? (
                        dashboardData.messages.slice(0, 3).map((message, index) => (
                            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <FaUserInjured className="text-blue-600 text-sm" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">
                                        {message.expediteur_nom || 'Patient'}
                                    </p>
                                    <p className="text-xs text-gray-600 truncate">
                                        {message.contenu || message.message || 'Aucun contenu'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-500">
                                        {formatDate(message.created_at || message.date_creation)}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <FaEnvelope className="text-2xl mx-auto mb-2 opacity-50" />
                            <p>Aucun message récent</p>
                        </div>
                    )}
                </div>

                {/* Bouton d'accès à la messagerie */}
                <div className="mt-4 text-center">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center mx-auto">
                        <FaComments className="mr-2" />
                        Accéder à la messagerie
                    </button>
                </div>
            </div>

            {/* Rendez-vous à venir */}
            {dashboardData.rendezVous.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FaCalendarAlt className="text-green-500 mr-2" />
                        Prochains Rendez-vous
                    </h2>
                    <div className="space-y-3">
                        {dashboardData.rendezVous
                            .filter(rdv => new Date(rdv.date || rdv.appointmentDate) > new Date())
                            .sort((a, b) => new Date(a.date || a.appointmentDate) - new Date(b.date || b.appointmentDate))
                            .slice(0, 3)
                            .map((rdv, index) => (
                                <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                                    <div className="mr-3">
                                        <FaUserInjured className="text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            {rdv.patient_nom || rdv.patient?.lastName || 'Patient'} {rdv.patient_prenom || rdv.patient?.firstName || ''}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {rdv.motif || rdv.reason || 'Rendez-vous'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            {formatDate(rdv.date || rdv.appointmentDate)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatTime(rdv.heure || rdv.appointmentTime)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Patients récents */}
            {dashboardData.patients.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FaUserInjured className="text-blue-500 mr-2" />
                        Patients Récents
                    </h2>
                    <div className="space-y-3">
                        {dashboardData.patients.slice(0, 3).map((patient, index) => (
                            <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <FaUserInjured className="text-blue-600 text-sm" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">
                                        {patient.nom || patient.lastName} {patient.prenom || patient.firstName}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {patient.date_naissance || patient.birthDate ? 
                                            `Né(e) le ${formatDate(patient.date_naissance || patient.birthDate)}` : 
                                            'Date de naissance non disponible'
                                        }
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-500">
                                        ID: {patient.id_patient || patient.id}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // Composant pour l'onglet Agenda
    const AgendaTab = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-lg">
                <h1 className="text-2xl font-bold">Agenda Médecin</h1>
                <p className="text-purple-100">
                    Gestion des rendez-vous et planning - Dr. {medecin?.prenom} {medecin?.nom}
                </p>
            </div>

            {/* Vue calendrier */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <FaCalendarDay className="text-purple-500 mr-2" />
                    Calendrier des Rendez-vous
                </h2>
                
                {Object.keys(rendezVousGroupes).length > 0 ? (
                    <div className="space-y-4">
                        {Object.entries(rendezVousGroupes)
                            .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                            .map(([date, rdvs]) => (
                                <div key={date} className="border rounded-lg p-4">
                                    <h3 className="font-semibold text-lg mb-3 text-gray-800">
                                        {new Date(date).toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h3>
                                    <div className="space-y-2">
                                        {rdvs
                                            .sort((a, b) => (a.heure || a.appointmentTime || '').localeCompare(b.heure || b.appointmentTime || ''))
                                            .map((rdv, index) => (
                                                <div key={index} className="flex items-center p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                                                    <div className="mr-3">
                                                        <FaClock className="text-purple-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium">
                                                            {rdv.heure || rdv.appointmentTime || 'Heure non spécifiée'}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {rdv.patient_nom || rdv.patient?.lastName || 'Patient'} {rdv.patient_prenom || rdv.patient?.firstName || ''}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {rdv.motif || rdv.reason || 'Rendez-vous'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            rdv.statut === 'confirme' ? 'bg-green-100 text-green-800' :
                                                            rdv.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {rdv.statut === 'confirme' ? 'Confirmé' :
                                                             rdv.statut === 'en_attente' ? 'En attente' :
                                                             rdv.statut || 'Non défini'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <FaCalendarAlt className="text-4xl mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Aucun rendez-vous programmé</p>
                        <p className="text-sm">Votre agenda est vide pour le moment</p>
                    </div>
                )}
            </div>

            {/* Statistiques de l'agenda */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                            <FaCalendarAlt className="text-green-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total RDV</p>
                            <p className="text-3xl font-bold text-green-600">{dashboardData.rendezVous.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <FaClock className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Aujourd'hui</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.rdvAujourdhui}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                            <FaCalendarDay className="text-purple-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Cette semaine</p>
                            <p className="text-3xl font-bold text-purple-600">{stats.rdvCetteSemaine}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Navigation par onglets */}
            <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'dashboard'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <FaChartBar className="inline mr-2" />
                            Tableau de Bord
                        </button>
                        <button
                            onClick={() => setActiveTab('agenda')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'agenda'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <FaCalendarDay className="inline mr-2" />
                            Agenda
                        </button>
                    </nav>
                </div>
                
                <div className="p-6">
                    {activeTab === 'dashboard' ? <DashboardTab /> : <AgendaTab />}
                </div>
            </div>

            {/* Bouton de rafraîchissement */}
            <div className="text-center">
                <button
                    onClick={loadDashboardData}
                    disabled={loading}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                    {loading ? '⏳' : '🔄'} Rafraîchir les données
                </button>
            </div>

            {/* Informations de debug */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">🔍 Informations de Debug</h3>
                <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Onglet actif:</strong> {activeTab === 'dashboard' ? 'Tableau de Bord' : 'Agenda'}</p>
                    <p><strong>Patients chargés:</strong> {dashboardData.patients.length}</p>
                    <p><strong>Rendez-vous chargés:</strong> {dashboardData.rendezVous.length}</p>
                    <p><strong>Conversations chargées:</strong> {dashboardData.conversations.length}</p>
                    <p><strong>Messages chargés:</strong> {dashboardData.messages.length}</p>
                    <p><strong>Notifications chargées:</strong> {dashboardData.notifications.length}</p>
                </div>
            </div>
        </div>
    );
};

export default MedecinDashboard;
