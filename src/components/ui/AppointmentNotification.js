import React, { useState, useEffect } from 'react';
import { FaBell, FaCalendarAlt, FaTimes, FaCheck, FaClock } from 'react-icons/fa';

const AppointmentNotification = ({ appointment, onAccept, onDecline, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(30); // 30 secondes pour répondre

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsVisible(false);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, onClose]);

  const handleAccept = () => {
    if (onAccept) onAccept(appointment);
    setIsVisible(false);
    onClose();
  };

  const handleDecline = () => {
    if (onDecline) onDecline(appointment);
    setIsVisible(false);
    onClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 bg-white rounded-lg shadow-xl border border-gray-200 animate-slide-in">
      {/* En-tête avec icône et bouton de fermeture */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <FaCalendarAlt className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Nouveau rendez-vous</h3>
            <p className="text-xs text-gray-500">Vous avez {timeRemaining}s pour répondre</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      {/* Contenu de la notification */}
      <div className="p-4">
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">
            {appointment.type === 'urgence' ? '🚨 Rendez-vous urgent' : '📅 Rendez-vous médical'}
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            {appointment.description}
          </p>
          
          {/* Détails du rendez-vous */}
          <div className="bg-blue-50 p-3 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <FaClock className="w-3 h-3 text-blue-600" />
              <span className="text-gray-700">
                {new Date(appointment.startTime).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} à {new Date(appointment.startTime).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              Durée : {Math.round((new Date(appointment.endTime) - new Date(appointment.startTime)) / (1000 * 60))} minutes
            </div>
            {appointment.notes && (
              <div className="text-xs text-gray-600">
                Note : {appointment.notes}
              </div>
            )}
          </div>
        </div>

        {/* Barre de progression du temps */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(timeRemaining / 30) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex space-x-3">
          <button
            onClick={handleAccept}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <FaCheck className="w-4 h-4" />
            <span>Accepter</span>
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
          >
            <FaTimes className="w-4 h-4" />
            <span>Décliner</span>
          </button>
        </div>
      </div>

      {/* Indicateur de priorité */}
      {appointment.type === 'urgence' && (
        <div className="bg-red-50 border-t border-red-200 p-3 rounded-b-lg">
          <div className="flex items-center space-x-2 text-red-700">
            <FaBell className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Rendez-vous urgent - Réponse immédiate requise</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentNotification;
