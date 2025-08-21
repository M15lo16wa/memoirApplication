import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from 'qrcode.react';

import { createDossierMedical, getAllDossiersMedical, getDossierMedical, closeDossierPatient, updateDossierPatient, createOrdonnance, createExamen, getAllPrescriptions, getOrdonnancesRecentes, createOrdonnanceComplete, ajouterPrescriptionAuDossier, marquerNotificationLue, getNotificationsPatient, getResumeAujourdhui } from "../services/api/medicalApi";
import { getPatients, getServices } from "../services/api/patientApi";
import { isAuthenticated, isMedecinAuthenticated, isPatientAuthenticated } from "../services/api/authApi";

import { useDMP } from "../context/DMPContext";

function DossierPatient() {
  const navigate = useNavigate();
  const { state: dmpState } = useDMP();

  // États consolidés
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    loading: true
  });

  const [uiState, setUIState] = useState({
    activeTab: "patients-list",
    loading: false,
    search: "",
    filterRecent: false,
    filterShared: false
  });

  const [modalState, setModalState] = useState({
    showPatientModal: false,
    showEditModal: false,
    showShareModal: false,
    showAddModal: false,
    showPatientFile: false,
    showDossierModal: false,
    showEditDossierModal: false,
    showPrescriptionModal: false,
    showExamenModal: false,
    showQRModal: false,
    showNotificationModal: false,
    showOrdonnanceCompleteModal: false
  });

  const [dataState, setDataState] = useState({
    patients: [],
    services: [],
    patientsForSelect: [],
    dossiersPatients: [],
    selectedDossier: null,
    dossierDetails: null,
    prescriptions: [],
    selectedPatientForPrescription: null,
    ordonnancesRecentes: [],
    resumeAujourdhui: null,
    prescriptionNotifications: []
  });

  const [loadingState, setLoadingState] = useState({
    services: false,
    dossiers: false,
    dossierDetails: false,
    dataState_prescriptions: false,
    ordonnances: false,
    resume: false,
    notifications: false
  });

  // Formulaires avec useRef pour éviter les re-renders
  const editDossierFormRef = useRef({
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
  
  const patientFileFormRef = useRef({
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

  const prescriptionFormRef = useRef({
    patient_id: '',
    principe_actif: '',
    nom_commercial: '',
    dosage: '',
    frequence: '',
    voie_administration: 'orale',
    duree_traitement: '',
    renouvelable: false,
    nb_renouvellements: 0,
    observations: '',
    medecin_nom: '',
    medecin_prenom: '',
    medecin_specialite: '',
    medecin_numero_ordre: ''
  });

  const examenFormRef = useRef({
    patient_id: '',
    type_examen: '',
    parametres: '',
    urgence: 'normal',
    observations: '',
    medecin_nom: '',
    medecin_prenom: '',
    medecin_specialite: '',
    medecin_numero_ordre: ''
  });

  // États pour les modals et notifications
  const qrCodeDataRef = useRef(null);
  const createdPrescriptionRef = useRef(null);
  const selectedNotificationRef = useRef(null);
  const ordonnanceCompleteFormRef = useRef({
    patient_id: '',
    dossier_id: '',
    principe_actif: '',
    nom_commercial: '',
    dosage: '',
    frequence: '',
    voie_administration: 'orale',
    duree_traitement: '',
    renouvelable: false,
    nb_renouvellements: 0,
    observations: '',
    priorite: 'normale',
    canal: 'application'
  });

  // Références pour les éléments sélectionnés
  const selectedDossierRef = useRef(null);
  const selectedPatientForPrescriptionRef = useRef(null);
  const modalPatientRef = useRef(null);
  const editPatientRef = useRef(null);
  const sharePatientRef = useRef(null);
  const dossierDetailsRef = useRef(null);

  // Fonctions utilitaires pour la mise à jour des états
  const updateAuthState = useCallback((updates) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateUIState = useCallback((updates) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateModalState = useCallback((updates) => {
    setModalState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateDataState = useCallback((updates) => {
    setDataState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateLoadingState = useCallback((updates) => {
    setLoadingState(prev => ({ ...prev, ...updates }));
  }, []);

  // Données dérivées avec useMemo
  const derivedData = useMemo(() => ({
    hasPatients: dataState.patients.length > 0,
    hasServices: dataState.services.length > 0,
    hasDossiers: dataState.dossiersPatients.length > 0,
    hasPrescriptions: dataState.prescriptions.length > 0,
    isLoading: uiState.loading || loadingState.services || loadingState.dossiers || loadingState.dossierDetails,
    canCreateDossier: dataState.patients.length > 0 && dataState.services.length > 0
  }), [dataState, uiState, loadingState]);

  // Maintenant toutes les fonctions sont définies après les useState
  const openDossierModal = async (dossier) => {
    selectedDossierRef.current = dossier;
    updateModalState({ showDossierModal: true });
    updateLoadingState({ dossierDetails: true });
    
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
      
      dossierDetailsRef.current = dossierData;
    } catch (error) {
      console.error('Erreur lors du chargement des détails du dossier:', error);
      dossierDetailsRef.current = null;
    } finally {
      updateLoadingState({ dossierDetails: false });
    }
  };

  const closeDossierModal = () => {
    updateModalState({ showDossierModal: false });
    selectedDossierRef.current = null;
    dossierDetailsRef.current = null;
  };

  const handleEditDossier = (dossier) => {
    console.log('Opening edit modal for dossier:', dossier);
    selectedDossierRef.current = dossier;
    
    // Pre-fill the form with existing data
    editDossierFormRef.current = {
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
      date_fermeture: dossier.date_fermeture || '',
      motif_fermeture: dossier.motif_fermeture || ''
    };
    updateModalState({ showEditDossierModal: true });
  };

  const handleEditDossierInputChange = useCallback((e) => {
    const { name, value } = e.target;
    editDossierFormRef.current = { ...editDossierFormRef.current, [name]: value };
  }, []);

  const handleUpdateDossier = useCallback(async (e) => {
    e.preventDefault();
    updateUIState({ loading: true });
    
    try {
      const dossierId = selectedDossierRef.current.id_dossier || selectedDossierRef.current.id;
      console.log('Updating dossier:', dossierId, editDossierFormRef.current);
      
      // Convert date to ISO format if provided
      const formData = {
        ...editDossierFormRef.current,
        date_fermeture: editDossierFormRef.current.date_fermeture ? new Date(editDossierFormRef.current.date_fermeture).toISOString() : null
      };
      
      await updateDossierPatient(dossierId, formData);
      alert('Dossier mis à jour avec succès!');
      updateModalState({ showEditDossierModal: false });
      
      // Reload dossiers list
      await loadDossiersPatients();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du dossier:', error);
      alert('Erreur lors de la mise à jour du dossier: ' + error);
    } finally {
      updateUIState({ loading: false });
    }
  }, []);

  const closeEditDossierModal = useCallback(() => {
    updateModalState({ showEditDossierModal: false });
    selectedDossierRef.current = null;
    editDossierFormRef.current = {
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
    };
  }, []);

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
    updateModalState({ showPatientFile: true });
    
    // Load dataState.services and dataState.patients in parallel
    try {
      await Promise.all([
        loadServices(),
        loadPatientsForSelect()
      ]);
      console.log('Services and dataState.patients loaded successfully');
    } catch (error) {
      console.error('Error uiState.loading data for modal:', error);
    }
  };

  const closePatientFileModal = () => {
    updateModalState({ showPatientFile: false });
    patientFileFormRef.current = {
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
    };
  };

  const loadServices = useCallback(async () => {
    updateLoadingState({ services: true });
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
        updateDataState({ services: servicesData });
        console.log(`${servicesData.length} services chargés avec succès`);
      } else if (servicesData && typeof servicesData === 'object') {
        console.log('Services data is an object, checking for nested services...');
        const possibleServices = servicesData.services || servicesData.data || servicesData.result || [];
        if (Array.isArray(possibleServices)) {
          console.log('Found services in nested object:', possibleServices);
          updateDataState({ services: possibleServices });
          console.log(`${possibleServices.length} services chargés depuis l'objet imbriqué`);
        } else {
          console.error('No valid services array found in object:', servicesData);
          updateDataState({ services: [] });
        }
      } else {
        console.error('Unexpected services data format:', servicesData);
        if (servicesData && typeof servicesData === 'object') {
          console.error('Services data keys:', Object.keys(servicesData));
        }
        updateDataState({ services: [] });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      });
      updateDataState({ services: [] });
    } finally {
      updateLoadingState({ services: false });
      console.log('Chargement des services terminé');
    }
  }, []);

  // Function to get service name by ID
  const getServiceNameById = (serviceId) => {
    if (!Array.isArray(dataState.services) || dataState.services.length === 0) {
      return `Service ID: ${serviceId}`;
    }
    
    const service = dataState.services.find(s => {
      const id = s.id || s.id_service || s.service_id;
      return id === serviceId;
    });
    
    if (service) {
      return service.name || service.nom || service.libelle || service.service_name || `Service ID: ${serviceId}`;
    }
    
    return `Service ID: ${serviceId}`;
  };

  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    console.log('Submitting patient file form:', patientFileFormRef.current);
    
    // Validation côté client
    if (!patientFileFormRef.current.patient_id) {
      alert('Veuillez sélectionner un patient');
      return;
    }
    
    if (!patientFileFormRef.current.service_id) {
      alert('Veuillez sélectionner un service');
      return;
    }
    
    if (!patientFileFormRef.current.dateOuverture) {
      alert('Veuillez saisir une date d\'ouverture');
      return;
    }
    
    // Validation de la date de fermeture si elle est fournie
    if (patientFileFormRef.current.dateFermeture && patientFileFormRef.current.dateFermeture < patientFileFormRef.current.dateOuverture) {
      alert('La date de fermeture ne peut pas être antérieure à la date d\'ouverture');
      return;
    }
    
    updateUIState({ loading: true });
    try {
      // Convert dates to ISO format
      const formData = {
        ...patientFileFormRef.current,
        dateOuverture: patientFileFormRef.current.dateOuverture ? new Date(patientFileFormRef.current.dateOuverture).toISOString() : null,
        dateFermeture: patientFileFormRef.current.dateFermeture ? new Date(patientFileFormRef.current.dateFermeture).toISOString() : null
      };
      
      console.log('Formatted form data:', formData);
      const response = await createDossierMedical(formData);
      console.log('Dossier créé avec succès:', response);
      alert('Dossier patient créé avec succès!');
      updateModalState({ showPatientFile: false });
      
      // Reload dossiers dataState.patients if we're on the shared-folder tab
      if (uiState.activeTab === "shared-folder") {
        await loadDossiersPatients();
      }
      
      // Reset form
      patientFileFormRef.current = Object.assign(patientFileFormRef.current, {
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
      updateUIState({ loading: false });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    patientFileFormRef.current = { ...patientFileFormRef.current, [name]: value };
  };

  const loadPatientsForSelect = async () => {
    try {
      console.log('Début du chargement des dataState.patients pour sélection...');
      const patientsData = await getPatients();
      console.log('Patients loaded for select:', patientsData);
      
      if (!Array.isArray(patientsData)) {
        console.error('Expected an array of dataState.patients but received:', dataState.patientsData);
        updateDataState({ patientsForSelect: [] });
        return;
      }
      
      // Format patients for the select dropdown
      const formattedPatientsForSelect = patientsData.map(patient => ({
        id: patient.id_patient,
        name: `${patient.prenom || ''} ${patient.nom || ''}`.trim() || 'Nom inconnu',
        numero_dossier: patient.numero_dossier || 'N/A'
      }));
      
      console.log('Formatted dataState.patients for select:', formattedPatientsForSelect);
      updateDataState({ patientsForSelect: formattedPatientsForSelect });
      console.log(`${formattedPatientsForSelect.length} dataState.patients formatés pour la sélection`);
    } catch (error) {
      console.error('Erreur lors du chargement des dataState.patients pour sélection:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      });
      updateDataState({ patientsForSelect: [] });
    }
  };

  const loadDossiersPatients = async () => {
    updateLoadingState({ dossiers: true });
    try {
      console.log('Chargement des dossiers dataState.patients...');
      const dossiersData = await getAllDossiersMedical();
      console.log('Dossiers dataState.patients reçus:', dossiersData);
      
      let dossiers = [];
      if (dossiersData && dossiersData.status === 'success' && dossiersData.data && Array.isArray(dossiersData.data)) {
        dossiers = dossiersData.data;
        console.log('Setting dossiers from dossiersData.data:', dossiers);
        console.log('First dossier structure:', dossiers[0]);
        console.log(`${dossiers.length} dossiers dataState.patients chargés avec succès`);
      } else if (Array.isArray(dossiersData)) {
        dossiers = dossiersData;
        console.log('Setting dossiers from direct array:', dossiers);
        console.log('First dossier structure:', dossiers[0]);
        console.log(`${dossiers.length} dossiers dataState.patients chargés`);
      } else {
        console.error('Format de données inattendu:', dossiersData);
        console.error('Type of dossiersData:', typeof dossiersData);
        console.error('Keys in dossiersData:', dossiersData ? Object.keys(dossiersData) : 'null');
        updateDataState({ dossiersPatients: [] });
        return;
      }

      // Log detailed information about each dossier to diagnose patient data issues
      dossiers.forEach((dossier, index) => {
        console.log(`=== DIAGNOSTIC DOSSIER ${index + 1} ===`);
        console.log('Raw dossier object:', dossier);
        console.log('ID:', dossier.id_dossier || dossier.id);
        console.log('Numéro dossier (numeroDossier):', dossier.numeroDossier);
        console.log('Numéro dossier (numero_dossier):', dossier.numero_dossier);
        console.log('Numéro dossier (numeroDossier - exact):', dossier.numeroDossier);
        console.log('Numéro dossier (id_dossier):', dossier.id_dossier);
        console.log('Numéro dossier (id):', dossier.id);
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

      updateDataState({ dossiersPatients: dossiers });
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers dataState.patients:', error);
      updateDataState({ dossiersPatients: [] });
    } finally {
      updateLoadingState({ dossiers: false });
    }
  };

  // Fonction pour charger les patients
  const loadPatients = useCallback(async () => {
    updateUIState({ loading: true });
    try {
      console.log('🔄 DEBUG - Début de loadPatients...');
      console.log('🌐 DEBUG - Appel API getPatients()...');
      
      const patientsData = await getPatients();
      
      console.log('📡 DEBUG - Réponse API getPatients:', {
        data: patientsData,
        type: typeof patientsData,
        isArray: Array.isArray(patientsData),
        length: Array.isArray(patientsData) ? patientsData.length : 'N/A'
      });

      if (!patientsData) {
        console.error('No patient data received:', patientsData);
        updateDataState({ patients: [] });
        return [];
      }

      if (!Array.isArray(patientsData)) {
        console.error('Expected an array of patients but received:', patientsData);
        updateDataState({ patients: [] });
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
      console.log('Updating dataState with patients:', formattedPatients);
      updateDataState({ patients: formattedPatients });
      
      // Initialiser automatiquement le premier patient comme sélection par défaut
      // seulement si aucun patient n'est déjà sélectionné
      if (formattedPatients.length > 0 && !selectedPatientForPrescriptionRef.current) {
        console.log('Initialisation automatique du premier patient:', formattedPatients[0]);
        selectedPatientForPrescriptionRef.current = formattedPatients[0];
      }
      
      return formattedPatients;
    } catch (error) {
      console.error('Erreur lors du chargement des dataState.patients:', error);
      console.error('Détails de l\'erreur:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Gérer spécifiquement les erreurs d'authentification
      if (error.response?.status === 401) {
        console.error('Erreur d\'authentification: Utilisateur non connecté ou token expiré');
        updateAuthState({ isAuthenticated: false });
        // Rediriger vers la page de connexion
        navigate("/connexion", { 
          state: { 
            from: "/dossier-patient",
            message: "Votre session a expiré. Veuillez vous reconnecter."
          } 
        });
      }
      
      updateDataState({ patients: [] });
      return [];
    } finally {
      updateUIState({ loading: false });
    }
  }, [navigate]); // Suppression des dépendances loadPatients et loadServices

  // Vérification de l'authentification
  useEffect(() => {
    const checkAuthentication = async () => {
      console.log('🔍 Vérification de l\'authentification...');
      const isAuth = isAuthenticated();
      const isMedecin = isMedecinAuthenticated();
      const isPatient = isPatientAuthenticated();
      
      console.log('  - isAuthenticated:', isAuth);
      console.log('  - isMedecinAuthenticated:', isMedecin);
      console.log('  - isPatientAuthenticated:', isPatient);
      console.log('  - Token JWT:', !!localStorage.getItem('jwt'));
      console.log('  - Token général:', !!localStorage.getItem('token'));
      
      if (isAuth) {
        console.log('✅ Utilisateur authentifié, chargement des données...');
        // Mettre à jour l'état d'authentification
        updateAuthState({ isAuthenticated: true, loading: false });
        
        // Charger les données directement
        console.log('🔄 Appel de loadPatients...');
        await loadPatients();
        console.log('🔄 Appel de loadServices...');
        await loadServices();
      } else {
        console.log('❌ Utilisateur non authentifié, redirection...');
        updateAuthState({ isAuthenticated: false, loading: false });
        // Rediriger vers la page de connexion
        navigate("/connexion", { 
          state: { 
            from: "/dossier-patient",
            message: "Veuillez vous connecter pour accéder à la liste des patients"
          } 
        });
      }
    };

    checkAuthentication();
  }, [navigate]);

  // Reload dataState.services when modal opens
  useEffect(() => {
    if (modalState.showPatientFile) {
      console.log('Modal opened, ensuring dataState.services are loaded...');
      loadServices();
    }
  }, [modalState.showPatientFile, loadServices]);

  // Fonctions pour l'onglet prescription
  const loadPrescriptions = useCallback(async () => {
    updateLoadingState({ prescriptions: true });
    try {
      // Récupérer toutes les dataState.prescriptions depuis l'API
      const prescriptionsData = await getAllPrescriptions();
      console.log('Prescriptions récupérées depuis l\'API:', prescriptionsData);
      
      // Filtrer par patient si un patient est sélectionné
      let prescriptionsToShow = prescriptionsData;
      if (selectedPatientForPrescriptionRef.current) {
        const patientId = selectedPatientForPrescriptionRef.current?.id || selectedPatientForPrescriptionRef.current?.rawData?.id_patient || selectedPatientForPrescriptionRef.current?.id_patient;
        if (patientId) {
          prescriptionsToShow = prescriptionsData.filter(prescription => 
            prescription.patient_id === patientId || 
            prescription.patient?.id_patient === patientId ||
            prescription.patient_id === parseInt(patientId)
          );
        }
      }
      
      updateDataState({ prescriptions: prescriptionsToShow || [] });
    } catch (error) {
      console.error('Erreur lors du chargement des dataState.prescriptions:', error);
      updateDataState({ prescriptions: [] });
    } finally {
      updateLoadingState({ prescriptions: false });
    }
  }, [selectedPatientForPrescriptionRef.current]);




  // Gestion des modals
  const openPatientModal = async (patient) => {
    modalPatientRef.current = patient;
    updateModalState({ showPatientModal: true });
  };

  const closePatientModal = () => {
    updateModalState({ showPatientModal: false });
    modalPatientRef.current = null;
  };

  const openEditModal = (patient) => {
    editPatientRef.current = patient;
    updateModalState({ showEditModal: true });
  };

  const closeEditModal = () => {
    updateModalState({ showEditModal: false });
    editPatientRef.current = null;
  };

  const openShareModal = (patient) => {
    sharePatientRef.current = patient;
    updateModalState({ showShareModal: true });
  };

  const closeShareModal = () => {
    updateModalState({ showShareModal: false });
    sharePatientRef.current = null;
  };

  const openAddModal = () => {
    updateModalState({ showAddModal: true });
  };

  const closeAddModal = () => {
    updateModalState({ showAddModal: false });
  };

  const openPrescriptionModal = (patient = null) => {
    if (patient) {
      selectedPatientForPrescriptionRef.current = patient;
      // Utiliser l'ID du patient formaté ou de la raw data
      const patientId = patient.id || patient.rawData?.id_patient || patient.id_patient;
      prescriptionFormRef.current = { ...prescriptionFormRef.current, patient_id: patientId };
    } else {
      // Si aucun patient n'est fourni, on peut utiliser le patient sélectionné dans le dossier
      const currentPatient = selectedPatientForPrescriptionRef.current;
      if (currentPatient) {
        const patientId = currentPatient.id || currentPatient.rawData?.id_patient || currentPatient.id_patient;
        prescriptionFormRef.current = { ...prescriptionFormRef.current, patient_id: patientId };
      }
    }
    updateModalState({ showPrescriptionModal: true });
  };

  const closePrescriptionModal = () => {
    updateModalState({ showPrescriptionModal: false });
    // Ne pas réinitialiser selectedPatientForPrescriptionRef.current pour garder le patient sélectionné
    const patientId = selectedPatientForPrescriptionRef.current?.id || selectedPatientForPrescriptionRef.current?.rawData?.id_patient || selectedPatientForPrescriptionRef.current?.id_patient || '';
    prescriptionFormRef.current = {
      patient_id: patientId,
      principe_actif: '',
      nom_commercial: '',
      dosage: '',
      frequence: '',
      voie_administration: 'orale',
      duree_traitement: '',
      renouvelable: false,
      nb_renouvellements: 0,
      observations: '',
      // Informations du médecin traitant
      medecin_nom: '',
      medecin_prenom: '',
      medecin_specialite: '',
      medecin_numero_ordre: ''
    };
  };

  const selectPatientForPrescription = (patient) => {
    selectedPatientForPrescriptionRef.current = patient;
    console.log('Patient sélectionné pour prescriptions:', patient);
  };

  const openExamenModal = (patient = null) => {
    if (patient) {
      selectedPatientForPrescriptionRef.current = patient;
      // Utiliser l'ID du patient formaté ou de la raw data
      const patientId = patient.id || patient.rawData?.id_patient || patient.id_patient;
      examenFormRef.current = { ...examenFormRef.current, patient_id: patientId };
    } else {
      // Si aucun patient n'est fourni, on peut utiliser le patient sélectionné dans le dossier
      const currentPatient = selectedPatientForPrescriptionRef.current;
      if (currentPatient) {
        const patientId = currentPatient.id || currentPatient.rawData?.id_patient || currentPatient.id_patient;
        examenFormRef.current = { ...examenFormRef.current, patient_id: patientId };
      }
    }
    updateModalState({ showExamenModal: true });
  };

  const closeExamenModal = () => {
    updateModalState({ showExamenModal: false });
    // Ne pas réinitialiser selectedPatientForPrescriptionRef.current pour garder le patient sélectionné
    const patientId = selectedPatientForPrescriptionRef.current?.id || selectedPatientForPrescriptionRef.current?.rawData?.id_patient || selectedPatientForPrescriptionRef.current?.id_patient || '';
    examenFormRef.current = {
      patient_id: patientId,
      type_examen: '',
      parametres: '',
      urgence: 'normal',
      observations: '',
      // Informations du médecin traitant
      medecin_nom: '',
      medecin_prenom: '',
      medecin_specialite: '',
      medecin_numero_ordre: ''
    };
  };

  const handlePrescriptionInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    prescriptionFormRef.current = (prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleExamenInputChange = (e) => {
    const { name, value } = e.target;
    examenFormRef.current = (prev) => ({
      ...prev,
      [name]: value
    });
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    
    if (!prescriptionFormRef.current.patient_id) {
      alert('Veuillez sélectionner un patient');
      return;
    }
    
    if (!prescriptionFormRef.current.principe_actif) {
      alert('Veuillez saisir le principe actif');
      return;
    }
    
    if (!prescriptionFormRef.current.dosage) {
      alert('Veuillez saisir le dosage');
      return;
    }
    
    if (!prescriptionFormRef.current.frequence) {
      alert('Veuillez saisir la fréquence');
      return;
    }

    // Validation des informations du médecin traitant
    if (!prescriptionFormRef.current.medecin_nom) {
      alert('Veuillez saisir le nom du médecin traitant');
      return;
    }
    
    if (!prescriptionFormRef.current.medecin_prenom) {
      alert('Veuillez saisir le prénom du médecin traitant');
      return;
    }
    
    if (!prescriptionFormRef.current.medecin_specialite) {
      alert('Veuillez saisir la spécialité du médecin traitant');
      return;
    }
    
    if (!prescriptionFormRef.current.medecin_numero_ordre) {
      alert('Veuillez saisir le numéro d\'ordre du médecin traitant');
      return;
    }

    // Validation et formatage de la durée du traitement
    let duree_traitement = prescriptionFormRef.current.duree_traitement;
    if (duree_traitement && duree_traitement.trim() !== '') {
      // Normaliser la durée (enlever les espaces multiples)
      duree_traitement = duree_traitement.trim().replace(/\s+/g, ' ');
      
      // Vérifier si le format est correct (ex: "7 jours", "2 semaines", "1 mois")
      const dureeRegex = /^\d+\s+(jour|jours|semaine|semaines|mois|moi)$/i;
      if (!dureeRegex.test(duree_traitement)) {
        console.warn('Format de durée potentiellement invalide:', duree_traitement);
        // Au lieu de bloquer, on laisse passer et on verra l'erreur de l'API
        // alert('Format de durée invalide. Utilisez le format: "7 jours", "2 semaines", "1 mois"');
        // return;
      }
    } else {
      duree_traitement = null; // Si vide, mettre null
    }

    updateUIState({ loading: true });
    try {
      // Préparer les données avec validation
      const ordonnanceData = {
        ...prescriptionFormRef.current,
        // S'assurer que les champs numériques sont bien des nombres
        patient_id: parseInt(prescriptionFormRef.current.patient_id),
        nb_renouvellements: parseInt(prescriptionFormRef.current.nb_renouvellements) || 0,
        // Formater la durée si elle existe
        duree_traitement: duree_traitement
      };

      // Si la durée est vide ou null, la retirer complètement de l'objet
      if (!duree_traitement) {
        delete ordonnanceData.duree_traitement;
      }

      console.log('Durée du traitement formatée:', duree_traitement);
      console.log('Données complètes à envoyer:', ordonnanceData);

      console.log('Envoi des données d\'ordonnance:', ordonnanceData);
      const result = await createOrdonnance(ordonnanceData);
      console.log('Ordonnance créée:', result);
      
      // Générer le QR Code pour l'ordonnance créée
      if (result && result.data && result.data.ordonnance) {
        const prescriptionData = result.data.ordonnance;
        generateQRCodeForPrescription(prescriptionData, 'ordonnance');
      } else {
        alert('Ordonnance créée avec succès');
        closePrescriptionModal();
        loadPrescriptions();
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'ordonnance:', error);
      console.error('Détails de l\'erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Erreur lors de la création de l\'ordonnance';
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      updateUIState({ loading: false });
    }
  };

  const handleCreateExamen = async (e) => {
    e.preventDefault();
    
    if (!examenFormRef.current.patient_id) {
      alert('Veuillez sélectionner un patient');
      return;
    }
    
    if (!examenFormRef.current.type_examen) {
      alert('Veuillez saisir le type d\'examen');
      return;
    }

    // Validation des informations du médecin traitant
    if (!examenFormRef.current.medecin_nom) {
      alert('Veuillez saisir le nom du médecin traitant');
      return;
    }
    
    if (!examenFormRef.current.medecin_prenom) {
      alert('Veuillez saisir le prénom du médecin traitant');
      return;
    }
    
    if (!examenFormRef.current.medecin_specialite) {
      alert('Veuillez saisir la spécialité du médecin traitant');
      return;
    }
    
    if (!examenFormRef.current.medecin_numero_ordre) {
      alert('Veuillez saisir le numéro d\'ordre du médecin traitant');
      return;
    }

    updateUIState({ loading: true });
    try {
      // Préparer les données avec validation
      const examenData = {
        ...examenFormRef.current,
        // S'assurer que les champs numériques sont bien des nombres
        patient_id: parseInt(examenFormRef.current.patient_id)
      };

      console.log('Envoi des données d\'examen:', examenData);
      const result = await createExamen(examenData);
      console.log('Examen créé:', result);
      
      // Générer le QR Code pour l'examen créé
      if (result && result.data && result.data.demande) {
        const prescriptionData = result.data.demande;
        generateQRCodeForPrescription(prescriptionData, 'examen');
      } else {
        alert('Demande d\'examen créée avec succès');
        closeExamenModal();
        loadPrescriptions();
      }
    } catch (error) {
      console.error('Erreur lors de la création de la demande d\'examen:', error);
      console.error('Détails de l\'erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Erreur lors de la création de la demande d\'examen';
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      updateUIState({ loading: false });
    }
  };

  // Fonction pour générer le QR Code selon la documentation API
  const generateQRCodeForPrescription = (prescriptionData, type) => {
    try {
      // Créer les données du QR Code selon la documentation
      const qrData = {
        id: prescriptionData.id_prescription || prescriptionData.id,
        number: prescriptionData.prescriptionNumber || prescriptionData.numero_prescription,
        patient: prescriptionData.patient_id || prescriptionData.patient?.id_patient,
        professionnel: prescriptionData.professionnel_id || prescriptionData.professionnel?.id_professionnel,
        date: prescriptionData.date_prescription || prescriptionData.createdAt,
        type: type,
        hash: generateHash(`${prescriptionData.id_prescription || prescriptionData.id}-${prescriptionData.prescriptionNumber || prescriptionData.numero_prescription}`)
      };
      
      qrCodeDataRef.current = qrData;
      createdPrescriptionRef.current = prescriptionData;
      updateModalState({ showQRModal: true });
      
      // Fermer les modales de création
      closePrescriptionModal();
      closeExamenModal();
      
    } catch (error) {
      console.error('Erreur lors de la génération du QR Code:', error);
      alert('Prescription créée avec succès, mais erreur lors de la génération du QR Code');
      loadPrescriptions();
    }
  };

  // Fonction pour générer un hash simple (simulation de la signature électronique)
  const generateHash = (data) => {
    let hash = 0;
    if (data.length === 0) return hash.toString();
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 16);
  };

  const closeQRModal = () => {
    updateModalState({ showQRModal: false });
    qrCodeDataRef.current = null;
    createdPrescriptionRef.current = null;
    loadPrescriptions(); // Recharger la liste après fermeture
  };

  // Fonctions pour les notifications et ordonnances récentes
  const loadNotifications = async (patientId = null) => {
    updateLoadingState({ notifications: true });
    try {
      // Récupérer les notifications depuis l'API
      if (patientId) {
        const notificationsData = await getNotificationsPatient(patientId);
        updateDataState({ prescriptionNotifications: notificationsData || [] });
      } else {
        // Si aucun patient spécifique, récupérer toutes les notifications
        const notificationsData = await getNotificationsPatient();
        updateDataState({ prescriptionNotifications: notificationsData || [] });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      updateDataState({ prescriptionNotifications: [] });
    } finally {
      updateLoadingState({ notifications: false });
    }
  };
// affichage des ordonnances récentes
const loadOrdonnancesRecentes = useCallback(async () => {
  updateLoadingState({ ordonnances: true });
  try {
    // On récupère l'id du patient affiché
    const patientId = selectedPatientForPrescriptionRef.current?.id_patient || selectedPatientForPrescriptionRef.current?.rawData?.id_patient || selectedPatientForPrescriptionRef.current?.id;
    
    if (!patientId) {
      console.warn("Aucun patient sélectionné, impossible de charger les ordonnances récentes.");
      updateDataState({ ordonnancesRecentes: [] });
      updateLoadingState({ ordonnances: false });
      return;
    }
    
    // Appel à l'API avec les nouveaux paramètres
    const ordonnancesData = await getOrdonnancesRecentes({
      patient_id: patientId,
      limit: 20, // Limite par défaut pour afficher suffisamment d'ordonnances
      type: 'tous' // Récupère tous les types (ordonnances + examens)
    });
    
    // Mise à jour avec la nouvelle structure de réponse
    updateDataState({ ordonnancesRecentes: ordonnancesData?.data?.prescriptions || [] });
    console.log("Ordonnances récentes chargées avec succès:", ordonnancesData?.data?.prescriptions || []);
    
    // Log des informations supplémentaires disponibles
    if (ordonnancesData?.data) {
      console.log("Total des prescriptions:", ordonnancesData.data.total);
      console.log("Limite appliquée:", ordonnancesData.data.limit);
      console.log("Période couverte:", ordonnancesData.data.periode);
    }
    
  } catch (error) {
    console.error("Erreur lors du chargement des ordonnances récentes:", error);
    updateDataState({ ordonnancesRecentes: [] });
  } finally {
    updateLoadingState({ ordonnances: false });
  }
}, [selectedPatientForPrescriptionRef.current]);

  const loadResumeAujourdhui = async () => {
    updateLoadingState({ resume: true });
    try {
      // Récupérer le résumé depuis l'API
      const resumeData = await getResumeAujourdhui();
      console.log('Résumé récupéré depuis l\'API:', resumeData);
      updateDataState({ resumeAujourdhui: resumeData });
    } catch (error) {
      console.error('Erreur lors du chargement du résumé:', error);
      updateDataState({ resumeAujourdhui: null });
    } finally {
      updateLoadingState({ resume: false });
    }
  };

  const openOrdonnanceCompleteModal = (patient = null) => {
    if (patient) {
      selectedPatientForPrescriptionRef.current = patient;
      const patientId = patient.id || patient.rawData?.id_patient || patient.id_patient;
      ordonnanceCompleteFormRef.current = { ...ordonnanceCompleteFormRef.current, patient_id: patientId };
    }
    updateModalState({ showOrdonnanceCompleteModal: true });
  };

  const closeOrdonnanceCompleteModal = () => {
    updateModalState({ showOrdonnanceCompleteModal: false });
    ordonnanceCompleteFormRef.current = {
      patient_id: '',
      dossier_id: '',
      principe_actif: '',
      nom_commercial: '',
      dosage: '',
      frequence: '',
      voie_administration: 'orale',
      duree_traitement: '',
      renouvelable: false,
      nb_renouvellements: 0,
      observations: '',
      priorite: 'normale',
      canal: 'application'
    };
  };

  const handleOrdonnanceCompleteInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    ordonnanceCompleteFormRef.current = (prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCreateOrdonnanceComplete = async (e) => {
    e.preventDefault();
    
    if (!ordonnanceCompleteFormRef.current.patient_id) {
      alert('Veuillez sélectionner un patient');
      return;
    }
    
    if (!ordonnanceCompleteFormRef.current.principe_actif) {
      alert('Veuillez saisir le principe actif');
      return;
    }
    
    if (!ordonnanceCompleteFormRef.current.dosage) {
      alert('Veuillez saisir le dosage');
      return;
    }
    
    if (!ordonnanceCompleteFormRef.current.frequence) {
      alert('Veuillez saisir la fréquence');
      return;
    }

    // Validation des informations du médecin traitant
    if (!ordonnanceCompleteFormRef.current.medecin_nom) {
      alert('Veuillez saisir le nom du médecin traitant');
      return;
    }
    
    if (!ordonnanceCompleteFormRef.current.medecin_prenom) {
      alert('Veuillez saisir le prénom du médecin traitant');
      return;
    }
    
    if (!ordonnanceCompleteFormRef.current.medecin_specialite) {
      alert('Veuillez saisir la spécialité du médecin traitant');
      return;
    }
    
    if (!ordonnanceCompleteFormRef.current.medecin_numero_ordre) {
      alert('Veuillez saisir le numéro d\'ordre du médecin traitant');
      return;
    }

    updateUIState({ loading: true });
    try {
      // Créer l'ordonnance complète via l'API
      console.log('Ordonnance complète à créer:', ordonnanceCompleteFormRef.current);
      
      const result = await createOrdonnanceComplete(ordonnanceCompleteFormRef.current);
      console.log('Ordonnance complète créée:', result);
      
      alert('Ordonnance créée avec succès !');
      closeOrdonnanceCompleteModal();
      loadOrdonnancesRecentes(); // Recharger la liste
      loadResumeAujourdhui(); // Mettre à jour le résumé
    } catch (error) {
      console.error('Erreur lors de la création de l\'ordonnance complète:', error);
      alert('Erreur lors de la création de l\'ordonnance: ' + (error.message || error));
    } finally {
      updateUIState({ loading: false });
    }
  };

  const marquerNotificationCommeLue = async (notificationId) => {
    try {
      // Marquer la notification comme lue via l'API
      await marquerNotificationLue(notificationId);
      
      // Mettre à jour localement les notifications
      updateDataState((prev) => ({ prescriptionNotifications: 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, lue: true }
            : notif
        )
      }));
      
      console.log('Notification marquée comme lue avec succès');
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      alert('Erreur lors du marquage de la notification');
    }
  };

  // Formatage des données patient pour l'affichage

  // 🔍 DEBUG : Log de débogage pour l'affichage des patients (exécuté une seule fois)
  useEffect(() => {
    console.log('🔍 DEBUG - État initial de l\'affichage:', {
      activeTab: uiState.activeTab,
      patientsCount: dataState.patients?.length || 0,
      patients: dataState.patients,
      isArray: Array.isArray(dataState.patients)
    });
  }, []); // Exécuté une seule fois au montage

  // Load dossiers dataState.patients when switching to shared-folder tab
  useEffect(() => {
    console.log('Active tab changed to:', uiState.activeTab);
    
    // Utiliser un switch pour éviter les appels multiples
    switch (uiState.activeTab) {
      case "patients-list":
        console.log('Switching to patients-list tab, loading patients...');
        loadPatients();
        break;
      case "shared-folder":
        console.log('Switching to shared-folder tab, loading dossiers patients...');
        loadDossiersPatients();
        break;
      case "prescriptions":
        console.log('Switching to prescriptions tab, loading prescriptions...');
        loadPrescriptions();
        break;
      case "notifications":
        console.log('Switching to notifications tab, loading notifications...');
        loadOrdonnancesRecentes();
        loadResumeAujourdhui();
        loadNotifications();
        break;
      default:
        console.log('Unknown tab:', uiState.activeTab);
    }
  }, [uiState.activeTab]); // Supprimer toutes les dépendances de fonctions pour éviter la boucle infinie

  // Afficher un écran de chargement pendant la vérification d'authentification
  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, ne rien afficher (redirection en cours)
  if (!authState.isAuthenticated) {
    return null;
  }

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
                  onClick={() => updateUIState({ activeTab: "patients-list"})}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${uiState.activeTab === "patients-list" ? "bg-blue-100 font-bold" : "hover:bg-blue-50"}`}>
                  <span>📁</span> <span>Liste des Patients</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => updateUIState({ activeTab: "shared-folder"})}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${uiState.activeTab === "shared-folder" ? "bg-blue-100 font-bold" : "hover:bg-blue-50"}`}>
                  <span>📁</span> <span>Dossiers Patients</span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => updateUIState({ activeTab: "notifications"})}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 relative ${uiState.activeTab === "notifications" ? "bg-blue-100 font-bold" : "hover:bg-blue-50"}`}>
                  <span>🔔</span> <span>Notifications</span>
                  <span className="notification-badge absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center" style={{display:"inline"}}>3</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => updateUIState({ activeTab: "prescriptions"})}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${uiState.activeTab === "prescriptions" ? "bg-blue-100 font-bold" : "hover:bg-blue-50"}`}>
                  <span>💊</span> <span>Prescriptions</span>
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
                value={uiState.search}
                onChange={(e) => updateUIState({ search: e.target.value })}
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
                <input type="checkbox" className="rounded text-blue-500" checked={uiState.filterRecent} onChange={() => updateUIState({ filterRecent: (v) => !v })} />
                <span>Consultation récente</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-blue-500" checked={uiState.filterShared} onChange={() => updateUIState({ filterShared: (v) => !v })} />
                <span>Dossiers mutualisés</span>
              </label>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="content-area flex-1 p-6">
          {/* Patients List */}
          {uiState.activeTab === "patients-list" && (
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
                {Array.isArray(dataState.patients) && dataState.patients.length > 0 ? (
                  dataState.patients.map((p, idx) => (
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
                        <button 
                          className="text-purple-600 hover:text-purple-800" 
                          onClick={() => selectPatientForPrescription(p)}
                          title="Sélectionner pour prescriptions"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-800" 
                          onClick={() => navigate(`/dmp-access/${p.id}`)}
                          title="Accès DMP"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </button>
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
          {uiState.activeTab === "shared-folder" && (
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
                    disabled={loadingState.dossiers}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loadingState.dossiers ? 'Chargement...' : 'Actualiser'}
                  </button>
                </div>
              </div>
              
              {loadingState.dossiers ? (
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
                  {dataState.dossiersPatients && dataState.dossiersPatients.length > 0 ? (
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
                        {dataState.dossiersPatients.map((dossier, idx) => (
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
                                    {(() => {
                                      // Prioriser le numeroDossier (avec D majuscule), ne jamais afficher l'ID
                                      const numeroDossier = dossier.numeroDossier || dossier.numero_dossier || 'N/A';
                                      console.log('Affichage numéro dossier:', {
                                        numeroDossier: dossier.numeroDossier,
                                        numero_dossier: dossier.numero_dossier,
                                        id_dossier: dossier.id_dossier,
                                        id: dossier.id,
                                        final: numeroDossier,
                                        rawDossier: dossier
                                      });
                                      return `Dossier #${numeroDossier}`;
                                    })()}
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

          {/* Notifications */}
          {uiState.activeTab === "notifications" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Centre de Notifications</h2>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => openOrdonnanceCompleteModal()}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Ordonnance Complète
                  </button>
                  <button
                    onClick={() => {
                      loadOrdonnancesRecentes();
                      loadResumeAujourdhui();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    disabled={loadingState.ordonnances || loadingState.resume}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Actualiser
                  </button>
                </div>
              </div>

              {/* Résumé d'aujourd'hui */}
              {dataState.resumeAujourdhui && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-6 mb-6 text-white">
                  <h3 className="text-lg font-semibold mb-4">📊 Résumé d'Aujourd'hui</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{dataState.resumeAujourdhui.total_ordonnances || 0}</div>
                      <div className="text-sm opacity-90">Ordonnances</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{dataState.resumeAujourdhui.total_examens || 0}</div>
                      <div className="text-sm opacity-90">Examens</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{dataState.resumeAujourdhui.notifications_envoyees || 0}</div>
                      <div className="text-sm opacity-90">Notifications</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{dataState.resumeAujourdhui.derniere_creation || 'Aucune'}</div>
                      <div className="text-sm opacity-90">Dernière création</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ordonnances récentes */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">📋 Ordonnances Récentes</h3>
                {loadingState.ordonnances ? (
                  <div className="flex items-center justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-3 text-gray-600">Chargement des ordonnances récentes...</span>
                  </div>
                ) : dataState.ordonnancesRecentes && dataState.ordonnancesRecentes.length > 0 ? (
                  <div className="space-y-4">
                    {dataState.ordonnancesRecentes.map((ordonnance, idx) => (
                      <div key={ordonnance.id || idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Ordonnance #{ordonnance.numero_prescription || ordonnance.id}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Patient: {ordonnance.patient?.nom || 'Patient inconnu'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Médicament: {ordonnance.principe_actif || 'Non spécifié'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Créée le: {ordonnance.date_creation ? new Date(ordonnance.date_creation).toLocaleDateString('fr-FR') : 'Date inconnue'}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                // Ajouter au dossier patient
                                if (ordonnance.id && selectedPatientForPrescriptionRef.current?.dossier_id) {
                                  ajouterPrescriptionAuDossier(ordonnance.id, selectedPatientForPrescriptionRef.current.dossier_id);
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              title="Ajouter au dossier"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                // Voir les détails
                                selectedNotificationRef.current = ordonnance;
                                updateModalState({ showNotificationModal: true });
                              }}
                              className="text-green-600 hover:text-green-800 text-sm"
                              title="Voir détails"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune ordonnance récente</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Créez votre première ordonnance pour commencer.
                    </p>
                  </div>
                )}
              </div>

              {/* Notifications de prescription */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">🔔 Notifications de Prescription</h3>
                {loadingState.notifications ? (
                  <div className="flex items-center justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-3 text-gray-600">Chargement des notifications...</span>
                  </div>
                ) : dataState.prescriptionNotifications && dataState.prescriptionNotifications.length > 0 ? (
                  <div className="space-y-4">
                    {dataState.prescriptionNotifications.map((notif, idx) => (
                      <div key={notif.id || idx} className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-8 h-8 rounded-full ${
                            notif.priorite === 'urgente' ? 'bg-red-100' :
                            notif.priorite === 'haute' ? 'bg-orange-100' :
                            notif.priorite === 'normale' ? 'bg-blue-100' : 'bg-gray-100'
                          } flex items-center justify-center`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${
                              notif.priorite === 'urgente' ? 'text-red-600' :
                              notif.priorite === 'haute' ? 'text-orange-600' :
                              notif.priorite === 'normale' ? 'text-blue-600' : 'text-gray-600'
                            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-900">{notif.titre || 'Notification'}</p>
                            <span className="text-xs text-gray-500">{notif.date_creation ? new Date(notif.date_creation).toLocaleDateString('fr-FR') : 'Date inconnue'}</span>
                          </div>
                          <p className="text-sm text-gray-500">{notif.contenu || notif.message}</p>
                          <div className="mt-2 flex space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              notif.priorite === 'urgente' ? 'bg-red-100 text-red-800' :
                              notif.priorite === 'haute' ? 'bg-orange-100 text-orange-800' :
                              notif.priorite === 'normale' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {notif.priorite || 'normale'}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                              {notif.canal || 'application'}
                            </span>
                            {!notif.lue && (
                              <button
                                onClick={() => marquerNotificationCommeLue(notif.id)}
                                className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200"
                              >
                                Marquer comme lue
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune notification</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Aucune notification de prescription pour le moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Prescriptions */}
          {uiState.activeTab === "dataState.prescriptions" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Prescriptions</h2>
                  {selectedPatientForPrescriptionRef.current && (
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-gray-600 mr-2">Patient sélectionné:</span>
                      <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {selectedPatientForPrescriptionRef.current.name || `${selectedPatientForPrescriptionRef.current.prenom || ''} ${selectedPatientForPrescriptionRef.current.nom || ''}`.trim() || 'Patient inconnu'}
                      </span>
                      <button
                        onClick={() => selectedPatientForPrescriptionRef.current = null}
                        className="ml-2 text-red-600 hover:text-red-800"
                        title="Désélectionner le patient"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => openPrescriptionModal()}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                    disabled={!selectedPatientForPrescriptionRef.current}
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nouvelle Ordonnance
                  </button>
                  <button 
                    onClick={() => openExamenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    disabled={!selectedPatientForPrescriptionRef.current}
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Demande d'Examen
                  </button>
                  <button
                    onClick={loadPrescriptions}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                    disabled={loadingState.dataState_prescriptions || !selectedPatientForPrescriptionRef.current}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loadingState.dataState_prescriptions ? 'Chargement...' : 'Actualiser'}
                  </button>
                </div>
              </div>
              
                              {loadingState.dataState_prescriptions ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-3 text-gray-600">Chargement des dataState.prescriptions...</span>
                  </div>
                </div>
              ) : !selectedPatientForPrescriptionRef.current ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun patient sélectionné</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Veuillez sélectionner un patient depuis la liste des dataState.patients pour voir ses dataState.prescriptions.
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={() => updateUIState({ activeTab: "patients-list" })}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          Voir les dataState.patients
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  {dataState.prescriptions && dataState.prescriptions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principe Actif/Examen</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage/Paramètres</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dataState.prescriptions.map((prescription, idx) => (
                            <tr key={prescription.id_prescription || idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {prescription.prescriptionNumber || prescription.numero_prescription || `PRES-${idx + 1}`}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {prescription.patient ? 
                                    `${prescription.patient.prenom || ''} ${prescription.patient.nom || ''}`.trim() || 'Patient inconnu' :
                                    'Patient inconnu'
                                  }
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  prescription.type_prescription === 'examen' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {prescription.type_prescription === 'examen' ? 'Examen' : 'Ordonnance'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {prescription.principe_actif || prescription.type_examen || 'Non spécifié'}
                                </div>
                                {prescription.nom_commercial && (
                                  <div className="text-sm text-gray-500">
                                    {prescription.nom_commercial}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {prescription.dosage || prescription.parametres || 'Non spécifié'}
                                </div>
                                {prescription.frequence && (
                                  <div className="text-sm text-gray-500">
                                    {prescription.frequence}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {prescription.date_prescription ? 
                                  new Date(prescription.date_prescription).toLocaleDateString('fr-FR') : 
                                  'Non spécifié'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  prescription.statut === 'active' ? 'bg-green-100 text-green-800' :
                                  prescription.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                                  prescription.statut === 'terminee' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {prescription.statut === 'active' ? 'Active' :
                                   prescription.statut === 'en_attente' ? 'En attente' :
                                   prescription.statut === 'terminee' ? 'Terminée' :
                                   prescription.statut === 'annulee' ? 'Annulée' : 'Inconnu'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button 
                                  onClick={() => {
                                    const qrData = {
                                      id: prescription.id_prescription || prescription.id,
                                      number: prescription.prescriptionNumber || prescription.numero_prescription,
                                      patient: prescription.patient_id || prescription.patient?.id_patient,
                                      professionnel: prescription.professionnel_id || prescription.professionnel?.id_professionnel,
                                      date: prescription.date_prescription || prescription.createdAt,
                                      type: prescription.type_prescription || 'ordonnance',
                                      hash: generateHash(`${prescription.id_prescription || prescription.id}-${prescription.prescriptionNumber || prescription.numero_prescription}`)
                                    };
                                    qrCodeDataRef.current = qrData;
                                    createdPrescriptionRef.current = prescription;
                                    updateModalState({ showQRModal: true });
                                  }}
                                  className="text-green-600 hover:text-green-900 mr-3"
                                  title="Voir QR Code"
                                >
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                                  </svg>
                                </button>
                                <button className="text-blue-600 hover:text-blue-900 mr-3" title="Voir détails">
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button className="text-yellow-600 hover:text-yellow-900 mr-3" title="Modifier">
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button className="text-red-600 hover:text-red-900" title="Supprimer">
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune prescription</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Commencez par créer une nouvelle ordonnance ou une demande d'examen.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Patient Details Modal */}
      {modalState.showPatientModal && modalPatientRef.current && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-start md:justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-full md:max-w-4xl max-h-[95vh] overflow-y-auto mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Dossier de {modalPatientRef.current.name}</h2>
              <button onClick={closePatientModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-1">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <img src={modalPatientRef.current.image || "https://placehold.co/150"} alt="" className="rounded-full mx-auto mb-4"/>
                  <h3 className="text-xl font-bold">{modalPatientRef.current.name}</h3>
                  <p className="text-gray-600 mb-2">Né le {modalPatientRef.current.birth} {modalPatientRef.current.age && `(${modalPatientRef.current.age} ans)`}</p>
                  <p className="text-gray-600 mb-4">Groupe sanguin: {modalPatientRef.current.blood || "?"}</p>
                  <div className="flex justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">{modalPatientRef.current.gender}</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md">{modalPatientRef.current.status}</span>
                  </div>
                </div>
                <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
                  <h4 className="font-semibold mb-2">Coordonnées</h4>
                  <p className="text-gray-700 mb-1">{modalPatientRef.current.address}</p>
                  <p className="text-gray-700 mb-1">{modalPatientRef.current.phone}</p>
                  <p className="text-gray-700">{modalPatientRef.current.email}</p>
                </div>
                <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
                  <h4 className="font-semibold mb-2">Contacts d'urgence</h4>
                  {modalPatientRef.current.emergencyContacts?.map((c, i) => (
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
                        {modalPatientRef.current.pathologies?.map((p, i) => <li key={i} className="flex items-center"><span className="mr-1">•</span> {p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">Allergies</h5>
                      <ul className="text-gray-700 space-y-1">
                        {modalPatientRef.current.allergies?.map((a, i) => <li key={i} className="flex items-center"><span className="mr-1">•</span> {a}</li>)}
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
                        {modalPatientRef.current.consultations?.map((c, i) => (
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
                    {modalPatientRef.current.treatments?.map((t, i) => (
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
      {modalState.showEditModal && editPatientRef.current && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-full md:max-w-xl relative my-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Modifier {editPatientRef.current.name}</h2>
              <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatientRef.current.name.split(" ")[0]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatientRef.current.name.split(" ")[1]} />
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
                <input type="text" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatientRef.current.address} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="tel" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatientRef.current.phone} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatientRef.current.email} />
              </div>
              <div className="md:col-span-2">
                <h3 className="font-semibold mb-2">Antécédents médicaux</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pathologies</label>
                    <textarea className="w-full px-3 py-2 border rounded-md" rows={2}>{editPatientRef.current.pathologies?.join("\n")}</textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                    <textarea className="w-full px-3 py-2 border rounded-md" rows={2}>{editPatientRef.current.allergies?.join("\n")}</textarea>
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
      {modalState.showShareModal && sharePatientRef.current && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-full md:max-w-2xl relative my-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mutualiser {sharePatientRef.current.name}</h2>
              <button onClick={closeShareModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Patient : {sharePatientRef.current.name}</h3>
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

Je vous transmets le dossier de M. ${sharePatientRef.current.name} pour prise en charge conjointe. Ce patient présente les antécédents médicaux suivants : hypertension artérielle, hypercholestérolémie et diabète type II.

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
      {modalState.showAddModal && (
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
      {modalState.showPatientFile && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-full md:max-w-4xl mx-auto rounded-lg shadow-lg max-h-[95vh] overflow-y-auto my-2 md:my-4">
            <div className="flex justify-between items-center border-b px-4 py-3 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium">Créer un Dossier Patient</h3>
              <div className="flex items-center space-x-2">
                {(loadingState.services || uiState.loading) && (
                  <div className="flex items-center text-sm text-blue-600">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {loadingState.services ? 'Chargement...' : 'Création...'}
                  </div>
                )}
                <button onClick={closePatientFileModal} className="text-gray-500 hover:text-gray-700" disabled={uiState.loading}>
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
                      value={patientFileFormRef.current.patient_id} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      required
                      disabled={uiState.loading}
                    >
                      <option value="">Sélectionnez un patient</option>
                      {Array.isArray(dataState.dataState.patientsForSelect) && dataState.dataState.patientsForSelect.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} {patient.numero_dossier !== 'N/A' ? `(${patient.numero_dossier})` : ''}
                        </option>
                      ))}
                    </select>
                    {dataState.dataState.patientsForSelect.length === 0 && !uiState.loading && (
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
                      value={patientFileFormRef.current.service_id} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      required
                      disabled={loadingState.services || uiState.loading}
                    >
                      <option value="">
                        {loadingState.services ? "Chargement des services..." : "Sélectionnez un service"}
                      </option>
                      {Array.isArray(dataState.services) && dataState.services.length > 0 && dataState.services.map(service => {
                        const serviceId = service.id || service.id_service || service.service_id;
                        const serviceName = service.name || service.nom || service.libelle || service.service_name || 'Service sans nom';
                        return (
                          <option key={serviceId} value={serviceId}>
                            {serviceName}
                          </option>
                        );
                      })}
                    </select>
                    {loadingState.services && (
                      <div className="mt-1 text-sm text-blue-600">
                        Chargement des dataState.services...
                      </div>
                    )}
                    {!loadingState.services && dataState.services.length === 0 && (
                      <div className="mt-1 text-sm text-red-600">
                        Aucun service disponible
                      </div>
                    )}
                    {!loadingState.services && dataState.services.length > 0 && (
                      <div className="mt-1 text-sm text-green-600">
                        {dataState.services.length} service(s) chargé(s)
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="statut" 
                      value={patientFileFormRef.current.statut} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      required
                      disabled={uiState.loading}
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
                      value={patientFileFormRef.current.dateOuverture} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      required 
                      disabled={uiState.loading}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fermeture (optionnel)</label>
                    <input 
                      type="date" 
                      name="dateFermeture" 
                      value={patientFileFormRef.current.dateFermeture} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      disabled={uiState.loading}
                      min={patientFileFormRef.current.dateOuverture || new Date().toISOString().split('T')[0]}
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
                    <input type="text" name="resume_medical" value={patientFileFormRef.current.resume_medical} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Bref résumé de l'état médical du patient" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Antécédents Médicaux</label>
                      <textarea name="antecedents_medicaux" value={patientFileFormRef.current.antecedents_medicaux} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Historique médical du patient"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                      <textarea name="allergies" value={patientFileFormRef.current.allergies} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Allergies connues"></textarea>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Traitement</label>
                      <textarea name="traitement" value={patientFileFormRef.current.traitement} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Traitements actuels"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Signes Vitaux</label>
                      <textarea name="signes_vitaux" value={patientFileFormRef.current.signes_vitaux} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Tension, poids, température, etc."></textarea>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Histoire Familiale</label>
                      <textarea name="histoire_familiale" value={patientFileFormRef.current.histoire_familiale} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Antécédents familiaux"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
                      <textarea name="observations" value={patientFileFormRef.current.observations} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Observations cliniques"></textarea>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Directives Anticipées</label>
                    <textarea name="directives_anticipees" value={patientFileFormRef.current.directives_anticipees} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={2} placeholder="Directives pour les soins futurs"></textarea>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={closePatientFileModal} 
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={uiState.loading}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uiState.loading}
                >
                  {uiState.loading ? 'Création en cours...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dossier Details Modal */}
      {modalState.showDossierModal && selectedDossierRef.current && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-full md:max-w-4xl mx-auto rounded-lg shadow-lg max-h-[95vh] overflow-y-auto my-2 md:my-4">
            <div className="flex justify-between items-center border-b px-4 py-3 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium">
                Dossier #{selectedDossierRef.current.numeroDossier || selectedDossierRef.current.numero_dossier || (dossierDetailsRef.current?.numeroDossier) || 'N/A'} - {
                  // Priority: Use enriched patient info from dossierDetailsRef.current if available
                  dossierDetailsRef.current?.patient ?
                    `${dossierDetailsRef.current.patient.prenom || ''} ${dossierDetailsRef.current.patient.nom || ''}`.trim() || 'Patient inconnu' :
                    // Fallback: Use selectedDossierRef.current patient info
                    selectedDossierRef.current.patient ?
                      `${selectedDossierRef.current.patient.prenom || ''} ${selectedDossierRef.current.patient.nom || ''}`.trim() || 'Patient inconnu' :
                      // Last resort: Use any available patient name fields
                      selectedDossierRef.current.patient_name || selectedDossierRef.current.patient_nom || dossierDetailsRef.current?.patient_name || 'Patient inconnu'
                }
              </h3>
              <div className="flex items-center space-x-2">
                {dossierDetailsRef.currentLoading && (
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
              {dossierDetailsRef.currentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-3 text-gray-600">Chargement des détails...</span>
                </div>
              ) : dossierDetailsRef.current ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Informations de Base</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Patient Information */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Patient</label>
                        <p className="text-sm text-gray-900 font-medium">
                          {dossierDetailsRef.current.patient ?
                            `${dossierDetailsRef.current.patient.prenom || ''} ${dossierDetailsRef.current.patient.nom || ''}`.trim() || 'Nom inconnu' :
                            `Patient ID: ${dossierDetailsRef.current.patient_id || 'N/A'}`
                          }
                        </p>
                        {dossierDetailsRef.current.patient?.numero_dossier && (
                          <p className="text-xs text-gray-500">{dossierDetailsRef.current.patient.numero_dossier}</p>
                        )}
                      </div>
                      
                      {/* Patient Gender */}
                      {dossierDetailsRef.current.patient?.sexe && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Sexe</label>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {dossierDetailsRef.current.patient.sexe === 'M' ? 'Homme' :
                             dossierDetailsRef.current.patient.sexe === 'F' ? 'Femme' :
                             dossierDetailsRef.current.patient.sexe}
                          </span>
                        </div>
                      )}
                      
                      {/* Blood Group - Placeholder for future implementation */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Groupe sanguin</label>
                        <p className="text-sm text-gray-500 italic">
                          {dossierDetailsRef.current.patient?.groupe_sanguin || 'Non renseigné'}
                        </p>
                      </div>
                      
                      {/* Service */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Service</label>
                        <p className="text-sm text-gray-900">{getServiceNameById(dossierDetailsRef.current.service_id)}</p>
                      </div>
                      
                      {/* Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Statut</label>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          dossierDetailsRef.current.statut === 'actif'
                            ? 'bg-green-100 text-green-800'
                            : dossierDetailsRef.current.statut === 'ferme'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {dossierDetailsRef.current.statut || 'Inconnu'}
                        </span>
                      </div>
                      
                      {/* Opening Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date d'ouverture</label>
                        <p className="text-sm text-gray-900">
                          {dossierDetailsRef.current.dateCreation ? new Date(dossierDetailsRef.current.dateCreation).toLocaleDateString('fr-FR') :
                           dossierDetailsRef.current.dateOuverture ? new Date(dossierDetailsRef.current.dateOuverture).toLocaleDateString('fr-FR') :
                           'Non définie'}
                        </p>
                      </div>
                      
                      {/* Closing Date */}
                      {dossierDetailsRef.current.dateFermeture && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date de fermeture</label>
                          <p className="text-sm text-gray-900">
                            {new Date(dossierDetailsRef.current.dateFermeture).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      )}
                      
                      {/* Patient Contact Info */}
                      {dossierDetailsRef.current.patient?.telephone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                          <p className="text-sm text-gray-900">{dossierDetailsRef.current.patient.telephone}</p>
                        </div>
                      )}
                      
                      {dossierDetailsRef.current.patient?.email && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="text-sm text-gray-900">{dossierDetailsRef.current.patient.email}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Informations Médicales</h4>
                    <div className="space-y-4">
                      {dossierDetailsRef.current.resume_medical && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Résumé Médical</label>
                          <p className="text-sm text-gray-900 mt-1">{dossierDetailsRef.current.resume_medical}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dossierDetailsRef.current.antecedents_medicaux && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Antécédents Médicaux</label>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetailsRef.current.antecedents_medicaux}</p>
                          </div>
                        )}
                        
                        {dossierDetailsRef.current.allergies && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Allergies</label>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetailsRef.current.allergies}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dossierDetailsRef.current.traitement && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Traitement</label>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetailsRef.current.traitement}</p>
                          </div>
                        )}
                        
                        {dossierDetailsRef.current.signes_vitaux && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Signes Vitaux</label>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetailsRef.current.signes_vitaux}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dossierDetailsRef.current.histoire_familiale && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Histoire Familiale</label>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetailsRef.current.histoire_familiale}</p>
                          </div>
                        )}
                        
                        {dossierDetailsRef.current.observations && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Observations</label>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetailsRef.current.observations}</p>
                          </div>
                        )}
                      </div>

                      {dossierDetailsRef.current.directives_anticipees && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Directives Anticipées</label>
                          <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dossierDetailsRef.current.directives_anticipees}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Raw Data for Debugging */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Données Brutes (Debug)</h4>
                    <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(dossierDetailsRef.current, null, 2)}
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
      {modalState.showEditDossierModal && selectedDossierRef.current && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-full md:max-w-6xl mx-auto rounded-lg shadow-lg max-h-[95vh] overflow-y-auto my-2 md:my-4">
            <div className="flex justify-between items-center border-b px-4 py-3 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium">
                Modifier le Dossier {selectedDossierRef.current.numeroDossier || selectedDossierRef.current.numero_dossier || 'N/A'}
              </h3>
              <div className="flex items-center space-x-2">
                {uiState.loading && (
                  <div className="flex items-center text-sm text-blue-600">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mise à jour...
                  </div>
                )}
                <button onClick={closeEditDossierModal} className="text-gray-500 hover:text-gray-700" disabled={uiState.loading}>
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
                    <p className="mt-1">Vous modifiez le dossier de {selectedDossierRef.current.patient ? `${selectedDossierRef.current.patient.prenom} ${selectedDossierRef.current.patient.nom}` : 'Patient inconnu'}. Vérifiez attentivement les informations avant de sauvegarder.</p>
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
                      value={editDossierFormRef.current.statut}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={uiState.loading}
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
                      value={editDossierFormRef.current.type_dossier}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={uiState.loading}
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
                      value={editDossierFormRef.current.service_id}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={uiState.loading}
                    >
                      <option value="">Sélectionnez un service</option>
                      {Array.isArray(dataState.services) && dataState.services.map(service => {
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
                    value={editDossierFormRef.current.resume}
                    onChange={handleEditDossierInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Résumé clinique du patient et de sa situation médicale"
                    disabled={uiState.loading}
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
                      value={editDossierFormRef.current.antecedent_medicaux}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Antécédents médicaux structurés (pathologies, chirurgies, etc.)"
                      disabled={uiState.loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                    <textarea
                      name="allergies"
                      value={editDossierFormRef.current.allergies}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Allergies et intolérances médicamenteuses ou autres"
                      disabled={uiState.loading}
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
                    value={editDossierFormRef.current.traitements_chroniques}
                    onChange={handleEditDossierInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Traitements au long cours avec posologie et indications"
                    disabled={uiState.loading}
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
                      value={editDossierFormRef.current.heart_rate}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 72 bpm"
                      disabled={uiState.loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tension artérielle</label>
                    <input
                      type="text"
                      name="blood_pressure"
                      value={editDossierFormRef.current.blood_pressure}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 120/80 mmHg"
                      disabled={uiState.loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Température</label>
                    <input
                      type="text"
                      name="temperature"
                      value={editDossierFormRef.current.temperature}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 37.2°C"
                      disabled={uiState.loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence respiratoire</label>
                    <input
                      type="text"
                      name="respiratory_rate"
                      value={editDossierFormRef.current.respiratory_rate}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 16/min"
                      disabled={uiState.loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saturation en oxygène</label>
                    <input
                      type="text"
                      name="oxygen_saturation"
                      value={editDossierFormRef.current.oxygen_saturation}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 98%"
                      disabled={uiState.loading}
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
                      value={editDossierFormRef.current.habitudes_vie}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Informations sur le mode de vie (tabac, alcool, activité physique, etc.)"
                      disabled={uiState.loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Historique familial</label>
                    <textarea
                      name="historique_familial"
                      value={editDossierFormRef.current.historique_familial}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Antécédents familiaux notables"
                      disabled={uiState.loading}
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
                      value={editDossierFormRef.current.directives_anticipées}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Directives anticipées et personnes de confiance"
                      disabled={uiState.loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
                    <textarea
                      name="observations"
                      value={editDossierFormRef.current.observations}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Notes et observations diverses"
                      disabled={uiState.loading}
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
                      value={editDossierFormRef.current.date_fermeture}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={uiState.loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motif de fermeture</label>
                    <input
                      type="text"
                      name="motif_fermeture"
                      value={editDossierFormRef.current.motif_fermeture}
                      onChange={handleEditDossierInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Raison de la fermeture du dossier"
                      disabled={uiState.loading}
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
                  disabled={uiState.loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uiState.loading}
                >
                  {uiState.loading ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour créer une ordonnance */}
      {modalState.showPrescriptionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Nouvelle Ordonnance</h2>
              <button
                onClick={closePrescriptionModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="p-6">
              {/* Sélection du patient */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Patient</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                    <select
                      name="patient_id"
                      value={prescriptionFormRef.current.patient_id}
                      onChange={handlePrescriptionInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Sélectionner un patient</option>
                      {dataState.patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} - {patient.numero_dossier}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Informations du médicament */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Médicament</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Principe actif (DCI) *</label>
                    <input
                      type="text"
                      name="principe_actif"
                      value={prescriptionFormRef.current.principe_actif}
                      onChange={handlePrescriptionInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Paracétamol"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom commercial</label>
                    <input
                      type="text"
                      name="nom_commercial"
                      value={prescriptionFormRef.current.nom_commercial}
                      onChange={handlePrescriptionInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Doliprane"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
                    <input
                      type="text"
                      name="dosage"
                      value={prescriptionFormRef.current.dosage}
                      onChange={handlePrescriptionInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 500mg"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence *</label>
                    <input
                      type="text"
                      name="frequence"
                      value={prescriptionFormRef.current.frequence}
                      onChange={handlePrescriptionInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 3 fois par jour"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Voie d'administration</label>
                    <select
                      name="voie_administration"
                      value={prescriptionFormRef.current.voie_administration}
                      onChange={handlePrescriptionInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="orale">Orale</option>
                      <option value="cutanée">Cutanée</option>
                      <option value="nasale">Nasale</option>
                      <option value="oculaire">Oculaire</option>
                      <option value="auriculaire">Auriculaire</option>
                      <option value="vaginale">Vaginale</option>
                      <option value="rectale">Rectale</option>
                      <option value="inhalée">Inhalée</option>
                      <option value="injection">Injection</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durée du traitement</label>
                    <input
                      type="text"
                      name="duree_traitement"
                      value={prescriptionFormRef.current.duree_traitement}
                      onChange={handlePrescriptionInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 7 jours, 2 semaines, 1 mois"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: "nombre unité" (ex: 7 jours, 2 semaines, 1 mois)
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations du médecin traitant */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Médecin Traitant</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du médecin *</label>
                    <input
                      type="text"
                      name="medecin_nom"
                      value={prescriptionFormRef.current.medecin_nom}
                      onChange={handlePrescriptionInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Martin"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom du médecin *</label>
                    <input
                      type="text"
                      name="medecin_prenom"
                      value={prescriptionFormRef.current.medecin_prenom}
                      onChange={handlePrescriptionInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Jean"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité *</label>
                    <input
                      type="text"
                      name="medecin_specialite"
                      value={prescriptionFormRef.current.medecin_specialite}
                      onChange={handlePrescriptionInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Cardiologie, Médecine générale"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro d'ordre *</label>
                    <input
                      type="text"
                      name="medecin_numero_ordre"
                      value={prescriptionFormRef.current.medecin_numero_ordre}
                      onChange={handlePrescriptionInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 12345"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Renouvellement */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Renouvellement</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="renouvelable"
                      checked={prescriptionFormRef.current.renouvelable}
                      onChange={handlePrescriptionInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Ordonnance renouvelable
                    </label>
                  </div>
                  
                  {prescriptionFormRef.current.renouvelable && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de renouvellements</label>
                      <input
                        type="number"
                        name="nb_renouvellements"
                        value={prescriptionFormRef.current.nb_renouvellements}
                        onChange={handlePrescriptionInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="12"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Observations */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Observations</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes et observations</label>
                  <textarea
                    name="observations"
                    value={prescriptionFormRef.current.observations}
                    onChange={handlePrescriptionInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Observations particulières, précautions, etc."
                  />
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closePrescriptionModal}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={uiState.loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uiState.loading}
                >
                  {uiState.loading ? 'Création...' : 'Créer l\'ordonnance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour créer une demande d'examen */}
      {modalState.showExamenModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Demande d'Examen</h2>
              <button
                onClick={closeExamenModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateExamen} className="p-6">
              {/* Sélection du patient */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Patient</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                    <select
                      name="patient_id"
                      value={examenFormRef.current.patient_id}
                      onChange={handleExamenInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Sélectionner un patient</option>
                      {dataState.patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} - {patient.numero_dossier}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Informations de l'examen */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Examen</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type d'examen *</label>
                    <input
                      type="text"
                      name="type_examen"
                      value={examenFormRef.current.type_examen}
                      onChange={handleExamenInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Bilan sanguin complet"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niveau d'urgence</label>
                    <select
                      name="urgence"
                      value={examenFormRef.current.urgence}
                      onChange={handleExamenInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="programmé">Programmé</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paramètres spécifiques</label>
                    <textarea
                      name="parametres"
                      value={examenFormRef.current.parametres}
                      onChange={handleExamenInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Paramètres spécifiques à analyser, conditions particulières, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Informations du médecin traitant */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Médecin Traitant</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du médecin *</label>
                    <input
                      type="text"
                      name="medecin_nom"
                      value={examenFormRef.current.medecin_nom}
                      onChange={handleExamenInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Martin"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom du médecin *</label>
                    <input
                      type="text"
                      name="medecin_prenom"
                      value={examenFormRef.current.medecin_prenom}
                      onChange={handleExamenInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Jean"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité *</label>
                    <input
                      type="text"
                      name="medecin_specialite"
                      value={examenFormRef.current.medecin_specialite}
                      onChange={handleExamenInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Cardiologie, Médecine générale"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro d'ordre *</label>
                    <input
                      type="text"
                      name="medecin_numero_ordre"
                      value={examenFormRef.current.medecin_numero_ordre}
                      onChange={handleExamenInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 12345"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Observations */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Observations</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes et observations</label>
                  <textarea
                    name="observations"
                    value={examenFormRef.current.observations}
                    onChange={handleExamenInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Observations particulières, contexte clinique, etc."
                  />
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeExamenModal}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={uiState.loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uiState.loading}
                >
                  {uiState.loading ? 'Création...' : 'Créer la demande d\'examen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour afficher le QR Code de la prescription */}
      {modalState.showQRModal && qrCodeDataRef.current && createdPrescriptionRef.current && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">
                {qrCodeDataRef.current.type === 'ordonnance' ? 'Ordonnance créée' : 'Demande d\'examen créée'}
              </h2>
              <button
                onClick={closeQRModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <QRCodeCanvas 
                    value={JSON.stringify(qrCodeDataRef.current)}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* Informations de la prescription */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Détails de la {qrCodeDataRef.current.type === 'ordonnance' ? 'prescription' : 'demande d\'examen'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro</label>
                    <p className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                      {qrCodeDataRef.current.number || 'En cours de génération...'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <p className="text-sm text-gray-900">
                      {qrCodeDataRef.current.type === 'ordonnance' ? 'Ordonnance' : 'Demande d\'examen'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de création</label>
                    <p className="text-sm text-gray-900">
                      {qrCodeDataRef.current.date ? new Date(qrCodeDataRef.current.date).toLocaleString('fr-FR') : 'Maintenant'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hash de sécurité</label>
                    <p className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                      {qrCodeDataRef.current.hash}
                    </p>
                  </div>
                </div>

                {/* Détails spécifiques selon le type */}
                {qrCodeDataRef.current.type === 'ordonnance' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-md font-semibold mb-2 text-gray-800">Détails du médicament</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Principe actif</label>
                        <p className="text-sm text-gray-900">
                          {createdPrescriptionRef.current.principe_actif || 'Non spécifié'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                        <p className="text-sm text-gray-900">
                          {createdPrescriptionRef.current.dosage || 'Non spécifié'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence</label>
                        <p className="text-sm text-gray-900">
                          {createdPrescriptionRef.current.frequence || 'Non spécifié'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Voie d'administration</label>
                        <p className="text-sm text-gray-900">
                          {createdPrescriptionRef.current.voie_administration || 'Non spécifié'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {qrCodeDataRef.current.type === 'examen' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-md font-semibold mb-2 text-gray-800">Détails de l'examen</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type d'examen</label>
                        <p className="text-sm text-gray-900">
                          {createdPrescriptionRef.current.type_examen || createdPrescriptionRef.current.principe_actif || 'Non spécifié'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Urgence</label>
                        <p className="text-sm text-gray-900">
                          {createdPrescriptionRef.current.urgence || createdPrescriptionRef.current.frequence || 'Normal'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-md font-semibold mb-2 text-blue-800">Instructions</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Ce QR Code contient toutes les informations de la prescription</li>
                  <li>• Il peut être scanné pour vérifier l'authenticité</li>
                  <li>• Le hash garantit l'intégrité des données</li>
                  <li>• Conservez ce QR Code pour référence</li>
                </ul>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      // Télécharger le QR Code
                      const canvas = document.querySelector('canvas');
                      if (canvas) {
                        const link = document.createElement('a');
                        link.download = `prescription-${qrCodeDataRef.current.number || 'qr'}.png`;
                        link.href = canvas.toDataURL();
                        link.click();
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Télécharger QR Code
                  </button>
                  
                  <button
                    onClick={() => {
                      // Imprimer la prescription
                      window.print();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimer
                  </button>
                </div>
                
                <button
                  onClick={closeQRModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour l'ordonnance complète */}
      {modalState.showOrdonnanceCompleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Ordonnance Complète avec Notification</h2>
              <button
                onClick={closeOrdonnanceCompleteModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateOrdonnanceComplete} className="p-6">
              {/* Sélection du patient et dossier */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Patient et Dossier</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                    <select
                      name="patient_id"
                      value={ordonnanceCompleteFormRef.current.patient_id}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Sélectionner un patient</option>
                      {dataState.patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} - {patient.numero_dossier}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dossier médical (optionnel)</label>
                    <select
                      name="dossier_id"
                      value={ordonnanceCompleteFormRef.current.dossier_id}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Aucun dossier</option>
                      {dataState.dossiersPatients.map((dossier) => (
                        <option key={dossier.id} value={dossier.id}>
                          Dossier #{dossier.numero} - {dossier.patient?.nom || 'Patient inconnu'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Informations du médicament */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Médicament</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Principe actif (DCI) *</label>
                    <input
                      type="text"
                      name="principe_actif"
                      value={ordonnanceCompleteFormRef.current.principe_actif}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Paracétamol"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom commercial</label>
                    <input
                      type="text"
                      name="nom_commercial"
                      value={ordonnanceCompleteFormRef.current.nom_commercial}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Doliprane"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
                    <input
                      type="text"
                      name="dosage"
                      value={ordonnanceCompleteFormRef.current.dosage}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 500mg"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence *</label>
                    <input
                      type="text"
                      name="frequence"
                      value={ordonnanceCompleteFormRef.current.frequence}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 3 fois par jour"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Voie d'administration</label>
                    <select
                      name="voie_administration"
                      value={ordonnanceCompleteFormRef.current.voie_administration}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="orale">Orale</option>
                      <option value="intraveineuse">Intraveineuse</option>
                      <option value="intramusculaire">Intramusculaire</option>
                      <option value="sous_cutanee">Sous-cutanée</option>
                      <option value="topique">Topique</option>
                      <option value="inhalation">Inhalation</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durée du traitement</label>
                    <input
                      type="text"
                      name="duree_traitement"
                      value={ordonnanceCompleteFormRef.current.duree_traitement}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 7 jours"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Renouvelable</label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="renouvelable"
                        checked={ordonnanceCompleteFormRef.current.renouvelable}
                        onChange={handleOrdonnanceCompleteInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">Autoriser le renouvellement</label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de renouvellements</label>
                    <input
                      type="number"
                      name="nb_renouvellements"
                      value={ordonnanceCompleteFormRef.current.nb_renouvellements}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="10"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
                  <textarea
                    name="observations"
                    value={ordonnanceCompleteFormRef.current.observations}
                    onChange={handleOrdonnanceCompleteInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Observations particulières..."
                  />
                </div>
              </div>

              {/* Informations du médecin traitant */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Médecin Traitant</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du médecin *</label>
                    <input
                      type="text"
                      name="medecin_nom"
                      value={ordonnanceCompleteFormRef.current.medecin_nom}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Martin"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom du médecin *</label>
                    <input
                      type="text"
                      name="medecin_prenom"
                      value={ordonnanceCompleteFormRef.current.medecin_prenom}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Jean"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité *</label>
                    <input
                      type="text"
                      name="medecin_specialite"
                      value={ordonnanceCompleteFormRef.current.medecin_specialite}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: Cardiologie, Médecine générale"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro d'ordre *</label>
                    <input
                      type="text"
                      name="medecin_numero_ordre"
                      value={ordonnanceCompleteFormRef.current.medecin_numero_ordre}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ex: 12345"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Configuration des notifications */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Configuration des Notifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                    <select
                      name="priorite"
                      value={ordonnanceCompleteFormRef.current.priorite}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="basse">Basse</option>
                      <option value="normale">Normale</option>
                      <option value="haute">Haute</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Canal de notification</label>
                    <select
                      name="canal"
                      value={ordonnanceCompleteFormRef.current.canal}
                      onChange={handleOrdonnanceCompleteInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="application">Application</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="push">Push</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeOrdonnanceCompleteModal}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={uiState.loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uiState.loading}
                >
                  {uiState.loading ? 'Création...' : 'Créer l\'ordonnance complète'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour les détails de notification */}
      {modalState.showNotificationModal && selectedNotificationRef.current && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Détails de l'Ordonnance</h2>
              <button
                onClick={() => {
                  updateModalState({ showNotificationModal: false });
                  selectedNotificationRef.current = null;
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro d'ordonnance</label>
                  <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                    {selectedNotificationRef.current.numero_prescription || selectedNotificationRef.current.id}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                  <p className="text-sm text-gray-900">
                    {selectedNotificationRef.current.patient?.nom || 'Patient inconnu'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Médicament</label>
                  <p className="text-sm text-gray-900">
                    {selectedNotificationRef.current.principe_actif || 'Non spécifié'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                  <p className="text-sm text-gray-900">
                    {selectedNotificationRef.current.dosage || 'Non spécifié'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence</label>
                  <p className="text-sm text-gray-900">
                    {selectedNotificationRef.current.frequence || 'Non spécifiée'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de création</label>
                  <p className="text-sm text-gray-900">
                    {selectedNotificationRef.current.date_creation ? new Date(selectedNotificationRef.current.date_creation).toLocaleString('fr-FR') : 'Date inconnue'}
                  </p>
                </div>
              </div>

              {selectedNotificationRef.current.observations && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
                    {selectedNotificationRef.current.observations}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    updateModalState({ showNotificationModal: false });
                    selectedNotificationRef.current = null;
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Fermer
                </button>
              </div>
            </div>
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