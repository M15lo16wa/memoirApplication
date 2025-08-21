import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaCheck, FaCalendarAlt } from 'react-icons/fa';
import useAppointmentNotifications from '../../hooks/useAppointmentNotifications';
import AppointmentNotification from './AppointmentNotification';

const NotificationManager = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    acceptAppointment,
    declineAppointment,
    removeNotification
  } = useAppointmentNotifications();

  // Afficher une notification toast quand il y a de nouvelles notifications
  useEffect(() => {
    if (notifications.length > 0 && !showNotification) {
      const latestNotification = notifications[0];
      if (latestNotification.type === 'rendez-vous' && !latestNotification.lu) {
        setCurrentNotification(latestNotification);
        setShowNotification(true);
      }
    }
  }, [notifications, showNotification]);

  const handleNotificationClose = () => {
    setShowNotification(false);
    setCurrentNotification(null);
  };

  const handleAcceptAppointment = (notification) => {
    acceptAppointment(notification.id);
    handleNotificationClose();
  };

  const handleDeclineAppointment = (notification) => {
    declineAppointment(notification.id);
    handleNotificationClose();
  };

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleRemoveNotification = (notificationId) => {
    removeNotification(notificationId);
  };

  return (
    <>
      {/* Icône de notification dans le header */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FaBell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown des notifications */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Aucune nouvelle notification'}
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="p-2">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg mb-2 transition-colors ${
                        notification.lu ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            notification.type === 'rendez-vous' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <FaCalendarAlt className={`w-4 h-4 ${
                              notification.type === 'rendez-vous' ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {notification.titre}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              notification.priorite === 'haute' ? 'bg-red-100 text-red-800' :
                              notification.priorite === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {notification.priorite}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.description}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date(notification.date_creation).toLocaleDateString('fr-FR')}
                            </span>
                            
                            <div className="flex space-x-1">
                              {!notification.lu && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="text-blue-600 hover:text-blue-800 text-xs p-1 rounded hover:bg-blue-50"
                                  title="Marquer comme lu"
                                >
                                  <FaCheck className="w-3 h-3" />
                                </button>
                              )}
                              
                              {notification.type === 'rendez-vous' && (
                                <>
                                  <button
                                    onClick={() => handleAcceptAppointment(notification)}
                                    className="text-green-600 hover:text-green-800 text-xs p-1 rounded hover:bg-green-50"
                                    title="Accepter"
                                  >
                                    <FaCheck className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeclineAppointment(notification)}
                                    className="text-red-600 hover:text-red-800 text-xs p-1 rounded hover:bg-red-50"
                                    title="Décliner"
                                  >
                                    <FaTimes className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                              
                              <button
                                onClick={() => handleRemoveNotification(notification.id)}
                                className="text-gray-400 hover:text-gray-600 text-xs p-1 rounded hover:bg-gray-100"
                                title="Supprimer"
                              >
                                <FaTimes className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FaBell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune notification</p>
                  <p className="text-gray-400 text-sm">Vous serez notifié des nouveaux rendez-vous ici</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Voir toutes les notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification toast en temps réel */}
      {showNotification && currentNotification && (
        <AppointmentNotification
          appointment={currentNotification}
          onAccept={handleAcceptAppointment}
          onDecline={handleDeclineAppointment}
          onClose={handleNotificationClose}
        />
      )}

      {/* Overlay pour fermer le dropdown en cliquant à l'extérieur */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </>
  );
};

export default NotificationManager;
