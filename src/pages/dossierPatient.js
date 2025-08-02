import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { getPatients, getPatientRendezVous, getProchainRendezVous, getDocumentsRecents, getResumeMedical, createDossierMedical, getServices, getAllDossiersMedical, getDossierMedical, closeDossierPatient, updateDossierPatient } from "../services/api/medicalApi";

function DossierPatient() {
  const navigate = useNavigate();

  const loadServices = async () => {
    setServicesLoading(true);
    try {
      console.log('Début du chargement des services...');
      const servicesData = await getServices();
      console.log('Services data received:', servicesData);
      console.log('Services data type:', typeof servicesData);
      console.log('Services data isArray:', Array.isArray(servicesData));
      
      if (Array.isArray(servicesData)) {
        console.log('Setting services array:', servicesData);
        if (servicesData.length > 0) {
          console.log('First service structure:', servicesData[0]);
          console.log('Available keys in first service:', Object.keys(servicesData[0]));
        }
        setServices(servicesData);
        console.log(`${servicesData.length} services chargés avec succès`);
      } else if (servicesData && typeof servicesData === 'object') {
        console.log('Services data is an object, checking for nested services...');
        const possibleServices = servicesData.services || servicesData.data || servicesData.result || [];
        if (Array.isArray(possibleServices)) {
          console.log('Found services in nested object:', possibleServices);
          setServices(possibleServices);
          console.log(`${possibleServices.length} services chargés depuis l'objet imbriqué`);
        } else {
          console.error('No valid services array found in object:', servicesData);
          setServices([]);
        }
      } else {
        console.error('Unexpected services data format:', servicesData);
        if (servicesData && typeof servicesData === 'object') {
          console.error('Services data keys:', Object.keys(servicesData));
        }
        setServices([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      });
      setServices([]);
    } finally {
      setServicesLoading(false);
      console.log('Chargement des services terminé');
    }
  };

  // Function to get service name by ID
  const getServiceNameById = (serviceId) => {
    if (!Array.isArray(services) || services.length === 0) {
      return `Service ID: ${serviceId}`;
    }
    
    const service = services.find(s => {
      const id = s.id || s.id_service || s.service_id;
      return id == serviceId;
    });
    
    if (service) {
      return service.name || service.nom || service.libelle || service.service_name || `Service ID: ${serviceId}`;
    }
    
    return `Service ID: ${serviceId}`;
  };

  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    console.log('Submitting patient file form:', patientFileForm);
    
    // Validation côté client
    if (!patientFileForm.patient_id) {
      alert('Veuillez sélectionner un patient');
      return;
    }
    
    if (!patientFileForm.service_id) {
      alert('Veuillez sélectionner un service');
      return;
    }
    
    if (!patientFileForm.dateOuverture) {
      alert('Veuillez saisir une date d\'ouverture');
      return;
    }
    
    // Validation de la date de fermeture si elle est fournie
    if (patientFileForm.dateFermeture && patientFileForm.dateFermeture < patientFileForm.dateOuverture) {
      alert('La date de fermeture ne peut pas être antérieure à la date d\'ouverture');
      return;
    }
    
    setLoading(true);
    try {
      // Convert dates to ISO format
      const formData = {
        ...patientFileForm,
        dateOuverture: patientFileForm.dateOuverture ? new Date(patientFileForm.dateOuverture).toISOString() : null,
        dateFermeture: patientFileForm.dateFermeture ? new Date(patientFileForm.dateFermeture).toISOString() : null
      };
      
      console.log('Formatted form data:', formData);
      const response = await createDossierMedical(formData);
      console.log('Dossier créé avec succès:', response);
      alert('Dossier patient créé avec succès!');
      setShowPatientFileModal(false);
      
      // Reload dossiers patients if we're on the shared-folder tab
      if (activeTab === "shared-folder") {
        await loadDossiersPatients();
      }
      
      // Reset form
      setPatientFileForm({
        patient_id: '',
        service_id: '',
        statut: 'actif',
        dateOuverture: new Date().toISOString().split('T')[0],
        dateFermeture: '',
        resume_medical: '',
        antecedents_medicaux: '',
        allergies: '',
        traitement: '',
        signes_vitaux: '',
        histoire_familiale: '',
        observations: '',
        directives_anticipees: ''
      });
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      let errorMessage = 'Erreur lors de la création du dossier';
      
      if (error.includes('validation')) {
        errorMessage = error;
      } else if (error.includes('ID du patient requis')) {
        errorMessage = 'Veuillez sélectionner un patient';
      } else if (error.includes('ID du service requis')) {
        errorMessage = 'Veuillez sélectionner un service';
      } else if (error.includes('format ISO')) {
        errorMessage = 'Erreur de format de date. Veuillez vérifier les dates saisies.';
      } else if (error.includes('404') || error.includes('Not Found')) {
        errorMessage = 'Service temporairement indisponible. Veuillez réessayer plus tard.';
      } else if (error.includes('500') || error.includes('Internal Server Error')) {
        errorMessage = 'Erreur serveur. Veuillez contacter l\'administrateur.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientFileForm((prev) => ({ ...prev, [name]: value }));
  };

  const loadPatientsForSelect = async () => {
    try {
      console.log('Début du chargement des patients pour sélection...');
      const patientsData = await getPatients();
      console.log('Patients loaded for select:', patientsData);
      
      if (!Array.isArray(patientsData)) {
        console.error('Expected an array of patients but received:', patientsData);
        setPatientsForSelect([]);
        return;
      }
      
      // Format patients for the select dropdown
      const formattedPatientsForSelect = patientsData.map(patient => ({
        id: patient.id_patient,
        name: `${patient.prenom || ''} ${patient.nom || ''}`.trim() || 'Nom inconnu',
        numero_dossier: patient.numero_dossier || 'N/A'
      }));
      
      console.log('Formatted patients for select:', formattedPatientsForSelect);
      setPatientsForSelect(formattedPatientsForSelect);
      console.log(`${formattedPatientsForSelect.length} patients formatés pour la sélection`);
    } catch (error) {
      console.error('Erreur lors du chargement des patients pour sélection:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      });
      setPatientsForSelect([]);
    }
  };

  const loadDossiersPatients = async () => {
    setDossiersLoading(true);
    try {
      console.log('Chargement des dossiers patients...');
      const dossiersData = await getAllDossiersMedical();
      console.log('Dossiers patients reçus:', dossiersData);
      
      let dossiers = [];
      if (dossiersData && dossiersData.status === 'success' && dossiersData.data && Array.isArray(dossiersData.data)) {
        dossiers = dossiersData.data;
        console.log('Setting dossiers from dossiersData.data:', dossiers);
        console.log('First dossier structure:', dossiers[0]);
        console.log(`${dossiers.length} dossiers patients chargés avec succès`);
      } else if (Array.isArray(dossiersData)) {
        dossiers = dossiersData;
        console.log('Setting dossiers from direct array:', dossiers);
        console.log('First dossier structure:', dossiers[0]);
        console.log(`${dossiers.length} dossiers patients chargés`);
      } else {
        console.error('Format de données inattendu:', dossiersData);
        console.error('Type of dossiersData:', typeof dossiersData);
        console.error('Keys in dossiersData:', dossiersData ? Object.keys(dossiersData) : 'null');
        setDossiersPatients([]);
        return;
      }

      // Log detailed information about each dossier to diagnose patient data issues
      dossiers.forEach((dossier, index) => {
        console.log(`=== DIAGNOSTIC DOSSIER ${index + 1} ===`);
        console.log('ID:', dossier.id_dossier || dossier.id);
        console.log('Numéro:', dossier.numeroDossier);
        console.log('Patient ID:', dossier.patient_id);
        console.log('Service ID:', dossier.service_id);
        console.log('Has patient object:', !!dossier.patient);
        console.log('Patient object:', dossier.patient);
        console.log('Patient name fields:', {
          patient_name: dossier.patient_name,
          patient_nom: dossier.patient_nom,
          Patient_nom: dossier.Patient?.nom
        });
        console.log('Service name fields:', {
          service_name: dossier.service_name,
          service_nom: dossier.service_nom,
          ServiceSante_nom: dossier.ServiceSante?.nom
        });
        console.log('All keys:', Object.keys(dossier));
        console.log('=====================================');
      });

      setDossiersPatients(dossiers);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers patients:', error);
      setDossiersPatients([]);
    } finally {
      setDossiersLoading(false);
    }
  };

  const openDossierModal = async (dossier) => {
    setSelectedDossier(dossier);
    setShowDossierModal(true);
    setDossierDetailsLoading(true);
    
    try {
      // Use the correct ID field - backend uses 'id' not 'Id'
      const dossierId = dossier.id || dossier.Id || dossier.dossier_id || dossier.id_dossier;
      console.log('Loading dossier details for ID:', dossierId);
      const details = await getDossierMedical(dossierId);
      console.log('Dossier details received:', details);
      
      // Handle the response format from backend
      let dossierData;
      if (details && details.data) {
        dossierData = details.data;
      } else {
        dossierData = details;
      }
      
      // Enrich with patient information if not already present
      if (dossierData && !dossierData.patient && dossier.patient_info) {
        dossierData.patient = dossier.patient_info;
      }
      
      // Add patient name if available from enriched dossier data
      if (dossierData && !dossierData.patient_name && dossier.patient_name) {
        dossierData.patient_name = dossier.patient_name;
      }
      
      // Add file number if available
      if (dossierData && !dossierData.numeroDossier) {
        dossierData.numeroDossier = dossier.numeroDossier || dossier.id_dossier || dossier.id;
      }
      
      setDossierDetails(dossierData);
    } catch (error) {
      console.error('Erreur lors du chargement des détails du dossier:', error);
      setDossierDetails(null);
    } finally {
      setDossierDetailsLoading(false);
    }
  };

  const closeDossierModal = () => {
    setShowDossierModal(false);
    setSelectedDossier(null);
    setDossierDetails(null);
  };

  const handleEditDossier = (dossier) => {
    console.log('Opening edit modal for dossier:', dossier);
    setSelectedDossier(dossier);
    
    // Pre-fill the form with existing data
    setEditDossierForm({
      statut: dossier.statut || '',
      type_dossier: dossier.type_dossier || '',
      service_id: dossier.service_id || '',
      medecin_referent_id: dossier.medecin_referent_id || '',
      resume: dossier.resume || '',
      antecedent_medicaux: dossier.antecedent_medicaux || '',
      allergies: dossier.allergies || '',
      traitements_chroniques: dossier.traitements_chroniques || '',
      heart_rate: dossier.heart_rate || '',
      blood_pressure: dossier.blood_pressure || '',
      temperature: dossier.temperature || '',
      respiratory_rate: dossier.respiratory_rate || '',
      oxygen_saturation: dossier.oxygen_saturation || '',
      habitudes_vie: dossier.habitudes_vie || '',
      historique_familial: dossier.historique_familial || '',
      directives_anticipées: dossier.directives_anticipées || '',
      observations: dossier.observations || '',
      date_fermeture: dossier.date_fermeture ? new Date(dossier.date_fermeture).toISOString().split('T')[0] : '',
      motif_fermeture: dossier.motif_fermeture || ''
    });
    
    setShowEditDossierModal(true);
  };

  const handleEditDossierInputChange = (e) => {
    const { name, value } = e.target;
    setEditDossierForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateDossier = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const dossierId = selectedDossier.id_dossier || selectedDossier.id;
      console.log('Updating dossier:', dossierId, editDossierForm);
      
      // Convert date to ISO format if provided
      const formData = {
        ...editDossierForm,
        date_fermeture: editDossierForm.date_fermeture ? new Date(editDossierForm.date_fermeture).toISOString() : null
      };
      
      await updateDossierPatient(dossierId, formData);
      alert('Dossier mis à jour avec succès!');
      setShowEditDossierModal(false);
      
      // Reload dossiers list
      await loadDossiersPatients();
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du dossier:', error);
      alert('Erreur lors de la mise à jour du dossier: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const closeEditDossierModal = () => {
    setShowEditDossierModal(false);
    setSelectedDossier(null);
    setEditDossierForm({
      statut: '',
      type_dossier: '',
      service_id: '',
      medecin_referent_id: '',
      resume: '',
      antecedent_medicaux: '',
      allergies: '',
      traitements_chroniques: '',
      heart_rate: '',
      blood_pressure: '',
      temperature: '',
      respiratory_rate: '',
      oxygen_saturation: '',
      habitudes_vie: '',
      historique_familial: '',
      directives_anticipées: '',
      observations: '',
      date_fermeture: '',
      motif_fermeture: ''
    });
  };

  const handleCloseDossier = async (dossier) => {
    if (window.confirm('Êtes-vous sûr de vouloir fermer ce dossier ?')) {
      try {
        const dossierId = dossier.id || dossier.Id || dossier.dossier_id;
        await closeDossierPatient(dossierId);
        alert('Dossier fermé avec succès');
        // Reload the dossiers list
        await loadDossiersPatients();
      } catch (error) {
        console.error('Erreur lors de la fermeture du dossier:', error);
        alert('Erreur lors de la fermeture du dossier: ' + error);
      }
    }
  };

  const handleReactivateDossier = async (dossier) => {
    if (window.confirm('Êtes-vous sûr de vouloir réactiver ce dossier ?')) {
      try {
        const dossierId = dossier.id || dossier.Id || dossier.dossier_id;
        // Update the dossier status to 'actif'
        await updateDossierPatient(dossierId, { statut: 'actif', dateFermeture: null });
        alert('Dossier réactivé avec succès');
        // Reload the dossiers list
        await loadDossiersPatients();
      } catch (error) {
        console.error('Erreur lors de la réactivation du dossier:', error);
        alert('Erreur lors de la réactivation du dossier: ' + error);
      }
    }
  };

  const openPatientFileModal = async () => {
    console.log('Opening patient file modal...');
    
    // Set modal to open first
    setShowPatientFileModal(true);
    
    // Load services and patients in parallel
    try {
      await Promise.all([
        loadServices(),
        loadPatientsForSelect()
      ]);
      console.log('Services and patients loaded successfully');
    } catch (error) {
      console.error('Error loading data for modal:', error);
    }
  };

  const closePatientFileModal = () => {
    setShowPatientFileModal(false);
    setPatientFileForm({
      patient_id: '',
      service_id: '',
      statut: 'actif',
      dateOuverture: new Date().toISOString().split('T')[0],
      dateFermeture: '',
      resume_medical: '',
      antecedents_medicaux: '',
      allergies: '',
      traitement: '',
      signes_vitaux: '',
      histoire_familiale: '',
      observations: '',
      directives_anticipees: ''
    });
  };
  const [activeTab, setActiveTab] = useState("patients-list");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [modalPatient, setModalPatient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePatient, setSharePatient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPatientFileModal, setShowPatientFileModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRecent, setFilterRecent] = useState(false);
  const [filterShared, setFilterShared] = useState(false);
  const [accessRules] = useState([]);
  const [accessHistory] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [patientsForSelect, setPatientsForSelect] = useState([]);
  const [dossiersPatients, setDossiersPatients] = useState([]);
  const [dossiersLoading, setDossiersLoading] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierDetails, setDossierDetails] = useState(null);
  const [dossierDetailsLoading, setDossierDetailsLoading] = useState(false);
  const [showEditDossierModal, setShowEditDossierModal] = useState(false);
  const [editDossierForm, setEditDossierForm] = useState({
    statut: '',
    type_dossier: '',
    service_id: '',
    medecin_referent_id: '',
    resume: '',
    antecedent_medicaux: '',
    allergies: '',
    traitements_chroniques: '',
    heart_rate: '',
    blood_pressure: '',
    temperature: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    habitudes_vie: '',
    historique_familial: '',
    directives_anticipées: '',
    observations: '',
    date_fermeture: '',
    motif_fermeture: ''
  });
  
  // Form state for patient file creation
  const [patientFileForm, setPatientFileForm] = useState({
    patient_id: '',
    service_id: '',
    statut: 'actif',
    dateOuverture: new Date().toISOString().split('T')[0],
    dateFermeture: '',
    resume_medical: '',
    antecedents_medicaux: '',
    allergies: '',
    traitement: '',
    signes_vitaux: '',
    histoire_familiale: '',
    observations: '',
    directives_anticipees: ''
  });

  const [notifications] = useState([
    {
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      title: "Demande de partage de dossier",
      time: "10 min ago",
      content: "Dr. Sophie Laurent demande l'accès au dossier de Jean Martin",
      actions: [
        { label: "Approuver", color: "bg-green-100 text-green-800 hover:bg-green-200" },
        { label: "Refuser", color: "bg-red-100 text-red-800 hover:bg-red-200" }
      ]
    }
  ]);

  // Chargement initial des patients et services
  useEffect(() => {
    loadPatients();
    loadServices();
  }, []);

  // Reload services when modal opens
  useEffect(() => {
    if (showPatientFileModal) {
      console.log('Modal opened, ensuring services are loaded...');
      loadServices();
    }
  }, [showPatientFileModal]);

  // Load dossiers patients when switching to shared-folder tab
  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
    if (activeTab === "shared-folder") {
      console.log('Switching to shared-folder tab, loading dossiers patients...');
      loadDossiersPatients();
    }
  }, [activeTab]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      console.log('Loading patients...');
      const patientsData = await getPatients();
      console.log('API response raw:', patientsData);
      console.log('Type of response:', typeof patientsData);

      if (!patientsData) {
        console.error('No patient data received:', patientsData);
        setPatients([]);
        return [];
      }

      if (!Array.isArray(patientsData)) {
        console.error('Expected an array of patients but received:', patientsData);
        setPatients([]);
        return [];
      }

      if (patientsData.length === 0) {
        console.warn('Received empty patient array:', patientsData);
      }
      
      // Map the patients to the expected format
      const formattedPatients = patientsData.map(patient => ({
        id: patient.id_patient || 'unknown',
        name: `${patient.prenom || ''} ${patient.nom || ''}`.trim() || 'Nom inconnu',
        birth: patient.date_naissance 
          ? new Date(patient.date_naissance).toLocaleDateString('fr-FR')
          : 'Non renseigné',
        status: patient.statut || 'Actif',
        statusColor: (patient.statut === 'actif' || patient.statut === 'Actif') ? 'green' : 'red',
        lastConsult: patient.date_derniere_consultation 
          ? new Date(patient.date_derniere_consultation).toLocaleDateString('fr-FR')
          : 'Aucune',
        gender: patient.sexe === 'M' ? 'Homme' : 'Femme',
        blood: patient.groupe_sanguin || 'Non renseigné',
        phone: patient.telephone || 'Non renseigné',
        email: patient.email || 'Non renseigné',
        address: `${patient.adresse || ''} ${patient.code_postal ? patient.code_postal + ' ' : ''}${patient.ville || ''}`.trim() || 'Non renseigné',
        numero_dossier: patient.numero_dossier || 'N/A',
        rawData: patient // Keep the raw data in case we need it
      }));

      console.log('Formatted patients:', formattedPatients);
      setPatients(formattedPatients);
      return formattedPatients;
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
      console.error('Détails de l\'erreur:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      setPatients([]);
      return [];
    } finally {
      setLoading(false);
    }
  };


  // Gestion des modals
  const openPatientModal = async (patient) => {
    setModalPatient(patient);
    setShowPatientModal(true);
  };

  const closePatientModal = () => {
    setShowPatientModal(false);
    setModalPatient(null);
  };

  const openEditModal = (patient) => {
    setEditPatient(patient);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditPatient(null);
  };

  const openShareModal = (patient) => {
    setSharePatient(patient);
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setSharePatient(null);
  };

  const openAddModal = () => {
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  // Fonction pour filtrer les patients selon la recherche (commentée car non utilisée pour l'instant)
  // const filteredPatients = patients.filter(patient => {
  //   const searchLower = search.toLowerCase();
  //   const patientName = `${patient.nom || ''} ${patient.prenom || ''}`.toLowerCase();
  //   return patientName.includes(searchLower);
  // });

  // Formatage des données patient pour l'affichage

  return (
    <div className="bg-gray-100 min-h-screen">
      <button 
        onClick={() => navigate('/medecin')} 
        className="fixed top-4 left-4 z-10 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Retour
      </button>
    
      <div className="flex container mx-auto">
        {/* Sidebar */}
        <div className="sidebar w-64 bg-white p-4 shadow-md">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Menu</h2>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab("patients-list")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${activeTab === "patients-list" ? "bg-blue-100 font-bold" : "hover:bg-blue-50"}`}>
                  <span>📁</span> <span>Liste des Patients</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("shared-folder")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${activeTab === "shared-folder" ? "bg-blue-100 font-bold" : "hover:bg-blue-50"}`}>
                  <span>📁</span> <span>Dossiers Patients</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("access-manager")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${activeTab === "access-manager" ? "bg-blue-100 font-bold" : "hover:bg-blue-50"}`}>
                  <span>🔒</span> <span>Gestion des Accès</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 relative ${activeTab === "notifications" ? "bg-blue-100 font-bold" : "hover:bg-blue-50"}`}>
                  <span>🔔</span> <span>Notifications</span>
                  <span className="notification-badge absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center" style={{display:"inline"}}>3</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Recherche</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un patient..."
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="absolute right-2 top-2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Filtres</h2>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-blue-500" checked={filterRecent} onChange={() => setFilterRecent(v=>!v)} />
                <span>Consultation récente</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-blue-500" checked={filterShared} onChange={() => setFilterShared(v=>!v)} />
                <span>Dossiers mutualisés</span>
              </label>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="content-area flex-1 p-6">
          {/* Patients List */}
          {activeTab === "patients-list" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Liste des Patients</h2>
                <div className="flex space-x-3">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700" onClick={openPatientFileModal}>
                    + Créer Dossier Patient
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700" onClick={openAddModal}>
                    + Ajouter un patient
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.isArray(patients) && patients.length > 0 ? (
                  patients.map((p, idx) => (
                    <div key={idx} className="patient-card bg-white rounded-lg shadow-md p-4 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{p.name || 'Nom inconnu'}</h3>
                          <p className="text-gray-500 text-sm">Né le {p.birth || 'Date inconnue'}</p>
                        </div>
                        <span className={`bg-${p.statusColor || 'gray'}-100 text-${p.statusColor || 'gray'}-800 text-xs px-2 py-1 rounded-md`}>
                          {p.status || 'Inconnu'}
                        </span>
                      </div>
                      {p.specialties && p.specialties.length > 0 && (
                        <div className="flex items-center space-x-2 mb-3">
                          {p.specialties.map((spec, i) => (
                            <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-gray-700 mb-4">Dernière consultation: {p.lastConsult || 'Aucune'}</p>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-end">
                        <button className="text-blue-600 hover:text-blue-800" onClick={() => openPatientModal(p)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button className="text-yellow-600 hover:text-yellow-800" onClick={() => openEditModal(p)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="text-green-600 hover:text-green-800" onClick={() => openShareModal(p)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-10 text-gray-500">
                    Aucun patient trouvé. Essayez de rafraîchir la page ou d'ajouter un nouveau patient.
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Shared Folders */}
          {activeTab === "shared-folder" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Dossiers Patients</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={openPatientFileModal}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Créer Nouveau Dossier
                  </button>
                  <button
                    onClick={() => {
                      console.log('Actualisation des dossiers');
                      loadDossiersPatients();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    disabled={dossiersLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {dossiersLoading ? 'Chargement...' : 'Actualiser'}
                  </button>
                </div>
              </div>
              
              {dossiersLoading ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-3 text-gray-600">Chargement des dossiers patients...</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  {dossiersPatients && dossiersPatients.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'ouverture</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dossiersPatients.map((dossier, idx) => (
                          <tr key={dossier.id || idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {dossier.patient && (dossier.patient.prenom || dossier.patient.nom) ?
                                      `${dossier.patient.prenom || ''} ${dossier.patient.nom || ''}`.trim() :
                                      dossier.patient_name || dossier.patient_nom || dossier.Patient?.nom ||
                                      (dossier.patient_id ? `Patient ID: ${dossier.patient_id}` : 'Patient inconnu')
                                    }
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Dossier #{dossier.numeroDossier || dossier.id_dossier || dossier.id || 'N/A'}
                                    {dossier.patient?.sexe && (
                                      <span className="ml-2 px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                        {dossier.patient.sexe === 'M' ? 'Homme' : dossier.patient.sexe === 'F' ? 'Femme' : dossier.patient.sexe}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {dossier.service_id ? getServiceNameById(dossier.service_id) : 'Service non défini'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {dossier.type_dossier || 'Type non défini'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {dossier.dateCreation ? new Date(dossier.dateCreation).toLocaleDateString('fr-FR') :
                               dossier.createdAt ? new Date(dossier.createdAt).toLocaleDateString('fr-FR') :
                               'Non définie'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                dossier.statut === 'actif'
                                  ? 'bg-green-100 text-green-800'
                                  : dossier.statut === 'ferme' || dossier.statut === 'fermé'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {dossier.statut || 'Inconnu'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => openDossierModal(dossier)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Voir
                              </button>
                              <button
                                onClick={() => handleEditDossier(dossier)}
                                className="text-yellow-600 hover:text-yellow-900 mr-3"
                              >
                                Modifier
                              </button>
                              {dossier.statut === 'actif' ? (
                                <button
                                  onClick={() => handleCloseDossier(dossier)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Fermer
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivateDossier(dossier)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Réactiver
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun dossier patient</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Aucun dossier patient n'a été créé pour le moment.
                      </p>
                      <div className="mt-6">
                        <button 
                          onClick={openPatientFileModal}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Créer un dossier patient
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Access Manager */}
          {activeTab === "access-manager" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Gestion des Accès</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">+ Nouvelle règle d'accès</button>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Règles d'accès actuelles</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultant</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accès accordé</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {accessRules.map((rule, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-full" src="https://placehold.co/40" alt=""/>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{rule.consultant.name}</div>
                                  <div className="text-sm text-gray-500">{rule.consultant.specialty}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{rule.patient.name}</div>
                              <div className="text-sm text-gray-500">Né le {rule.patient.birth}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{rule.access}</div>
                              <div className="text-sm text-gray-500">Expire le {rule.expires}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button className="text-yellow-600 hover:text-yellow-900 mr-3">Modifier</button>
                              <button className="text-red-600 hover:text-red-900">Révoquer</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Historique des accès</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultant</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {accessHistory.map((hist, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hist.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hist.consultant}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hist.patient}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hist.action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Notifications */}
          {activeTab === "notifications" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Notifications</h2>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  {notifications.map((notif, idx) => (
                    <div key={idx} className="flex items-start p-4 border-b border-gray-200 hover:bg-gray-50">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-8 h-8 rounded-full ${notif.iconBg} flex items-center justify-center`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${notif.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                          <span className="text-xs text-gray-500">{notif.time}</span>
                        </div>
                        <p className="text-sm text-gray-500">{notif.content}</p>
                        <div className="mt-2 flex space-x-2">
                          {notif.actions.map((a, i) => (
                            <button key={i} className={`text-xs px-2 py-1 rounded-md ${a.color}`}>{a.label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Patient Details Modal */}
      {showPatientModal && modalPatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-start md:justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-full md:max-w-4xl max-h-[95vh] overflow-y-auto mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Dossier de {modalPatient.name}</h2>
              <button onClick={closePatientModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-1">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <img src={modalPatient.image || "https://placehold.co/150"} alt="" className="rounded-full mx-auto mb-4"/>
                  <h3 className="text-xl font-bold">{modalPatient.name}</h3>
                  <p className="text-gray-600 mb-2">Né le {modalPatient.birth} {modalPatient.age && `(${modalPatient.age} ans)`}</p>
                  <p className="text-gray-600 mb-4">Groupe sanguin: {modalPatient.blood || "?"}</p>
                  <div className="flex justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">{modalPatient.gender}</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md">{modalPatient.status}</span>
                  </div>
                </div>
                <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
                  <h4 className="font-semibold mb-2">Coordonnées</h4>
                  <p className="text-gray-700 mb-1">{modalPatient.address}</p>
                  <p className="text-gray-700 mb-1">{modalPatient.phone}</p>
                  <p className="text-gray-700">{modalPatient.email}</p>
                </div>
                <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
                  <h4 className="font-semibold mb-2">Contacts d'urgence</h4>
                  {modalPatient.emergencyContacts?.map((c, i) => (
                    <div className="mb-2" key={i}>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-gray-700 mb-1">{c.type} - {c.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h4 className="font-semibold mb-2">Antécédents médicaux</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-1">Pathologies</h5>
                      <ul className="text-gray-700 space-y-1">
                        {modalPatient.pathologies?.map((p, i) => <li key={i} className="flex items-center"><span className="mr-1">•</span> {p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">Allergies</h5>
                      <ul className="text-gray-700 space-y-1">
                        {modalPatient.allergies?.map((a, i) => <li key={i} className="flex items-center"><span className="mr-1">•</span> {a}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Dernières consultations</h4>
                    <button className="text-blue-600 text-sm hover:text-blue-800">Voir tout</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-gray-500 text-sm border-b">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Motif</th>
                          <th className="pb-2">Médecin</th>
                          <th className="pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalPatient.consultations?.map((c, i) => (
                          <tr key={i} className="border-b text-sm">
                            <td className="py-3">{c.date}</td>
                            <td>{c.reason}</td>
                            <td>{c.doctor}</td>
                            <td><button className="text-blue-600 hover:text-blue-800">Voir</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Traitements actuels</h4>
                    <button className="text-blue-600 text-sm hover:text-blue-800">+ Ajouter</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modalPatient.treatments?.map((t, i) => (
                      <div key={i}>
                        <div className="flex justify-between">
                          <span className="font-medium">{t.name}</span>
                          <span className="text-gray-500 text-sm">{t.dose}</span>
                        </div>
                        <p className="text-gray-700 text-sm">{t.desc}</p>
                        <p className="text-gray-700 text-sm">Depuis {t.since}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50" onClick={closePatientModal}>Fermer</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Imprimer</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Mutualiser</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editPatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-full md:max-w-xl relative my-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Modifier {editPatient.name}</h2>
              <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatient.name.split(" ")[0]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatient.name.split(" ")[1]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <input type="date" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>Homme</option>
                  <option>Femme</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatient.address} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="tel" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatient.phone} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatient.email} />
              </div>
              <div className="md:col-span-2">
                <h3 className="font-semibold mb-2">Antécédents médicaux</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pathologies</label>
                    <textarea className="w-full px-3 py-2 border rounded-md" rows={2}>{editPatient.pathologies?.join("\n")}</textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                    <textarea className="w-full px-3 py-2 border rounded-md" rows={2}>{editPatient.allergies?.join("\n")}</textarea>
                  </div>
                </div>
              </div>
            </form>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={closeEditModal} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && sharePatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-full md:max-w-2xl relative my-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mutualiser {sharePatient.name}</h2>
              <button onClick={closeShareModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Patient : {sharePatient.name}</h3>
                <p className="text-gray-700 mb-4">Vous êtes sur le point de partager ce dossier médical avec un autre professionnel de santé.</p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service destinataire</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="">Sélectionnez un service</option>
                    <option value="cardiologie">Cardiologie</option>
                    <option value="pneumologie">Pneumologie</option>
                    <option value="neurologie">Neurologie</option>
                    <option value="rhumatologie">Rhumatologie</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Médecin destinataire</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="">Sélectionnez un médecin</option>
                    <option value="dr-laurent">Dr. Sophie Laurent</option>
                    <option value="dr-thierry">Dr. Marc Thierry</option>
                    <option value="dr-lemoine">Dr. Élise Lemoine</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type d'accès</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="read">Lecture seule</option>
                    <option value="read_write">Lecture et écriture</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée du partage</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="1_month">1 mois</option>
                    <option value="3_months">3 mois</option>
                    <option value="6_months">6 mois</option>
                    <option value="indefinite">Illimité</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lettre d'accompagnement</label>
                  <textarea className="w-full px-3 py-2 border rounded-md" rows={4} defaultValue={
`Cher confrère/consoeur,

Je vous transmets le dossier de M. ${sharePatient.name} pour prise en charge conjointe. Ce patient présente les antécédents médicaux suivants : hypertension artérielle, hypercholestérolémie et diabète type II.

N'hésitez pas à me contacter pour toute information complémentaire.

Cordialement,
Dr. Dupont`
                  } />
                  <div className="flex items-center mt-2">
                    <input type="checkbox" id="notifyEmail" className="rounded text-blue-500" defaultChecked />
                    <label htmlFor="notifyEmail" className="ml-2 text-sm text-gray-700">Envoyer une notification par email</label>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-end">
                <button type="button" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Confirmer le partage</button>
                <button type="button" onClick={closeShareModal} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 order-first sm:order-last">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-full md:max-w-xl relative my-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Ajouter un nouveau patient</h2>
              <button onClick={closeAddModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <input type="date" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>Homme</option>
                  <option>Femme</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="tel" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="md:col-span-2">
                <h3 className="font-semibold mb-2">Antécédents médicaux</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pathologies</label>
                    <textarea className="w-full px-3 py-2 border rounded-md" rows={2}></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                    <textarea className="w-full px-3 py-2 border rounded-md" rows={2}></textarea>
                  </div>
                </div>
              </div>
            </form>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={closeAddModal} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Patient File Modal */}
      {showPatientFileModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-full md:max-w-4xl mx-auto rounded-lg shadow-lg max-h-[95vh] overflow-y-auto my-2 md:my-4">
            <div className="flex justify-between items-center border-b px-4 py-3 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium">Créer un Dossier Patient</h3>
              <div className="flex items-center space-x-2">
                {(servicesLoading || loading) && (
                  <div className="flex items-center text-sm text-blue-600">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {servicesLoading ? 'Chargement...' : 'Création...'}
                  </div>
                )}
                <button onClick={closePatientFileModal} className="text-gray-500 hover:text-gray-700" disabled={loading}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleCreatePatientFile} className="p-4 sm:p-6">
              {/* Information Banner */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Création d'un nouveau dossier patient</p>
                    <p className="mt-1">Remplissez les informations ci-dessous pour créer un nouveau dossier médical. Les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires.</p>
                  </div>
                </div>
              </div>
              
              {/* Basic Information Section */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Informations de Base</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="patient_id" 
                      value={patientFileForm.patient_id} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      required
                      disabled={loading}
                    >
                      <option value="">Sélectionnez un patient</option>
                      {Array.isArray(patientsForSelect) && patientsForSelect.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} {patient.numero_dossier !== 'N/A' ? `(${patient.numero_dossier})` : ''}
                        </option>
                      ))}
                    </select>
                    {patientsForSelect.length === 0 && !loading && (
                      <div className="mt-1 text-sm text-red-600">
                        Aucun patient disponible
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="service_id" 
                      value={patientFileForm.service_id} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      required
                      disabled={servicesLoading || loading}
                    >
                      <option value="">
                        {servicesLoading ? "Chargement des services..." : "Sélectionnez un service"}
                      </option>
                      {Array.isArray(services) && services.length > 0 && services.map(service => {
                        const serviceId = service.id || service.id_service || service.service_id;
                        const serviceName = service.name || service.nom || service.libelle || service.service_name || 'Service sans nom';
                        return (
                          <option key={serviceId} value={serviceId}>
                            {serviceName}
                          </option>
                        );
                      })}
                    </select>
                    {servicesLoading && (
                      <div className="mt-1 text-sm text-blue-600">
                        Chargement des services...
                      </div>
                    )}
                    {!servicesLoading && services.length === 0 && (
                      <div className="mt-1 text-sm text-red-600">
                        Aucun service disponible
                      </div>
                    )}
                    {!servicesLoading && services.length > 0 && (
                      <div className="mt-1 text-sm text-green-600">
                        {services.length} service(s) chargé(s)
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="statut" 
                      value={patientFileForm.statut} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      required
                      disabled={loading}
                    >
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                      <option value="ferme">Fermé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'ouverture <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      name="dateOuverture" 
                      value={patientFileForm.dateOuverture} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      required 
                      disabled={loading}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fermeture (optionnel)</label>
                    <input 
                      type="date" 
                      name="dateFermeture" 
                      value={patientFileForm.dateFermeture} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      disabled={loading}
                      min={patientFileForm.dateOuverture || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Informations Médicales</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Résumé Médical</label>
                    <input type="text" name="resume_medical" value={patientFileForm.resume_medical} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Bref résumé de l'état médical du patient" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Antécédents Médicaux</label>
                      <textarea name="antecedents_medicaux" value={patientFileForm.antecedents_medicaux} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Historique médical du patient"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                      <textarea name="allergies" value={patientFileForm.allergies} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Allergies connues"></textarea>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Traitement</label>
                      <textarea name="traitement" value={patientFileForm.traitement} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Traitements actuels"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Signes Vitaux</label>
                      <textarea name="signes_vitaux" value={patientFileForm.signes_vitaux} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Tension, poids, température, etc."></textarea>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Histoire Familiale</label>
                      <textarea name="histoire_familiale" value={patientFileForm.histoire_familiale} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Antécédents familiaux"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
                      <textarea name="observations" value={patientFileForm.observations} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Observations cliniques"></textarea>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Directives Anticipées</label>
                    <textarea name="directives_anticipees" value={patientFileForm.directives_anticipees} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={2} placeholder="Directives pour les soins futurs"></textarea>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={closePatientFileModal} 
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Création en cours...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dossier Details Modal */}
      {showDossierModal && selectedDossier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-full md:max-w-4xl mx-auto rounded-lg shadow-lg max-h-[95vh] overflow-y-auto my-2 md:my-4">
            <div className="flex justify-between items-center border-b px-4 py-3 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium">
                Dossier #{selectedDossier.numeroDossier || selectedDossier.id_dossier || selectedDossier.id || (dossierDetails?.numeroDossier) || 'N/A'} - {
                  // Priority: Use enriched patient info from dossierDetails if available
                  dossierDetails?.patient ?
                    `${dossierDetails.patient.prenom || ''} ${dossierDetails.patient.nom || ''}`.trim() || 'Patient inconnu' :
                    // Fallback: Use selectedDossier patient info
                    selectedDossier.patient ?
                      `${selectedDossier.patient.prenom || ''} ${selectedDossier.patient.nom || ''}`.trim() || 'Patient inconnu' :
                      // Last resort: Use any available patient name fields
                      selectedDossier.patient_name || selectedDossier.patient_nom || dossierDetails?.patient_name || 'Patient inconnu'
                }
              </h3>
              <div className="flex items-center space-x-2">
                {dossierDetailsLoading && (
                  <div className="flex items-center text-sm text-blue-600">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Chargement...
                  </div>
                )}
                <button onClick={closeDossierModal} className="text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              {dossierDetailsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-3 text-gray-600">Chargement des détails...</span>
                </div>
              ) : dossierDetails ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Informations de Base</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Patient Information */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Patient</label>
                        <p className="text-sm text-gray-900 font-medium">
                          {dossierDetails.patient ?
                            `${dossierDetails.patient.prenom || ''} ${dossierDetails.patient.nom || ''}`.trim() || 'Nom inconnu' :
                            `Patient ID: ${dossierDetails.patient_id || 'N/A'}`
                          }
                        </p>
                        {dossierDetails.patient?.numero_dossier && (
                          <p className="text-xs text-gray-500">{dossierDetails.patient.numero_dossier}</p>
                        )}
                      </div>
                      
                      {/* Patient Gender */}
                      {dossierDetails.patient?.sexe && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Sexe</label>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {dossierDetails.patient.sexe === 'M' ? 'Homme' :
                             dossierDetails.patient.sexe === 'F' ? 'Femme' :
                             dossierDetails.patient.sexe}
                          </span>
                        </div>
                      )}
                      
                      {/* Blood Group - Placeholder for future implementation */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Groupe sanguin</label>
                        <p className="text-sm text-gray-500 italic">
                          {dossierDetails.patient?.groupe_sanguin || 'Non renseigné'}
                        </p>
                      </div>
                      
                      {/* Service */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Service</label>
                        <p className="text-sm text-gray-900">{getServiceNameById(dossierDetails.service_id)}</p>
                      </div>
                      
                      {/* Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Statut</label>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          dossierDetails.statut === 'actif'
                            ? 'bg-green-100 text-green-800'
                            : dossierDetails.statut === 'ferme'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {dossierDetails.statut || 'Inconnu'}
                        </span>
                      </div>
                      
                      {/* Opening Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date d'ouverture</label>
                        <p className="text-sm text-gray-900">
                          {dossierDetails.dateCreation ? new Date(dossierDetails.dateCreation).toLocaleDateString('fr-FR') :
                           dossierDetails.dateOuverture ? new Date(dossierDetails.dateOuverture).toLocaleDateString('fr-FR') :
                           'Non définie'}
                        </p>
                      </div>
                      
                      {/* Closing Date */}
                      {dossierDetails.dateFermeture && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date de fermeture</label>
                          <p className="text-sm text-gray-900">
                            {new Date(dossierDetails.dateFermeture).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      )}
                      
                      {/* Patient Contact Info */}
                      {dossierDetails.patient?.telephone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                          <p className="text-sm text-gray-900">{dossierDetails.patient.telephone}</p>
                        </div>
                      )}
                      
                      {dossierDetails.patient?.email && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="text-sm text-gray-900">{dossierDetails.patient.email}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Informations Médicales</h4>
                    <div className="space-y-4">
                      {dossierDetails.resume_medical && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Résumé Médical</label>
                          <p className="text-sm text-gray-900 mt-1">{dossierDetails.resume_medical}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dossierDetails.antecedents_medicaux && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Antécédents Médicaux</label>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetails.antecedents_medicaux}</p>
                          </div>
                        )}
                        
                        {dossierDetails.allergies && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Allergies</label>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetails.allergies}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dossierDetails.traitement && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Traitement</label>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetails.traitement}</p>
                          </div>
                        )}
                        
                        {dossierDetails.signes_vitaux && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Signes Vitaux</label>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetails.signes_vitaux}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dossierDetails.histoire_familiale && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Histoire Familiale</label>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetails.histoire_familiale}</p>
                          </div>
                        )}
                        
                        {dossierDetails.observations && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Observations</label>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetails.observations}</p>
                          </div>
                        )}
                      </div>

                      {dossierDetails.directives_anticipees && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Directives Anticipées</label>
                          <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetails.directives_anticipees}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Raw Data for Debugging */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Données Brutes (Debug)</h4>
                    <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(dossierDetails, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun détail disponible</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Impossible de charger les détails de ce dossier patient.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Dossier Modal */}
      {showEditDossierModal && selectedDossier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-full md:max-w-6xl mx-auto rounded-lg shadow-lg max-h-[95vh] overflow-y-auto my-2 md:my-4">
            <div className="flex justify-between items-center border-b px-4 py-3 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium">
                Modifier le Dossier {selectedDossier.numeroDossier || selectedDossier.id_dossier || selectedDossier.id || 'N/A'}
              </h3>
              <div className="flex items-center space-x-2">
                {loading && (
                  <div className="flex items-center text-sm text-blue-600">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mise à jour...
                  </div>
                )}
                <button onClick={closeEditDossierModal} className="text-gray-500 hover:text-gray-700" disabled={loading}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpdateDossier} className="p-4 sm:p-6">
              {/* Information Banner */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Modification du dossier médical</p>
                    <p className="mt-1">Vous modifiez le dossier de {selectedDossier.patient ? `${selectedDossier.patient.prenom} ${selectedDossier.patient.nom}` : 'Patient inconnu'}. Vérifiez attentivement les informations avant de sauvegarder.</p>
                  </div>
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Informations Générales</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      name="statut"
                      value={editDossierForm.statut}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    >
                      <option value="actif">Actif</option>
                      <option value="ferme">Fermé</option>
                      <option value="archive">Archivé</option>
                      <option value="suspendu">Suspendu</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de dossier</label>
                    <select
                      name="type_dossier"
                      value={editDossierForm.type_dossier}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    >
                      <option value="principal">Principal</option>
                      <option value="specialiste">Spécialiste</option>
                      <option value="urgence">Urgence</option>
                      <option value="suivi">Suivi</option>
                      <option value="consultation">Consultation</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                    <select
                      name="service_id"
                      value={editDossierForm.service_id}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    >
                      <option value="">Sélectionnez un service</option>
                      {Array.isArray(services) && services.map(service => {
                        const serviceId = service.id || service.id_service || service.service_id;
                        const serviceName = service.name || service.nom || service.libelle || service.service_name || 'Service sans nom';
                        return (
                          <option key={serviceId} value={serviceId}>
                            {serviceName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Medical Summary Section */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Résumé Médical</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Résumé clinique</label>
                  <textarea
                    name="resume"
                    value={editDossierForm.resume}
                    onChange={handleEditDossierInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Résumé clinique du patient et de sa situation médicale"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Medical History Section */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Antécédents et Allergies</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Antécédents médicaux</label>
                    <textarea
                      name="antecedent_medicaux"
                      value={editDossierForm.antecedent_medicaux}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Antécédents médicaux structurés (pathologies, chirurgies, etc.)"
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                    <textarea
                      name="allergies"
                      value={editDossierForm.allergies}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Allergies et intolérances médicamenteuses ou autres"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Treatments Section */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Traitements</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Traitements chroniques</label>
                  <textarea
                    name="traitements_chroniques"
                    value={editDossierForm.traitements_chroniques}
                    onChange={handleEditDossierInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Traitements au long cours avec posologie et indications"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Vital Signs Section */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Signes Vitaux</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence cardiaque</label>
                    <input
                      type="text"
                      name="heart_rate"
                      value={editDossierForm.heart_rate}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 72 bpm"
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tension artérielle</label>
                    <input
                      type="text"
                      name="blood_pressure"
                      value={editDossierForm.blood_pressure}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 120/80 mmHg"
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Température</label>
                    <input
                      type="text"
                      name="temperature"
                      value={editDossierForm.temperature}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 37.2°C"
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence respiratoire</label>
                    <input
                      type="text"
                      name="respiratory_rate"
                      value={editDossierForm.respiratory_rate}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 16/min"
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saturation en oxygène</label>
                    <input
                      type="text"
                      name="oxygen_saturation"
                      value={editDossierForm.oxygen_saturation}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 98%"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Lifestyle and Family History Section */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Mode de Vie et Antécédents Familiaux</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Habitudes de vie</label>
                    <textarea
                      name="habitudes_vie"
                      value={editDossierForm.habitudes_vie}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Informations sur le mode de vie (tabac, alcool, activité physique, etc.)"
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Historique familial</label>
                    <textarea
                      name="historique_familial"
                      value={editDossierForm.historique_familial}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Antécédents familiaux notables"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Directives and Observations Section */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Directives et Observations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Directives anticipées</label>
                    <textarea
                      name="directives_anticipées"
                      value={editDossierForm.directives_anticipées}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Directives anticipées et personnes de confiance"
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
                    <textarea
                      name="observations"
                      value={editDossierForm.observations}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Notes et observations diverses"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Closure Information Section */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Informations de Fermeture</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fermeture</label>
                    <input
                      type="date"
                      name="date_fermeture"
                      value={editDossierForm.date_fermeture}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motif de fermeture</label>
                    <input
                      type="text"
                      name="motif_fermeture"
                      value={editDossierForm.motif_fermeture}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Raison de la fermeture du dossier"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeEditDossierModal}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Style pour notification badge */}
      <style>{`
        .notification-badge {
          display: none;
        }
        .sidebar .notification-badge {
          display: inline-flex !important;
        }
      `}</style>
    </div>
  );
}

export default DossierPatient;

