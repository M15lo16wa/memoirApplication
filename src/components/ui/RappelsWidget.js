import React, { useState, useEffect } from 'react';
import { FaBell, FaPills, FaCalendar, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import * as dmpApi from '../../services/api/dmpApi';

const RappelsWidget = () => {
  const [rappels, setRappels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRappels();
  }, []);

  const loadRappels = async () => {
    try {
      setLoading(true);
      // Ici vous pouvez appeler l'API pour récupérer les rappels
      // const response = await dmpApi.getRappels();
      // setRappels(response.data || []);
      
      // Pour l'instant, on utilise des données mockées
      setRappels([
        {
          id: 1,
          titre: 'Prise de médicament',
          description: 'Insuline - 10 unités',
          date_rappel: '2025-01-25T08:00:00',
          priorite: 'haute',
          type: 'medicament',
          termine: false
        },
        {
          id: 2,
          titre: 'Rendez-vous médical',
          description: 'Consultation cardiologue',
          date_rappel: '2025-01-26T14:30:00',
          priorite: 'moyenne',
          type: 'rendez_vous',
          termine: false
        },
        {
          id: 3,
          titre: 'Vaccin de rappel',
          description: 'Vaccin grippe saisonnière',
          date_rappel: '2025-01-28T10:00:00',
          priorite: 'basse',
          type: 'vaccin',
          termine: false
        }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des rappels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarquerTermine = async (rappelId) => {
    try {
      await dmpApi.marquerRappelTermine(rappelId);
      // Mettre à jour l'état local
      setRappels(rappels.map(rappel => 
        rappel.id === rappelId 
          ? { ...rappel, termine: true }
          : rappel
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rappel:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'medicament': return <FaPills className="text-blue-500" />;
      case 'rendez_vous': return <FaCalendar className="text-green-500" />;
      case 'vaccin': return <FaBell className="text-purple-500" />;
      default: return <FaBell className="text-gray-500" />;
    }
  };

  const getPrioriteColor = (priorite) => {
    switch (priorite) {
      case 'haute': return 'bg-red-100 text-red-800 border-red-200';
      case 'moyenne': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'basse': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPrioriteIcon = (priorite) => {
    switch (priorite) {
      case 'haute': return <FaExclamationTriangle className="text-red-500" />;
      case 'moyenne': return <FaBell className="text-yellow-500" />;
      case 'basse': return <FaCheck className="text-green-500" />;
      default: return <FaBell className="text-gray-500" />;
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUrgent = (dateString) => {
    const now = new Date();
    const rappelDate = new Date(dateString);
    const diffHours = (rappelDate - now) / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours >= 0;
  };

  const isEnRetard = (dateString) => {
    const now = new Date();
    const rappelDate = new Date(dateString);
    return rappelDate < now;
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

  const rappelsActifs = rappels.filter(rappel => !rappel.termine);
  const rappelsUrgents = rappelsActifs.filter(rappel => isUrgent(rappel.date_rappel));
  const rappelsEnRetard = rappelsActifs.filter(rappel => isEnRetard(rappel.date_rappel));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Mes rappels</h3>
        <div className="flex items-center space-x-2">
          {rappelsUrgents.length > 0 && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {rappelsUrgents.length} urgent(s)
            </span>
          )}
          {rappelsEnRetard.length > 0 && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              {rappelsEnRetard.length} en retard
            </span>
          )}
        </div>
      </div>

      {rappelsActifs.length > 0 ? (
        <div className="space-y-3">
          {rappelsActifs.slice(0, 5).map((rappel) => {
            const urgent = isUrgent(rappel.date_rappel);
            const enRetard = isEnRetard(rappel.date_rappel);
            
            return (
              <div 
                key={rappel.id} 
                className={`p-3 border rounded-lg ${
                  enRetard ? 'border-red-300 bg-red-50' :
                  urgent ? 'border-orange-300 bg-orange-50' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getTypeIcon(rappel.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{rappel.titre}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getPrioriteColor(rappel.priorite)}`}>
                          {rappel.priorite}
                        </span>
                        {enRetard && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            En retard
                          </span>
                        )}
                        {urgent && !enRetard && (
                          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{rappel.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(rappel.date_rappel)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarquerTermine(rappel.id)}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="Marquer comme terminé"
                  >
                    <FaCheck />
                  </button>
                </div>
              </div>
            );
          })}
          
          {rappelsActifs.length > 5 && (
            <div className="text-center pt-2">
              <button className="text-blue-600 hover:text-blue-800 text-sm">
                Voir tous les rappels ({rappelsActifs.length})
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FaBell className="text-4xl mx-auto mb-2 text-gray-300" />
          <p>Aucun rappel actif</p>
          <p className="text-sm">Tous vos rappels sont à jour</p>
        </div>
      )}
    </div>
  );
};

export default RappelsWidget; 