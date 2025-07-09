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
    <div className="min-h-screen flex items-center justify-center p-4">
        < div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                {/* en-tete */}
                <div className="bg-blue-600 p-6 text-center">
                    <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/50c12644-747a-4de2-b038-72ea475da28c.png" alt="Logo Santé Sénégal - coeur médical" className="mx-auto h-20 w-20 rounded-full bg-white p-1 text-4xl flex items-center justify-center"/>
                    <h1 className="mt-4 text-2xl font-bold text-white">Santé Sénégal</h1>
                    <p className="mt-1 text-blue-100">Santé numérique pour tous</p>
                </div>
                    {/* formulaire de connexion */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Entrez votre mot de passe"/>
                        </div>
                        <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"> Se connecter </button>
                        <p class="mt-10 text-center text-sm/6 text-gray-500">
                            Vous n'avez pas de compte?
                            <a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500">Cliquez ici pour s'inscrir</a>
                        </p>
                    </form>
                <div/>
            </div>
        </div>
    </div>
    );
}

export default Connexion;