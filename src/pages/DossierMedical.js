import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProtectedPatientRoute } from "../services/api/protectedRoute";
import DMPTransition from "../components/ui/DMPTransition";

const DossierMedical = () => {
  const navigate = useNavigate();
  const [showOldInterface, setShowOldInterface] = useState(false);

  useEffect(() => {
    // Redirection automatique après 3 secondes
    const timer = setTimeout(() => {
      navigate("/dmp", { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Affichage temporaire pendant la redirection
  return (
    <ProtectedPatientRoute>
      <div className="min-h-screen bg-gray-50">
        <DMPTransition />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-2">Redirection vers votre nouveau DMP...</p>
            <p className="text-sm text-gray-500">Vous serez automatiquement redirigé dans quelques secondes</p>
          </div>
        </div>
      </div>
    </ProtectedPatientRoute>
  );
};

export default DossierMedical;