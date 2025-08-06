import React from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaBell } from 'react-icons/fa';

const AuthNotification = ({ 
  message, 
  type = 'info', 
  onClose, 
  show = false,
  isDMPNotification = false,
  notificationData = null 
}) => {
  if (!show) return null;

  const getIcon = () => {
    if (isDMPNotification) {
      return <FaBell className="text-blue-600" />;
    }
    
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-green-600" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-600" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-600" />;
      default:
        return <FaInfoCircle className="text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    if (isDMPNotification) {
      return 'bg-blue-50 border-blue-200';
    }
    
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    if (isDMPNotification) {
      return 'text-blue-800';
    }
    
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full ${getBackgroundColor()} border rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {isDMPNotification && notificationData ? (
            <div>
              <h4 className={`text-sm font-medium ${getTextColor()} mb-1`}>
                {notificationData.titre}
              </h4>
              <p className={`text-sm ${getTextColor()}`}>
                {notificationData.message}
              </p>
              {notificationData.type === 'demande_acces' && !notificationData.repondue && (
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => {
                      if (notificationData.onAccept) {
                        notificationData.onAccept(notificationData.demande_id);
                      }
                    }}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                  >
                    Autoriser
                  </button>
                  <button
                    onClick={() => {
                      if (notificationData.onReject) {
                        notificationData.onReject(notificationData.demande_id);
                      }
                    }}
                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    Refuser
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className={`text-sm ${getTextColor()}`}>
              {message}
            </p>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={onClose}
            className={`inline-flex ${getTextColor()} hover:opacity-75 transition-opacity`}
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthNotification; 