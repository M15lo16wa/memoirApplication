import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaInfoCircle, FaTimes } from 'react-icons/fa';

const DMPTransition = () => {
  const [showBanner, setShowBanner] = useState(true);
  const navigate = useNavigate();

  const handleGoToNewDMP = () => {
    navigate('/dmp');
  };

  const handleStayOnOld = () => {
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FaInfoCircle className="text-xl" />
          <div>
            <p className="font-medium">Nouveau DMP disponible !</p>
            <p className="text-sm opacity-90">
              Découvrez votre nouveau Dossier Médical Partagé avec des fonctionnalités améliorées
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGoToNewDMP}
            className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            <span>Essayer le nouveau DMP</span>
            <FaArrowRight className="ml-2" />
          </button>
          <button
            onClick={handleStayOnOld}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DMPTransition; 