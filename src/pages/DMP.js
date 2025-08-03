import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  FaUser, FaCalendar, FaFileMedical, FaShieldAlt, 
  FaUpload, FaBell, FaQrcode, FaBook, FaChartBar,
  FaSignOutAlt, FaPlus, FaSearch, FaDownload, FaTrash,
  FaHeartbeat, FaPills, FaThermometerHalf, FaWeight,
  FaTint, FaMobile, FaEnvelope, FaPrint
} from "react-icons/fa";
import { ProtectedPatientRoute } from "../services/api/protectedRoute";
import { logoutPatient, getStoredPatient } from "../services/api/authApi";
import * as dmpApi from "../services/api/dmpApi";


const DMP = () => {
  const [activeTab, setActiveTab] = useState('tableau-de-bord');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableauDeBord, setTableauDeBord] = useState(null);
  const [historiqueMedical, setHistoriqueMedical] = useState([]);
  const [droitsAcces, setDroitsAcces] = useState([]);
  const [rappels, setRappels] = useState([]);
  const [statistiques, setStatistiques] = useState(null);
  const [showAutoMesureModal, setShowAutoMesureModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [autoMesure, setAutoMesure] = useState({
    type_mesure: 'poids',
    valeur: '',
    unite: '',
    commentaire: ''
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fermer le menu du profil quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer le profil patient depuis le localStorage
      const storedPatient = getStoredPatient();
      if (storedPatient) {
        setPatientProfile(storedPatient);
      }

      // Charger le tableau de bord
      const tableauData = await dmpApi.getTableauDeBord();
      setTableauDeBord(tableauData.data?.tableau_de_bord);

      // Charger les statistiques
      const statsData = await dmpApi.getStatistiques();
      setStatistiques(statsData.data);

    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab) => {
    try {
      setLoading(true);
      setError(null);

      switch (tab) {
        case 'historique':
          const historiqueData = await dmpApi.getHistoriqueMedical();
          setHistoriqueMedical(historiqueData.data || []);
          break;
        case 'droits-acces':
          const droitsData = await dmpApi.getDroitsAcces();
          setDroitsAcces(droitsData.data || []);
          break;
        case 'rappels':
          const rappelsData = await dmpApi.getRappels();
          setRappels(rappelsData.data || []);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Erreur lors du chargement de l'onglet ${tab}:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    loadTabData(tab);
  };

  const handleLogout = async () => {
    try {
      await logoutPatient();
      navigate('/connexion', { 
        state: { message: 'Vous avez été déconnecté avec succès' } 
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleAutoMesureSubmit = async (e) => {
    e.preventDefault();
    try {
      await dmpApi.ajouterAutoMesure(autoMesure);
      setShowAutoMesureModal(false);
      setAutoMesure({ type_mesure: 'poids', valeur: '', unite: '', commentaire: '' });
      // Recharger les données si nécessaire
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('titre', uploadTitle);
      formData.append('description', uploadDescription);

      await dmpApi.uploadDocument(formData);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      // Recharger les données si nécessaire
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const getTypeMesureIcon = (type) => {
    switch (type) {
      case 'poids': return <FaWeight className="text-blue-500" />;
      case 'taille': return <FaUser className="text-green-500" />;
      case 'tension_arterielle': return <FaHeartbeat className="text-red-500" />;
      case 'glycemie': return <FaTint className="text-purple-500" />;
      case 'temperature': return <FaThermometerHalf className="text-orange-500" />;
      default: return <FaUser className="text-gray-500" />;
    }
  };

  const getTypeMesureLabel = (type) => {
    switch (type) {
      case 'poids': return 'Poids';
      case 'taille': return 'Taille';
      case 'tension_arterielle': return 'Tension artérielle';
      case 'glycemie': return 'Glycémie';
      case 'temperature': return 'Température';
      default: return type;
    }
  };

  if (loading && !tableauDeBord) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Mon DMP</h1>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Dossier Médical Partagé
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAutoMesureModal(true)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FaPlus className="mr-2" />
                Auto-mesure
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FaUpload className="mr-2" />
                Upload
              </button>
              
              {/* Profil utilisateur */}
              <div className="relative profile-menu-container">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {patientProfile ? 
                      `${patientProfile.prenom?.charAt(0) || ''}${patientProfile.nom?.charAt(0) || ''}` : 
                      'P'
                    }
                  </div>
                                     <div className="text-left">
                     <p className="text-sm font-medium">
                       {patientProfile ? 
                         `${patientProfile.prenom || ''} ${patientProfile.nom || ''}` : 
                         'Patient'
                       }
                     </p>
                     <p className="text-xs text-gray-500">
                       Dossier: {patientProfile?.numero_dossier || patientProfile?.id || 'N/A'}
                     </p>
                   </div>
                </button>
                
                {/* Menu déroulant du profil */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                                         <div className="px-4 py-2 border-b">
                       <p className="text-sm font-medium text-gray-900">
                         {patientProfile ? 
                           `${patientProfile.prenom || ''} ${patientProfile.nom || ''}` : 
                           'Patient'
                         }
                       </p>
                       <p className="text-xs text-gray-500">
                         Dossier: {patientProfile?.numero_dossier || patientProfile?.id || 'N/A'}
                       </p>
                     </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'tableau-de-bord', label: 'Tableau de bord', icon: FaChartBar },
              { id: 'historique', label: 'Historique médical', icon: FaFileMedical },
              { id: 'droits-acces', label: 'Droits d\'accès', icon: FaShieldAlt },
              { id: 'rappels', label: 'Rappels', icon: FaBell },
              { id: 'urgence', label: 'Fiche d\'urgence', icon: FaQrcode },
              { id: 'bibliotheque', label: 'Bibliothèque', icon: FaBook }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Tableau de Bord */}
        {activeTab === 'tableau-de-bord' && tableauDeBord && (
          <div className="space-y-6">
            {/* Informations Patient */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Informations personnelles</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">Connecté</span>
                </div>
              </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <div>
                   <p className="text-sm text-gray-500">Nom complet</p>
                   <p className="font-medium">
                     {patientProfile ? 
                       `${patientProfile.prenom || ''} ${patientProfile.nom || ''}` : 
                       `${tableauDeBord.patient?.prenom || ''} ${tableauDeBord.patient?.nom || ''}`
                     }
                   </p>
                 </div>
                 <div>
                   <p className="text-sm text-gray-500">Numéro de dossier</p>
                   <p className="font-medium text-blue-600 font-semibold">
                     {patientProfile?.numero_dossier || patientProfile?.id || tableauDeBord.patient?.numero_dossier || tableauDeBord.patient?.id || 'Non disponible'}
                   </p>
                 </div>
                 <div>
                   <p className="text-sm text-gray-500">Identifiant</p>
                   <p className="font-medium">{patientProfile?.identifiant || tableauDeBord.patient?.identifiant || 'Non disponible'}</p>
                 </div>
                 <div>
                   <p className="text-sm text-gray-500">Date de naissance</p>
                   <p className="font-medium">{patientProfile?.date_naissance || tableauDeBord.patient?.date_naissance || 'Non renseigné'}</p>
                 </div>
                 <div>
                   <p className="text-sm text-gray-500">Groupe sanguin</p>
                   <p className="font-medium">{patientProfile?.groupe_sanguin || tableauDeBord.patient?.groupe_sanguin || 'Non renseigné'}</p>
                 </div>
                 <div>
                   <p className="text-sm text-gray-500">Allergies</p>
                   <p className="font-medium">{patientProfile?.allergies || tableauDeBord.patient?.allergies || 'Aucune'}</p>
                 </div>
                 <div>
                   <p className="text-sm text-gray-500">Maladies chroniques</p>
                   <p className="font-medium">{patientProfile?.maladies_chroniques || tableauDeBord.patient?.maladies_chroniques || 'Aucune'}</p>
                 </div>
               </div>
            </div>

            {/* Statistiques */}
            {statistiques && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaFileMedical className="text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Documents</p>
                      <p className="text-2xl font-bold">{statistiques.nombre_documents || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FaCalendar className="text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Rendez-vous</p>
                      <p className="text-2xl font-bold">{statistiques.nombre_rendez_vous || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FaShieldAlt className="text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Professionnels autorisés</p>
                      <p className="text-2xl font-bold">{statistiques.nombre_professionnels || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FaBell className="text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Rappels actifs</p>
                      <p className="text-2xl font-bold">{statistiques.nombre_rappels || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Historique Médical */}
        {activeTab === 'historique' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Historique médical</h2>
              <p className="text-gray-600">Consultez votre historique médical complet</p>
            </div>
            <div className="p-6">
              {historiqueMedical.length > 0 ? (
                <div className="space-y-4">
                  {historiqueMedical.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{item.type}</h3>
                          <p className="text-sm text-gray-600">{item.date}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <FaDownload />
                          </button>
                          <button className="text-green-600 hover:text-green-800">
                            <FaPrint />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucun historique disponible</p>
              )}
            </div>
          </div>
        )}

        {/* Droits d'Accès */}
        {activeTab === 'droits-acces' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Gestion des droits d'accès</h2>
              <p className="text-gray-600">Contrôlez qui peut accéder à votre dossier médical</p>
            </div>
            <div className="p-6">
              {droitsAcces.length > 0 ? (
                <div className="space-y-4">
                  {droitsAcces.map((droit, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">Dr. {droit.professionnel?.nom} {droit.professionnel?.prenom}</h3>
                          <p className="text-sm text-gray-600">{droit.professionnel?.specialite}</p>
                          <p className="text-sm text-gray-500">Autorisé le {droit.date_autorisation}</p>
                        </div>
                        <button className="text-red-600 hover:text-red-800">
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucun professionnel autorisé</p>
              )}
            </div>
          </div>
        )}

        {/* Rappels */}
        {activeTab === 'rappels' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Mes rappels</h2>
              <p className="text-gray-600">Gérez vos rappels médicaux</p>
            </div>
            <div className="p-6">
              {rappels.length > 0 ? (
                <div className="space-y-4">
                  {rappels.map((rappel, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{rappel.titre}</h3>
                          <p className="text-sm text-gray-600">{rappel.description}</p>
                          <p className="text-sm text-gray-500">Date: {rappel.date_rappel}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          rappel.priorite === 'haute' ? 'bg-red-100 text-red-800' :
                          rappel.priorite === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {rappel.priorite}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucun rappel actif</p>
              )}
            </div>
          </div>
        )}

        {/* Fiche d'Urgence */}
        {activeTab === 'urgence' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Fiche d'urgence</h2>
              <p className="text-gray-600">Informations vitales en cas d'urgence</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-4">Informations personnelles</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nom:</span> {tableauDeBord?.patient?.prenom} {tableauDeBord?.patient?.nom}</p>
                    <p><span className="font-medium">Groupe sanguin:</span> {tableauDeBord?.patient?.groupe_sanguin || 'Non renseigné'}</p>
                    <p><span className="font-medium">Allergies:</span> {tableauDeBord?.patient?.allergies || 'Aucune'}</p>
                    <p><span className="font-medium">Maladies chroniques:</span> {tableauDeBord?.patient?.maladies_chroniques || 'Aucune'}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <FaQrcode className="text-4xl mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">QR Code d'urgence</p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    <FaPrint className="mr-2" />
                    Imprimer la fiche
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bibliothèque */}
        {activeTab === 'bibliotheque' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Bibliothèque de santé</h2>
              <p className="text-gray-600">Informations et ressources médicales</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <FaBook className="text-blue-600 text-2xl mb-2" />
                  <h3 className="font-medium">Guide des maladies</h3>
                  <p className="text-sm text-gray-600">Informations sur les maladies courantes</p>
                </div>
                <div className="border rounded-lg p-4">
                  <FaPills className="text-green-600 text-2xl mb-2" />
                  <h3 className="font-medium">Guide des médicaments</h3>
                  <p className="text-sm text-gray-600">Informations sur les traitements</p>
                </div>
                <div className="border rounded-lg p-4">
                  <FaHeartbeat className="text-red-600 text-2xl mb-2" />
                  <h3 className="font-medium">Prévention</h3>
                  <p className="text-sm text-gray-600">Conseils de prévention</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Auto-mesure */}
      {showAutoMesureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Ajouter une auto-mesure</h3>
            <form onSubmit={handleAutoMesureSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de mesure</label>
                  <select
                    value={autoMesure.type_mesure}
                    onChange={(e) => setAutoMesure({...autoMesure, type_mesure: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="poids">Poids</option>
                    <option value="taille">Taille</option>
                    <option value="tension_arterielle">Tension artérielle</option>
                    <option value="glycemie">Glycémie</option>
                    <option value="temperature">Température</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
                  <input
                    type="number"
                    value={autoMesure.valeur}
                    onChange={(e) => setAutoMesure({...autoMesure, valeur: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                  <input
                    type="text"
                    value={autoMesure.unite}
                    onChange={(e) => setAutoMesure({...autoMesure, unite: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="kg, cm, mmHg, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                  <textarea
                    value={autoMesure.commentaire}
                    onChange={(e) => setAutoMesure({...autoMesure, commentaire: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAutoMesureModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Uploader un document</h3>
            <form onSubmit={handleUploadSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fichier</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full p-2 border rounded-md"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Uploader
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant wrapper avec protection
const DMPProtected = () => (
  <ProtectedPatientRoute>
    <DMP />
  </ProtectedPatientRoute>
);

export default DMPProtected; 