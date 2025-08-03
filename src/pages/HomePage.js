import React from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import AuthNotification from "../components/ui/AuthNotification";
import sante from '../assets/sante.jpg';

function HomePage() {
    const navigate = useNavigate();
    const handleRendezVousClick = () => {
        navigate("/rendezVous");
    }
    return (
        <div>
            <Header/>
            <AuthNotification />
            {/* section centrale de la page  */}
            <section className="hero-gradient text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 md:py-28">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-10 md:mb-0">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6">Votre santé entre de bonnes mains</h1>
                            <p className="text-lg sm:text-xl mb-8 opacity-90">Connectez-vous avec les meilleurs professionnels de santé en ligne, 24h/24 et 7j/7.</p>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <button className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition duration-300 text-base sm:text-lg" onClick={handleRendezVousClick}>Prendre rendez-vous</button>
                                <button className="px-6 py-3 border-2 border-white text-white font-medium rounded-md hover:bg-white hover:text-blue-600 transition duration-300 text-base sm:text-lg">
                                    <i className="fas fa-play mr-2" /> Comment ça marche
                                </button>
                            </div>
                        </div>
                        <div className="md:w-1/2 flex justify-center mt-8 md:mt-0">
    <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
        <img 
            src={sante} 
            alt="Fiche de soin medicale" 
            className="rounded-lg shadow-xl w-full object-cover" 
        />
        <div className="absolute -bottom-6 -right-2 sm:-right-6 bg-white p-4 rounded-lg shadow-lg text-gray-800 w-56 sm:w-64">
            <div className="flex items-center mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-user-md text-blue-600 text-lg sm:text-xl" />
                </div>
                <div>
                    <p className="font-bold text-base sm:text-lg">500+</p>
                    <p className="text-xs sm:text-sm text-gray-600">Professionnels</p>
                </div>
            </div>
            <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-smile text-green-600 text-lg sm:text-xl" />
                </div>
                <div>
                    <p className="font-bold text-base sm:text-lg">50k+</p>
                    <p className="text-xs sm:text-sm text-gray-600">Patients satisfaits</p>
                </div>
            </div>
        </div>
    </div>
</div>
                    </div>
                </div>
            </section>
            {/* la presentation des services actifs au niveau de la plateforme */}
            <section className="py-10 sm:py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10 sm:mb-14">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Nos services de santé</h2>
                        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">Découvrez nos solutions complètes pour répondre à tous vos besoins médicaux en ligne.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        <div className="feature-card bg-white rounded-xl shadow-md p-4 sm:p-6 transition duration-300 flex flex-col h-full">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <i className="fas fa-video text-blue-600 text-xl sm:text-2xl"></i>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Consultation en ligne</h3>
                            <p className="text-gray-600 mb-4 text-sm sm:text-base">Discutez avec des médecins qualifiés en vidéo depuis chez vous, à tout moment.</p>
                            <a href="#" className="text-blue-600 font-medium flex items-center text-sm sm:text-base">En savoir plus <i className="fas fa-arrow-right ml-2"></i></a>
                        </div>
                        <div className="feature-card bg-white rounded-xl shadow-md p-4 sm:p-6 transition duration-300 flex flex-col h-full">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <i className="fas fa-pills text-purple-600 text-xl sm:text-2xl"></i>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Prescriptions médicales</h3>
                            <p className="text-gray-600 mb-4 text-sm sm:text-base">Recevez vos ordonnances directement à votre domicile en toute sécurité.</p>
                            <a href="#" className="text-blue-600 font-medium flex items-center text-sm sm:text-base">
                                En savoir plus <i className="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                        <div className="feature-card bg-white rounded-xl shadow-md p-4 sm:p-6 transition duration-300 flex flex-col h-full">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <i className="fas fa-heartbeat text-green-600 text-xl sm:text-2xl"></i>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Suivi médical</h3>
                            <p className="text-gray-600 mb-4 text-sm sm:text-base">Accédez à votre dossier médical et suivez vos indicateurs de santé.</p>
                            <a href="#" className="text-blue-600 font-medium flex items-center text-sm sm:text-base">
                                En savoir plus <i className="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
            <Footer/>
        </div>
        
    );
}

export default HomePage;