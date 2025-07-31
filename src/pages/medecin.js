import React from "react";
import MedHeader from "../components/layout/headerMed";
import ProtectedMedecinRoute from "../services/api/protectedRoute";

function Medecin() {
    return (
        <ProtectedMedecinRoute>
            <div>
                <MedHeader />
                {/* Patient Search */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-4 card">
                    <div className="flex items-center">
                        <input type="text" className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md" placeholder="Rechercher un patient..." />
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-r-md">Rechercher</button>
                    </div>
                </div>
            </div>
        </ProtectedMedecinRoute>
    );
}

export default Medecin;