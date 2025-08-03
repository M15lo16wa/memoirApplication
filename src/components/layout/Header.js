import React, { useState, useRef, useEffect } from "react";

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

    // Fermer le menu mobile quand la fenêtre devient plus grande
    useEffect(() => {
        function handleResize() {
            if (window.innerWidth >= 768 && mobileMenuOpen) {
                setMobileMenuOpen(false);
            }
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [mobileMenuOpen]);

    const navLinks = [
        { href: "/", text: "Accueil", isActive: true },
        { href: "/dmp", text: "Mon DMP" },
        { href: "/medecin", text: "Médecins" },
        { href: "#", text: "À propos" }
    ];

    return (
        <header className="fixed top-0 w-full z-50">
            <nav className="bg-white shadow-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center">
                            <i className="fas fa-heartbeat text-2xl sm:text-3xl text-blue-600 mr-2" />
                            <span className="text-lg sm:text-xl font-bold text-gray-800">
                                SantéSénégal
                            </span>
                        </div>

                        {/* Menu desktop - Tablette et plus */}
                        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
                            {navLinks.map((link, index) => (
                                <a 
                                    key={index}
                                    href={link.href} 
                                    className={`text-sm lg:text-base font-medium transition-colors duration-200 ${
                                        link.isActive 
                                            ? 'text-blue-600' 
                                            : 'text-gray-600 hover:text-blue-600'
                                    }`}
                                >
                                    {link.text}
                                </a>
                            ))}
                            <a 
                                href="/connexion" 
                                className="px-4 py-2 text-sm lg:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                Connexion
                            </a>
                        </div>

                        {/* Menu burger pour mobile */}
                        <div className="md:hidden" ref={mobileMenuRef}>
                            <button 
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                aria-expanded="false"
                            >
                                <span className="sr-only">Ouvrir le menu principal</span>
                                {/* Icône hamburger avec animation */}
                                <div className="w-6 h-6 relative">
                                    <span className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : 'translate-y-0'}`}></span>
                                    <span className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out translate-y-1.5 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                                    <span className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? '-rotate-45 translate-y-1.5' : 'translate-y-3'}`}></span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Menu mobile déroulant */}
                <div className={`md:hidden transition-all duration-300 ease-in-out ${
                    mobileMenuOpen 
                        ? 'max-h-96 opacity-100' 
                        : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                    <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg border-t border-gray-100">
                        {navLinks.map((link, index) => (
                            <a 
                                key={index}
                                href={link.href} 
                                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                                    link.isActive 
                                        ? 'text-blue-600 bg-blue-50' 
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.text}
                            </a>
                        ))}
                        <div className="pt-2">
                            <a 
                                href="/connexion" 
                                className="block w-full text-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Connexion
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}

export default Header;