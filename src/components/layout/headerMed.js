import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaComments, FaBell } from "react-icons/fa";

// gestion du profil medecin
import { getMedecinProfile, logoutAll, fetchMedecinDetails } from "../../services/api/authApi";
import { getAllConsultations, getAllDossiersMedical } from "../../services/api/medicalApi";
import { getPatients } from "../../services/api/patientApi";

function MedHeader({ doctor = { nom: "{user?.nom || 'Utilisateur'}", specialite: "[Spécialité]", photo: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/f9ed6aa5-deb1-41fb-9d2a-5f987e9ff42e.png" }, onLogout }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [patientsCount, setPatientsCount] = useState(0);
  const [dossiersCount, setDossiersCount] = useState(0);
  const [consultationsCount, setConsultationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const navigate = useNavigate();

  // Fonction pour compter les messages non lus
  function countUnreadMessages() {
    try {
      const medecinData = JSON.parse(localStorage.getItem('medecin') || '{}');
      const medecinId = medecinData.id_professionnel || medecinData.id;
      
      if (!medecinId) {
        return 0;
      }
      
      let totalUnread = 0;
      
      // Parcourir toutes les sessions de messagerie
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('messages_session_')) {
          const sessionData = JSON.parse(localStorage.getItem(key) || '[]');
          if (sessionData.length > 0) {
            const sessionId = key.replace('messages_', '');
            if (sessionId.includes(`_${medecinId}`)) {
              // Compter les messages non lus de patients pour ce médecin
              const unreadCount = sessionData.filter(msg => 
                !msg.lu && 
                msg.sender.type === 'patient' && 
                msg.recipient.id === medecinId
              ).length;
              totalUnread += unreadCount;
            }
          }
        }
      }
      
      setNewMessagesCount(totalUnread);
      return totalUnread;
    } catch (error) {
      console.error('Erreur lors du comptage des messages non lus:', error);
      return 0;
    }
  }

  // Fonction pour récupérer les données du tableau de bord
  async function fetchDashboardData() {
    try {
      console.log('🔍 Récupération des données du tableau de bord...');
      
      // Compter les messages non lus
      countUnreadMessages();
      
      // ✅ CORRECTION : Utiliser getPatients de patientApi au lieu de fetchPatientsList
      console.log('🔍 Récupération des patients via getPatients...');
      const patients = await getPatients();
      console.log('📊 Patients reçus:', patients);
      
      if (patients && Array.isArray(patients)) {
        setPatientsCount(patients.length);
        console.log('✅ Nombre de patients récupéré:', patients.length);
      } else if (patients && patients.data && Array.isArray(patients.data)) {
        setPatientsCount(patients.data.length);
        console.log('✅ Nombre de patients récupéré (depuis data):', patients.data.length);
      } else {
        console.warn('⚠️ Format de patients inattendu:', patients);
        setPatientsCount(0);
      }
      
      // ✅ CORRECTION : Utiliser getAllDossiersMedical de medicalApi au lieu de fetchPatientFiles
      console.log('🔍 Récupération des dossiers médicaux via getAllDossiersMedical...');
      const dossiersResponse = await getAllDossiersMedical();
      console.log('📊 Dossiers médicaux reçus:', dossiersResponse);
      
      if (dossiersResponse && dossiersResponse.data && Array.isArray(dossiersResponse.data)) {
        setDossiersCount(dossiersResponse.data.length);
        console.log('✅ Nombre de dossiers récupéré:', dossiersResponse.data.length);
      } else if (dossiersResponse && Array.isArray(dossiersResponse)) {
        setDossiersCount(dossiersResponse.length);
        console.log('✅ Nombre de dossiers récupéré (direct):', dossiersResponse.length);
      } else {
        console.warn('⚠️ Format de dossiers inattendu:', dossiersResponse);
        setDossiersCount(0);
      }
      
      // ✅ CORRECTION : Utiliser getAllConsultations de medicalApi au lieu de fetchConsultations
      console.log('🔍 Récupération des consultations via getAllConsultations...');
      const consultations = await getAllConsultations();
      console.log('📊 Consultations reçues:', consultations);
      
      if (consultations && Array.isArray(consultations)) {
        setConsultationsCount(consultations.length);
        console.log('✅ Nombre de consultations récupéré:', consultations.length);
      } else if (consultations && consultations.data && Array.isArray(consultations.data)) {
        setConsultationsCount(consultations.data.length);
        console.log('✅ Nombre de consultations récupéré (depuis data):', consultations.data.length);
      } else {
        console.warn('⚠️ Format de consultations inattendu:', consultations);
        setConsultationsCount(0);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données du tableau de bord:', error);
      setPatientsCount(0);
      setDossiersCount(0);
      setConsultationsCount(0);
    }
  }

  useEffect(()=>{
    async function fetchProfile(){
      console.log('🔍 Début de fetchProfile dans headerMed');
      
      try{
        const details = await fetchMedecinDetails();
        console.log('🔍 Détails reçus de fetchMedecinDetails:', details);
        
        if (details) {
          let medecinData = null;
          
          if (details.professionnel) {
            medecinData = details.professionnel;
            console.log('✅ Données extraites de details.professionnel:', medecinData);
          } else if (details.nom && details.prenom) {
            medecinData = details;
            console.log('✅ Données extraites directement de details:', medecinData);
          }
          
          if (medecinData && medecinData.nom && medecinData.prenom) {
            console.log('✅ Détails complets récupérés et validés:', medecinData);
            setUser(medecinData);
            setRole(medecinData.role || "");
            
            // Mettre à jour le localStorage avec les nouvelles données
            localStorage.setItem('medecin', JSON.stringify(medecinData));
            console.log('✅ Données mises à jour dans localStorage');
            
            // ✅ NOUVEAU : Récupérer les données du tableau de bord
            await fetchDashboardData();
            return;
          } else {
            console.log('⚠️ Données reçues mais structure invalide:', details);
          }
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
          
          // ✅ NOUVEAU : Récupérer les données du tableau de bord
          await fetchDashboardData();
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
          await logoutAll(); // Nettoie le localStorage
          navigate("/connexion");
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfile();
  }, [navigate]);

  // Actualiser le compteur de messages périodiquement
  useEffect(() => {
    countUnreadMessages();
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(countUnreadMessages, 30000);
    
    return () => clearInterval(interval);
  }, [user]);
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logoutAll();
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
  const messaging = () => {
      navigate("/medecin#messaging");
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
                
                {/* Indicateur de messagerie */}
                <div className="relative">
                  <button
                    onClick={messaging}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                    title="Messagerie patients"
                  >
                    <FaComments className="w-5 h-5" />
                    {newMessagesCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {newMessagesCount > 9 ? '9+' : newMessagesCount}
                      </span>
                    )}
                  </button>
                </div>
                
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
            
            {/* Statistiques du tableau de bord */}
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">Patients</p>
                      <p className="text-2xl font-bold text-blue-900">{patientsCount}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-full">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">Dossiers</p>
                      <p className="text-2xl font-bold text-green-900">{dossiersCount}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-600">Consultations</p>
                      <p className="text-2xl font-bold text-purple-900">{consultationsCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex space-x-4 mt-6">
              <button onClick={consultation} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md text-sm hover:bg-indigo-200 transition-colors duration-200">Nouvelle Consultation</button>
              <button onClick={dossierPatient} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-200 transition-colors duration-200">Dossiers Patients</button>
              <button onClick={agenda} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-200 transition-colors duration-200">Agenda</button>
              <button 
                onClick={messaging} 
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm hover:bg-blue-200 transition-colors duration-200 relative"
              >
                <FaComments className="inline w-3 h-3 mr-1" />
                Messagerie
                {newMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {newMessagesCount > 9 ? '9+' : newMessagesCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedHeader;