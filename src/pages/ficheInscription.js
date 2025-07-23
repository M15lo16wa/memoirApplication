import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function FicheInscription() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    civilite: "",
    nom: "",
    prenom: "",
    dateNaissance: "",
    lieuNaissance: "",
    sexe: "",
    numeroCarteAssurance: "",
    nomAssureur: "",
    adresse: "",
    ville: "",
    pays: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add form validation and submission logic
    console.log("Form submitted:", formData);
    // Redirect to login or confirmation page
    navigate('/connexion');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Formulaire d'Inscription Patient</h1>
          <p className="mt-2 text-sm text-blue-700">Veuillez remplir tous les champs obligatoires (*)</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl p-8 space-y-6 border border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Civilité */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Civilité <span className="text-red-500">*</span></label>
              <select
                name="civilite"
                value={formData.civilite}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 hover:border-blue-400"
              >
                <option value="">Sélectionner une option</option>
                <option value="M.">Monsieur</option>
                <option value="Mme">Madame</option>
                <option value="Mlle">Mademoiselle</option>
              </select>
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Nom <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 hover:border-blue-400"
              />
            </div>

            {/* Prénom */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Prénom <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 hover:border-blue-400"
              />
            </div>

            {/* Date de naissance */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date de naissance <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 hover:border-blue-400"
              />
            </div>

            {/* Lieu de naissance */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Lieu de naissance <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="lieuNaissance"
                value={formData.lieuNaissance}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 hover:border-blue-400"
              />
            </div>

            {/* Sexe */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Sexe <span className="text-red-500">*</span></label>
              <div className="mt-2 space-x-6 flex">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="sexe"
                    value="M"
                    checked={formData.sexe === "M"}
                    onChange={handleChange}
                    required
                    className="h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-300 border-2 border-gray-400 rounded transition-all duration-200"
                  />
                  <span className="ml-2">Masculin</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="sexe"
                    value="F"
                    checked={formData.sexe === "F"}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-300 border-2 border-gray-400 rounded transition-all duration-200"
                  />
                  <span className="ml-2">Féminin</span>
                </label>
              </div>
            </div>

            {/* Numéro de carte d'assurance */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Numéro de carte d'assurance <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="numeroCarteAssurance"
                value={formData.numeroCarteAssurance}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 hover:border-blue-400"
              />
            </div>

            {/* Nom de l'assureur */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Nom de l'assureur <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="nomAssureur"
                value={formData.nomAssureur}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 hover:border-blue-400"
              />
            </div>

            {/* Adresse */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Adresse <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 hover:border-blue-400"
              />
            </div>

            {/* Ville */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Ville <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 hover:border-blue-400"
              />
            </div>

            {/* Pays */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Pays <span className="text-red-500">*</span></label>
              <select
                name="pays"
                value={formData.pays}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 hover:border-blue-400"
              >
                <option value="">Sélectionner un pays</option>
                <option value="Sénégal">Sénégal</option>
                <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                <option value="Mali">Mali</option>
                <option value="France">France</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 hover:border-blue-400"
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Téléphone <span className="text-red-500">*</span></label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-4 rounded-l-lg border-2 border-r-0 border-gray-300 bg-gray-100 text-gray-700 font-medium">
                  +221
                </span>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{9}"
                  placeholder="771234567"
                  className="flex-1 min-w-0 block w-full px-4 py-2.5 rounded-none rounded-r-lg border-2 border-l-0 border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Mot de passe <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 hover:border-blue-400"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 8 caractères</p>
            </div>

            {/* Confirmation du mot de passe */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Confirmer le mot de passe <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 hover:border-blue-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-6 py-2.5 border-2 border-gray-300 shadow-sm text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              S'inscrire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FicheInscription;