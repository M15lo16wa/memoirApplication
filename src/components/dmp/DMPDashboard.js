import React, { useEffect, useState } from 'react';
import { useDMP } from '../../hooks/useDMP';
import { use2FA } from '../../hooks/use2FA';
import { FaHeartbeat, FaFileMedical, FaCalendarAlt, FaChartLine, FaUserMd, FaThermometerHalf, FaTint, FaWeight } from 'react-icons/fa';
import NotificationsStats from '../ui/NotificationsStats';
import * as dmpApi from '../../services/api/dmpApi';

// Protection 2FA pour l'accès aux dossiers patients
import Validate2FA from '../2fa/Validate2FA';

const DMPDashboard = () => {
    const [notificationsStats, setNotificationsStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    
    // Utilisation du hook centralisé use2FA
    const {
        show2FA,
        requires2FA,
        pendingAction,
        handle2FASuccess,
        handle2FACancel,
        with2FAProtection,
        reset2FA
    } = use2FA();
    
    const { 
        dmpData, 
        loading, 
        error,
        loadStatistiques,
        getRecentActivity,
        getLatestAutoMesures,
        getLatestDocuments,
        getStatistiquesResume,
        getUpcomingRendezVous
    } = useDMP();

    useEffect(() => {
        loadStatistiques();
        loadNotificationsStats();
    }, [loadStatistiques]);

    const loadNotificationsStats = async () => {
        try {
            setLoadingStats(true);
            const statsData = await dmpApi.getNotificationsStats();
            setNotificationsStats(statsData.data);
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques des notifications:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await dmpApi.marquerToutesNotificationsLues();
            await loadNotificationsStats(); // Recharger les stats
        } catch (error) {
            console.error('Erreur lors du marquage de toutes les notifications:', error);
        }
    };

    const handleViewAllNotifications = () => {
        // Naviguer vers l'onglet des droits d'accès
        // Cette fonction sera passée depuis le composant parent
        if (window.location.pathname.includes('/dmp')) {
            // Simuler un clic sur l'onglet droits d'accès
            const droitsAccesTab = document.querySelector('[data-tab="droits-acces"]');
            if (droitsAccesTab) {
                droitsAccesTab.click();
            }
        }
    };

    // Utilisation du wrapper 2FA centralisé pour protéger les accès aux dossiers patients
    const protectedLoadStatistiques = with2FAProtection(loadStatistiques, 'Chargement des statistiques');
    const protectedLoadNotificationsStats = with2FAProtection(loadNotificationsStats, 'Chargement des notifications');

    // Recharger les données quand les auto-mesures ou documents changent
    useEffect(() => {
        if (dmpData) {
            console.log('🔄 DMPDashboard - Données mises à jour:', {
                autoMesures: dmpData.autoMesures?.length || 0,
                documents: dmpData.documents?.length || 0
            });
        }
    }, [dmpData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong>Erreur:</strong> {error}
            </div>
        );
    }

    const resume = getStatistiquesResume();
    const latestMesures = getLatestAutoMesures(3);
    const latestDocs = getLatestDocuments(3);
    const upcomingRdv = getUpcomingRendezVous().slice(0, 3);

    // Debug: afficher les auto-mesures
    console.log('📊 DMPDashboard - Auto-mesures disponibles:', latestMesures);
    console.log('📊 DMPDashboard - Statistiques:', resume);

    const getMesureIcon = (type) => {
        switch (type) {
            case 'temperature': return <FaThermometerHalf className="text-orange-500" />;
            case 'glycemie': return <FaTint className="text-purple-500" />;
            case 'poids': return <FaWeight className="text-blue-500" />;
            default: return <FaHeartbeat className="text-red-500" />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* En-tête DMP */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                <h1 className="text-2xl font-bold">Mon Dossier Médical Partagé</h1>
                <p className="text-blue-100">
                    Bienvenue dans votre espace de santé personnalisé
                </p>
                {dmpData && (
                    <div className="mt-4 text-sm">
                        <p>Dernière mise à jour: {formatDate(dmpData.dateDerniereModification || new Date())}</p>
                        <p>Statut: <span className="font-semibold">{dmpData.statut || 'Actif'}</span></p>
                    </div>
                )}
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <FaHeartbeat className="text-red-500 text-2xl mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Auto-mesures</p>
                            <p className="text-2xl font-bold">{resume.totalAutoMesures}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <FaFileMedical className="text-blue-500 text-2xl mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Documents</p>
                            <p className="text-2xl font-bold">{resume.totalDocuments}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <FaCalendarAlt className="text-green-500 text-2xl mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Rendez-vous</p>
                            <p className="text-2xl font-bold">{resume.totalRendezVous}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <FaChartLine className="text-purple-500 text-2xl mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Historique</p>
                            <p className="text-2xl font-bold">{resume.totalHistorique}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistiques des notifications */}
            {!loadingStats && notificationsStats && (
                <NotificationsStats
                    stats={notificationsStats}
                    onViewAll={handleViewAllNotifications}
                    onMarkAllAsRead={handleMarkAllAsRead}
                />
            )}

            {/* Contenu principal en 2 colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Auto-mesures récentes */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FaHeartbeat className="text-red-500 mr-2" />
                        Auto-mesures Récentes
                    </h2>
                    <div className="space-y-3">
                        {latestMesures.length > 0 ? (
                            latestMesures.map((mesure, index) => (
                                <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                                    <div className="mr-3">
                                        {getMesureIcon(mesure.type)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{mesure.type ? mesure.type.replace('_', ' ') : 'Mesure'}</p>
                                        <p className="text-sm text-gray-600">
                                            {mesure.valeur} {mesure.unite}
                                            {mesure.valeur_secondaire && ` / ${mesure.valeur_secondaire} ${mesure.unite_secondaire}`}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {formatDate(mesure.date_mesure)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">Aucune auto-mesure récente</p>
                        )}
                    </div>
                </div>

                {/* Documents récents */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FaFileMedical className="text-blue-500 mr-2" />
                        Documents Récents
                    </h2>
                    <div className="space-y-3">
                        {latestDocs.length > 0 ? (
                            latestDocs.map((doc, index) => (
                                <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                                        <FaFileMedical className="text-blue-500 text-sm" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{doc.nom}</p>
                                        <p className="text-sm text-gray-600">{doc.type}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {formatDate(doc.createdAt)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">Aucun document récent</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Rendez-vous à venir */}
            {upcomingRdv.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FaCalendarAlt className="text-green-500 mr-2" />
                        Prochains Rendez-vous
                    </h2>
                    <div className="space-y-3">
                        {upcomingRdv.map((rdv, index) => (
                            <div key={index} className="flex items-center p-3 bg-green-50 rounded border-l-4 border-green-500">
                                <div className="mr-3">
                                    <FaUserMd className="text-green-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{rdv.titre}</p>
                                    <p className="text-sm text-gray-600">
                                        {rdv.medecin} - {rdv.etablissement}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">{formatDate(rdv.date)}</p>
                                    <p className="text-xs text-gray-500">{rdv.heure}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Activité récente */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <FaChartLine className="text-purple-500 mr-2" />
                    Activité Récente
                </h2>
                <div className="space-y-3">
                    {getRecentActivity(5).map((activite, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                                <p className="font-medium">{activite.titre}</p>
                                <p className="text-sm text-gray-600">{activite.description}</p>
                            </div>
                            <span className="text-xs text-gray-500">
                                {formatDate(activite.date)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Protection 2FA pour l'accès aux dossiers patients */}
            {show2FA && requires2FA && (
                <Validate2FA
                    onSuccess={handle2FASuccess}
                    onCancel={handle2FACancel}
                    isRequired={true}
                    message="Vérification 2FA requise pour accéder au tableau de bord DMP"
                />
            )}
        </div>
    );
};

export default DMPDashboard; 