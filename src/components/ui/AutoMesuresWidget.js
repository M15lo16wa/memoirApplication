import React, { useState, useEffect } from 'react';
import { 
  FaWeight, FaUser, FaHeartbeat, FaTint, 
  FaThermometerHalf, FaPlus, FaChartLine 
} from 'react-icons/fa';
import * as dmpApi from '../../services/api/dmpApi';

const AutoMesuresWidget = () => {
  const [autoMesures, setAutoMesures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMesure, setNewMesure] = useState({
    type_mesure: 'poids',
    valeur: '',
    unite: '',
    commentaire: ''
  });

  useEffect(() => {
    loadAutoMesures();
  }, []);

  const loadAutoMesures = async () => {
    try {
      setLoading(true);
      // Ici vous pouvez appeler l'API pour récupérer les auto-mesures
      // const response = await dmpApi.getAutoMesures();
      // setAutoMesures(response.data || []);
      
      // Pour l'instant, on utilise des données mockées
      setAutoMesures([
        {
          id: 1,
          type_mesure: 'poids',
          valeur: 75,
          unite: 'kg',
          date_mesure: '2025-01-25',
          commentaire: 'Matin avant petit déjeuner'
        },
        {
          id: 2,
          type_mesure: 'glycemie',
          valeur: 120,
          unite: 'mg/dL',
          date_mesure: '2025-01-25',
          commentaire: 'Avant repas'
        },
        {
          id: 3,
          type_mesure: 'tension_arterielle',
          valeur: '120/80',
          unite: 'mmHg',
          date_mesure: '2025-01-24',
          commentaire: 'Matin'
        }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des auto-mesures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dmpApi.ajouterAutoMesure(newMesure);
      setShowAddModal(false);
      setNewMesure({ type_mesure: 'poids', valeur: '', unite: '', commentaire: '' });
      loadAutoMesures(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'auto-mesure:', error);
    }
  };

  const getTypeMesureIcon = (type) => {
    switch (type) {
      case 'poids': return <FaWeight className="text-blue-500" />;
      case 'taille': return <FaUser className="text-green-500" />;
      case 'tension_arterielle': return <FaHeartbeat className="text-red-500" />;
      case 'glycemie': return <FaTint className="text-purple-500" />;
      case 'temperature': return <FaThermometerHalf className="text-orange-500" />;
      default: return <FaUser className="text-gray-500" />;
    }
  };

  const getTypeMesureLabel = (type) => {
    switch (type) {
      case 'poids': return 'Poids';
      case 'taille': return 'Taille';
      case 'tension_arterielle': return 'Tension artérielle';
      case 'glycemie': return 'Glycémie';
      case 'temperature': return 'Température';
      default: return type;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Mes auto-mesures</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <FaPlus className="mr-1" />
            Ajouter
          </button>
        </div>

        {autoMesures.length > 0 ? (
          <div className="space-y-3">
            {autoMesures.slice(0, 5).map((mesure) => (
              <div key={mesure.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTypeMesureIcon(mesure.type_mesure)}
                  <div>
                    <p className="font-medium">{getTypeMesureLabel(mesure.type_mesure)}</p>
                    <p className="text-sm text-gray-600">{mesure.commentaire}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{mesure.valeur} {mesure.unite}</p>
                  <p className="text-xs text-gray-500">{formatDate(mesure.date_mesure)}</p>
                </div>
              </div>
            ))}
            {autoMesures.length > 5 && (
              <div className="text-center pt-2">
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  Voir toutes les mesures ({autoMesures.length})
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaChartLine className="text-4xl mx-auto mb-2 text-gray-300" />
            <p>Aucune auto-mesure enregistrée</p>
            <p className="text-sm">Ajoutez votre première mesure pour commencer le suivi</p>
          </div>
        )}
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Ajouter une auto-mesure</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de mesure
                  </label>
                  <select
                    value={newMesure.type_mesure}
                    onChange={(e) => setNewMesure({...newMesure, type_mesure: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="poids">Poids</option>
                    <option value="taille">Taille</option>
                    <option value="tension_arterielle">Tension artérielle</option>
                    <option value="glycemie">Glycémie</option>
                    <option value="temperature">Température</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valeur
                  </label>
                  <input
                    type="text"
                    value={newMesure.valeur}
                    onChange={(e) => setNewMesure({...newMesure, valeur: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="Ex: 75, 120/80, 37.2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unité
                  </label>
                  <input
                    type="text"
                    value={newMesure.unite}
                    onChange={(e) => setNewMesure({...newMesure, unite: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="kg, cm, mmHg, mg/dL, °C"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commentaire
                  </label>
                  <textarea
                    value={newMesure.commentaire}
                    onChange={(e) => setNewMesure({...newMesure, commentaire: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    rows="2"
                    placeholder="Ex: Matin avant petit déjeuner"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AutoMesuresWidget; 