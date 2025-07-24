import React from "react";
import { useNavigate } from "react-router-dom";

function MedHeader({ doctor = { nom: "[Nom du Médecin]", specialite: "[Spécialité]", photo: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/f9ed6aa5-deb1-41fb-9d2a-5f987e9ff42e.png" }, onLogout }) {
    const navigate = useNavigate();
    const consultation = () => {
        navigate("/consultation");
    };
    const dossierPatient = () => {
        navigate("/dossier-patient");
    };
    const agenda = () => {
        navigate("/agenda");
    };
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 card">
        <div className="flex justify-between items-center">
          <div className="flex-grow">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-indigo-800">Tableau de bord de l'hôpital</h1>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-indigo-700 font-medium">Dr. <span>{doctor.nom}</span></p>
                  <p className="text-sm text-gray-600">{doctor.specialite}</p>
                </div>
                <img
                  src={doctor.photo}
                  alt="Photo de profil du médecin"
                  className="rounded-full h-10 w-10 border-2 border-indigo-200"
                />
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                  onClick={onLogout}
                >
                  Déconnexion
                </button>
                <div className="logo-container">
                  <img
                    src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/50c12644-747a-4de2-b038-72ea475da28c.png"
                    alt="Logo de l'hôpital ou du cabinet médical - symbole médical moderne en bleu avec une croix blanche"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-4 mt-2">
              <button  onClick={consultation} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md text-sm">Nouvelle Consultation</button>
              <button onClick={dossierPatient} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm">Dossiers Patients</button>
              <button onClick={agenda} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm">Agenda</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedHeader;