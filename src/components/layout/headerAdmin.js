import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// gestion des services de deconnexion
import { me, logout } from "../../services/api/authApi";

function AdminHeader() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchProfile() {
            try {
                const data = await me();
                // Adapte selon la structure de la réponse de ton backend
                const userData = data.user || data.data?.user || data;
                setUser(userData);
                setRole(userData?.role);
            } catch (e) {
                setUser(null);
                setRole(null);
            }
        }
        fetchProfile();
    }, []);

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await logout();
            navigate('/connexion');
        } catch (error) {
            console.error('Erreur lors de la déconnexion :', error);
        }
    };
    // Fermer le menu si on clique en dehors
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setMobileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const isSecretaire = role === "secretaire";
    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <i className="fas fa-heartbeat text-2xl sm:text-3xl text-blue-600 mr-2" />
                            <span className="text-lg sm:text-xl font-bold text-gray-800">SantéSénégal</span>
                        </div>
                    </div>
                    {/* Menu desktop */}
                    <div className="hidden md:flex items-center space-x-4 sm:space-x-8">
                        {!isSecretaire && (
                            <>
                                <Link to="/admin" className="text-gray-600 hover:text-blue-600 text-sm sm:text-base"><i className="fas fa-tachometer-alt mr-1" /> Tableau de bord</Link>
                                <Link to="/utilisateurs" className="text-gray-600 hover:text-blue-600 text-sm sm:text-base"><i className="fas fa-users mr-1" /> Utilisateurs</Link>
                                <Link to="#" className="text-gray-600 hover:text-blue-600 text-sm sm:text-base"><i className="fas fa-chart-bar mr-1" /> Statistiques</Link>
                                <Link to="#" className="text-gray-600 hover:text-blue-600 text-sm sm:text-base"><i className="fas fa-file-alt mr-1" /> Rapports</Link>
                            </>
                        )}
                        {isSecretaire && (
                            <>
                                <Link to="/professionnels" className="text-gray-600 hover:text-blue-600 text-sm sm:text-base"><i className="fas fa-user-md mr-1" /> Professionnels de santé</Link>
                                <Link to="/rendez-vous" className="text-gray-600 hover:text-blue-600 text-sm sm:text-base"><i className="fas fa-calendar-alt mr-1" /> Rendez-vous</Link>
                                <Link to="/plannifier" className="text-gray-600 hover:text-blue-600 text-sm sm:text-base"><i className="fas fa-calendar-plus mr-1" /> Planifier RDV</Link>
                                <Link to="/dossiers-patients" className="text-gray-600 hover:text-blue-600 text-sm sm:text-base"><i className="fas fa-folder-open mr-1" /> Dossiers patients</Link>
                            </>
                        )}
                        <div className="relative" ref={menuRef}>
                            <div className="flex items-center cursor-pointer" onClick={() => setMenuOpen((open) => !open)}>
                                <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8004c563-31c9-43a6-8861-58b4af51887b.png" alt="Photo de profil administrateur" className="w-8 h-8 rounded-full" />
                                <div className="ml-2 text-left">
                                    <div className="font-semibold text-gray-800 text-xs">{user?.nom || 'Utilisateur'}</div>
                                    <div className="text-gray-500 text-xs capitalize">{role}</div>
                                </div>
                                <i className="fas fa-caret-down ml-2" />
                            </div>
                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                    <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i className="fas fa-user mr-2" /> Profil
                                    </Link>
                                    <Link to="/connexion" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={handleLogout}>
                                        <i className="fas fa-sign-out-alt mr-2" /> Déconnexion
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Menu mobile burger */}
                    <div className="md:hidden flex items-center">
                        <button className="text-gray-500 hover:text-gray-600" onClick={() => setMobileMenuOpen((open) => !open)}>
                            <i className="fas fa-bars text-2xl" />
                        </button>
                    </div>
                </div>
            </div>
            {/* Menu mobile */}
            {mobileMenuOpen && (
                <div ref={mobileMenuRef} className="md:hidden fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 z-50 flex flex-col">
                    <div className="bg-white shadow-md w-64 max-w-full h-full p-6 flex flex-col">
                        <button className="self-end text-gray-500 text-2xl mb-6" onClick={() => setMobileMenuOpen(false)}>&times;</button>
                        {!isSecretaire && (
                            <>
                                <Link to="/admin" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center"><i className="fas fa-tachometer-alt mr-2" /> Tableau de bord</Link>
                                <Link to="/utilisateurs" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center"><i className="fas fa-users mr-2" /> Utilisateurs</Link>
                                <Link to="#" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center"><i className="fas fa-chart-bar mr-2" /> Statistiques</Link>
                                <Link to="#" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center"><i className="fas fa-file-alt mr-2" /> Rapports</Link>
                            </>
                        )}
                        {isSecretaire && (
                            <>
                                <Link to="/professionnels" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center"><i className="fas fa-user-md mr-2" /> Professionnels de santé</Link>
                                <Link to="/rendez-vous" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center"><i className="fas fa-calendar-alt mr-2" /> Rendez-vous</Link>
                                <Link to="/plannifier" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center"><i className="fas fa-calendar-plus mr-2" /> Planifier RDV</Link>
                                <Link to="/dossiers-patients" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center"><i className="fas fa-folder-open mr-2" /> Dossiers patients</Link>
                            </>
                        )}
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center mb-2">
                                <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8004c563-31c9-43a6-8861-58b4af51887b.png" alt="Photo de profil administrateur" className="w-8 h-8 rounded-full mr-2" />
                                <span className="font-semibold text-gray-800">{user?.nom || 'Utilisateur'}</span>
                                <span className="ml-2 text-gray-500 text-xs capitalize">{role}</span>
                            </div>
                            <Link to="/admin" className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"><i className="fas fa-user mr-2" /> Profil</Link>
                            <Link to="/connexion" className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded" onClick={handleLogout}><i className="fas fa-sign-out-alt mr-2" /> Déconnexion</Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}

export default AdminHeader;