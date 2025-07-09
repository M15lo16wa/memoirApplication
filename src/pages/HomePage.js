import React from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function HomePage() {
    const navigate = useNavigate();
    const handleRendezVousClick = () => {
        navigate("/rendezVous");
    }
    return (
        <div>
            <Header/>
            {/* section centrale de la page  */}
            <section className="hero-gradient text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-10 md:mb-0">
                            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">Votre santé entre de bonnes mains</h1>
                            <p className="text-xl mb-8 opacity-90">Connectez-vous avec les meilleurs professionnels de santé en ligne, 24h/24 et 7j/7.</p>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <button className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition duration-300" onClick={handleRendezVousClick}>Prendre rendez-vous</button>
                                <button className="px-6 py-3 border-2 border-white text-white font-medium rounded-md hover:bg-white hover:text-blue-600 transition duration-300">
                                    <i className="fas fa-play mr-2" /> Comment ça marche
                                </button>
                            </div>
                        </div>
                        <div className="md:w-1/2 flex justify-center">
                            <div className="relative w-full max-w-md">
                                <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/9af025aa-0a10-4336-b0c0-da199df9a143.png" alt="Groupe de médecins professionnels discutant ensemble dans un environnement hospitalier moderne" className="rounded-lg shadow-xl" />
                                <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-lg text-gray-800 w-64">
                                    <div className="flex items-center mb-2">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                            <i className="fas fa-user-md text-blue-600 text-xl" />
                                        </div>
                                        <div>
                                            <p className="font-bold">500+</p>
                                            <p className="text-sm text-gray-600">Professionnels</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                            <i className="fas fa-smile text-green-600 text-xl" />
                                        </div>
                                        <div>
                                            <p className="font-bold">50k+</p>
                                            <p className="text-sm text-gray-600">Patients satisfaits</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* la presentation des services actifs au niveau de la plateforme */}
            <section class="py-16 bg-white">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-14">
                        <h2 class="text-3xl font-bold text-gray-900 mb-4">Nos services de santé</h2>
                        <p class="text-xl text-gray-600 max-w-3xl mx-auto">Découvrez nos solutions complètes pour répondre à tous vos besoins médicaux en ligne.</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div class="feature-card bg-white rounded-xl shadow-md p-6 transition duration-300">
                            <div class="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-video text-blue-600 text-2xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3">Consultation en ligne</h3>
                            <p class="text-gray-600 mb-4">Discutez avec des médecins qualifiés en vidéo depuis chez vous, à tout moment.</p>
                            <a href="#" class="text-blue-600 font-medium flex items-center">En savoir plus <i class="fas fa-arrow-right ml-2"></i></a>
                        </div>
                        <div class="feature-card bg-white rounded-xl shadow-md p-6 transition duration-300">
                            <div class="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-pills text-purple-600 text-2xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3">Livraison de médicaments</h3>
                            <p class="text-gray-600 mb-4">Recevez vos ordonnances directement à votre domicile en toute sécurité.</p>
                            <a href="#" class="text-blue-600 font-medium flex items-center">
                                En savoir plus <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                        <div class="feature-card bg-white rounded-xl shadow-md p-6 transition duration-300">
                            <div class="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-heartbeat text-green-600 text-2xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3">Suivi médical</h3>
                            <p class="text-gray-600 mb-4">Accédez à votre dossier médical et suivez vos indicateurs de santé.</p>
                            <a href="#" class="text-blue-600 font-medium flex items-center">
                                En savoir plus <i class="fas fa-arrow-right ml-2"></i>
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