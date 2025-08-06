import React from 'react';
import { FaBell, FaClock, FaCheck, FaTimes, FaEye } from 'react-icons/fa';

const NotificationsStats = ({ stats, onViewAll, onMarkAllAsRead }) => {
  if (!stats) return null;

  const getStatCard = (title, value, icon, color, onClick = null) => (
    <div 
      className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${color} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notifications DMP</h3>
          <p className="text-sm text-gray-600">Vue d'ensemble de vos notifications d'accès</p>
        </div>
        <div className="flex space-x-2">
          {onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <FaEye className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </button>
          )}
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaBell className="w-4 h-4 mr-2" />
              Voir toutes
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getStatCard(
          'Total',
          stats.total || 0,
          <FaBell className="w-5 h-5 text-blue-600" />,
          'border-l-blue-500'
        )}
        
        {getStatCard(
          'Non lues',
          stats.non_lues || 0,
          <FaEye className="w-5 h-5 text-orange-600" />,
          'border-l-orange-500'
        )}
        
        {getStatCard(
          'En attente',
          stats.demandes_en_attente || 0,
          <FaClock className="w-5 h-5 text-yellow-600" />,
          'border-l-yellow-500'
        )}
        
        {getStatCard(
          'Autorisées',
          stats.acces_autorises || 0,
          <FaCheck className="w-5 h-5 text-green-600" />,
          'border-l-green-500'
        )}
      </div>

      {/* Barre de progression pour les notifications non lues */}
      {stats.total > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progression des notifications</span>
            <span className="text-sm text-gray-500">
              {stats.non_lues || 0} / {stats.total} non lues
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.total > 0 ? ((stats.total - (stats.non_lues || 0)) / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      {stats.demandes_en_attente > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaClock className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  {stats.demandes_en_attente} demande(s) en attente
                </h4>
                <p className="text-xs text-yellow-600">
                  Des médecins attendent votre autorisation pour accéder à votre DMP
                </p>
              </div>
            </div>
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Voir les demandes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsStats;
