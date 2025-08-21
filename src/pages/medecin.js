import React, { useState, useEffect } from "react";
import MedHeader from "../components/layout/headerMed";
import MedecinMessaging from "../components/messaging/MedecinMessaging";
import MessagingDemo from "../components/messaging/MessagingDemo";
import { ProtectedMedecinRoute } from "../services/api/protectedRoute";
import { FaComments, FaCalendarAlt, FaUserInjured, FaChartBar, FaSearch, FaFlask } from "react-icons/fa";

function Medecin() {
    const [activeSection, setActiveSection] = useState('dashboard');
    
    // Détecter le hash dans l'URL pour ouvrir directement la messagerie
    useEffect(() => {
        if (window.location.hash === '#messaging') {
            setActiveSection('messaging');
        }
    }, []);

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
                            />
                            <button className="bg-indigo-600 text-white px-4 py-2 rounded-r-md">
                                Rechercher
                            </button>
                        </div>
                        <p className="text-gray-600">Fonctionnalité de recherche de patients - À implémenter</p>
                    </div>
                );
            case 'agenda':
                return (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Agenda du Jour</h3>
                        <p className="text-gray-600">Vue rapide de votre agenda - Voir l'agenda complet</p>
                    </div>
                );
            case 'demo':
                return (
                    <div className="space-y-6">
                        <MessagingDemo />
                    </div>
                );
            default:
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Statistiques rapides */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <FaUserInjured className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-2xl font-semibold text-gray-900">24</p>
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
                                            <p className="text-2xl font-semibold text-gray-900">8</p>
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
                                            <p className="text-2xl font-semibold text-gray-900">5</p>
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
                                    />
                                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-r-md">
                                        Rechercher
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
                                    <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                        <p className="text-sm font-medium text-gray-900">Jean Dupont</p>
                                        <p className="text-xs text-gray-600">Question sur ordonnance</p>
                                        <p className="text-xs text-gray-500 mt-1">Il y a 2h</p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                                        <p className="text-sm font-medium text-gray-900">Marie Martin</p>
                                        <p className="text-xs text-gray-600">Résultats d'analyse</p>
                                        <p className="text-xs text-gray-500 mt-1">Il y a 4h</p>
                                    </div>
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
                            
                            <button
                                onClick={() => setActiveSection('demo')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeSection === 'demo'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <FaFlask className="inline w-4 h-4 mr-2" />
                                Démo Messagerie
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