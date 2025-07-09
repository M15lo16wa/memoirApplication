import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

function AdminHeader() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const mobileMenuRef = useRef(null);

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
                        <a href="#" className="text-gray-600 hover:text-blue-600 text-sm sm:text-base"><i className="fas fa-tachometer-alt mr-1" /> Tableau de bord</a>
                        <Link to="/utilisateurs" className="text-gray-600 hover:text-blue-600 text-sm sm:text-base"><i className="fas fa-users mr-1" /> Utilisateurs</Link>
                        <a href="#" className="text-gray-600 hover:text-blue-600 text-sm sm:text-base"><i className="fas fa-chart-bar mr-1" /> Statistiques</a>
                        <a href="#" className="text-gray-600 hover:text-blue-600 text-sm sm:text-base"><i className="fas fa-file-alt mr-1" /> Rapports</a>
                        <div className="relative" ref={menuRef}>
                            <div className="flex items-center cursor-pointer" onClick={() => setMenuOpen((open) => !open)}>
                                <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8004c563-31c9-43a6-8861-58b4af51887b.png" alt="Photo de profil administrateur" className="w-8 h-8 rounded-full" />
                                <i className="fas fa-caret-down ml-2" />
                            </div>
                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i className="fas fa-user mr-2" /> Profil
                                    </a>
                                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i className="fas fa-sign-out-alt mr-2" /> Déconnexion
                                    </a>
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
                        <a href="#" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center"><i className="fas fa-tachometer-alt mr-2" /> Tableau de bord</a>
                        <Link to="/utilisateurs" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center"><i className="fas fa-users mr-2" /> Utilisateurs</Link>
                        <a href="#" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center"><i className="fas fa-chart-bar mr-2" /> Statistiques</a>
                        <a href="#" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center"><i className="fas fa-file-alt mr-2" /> Rapports</a>
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center mb-2">
                                <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8004c563-31c9-43a6-8861-58b4af51887b.png" alt="Photo de profil administrateur" className="w-8 h-8 rounded-full mr-2" />
                                <span className="font-semibold text-gray-800">Admin</span>
                            </div>
                            <a href="#" className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"><i className="fas fa-user mr-2" /> Profil</a>
                            <a href="#" className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"><i className="fas fa-sign-out-alt mr-2" /> Déconnexion</a>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}

export default AdminHeader;