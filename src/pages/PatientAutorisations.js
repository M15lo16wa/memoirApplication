import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaShieldAlt, FaPlus, FaEye, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { ProtectedPatientRoute } from '../services/api/protectedRoute';
import AutorisationsEnAttente from '../components/dmp/AutorisationsEnAttente';
import dmpApi from '../services/api/dmpApi';

const PatientAutorisations = () => {
  const navigate = useNavigate();
  const [showAddRightsModal, setShowAddRightsModal] = useState(false);
  const [newRights, setNewRights] = useState({
    professionnel_id: '',
    type_acces: 'lecture', // lecture ou ecriture
    duree_minutes: 60,
    raison: ''
  });

  const handleAddRights = async (e) => {
    e.preventDefault();
    
    if (!newRights.professionnel_id || !newRights.raison) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      console.log('🔍 PatientAutorisations: Tentative d\'ajout de droits:', newRights);
      
      // Appel API pour créer une nouvelle autorisation
      const result = await dmpApi.createDirectAutorisation(newRights);
      console.log('✅ PatientAutorisations: Autorisation créée avec succès:', result);
      
      alert('Droits d\'accès ajoutés avec succès !');
      setShowAddRightsModal(false);
      setNewRights({
        professionnel_id: '',
        type_acces: 'lecture',
        duree_minutes: 60,
        raison: ''
      });
      
      // Optionnel: recharger la liste des autorisations
      // window.location.reload();
    } catch (error) {
      console.error('❌ PatientAutorisations: Erreur lors de l\'ajout des droits:', error);
      alert(`Erreur lors de l'ajout des droits d'accès: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dmp')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Retour au DMP
              </button>
              <div className="flex items-center">
                <FaShieldAlt className="w-6 h-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Gestion des autorisations DMP
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Contrôlez l'accès à votre dossier médical
                </h2>
                <p className="text-gray-600 mt-1">
                  Gérez les demandes d'accès des professionnels de santé à votre DMP
                </p>
              </div>
              <button
                onClick={() => setShowAddRightsModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                Ajouter des droits
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <AutorisationsEnAttente />
          </div>
        </div>
      </div>

      {/* Modal pour ajouter des droits */}
      {showAddRightsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Ajouter des droits d'accès
              </h3>
              <button
                onClick={() => setShowAddRightsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddRights} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID du professionnel *
                </label>
                <input
                  type="text"
                  value={newRights.professionnel_id}
                  onChange={(e) => setNewRights({...newRights, professionnel_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrez l'ID du professionnel"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'accès
                </label>
                <select
                  value={newRights.type_acces}
                  onChange={(e) => setNewRights({...newRights, type_acces: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lecture">
                    <FaEye className="inline mr-2" />
                    Lecture seule
                  </option>
                  <option value="ecriture">
                    <FaEdit className="inline mr-2" />
                    Lecture et écriture
                  </option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée (minutes)
                </label>
                <input
                  type="number"
                  value={newRights.duree_minutes}
                  onChange={(e) => setNewRights({...newRights, duree_minutes: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="1440"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison de l'accès *
                </label>
                <textarea
                  value={newRights.raison}
                  onChange={(e) => setNewRights({...newRights, raison: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Décrivez la raison de l'accès demandé"
                  required
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FaSave className="w-4 h-4 mr-2" />
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PatientAutorisationsProtected = () => (
  <ProtectedPatientRoute>
    <PatientAutorisations />
  </ProtectedPatientRoute>
);

export default PatientAutorisationsProtected;
