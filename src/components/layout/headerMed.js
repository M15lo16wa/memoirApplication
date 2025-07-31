import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// gestion du profil medecin
import { getMedecinProfile, logoutMedecin, fetchMedecinDetails } from "../../services/api/authApi";

function MedHeader({ doctor = { nom: "{user?.nom || 'Utilisateur'}", specialite: "[Spécialité]", photo: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/f9ed6aa5-deb1-41fb-9d2a-5f987e9ff42e.png" }, onLogout }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  useEffect(()=>{
    async function fetchProfile(){
      console.log('🔍 Début de fetchProfile dans headerMed');
      console.log('🔑 Token disponible:', localStorage.getItem('token'));
      console.log('👨‍⚕️ Données médecin stockées:', localStorage.getItem('medecin'));
      
      try{
        // D'abord essayer de récupérer les détails complets
        console.log('🔍 Tentative de récupération des détails complets...');
        const details = await fetchMedecinDetails();
        
        if (details && details.nom && details.prenom) {
          console.log('✅ Détails complets récupérés:', details);
          setUser(details);
          setRole(details.role || "");
          return;
        }
        
        // Si pas de détails complets, essayer getMedecinProfile
        console.log('🔍 Tentative avec getMedecinProfile...');
        const data = await getMedecinProfile();
        console.log("Profil médecin reçu:", data); // Debug: affiche la réponse brute
        // Extraction du professionnel de santé
        let professionnel = null;
        if (data && data.data && data.data.professionnel) {
          professionnel = data.data.professionnel;
        } else if (data && data.professionnel) {
          professionnel = data.professionnel;
        }
        if (professionnel && typeof professionnel === "object"){
          console.log('✅ Profil médecin extrait avec succès:', professionnel);
          setUser(professionnel);
          setRole(professionnel.role || "");
        } else {
          // Utiliser les données stockées localement si disponibles
          const storedMedecin = JSON.parse(localStorage.getItem('medecin') || 'null');
          if (storedMedecin) {
            console.log('📦 Utilisation des données stockées localement:', storedMedecin);
            setUser(storedMedecin);
            setRole(storedMedecin.role || "");
          } else {
            console.log('❌ Aucune donnée médecin disponible');
            setUser(null);
            setRole("");
          }
        }
      }catch (e) {
        console.error("Erreur lors de la recuperation du profil:", e);
        // Utiliser les données stockées localement en cas d'erreur
        const storedMedecin = JSON.parse(localStorage.getItem('medecin') || 'null');
        if (storedMedecin) {
          console.log('📦 Utilisation des données stockées en cas d\'erreur:', storedMedecin);
          setUser(storedMedecin);
          setRole(storedMedecin.role || "");
        } else {
          console.log('❌ Aucune donnée stockée disponible');
          setUser(null);
          setRole("");
        }
        // Ne déconnecter que si c'est vraiment une erreur d'authentification
        if(e.response?.status === 401 && !localStorage.getItem('medecin')){
          console.log('🚨 Erreur 401 sans données stockées, déconnexion forcée');
          await logoutMedecin(); // Nettoie le localStorage
          navigate("/connexion");
        }
      }
    }
    fetchProfile();
  }, [navigate]);
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logoutMedecin();
      onLogout?.();
      navigate('/connexion');
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
      alert("Erreur lors de la deconnexion. Veuillez reesayer.");
    }
  };

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
                  <p className="text-indigo-700 font-medium">Dr. <span>{user?.nom || "Nom non disponible"} {user?.prenom || ""}</span></p>
                  <p className="text-sm text-gray-600">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Rôle non disponible"}</p>
                  <p className="text-sm text-gray-600">{user?.specialite || "Spécialité non disponible"}</p>
                </div>
                <img
                  src={user?.photo_url || doctor.photo}
                  alt="Photo de profil du médecin"
                  className="rounded-full h-10 w-10 border-2 border-indigo-200"
                />
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                  onClick={handleLogout}
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