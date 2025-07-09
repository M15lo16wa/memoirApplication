import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Connexion() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [mdp, setMotDePasse]= useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/admin');
        // Ajoutez ici la logique de connexion
        alert(`Tentative de connexion avec l'email : ${email}`);
    };
    return (
        <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 bg-gray-50">
            <div className="w-full max-w-sm sm:max-w-md">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                    {/* en-tete */}
                    <div className="bg-blue-600 p-6 text-center">
                        <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/50c12644-747a-4de2-b038-72ea475da28c.png" alt="Logo Santé Sénégal - coeur médical" className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white p-1 text-3xl sm:text-4xl flex items-center justify-center"/>
                        <h1 className="mt-4 text-xl sm:text-2xl font-bold text-white">Santé Sénégal</h1>
                        <p className="mt-1 text-blue-100 text-sm sm:text-base">Santé numérique pour tous</p>
                    </div>
                    {/* formulaire de connexion */}
                    <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email professionnel
                            </label>
                            <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                            placeholder="votre@email.santesenegal.sn"/>
                        </div>
                        <div>
                            <label htmlFor="mdp" className="block text-sm font-medium text-gray-700">
                                Mot de passe
                            </label>
                            <input
                            id="mdp"
                            type="password"
                            value={mdp}
                            onChange={(e) => setMotDePasse(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                            placeholder="Entrez votre mot de passe"/>
                        </div>
                        <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-lg"> Se connecter </button>
                        <p className="mt-8 text-center text-xs sm:text-sm text-gray-500">
                            Vous n'avez pas de compte?
                            <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500 ml-1">Cliquez ici pour s'inscrir</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Connexion;