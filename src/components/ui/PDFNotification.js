import React from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const PDFNotification = ({ 
  show, 
  type, // 'success' ou 'error'
  message, 
  filename, 
  onClose 
}) => {
  if (!show) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isSuccess ? 'border-green-200' : 'border-red-200';
  const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
  const iconColor = isSuccess ? 'text-green-400' : 'text-red-400';
  const Icon = isSuccess ? FaCheckCircle : FaExclamationTriangle;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${bgColor} border ${borderColor} rounded-lg shadow-lg`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${textColor}`}>
              {isSuccess ? 'Succès' : 'Erreur'}
            </p>
            <p className={`text-sm ${textColor} mt-1`}>
              {message}
            </p>
            {isSuccess && filename && (
              <p className={`text-xs ${textColor} mt-2 font-mono bg-white bg-opacity-50 px-2 py-1 rounded`}>
                {filename}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className={`${textColor} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${isSuccess ? 'green' : 'red'}-50 focus:ring-${isSuccess ? 'green' : 'red'}-500`}
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFNotification;
