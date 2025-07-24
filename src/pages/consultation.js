import React, { useState } from "react";

function Consultation() {
    return(        
    <div>
            {/* Patient Information Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 card">
                <h2 className="text-xl font-semibold mb-6 section-title">1. Informations Patient</h2>
                
                {/* Grid layout for patient information inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Nom du patient" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Prénom du patient" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Age du patient" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de Naissance</label>
                        <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="">Sélectionner</option>
                            <option value="M">Masculin</option>
                            <option value="F">Féminin</option>
                            <option value="A">Autre</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Sécurité Sociale</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="1 85 05 75 115 034 18" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="06 12 34 56 78" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ville/Region</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ville/Region de la consultation" />
                    </div>
                </div>
                
                {/* Second row for email and address - spanning wider */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="patient@exemple.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="123 Rue de la Santé" />
                    </div>
                </div>
            </div>
            
            {/* Antécédents Médicaux */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 card">
                <h2 className="text-xl font-semibold mb-4 section-title">2. Antécédents Médicaux</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="font-medium text-gray-800 mb-3">Antécédents Personnels</h3>
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" rows="4" placeholder="Maladies chroniques, allergies, interventions chirurgicales..."></textarea>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-800 mb-3">Antécédents Familiaux</h3>
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" rows="4" placeholder="Maladies héréditaires, causes de décès familiaux..."></textarea>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-800 mb-3">Traitements en Cours</h3>
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" rows="4" placeholder="Médicaments, posologie, durée..."></textarea>
                        <div className="mt-2">
                            <label className="inline-flex items-center">
                                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                                <span className="ml-2 text-sm">Pas de traitement en cours</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Motif de Consultation */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 card">
                <h2 className="text-xl font-semibold mb-4 section-title">3. Motif de Consultation</h2>
                <div className="mb-4">
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" rows="3" placeholder="Décrivez ici le motif principal de la consultation (symptômes, durée, circonstances d'apparition, facteurs aggravants/améliorants...)"></textarea>
                </div>
                <div>
                    <h3 className="font-medium text-gray-800 mb-2">Échelle de douleur (0-10)</h3>
                    <div className="flex items-center mb-2">
                        <span className="mr-2 text-sm">0</span>
                        <input type="range" min="0" max="10" defaultValue="0" className="w-full h-2 bg-gray-200 rounded-lg appearance-none dark:bg-gray-700" />
                        <span className="ml-2 text-sm">10</span>
                    </div>
                </div>
            </div>

            {/* Examen Clinique */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 card">
                <h2 className="text-xl font-semibold mb-4 section-title">4. Examen Clinique</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="70" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taille (cm)</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="175" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IMC</label>
                        <input type="text" readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Température (°C)</label>
                        <input type="number" step="0.1" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="36.6" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pouls (bpm)</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="72" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TA (mmHg)</label>
                        <div className="flex">
                            <input type="number" className="w-1/2 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="120" />
                            <input type="number" className="w-1/2 px-3 py-2 border-t border-b border-r border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="80" />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Examen physique</label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" rows="5" placeholder="Description détaillée de l'examen..."></textarea>
                </div>
            </div>

            {/* Diagnostic et Prescription */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 card">
                <h2 className="text-xl font-semibold mb-4 section-title">5. Diagnostic et Prescription</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-medium text-gray-800 mb-2">Diagnostic (CIM-10)</h3>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-2" placeholder="Code CIM-10" />
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" rows="4" placeholder="Diagnostic principal et diagnostics secondaires..."></textarea>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-800 mb-2">Prescription</h3>
                        <div className="mb-4">
                            <div className="flex mb-2">
                                <select className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Sélectionner un médicament</option>
                                    <option value="paracetamol">Paracétamol</option>
                                    <option value="ibuprofen">Ibuprofène</option>
                                    <option value="amoxicillin">Amoxicilline</option>
                                </select>
                                <button className="px-3 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700">+</button>
                            </div>
                            <div id="medications-list" className="space-y-2">
                                {/* Médicaments ajoutés apparaîtront ici */}
                            </div>
                        </div>
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" rows="3" placeholder="Posologie, durée du traitement, recommandations..."></textarea>
                    </div>
                </div>
            </div>

            {/* Notes et Suivi */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 card">
                <h2 className="text-xl font-semibold mb-4 section-title">6. Notes et Suivi</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes du médecin</label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" rows="4" placeholder="Observations particulières, conseils, orientation vers spécialiste..."></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date de la prochaine consultation</label>
                        <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">À suivre</label>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                                <span className="ml-2 text-sm">Examens complémentaires</span>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                                <span className="ml-2 text-sm">Hospitalisation</span>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                                <span className="ml-2 text-sm">Orientation spécialiste</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Signature et Validation */}
            <div className="bg-white rounded-lg shadow-md p-6 card">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Signature du médecin</label>
                        <canvas id="signature-pad" className="w-64 h-20 border border-gray-300 rounded-md bg-white"></canvas>
                        <button className="mt-2 text-sm text-indigo-600">Effacer</button>
                    </div>
                    <div className="flex space-x-4">
                        <button className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50">Annuler</button>
                        <button className="btn-primary px-6 py-2 rounded-md shadow-sm">Enregistrer la consultation</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Consultation;