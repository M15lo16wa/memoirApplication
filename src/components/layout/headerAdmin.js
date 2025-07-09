import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

function AdminHeader() {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Fermer le menu si on clique en dehors
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
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
                            <i className="fas fa-heartbeat text-3xl text-blue-600 mr-2" />
                            <span className="text-xl font-bold text-gray-800">SantéSénégal</span>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#" className="text-gray-600 hover:text-blue-600"><i className="fas fa-tachometer-alt mr-1" /> Tableau de bord</a>
                        <Link to="/utilisateurs" className="text-gray-600 hover:text-blue-600"><i className="fas fa-users mr-1" /> Utilisateurs</Link>
                        <a href="#" className="text-gray-600 hover:text-blue-600"><i className="fas fa-chart-bar mr-1" /> Statistiques</a>
                        <a href="#" className="text-gray-600 hover:text-blue-600"><i className="fas fa-file-alt mr-1" /> Rapports</a>
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
                    <div className="md:hidden flex items-center">
                        <button className="text-gray-500 hover:text-gray-600">
                            <i className="fas fa-bars text-2xl" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default AdminHeader;