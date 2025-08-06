import React, { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaTimes, FaClock, FaUserMd, FaShieldAlt } from 'react-icons/fa';

const DMPNotification = ({ 
  notification, 
  onAccept, 
  onReject, 
  onMarkAsRead, 
  onClose,
  show = false 
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsVisible(show);
    if (show) {
      // Auto-hide after 10 seconds for non-actionable notifications
      if (notification.type !== 'demande_acces' || notification.repondue) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          if (onClose) onClose();
        }, 10000);
        return () => clearTimeout(timer);
      }
    }
  }, [show, notification, onClose]);

  if (!isVisible) return null;

  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'demande_acces':
        return {
          bg: 'bg-orange-50 border-orange-200',
          icon: 'bg-orange-100 text-orange-600',
          text: 'text-orange-800',
          status: 'bg-orange-100 text-orange-800'
        };
      case 'acces_autorise':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: 'bg-green-100 text-green-600',
          text: 'text-green-800',
          status: 'bg-green-100 text-green-800'
        };
      case 'acces_refuse':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'bg-red-100 text-red-600',
          text: 'text-red-800',
          status: 'bg-red-100 text-red-800'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'bg-blue-100 text-blue-600',
          text: 'text-blue-800',
          status: 'bg-blue-100 text-blue-800'
        };
    }
  };

  const getStatusText = () => {
    switch (notification.type) {
      case 'demande_acces':
        return 'Demande en attente';
      case 'acces_autorise':
        return 'Accès autorisé';
      case 'acces_refuse':
        return 'Accès refusé';
      default:
        return 'Notification';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'demande_acces':
        return <FaClock className="w-5 h-5" />;
      case 'acces_autorise':
        return <FaCheck className="w-5 h-5" />;
      case 'acces_refuse':
        return <FaTimes className="w-5 h-5" />;
      default:
        return <FaBell className="w-5 h-5" />;
    }
  };

  const styles = getNotificationStyle();

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full ${styles.bg} border rounded-xl shadow-lg transition-all duration-300 ease-in-out transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.icon}`}>
              {getIcon()}
            </div>
            <div>
              <h4 className={`font-semibold text-sm ${styles.text}`}>
                {notification.titre}
              </h4>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles.status}`}>
                {getStatusText()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!notification.lue && onMarkAsRead && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Marquer comme lue
              </button>
            )}
            <button
              onClick={() => {
                setIsVisible(false);
                if (onClose) onClose();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mb-3">
          <p className={`text-sm ${styles.text} leading-relaxed`}>
            {notification.message}
          </p>
          
          {/* Additional info for access requests */}
          {notification.type === 'demande_acces' && !notification.repondue && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <FaUserMd className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {notification.medecin_nom}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FaShieldAlt className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600">
                  Demande d'accès à votre DMP
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {notification.type === 'demande_acces' && !notification.repondue && (
          <div className="flex space-x-2">
            <button
              onClick={() => {
                if (onAccept) onAccept(notification.demande_id);
                setIsVisible(false);
                if (onClose) onClose();
              }}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <FaCheck className="w-4 h-4 mr-2" />
              Autoriser l'accès
            </button>
            <button
              onClick={() => {
                if (onReject) onReject(notification.demande_id);
                setIsVisible(false);
                if (onClose) onClose();
              }}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              <FaTimes className="w-4 h-4 mr-2" />
              Refuser l'accès
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            📅 {new Date(notification.date_creation).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DMPNotification;
