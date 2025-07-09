import React from "react";
import Connexion from "../../pages/connexion";

function Header() {
    return (
        <header className="fixed top-0 w-full z-50">
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
                            <a href="/" className="text-blue-600 font-medium">Accueil</a>
                            <a href="#" className="text-gray-600 hover:text-blue-600">Services</a>
                            <a href="#" className="text-gray-600 hover:text-blue-600">Médecins</a>
                            <a href="#" className="text-gray-600 hover:text-blue-600">À propos</a>
                            <a href="/connexion" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300">Connexion</a>
                        </div>
                        <div className="md:hidden flex items-center">
                            <button className="text-gray-500 hover:text-gray-600">
                                <i className="fas fa-bars text-2xl"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

export default Header;