import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaUser, FaFileMedical, FaShieldAlt, 
  FaUpload, FaBell, FaQrcode, FaBook, FaChartBar,
  FaSignOutAlt, FaPlus, FaDownload, FaTrash,
  FaHeartbeat, FaPills, FaThermometerHalf, FaWeight,
  FaTint, FaPrint
} from "react-icons/fa";
import { ProtectedPatientRoute } from "../services/api/protectedRoute";
import { logoutPatient, getStoredPatient } from "../services/api/authApi";
import { DMPProvider } from "../context/DMPContext";
import { useDMP } from "../hooks/useDMP";
import DMPDashboard from "../components/dmp/DMPDashboard";
import DMPMonEspaceSante from "../components/dmp/DMPMonEspaceSante";
import DMPNotification from "../components/ui/DMPNotification";
import * as dmpApi from "../services/api/dmpApi";


const DMP = () => {
  const [activeTab, setActiveTab] = useState('tableau-de-bord');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableauDeBord, setTableauDeBord] = useState(null);
  const [historiqueMedical, setHistoriqueMedical] = useState([]);
  const [droitsAcces, setDroitsAcces] = useState([]);
  const [rappels, setRappels] = useState([]);
  const [notificationsDroitsAcces, setNotificationsDroitsAcces] = useState([]);
  const [showAutoMesureModal, setShowAutoMesureModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [autoMesure, setAutoMesure] = useState({
    type_mesure: 'poids',
    valeur: '',
    valeur_secondaire: '', // Pour tension (systolique/diastolique)
    unite: '',
    unite_secondaire: '', // Pour tension (mmHg)
    commentaire: '',
    date_mesure: new Date().toISOString().split('T')[0],
    heure_mesure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  
  // États pour les notifications en temps réel
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  const navigate = useNavigate();
  const { createAutoMesure } = useDMP();

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

      // Charger le tableau de bord (utilise automatiquement l'ID du patient connecté)
      const tableauData = await dmpApi.getTableauDeBord();
      setTableauDeBord(tableauData.data?.tableau_de_bord);

      // Charger les statistiques (utilise automatiquement l'ID du patient connecté)
      // const statsData = await dmpApi.getStatistiques(); // Les statistiques sont maintenant gérées par le contexte DMP

      // Charger les notifications des droits d'accès
      console.log('🔍 Chargement des notifications des droits d\'accès...');
      const notificationsData = await dmpApi.getDroitsAccesNotifications();
      console.log('📄 Notifications reçues:', notificationsData);
      setNotificationsDroitsAcces(notificationsData.notifications || []);

    } catch (error) {
      console.warn("Mode développement: utilisation des données mock");
      console.error("Erreur détaillée:", error);
      
      // Données mock pour les notifications en mode développement
      const mockNotifications = [
        {
          id: 1,
          patient_id: 5,
          titre: "Nouvelle demande d'accès DMP",
          message: "Le Dr. Martin a demandé l'accès à votre DMP pour une consultation d'urgence.",
          type: "demande_acces",
          demande_id: "access_1234567890_abc123",
          lue: false,
          repondue: false,
          date_creation: new Date().toISOString(),
          medecin_nom: "Dr. Martin",
          medecin_id: 79
        },
        {
          id: 2,
          patient_id: 5,
          titre: "Accès DMP autorisé",
          message: "Vous avez autorisé l'accès au Dr. Dupont pour 30 minutes.",
          type: "acces_autorise",
          demande_id: "access_1234567891_def456",
          lue: true,
          repondue: true,
          date_creation: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          medecin_nom: "Dr. Dupont",
          medecin_id: 80
        }
      ];
      
      setNotificationsDroitsAcces(mockNotifications);
      console.log('✅ Données mock chargées pour les notifications');
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
          const historiqueData = await dmpApi.getHistoriqueMedical(); // Utilise automatiquement l'ID du patient connecté
          setHistoriqueMedical(historiqueData.data || []);
          break;
        case 'droits-acces':
          const droitsData = await dmpApi.getDroitsAcces(); // Utilise automatiquement l'ID du patient connecté
          setDroitsAcces(droitsData.data || []);
          
          // Charger aussi les notifications des droits d'accès
          console.log('🔍 Chargement des notifications (onglet droits-acces)...');
          const notificationsData = await dmpApi.getDroitsAccesNotifications();
          console.log('📄 Notifications reçues (onglet):', notificationsData);
          setNotificationsDroitsAcces(notificationsData.notifications || []);
          break;
        case 'rappels':
          const rappelsData = await dmpApi.getRappels(); // Utilise automatiquement l'ID du patient connecté
          setRappels(rappelsData.data || []);
          break;
        case 'mon-espace-sante':
          // Documents are now handled by DMPMonEspaceSante component
          break;
        default:
          break;
      }
    } catch (error) {
      console.warn("Mode développement: utilisation des données mock");
      console.error("Erreur détaillée (loadTabData):", error);
      
      // Données mock pour les notifications en mode développement
      if (tab === 'droits-acces') {
        const mockNotifications = [
          {
            id: 1,
            patient_id: 5,
            titre: "Nouvelle demande d'accès DMP",
            message: "Le Dr. Martin a demandé l'accès à votre DMP pour une consultation d'urgence.",
            type: "demande_acces",
            demande_id: "access_1234567890_abc123",
            lue: false,
            repondue: false,
            date_creation: new Date().toISOString(),
            medecin_nom: "Dr. Martin",
            medecin_id: 79
          },
          {
            id: 2,
            patient_id: 5,
            titre: "Accès DMP autorisé",
            message: "Vous avez autorisé l'accès au Dr. Dupont pour 30 minutes.",
            type: "acces_autorise",
            demande_id: "access_1234567891_def456",
            lue: true,
            repondue: true,
            date_creation: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            medecin_nom: "Dr. Dupont",
            medecin_id: 80
          }
        ];
        
        setNotificationsDroitsAcces(mockNotifications);
        console.log('✅ Données mock chargées pour les notifications (onglet)');
      }
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

  // Fonctions pour gérer les notifications des droits d'accès
  const handleMarquerNotificationLue = async (notificationId) => {
    try {
      await dmpApi.marquerNotificationDroitsAccesLue(notificationId);
      // Mettre à jour la liste des notifications
      setNotificationsDroitsAcces(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, lue: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  const handleRepondreDemandeAcces = async (demandeId, reponse) => {
    try {
      // Afficher une confirmation avant de procéder
      const confirmationMessage = reponse === 'accepter' 
        ? 'Êtes-vous sûr de vouloir autoriser l\'accès à votre DMP ?'
        : 'Êtes-vous sûr de vouloir refuser l\'accès à votre DMP ?';
      
      if (!window.confirm(confirmationMessage)) {
        return;
      }

      await dmpApi.repondreDemandeAcces(demandeId, reponse);
      // Recharger les notifications
      const notificationsData = await dmpApi.getDroitsAccesNotifications();
      setNotificationsDroitsAcces(notificationsData.notifications || []);
      
      const message = reponse === 'accepter' 
        ? 'Demande d\'accès acceptée avec succès' 
        : 'Demande d\'accès refusée';
      alert(message);
    } catch (error) {
      console.error('Erreur lors de la réponse à la demande:', error);
      alert('Erreur lors de la réponse à la demande d\'accès');
    }
  };

  const rafraichirNotifications = async () => {
    try {
      const notificationsData = await dmpApi.getDroitsAccesNotifications();
      setNotificationsDroitsAcces(notificationsData.notifications || []);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des notifications:', error);
    }
  };

  // Fonction pour afficher une notification en temps réel
  const showNotificationToast = (notification) => {
    setCurrentNotification(notification);
    setShowNotification(true);
  };

  // Fonction pour fermer la notification
  const closeNotification = () => {
    setShowNotification(false);
    setCurrentNotification(null);
  };

  // Fonction pour gérer l'acceptation d'une demande d'accès
  const handleAcceptAccess = async (demandeId) => {
    try {
      await dmpApi.repondreDemandeAcces(demandeId, 'accepter');
      // Recharger les notifications
      const notificationsData = await dmpApi.getDroitsAccesNotifications();
      setNotificationsDroitsAcces(notificationsData.notifications || []);
      
      // Afficher une confirmation
      alert('Demande d\'accès acceptée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
      alert('Erreur lors de l\'acceptation de la demande d\'accès');
    }
  };

  // Fonction pour gérer le refus d'une demande d'accès
  const handleRejectAccess = async (demandeId) => {
    try {
      await dmpApi.repondreDemandeAcces(demandeId, 'refuser');
      // Recharger les notifications
      const notificationsData = await dmpApi.getDroitsAccesNotifications();
      setNotificationsDroitsAcces(notificationsData.notifications || []);
      
      // Afficher une confirmation
      alert('Demande d\'accès refusée');
    } catch (error) {
      console.error('Erreur lors du refus:', error);
      alert('Erreur lors du refus de la demande d\'accès');
    }
  };

  // Fonction pour marquer une notification comme lue
  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await dmpApi.marquerNotificationDroitsAccesLue(notificationId);
      // Mettre à jour la liste des notifications
      setNotificationsDroitsAcces(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, lue: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  // Vérifier les nouvelles notifications périodiquement
  useEffect(() => {
    const checkNewNotifications = async () => {
      try {
        const notificationsData = await dmpApi.getDroitsAccesNotifications();
        const newNotifications = notificationsData.notifications || [];
        
        // Trouver les nouvelles notifications non lues
        const unreadNotifications = newNotifications.filter(n => !n.lue);
        
        if (unreadNotifications.length > 0) {
          // Afficher la première notification non lue
          const latestNotification = unreadNotifications[0];
          showNotificationToast(latestNotification);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des notifications:', error);
      }
    };

    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkNewNotifications, 30000);
    
    // Vérification initiale
    checkNewNotifications();

    return () => clearInterval(interval);
  }, []);

  // Fonction pour obtenir l'icône selon le type de notification
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'demande_acces':
        return '🔔';
      case 'acces_autorise':
        return '✅';
      case 'acces_refuse':
        return '❌';
      default:
        return '📋';
    }
  };

  // Fonction pour obtenir la couleur selon le type de notification
  const getNotificationColor = (type) => {
    switch (type) {
      case 'demande_acces':
        return 'border-orange-200 bg-orange-50';
      case 'acces_autorise':
        return 'border-green-200 bg-green-50';
      case 'acces_refuse':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  // Fonction pour obtenir le statut en français
  const getStatusText = (type) => {
    switch (type) {
      case 'demande_acces':
        return 'Demande en attente';
      case 'acces_autorise':
        return 'Accès autorisé';
      case 'acces_refuse':
        return 'Accès refusé';
      default:
        return 'Notification';
    }
  };

  const handleAutoMesureSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateMesure()) {
      return;
    }

    try {
      setLoading(true);
      
      // Préparer les données selon le type de mesure
      const mesureData = {
        ...autoMesure,
        valeur_formatee: autoMesure.type_mesure === 'tension_arterielle' 
          ? `${autoMesure.valeur}/${autoMesure.valeur_secondaire} ${autoMesure.unite}`
          : `${autoMesure.valeur} ${autoMesure.unite}`,
        date_complete: `${autoMesure.date_mesure} à ${autoMesure.heure_mesure}`
      };

      console.log('Mesure à enregistrer:', mesureData);
      
      // Utiliser le contexte DMP pour créer l'auto-mesure
      const response = await createAutoMesure(mesureData);
      
      if (response) {
        console.log('✅ Auto-mesure créée avec succès via contexte:', response);
        
        setShowAutoMesureModal(false);
        
        // Réinitialiser le formulaire
        const config = getMesureConfig('poids');
        setAutoMesure({
          type_mesure: 'poids',
          valeur: '',
          valeur_secondaire: '',
          unite: config.unite,
          unite_secondaire: '',
          commentaire: '',
          date_mesure: new Date().toISOString().split('T')[0],
          heure_mesure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        });
        
        alert('Mesure enregistrée avec succès !');
      } else {
        throw new Error('Réponse invalide de l\'API');
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert(`Erreur lors de l'enregistrement de la mesure: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) {
      alert('Veuillez sélectionner un fichier et saisir un titre');
      return;
    }

    try {
      setLoading(true);
      // Simulation de l'upload - à remplacer par l'API réelle
      // Note: Document upload is now handled by DMPMonEspaceSante component
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      
      alert('Document uploadé avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload du document');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validation de la taille du fichier (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB en bytes
      const warningSize = 8 * 1024 * 1024; // 8MB - seuil d'avertissement
      
      if (file.size > maxSize) {
        alert('Le fichier est trop volumineux. Taille maximale autorisée : 10MB');
        e.target.value = ''; // Réinitialiser l'input
        return;
      }

      // Avertissement si le fichier est proche de la limite
      if (file.size > warningSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const remainingMB = (10 - fileSizeMB).toFixed(1);
        alert(`Attention : Votre fichier fait ${fileSizeMB}MB. Il reste ${remainingMB}MB disponibles sur la limite de 10MB.`);
      }

      // Validation du type de fichier autorisé
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Type de fichier non autorisé. Types acceptés : JPG, PNG, GIF, PDF, TXT, DOC, DOCX');
        e.target.value = ''; // Réinitialiser l'input
        return;
      }

      setUploadFile(file);
    }
  };







  // Configuration spécifique pour chaque type de mesure
  const getMesureConfig = (type) => {
    const configs = {
      poids: {
        label: 'Poids',
        icon: FaWeight,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100',
        unite: 'kg',
        placeholder: 'Ex: 75',
        min: 20,
        max: 300,
        step: 0.1,
        description: 'Votre poids en kilogrammes'
      },
      taille: {
        label: 'Taille',
        icon: FaUser,
        color: 'text-green-500',
        bgColor: 'bg-green-100',
        unite: 'cm',
        placeholder: 'Ex: 175',
        min: 50,
        max: 250,
        step: 0.5,
        description: 'Votre taille en centimètres'
      },
      tension_arterielle: {
        label: 'Tension artérielle',
        icon: FaHeartbeat,
        color: 'text-red-500',
        bgColor: 'bg-red-100',
        unite: 'mmHg',
        placeholder_systolique: 'Ex: 120',
        placeholder_diastolique: 'Ex: 80',
        min: 50,
        max: 300,
        step: 1,
        description: 'Votre tension artérielle (systolique/diastolique)',
        hasSecondValue: true
      },
      glycemie: {
        label: 'Glycémie',
        icon: FaTint,
        color: 'text-purple-500',
        bgColor: 'bg-purple-100',
        unite: 'mg/dL',
        placeholder: 'Ex: 95',
        min: 20,
        max: 600,
        step: 1,
        description: 'Votre taux de glycémie'
      },
      temperature: {
        label: 'Température',
        icon: FaThermometerHalf,
        color: 'text-orange-500',
        bgColor: 'bg-orange-100',
        unite: '°C',
        placeholder: 'Ex: 36.8',
        min: 30,
        max: 45,
        step: 0.1,
        description: 'Votre température corporelle'
      },
      saturation: {
        label: 'Saturation O2',
        icon: FaHeartbeat,
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-100',
        unite: '%',
        placeholder: 'Ex: 98',
        min: 70,
        max: 100,
        step: 1,
        description: 'Votre saturation en oxygène'
      }
    };
    return configs[type] || configs.poids;
  };

  // Réinitialiser le formulaire quand le type change
  const handleTypeMesureChange = (newType) => {
    const config = getMesureConfig(newType);
    setAutoMesure(prev => ({
      ...prev,
      type_mesure: newType,
      valeur: '',
      valeur_secondaire: '',
      unite: config.unite,
      unite_secondaire: config.hasSecondValue ? config.unite : ''
    }));
  };

  // Validation spécifique selon le type
  const validateMesure = () => {
    const config = getMesureConfig(autoMesure.type_mesure);
    const valeur = parseFloat(autoMesure.valeur);
    const valeurSecondaire = parseFloat(autoMesure.valeur_secondaire);

    if (!autoMesure.valeur) {
      alert('Veuillez saisir une valeur');
      return false;
    }

    if (valeur < config.min || valeur > config.max) {
      alert(`La valeur doit être comprise entre ${config.min} et ${config.max} ${config.unite}`);
      return false;
    }

    if (config.hasSecondValue && !autoMesure.valeur_secondaire) {
      alert('Veuillez saisir les deux valeurs (systolique et diastolique)');
      return false;
    }

    if (config.hasSecondValue && (valeurSecondaire < config.min || valeurSecondaire > config.max)) {
      alert(`La valeur diastolique doit être comprise entre ${config.min} et ${config.max} ${config.unite}`);
      return false;
    }

    return true;
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
      {/* Notification en temps réel */}
      {currentNotification && (
        <DMPNotification
          notification={currentNotification}
          show={showNotification}
          onAccept={handleAcceptAccess}
          onReject={handleRejectAccess}
          onMarkAsRead={handleMarkNotificationAsRead}
          onClose={closeNotification}
        />
      )}
      
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
              
              {/* Indicateur de notifications des droits d'accès */}
              {notificationsDroitsAcces.filter(n => !n.lue).length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setActiveTab('droits-acces')}
                    className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    <FaBell className="mr-2" />
                    Notifications
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {notificationsDroitsAcces.filter(n => !n.lue).length}
                    </span>
                  </button>
                </div>
              )}
              
              {activeTab === 'mon-espace-sante' && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <FaUpload className="mr-2" />
                  Upload Document
                </button>
              )}
              
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
              { id: 'mon-espace-sante', label: 'Mon espace de santé', icon: FaHeartbeat },
              { id: 'historique', label: 'Historique médical', icon: FaFileMedical },
              { 
                id: 'droits-acces', 
                label: 'Droits d\'accès', 
                icon: FaShieldAlt,
                badge: notificationsDroitsAcces.filter(n => !n.lue).length > 0 ? notificationsDroitsAcces.filter(n => !n.lue).length : null
              },
              { id: 'rappels', label: 'Rappels', icon: FaBell },
              { id: 'urgence', label: 'Fiche d\'urgence', icon: FaQrcode },
              { id: 'bibliotheque', label: 'Bibliothèque', icon: FaBook }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm relative ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="mr-2" />
                  {tab.label}
                  {tab.badge && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {tab.badge}
                    </span>
                  )}
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
        {activeTab === 'tableau-de-bord' && (
          <DMPDashboard />
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
            
            {/* Debug: Afficher l'état des notifications */}
            {console.log('🔍 État des notifications dans le rendu:', notificationsDroitsAcces)}
            
            {/* Section des notifications améliorée */}
            {notificationsDroitsAcces.length > 0 && (
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <FaBell className="text-blue-600 text-lg" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Notifications d'accès DMP
                      </h3>
                      <p className="text-sm text-gray-600">
                        {notificationsDroitsAcces.filter(n => !n.lue).length} nouvelle(s) demande(s) en attente
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={rafraichirNotifications}
                    className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Rafraîchir
                  </button>
                </div>
                
                <div className="space-y-4">
                  {notificationsDroitsAcces.map((notification, index) => (
                    <div key={index} className={`border rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${getNotificationColor(notification.type)} ${!notification.lue ? 'ring-2 ring-blue-200' : ''}`}>
                      <div className="flex items-start space-x-4">
                        {/* Icône de statut */}
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${notification.type === 'demande_acces' ? 'bg-orange-100' : notification.type === 'acces_autorise' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        
                        {/* Contenu de la notification */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900">{notification.titre}</h4>
                              {!notification.lue && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                                  Nouveau
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                notification.type === 'demande_acces' ? 'bg-orange-100 text-orange-800' :
                                notification.type === 'acces_autorise' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {getStatusText(notification.type)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {!notification.lue && (
                                <button
                                  onClick={() => handleMarquerNotificationLue(notification.id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                                >
                                  Marquer comme lue
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-3 leading-relaxed">{notification.message}</p>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              📅 {new Date(notification.date_creation).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            
                            {/* Actions pour les demandes d'accès */}
                            {notification.type === 'demande_acces' && !notification.repondue && (
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleRepondreDemandeAcces(notification.demande_id, 'accepter')}
                                  className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Autoriser l'accès
                                </button>
                                <button
                                  onClick={() => handleRepondreDemandeAcces(notification.demande_id, 'refuser')}
                                  className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Refuser l'accès
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Section quand il n'y a pas de notifications */}
            {notificationsDroitsAcces.length === 0 && (
              <div className="p-6 border-b bg-gray-50">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaBell className="text-gray-400 text-xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification</h3>
                  <p className="text-gray-600">Vous n'avez actuellement aucune demande d'accès en attente.</p>
                </div>
              </div>
            )}
            
            {/* Section des professionnels autorisés améliorée */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Professionnels autorisés</h3>
                  <p className="text-sm text-gray-600">Liste des médecins ayant accès à votre DMP</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {droitsAcces.length} professionnel(s) autorisé(s)
                  </span>
                </div>
              </div>
              
              {droitsAcces.length > 0 ? (
                <div className="space-y-4">
                  {droitsAcces.map((droit, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Dr. {droit.professionnel?.nom} {droit.professionnel?.prenom}
                            </h4>
                            <p className="text-sm text-gray-600">{droit.professionnel?.specialite}</p>
                            <p className="text-xs text-gray-500">
                              ✅ Autorisé le {new Date(droit.date_autorisation).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Voir détails
                          </button>
                          <button className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors">
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun professionnel autorisé</h3>
                  <p className="text-gray-600 mb-4">Aucun médecin n'a actuellement accès à votre dossier médical partagé.</p>
                  <p className="text-sm text-gray-500">Les demandes d'accès apparaîtront dans la section notifications ci-dessus.</p>
                </div>
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

        {/* Mon Espace de Santé */}
        {activeTab === 'mon-espace-sante' && (
          <DMPMonEspaceSante />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ajouter une auto-mesure</h3>
              <button
                onClick={() => setShowAutoMesureModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAutoMesureSubmit}>
              {(() => {
                const config = getMesureConfig(autoMesure.type_mesure);
                const Icon = config.icon;
                
                return (
                  <div className="space-y-6">
                    {/* En-tête avec icône et description */}
                    <div className={`p-4 ${config.bgColor} rounded-lg`}>
                      <div className="flex items-center mb-2">
                        <Icon className={`mr-3 ${config.color} text-xl`} />
                        <h4 className="font-medium text-gray-900">{config.label}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>

                    {/* Sélection du type de mesure */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type de mesure</label>
                      <select
                        value={autoMesure.type_mesure}
                        onChange={(e) => handleTypeMesureChange(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="poids">Poids</option>
                        <option value="taille">Taille</option>
                        <option value="tension_arterielle">Tension artérielle</option>
                        <option value="glycemie">Glycémie</option>
                        <option value="temperature">Température</option>
                        <option value="saturation">Saturation O2</option>
                      </select>
                    </div>

                    {/* Champs de valeurs selon le type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {config.hasSecondValue ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Systolique ({config.unite})
                            </label>
                            <input
                              type="number"
                              value={autoMesure.valeur}
                              onChange={(e) => setAutoMesure({...autoMesure, valeur: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={config.placeholder_systolique}
                              min={config.min}
                              max={config.max}
                              step={config.step}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Diastolique ({config.unite})
                            </label>
                            <input
                              type="number"
                              value={autoMesure.valeur_secondaire}
                              onChange={(e) => setAutoMesure({...autoMesure, valeur_secondaire: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={config.placeholder_diastolique}
                              min={config.min}
                              max={config.max}
                              step={config.step}
                              required
                            />
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valeur ({config.unite})
                          </label>
                          <input
                            type="number"
                            value={autoMesure.valeur}
                            onChange={(e) => setAutoMesure({...autoMesure, valeur: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={config.placeholder}
                            min={config.min}
                            max={config.max}
                            step={config.step}
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* Date et heure de la mesure */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de mesure</label>
                        <input
                          type="date"
                          value={autoMesure.date_mesure}
                          onChange={(e) => setAutoMesure({...autoMesure, date_mesure: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Heure de mesure</label>
                        <input
                          type="time"
                          value={autoMesure.heure_mesure}
                          onChange={(e) => setAutoMesure({...autoMesure, heure_mesure: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Commentaire */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Commentaire (optionnel)
                      </label>
                      <textarea
                        value={autoMesure.commentaire}
                        onChange={(e) => setAutoMesure({...autoMesure, commentaire: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Ajoutez un commentaire sur cette mesure..."
                      />
                    </div>

                    {/* Informations de validation */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Plage de valeurs acceptées :</strong> {config.min} - {config.max} {config.unite}
                      </p>
                      {config.hasSecondValue && (
                        <p className="text-sm text-blue-800 mt-1">
                          <strong>Format tension :</strong> Systolique/Diastolique (ex: 120/80 mmHg)
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAutoMesureModal(false)}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer la mesure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
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
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx"
                    required
                  />
                  {uploadFile && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Fichier sélectionné :</strong> {uploadFile.name}
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>Taille :</strong> {(uploadFile.size / (1024 * 1024)).toFixed(2)}MB 
                        {uploadFile.size > 8 * 1024 * 1024 && (
                          <span className="text-orange-600 font-medium"> (Proche de la limite de 10MB)</span>
                        )}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Limite maximale : 10MB | Types acceptés : JPG, PNG, GIF, PDF, TXT, DOC, DOCX
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
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
    <DMPProvider>
      <DMP />
    </DMPProvider>
  </ProtectedPatientRoute>
);

export default DMPProtected; 