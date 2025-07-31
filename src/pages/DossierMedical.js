import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { getPatientProfile, isPatientAuthenticated, logoutPatient,getStoredPatient } from "../services/api/authApi";
import { ProtectedPatientRoute } from "../services/api/protectedRoute";

// Données statiques pour l'exemple, à remplacer par un appel API
const mockOrdonnances = [
  {
    id: "ORD20230115",
    date: "15 Janvier 2023",
    medecin: "Dr. Sophie Martin",
    specialite: "Médecin généraliste",
    medicaments: [
      {
        nom: "Doliprane 1000mg",
        quantite: "1 boîte",
        posologie: "1 comprimé matin et soir pendant 5 jours",
      },
      {
        nom: "Spasfon Lyoc 160mg",
        quantite: "2 boîtes",
        posologie: "1 comprimé à prendre en cas de douleurs",
      },
    ],
  },
  {
    id: "ORD20220902",
    date: "2 Septembre 2022",
    medecin: "Dr. Pierre Lefèvre",
    specialite: "Cardiologue",
    medicaments: [
      {
        nom: "Kardegic 75mg",
        quantite: "1 boîte",
        posologie: "1 comprimé par jour le matin",
      },
      {
        nom: "Tahor 10mg",
        quantite: "1 boîte",
        posologie: "1 comprimé le soir",
      },
    ],
  },
];

const DossierMedicalContent = () => {
  const [profil, setProfil] = useState({});
  const [ordonnances, setOrdonnances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isPatientAuthenticated, setIsPatientAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchProfileAndData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer le profil patient
      const response = await getPatientProfile();
      const patientData = response.patient || response;
      if (patientData) {
        setProfil(patientData);
        localStorage.setItem("patient", JSON.stringify(patientData));
      }

      // TODO: Remplacer par un véritable appel API pour les ordonnances
      // Exemple: const ordonnancesData = await getOrdonnances();
      setOrdonnances(mockOrdonnances);

    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      setError(error.message || "Impossible de récupérer les données");
      
      // Vérifier si c'est une erreur d'authentification
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Erreur d\'authentification, déconnexion...');
        // Déconnexion et suppression des données de session
        await logoutPatient();
        // Redirection vers la page de connexion avec un message
        navigate("/connexion", { 
          state: { 
            message: "Votre session a expiré, veuillez vous reconnecter",
            from: location.pathname
          } 
        });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, location]);

  useEffect(() => {
    fetchProfileAndData();

    const handleClickOutside = (event) => {
      // Fermer le menu si on clique en dehors
      if (isProfileMenuOpen && !event.target.closest('#profile-menu-container')) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fetchProfileAndData, isProfileMenuOpen]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600 p-4">
        <p className="text-lg font-medium mb-4">Erreur lors du chargement des données</p>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .ordonnance-card {
            transition: all 0.3s ease;
          }
          .ordonnance-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          .medicament-item {
            border-left: 4px solid #3b82f6;
          }
          @media print {
            body {
              background-color: white;
            }
            .no-print {
              display: none !important;
            }
            header, footer, aside {
              display: none !important;
            }
            main {
              margin: 0;
              padding: 0;
            }
          }
        `}
      </style>

      <div className="bg-gray-50 min-h-screen">
        {/* En-tête */}
        <header className="bg-blue-600 text-white shadow-md no-print">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl md:text-3xl font-bold">Mon Espace Patient</h1>
              {/* Conteneur pour le menu profil */}
              <div id="profile-menu-container" className="relative">
                <div onClick={() => setProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center space-x-4 cursor-pointer">
                  <span className="text-sm md:text-base">{profil.prenom} {profil.nom}</span>
                  {profil.photo ? (
                    <img src={profil.photo} alt="Photo de profil" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                      {profil.prenom?.charAt(0)}{profil.nom?.charAt(0)}
                    </div>
                  )}
                </div>
                {/* Menu déroulant */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <button 
                      onClick={() => { 
                        logoutPatient();
                        navigate('/connexion', { state: { message: 'Vous avez été déconnecté avec succès' } });
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FaSignOutAlt className="mr-2" /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
            <nav className="mt-4">
              <ul className="flex space-x-6">
                <li><Link to="/dashboard" className="font-medium hover:underline">Accueil</Link></li>
                <li><Link to="/ordonnances" className="font-medium text-blue-200">Ordonnances</Link></li>
                <li><Link to="/rendez-vous" className="font-medium hover:underline">Rendez-vous</Link></li>
                <li><Link to="/documents" className="font-medium hover:underline">Mes Documents</Link></li>
              </ul>
            </nav>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Section de filtrage */}
            <aside className="w-full md:w-1/4 no-print">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-blue-700">Filtrer les ordonnances</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                    <select className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500">
                      <option>Toutes les années</option>
                      <option>2023</option>
                      <option>2022</option>
                      <option>2021</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Médecin</label>
                    <select className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500">
                      <option>Tous les médecins</option>
                      <option>Dr. Martin</option>
                      <option>Dr. Lefèvre</option>
                      <option>Dr. Dubois</option>
                    </select>
                  </div>
                  <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
                    Appliquer les filtres
                  </button>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                <h2 className="text-xl font-semibold mb-4 text-blue-700">Informations</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Vos ordonnances sont conservées pendant 5 ans. Vous pouvez les télécharger ou les imprimer si besoin.
                </p>
                <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/555927cb-b6e0-4765-add6-11ea4418000f.png" alt="Illustration médicale" className="w-full rounded-md" />
              </div>
            </aside>

            {/* Liste des ordonnances */}
            <section className="w-full md:w-3/4">
              <h2 className="text-2xl font-bold mb-6 text-blue-800">Mes Ordonnances</h2>
              
              {ordonnances.length > 0 ? (
                ordonnances.map((ordo) => (
                  <div key={ordo.id} className="ordonnance-card bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-700">Ordonnance #{ordo.id}</h3>
                          <p className="text-sm text-gray-500">{ordo.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{ordo.medecin}</p>
                          <p className="text-sm text-gray-500">{ordo.specialite}</p>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2 text-gray-800">Médicaments prescrits:</h4>
                        <ul className="space-y-3">
                          {ordo.medicaments.map((med, index) => (
                            <li key={index} className="medicament-item pl-3 py-1">
                              <div className="flex justify-between">
                                <span className="font-medium">{med.nom}</span>
                                <span className="text-blue-600">{med.quantite}</span>
                              </div>
                              <p className="text-sm text-gray-600">{med.posologie}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 no-print">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Télécharger PDF</button>
                      <button onClick={handlePrint} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Imprimer</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                  <p>Aucune ordonnance n'a été trouvée.</p>
                </div>
              )}
              
              <div className="text-center text-sm text-gray-500 mt-8 no-print">
                <p>Vous avez {ordonnances.length} ordonnances enregistrées</p>
              </div>
            </section>
          </div>
        </main>

        {/* Pied de page */}
        <footer className="bg-gray-100 text-gray-600 py-6 no-print">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="font-medium"> 2025 Sante Senegal</p>
                <p className="text-xs mt-1">Tous droits réservés</p>
              </div>
              <div className="flex space-x-4">
                <a href="#" className="text-sm hover:text-blue-600">Mentions légales</a>
                <a href="#" className="text-sm hover:text-blue-600">Confidentialité</a>
                <a href="#" className="text-sm hover:text-blue-600">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

// Composant wrapper qui gère l'authentification
const DossierMedical = () => (
  <ProtectedPatientRoute>
    <DossierMedicalContent />
  </ProtectedPatientRoute>
);

export default DossierMedical;