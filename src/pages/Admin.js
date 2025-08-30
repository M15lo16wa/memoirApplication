import React, { useEffect, useState } from "react";
import AdminHeader from "../components/layout/headerAdmin";
import { 
    getAllUsers, 
    getAllPatients, 
    getAllHealthcareProfessionals,
    getAllRoles,
    getAllHospitals,
    getAllMedicalServices
} from "../services/api/admin";

function Admin() {
    const [stats, setStats] = useState({
        users: 0,
        patients: 0,
        professionals: 0,
        roles: 0,
        hospitals: 0,
        services: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const extractData = (response, key) => {
    console.log(`🔍 Extraction des données pour ${key}:`, response);
    
    if (!response) {
        console.warn(`⚠️ Pas de réponse pour ${key}`);
        return [];
    }
    
    // Essayer différentes structures de réponse
    if (response.data && response.data[key]) {
        console.log(`✅ Données trouvées dans response.data.${key}`);
        return Array.isArray(response.data[key]) ? response.data[key] : [];
    }
    
    if (response.data && Array.isArray(response.data)) {
        console.log(`✅ Données trouvées dans response.data (array)`);
        return response.data;
    }
    
    if (Array.isArray(response)) {
        console.log(`✅ Données trouvées dans response (array direct)`);
        return response;
    }
    
    // Chercher dans toutes les propriétés de response.data
    if (response.data && typeof response.data === 'object') {
        for (const [propKey, value] of Object.entries(response.data)) {
            if (Array.isArray(value) && value.length > 0) {
                // Vérifier si c'est un tableau de professionnels
                const firstItem = value[0];
                if (firstItem && (firstItem.nom || firstItem.prenom || firstItem.specialite)) {
                    console.log(`✅ Données trouvées dans response.data.${propKey}`);
                    return value;
                }
            }
        }
    }
    
    console.warn(`⚠️ Aucune donnée trouvée pour ${key}`);
    return [];
};

const loadDashboardData = async () => {
    try {
        setLoading(true);
        
        console.log('🔄 Chargement des données du tableau de bord...');
        
        // Charger toutes les données en parallèle
        const [usersRes, patientsRes, professionalsRes, rolesRes, hospitalsRes, servicesRes] = await Promise.all([
            getAllUsers(),
            getAllPatients(),
            getAllHealthcareProfessionals(),
            getAllRoles(),
            getAllHospitals(),
            getAllMedicalServices()
        ]);

        console.log('📊 Réponses reçues:');
        console.log('   - Users:', usersRes);
        console.log('   - Patients:', patientsRes);
        console.log('   - Professionals:', professionalsRes);
        console.log('   - Roles:', rolesRes);
        console.log('   - Hospitals:', hospitalsRes);
        console.log('   - Services:', servicesRes);

        // ✅ UTILISER extractData au lieu de l'ancienne logique
        const users = extractData(usersRes, 'users');
        const patients = extractData(patientsRes, 'patients');
        const professionals = extractData(professionalsRes, 'professionals');
        const roles = extractData(rolesRes, 'roles');
        const hospitals = extractData(hospitalsRes, 'hospitals');
        const services = extractData(servicesRes, 'services');

        console.log('�� Données extraites:');
        console.log('   - Users count:', users.length);
        console.log('   - Patients count:', patients.length);
        console.log('   - Professionals count:', professionals.length);
        console.log('   - Roles count:', roles.length);
        console.log('   - Hospitals count:', hospitals.length);
        console.log('   - Services count:', services.length);

        setStats({
            users: users.length,
            patients: patients.length,
            professionals: professionals.length,
            roles: roles.length,
            hospitals: hospitals.length,
            services: services.length
        });

        // AJOUTER les activites recentes
        const activities = [
            {
                id: 1,
                type: 'user',
                action: 'Nouvel utilisateur cree',
                description: 'Utilisateur ajoute au systeme',
                timestamp: new Date().toLocaleString(),
                icon: 'fas fa-user-plus',
                color: 'text-blue-600',
                bgColor: 'bg-blue-100'
            },
            {
                id: 2,
                type: 'patient',
                action: 'Nouveau patient enregistre',
                description: 'Patient ajoute a la base de donnees',
                timestamp: new Date(Date.now() - 3600000).toLocaleString(),
                icon: 'fas fa-user-injured',
                color: 'text-green-600',
                bgColor: 'bg-green-100'
            },
            {
                id: 3,
                type: 'professional',
                action: 'Professionnel de sante ajoute',
                description: 'Medecin ou infirmier enregistre',
                timestamp: new Date(Date.now() - 7200000).toLocaleString(),
                icon: 'fas fa-user-md',
                color: 'text-purple-600',
                bgColor: 'bg-purple-100'
            }
        ];

        setRecentActivity(activities);

        console.log('�� Statistiques définies:', {
            users: Array.isArray(users) ? users.length : 0,
            patients: Array.isArray(patients) ? patients.length : 0,
            professionals: Array.isArray(professionals) ? professionals.length : 0,
            roles: Array.isArray(roles) ? roles.length : 0,
            hospitals: Array.isArray(hospitals) ? hospitals.length : 0,
            services: Array.isArray(services) ? services.length : 0
        });

    } catch (error) {
        console.error('❌ Erreur lors du chargement du tableau de bord:', error);
        console.error('�� Détails de l\'erreur:', {
            message: error.message,
            response: error.response,
            status: error.response?.status
        });
    } finally {
        setLoading(false);
    }
};


    const getRoleDistribution = () => {
        // Simuler la distribution des rôles (à remplacer par des vraies données)
        return [
            { role: 'Médecins', count: Math.floor(stats.professionals * 0.6), color: 'bg-green-500' },
            { role: 'Infirmiers', count: Math.floor(stats.professionals * 0.4), color: 'bg-blue-500' },
            { role: 'Secrétaires', count: Math.floor(stats.users * 0.3), color: 'bg-purple-500' },
            { role: 'Patients', count: stats.patients, color: 'bg-orange-500' }
        ];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <AdminHeader />
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminHeader />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* En-tête du tableau de bord */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord Administrateur</h1>
                    <p className="text-gray-600">Vue d'ensemble de la plateforme et des activités récentes</p>
                </div>

                {/* Cartes de statistiques principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Utilisateurs */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <i className="fas fa-users text-blue-600 text-xl"></i>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center text-sm text-gray-500">
                                <i className="fas fa-arrow-up text-green-500 mr-1"></i>
                                <span>+12% ce mois</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Patients */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <i className="fas fa-user-injured text-green-600 text-xl"></i>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.patients}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center text-sm text-gray-500">
                                <i className="fas fa-arrow-up text-green-500 mr-1"></i>
                                <span>+8% ce mois</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Professionnels */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <i className="fas fa-user-md text-purple-600 text-xl"></i>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Professionnels</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.professionals}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center text-sm text-gray-500">
                                <i className="fas fa-arrow-up text-green-500 mr-1"></i>
                                <span>+15% ce mois</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Hôpitaux */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <i className="fas fa-hospital text-orange-600 text-xl"></i>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Hôpitaux</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.hospitals}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center text-sm text-gray-500">
                                <i className="fas fa-arrow-up text-green-500 mr-1"></i>
                                <span>+5% ce mois</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Graphiques et distributions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Distribution des rôles */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution des Rôles</h3>
                        <div className="space-y-3">
                            {getRoleDistribution().map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
                                        <span className="text-sm font-medium text-gray-700">{item.role}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Services médicaux */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Médicaux</h3>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.services}</div>
                            <p className="text-sm text-gray-600">Services disponibles</p>
                            <div className="mt-4">
                                <div className="flex items-center justify-center text-sm text-gray-500">
                                    <i className="fas fa-plus text-green-500 mr-1"></i>
                                    <span>3 nouveaux ce mois</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activités récentes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Activités Récentes</h3>
                    <div className="space-y-4">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                                <div className={`p-3 ${activity.bgColor} rounded-lg mr-4`}>
                                    <i className={`${activity.icon} ${activity.color} text-lg`}></i>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-gray-900">{activity.action}</h4>
                                    <p className="text-sm text-gray-600">{activity.description}</p>
                                </div>
                                <div className="text-sm text-gray-500">{activity.timestamp}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions rapides */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-sm transition-colors">
                        <div className="flex items-center">
                            <i className="fas fa-user-plus text-2xl mr-3"></i>
                            <div className="text-left">
                                <h4 className="font-semibold">Ajouter Utilisateur</h4>
                                <p className="text-sm opacity-90">Créer un nouvel utilisateur</p>
                            </div>
                        </div>
                    </button>

                    <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl shadow-sm transition-colors">
                        <div className="flex items-center">
                            <i className="fas fa-hospital text-2xl mr-3"></i>
                            <div className="text-left">
                                <h4 className="font-semibold">Gérer Hôpitaux</h4>
                                <p className="text-sm opacity-90">Administrer les établissements</p>
                            </div>
                        </div>
                    </button>

                    <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl shadow-sm transition-colors">
                        <div className="flex items-center">
                            <i className="fas fa-chart-line text-2xl mr-3"></i>
                            <div className="text-left">
                                <h4 className="font-semibold">Voir Rapports</h4>
                                <p className="text-sm opacity-90">Analyser les statistiques</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Admin;