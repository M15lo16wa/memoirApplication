import React, { useState, useRef, useEffect } from "react";
// import Connexion from "../../pages/connexion";

function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

    // Fermer le menu si on clique en dehors
    useEffect(() => {
        function handleClickOutside(event) {
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
                        {/* Menu desktop */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="/" className="text-blue-600 font-medium">Accueil</a>
                            <a href="/dossier-medical" className="text-gray-600 hover:text-blue-600">Dossier Médical</a>
                            <a href="/medecin" className="text-gray-600 hover:text-blue-600">Médecins</a>
                            <a href="#" className="text-gray-600 hover:text-blue-600">À propos</a>
                            <a href="/connexion" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300">Connexion</a>
                        </div>
                        {/* Menu burger mobile */}
                        <div className="md:hidden flex items-center">
                            <button className="text-gray-500 hover:text-gray-600" onClick={() => setMobileMenuOpen((open) => !open)}>
                                <i className="fas fa-bars text-2xl"></i>
                            </button>
                        </div>
                    </div>
                </div>
                {/* Menu mobile */}
                {mobileMenuOpen && (
                    <div ref={mobileMenuRef} className="md:hidden fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 z-50 flex flex-col">
                        <div className="bg-white shadow-md w-64 max-w-full h-full p-6 flex flex-col">
                            <button className="self-end text-gray-500 text-2xl mb-6" onClick={() => setMobileMenuOpen(false)}>&times;</button>
                            <a href="/" className="mb-4 text-blue-600 font-medium text-base flex items-center">Accueil</a>
                            <a href="/dossier-medical" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center">Dossier Médical</a>
                            <a href="/medecin" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center">Médecins</a>
                            <a href="#" className="mb-4 text-gray-600 hover:text-blue-600 text-base flex items-center">À propos</a>
                            <a href="/connexion" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300 text-center">Connexion</a>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    )
}

export default Header;