import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaArrowLeft } from 'react-icons/fa';
import { FaUserDoctor, FaUserInjured } from 'react-icons/fa6';

function Connexion() {
    const [email, setEmail] = useState("");
    const [numeroCarte, setNumeroCarte] = useState("");
    const [mdp, setMotDePasse] = useState("");
    const [error, setError] = useState("");
    const [selectedProfile, setSelectedProfile] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        
        if (selectedProfile === 'patient' && (!numeroCarte || !mdp)) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        if (selectedProfile === 'professionnel' && (!email || !mdp)) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        // Logique de connexion
        console.log('Tentative de connexion :', { 
            profile: selectedProfile,
            identifiant: selectedProfile === 'patient' ? numeroCarte : email,
            mdp 
        });

        // Redirection après connexion réussie
        navigate(selectedProfile === 'patient' ? '/espace-patient' : '/espace-pro');
    };

    const renderProfileSelection = () => (
        <div className="text-center p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Je suis un(e) :</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                <button
                    type="button"
                    onClick={() => setSelectedProfile('patient')}
                    className={`relative rounded-lg border-2 p-6 flex flex-col items-center transition-all duration-200 ${selectedProfile === 'patient' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
                >
                    <FaUserInjured className="h-10 w-10 text-blue-600 mb-3" />
                    <span className="text-base font-medium text-gray-900">Patient</span>
                    <p className="mt-1 text-sm text-gray-500">Numéro de carte d'assurance</p>
                    {selectedProfile === 'patient' && (
                        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => setSelectedProfile('professionnel')}
                    className={`relative rounded-lg border-2 p-6 flex flex-col items-center transition-all duration-200 ${selectedProfile === 'professionnel' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
                >
                    <FaUserDoctor className="h-10 w-10 text-blue-600 mb-3" />
                    <span className="text-base font-medium text-gray-900">Professionnel</span>
                    <p className="mt-1 text-sm text-gray-500">Email professionnel</p>
                    {selectedProfile === 'professionnel' && (
                        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </button>
            </div>
            
            {error && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                    <p className="text-sm">{error}</p>
                </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                    Vous n'avez pas de compte ?{' '}
                    <a href="/fiche-inscription" className="font-medium text-blue-600 hover:text-blue-500">
                        S'inscrire
                    </a>
                </p>
            </div>
        </div>
    );

    const renderLoginForm = () => (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <button
                type="button"
                onClick={() => setSelectedProfile('')}
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
            >
                <FaArrowLeft className="mr-2" /> Retour au choix du profil
            </button>
            
            <h3 className="text-lg font-medium text-gray-900 text-center">
                Connexion {selectedProfile === 'patient' ? 'Patient' : 'Professionnel'}
            </h3>
            
            <div>
                <label htmlFor={selectedProfile === 'patient' ? 'numeroCarte' : 'email'} 
                       className="block text-sm font-medium text-gray-700">
                    {selectedProfile === 'patient' ? 'Numéro de carte d\'assurance' : 'Email professionnel'}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        id={selectedProfile === 'patient' ? 'numeroCarte' : 'email'}
                        type={selectedProfile === 'patient' ? 'text' : 'email'}
                        value={selectedProfile === 'patient' ? numeroCarte : email}
                        onChange={(e) => selectedProfile === 'patient' ? setNumeroCarte(e.target.value) : setEmail(e.target.value)}
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm transition-all duration-200"
                        placeholder={selectedProfile === 'patient' ? 'Votre numéro de carte' : 'votre@email.santesenegal.sn'}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="mdp" className="block text-sm font-medium text-gray-700">
                    Mot de passe
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        id="mdp"
                        type="password"
                        value={mdp}
                        onChange={(e) => setMotDePasse(e.target.value)}
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm transition-all duration-200"
                        placeholder="Votre mot de passe"
                    />
                </div>
                {selectedProfile === 'professionnel' && (
                    <div className="mt-1 text-right">
                        <a href="/mot-de-passe-oublie" className="text-xs text-blue-600 hover:text-blue-500">
                            Mot de passe oublié ?
                        </a>
                    </div>
                )}
            </div>

            <div>
                <button 
                    type="submit" 
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md"
                >
                    Se connecter
                </button>
            </div>
        </form>
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 bg-gray-50">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    {/* En-tête */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center">
                        <img 
                            src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/50c12644-747a-4de2-b038-72ea475da28c.png" 
                            alt="Logo Santé Sénégal" 
                            className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white p-1"
                        />
                        <h1 className="mt-4 text-xl sm:text-2xl font-bold text-white">Santé Sénégal</h1>
                        <p className="mt-1 text-blue-100 text-sm">
                            {!selectedProfile ? 'Sélectionnez votre profil' : 'Connectez-vous à votre compte'}
                        </p>
                    </div>
                    
                    {/* Contenu */}
                    <div className="bg-white">
                        {error && !selectedProfile && (
                            <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        
                        {!selectedProfile ? renderProfileSelection() : renderLoginForm()}
                    </div>
                </div>
                
                {/* Lien d'aide */}
                <div className="mt-6 text-center">
                    <a href="/aide" className="text-sm text-gray-600 hover:text-blue-600">
                        Besoin d'aide pour vous connecter ?
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Connexion;