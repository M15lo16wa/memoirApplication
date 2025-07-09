import React from "react";

function Footer() {
    return (
        <footer className="bg-gray-900 text-white pt-12 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
                <div className="flex items-center mb-4">
                    <i className="fas fa-heartbeat text-2xl text-blue-400 mr-2" />
                    <span className="text-xl font-bold">SantéSénégal</span>
                </div>
                <p className="text-gray-400 mb-4">Votre plateforme de santé connectée, moderne et accessible.</p>
                <div className="flex space-x-4">
                    <a href="#" className="text-gray-400 hover:text-white transition"><i className="fab fa-facebook-f" /></a>
                    <a href="#" className="text-gray-400 hover:text-white transition"><i className="fab fa-twitter" /></a>
                    <a href="#" className="text-gray-400 hover:text-white transition"><i className="fab fa-linkedin-in" /></a>
                    <a href="#" className="text-gray-400 hover:text-white transition"><i className="fab fa-instagram" /></a>
                </div>
                </div>
            <div>
                <h3 className="text-lg font-bold mb-4">Services</h3>
                <ul className="space-y-2">
                    <li><a href="#" className="text-gray-400 hover:text-white transition">Consultation en ligne</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition">Livraison de médicaments</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition">Suivi médical</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition">Rendez-vous en clinique</a></li>
                    </ul>
            </div>
            <div>
                <h3 className="text-lg font-bold mb-4">Entreprise</h3>
                <ul className="space-y-2">
                    <li><a href="#" className="text-gray-400 hover:text-white transition">À propos</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition">Carrières</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
                </ul>
            </div>
            <div>
                <h3 className="text-lg font-bold mb-4">Information légale</h3>
                <ul className="space-y-2">
                    <li><a href="#" className="text-gray-400 hover:text-white transition">Conditions d'utilisation</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition">Politique de confidentialité</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition">FAQ</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition">Assistance</a></li>
                    </ul>
            </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2025 SantéSénégal. Tous droits réservés.</p>
        </div>
    </div>
</footer>
    )
}

export default Footer;