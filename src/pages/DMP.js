import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaUser, FaFileMedical, FaShieldAlt,
  FaUpload, FaBell, FaQrcode, FaBook, FaChartBar,
  FaSignOutAlt, FaPlus, FaDownload,
  FaHeartbeat, FaPills, FaThermometerHalf, FaWeight,
  FaTint, FaPrint, FaUserShield, FaCheck, FaTimes,
  FaComments, FaCalendar, FaVideo, FaMicrophone
} from "react-icons/fa";

// Routes et protection
import { ProtectedPatientRoute } from "../services/api/protectedRoute";
import { logoutAll, getStoredPatient } from "../services/api/authApi";

// Hooks personnaliss
import { useDMP } from "../hooks/useDMP";
import { usePDFGenerator } from "../hooks/usePDFGenerator";
import { use2FA } from "../hooks/use2FA";
import { useNotifications } from "../hooks/useNotifications";

// Cache et utilitaires
import { withCache } from "../utils/requestCache";

// Composants DMP
import DMPDashboard from "../components/dmp/DMPDashboard";
import DMPMonEspaceSante from "../components/dmp/DMPMonEspaceSante";
import DMPNotification from "../components/ui/DMPNotification";
import AutorisationsEnAttente from "../components/dmp/AutorisationsEnAttente";
import DMPHistory from "../components/dmp/DMPHistory";
import NotificationManager from "../components/ui/NotificationManager";
import { MessagingButton, MessagingWidget, ChatMessage } from "../messaging";
import { signalingService } from "../messaging";
// ...existing code...

// APIs
import * as dmpApi from "../services/api/dmpApi";
import * as patientApi from "../services/api/patientApi";
import { uploadDocument, getDossierPatient, createDossierMedical, getAllDossiersMedical } from "../services/api/medicalApi";
import { getRendezVousByPatient } from "../services/api/rendezVous";

// Protection 2FA
import Validate2FA from "../components/2fa/Validate2FA";

// Fonctions utilitaires pour sécuriser l'affichage des données
const safeDisplay = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Oui' : 'No';
  if (Array.isArray(value)) return value.length > 0 ? `${value.length} élément(s)` : fallback;
  if (typeof value === 'object') {
    // Si c'est un objet avec des propriétés nom/prénom, les extraire
    if (value.nom || value.prenom) {
      return `${value.prenom || ''} ${value.nom || ''}`.trim() || fallback;
    }
    // Si c'est un objet avec une propriété nom, l'utiliser
    if (value.nom) return value.nom;
    // Si c'est un objet avec une propriété code, l'utiliser
    if (value.code) return value.code;
    // Sinon, retourner le fallback
    return fallback;
  }
  return fallback;
};

const safeProfessionalName = (professional, prefix = 'Dr.') => {
  if (!professional) return 'Professionnel non spécifié';
  if (typeof professional === 'string') return `${prefix} ${professional}`;
  if (typeof professional === 'object') {
    if (professional.nom_complet) return `${prefix} ${professional.nom_complet}`;
    if (professional.nom && professional.prenom) return `${prefix} ${professional.prenom} ${professional.nom}`;
    if (professional.nom) return `${prefix} ${professional.nom}`;
    if (professional.prenom) return `${prefix} ${professional.prenom}`;
    return 'Professionnel non spécifié';
  }
  return 'Professionnel non spécifié';
};



// Composant HistoriqueMedical qui utilise les fonctions de patientApi et dmpApi
const HistoriqueMedical = ({ patientProfile, onOpenMessaging }) => {
  // Fonction utilitaire pour sécuriser l'affichage des données
  const safeDisplay = (value, fallback = 'N/A', maxLength = null) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') {
      if (maxLength && value.length > maxLength) {
        return value.substring(0, maxLength) + '...';
      }
      return value;
    }
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (Array.isArray(value)) return value.length > 0 ? `${value.length} élément(s)` : fallback;
    if (typeof value === 'object') {
      // Si c'est un objet avec des propriétés nom/prénom, les extraire
      if (value.nom || value.prenom) {
        return `${value.prenom || ''} ${value.nom || ''}`.trim() || fallback;
      }
      // Si c'est un objet avec une propriété nom, l'utiliser
      if (value.nom) return value.nom;
      // Si c'est un objet avec une propriété code, l'utiliser
      if (value.code) return value.code;
      // Sinon, retourner le fallback
      return fallback;
    }
    return fallback;
  };

  const [prescriptions, setPrescriptions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [patientId, setPatientId] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPrescriptionsForPDF, setSelectedPrescriptionsForPDF] = useState([]);
  const [showPDFSelectionModal, setShowPDFSelectionModal] = useState(false);

  // États pour la récupération du dossier médical
  const [dossierMedical, setDossierMedical] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [errorDossier, setErrorDossier] = useState(null);
  const [showDossierSection, setShowDossierSection] = useState(false);

  // Hook pour la gnration de PDF
  const {
    isGenerating,
    downloadPrescriptionPDF,
    printPrescriptionPDF
  } = usePDFGenerator();

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Rcuprer l'ID du patient connect
      const storedPatient = getStoredPatient();
      const currentPatientId = storedPatient?.id_patient || storedPatient?.id;

      console.log('🔍 DEBUG - Patient ID dans loadPatientData:');
      console.log('  - storedPatient:', storedPatient);
      console.log('  - id_patient:', storedPatient?.id_patient);
      console.log('  - id:', storedPatient?.id);
      console.log('  - currentPatientId utilisé:', currentPatientId);

      if (!currentPatientId) {
        throw new Error('ID du patient non disponible');
      }

      setPatientId(currentPatientId);

      // Charger toutes les prescriptions du patient avec cache
      const result = await withCache(
        () => patientApi.getAllPrescriptionsByPatient(currentPatientId),
        `/prescription/patient/${currentPatientId}`,
        { patientId: currentPatientId },
        { useCache: true, forceRefresh: false }
      );

      if (result.success) {
        setPrescriptions(result.prescriptions || []);
        setStats(result.stats);
        console.log(' Historique médical chargé:', result.prescriptions.length, 'prescriptions');
        
        // Charger aussi les consultations du patient avec cache
        try {
          const consultationsResult = await withCache(
            () => dmpApi.getConsultationsHistoriqueMedical(currentPatientId),
            `/consultations/patient/${currentPatientId}`,
            { patientId: currentPatientId },
            { useCache: true, forceRefresh: false }
          );
          if (consultationsResult.status === 'success') {
            setConsultations(consultationsResult.data || []);
            console.log(' Consultations chargées:', consultationsResult.data.length, 'consultations');
          } else {
            console.warn(' Erreur lors du chargement des consultations:', consultationsResult.message);
            setConsultations([]);
          }
        } catch (consultationError) {
          console.warn(' Erreur lors du chargement des consultations:', consultationError);
          setConsultations([]);
        }
        
        //  DEBUG : Vrifier la structure des prescriptions et des infos mdecin
        if (result.prescriptions && result.prescriptions.length > 0) {
          console.log(' [DMP] Structure de la premire prescription:', result.prescriptions[0]);
          console.log(' [DMP] Proprits disponibles:', Object.keys(result.prescriptions[0]));
          
          // Vrifier les informations mdecin
          const firstPrescription = result.prescriptions[0];
          console.log(' [DMP] Informations mdecin:', {
            medecin: firstPrescription.medecin,
            redacteur: firstPrescription.redacteur,
            hasMedecin: !!firstPrescription.medecin,
            hasRedacteur: !!firstPrescription.redacteur,
            medecinKeys: firstPrescription.medecin ? Object.keys(firstPrescription.medecin) : [],
            redacteurKeys: firstPrescription.redacteur ? Object.keys(firstPrescription.redacteur) : []
          });
          
          // Vrifier les IDs disponibles
          if (firstPrescription.medecin) {
            console.log(' [DMP] ID mdecin disponibles:', {
              id: firstPrescription.medecin.id,
              id_professionnel: firstPrescription.medecin.id_professionnel,
              id_medecin: firstPrescription.medecin.id_medecin
            });
          }
          
          if (firstPrescription.redacteur) {
            console.log(' [DMP] ID rdacteur disponibles:', {
              id: firstPrescription.redacteur.id,
              id_professionnel: firstPrescription.redacteur.id_professionnel,
              id_medecin: firstPrescription.redacteur.id_medecin
            });
          }
          
          //  CORRECTION : Normaliser les informations mdecin pour la messagerie
          const normalizedPrescriptions = result.prescriptions.map(prescription => {
            let medecinInfo = null;
            
            // Identifiant de la prescription (priorit aux diffrents formats possibles)
            const prescriptionId = prescription.id_prescription || prescription.id || 
prescription.prescription_id;
            
            //  DEBUG : Afficher toutes les proprits disponibles pour le mdecin
            console.log(' [DMP] Proprits mdecin disponibles pour prescription', 
prescriptionId, ':', {
              medecin: prescription.medecin,
              redacteur: prescription.redacteur,
              medecin_id: prescription.medecin_id,
              redacteur_id: prescription.redacteur_id,
              prescripteur_id: prescription.prescripteur_id,
              medecin_prescripteur: prescription.medecin_prescripteur,
              // Vrifier toutes les proprits qui pourraient contenir l'ID du mdecin
              allKeys: Object.keys(prescription).filter(key => 
                key.toLowerCase().includes('medecin') || 
                key.toLowerCase().includes('redacteur') || 
                key.toLowerCase().includes('prescripteur')
              )
            });
            
            // Priorit 1: Utiliser prescription.medecin (structure complte)
            if (prescription.medecin && (prescription.medecin.id || 
prescription.medecin.id_professionnel || prescription.medecin.id_medecin)) {
              const medecinId = prescription.medecin.id || prescription.medecin.id_professionnel || 
prescription.medecin.id_medecin;
              medecinInfo = {
                id: medecinId,
                id_professionnel: medecinId,
                id_medecin: medecinId,
                nom: prescription.medecin.nom || 'Mdecin',
                prenom: prescription.medecin.prenom || 'Inconnu',
                specialite: prescription.medecin.specialite || 'Gnraliste',
                prescriptionId: prescriptionId,
                prescriptionType: prescription.type_prescription || 'ordonnance'
              };
              console.log(' [DMP] Mdecin trouv via prescription.medecin:', medecinInfo);
            }
            // Priorit 2: Utiliser prescription.redacteur (structure complte)
            else if (prescription.redacteur && (prescription.redacteur.id || 
prescription.redacteur.id_professionnel || prescription.redacteur.id_medecin)) {
              const medecinId = prescription.redacteur.id || prescription.redacteur.id_professionnel 
|| prescription.redacteur.id_medecin;
              medecinInfo = {
                id: medecinId,
                id_professionnel: medecinId,
                id_medecin: medecinId,
                nom: prescription.redacteur.nom || 'Mdecin',
                prenom: prescription.redacteur.prenom || 'Inconnu',
                specialite: prescription.redacteur.specialite || 'Gnraliste',
                prescriptionId: prescriptionId,
                prescriptionType: prescription.type_prescription || 'ordonnance'
              };
              console.log(' [DMP] Mdecin trouv via prescription.redacteur:', medecinInfo);
            }
            // Priorit 3: Utiliser prescription.medecin_id (ID simple)
            else if (prescription.medecin_id) {
              medecinInfo = {
                id: prescription.medecin_id,
                id_professionnel: prescription.medecin_id,
                id_medecin: prescription.medecin_id,
                nom: 'Mdecin',
                prenom: 'Prescripteur',
                specialite: 'Gnraliste',
                prescriptionId: prescriptionId,
                prescriptionType: prescription.type_prescription || 'ordonnance'
              };
              console.log(' [DMP] Mdecin trouv via prescription.medecin_id:', medecinInfo);
            }
            // Priorit 4: Utiliser prescription.redacteur_id (ID simple)
            else if (prescription.redacteur_id) {
              medecinInfo = {
                id: prescription.redacteur_id,
                id_professionnel: prescription.redacteur_id,
                id_medecin: prescription.redacteur_id,
                nom: 'Mdecin',
                prenom: 'Rdacteur',
                specialite: 'Gnraliste',
                prescriptionId: prescriptionId,
                prescriptionType: prescription.type_prescription || 'ordonnance'
              };
              console.log(' [DMP] Mdecin trouv via prescription.redacteur_id:', medecinInfo);
            }
            // Priorit 5: Utiliser prescription.prescripteur_id (ID simple)
            else if (prescription.prescripteur_id) {
              medecinInfo = {
                id: prescription.prescripteur_id,
                id_professionnel: prescription.prescripteur_id,
                id_medecin: prescription.prescripteur_id,
                nom: 'Mdecin',
                prenom: 'Prescripteur',
                specialite: 'Gnraliste',
                prescriptionId: prescriptionId,
                prescriptionType: prescription.type_prescription || 'ordonnance'
              };
              console.log(' [DMP] Mdecin trouv via prescription.prescripteur_id:', medecinInfo);
            }
            // Priorit 6: Rechercher dans toutes les proprits qui pourraient contenir l'ID du mdecin
            else {
              const possibleMedecinKeys = Object.keys(prescription).filter(key => 
                key.toLowerCase().includes('medecin') && 
                prescription[key] && 
                (typeof prescription[key] === 'number' || (typeof prescription[key] === 'string' && 
!isNaN(prescription[key])))
              );
              
              if (possibleMedecinKeys.length > 0) {
                const medecinId = prescription[possibleMedecinKeys[0]];
                medecinInfo = {
                  id: medecinId,
                  id_professionnel: medecinId,
                  id_medecin: medecinId,
                  nom: 'Mdecin',
                  prenom: 'Prescripteur',
                  specialite: 'Gnraliste',
                  prescriptionId: prescriptionId,
                  prescriptionType: prescription.type_prescription || 'ordonnance'
                };
                console.log(' [DMP] Mdecin trouv via proprit alternative:', possibleMedecinKeys[0], medecinInfo);
              } else {
                console.warn(' [DMP] Aucune information mdecin trouve pour la prescription:', prescriptionId);
              }
            }
            
            // Créer une structure normalisée pour le rédacteur
            let redacteurInfo = null;
            if (prescription.redacteur && typeof prescription.redacteur === 'object') {
              redacteurInfo = {
                id: prescription.redacteur.id || prescription.redacteur.id_professionnel || prescription.redacteur.id_medecin,
                nom: prescription.redacteur.nom || 'Rédacteur',
                prenom: prescription.redacteur.prenom || 'Inconnu',
                nom_complet: prescription.redacteur.nom_complet || `${prescription.redacteur.prenom || ''} ${prescription.redacteur.nom || ''}`.trim() || 'N/A',
                specialite: prescription.redacteur.specialite || 'Généraliste',
                numero_adeli: prescription.redacteur.numero_adeli || null
              };
            }
            
            return {
              ...prescription,
              medecinInfo: medecinInfo,
              redacteurInfo: redacteurInfo
            };
          });
          
          setPrescriptions(normalizedPrescriptions);
          console.log(' Prescriptions normalises avec informations mdecin:', normalizedPrescriptions.length);
          
          // Vrifier qu'au moins une prescription a des informations mdecin
          const prescriptionsWithMedecin = normalizedPrescriptions.filter(p => p.medecinInfo);
          if (prescriptionsWithMedecin.length === 0) {
            console.warn(' [DMP] Aucune prescription avec informations mdecin trouve');
            console.warn(' [DMP] Cela peut empcher la messagerie de fonctionner correctement');
            
            // Note: Fallback API non disponible - messagingApi.js n'existe pas
            console.log(' [DMP] Fallback API non disponible - messagingApi.js manquant');
          } else {
            console.log(' [DMP] Prescriptions avec mdecin:', prescriptionsWithMedecin.length, 
'/', normalizedPrescriptions.length);
            
            // Vrifier que les prescriptions ont bien tous les lments ncessaires
            prescriptionsWithMedecin.forEach((prescription, index) => {
              const validation = {
                prescriptionId: !!prescription.medecinInfo.prescriptionId,
                medecinId: !!prescription.medecinInfo.id,
                prescriptionType: !!prescription.medecinInfo.prescriptionType,
                complete: !!(prescription.medecinInfo.prescriptionId && prescription.medecinInfo.id 
&& prescription.medecinInfo.prescriptionType)
              };
              
              if (validation.complete) {
                console.log(` [DMP] Prescription ${index + 1} complte:`, {
                  prescriptionId: prescription.medecinInfo.prescriptionId,
                  medecinId: prescription.medecinInfo.id,
                  type: prescription.medecinInfo.prescriptionType
                });
              } else {
                console.warn(` [DMP] Prescription ${index + 1} incomplte:`, validation);
              }
            });
          }
        }

      } else {
        throw new Error(result.message || 'Erreur lors du chargement des prescriptions');
      }

    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique médical:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour nettoyer les données du dossier médical
  const clearDossierData = useCallback(() => {
    setDossierMedical(null);
    setShowDossierSection(false);
    setErrorDossier(null);
  }, []);

  // Fonction pour récupérer le dossier médical du patient
  const loadDossierMedical = useCallback(async () => {
    if (!patientId || !patientProfile) {
      console.warn('⚠️ Tentative de chargement du dossier médical sans patientId ou profil');
      console.log('🔍 patientId:', patientId);
      console.log('🔍 patientProfile:', patientProfile);
      return;
    }

    setLoadingDossier(true);
    setErrorDossier(null);

    try {
      console.log('🔍 Chargement du dossier médical pour le patient:', patientId);
      console.log('🔍 patientProfile reçu:', patientProfile);
      console.log('🔍 Type de patientId:', typeof patientId);
      console.log('🔍 patientId converti en string:', String(patientId));
      
      // Essayer avec différents formats d'ID
      let dossierData = null;
      const possibleIds = [
        patientId,
        String(patientId),
        parseInt(patientId),
        patientProfile?.id_patient,
        patientProfile?.id
      ].filter((id, index, arr) => id != null && arr.indexOf(id) === index); // Supprimer les doublons
      
      console.log('🔍 IDs possibles à tester:', possibleIds);
      
      for (const testId of possibleIds) {
        try {
          console.log(`🔍 Test avec ID: ${testId} (type: ${typeof testId})`);
          
          // Utiliser le cache pour éviter les requêtes répétitives
          dossierData = await withCache(
            () => getDossierPatient(testId),
            `/dossierMedical/patient/${testId}/complet`,
            { patientId: testId },
            { useCache: true, forceRefresh: false }
          );
          
          // Vérifier si on a des données valides
          if (dossierData && dossierData.data && dossierData.data.dossier) {
            console.log(`✅ Dossier trouvé avec ID: ${testId} (format data.dossier)`);
            break;
          } else if (dossierData && dossierData.success && dossierData.data && dossierData.data.id) {
            console.log(`✅ Dossier trouvé avec ID: ${testId} (format data.id)`);
            break;
          } else if (dossierData && dossierData.status === 'success' && dossierData.data && dossierData.data.id_dossier) {
            console.log(`✅ Dossier trouvé avec ID: ${testId} (format data.id_dossier)`);
            break;
          } else if (dossierData && dossierData.status === 'success' && dossierData.data) {
            console.log(`✅ Dossier trouvé avec ID: ${testId} (format data direct)`);
            break;
          } else {
            console.log(`❌ Aucun dossier trouvé avec ID: ${testId}`);
            console.log(`🔍 Structure reçue:`, dossierData);
            dossierData = null;
          }
        } catch (error) {
          console.log(`❌ Erreur avec ID ${testId}:`, error.message);
          // En cas d'erreur 429, on continue avec le prochain ID
          if (error.response?.status === 429) {
            console.log(`⏸️ Rate limit atteint pour ID ${testId}, passage au suivant`);
          }
          dossierData = null;
        }
      }
      
      if (!dossierData) {
        console.log('❌ Aucun dossier trouvé avec aucun des IDs testés');
        console.log('🔍 Tentative alternative: récupérer tous les dossiers et filtrer...');
        
        // Alternative: récupérer tous les dossiers et filtrer par patient
        try {
          const allDossiers = await getAllDossiersMedical();
          console.log('🔍 Tous les dossiers récupérés:', allDossiers);
          
          if (allDossiers && allDossiers.data && Array.isArray(allDossiers.data)) {
            console.log('🔍 Structure détaillée des dossiers:');
            allDossiers.data.forEach((dossier, index) => {
              console.log(`  Dossier ${index + 1}:`, {
                id_dossier: dossier.id_dossier,
                id: dossier.id,
                patient_id: dossier.patient_id,
                id_patient: dossier.id_patient,
                patient: dossier.patient,
                allKeys: Object.keys(dossier)
              });
            });
            
            // Essayer plusieurs stratégies de filtrage
            const patientDossiers = allDossiers.data.filter(dossier => {
              // Stratégie 1: patient_id direct
              if (dossier.patient_id === patientId || dossier.patient_id === String(patientId) || dossier.patient_id === parseInt(patientId)) {
                console.log('✅ Dossier trouvé via patient_id:', dossier);
                return true;
              }
              
              // Stratégie 2: id_patient
              if (dossier.id_patient === patientId || dossier.id_patient === String(patientId) || dossier.id_patient === parseInt(patientId)) {
                console.log('✅ Dossier trouvé via id_patient:', dossier);
                return true;
              }
              
              // Stratégie 3: id_dossier correspond à patientId (si c'est le même ID)
              if (dossier.id_dossier === patientId || dossier.id_dossier === String(patientId) || dossier.id_dossier === parseInt(patientId)) {
                console.log('✅ Dossier trouvé via id_dossier correspondant:', dossier);
                return true;
              }
              
              // Stratégie 4: patient.id_patient
              if (dossier.patient && (dossier.patient.id_patient === patientId || dossier.patient.id === patientId)) {
                console.log('✅ Dossier trouvé via patient.id_patient:', dossier);
                return true;
              }
              
              return false;
            });
            
            console.log('🔍 Dossiers filtrés pour ce patient:', patientDossiers);
            
            if (patientDossiers.length > 0) {
              // Prendre le premier dossier trouvé
              const foundDossier = patientDossiers[0];
              console.log('✅ Dossier trouvé via getAllDossiersMedical:', foundDossier);
              
              // ✅ CORRECTION : Enrichir le dossier avec les informations du patient connecté
              const enrichedDossier = {
                ...foundDossier,
                patient_name: patientProfile ? `${patientProfile.prenom || ''} ${patientProfile.nom || ''}`.trim() : 'Patient inconnu',
                patient_info: patientProfile,
                // S'assurer que le numéro de dossier est correct
                numeroDossier: foundDossier.numeroDossier || `DOSSIER-${(foundDossier.id_dossier || foundDossier.id).toString().padStart(6, '0')}`
              };
              
              // Reconstituer le format attendu
              dossierData = {
                status: 'success',
                data: {
                  dossier: enrichedDossier,
                  prescriptions_actives: [],
                  examens_recents: [],
                  consultations_recentes: [],
                  demandes_en_attente: [],
                  resultats_anormaux: [],
                  resume: {
                    nombre_prescriptions_actives: 0,
                    nombre_examens_recents: 0,
                    nombre_consultations_recentes: 0,
                    nombre_demandes_en_attente: 0,
                    nombre_resultats_anormaux: 0
                  }
                }
              };
            } else {
              console.log('⚠️ Aucun dossier trouvé avec les stratégies de filtrage');
              console.log('🔍 Tentative de création d\'un nouveau dossier pour ce patient...');
              
              // Créer un nouveau dossier pour ce patient
              try {
                const newDossier = await createDossierMedical({
                  patient_id: patientId,
                  statut: 'actif',
                  dateOuverture: new Date().toISOString().split('T')[0],
                  resume_medical: 'Dossier médical créé automatiquement',
                  antecedents_medicaux: '',
                  allergies: '',
                  traitement: '',
                  signes_vitaux: '',
                  histoire_familiale: '',
                  observations: '',
                  directives_anticipees: ''
                });
                
                console.log('✅ Nouveau dossier créé:', newDossier);
                
                // Reconstituer le format attendu avec le nouveau dossier
                dossierData = {
                  status: 'success',
                  data: {
                    dossier: newDossier.data || newDossier,
                    prescriptions_actives: [],
                    examens_recents: [],
                    consultations_recentes: [],
                    demandes_en_attente: [],
                    resultats_anormaux: [],
                    resume: {
                      nombre_prescriptions_actives: 0,
                      nombre_examens_recents: 0,
                      nombre_consultations_recentes: 0,
                      nombre_demandes_en_attente: 0,
                      nombre_resultats_anormaux: 0
                    }
                  }
                };
              } catch (createError) {
                console.log('❌ Erreur lors de la création du dossier:', createError);
              }
            }
          }
        } catch (altError) {
          console.log('❌ Erreur lors de la récupération alternative:', altError);
        }
        
        if (!dossierData) {
          throw new Error('Aucun dossier médical trouvé pour ce patient');
        }
      }
      
      console.log('📋 Dossier médical récupéré (brut):', dossierData);
      console.log('🔍 Structure des données:', {
        hasStatus: !!dossierData?.status,
        hasData: !!dossierData?.data,
        hasDataData: !!dossierData?.data?.data,
        hasDataDataDossier: !!dossierData?.data?.data?.dossier,
        hasDataDossier: !!dossierData?.data?.dossier,
        status: dossierData?.status,
        dataKeys: dossierData?.data ? Object.keys(dossierData.data) : 'Pas de data',
        dataDataKeys: dossierData?.data?.data ? Object.keys(dossierData.data.data) : 'Pas de data.data'
      });
      
      // AFFICHAGE COMPLET DU CONTENU AVANT CHARGEMENT
      console.log('🔍 ===== CONTENU COMPLET DU DOSSIER AVANT CHARGEMENT =====');
      console.log('📄 Données complètes:', JSON.stringify(dossierData, null, 2));
      
      if (dossierData?.data) {
        console.log('📄 Données dans data:', JSON.stringify(dossierData.data, null, 2));
        
        if (dossierData.data.dossier) {
          console.log('📄 Dossier dans data.dossier:', JSON.stringify(dossierData.data.dossier, null, 2));
        }
        
        if (dossierData.data.data) {
          console.log('📄 Données dans data.data:', JSON.stringify(dossierData.data.data, null, 2));
          
          if (dossierData.data.data.dossier) {
            console.log('📄 Dossier dans data.data.dossier:', JSON.stringify(dossierData.data.data.dossier, null, 2));
          }
        }
      }
      console.log('🔍 ===== FIN DU CONTENU COMPLET =====');
      
      // Gérer différents formats de réponse possibles
      let dossierInfo = null;
      
      if (dossierData && dossierData.status === 'success' && dossierData.data && dossierData.data.data && dossierData.data.data.dossier) {
        // Format reçu : { status: "success", data: { data: { dossier: {...} } } }
        dossierInfo = dossierData.data.data.dossier;
        console.log('✅ Format détecté: structure double imbriquée avec data.data.dossier');
      } else if (dossierData && dossierData.status === 'success' && dossierData.data && dossierData.data.dossier) {
        // Format reçu : { status: "success", data: { dossier: {...} } }
        dossierInfo = dossierData.data.dossier;
        console.log('✅ Format détecté: structure avec dossier imbriqué');
      } else if (dossierData && dossierData.success && dossierData.data) {
        // Format standard avec success et data
        dossierInfo = dossierData.data;
        console.log('✅ Format détecté: structure avec success et data');
      } else if (dossierData && dossierData.data) {
        // Format avec data directement
        dossierInfo = dossierData.data;
        console.log('✅ Format détecté: structure avec data direct');
      } else if (dossierData && dossierData.id) {
        // Format avec données directement dans l'objet
        dossierInfo = dossierData;
        console.log('✅ Format détecté: structure directe');
      } else if (Array.isArray(dossierData) && dossierData.length > 0) {
        // Format tableau, prendre le premier élément
        dossierInfo = dossierData[0];
        console.log('✅ Format détecté: structure tableau');
      }
      
      if (dossierInfo) {
        console.log('🔍 Données brutes du dossier avant normalisation:', dossierInfo);
        console.log('🔍 Clés disponibles dans dossierInfo:', Object.keys(dossierInfo));
        
        // Normaliser les données pour l'affichage
        const normalizedDossier = {
          // ID et numéro de dossier
          id: dossierInfo.id_dossier || dossierInfo.id || dossierInfo.numeroDossier,
          numeroDossier: dossierInfo.numeroDossier || dossierInfo.id_dossier || dossierInfo.id,
          
          // Statut et dates
          statut: dossierInfo.statut || 'Non défini',
          date_ouverture: dossierInfo.dateCreation || dossierInfo.date_ouverture || dossierInfo.createdAt,
          
          // Informations médicales (gérer les différents noms de propriétés)
          resume_medical: dossierInfo.resume || dossierInfo.resume_medical || dossierInfo.resume_medical || 'Aucun résumé disponible',
          antecedents_medicaux: Array.isArray(dossierInfo.antecedent_medicaux) 
            ? dossierInfo.antecedent_medicaux.join(', ') 
            : dossierInfo.antecedent_medicaux || dossierInfo.antecedents_medicaux || dossierInfo.antecedents 
              ? String(dossierInfo.antecedent_medicaux || dossierInfo.antecedents_medicaux || dossierInfo.antecedents)
              : 'Aucun antécédent connu',
          allergies: Array.isArray(dossierInfo.allergies) 
            ? dossierInfo.allergies.join(', ') 
            : dossierInfo.allergies 
              ? String(dossierInfo.allergies)
              : 'Aucune allergie connue',
          traitement: dossierInfo.traitements_chroniques || dossierInfo.traitement || dossierInfo.traitements || 'Aucun traitement en cours',
          
          // Signes vitaux
          signes_vitaux: dossierInfo.heart_rate || dossierInfo.blood_pressure || dossierInfo.temperature ? 
            `FC: ${dossierInfo.heart_rate || 'N/A'}, TA: ${dossierInfo.blood_pressure || 'N/A'}, Temp: ${dossierInfo.temperature || 'N/A'}°C` : 
            'Normaux',
          
          // Autres informations
          histoire_familiale: dossierInfo.historique_familial || dossierInfo.histoire_familiale || 'Non documentée',
          observations: dossierInfo.observations || 'Aucune observation particulière',
          
          // ✅ CORRECTION : Ajouter les informations du patient connecté
          patient_name: patientProfile ? `${patientProfile.prenom || ''} ${patientProfile.nom || ''}`.trim() : 'Patient inconnu',
          patient_info: patientProfile,
          
          // Informations sur le médecin traitant
          medecin: dossierInfo.medecinReferent || dossierInfo.medecin || dossierInfo.medecin_traitant || dossierInfo.professionnel,
          
          // Données brutes pour debug
          rawData: dossierInfo
        };
        
        console.log('📋 Dossier normalisé:', normalizedDossier);
        console.log('🔍 ===== CONTENU NORMALISÉ AVANT AFFICHAGE =====');
        console.log('📄 Dossier normalisé complet:', JSON.stringify(normalizedDossier, null, 2));
        console.log('🔍 Vérification des champs normalisés:');
        console.log('  - resume_medical:', normalizedDossier.resume_medical);
        console.log('  - antecedents_medicaux:', normalizedDossier.antecedents_medicaux);
        console.log('  - allergies:', normalizedDossier.allergies);
        console.log('  - traitement:', normalizedDossier.traitement);
        console.log('  - signes_vitaux:', normalizedDossier.signes_vitaux);
        console.log('  - histoire_familiale:', normalizedDossier.histoire_familiale);
        console.log('  - observations:', normalizedDossier.observations);
        console.log('🔍 ===== FIN DU CONTENU NORMALISÉ =====');
        
        // Utiliser uniquement les données réelles du serveur
        console.log('📋 Utilisation des données réelles du serveur uniquement');
        
        setDossierMedical(normalizedDossier);
        setShowDossierSection(true);
        console.log('✅ Dossier médical chargé avec succès');
      } else {
        console.log('⚠️ Aucun dossier médical trouvé, tentative de création...');
        // Essayer de créer un dossier médical pour le patient
        try {
          const newDossier = await createDossierMedical({
            patient_id: patientId,
            statut: 'actif',
            resume_medical: 'Dossier médical créé automatiquement',
            antecedents_medicaux: 'Aucun antécédent connu',
            allergies: 'Aucune allergie connue',
            traitement: 'Aucun traitement en cours',
            signes_vitaux: 'Normaux',
            histoire_familiale: 'Non documentée',
            observations: 'Patient en bonne santé générale'
          });
          
          console.log('✅ Nouveau dossier médical créé:', newDossier);
          
          // Recharger le dossier après création
          const updatedDossierData = await withCache(
            () => getDossierPatient(patientId),
            `/dossierMedical/patient/${patientId}/complet`,
            { patientId },
            { useCache: true, forceRefresh: true } // Force refresh car on vient de créer le dossier
          );
          if (updatedDossierData && updatedDossierData.success && updatedDossierData.data) {
            const normalizedDossier = {
              ...updatedDossierData.data,
              patient: patientProfile,
              patient_name: `${patientProfile.prenom || ''} ${patientProfile.nom || ''}`.trim() || 'Patient inconnu'
            };
            
            console.log('📋 Dossier créé et normalisé:', normalizedDossier);
            setDossierMedical(normalizedDossier);
            setShowDossierSection(true);
            console.log('✅ Dossier médical créé et chargé avec succès');
          }
        } catch (createError) {
          console.error('❌ Erreur lors de la création du dossier médical:', createError);
          throw new Error('Aucun dossier médical trouvé et impossible d\'en créer un');
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement du dossier médical:', error);
      
      // Gérer les erreurs spécifiques
      let errorMessage = 'Impossible de charger le dossier médical';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Aucun dossier médical trouvé pour ce patient';
        } else if (error.response.status === 403) {
          errorMessage = 'Accès non autorisé au dossier médical';
        } else if (error.response.status === 500) {
          errorMessage = 'Erreur serveur lors de la récupération du dossier';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrorDossier(errorMessage);
      setDossierMedical(null);
    } finally {
      setLoadingDossier(false);
    }
  }, [patientId, patientProfile]);

  // Effet pour charger le dossier médical quand le patientId est disponible
  useEffect(() => {
    if (patientId && patientProfile) {
      loadDossierMedical();
    }
  }, [patientId, patientProfile, loadDossierMedical]);

  // Fonction pour recharger le dossier médical
  const handleRefreshDossier = useCallback(() => {
    console.log('Rechargement forcé du dossier médical');
    clearDossierData();
    loadDossierMedical();
  }, [clearDossierData, loadDossierMedical]);

  // Fonction pour nettoyer les erreurs du dossier médical
  const clearDossierError = useCallback(() => {
    setErrorDossier(null);
  }, []);

  const handleFilterChange = async (filter) => {
    try {
      setLoading(true);
      setActiveFilter(filter);

      let result;
      let consultationsResult;
      
      switch (filter) {
        case 'all':
          result = await withCache(
            () => patientApi.getAllPrescriptionsByPatient(patientId),
            `/prescription/patient/${patientId}/all`,
            { patientId, filter },
            { useCache: true, forceRefresh: false }
          );
          consultationsResult = await withCache(
            () => dmpApi.getConsultationsHistoriqueMedical(patientId),
            `/consultations/patient/${patientId}`,
            { patientId, filter },
            { useCache: true, forceRefresh: false }
          );
          break;
        case 'active':
          result = await withCache(
            () => patientApi.getActivePrescriptionsByPatient(patientId),
            `/prescription/patient/${patientId}/active`,
            { patientId, filter },
            { useCache: true, forceRefresh: false }
          );
          consultationsResult = await withCache(
            () => dmpApi.getConsultationsHistoriqueMedical(patientId),
            `/consultations/patient/${patientId}`,
            { patientId, filter },
            { useCache: true, forceRefresh: false }
          );
          break;
        case 'ordonnances':
          result = await withCache(
            () => patientApi.getOrdonnancesByPatient(patientId),
            `/prescription/patient/${patientId}/ordonnances`,
            { patientId, filter },
            { useCache: true, forceRefresh: false }
          );
          consultationsResult = { data: [] }; // Pas de consultations pour les ordonnances
          break;
        case 'examens':
          result = await withCache(
            () => patientApi.getExamensByPatient(patientId),
            `/prescription/patient/${patientId}/examens`,
            { patientId, filter },
            { useCache: true, forceRefresh: false }
          );
          consultationsResult = { data: [] }; // Pas de consultations pour les examens
          break;
        case 'consultations':
          result = { success: true, prescriptions: [], stats: null };
          consultationsResult = await withCache(
            () => dmpApi.getConsultationsHistoriqueMedical(patientId),
            `/consultations/patient/${patientId}`,
            { patientId, filter },
            { useCache: true, forceRefresh: false }
          );
          break;
        default:
          result = await withCache(
            () => patientApi.getAllPrescriptionsByPatient(patientId),
            `/prescription/patient/${patientId}/default`,
            { patientId, filter },
            { useCache: true, forceRefresh: false }
          );
          consultationsResult = await withCache(
            () => dmpApi.getConsultationsHistoriqueMedical(patientId),
            `/consultations/patient/${patientId}`,
            { patientId, filter },
            { useCache: true, forceRefresh: false }
          );
      }

      if (result.success) {
        setPrescriptions(result.prescriptions || []);
        setStats(result.stats);
      } else {
        throw new Error(result.message || 'Erreur lors du filtrage');
      }
      
      // Mettre à jour les consultations
      if (consultationsResult && consultationsResult.status === 'success') {
        setConsultations(consultationsResult.data || []);
      } else {
        setConsultations([]);
      }

    } catch (error) {
      console.error('Erreur lors du filtrage:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {return 'Date non disponible'};
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };



  const getStatusColor = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'terminee':
        return 'bg-blue-100 text-blue-800';
      case 'annulee':
        return 'bg-red-100 text-red-800';
      case 'en_cours':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'ordonnance':
        return <FaPills className="text-blue-600" />;
      case 'examen':
        return <FaFileMedical className="text-green-600" />;
      case 'consultation':
        return <FaUser className="text-purple-600" />;
      default:
        return <FaFileMedical className="text-gray-600" />;
    }
  };

  const handlePrescriptionClick = (prescription) => {
    setSelectedPrescription(prescription);
    setShowPrescriptionModal(true);
  };

  const closePrescriptionModal = () => {
    setShowPrescriptionModal(false);
    setSelectedPrescription(null);
  };

  const togglePrescriptionSelection = (prescription) => {
    setSelectedPrescriptionsForPDF(prev => {
      const isSelected = prev.find(p => p.id_prescription === prescription.id_prescription);
      if (isSelected) {
        return prev.filter(p => p.id_prescription !== prescription.id_prescription);
      } else {
        return [...prev, prescription];
      }
    });
  };

  const openPDFSelectionModal = () => {
    if (selectedPrescriptionsForPDF.length === 0) {
      alert('Veuillez slectionner au moins une prescription pour gnrer le PDF');
      return;
    }
    setShowPDFSelectionModal(true);
  };

  const closePDFSelectionModal = () => {
    setShowPDFSelectionModal(false);
    setSelectedPrescriptionsForPDF([]);
  };

  // Fonctions pour la gnration de PDF
  const handleGeneratePrescriptionPDF = async (prescription) => {
    try {
      setLoading(true);
      await downloadPrescriptionPDF(prescription);
      alert('PDF tlcharg avec succs !');
    } catch (error) {
      console.error('Erreur lors de la gnration du PDF:', error);
      alert('Erreur lors de la gnration du PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPrescriptionPDF = async (prescription) => {
    try {
      setLoading(true);
      await printPrescriptionPDF(prescription);
      alert('Impression lance avec succs !');
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      alert('Erreur lors de l\'impression: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMultiplePrescriptionsPDF = async () => {
    try {
      if (selectedPrescriptionsForPDF.length === 1) {
        // Une seule prescription, utiliser la fonction existante
        await downloadPrescriptionPDF(selectedPrescriptionsForPDF[0]);
      } else {
        // Plusieurs prescriptions, gnrer un PDF combin
        // Pour l'instant, on gnre un PDF par prescription
        for (const prescription of selectedPrescriptionsForPDF) {
          await downloadPrescriptionPDF(prescription);
        }
      }
      closePDFSelectionModal();
    } catch (error) {
      console.error('Erreur lors de la gnration du PDF:', error);
      alert('Erreur lors de la gnration du PDF');
    }
  };

  const handlePrintMultiplePrescriptionsPDF = async () => {
    try {
      if (selectedPrescriptionsForPDF.length === 1) {
        // Une seule prescription, utiliser la fonction existante
        await printPrescriptionPDF(selectedPrescriptionsForPDF[0]);
      } else {
        // Plusieurs prescriptions, imprimer un PDF par prescription
        for (const prescription of selectedPrescriptionsForPDF) {
          await printPrescriptionPDF(prescription);
        }
      }
      closePDFSelectionModal();
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      alert('Erreur lors de l\'impression');
    }
  };

  const handleGenerateMedicalHistoryPDF = async () => {
    try {
      alert('Fonctionnalit d\'historique mdical PDF en cours de dveloppement');
    } catch (error) {
      console.error('Erreur lors de la gnration de l\'historique PDF:', error);
      alert('Erreur lors de la gnration de l\'historique PDF');
    }
  };

  const handlePrintMedicalHistoryPDF = async () => {
    try {
      alert('Fonctionnalit d\'impression d\'historique mdical PDF en cours de dveloppement');
    } catch (error) {
      console.error('Erreur lors de l\'impression de l\'historique:', error);
      alert('Erreur lors de l\'impression de l\'historique');
    }
  };

  // Fermer le modal avec la touche Escape
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showPrescriptionModal) {
        closePrescriptionModal();
      }
    };

    if (showPrescriptionModal) {
      document.addEventListener('keydown', handleEscapeKey);
      // Empcher le scroll du body quand le modal est ouvert
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [showPrescriptionModal]);

        if (loading) {
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Historique médical</h2>
              <p className="text-gray-600">Consultez votre historique médical complet</p>
            </div>
        <div className="p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

        if (error) {
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Historique médical</h2>
              <p className="text-gray-600">Consultez votre historique médical complet</p>
            </div>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <FaFileMedical className="text-4xl mx-auto mb-2" />
              <p className="font-medium">Erreur lors du chargement</p>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadPatientData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ressayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Historique médical</h2>
            <p className="text-gray-600">Consultez votre historique médical complet</p>
            {stats && (
              <p className="text-sm text-gray-500 mt-1">
                {stats.totalPrescriptions} prescription(s) et {consultations.length} consultation(s) au total
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Statistiques rapides */}
            {stats && (
              <div className="flex flex-wrap gap-2">
                {stats.parType && Object.entries(stats.parType).map(([type, count]) => (
                  <span key={type} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs 
rounded-full">
                    {type}: {count}
                  </span>
                ))}
              </div>
            )}

            {/* Boutons PDF */}
            <div className="flex space-x-2">
              <button
                onClick={handleGenerateMedicalHistoryPDF}
                disabled={isGenerating || prescriptions.length === 0}
                className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium 
rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Gnrer l'historique mdical en PDF"
              >
                <FaDownload className="w-4 h-4 mr-2" />
                {isGenerating ? 'Gnration...' : 'PDF'}
              </button>
              <button
                onClick={handlePrintMedicalHistoryPDF}
                disabled={isGenerating || prescriptions.length === 0}
                className="flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium 
rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Imprimer l'historique mdical"
              >
                <FaPrint className="w-4 h-4 mr-2" />
                {isGenerating ? 'Prparation...' : 'Imprimer'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et slection PDF */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 
mb-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Toutes', count: prescriptions.length + consultations.length },
              { key: 'active', label: 'Actives', count: stats?.parStatut?.active || 0 },
              { key: 'ordonnances', label: 'Ordonnances', count: stats?.parType?.ordonnance || 0 },
              { key: 'examens', label: 'Examens', count: stats?.parType?.examen || 0 },
              { key: 'consultations', label: 'Consultations', count: consultations.length }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => handleFilterChange(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter 
=== filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
              >
                {filter.label}
                <span className="ml-2 bg-opacity-20 bg-black text-inherit px-2 py-1 rounded-full 
text-xs">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          {/* Boutons de slection PDF */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
            <span className="text-sm text-gray-600">Slectionner pour PDF :</span>
            <button
              onClick={() => setSelectedPrescriptionsForPDF(prescriptions)}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Tout slectionner
            </button>
            <button
              onClick={() => setSelectedPrescriptionsForPDF([])}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Dslectionner
            </button>
            {selectedPrescriptionsForPDF.length > 0 && (
              <button
                onClick={openPDFSelectionModal}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Gnrer PDF ({selectedPrescriptionsForPDF.length})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {(prescriptions.length > 0 || consultations.length > 0) ? (
          <div className="space-y-4">
            {/* Affichage des prescriptions */}
            {prescriptions.map((prescription, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow group 
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <div className="flex justify-between items-start">
                  {/* Checkbox de slection */}
                  <div className="flex items-center mr-3">
                    <input
                      type="checkbox"
                      checked={selectedPrescriptionsForPDF.some(p => p.id_prescription === 
prescription.id_prescription)}
                      onChange={(e) => {
                        e.stopPropagation();
                        togglePrescriptionSelection(prescription);
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                  <div className="flex-1">
                    {/* Zone cliquable pour les dtails - SPARE des actions */}
                    <div 
                      className="cursor-pointer hover:bg-blue-50 p-3 rounded-lg transition-colors"
                      onClick={() => handlePrescriptionClick(prescription)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePrescriptionClick(prescription);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Voir les dtails de la prescription 
${prescription.type_prescription} du ${formatDate(prescription.date_prescription)}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {getTypeIcon(prescription.type_prescription)}
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 
transition-colors">
                            {prescription.type_prescription === 'ordonnance' ? 'Ordonnance mdicale' 
:
                              prescription.type_prescription === 'examen' ? 'Demande d\'examen' :
                                prescription.type_prescription === 'consultation' ? 'Consultation' :
                                  prescription.type_prescription}
                            <span className="ml-2 text-blue-500 opacity-0 group-hover:opacity-100 
transition-opacity">
                              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" 
viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 
0-8.268-2.943-9.542-7z" />
                              </svg>
                            </span>
                            {/* Badge pour indiquer qu'il y a des dtails */}
                            {(prescription.nom_commercial || prescription.principe_actif || 
prescription.dosage || prescription.medicaments || prescription.examens) && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full 
text-xs font-medium bg-green-100 text-green-800">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" 
viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
d="M5 13l4 4L19 7" />
                                </svg>
                                Dtails
                              </span>
                            )}

                            {/* Badge pour indiquer qu'il y a un QR Code */}
                            {prescription.qrCode && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full 
text-xs font-medium bg-purple-100 text-purple-800">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" 
viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 
0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 
1z" />
                                </svg>
                                QR Code
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Prescrit le {formatDate(prescription.date_prescription)}
                          </p>
                          {prescription.prescriptionNumber && (
                            <p className="text-xs text-gray-500 font-mono">
                              N {prescription.prescriptionNumber}
                            </p>
                          )}
                          <p className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 
transition-opacity mt-1">
                            Cliquez pour voir les dtails
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {prescription.description && (
                      <p className="text-sm text-gray-700 mb-3">{prescription.description}</p>
                    )}

                    {/* Dtails spcifiques selon le type de prescription */}
                    {prescription.type_prescription === 'ordonnance' && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Dtails de 
l'ordonnance</h4>
                        {(prescription.nom_commercial || prescription.principe_actif || 
prescription.dosage || prescription.frequence || prescription.voie_administration || 
prescription.quantite || prescription.posologie || prescription.contre_indications || 
prescription.effets_indesirables) ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {prescription.nom_commercial && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Mdicament 
:</span>
                                  <span className="text-sm text-blue-900 
font-medium">{prescription.nom_commercial}</span>
                                </div>
                              )}
                              {prescription.principe_actif && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Principe actif 
:</span>
                                  <span className="text-sm 
text-blue-900">{prescription.principe_actif}</span>
                                </div>
                              )}
                              {prescription.dosage && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Dosage :</span>
                                  <span className="text-sm text-blue-900">{prescription.dosage}</span>
                                </div>
                              )}
                              {prescription.frequence && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Frquence 
:</span>
                                  <span className="text-sm 
text-blue-900">{prescription.frequence}</span>
                                </div>
                              )}
                              {prescription.voie_administration && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Voie :</span>
                                  <span className="text-sm 
text-blue-900">{prescription.voie_administration}</span>
                                </div>
                              )}
                              {prescription.quantite && prescription.unite && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Quantit 
:</span>
                                  <span className="text-sm text-blue-900">{prescription.quantite} 
{prescription.unite}</span>
                                </div>
                              )}

                              {prescription.forme_pharmaceutique && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Forme :</span>
                                  <span className="text-sm 
text-blue-900">{prescription.forme_pharmaceutique}</span>
                                </div>
                              )}

                              {prescription.code_cip && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Code CIP 
:</span>
                                  <span className="text-sm text-blue-900 
font-mono">{prescription.code_cip}</span>
                                </div>
                              )}

                              {prescription.atc && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Code ATC 
:</span>
                                  <span className="text-sm text-blue-900 
font-mono">{prescription.atc}</span>
                                </div>
                              )}
                            </div>
                            {prescription.posologie && (
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <span className="text-xs font-medium text-blue-700">Posologie :</span>
                                <span className="text-sm text-blue-900 
ml-2">{prescription.posologie}</span>
                              </div>
                            )}
                            {prescription.contre_indications && (
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <span className="text-xs font-medium text-red-700">Contre-indications 
:</span>
                                <span className="text-sm text-red-800 
ml-2">{prescription.contre_indications}</span>
                              </div>
                            )}
                            {prescription.effets_indesirables && (
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <span className="text-xs font-medium text-orange-700">Effets 
indsirables :</span>
                                <span className="text-sm text-orange-800 
ml-2">{prescription.effets_indesirables}</span>
                              </div>
                            )}

                            {/* QR Code et informations de traitement */}
                            {(prescription.qrCode || prescription.duree_traitement || 
prescription.renouvelable !== null) && (
                              <div className="mt-3 pt-3 border-t border-blue-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* QR Code */}
                                  {prescription.qrCode && (
                                    <div className="flex flex-col items-center">
                                      <span className="text-xs font-medium text-blue-700 mb-2">QR 
Code</span>
                                      <img
                                        src={prescription.qrCode}
                                        alt="QR Code de la prescription"
                                        className="w-20 h-20 border border-blue-300 rounded-lg"
                                        title="QR Code de la prescription"
                                      />
                                    </div>
                                  )}

                                  {/* Informations de traitement */}
                                  <div className="space-y-2">
                                    {prescription.duree_traitement && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-blue-700">Dure 
:</span>
                                        <span className="text-sm 
text-blue-900">{prescription.duree_traitement}</span>
                                      </div>
                                    )}
                                    {prescription.renouvelable !== null && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium 
text-blue-700">Renouvelable :</span>
                                        <span className={`text-xs px-2 py-1 rounded-full 
${prescription.renouvelable
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                          }`}>
                                          {prescription.renouvelable ? 'Oui' : 'Non'}
                                        </span>
                                      </div>
                                    )}
                                    {prescription.nb_renouvellements > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium 
text-blue-700">Renouvellements :</span>
                                        <span className="text-sm text-blue-900">
                                          
{prescription.renouvellements_effectues}/{prescription.nb_renouvellements}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-blue-600 italic">Aucun dtail spcifique 
disponible pour cette ordonnance</p>
                        )}
                      </div>
                    )}

                    {/* Mdicaments (pour les prescriptions avec structure medicaments) */}
                    {prescription.medicaments && prescription.medicaments.length > 0 ? (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">Mdicaments prescrits 
:</p>
                        <div className="space-y-2">
                          {prescription.medicaments.map((med, idx) => (
                            <div key={idx} className="p-2 bg-blue-50 rounded border border-blue-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-900">{med.nom}</span>
                                {med.quantite && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 
rounded-full">
                                    Qt: {med.quantite}
                                  </span>
                                )}
                              </div>
                              {med.posologie && (
                                <p className="text-xs text-blue-700 mt-1">
                                  <span className="font-medium">Posologie :</span> {med.posologie}
                                </p>
                              )}
                              {med.duree && (
                                <p className="text-xs text-blue-700 mt-1">
                                  <span className="font-medium">Dure :</span> {med.duree}
                                </p>
                              )}
                              {med.instructions && (
                                <p className="text-xs text-blue-600 mt-1 italic">
                                  {med.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : prescription.type_prescription === 'ordonnance' && (
                      <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs text-gray-500 italic">Aucun mdicament spcifique 
list</p>
                      </div>
                    )}

                    {/* Examens (pour les prescriptions avec structure examens) */}
                    {prescription.examens && prescription.examens.length > 0 ? (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">Examens demands :</p>
                        <div className="space-y-2">
                          {prescription.examens.map((exam, idx) => (
                            <div key={idx} className="p-2 bg-green-50 rounded border 
border-green-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-900">{exam.nom}</span>
                                {exam.urgence && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${exam.urgence === 
'urgent'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-green-100 text-green-800'
                                    }`}>
                                    {exam.urgence === 'urgent' ? 'URGENT' : exam.urgence}
                                  </span>
                                )}
                              </div>
                              {exam.type && (
                                <p className="text-xs text-green-700 mt-1">
                                  <span className="font-medium">Type :</span> {exam.type}
                                </p>
                              )}
                              {exam.instructions && (
                                <p className="text-xs text-green-600 mt-1 italic">
                                  {exam.instructions}
                                </p>
                              )}
                              {exam.preparation && (
                                <p className="text-xs text-green-600 mt-1">
                                  <span className="font-medium">Prparation :</span> 
{exam.preparation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : prescription.type_prescription === 'examen' && (
                      <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs text-gray-500 italic">Aucun examen spcifique 
list</p>
                      </div>
                    )}

                    {/* Informations complmentaires */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Premire colonne - Statut et dates */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">Statut :</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
${getStatusColor(prescription.statut)}`}>
                              {prescription.statut || 'Statut inconnu'}
                            </span>
                          </div>

                          {prescription.date_debut && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Dbut :</span>
                              <span className="text-xs 
text-gray-900">{formatDate(prescription.date_debut)}</span>
                            </div>
                          )}

                          {prescription.date_fin && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Fin :</span>
                              <span className="text-xs 
text-gray-900">{formatDate(prescription.date_fin)}</span>
                            </div>
                          )}

                          {prescription.date_arret && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Arrt :</span>
                              <span className="text-xs 
text-gray-900">{formatDate(prescription.date_arret)}</span>
                            </div>
                          )}
                        </div>

                        {/* Deuxime colonne - Mdecin et tablissement */}
                        <div className="space-y-2">
                          {prescription.medecinInfo && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Mdecin :</span>
                              <span className="text-xs text-gray-900">
                                Dr. {prescription.medecinInfo.prenom} {prescription.medecinInfo.nom}
                              </span>
                            </div>
                          )}

                          {prescription.redacteurInfo && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600">Rdacteur 
:</span>
                                <span className="text-xs text-gray-900">
                                  Dr. {prescription.redacteurInfo.nom_complet}
                                </span>
                              </div>
                              {prescription.redacteurInfo.specialite && (
                                <div className="flex items-center gap-2 ml-4">
                                  <span className="text-xs text-gray-500">Spcialit :</span>
                                  <span className="text-xs text-gray-700">{prescription.redacteurInfo.specialite}</span>
                                </div>
                              )}
                              {prescription.redacteurInfo.numero_adeli && (
                                <div className="flex items-center gap-2 ml-4">
                                  <span className="text-xs text-gray-500">N ADELI :</span>
                                  <span className="text-xs text-gray-700 font-mono">{prescription.redacteurInfo.numero_adeli}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {prescription.etablissement && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">tablissement 
:</span>
                              <span className="text-xs text-gray-900">{safeDisplay(prescription.etablissement, 'Établissement')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Informations supplmentaires */}
                      {(prescription.instructions_speciales || prescription.pharmacieDelivrance || 
prescription.signatureElectronique) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                          {prescription.instructions_speciales && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-medium text-gray-600">Instructions 
spciales :</span>
                              <span className="text-xs 
text-gray-900">{prescription.instructions_speciales}</span>
                            </div>
                          )}

                          {prescription.pharmacieDelivrance && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Pharmacie de 
dlivrance :</span>
                              <span className="text-xs 
text-gray-900">{prescription.pharmacieDelivrance}</span>
                            </div>
                          )}

                          {prescription.signatureElectronique && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Signature 
lectronique :</span>
                              <span className="text-xs text-gray-500 font-mono truncate">
                                {prescription.signatureElectronique.substring(0, 20)}...
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {/* Boutons d'action principaux */}
                    <div className="flex space-x-2">
                                              <button
                          onClick={() => {
                            if (prescription.type_prescription === 'ordonnance') {
                              handleGeneratePrescriptionPDF(prescription);
                            } else {
                              handleGeneratePrescriptionPDF(prescription);
                            }
                          }}
                        disabled={isGenerating}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 
disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Tlcharger en PDF"
                      >
                        <FaDownload />
                      </button>
                      <button
                        onClick={() => {
                          if (prescription.type_prescription === 'ordonnance') {
                            handlePrintPrescriptionPDF(prescription);
                          } else {
                            handlePrintPrescriptionPDF(prescription);
                          }
                        }}
                        disabled={isGenerating}
                        className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50 
disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Imprimer"
                      >
                        <FaPrint />
                      </button>
                    </div>

                    {/* Bouton de messagerie scurise */}
                    {(prescription.type_prescription === 'ordonnance' || 
prescription.type_prescription === 'examen') && (
                      <div className="pt-2 border-t border-gray-200">
                        {patientProfile && (
                          <MessagingButton
                            userId={patientProfile.id_patient || patientProfile.id}
                            role="patient"
                            token={localStorage.getItem('jwt') || localStorage.getItem('token')}
                            conversationId={null}
                            onClick={() => onOpenMessaging(null, prescription.medecinInfo?.id)}
                            unreadCount={0}
                          />
                        )}
                      </div>
                    )}

                    {/* Boutons spcifiques au QR Code */}
                    {prescription.qrCode && (
                      <div className="flex space-x-2 pt-2 border-t border-gray-200">
                        <button
                          className="text-purple-600 hover:text-purple-800 p-2 rounded 
hover:bg-purple-50 text-xs"
                          title="Tlcharger QR Code"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = prescription.qrCode;
                            link.download = `QR_${prescription.prescriptionNumber || 
'prescription'}.png`;
                            link.click();
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 
24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 
4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 
00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 
1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                          </svg>
                        </button>
                        <button
                          className="text-indigo-600 hover:text-indigo-800 p-2 rounded 
hover:bg-indigo-50 text-xs"
                          title="Voir QR Code en grand"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Ouvrir le QR code dans une nouvelle fentre
                            window.open(prescription.qrCode, '_blank');
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 
24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 
21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Affichage des consultations */}
            {consultations.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaUser className="text-purple-600" />
                  Consultations médicales
                </h3>
                <div className="space-y-4">
                  {consultations.map((consultation, index) => (
                    <div
                      key={`consultation-${index}`}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-purple-50 border-purple-200"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <FaUser className="text-purple-600 text-xl" />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Consultation du {formatDate(consultation.date)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {consultation.motif || 'Consultation médicale'}
                          </p>
                        </div>
                        <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.statut)}`}>
                          {consultation.statut || 'Terminée'}
                        </span>
                      </div>
                      
                      {/* Détails de la consultation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          {consultation.observations && (
                            <div>
                              <span className="text-xs font-medium text-gray-600">Observations :</span>
                              <p className="text-sm text-gray-700 mt-1">{consultation.observations}</p>
                            </div>
                          )}
                          
                          {consultation.professionnel && (
                            <div>
                              <span className="text-xs font-medium text-gray-600">Professionnel :</span>
                              <p className="text-sm text-gray-700 mt-1">{safeDisplay(consultation.professionnel, 'Non spécifié')}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {consultation.service && (
                            <div>
                              <span className="text-xs font-medium text-gray-600">Service :</span>
                              <p className="text-sm text-gray-700 mt-1">{safeDisplay(consultation.service, 'Non spécifié')}</p>
                            </div>
                          )}
                          
                          {consultation.type && consultation.type !== 'consultation' && (
                            <div>
                              <span className="text-xs font-medium text-gray-600">Type :</span>
                              <p className="text-sm text-gray-700 mt-1">{consultation.type}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <FaFileMedical className="text-4xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">
              Aucun élément trouvé
            </p>
            <p className="text-gray-400">
              {activeFilter === 'all'
                ? 'Vous n\'avez pas encore de prescriptions ou consultations dans votre historique médical.'
                : activeFilter === 'consultations'
                ? 'Aucune consultation trouvée.'
                : `Aucune prescription de type "${activeFilter}" trouvée.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Section de récupération du dossier médical - Visible seulement pour les patients */}
      {patientProfile && patientProfile.role === 'patient' && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                📋 Mon Dossier Médical
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Accédez à votre dossier médical créé par votre médecin traitant
              </p>
            </div>
            {!showDossierSection && (
              <div className="flex flex-col items-end space-y-2">
                <button
                  onClick={loadDossierMedical}
                  disabled={loadingDossier || !patientProfile}
                  className={`inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-medium rounded-lg text-white transition-all duration-200 ${
                    loadingDossier || !patientProfile
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {loadingDossier ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Chargement...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Récupérer mon dossier médical
                    </>
                  )}
                </button>
                <p className="text-xs text-green-600 text-right max-w-xs">
                  Accédez à votre dossier médical complet créé par votre médecin traitant
                </p>
              </div>
            )}
          </div>

          {/* Affichage des erreurs */}
          {errorDossier && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-700 text-sm">{errorDossier}</span>
              </div>
              <button
                onClick={clearDossierError}
                className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Affichage du dossier médical */}
          {showDossierSection && dossierMedical && (
            <div className="bg-white rounded-lg border border-green-200 p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold text-green-800">
                  📋 Dossier Médical de {patientProfile.nom || patientProfile.prenom ? `${patientProfile.prenom || ''} ${patientProfile.nom || ''}`.trim() : `Patient #${patientProfile.id_patient || patientProfile.id}`}
                </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowDossierSection(false);
                      setDossierMedical(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-sm p-2 rounded-md hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    onClick={handleRefreshDossier}
                    disabled={loadingDossier}
                    className="text-green-600 hover:text-green-800 text-sm p-2 rounded-md hover:bg-green-50"
                    title="Actualiser le dossier"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Informations principales du dossier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-md">
                    <span className="font-medium text-blue-800">Numéro de dossier:</span>
                    <p className="text-blue-900 mt-1 font-mono text-lg">{dossierMedical.id || dossierMedical.numeroDossier || 'N/A'}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md">
                    <span className="font-medium text-green-800">Statut:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                      (dossierMedical.statut || '').toLowerCase() === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {dossierMedical.statut || 'Non défini'}
                    </span>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-md">
                    <span className="font-medium text-purple-800">Date d'ouverture:</span>
                    <p className="text-purple-900 mt-1">{formatDate(dossierMedical.date_ouverture || dossierMedical.dateCreation || dossierMedical.createdAt)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <span className="font-medium text-yellow-800">Résumé médical:</span>
                    <p className="text-yellow-900 mt-1">{dossierMedical.resume_medical || dossierMedical.resume || 'Aucun résumé disponible'}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-md">
                    <span className="font-medium text-orange-800">Antécédents médicaux:</span>
                    <p className="text-orange-900 mt-1">{dossierMedical.antecedents_medicaux || dossierMedical.antecedents || 'Aucun antécédent connu'}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-md">
                    <span className="font-medium text-red-800">Allergies:</span>
                    <p className="text-red-900 mt-1">{dossierMedical.allergies || 'Aucune allergie connue'}</p>
                  </div>
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Informations complémentaires
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Traitement en cours:</span>
                    <p className="text-gray-800 mt-1">{dossierMedical.traitement || dossierMedical.traitements || 'Aucun traitement en cours'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Signes vitaux:</span>
                    <p className="text-gray-800 mt-1">{dossierMedical.signes_vitaux || dossierMedical.signesVitaux || 'Normaux'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Histoire familiale:</span>
                    <p className="text-gray-800 mt-1">{dossierMedical.histoire_familiale || dossierMedical.histoireFamiliale || 'Non documentée'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Observations:</span>
                    <p className="text-gray-800 mt-1">{dossierMedical.observations || 'Aucune observation particulière'}</p>
                  </div>
                </div>
              </div>

              {/* Informations sur le médecin traitant si disponibles */}
              {(dossierMedical.medecin || dossierMedical.medecin_traitant || dossierMedical.professionnel) && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <h5 className="font-medium text-blue-700 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Médecin traitant
                  </h5>
                  <div className="text-sm text-blue-800">
                    {dossierMedical.medecin ? (
                      <p>{dossierMedical.medecin.nom || ''} {dossierMedical.medecin.prenom || ''}</p>
                    ) : dossierMedical.medecin_traitant ? (
                      <p>{dossierMedical.medecin_traitant.nom || ''} {dossierMedical.medecin_traitant.prenom || ''}</p>
                    ) : dossierMedical.professionnel ? (
                      <p>{dossierMedical.professionnel.nom || ''} {dossierMedical.professionnel.prenom || ''}</p>
                    ) : (
                      <p>Médecin non spécifié</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Message si pas de dossier */}
          {showDossierSection && !dossierMedical && !loadingDossier && !errorDossier && (
            <div className="text-center py-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun dossier médical trouvé</h3>
              <p className="mt-1 text-sm text-gray-500">
                Votre médecin traitant n'a pas encore créé de dossier médical pour vous.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal pour afficher les dtails de la prescription */}
      {showPrescriptionModal && selectedPrescription && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closePrescriptionModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du modal */}
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center gap-3">
                {getTypeIcon(selectedPrescription.type_prescription)}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedPrescription.type_prescription === 'ordonnance' ? 'Ordonnance mdicale' 
:
                      selectedPrescription.type_prescription === 'examen' ? 'Demande d\'examen' :
                        selectedPrescription.type_prescription === 'consultation' ? 'Consultation' :
                          selectedPrescription.type_prescription}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Prescrit le {formatDate(selectedPrescription.date_prescription)}
                  </p>
                </div>
              </div>
              <button
                onClick={closePrescriptionModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 
6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenu du modal */}
            <div className="p-6">
              {/* Description */}
              {selectedPrescription.description && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {selectedPrescription.description}
                  </p>
                </div>
              )}

              {/* Mdicaments */}
              {selectedPrescription.medicaments && selectedPrescription.medicaments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Mdicaments prescrits</h4>
                  <div className="space-y-3">
                    {selectedPrescription.medicaments.map((med, idx) => (
                      <div key={idx} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-blue-900">{med.nom}</h5>
                            {med.posologie && (
                              <p className="text-blue-700 text-sm mt-1">
                                <span className="font-medium">Posologie :</span> {med.posologie}
                              </p>
                            )}
                            {med.duree && (
                              <p className="text-blue-700 text-sm mt-1">
                                <span className="font-medium">Dure :</span> {med.duree}
                              </p>
                            )}
                          </div>
                          {med.quantite && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 
rounded-full">
                              Qt: {med.quantite}
                            </span>
                          )}
                        </div>
                        {med.instructions && (
                          <p className="text-blue-600 text-sm mt-2 italic">
                            {med.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examens */}
              {selectedPrescription.examens && selectedPrescription.examens.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Examens demands</h4>
                  <div className="space-y-3">
                    {selectedPrescription.examens.map((exam, idx) => (
                      <div key={idx} className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-green-900">{exam.nom}</h5>
                            {exam.type && (
                              <p className="text-green-700 text-sm mt-1">
                                <span className="font-medium">Type :</span> {exam.type}
                              </p>
                            )}
                          </div>
                          {exam.urgence && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-3 
py-1 rounded-full">
                              {exam.urgence === 'urgent' ? 'URGENT' : exam.urgence}
                            </span>
                          )}
                        </div>
                        {exam.instructions && (
                          <p className="text-green-600 text-sm mt-2 italic">
                            {exam.instructions}
                          </p>
                        )}
                        {exam.preparation && (
                          <p className="text-green-600 text-sm mt-2">
                            <span className="font-medium">Prparation :</span> {exam.preparation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informations complmentaires */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Statut et mdecin */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Informations gnrales</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Statut :</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium 
${getStatusColor(selectedPrescription.statut)}`}>
                        {selectedPrescription.statut || 'Statut inconnu'}
                      </span>
                    </div>
                    {selectedPrescription.medecinInfo && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Mdecin :</span>
                        <span className="text-gray-900 font-medium">
                          Dr. {selectedPrescription.medecinInfo.prenom} {selectedPrescription.medecinInfo.nom}
                        </span>
                      </div>
                    )}
                    {selectedPrescription.etablissement && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">tablissement :</span>
                        <span className="text-gray-900 font-medium">
                          {safeDisplay(selectedPrescription.etablissement, 'Établissement')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates et validit */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Dates et validit</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Date de prescription :</span>
                      <span className="text-gray-900 font-medium">
                        {formatDate(selectedPrescription.date_prescription)}
                      </span>
                    </div>
                    {selectedPrescription.date_debut && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Date de dbut :</span>
                        <span className="text-gray-900 font-medium">
                          {formatDate(selectedPrescription.date_debut)}
                        </span>
                      </div>
                    )}
                    {selectedPrescription.date_fin && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Date de fin :</span>
                        <span className="text-gray-900 font-medium">
                          {formatDate(selectedPrescription.date_fin)}
                        </span>
                      </div>
                    )}
                    {selectedPrescription.validite && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Validit :</span>
                        <span className="text-gray-900 font-medium">
                          {selectedPrescription.validite}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={closePrescriptionModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 
transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    if (selectedPrescription.type_prescription === 'ordonnance') {
                      handleGeneratePrescriptionPDF(selectedPrescription);
                    } else {
                      handleGeneratePrescriptionPDF(selectedPrescription);
                    }
                  }}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  title="Tlcharger en PDF"
                >
                  <FaDownload />
                  {isGenerating ? 'Gnration...' : 'Tlcharger'}
                </button>
                <button
                  onClick={() => {
                    if (selectedPrescription.type_prescription === 'ordonnance') {
                      handlePrintPrescriptionPDF(selectedPrescription);
                    } else {
                      handlePrintPrescriptionPDF(selectedPrescription);
                    }
                  }}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  title="Imprimer"
                >
                  <FaPrint />
                  {isGenerating ? 'Prparation...' : 'Imprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de slection PDF */}
      {showPDFSelectionModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closePDFSelectionModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du modal */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Gnration de PDF
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedPrescriptionsForPDF.length} prescription(s) slectionne(s)
                </p>
              </div>
              <button
                onClick={closePDFSelectionModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 
6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenu du modal */}
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Prescriptions slectionnes 
:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedPrescriptionsForPDF.map((prescription, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 
rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(prescription.type_prescription)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {prescription.type_prescription === 'ordonnance' ? 'Ordonnance mdicale' 
:
                              prescription.type_prescription === 'examen' ? 'Demande d\'examen' :
                                prescription.type_prescription === 'consultation' ? 'Consultation' :
                                  prescription.type_prescription}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(prescription.date_prescription)}
                          </p>
                          {prescription.prescriptionNumber && (
                            <p className="text-xs text-gray-500 font-mono">
                              N {prescription.prescriptionNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => togglePrescriptionSelection(prescription)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Retirer de la slection"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 
24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 
18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  onClick={closePDFSelectionModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 
transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleGenerateMultiplePrescriptionsPDF}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  title="Tlcharger les PDFs"
                >
                  <FaDownload />
                  {isGenerating ? 'Gnration...' : 'Tlcharger'}
                </button>
                <button
                  onClick={handlePrintMultiplePrescriptionsPDF}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  title="Imprimer les PDFs"
                >
                  <FaPrint />
                  {isGenerating ? 'Prparation...' : 'Imprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

const DMP = () => {
  const [activeTab, setActiveTab] = useState('tableau-de-bord');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableauDeBord, setTableauDeBord] = useState(null);

  const [rappels, setRappels] = useState([]);
  const [notificationsDroitsAcces, setNotificationsDroitsAcces] = useState([]);
  const [droitsAcces, setDroitsAcces] = useState([]);
  const [, setAutorisationsValidees] = useState([]);
  const [showAutoMesureModal, setShowAutoMesureModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [showMessagingTest, setShowMessagingTest] = useState(false);
  const [showMessagingInterface, setShowMessagingInterface] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [showJoinConferenceModal, setShowJoinConferenceModal] = useState(false);
  const [conferenceLink, setConferenceLink] = useState('');
  const [conferenceError, setConferenceError] = useState(null);
  const [autoMesure, setAutoMesure] = useState({
    type_mesure: 'poids',
    valeur: '',
    valeur_secondaire: '', 
    unite: '',
    unite_secondaire: '', // Pour tension (mmHg)
    commentaire: '',
    date_mesure: new Date().toISOString().split('T')[0],
    heure_mesure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  // tats pour les notifications en temps rel
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // États pour les appels WebRTC
  const [activeCall, setActiveCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, incoming, connecting, connected, ended
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  // tats pour la protection 2FA des dossiers patients (grs par le hook use2FA)

  const navigate = useNavigate();
  const dmpContext = useDMP();
  
  // Vrification de scurit pour le contexte DMP
  const dmpState = dmpContext?.state || {};
  const dmpActions = dmpContext?.actions || {};
  const createAutoMesure = dmpActions?.createAutoMesure;
  const uploadDocument = dmpActions?.uploadDocument;
  
  // Logs de dbogage pour le contexte DMP
  console.log(' DMP.js - Contexte DMP rcupr:', {
    dmpContext: !!dmpContext,
    hasState: !!dmpContext?.state,
    hasActions: !!dmpContext?.actions,
    patientId: dmpContext?.state?.patientId,
    loading: dmpContext?.state?.loading,
    error: dmpContext?.state?.error,
    createAutoMesure: !!dmpActions?.createAutoMesure,
    uploadDocument: !!dmpActions?.uploadDocument
  });


  // Vrification de scurit avant d'utiliser le contexte
  if (!dmpContext || !dmpState || !dmpActions) {
      // If you want to show this diagnostic UI, move it inside a component's render/return.
      // Example: return this JSX inside the DMP component's render block.
      // <div className="fixed top-4 right-4 bg-red-100 border border-red-400 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      //     <h4 className="font-semibold text-red-800 mb-2"> Erreur DMP Context</h4>
      //     <div className="space-y-1 text-xs text-red-700">
      //         <div>Contexte DMP non disponible</div>
      //         <div>Vrifiez que le composant est dans un DMPProvider</div>
      //     </div>
      // </div>
  }

  const handleForceRefresh = () => {
      if (dmpActions.forceRefreshPatientId) {
          const newPatientId = dmpActions.forceRefreshPatientId();
          if (newPatientId) {
              // Recharger les donnes
              if (dmpActions.refreshAllData) {
                  dmpActions.refreshAllData();
              }
          }
      } else {
      }
  };

  // Fonction pour ouvrir l'interface de messagerie
  const handleOpenMessaging = (conversationId = null, medecinId = null) => {
    console.log('🚀 Ouverture de la messagerie avec conversationId:', conversationId, 'et medecinId:', medecinId);
    setSelectedConversationId(conversationId);
    setShowMessagingInterface(true);
    // Stocker l'ID du médecin pour l'utiliser dans ChatMessage
    if (medecinId) {
      localStorage.setItem('currentMedecinId', medecinId.toString());
    }
  };

  // Joindre une conférence via lien
  const validateConferenceLink = (link) => {
    if (!link || typeof link !== 'string') return 'Lien manquant';
    try {
      const url = new URL(link);
      if (!/^https?:$/.test(url.protocol)) return 'Lien invalide (http/https requis)';
      return null;
    } catch {
      return 'Format de lien invalide';
    }
  };

  const handleOpenJoinConference = () => {
    setConferenceLink('');
    setConferenceError(null);
    setShowJoinConferenceModal(true);
  };

  const handleCloseJoinConference = () => {
    setShowJoinConferenceModal(false);
    setConferenceLink('');
    setConferenceError(null);
  };

  const handleJoinConference = async () => {
    const err = validateConferenceLink(conferenceLink);
    if (err) {
      setConferenceError(err);
      return;
    }
    try {
      // Init signaling if needed and notify intent to join
      if (patientProfile) {
        if (!signalingService.isConnected()) {
          signalingService.initialize();
          signalingService.connectSocket(
            patientProfile.id_patient || patientProfile.id,
            'patient',
            localStorage.getItem('jwt') || localStorage.getItem('token')
          );
        }
        signalingService.emit && signalingService.emit('patient_join_conference', {
          conferenceLink: conferenceLink,
          patientId: patientProfile.id_patient || patientProfile.id
        });
      }

      // Ouvrir la conférence dans un nouvel onglet
      window.open(conferenceLink, '_blank', 'noopener,noreferrer');

      // Mémoriser le lien pour d'autres workflows (ex: accept call)
      localStorage.setItem('lastConferenceLink', conferenceLink);

      handleCloseJoinConference();
    } catch (e) {
      setConferenceError(e.message || 'Impossible de rejoindre la conférence');
    }
  };

  // Fonction pour fermer l'interface de messagerie
  const handleCloseMessaging = () => {
    console.log('🔒 Fermeture de la messagerie');
    setShowMessagingInterface(false);
    setSelectedConversationId(null);
    // Nettoyer l'ID du médecin
    localStorage.removeItem('currentMedecinId');
  };

  // ===== FONCTIONS WEBRTC POUR LE CLIENT =====

  // Fonction pour accepter un appel entrant
  const handleAcceptCall = async (callData) => {
    try {
      console.log('📞 Acceptation de l\'appel entrant:', callData);
      
      // Initialiser le service de signalisation si nécessaire
      if (!signalingService.isConnected()) {
        signalingService.initialize();
        signalingService.connectSocket(
          patientProfile.id_patient || patientProfile.id,
          'patient',
          localStorage.getItem('jwt') || localStorage.getItem('token')
        );
      }

      // Mettre à jour l'état de l'appel
      setActiveCall(callData);
      setCallStatus('connecting');
      setIncomingCall(null);

      // Démarrer la capture vidéo/audio locale
      if (callData.type === 'video' || callData.type === 'audio_video') {
        await startLocalVideoStream();
      }

      // Répondre à la session WebRTC avec validation via lien de conférence si disponible
      const result = await signalingService.answerWebRTCSessionWithConferenceValidation(
        callData.sessionId,
        null, // SDP answer sera généré par le composant vidéo
        callData.conferenceLink || null // Lien de conférence pour validation
      );

      if (result.success) {
        console.log('✅ Appel accepté avec succès');
        setCallStatus('connected');
        
        // Émettre l'événement d'acceptation
        signalingService.emit('call_accepted', {
          sessionId: callData.sessionId,
          patientId: patientProfile.id_patient || patientProfile.id
        });
      } else {
        console.error('❌ Erreur lors de l\'acceptation de l\'appel:', result.error);
        setError(`Erreur lors de l'acceptation de l'appel: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'acceptation de l\'appel:', error);
      setError(`Erreur lors de l'acceptation de l'appel: ${error.message}`);
    }
  };

  // Fonction pour refuser un appel entrant
  const handleRejectCall = async (callData) => {
    try {
      console.log('❌ Refus de l\'appel entrant:', callData);
      
      // Terminer la session WebRTC
      if (signalingService.isConnected()) {
        await signalingService.endWebRTCSession(callData.sessionId);
      }

      // Émettre l'événement de refus
      signalingService.emit('call_rejected', {
        sessionId: callData.sessionId,
        patientId: patientProfile.id_patient || patientProfile.id
      });

      // Réinitialiser l'état
      setIncomingCall(null);
      setCallStatus('idle');
      
      console.log('✅ Appel refusé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du refus de l\'appel:', error);
      setError(`Erreur lors du refus de l'appel: ${error.message}`);
    }
  };

  // Fonction pour démarrer le flux vidéo local
  const startLocalVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      console.log('✅ Flux vidéo local démarré');
    } catch (error) {
      console.error('❌ Erreur lors de la capture vidéo locale:', error);
      setError('Impossible d\'accéder à la caméra/microphone');
    }
  };

  // Fonction pour terminer l'appel
  const handleEndCall = async () => {
    try {
      if (activeCall) {
        console.log('📞 Terminaison de l\'appel:', activeCall.sessionId);
        
        // Terminer la session WebRTC côté serveur
        if (signalingService.isConnected()) {
          await signalingService.endWebRTCSession(activeCall.sessionId);
        }
        
        // Émettre l'événement de fin d'appel
        signalingService.emit('end_call', {
          sessionId: activeCall.sessionId,
          patientId: patientProfile.id_patient || patientProfile.id
        });
        
        // Nettoyer les flux
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
          setLocalStream(null);
        }
        setRemoteStream(null);
        
        // Réinitialiser l'état de l'appel
        setActiveCall(null);
        setCallStatus('idle');
        
        console.log('✅ Appel terminé avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la terminaison de l\'appel:', error);
      setError(`Erreur lors de la terminaison de l'appel: ${error.message}`);
    }
  };
  
// Misplaced return block removed. If you want to show this diagnostic UI, move it inside a component's render/return.

  // Hook pour la gnration de PDF
  const {
    isGenerating: isGeneratingPDF,
    error: pdfError,
    generateUrgencyCardPDF,
    printUrgencyCardPDF,
    clearError: clearPDFError
  } = usePDFGenerator();

  // Utilisation du hook centralis use2FA
  const {
    show2FA,
    requires2FA,
    pendingAction,
    handle2FASuccess,
    handle2FACancel,
    with2FAProtection,
    reset2FA
  } = use2FA();

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Écouter les appels WebRTC entrants
  useEffect(() => {
    if (patientProfile) {
      // Initialiser le service de signalisation
      signalingService.initialize();
      signalingService.connectSocket(
        patientProfile.id_patient || patientProfile.id,
        'patient',
        localStorage.getItem('jwt') || localStorage.getItem('token')
      );

      // Écouter les appels entrants
      signalingService.on('incoming_call', (callData) => {
        console.log('📞 Appel entrant reçu:', callData);
        setIncomingCall(callData);
        setCallStatus('incoming');
      });

      // Écouter les sessions WebRTC créées
      signalingService.on('webrtc:session_created', (sessionData) => {
        console.log('🎥 Session WebRTC créée:', sessionData);
      });

      // Écouter les erreurs WebRTC
      signalingService.on('webrtc:error', (errorData) => {
        console.error('❌ Erreur WebRTC:', errorData);
        setError(`Erreur WebRTC: ${errorData.message}`);
      });

      // Nettoyer les écouteurs au démontage
      return () => {
        signalingService.off('incoming_call');
        signalingService.off('webrtc:session_created');
        signalingService.off('webrtc:error');
        signalingService.disconnect();
      };
    }
  }, [patientProfile]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Rcuprer le profil patient depuis le localStorage
      const storedPatient = getStoredPatient();
      if (storedPatient) {
        setPatientProfile(storedPatient);
      }

      // Charger le tableau de bord (utilise automatiquement l'ID du patient connect)
      try {
        const tableauData = await dmpApi.getTableauDeBord();
        setTableauDeBord(tableauData.data?.tableau_de_bord);
      } catch (tableauError) {
        console.warn('Tableau de bord non disponible:', tableauError.message);
        setTableauDeBord(null);
      }

      // Charger les notifications des droits d'accs depuis l'API relle
      console.log('Chargement des notifications des droits d\'accs depuis l\'API...');
      try {
        // Rcuprer l'ID du patient connect
        const storedPatient = getStoredPatient();
        const patientId = storedPatient?.id_patient || storedPatient?.id;

        if (!patientId) {
          console.warn('ID patient non disponible pour charger les notifications');
          setNotificationsDroitsAcces([]);
        } else {
          const pendingRequests = await dmpApi.getMedecinAccessRequests(patientId);
          console.log('Demandes reues de l\'API:', pendingRequests);

          // Filtrer pour ne garder que les accs du patient connect
          const filteredRequests = filterAccessByPatient(pendingRequests, patientId);
          console.log('Accs filtrs pour le patient:', filteredRequests);
          setNotificationsDroitsAcces(filteredRequests);
        }
      } catch (notificationsError) {
        console.warn('Notifications non disponibles:', notificationsError.message);
        setNotificationsDroitsAcces([]);
      }

      // Charger les droits d'accs complets
      console.log('Chargement des droits d\'accs complets...');
      try {
        const storedPatient = getStoredPatient();
        const patientId = storedPatient?.id_patient || storedPatient?.id;

        if (patientId) {
          const droitsAccesData = await dmpApi.getDroitsAcces(patientId);
          console.log('Droits d\'accs reus de l\'API:', droitsAccesData);
          
          if (Array.isArray(droitsAccesData)) {
            setDroitsAcces(droitsAccesData);
          } else if (droitsAccesData && Array.isArray(droitsAccesData.data)) {
            setDroitsAcces(droitsAccesData.data);
          } else {
            setDroitsAcces([]);
          }
        }
      } catch (droitsError) {
        console.warn('Droits d\'accs non disponibles:', droitsError.message);
        setDroitsAcces([]);
      }

      // Charger les autorisations valides
      await loadAutorisationsValidees();

    } catch (error) {
      console.error('Erreur lors du chargement des donnes initiales:', error);
      setError(`Erreur lors du chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour formater les dates dans l'onglet rappels
  const formatDateRappels = (dateString) => {
    if (!dateString) return 'Date non disponible';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  // Nouvelle fonction pour charger les autorisations valides
  const loadAutorisationsValidees = async () => {
    try {
      console.log(' Chargement des autorisations valides...');
      const autorisationsData = await dmpApi.getAutorisations();
      console.log(' Autorisations reues de l\'API:', autorisationsData);

      // Normaliser la rponse, en grant diffrentes structures possibles
      let autorisationsList = [];
      const payload = autorisationsData?.data ?? autorisationsData;

      if (Array.isArray(payload)) {
        autorisationsList = payload;
      } else if (Array.isArray(payload?.autorisations)) {
        autorisationsList = payload.autorisations;
      } else if (Array.isArray(payload?.authorizations)) {
        autorisationsList = payload.authorizations;
      } else if (Array.isArray(payload?.data)) {
        autorisationsList = payload.data;
      } else if (Array.isArray(payload?.data?.autorisations)) {
        autorisationsList = payload.data.autorisations;
      } else if (Array.isArray(payload?.data?.authorizations)) {
        autorisationsList = payload.data.authorizations;
      }

      const autorisationsActives = (autorisationsList || []).filter(auth => auth.statut === 'actif');
      setAutorisationsValidees(autorisationsActives);
      console.log(' Autorisations valides charges:', autorisationsActives.length);
    } catch (error) {
      console.error(' Erreur lors du chargement des autorisations valides:', error);
      // En cas d'erreur, initialiser avec un tableau vide
      setAutorisationsValidees([]);
    }
  };

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================
  
  // Fonction pour filtrer les accs par patient ID
  const filterAccessByPatient = useCallback((accessData, patientId) => {
    if (!accessData || !patientId) return [];
    const arr = accessData.authorizationAccess || accessData;
    console.log("Accs bruts:", arr);
    arr.forEach(acc => console.log("Cls accs:", Object.keys(acc), acc));
    return arr.filter(access => Number(access.patient_id) === Number(patientId));
  }, []);

  // Fonction pour obtenir les notifications  afficher
  const getNotificationsToDisplay = useCallback(() => {
    return notificationsDroitsAcces;
  }, [notificationsDroitsAcces]);

  // ========================================
  // FONCTIONS DE CHARGEMENT DES DONNES
  // ========================================
  
  const loadTabData = async (tab) => {
    try {
      setLoading(true);
      setError(null);

      switch (tab) {
        case 'historique':
          // L'historique mdical est maintenant gr par le composant HistoriqueMedical
          break;
        case 'droits-acces':
          // Charger les notifications des droits d'accs depuis l'API relle
          console.log(' Chargement des notifications (onglet droits-acces) depuis l\'API...');
          try {
            // Rcuprer l'ID du patient connect
            const storedPatient = getStoredPatient();
            const patientId = storedPatient?.id_patient || storedPatient?.id;

            if (!patientId) {
              console.warn(' ID patient non disponible pour charger les notifications');
              setNotificationsDroitsAcces([]);
            } else {
              const pendingRequests = await dmpApi.getMedecinAccessRequests(patientId);
              console.log(' Notifications reues (onglet):', pendingRequests);

              // Filtrer pour ne garder que les accs du patient connect
              const filteredRequests = filterAccessByPatient(pendingRequests, patientId);
              console.log(' Accs filtrs pour le patient (onglet):', filteredRequests);
              setNotificationsDroitsAcces(filteredRequests);
            }
          } catch (notificationsError) {
            console.warn(' Notifications non disponibles:', notificationsError.message);
            setNotificationsDroitsAcces([]);
          }

          // Charger aussi les autorisations valides
          await loadAutorisationsValidees();
          break;
        case 'rappels':
          try {
            // Récupérer l'ID du patient connecté
            const storedPatient = getStoredPatient();
            const patientId = storedPatient?.id_patient || storedPatient?.id;

            if (!patientId) {
              console.warn('ID patient non disponible pour charger les rendez-vous');
              setRappels([]);
              break;
            }

            // Utiliser le service rendezVous pour récupérer les rendez-vous du patient
            const rendezVousData = await getRendezVousByPatient(patientId);
            
            if (rendezVousData && (rendezVousData.success || rendezVousData.status === 'success')) {
              console.log('Rendez-vous récupérés avec succès:', rendezVousData.data);
              
              // Gérer les deux structures possibles de réponse
              let rendezVous = [];
              if (rendezVousData.data && Array.isArray(rendezVousData.data)) {
                // Structure directe : data: [...]
                rendezVous = rendezVousData.data;
              } else if (rendezVousData.data && Array.isArray(rendezVousData.data.rendezVous)) {
                // Structure imbriquée : data: {rendezVous: [...]}
                rendezVous = rendezVousData.data.rendezVous;
              }
              
              console.log('Rendez-vous extraits:', rendezVous);
              
              // Normaliser les données des rendez-vous pour la nouvelle structure API
              const normalizedRendezVous = rendezVous.map(rdv => ({
                id: rdv.id_rendezvous || rdv.id,
                date: rdv.DateHeure ? new Date(rdv.DateHeure).toISOString().split('T')[0] : rdv.date,
                heure: rdv.DateHeure ? new Date(rdv.DateHeure).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : rdv.heure,
                motif: rdv.motif_consultation || rdv.motif,
                statut: rdv.statut,
                notes: rdv.notes,
                patient: {
                  nom: rdv.nom,
                  prenom: rdv.prenom,
                  email: rdv.email,
                  date_naissance: rdv.dateNaissance,
                  sexe: rdv.sexe,
                  telephone: rdv.telephone
                },
                professionnel: rdv.professionnel,
                hopital: rdv.Hopital,
                service: rdv.ServiceSante,
                createdAt: rdv.createdAt,
                updatedAt: rdv.updatedAt
              }));
              
              console.log('✅ Rendez-vous normalisés:', normalizedRendezVous);
              setRappels(normalizedRendezVous);
            } else {
              console.warn('Aucun rendez-vous trouvé ou erreur API:', rendezVousData?.message || 'Structure de réponse inattendue');
              setRappels([]);
            }
          } catch (rappelsError) {
            console.warn('Erreur lors du chargement des rendez-vous:', rappelsError.message);
            setRappels([]);
          }
          break;
        case 'mon-espace-sante':
          // Documents are now handled by DMPMonEspaceSante component
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Erreur lors du chargement des donnes de l'onglet:", error);
      setError(`Erreur lors du chargement de l'onglet: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // WRAPPERS 2FA POUR LA PROTECTION
  // ========================================
  
  const protectedLoadInitialData = with2FAProtection(loadInitialData, "Chargement des donnes initiales");
  const protectedLoadTabData = with2FAProtection(loadTabData, 'Chargement des donnes d\'onglet');

  // ========================================
  // GESTIONNAIRES D'VNEMENTS
  // ========================================
  
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    loadTabData(tab);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutAll();
      navigate('/connexion', {
        state: { message: 'Vous avez t dconnect avec succs' }
      });
    } catch (error) {
      console.error('Erreur lors de la dconnexion:', error);
    }
  }, [navigate]);

  // ========================================
  // GESTION DES NOTIFICATIONS ET AUTORISATIONS
  // ========================================
  
  const handleMarquerNotificationLue = useCallback(async (notificationId) => {
    try {
      console.log(' DMP: Marquage de la notification comme lue, ID:', notificationId);

      // Appel API pour marquer comme lue
      await dmpApi.marquerNotificationDroitsAccesLue(notificationId);

      console.log(' DMP: Notification marque comme lue avec succs');

      // Recharger les notifications depuis l'API pour avoir les donnes  jour
      console.log(' DMP: Rechargement des notifications aprs marquage...');
      const storedPatient = getStoredPatient();
      const patientId = storedPatient?.id_patient || storedPatient?.id;

      if (patientId) {
        const pendingRequests = await dmpApi.getMedecinAccessRequests(patientId);
        console.log(' DMP: Nouvelles notifications reues:', pendingRequests);
        setNotificationsDroitsAcces(Array.isArray(pendingRequests) ? pendingRequests : []);
      }

      // Recharger aussi les autorisations valides
      await loadAutorisationsValidees();

      // Afficher une confirmation
      alert('Notification marque comme lue');

    } catch (error) {
      console.error(' DMP: Erreur lors du marquage de la notification:', error);
      alert(`Erreur lors du marquage de la notification: ${error.message}`);
    }
  }, []);

  const rafraichirNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const storedPatient = getStoredPatient();
      const patientId = storedPatient?.id_patient || storedPatient?.id;

      if (!patientId) {
        console.warn('ID patient non disponible pour rafrachir les notifications');
        setNotificationsDroitsAcces([]);
        return;
      }

      const pendingRequests = await dmpApi.getMedecinAccessRequests(patientId);
      console.log('Demandes reues lors du rafrachissement:', pendingRequests);

      // Filtrer pour ne garder que les accs du patient connect
      const filteredRequests = filterAccessByPatient(pendingRequests, patientId);
      console.log('Accs filtrs lors du rafrachissement:', filteredRequests);
      setNotificationsDroitsAcces(Array.isArray(filteredRequests) ? filteredRequests : []);
    } catch (error) {
      console.error('Erreur lors du rafrachissement des notifications:', error);
      setNotificationsDroitsAcces([]);
    } finally {
      setLoading(false);
    }
  }, [filterAccessByPatient]);

  const handleRepondreDemandeAcces = useCallback(async (request, reponse) => {
    try {
      const apiDecision = reponse === 'accepter' || reponse === 'accept' ? 'accept' : 'refuse';
      const confirmationMessage = apiDecision === 'accept'
        ? `tes-vous sr de vouloir autoriser l'accs au Dr. ${request.professionnel.prenom} 
${request.professionnel.nom} ?`
        : `tes-vous sr de vouloir refuser l'accs ?`;

      if (!window.confirm(confirmationMessage)) {
        return;
      }

      // L'ID est directement disponible dans l'objet 'request'
      const autorisationId = request.id_acces_autorisation;
      console.log(` Rponse  la demande ID: ${autorisationId}, Rponse: ${reponse}`);

      // Appel direct  la nouvelle fonction API
      await dmpApi.respondToAccessRequest(autorisationId, apiDecision);

      const message = apiDecision === 'accept'
        ? 'Demande d\'accs accepte avec succs !'
        : 'Demande d\'accs refuse.';
      alert(message);
      rafraichirNotifications();

    } catch (error) {
      console.error(' Erreur lors de la rponse  la demande:', error);
      alert(`Erreur : ${error.message || "Impossible de traiter votre rponse."}`);
    }
  }, [rafraichirNotifications]);

  const rafraichirDroitsAcces = async () => {
    try {
      setLoading(true);
      const storedPatient = getStoredPatient();
      const patientId = storedPatient?.id_patient || storedPatient?.id;

      if (!patientId) {
        console.warn('ID patient non disponible pour rafrachir les droits d\'accs');
        setDroitsAcces([]);
        return;
      }

      const droitsAccesData = await dmpApi.getDroitsAcces(patientId);
      console.log('Droits d\'accs reus lors du rafrachissement:', droitsAccesData);
      
      if (Array.isArray(droitsAccesData)) {
        setDroitsAcces(droitsAccesData);
      } else if (droitsAccesData && Array.isArray(droitsAccesData.data)) {
        setDroitsAcces(droitsAccesData.data);
      } else {
        setDroitsAcces([]);
      }
    } catch (error) {
      console.error('Erreur lors du rafrachissement des droits d\'accs:', error);
      setDroitsAcces([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour afficher une notification en temps rel
  const showNotificationToast = (notification) => {
    setCurrentNotification(notification);
    setShowNotification(true);
  };

  // Fonction pour fermer la notification
  const closeNotification = () => {
    setShowNotification(false);
    setCurrentNotification(null);
  };

  // Fonction pour grer l'acceptation d'une demande d'accs
  const handleAcceptAccess = async (notificationId) => {
    try {
      console.log(' DMP: === DBUT ACCEPTATION DEMANDE D\'ACCS ===');
      console.log(' DMP: notificationId reu:', notificationId);
      console.log(' DMP: Nombre total de notifications:', notificationsDroitsAcces.length);

      // Trouver la notification correspondante
      const notification = notificationsDroitsAcces.find(n => n.id_notification === notificationId);
      if (!notification) {
        console.error(' DMP: Notification non trouve pour l\'ID:', notificationId);
        console.log(' DMP: Notifications disponibles:', notificationsDroitsAcces.map(n => ({ id: 
n.id_notification, type: n.type_notification })));
        alert('Erreur: Notification non trouve');
        return;
      }

      console.log(' DMP: Notification trouve:', {
        id_notification: notification.id_notification,
        type_notification: notification.type_notification,
        session_id: notification.session_id,
        professionnel_id: notification.professionnel_id,
        date_creation: notification.date_creation,
        statut_envoi: notification.statut_envoi
      });

      // Utiliser la fonction helper pour trouver l'ID d'autorisation
      console.log(' DMP: Recherche de l\'ID d\'autorisation pour la notification...');
      const autorisationId = await dmpApi.findAutorisationIdFromNotification(notification);

      if (!autorisationId) {
        console.error(' DMP: Impossible de trouver l\'ID d\'autorisation pour cette notification');
        console.log(' DMP: Dtails de la notification pour debug:', notification);

        // Vrifier si l'autorisation existe
        console.log(' DMP: Vrification de l\'existence de l\'autorisation...');
        const autorisation = await dmpApi.verifierAutorisationExistence(notificationId);
        console.log(' DMP: Rsultat de la vrification:', autorisation);

      }

      console.log(' DMP: ID d\'autorisation trouv:', autorisationId);

      // Vrifier si l'autorisation existe
      const autorisation = await dmpApi.verifierAutorisationExistence(autorisationId);
      console.log(' DMP: Vrification de l\'autorisation:', autorisation);


  console.log(' DMP: Acceptation de la demande d\'accs:', autorisationId);
  const result = await dmpApi.accepterAutorisation(autorisationId, "Accès autorisé par le patient");

      // Vrifier si l'autorisation tait dj active
      if (result && result.success && result.message === 'L\'autorisation est dj active') {
        console.log(' DMP: L\'autorisation tait dj active');
        alert('Cette autorisation est dj active');
      } else {
        console.log(' DMP: Autorisation accepte avec succs');

        // Recharger les notifications depuis l'API
        console.log(' DMP: Rechargement des notifications aprs acceptation...');
        const pendingRequests = await dmpApi.getMedecinAccessRequests();
        console.log(' DMP: Nouvelles notifications reues:', pendingRequests);
        setNotificationsDroitsAcces(Array.isArray(pendingRequests) ? pendingRequests : []);

        // Recharger aussi les autorisations valides
        await loadAutorisationsValidees();

        // Afficher une confirmation
        alert('Demande d\'accs accepte avec succs');
      }

      console.log(' DMP: === FIN ACCEPTATION DEMANDE D\'ACCS ===');
    } catch (error) {
      console.error(' DMP: Erreur lors de l\'acceptation:', error);
      console.error(' DMP: Stack trace:', error.stack);
      alert(`Erreur lors de l'acceptation de la demande d'accs: ${error.message}`);
    }
  };

  // Fonction pour grer le refus d'une demande d'accs
  const handleRejectAccess = async (notificationId) => {
    try {
      console.log(' DMP: === DBUT REFUS DEMANDE D\'ACCS ===');
      console.log(' DMP: notificationId reu:', notificationId);
      console.log(' DMP: Nombre total de notifications:', notificationsDroitsAcces.length);

      // Trouver la notification correspondante
      const notification = notificationsDroitsAcces.find(n => n.id_notification === notificationId);
      if (!notification) {
        console.error(' DMP: Notification non trouve pour l\'ID:', notificationId);
        console.log(' DMP: Notifications disponibles:', notificationsDroitsAcces.map(n => ({ id: 
n.id_notification, type: n.type_notification })));
        alert('Erreur: Notification non trouve');
        return;
      }

      console.log(' DMP: Notification trouve:', {
        id_notification: notification.id_notification,
        type_notification: notification.type_notification,
        session_id: notification.session_id,
        professionnel_id: notification.professionnel_id,
        date_creation: notification.date_creation,
        statut_envoi: notification.statut_envoi
      });

      // Utiliser la fonction helper pour trouver l'ID d'autorisation
      console.log(' DMP: Recherche de l\'ID d\'autorisation pour la notification...');
      const autorisationId = await dmpApi.findAutorisationIdFromNotification(notification);

      if (!autorisationId) {
        console.error(' DMP: Impossible de trouver l\'ID d\'autorisation pour cette notification');
        console.log(' DMP: Dtails de la notification pour debug:', notification);

        // Vrifier si l'autorisation existe
        console.log(' DMP: Vrification de l\'existence de l\'autorisation...');
        const autorisation = await dmpApi.verifierAutorisationExistence(notificationId);
        console.log(' DMP: Rsultat de la vrification:', autorisation);

        if (!autorisation) {
          alert("Erreur: Impossible de trouver l'autorisation correspondante. Veuillez ressayer ou contacter le support.");
          return;
        }
      }

      console.log(' DMP: ID d\'autorisation trouv:', autorisationId);

      // Vrifier si l'autorisation existe
      const autorisation = await dmpApi.verifierAutorisationExistence(autorisationId);
      console.log(' DMP: Vrification de l\'autorisation:', autorisation);

      if (!autorisation) {
        console.error("DMP: L'autorisation trouvée n'existe pas ou n'est pas valide");
        alert("Erreur: L'autorisation trouvée n'est pas valide. Veuillez ressayer ou contacter le support.");
        return;
      }

  console.log("DMP: Refus de la demande d'accès:", autorisationId);
  const result = await dmpApi.refuserAutorisation(autorisationId, "Accès refusé par le patient");

      // Vrifier si l'autorisation tait dj refuse
      if (result && result.success && result.message === 'L\'autorisation est dj refuse') {
        console.log(' DMP: L\'autorisation tait dj refuse');
        alert('Cette autorisation est dj refuse');
      } else {
        console.log(' DMP: Autorisation refuse avec succs');

        // Recharger les notifications depuis l'API
        console.log(' DMP: Rechargement des notifications aprs refus...');
        const pendingRequests = await dmpApi.getMedecinAccessRequests();
        console.log(' DMP: Nouvelles notifications reues:', pendingRequests);
        setNotificationsDroitsAcces(Array.isArray(pendingRequests) ? pendingRequests : []);

        // Recharger aussi les autorisations valides
        await loadAutorisationsValidees();

        // Afficher une confirmation
        alert('Demande d\'accs refuse');
      }

      console.log(' DMP: === FIN REFUS DEMANDE D\'ACCS ===');
    } catch (error) {
      console.error(' DMP: Erreur lors du refus:', error);
      console.error(' DMP: Stack trace:', error.stack);
      alert(`Erreur lors du refus de la demande d'accs: ${error.message}`);
    }
  };

  // Fonctions pour la gnration de PDF de fiche d'urgence
  const handleGenerateUrgencyCardPDF = async () => {
    try {
      const patientData = {
        nom_complet: patientProfile ? `${patientProfile.prenom || ''} ${patientProfile.nom || 
''}`.trim() : 'N/A',
        numero_dossier: patientProfile?.numero_dossier || patientProfile?.id,
        date_naissance: patientProfile?.date_naissance,
        telephone: patientProfile?.telephone,
        groupe_sanguin: tableauDeBord?.patient?.groupe_sanguin,
        allergies: tableauDeBord?.patient?.allergies,
        maladies_chroniques: tableauDeBord?.patient?.maladies_chroniques,
        id_patient: patientProfile?.id_patient || patientProfile?.id,
        qrCode: tableauDeBord?.patient?.qrCode // Si disponible
      };

      const result = await generateUrgencyCardPDF(patientData);
      if (result.success) {
        alert(`Fiche d'urgence PDF gnre avec succs: ${result.filename}`);
      } else {
        alert(`Erreur lors de la gnration: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la gnration de la fiche d\'urgence PDF:', error);
      alert('Erreur lors de la gnration de la fiche d\'urgence PDF');
    }
  };

  const handlePrintUrgencyCardPDF = async () => {
    try {
      const patientData = {
        nom_complet: patientProfile ? `${patientProfile.prenom || ''} ${patientProfile.nom || 
''}`.trim() : 'N/A',
        numero_dossier: patientProfile?.numero_dossier || patientProfile?.id,
        date_naissance: patientProfile?.date_naissance,
        telephone: patientProfile?.telephone,
        groupe_sanguin: tableauDeBord?.patient?.groupe_sanguin,
        allergies: tableauDeBord?.patient?.allergies,
        maladies_chroniques: tableauDeBord?.patient?.maladies_chroniques,
        id_patient: patientProfile?.id_patient || patientProfile?.id,
        qrCode: tableauDeBord?.patient?.qrCode // Si disponible
      };

      const result = await printUrgencyCardPDF(patientData);
      if (result.success) {
        alert('Impression de la fiche d\'urgence lance avec succs');
      } else {
        alert(`Erreur lors de l'impression: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'impression de la fiche d\'urgence:', error);
      alert('Erreur lors de l\'impression de la fiche d\'urgence');
    }
  };

  // Fonction pour marquer une notification comme lue
  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
  console.log(`DMP: Marquage de la notification comme lue (handleMarkNotificationAsRead), ID: ${notificationId}`);

      await dmpApi.marquerNotificationDroitsAccesLue(notificationId);

  console.log('DMP: Notification marquée comme lue avec succès (handleMarkNotificationAsRead)');

      // Mettre  jour la liste des notifications
      setNotificationsDroitsAcces(prev =>
        prev.map(notif =>
          notif.id_notification === notificationId
            ? { ...notif, statut_envoi: 'envoyee' }
            : notif
        )
      );

      // Afficher une confirmation
  alert('Notification marquée comme lue');

    } catch (error) {
  console.error('DMP: Erreur lors du marquage de la notification (handleMarkNotificationAsRead):', error);
      alert(`Erreur lors du marquage de la notification: ${error.message}`);
    }
  };



  // Vrifier les nouvelles notifications priodiquement
  // Utiliser le hook useNotifications pour gérer les notifications avec rate limiting
  const patientId = dmpContext?.state?.patientId;
  const { notifications, loading: notificationsLoading, error: notificationsError } = useNotifications(patientId, {
    interval: 60000, // 1 minute au lieu de 30 secondes
    maxRetries: 2,
    onError: (error) => {
      if (error?.response?.status === 429) {
        console.warn('⚠️ Rate limit atteint pour les notifications, utilisation du cache');
      }
    }
  });

  // Effet pour traiter les nouvelles notifications
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const unreadNotifications = notifications.filter(n => n.statut_envoi === 'en_attente');
      if (unreadNotifications.length > 0) {
        const latestNotification = unreadNotifications[0];
        showNotificationToast(latestNotification);
      }
    }
  }, [notifications]);

  // Fonction pour obtenir l'icne selon le type de notification
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'demande_validation':
        return <FaUserShield className="text-orange-600" />;
      case 'acces_autorise':
        return <FaCheck className="text-green-600" />;
      case 'acces_refuse':
        return <FaTimes className="text-red-600" />;
      default:
        return <FaBell className="text-gray-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'demande_validation':
        return 'bg-orange-50 border-orange-200';
      case 'acces_autorise':
        return 'bg-green-50 border-green-200';
      case 'acces_refuse':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (type) => {
    switch (type) {
      case 'demande_validation':
        return 'Demande en attente';
      case 'acces_autorise':
        return 'Accs autoris';
      case 'acces_refuse':
        return 'Accs refus';
      default:
        return 'Notification';
    }
  };

  const handleAutoMesureSubmit = async (e) => {
    e.preventDefault();
    
    // Logs de dbogage pour le contexte DMP
    console.log(' tat du contexte DMP:', { createAutoMesure, uploadDocument });
    console.log(' Patient connect depuis localStorage:', getStoredPatient());
    
    if (!autoMesure.valeur || !autoMesure.type_mesure) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      // Prparer les donnes selon le type de mesure
      const mesureData = {
        ...autoMesure,
        valeur_formatee: autoMesure.type_mesure === 'tension_arterielle'
          ? `${autoMesure.valeur}/${autoMesure.valeur_secondaire} ${autoMesure.unite}`
          : `${autoMesure.valeur} ${autoMesure.unite}`,
        date_complete: `${autoMesure.date_mesure}  ${autoMesure.heure_mesure}`
      };

      console.log('Mesure  enregistrer:', mesureData);

      // Utiliser le contexte DMP pour crer l'auto-mesure
      const response = await createAutoMesure(mesureData);

      // Vrifier que la rponse contient des donnes valides
      if (response && (response.data || response.id_dossier || response.numeroDossier)) {
        console.log(' Auto-mesure cre avec succs via contexte:', response);

        setShowAutoMesureModal(false);

        // Rinitialiser le formulaire
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

        alert('Mesure enregistre avec succs !');
      } else {
        console.warn(' Rponse de l\'API inattendue:', response);
        throw new Error('Rponse invalide de l\'API - structure de donnes inattendue');
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
      alert('Veuillez slectionner un fichier et saisir un titre');
      return;
    }

    try {
      setLoading(true);
      // Construction des donnes pour l'upload
      const documentData = {
        file: uploadFile,
        description: uploadTitle,
        type: 'general', // ou  adapter selon le formulaire
        categorie: 'general', // ou  adapter selon le formulaire
      };
      await uploadDocument(documentData);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      alert('Document upload avec succs !');
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      alert("Erreur lors de l'upload du document: " + (error.message || ""));
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
        alert('Le fichier est trop volumineux. Taille maximale autorise : 10MB');
        e.target.value = ''; // Rinitialiser l'input
        return;
      }

      // Avertissement si le fichier est proche de la limite
      if (file.size > warningSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const remainingMB = (10 - fileSizeMB).toFixed(1);
        alert(`Attention : Votre fichier fait ${fileSizeMB}MB. Il reste ${remainingMB}MB disponibles 
sur la limite de 10MB.`);
      }

      // Validation du type de fichier autoris
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 
'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Type de fichier non autoris. Types accepts : JPG, PNG, GIF, PDF, TXT, DOC, DOCX');
        e.target.value = ''; // Rinitialiser l'input
        return;
      }

      setUploadFile(file);
    }
  };







  // Configuration spcifique pour chaque type de mesure
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
        description: 'Votre taille en centimtres'
      },
      tension_arterielle: {
        label: 'Tension artrielle',
        icon: FaHeartbeat,
        color: 'text-red-500',
        bgColor: 'bg-red-100',
        unite: 'mmHg',
        placeholder_systolique: 'Ex: 120',
        placeholder_diastolique: 'Ex: 80',
        min: 50,
        max: 300,
        step: 1,
        description: 'Votre tension artrielle (systolique/diastolique)',
        hasSecondValue: true
      },
      glycemie: {
        label: 'Glycmie',
        icon: FaTint,
        color: 'text-purple-500',
        bgColor: 'bg-purple-100',
        unite: 'mg/dL',
        placeholder: 'Ex: 95',
        min: 20,
        max: 600,
        step: 1,
        description: 'Votre taux de glycmie'
      },
      temperature: {
        label: 'Temprature',
        icon: FaThermometerHalf,
        color: 'text-orange-500',
        bgColor: 'bg-orange-100',
        unite: 'C',
        placeholder: 'Ex: 36.8',
        min: 30,
        max: 45,
        step: 0.1,
        description: 'Votre temprature corporelle'
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
        description: 'Votre saturation en oxygne'
      }
    };
    return configs[type] || configs.poids;
  };

  // Rinitialiser le formulaire quand le type change
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

  // Validation spcifique selon le type supprime : validateMesure

  // Rendu du composant
  if (loading && !tableauDeBord) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Vrification de scurit pour le contexte DMP
  if (!dmpContext || !dmpState) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600 p-4">
        <p className="text-lg font-medium mb-4">Erreur de contexte DMP</p>
        <p className="mb-4">Le contexte DMP n'est pas disponible. Vrifiez que le composant est dans 
un DMPProvider.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Ressayer
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600 p-4">
        <p className="text-lg font-medium mb-4">Erreur lors du chargement des donnes</p>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Ressayer
        </button>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50">
      {/* Notification en temps rel */}
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
                Dossier Mdical Partag
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Gestionnaire de notifications de rendez-vous */}
              <NotificationManager />

              {/* Rejoindre une conférence */}
              {patientProfile && (
                <button
                  onClick={handleOpenJoinConference}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  <FaVideo className="mr-2" />
                  Rejoindre conférence
                </button>
              )}
              
              <button
                onClick={() => setShowAutoMesureModal(true)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md 
hover:bg-blue-700"
              >
                <FaPlus className="mr-2" />
                Auto-mesure
              </button>

              {/* Indicateur de notifications des droits d'accs */}
              {notificationsDroitsAcces.filter(n => n.statut_envoi === 'en_attente').length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setActiveTab('droits-acces')}
                    className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-md 
hover:bg-orange-700"
                  >
                    <FaBell className="mr-2" />
                    Notifications
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {notificationsDroitsAcces.filter(n => n.statut_envoi === 'en_attente').length}
                    </span>
                  </button>
                </div>
              )}

              {activeTab === 'mon-espace-sante' && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md 
hover:bg-green-700"
                >
                  <FaUpload className="mr-2" />
                  Upload Document
                </button>
              )}

              {/* Profil utilisateur */}
              <div className="relative profile-menu-container">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-gray-900 
hover:bg-gray-100 rounded-md transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center 
text-white font-medium">
                    {patientProfile ?
                      `${patientProfile.prenom?.charAt(0) || ''}${patientProfile.nom?.charAt(0) || 
''}` :
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

                {/* Menu droulant du profil */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 
border">
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
                    {patientProfile && (
                      <button
                        onClick={() => {
                          console.log('🧪 Test de la messagerie pour le patient:', patientProfile.id_patient);
                          setShowMessagingTest(!showMessagingTest);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 
hover:bg-gray-100 flex items-center"
                      >
                        <FaComments className="mr-2" />
                        {showMessagingTest ? 'Masquer' : 'Test'} Messagerie
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 
hover:bg-gray-100 flex items-center"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Dconnexion
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
              { id: 'mon-espace-sante', label: 'Mon espace de sant', icon: FaHeartbeat },
              { id: 'historique', label: 'Historique mdical', icon: FaFileMedical },
              {
                id: 'droits-acces',
                label: 'Droits d\'accs',
                icon: FaShieldAlt,
                badge: notificationsDroitsAcces.filter(n => n.statut_envoi === 'en_attente').length > 
0 ? notificationsDroitsAcces.filter(n => n.statut_envoi === 'en_attente').length : null
              },
              { id: 'rappels', label: 'Rappels', icon: FaBell },
              { id: 'urgence', label: 'Fiche d\'urgence', icon: FaQrcode },
              { id: 'bibliotheque', label: 'Bibliothque', icon: FaBook }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm relative 
${activeTab === tab.id
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

      {/* Widget de test de la messagerie */}
      {showMessagingTest && patientProfile && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-800">🧪 Test de la Messagerie</h3>
              <button
                onClick={() => setShowMessagingTest(false)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                × Fermer
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-gray-800 mb-2">MessagingButton</h4>
                <MessagingButton
                  userId={patientProfile.id_patient || patientProfile.id}
                  role="patient"
                  token={localStorage.getItem('jwt') || localStorage.getItem('token')}
                  conversationId={null}
                  onClick={() => handleOpenMessaging(null)}
                  unreadCount={0}
                />
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-gray-800 mb-2">MessagingWidget</h4>
                <MessagingWidget
                  userId={patientProfile.id_patient || patientProfile.id}
                  role="patient"
                  token={localStorage.getItem('jwt') || localStorage.getItem('token')}
                  conversationId={null}
                  onClose={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interface de messagerie principale */}
      {showMessagingInterface && patientProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold">
                  💬 Messagerie - {patientProfile.prenom} {patientProfile.nom}
                </h3>
              </div>
              <button
                onClick={handleCloseMessaging}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatMessage
                userId={patientProfile.id_patient || patientProfile.id}
                role="patient"
                token={localStorage.getItem('jwt') || localStorage.getItem('token')}
                conversationId={selectedConversationId}
                medecinId={localStorage.getItem('currentMedecinId')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Interface d'appel entrant WebRTC */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <FaVideo className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Appel {incomingCall.type === 'video' || incomingCall.type === 'audio_video' ? 'Vidéo' : 'Audio'} Entrant
              </h3>
              <p className="text-gray-600 mb-4">
                Appel de {incomingCall.callerName || 'Médecin'}
              </p>
              <div className="text-sm text-gray-500 mb-6">
                <p>Session ID: {incomingCall.sessionId}</p>
                <p>Type: {incomingCall.type}</p>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleAcceptCall(incomingCall)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <FaCheck className="w-4 h-4" />
                <span>Accepter</span>
              </button>
              <button
                onClick={() => handleRejectCall(incomingCall)}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <FaTimes className="w-4 h-4" />
                <span>Refuser</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interface d'appel WebRTC actif */}
      {activeCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Appel {activeCall.type === 'video' || activeCall.type === 'audio_video' ? 'Vidéo' : 'Audio'} - {activeCall.callerName || 'Médecin'}
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  callStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                  callStatus === 'connected' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {callStatus === 'connecting' ? 'Connexion...' :
                   callStatus === 'connected' ? 'Connecté' : 'En cours'}
                </span>
                <button
                  onClick={handleEndCall}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  title="Terminer l'appel"
                >
                  Terminer
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Flux vidéo local */}
              {activeCall.type === 'video' || activeCall.type === 'audio_video' ? (
                <>
                  {localStream && (
                    <div className="bg-gray-900 rounded-lg overflow-hidden">
                      <video
                        ref={(video) => {
                          if (video) {
                            video.srcObject = localStream;
                            video.play();
                          }
                        }}
                        className="w-full h-64 object-cover"
                        muted
                        autoPlay
                        playsInline
                      />
                      <div className="p-3 bg-gray-800 text-white text-center">
                        <p className="text-sm">Votre caméra</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Flux vidéo distant (placeholder pour l'instant) */}
                  <div className="bg-gray-900 rounded-lg overflow-hidden">
                    <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
                      <div className="text-center text-white">
                        <FaUser className="w-16 h-16 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">En attente du médecin...</p>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-800 text-white text-center">
                      <p className="text-sm">{activeCall.callerName || 'Médecin'}</p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Session ID: {activeCall.sessionId}</p>
              <p>Type: {activeCall.type}</p>
            </div>
          </div>
        </div>
      )}

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

        {/* Historique Mdical */}
        {activeTab === 'historique' && (
          <HistoriqueMedical 
            patientProfile={patientProfile}
            onOpenMessaging={handleOpenMessaging}
          />
        )}

        {/* Droits d'Accs */}
        {activeTab === 'droits-acces' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Gestion des droits d'accès</h2>
              <p className="text-gray-600">Contrôlez qui peut accéder à votre dossier médical</p>
            </div>

            {/* Debug: Afficher l'état des notifications */}
            {console.log('🔍 État des notifications dans le rendu:', notificationsDroitsAcces)}

            {/* Section des notifications améliorée */}
            {getNotificationsToDisplay().length > 0 && (
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
                        {getNotificationsToDisplay().filter(n => n.statut_envoi === 'en_attente').length} nouvelle(s) demande(s) en attente
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
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
                </div>

                <div className="space-y-4">
                  {getNotificationsToDisplay().map((notification, index) => (
                    <div key={index} className={`border rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${getNotificationColor(notification.type_notification)} ${notification.statut_envoi === 'en_attente' ? 'ring-2 ring-blue-200' : ''}`}>
                      <div className="flex items-start space-x-4">
                        {/* Icône de statut */}
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${notification.type_notification === 'demande_validation' ? 'bg-orange-100' : notification.type_notification === 'acces_autorise' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {getNotificationIcon(notification.type_notification)}
                          </div>
                        </div>

                        {/* Contenu de la notification */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900">{notification.titre}</h4>
                              {notification.statut_envoi === 'en_attente' && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                                  Nouveau
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${notification.type_notification === 'demande_validation' ? 'bg-orange-100 text-orange-800' : notification.type_notification === 'acces_autorise' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {getStatusText(notification.type_notification)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {notification.statut_envoi === 'en_attente' && (
                                <button
                                  onClick={() => handleMarquerNotificationLue(notification.id_notification)}
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
                            {notification.type_notification === 'demande_validation' && (
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleRepondreDemandeAcces(notification, 'accepter')}
                                  className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Autoriser l'accès
                                </button>
                                <button
                                  onClick={() => handleRepondreDemandeAcces(notification, 'refuser')}
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
            {getNotificationsToDisplay().length === 0 && (
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

            {/* Section des autorisations avec le nouveau composant */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Gestion des autorisations DMP</h3>
                  <p className="text-sm text-gray-600">Contrôlez l'accès à votre dossier médical</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate('/patient/autorisations')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <FaShieldAlt className="w-4 h-4 mr-2" />
                    Gérer les autorisations
                  </button>
                </div>
              </div>

              <AutorisationsEnAttente />
            </div>

            {/* Section de l'historique des accès DMP */}
            <div className="p-6 border-t border-gray-200">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Historique des accès DMP</h3>
                    <p className="text-sm text-gray-600">Suivez qui a consulté votre dossier médical et quand</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
                      🔒 Accès sécurisé
                    </span>
                  </div>
                </div>
              </div>

              {/* Composant DMPHistory pour afficher l'historique des accès */}
              <DMPHistory patientId={patientProfile?.id_patient || patientProfile?.id} />
            </div>

            {/* Section des accès refusés et expirés */}
            <div className="p-6 border-t border-gray-200">
              {/* Debug: Afficher les données des droits d'accès */}
              {console.log('🔍 Droits d\'accès complets:', droitsAcces)}
              {console.log('🔍 Droits d\'accès refusés:', droitsAcces.filter(acc => acc.statut === 'refuse' || acc.statut === 'refused' || acc.status === 'refuse' || acc.status === 'refused'))}
              {console.log('🔍 Droits d\'accès expirés:', droitsAcces.filter(acc => acc.statut === 'expire' || acc.status === 'expire' || (acc.date_fin && new Date(acc.date_fin) < new Date()) || (acc.end_date && new Date(acc.end_date) < new Date())))}
              {console.log('🔍 Droits d\'accès révoqués:', droitsAcces.filter(acc => acc.statut === 'revoke' || acc.statut === 'revoked' || acc.status === 'revoke' || acc.status === 'revoked'))}

              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Historique des accès</h3>
                    <p className="text-sm text-gray-600">Accès refusés et expirés</p>
                  </div>
                  <button
                    onClick={rafraichirDroitsAcces}
                    className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Rafraîchir
                  </button>
                </div>
              </div>

              {/* Accès refusés */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                  <FaTimes className="w-4 h-4 text-red-500 mr-2" />
                  Accès refusés ({droitsAcces.filter(acc => acc.statut === 'refuse' || acc.statut === 'refused' || acc.status === 'refuse' || acc.status === 'refused').length})
                </h4>
                {droitsAcces.filter(acc => acc.statut === 'refuse' || acc.statut === 'refused' || acc.status === 'refuse' || acc.status === 'refused').length > 0 ? (
                  <div className="space-y-3">
                    {droitsAcces.filter(acc => acc.statut === 'refuse' || acc.statut === 'refused' || acc.status === 'refuse' || acc.status === 'refused').map((acces, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">
                                {acces.nom_professionnel || acces.nom || acces.professional_name || 'Nom non spécifié'} {acces.prenom_professionnel || acces.prenom || acces.professional_firstname || ''}
                              </span>
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                                Refusé
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {acces.specialite || acces.speciality || 'Spécialité non spécifiée'}
                            </p>
                            {acces.raison_refus && (
                              <p className="text-sm text-red-600">
                                Raison: {acces.raison_refus}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Refusé le: {new Date(acces.date_refus || acces.date_modification || acces.updated_at || acces.created_at).toLocaleDateString('fr-FR')}
                            </p>
                            {/* Debug: Afficher toutes les clés disponibles */}
                            <details className="mt-2">
                              <summary className="text-xs text-gray-400 cursor-pointer">Voir les données complètes</summary>
                              <pre className="text-xs text-gray-500 mt-1 bg-gray-100 p-2 rounded">
                                {JSON.stringify(acces, null, 2)}
                              </pre>
                            </details>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Aucun accès refusé</p>
                    <p className="text-xs text-gray-400 mt-1">Total des droits d'accès: {droitsAcces.length}</p>
                  </div>
                )}
              </div>

              {/* Accès expirés */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                  <FaTimes className="w-4 h-4 text-orange-500 mr-2" />
                  Accès expirés ({droitsAcces.filter(acc => acc.statut === 'expire' || acc.status === 'expire' || (acc.date_fin && new Date(acc.date_fin) < new Date()) || (acc.end_date && new Date(acc.end_date) < new Date())).length})
                </h4>
                {droitsAcces.filter(acc => acc.statut === 'expire' || acc.status === 'expire' || (acc.date_fin && new Date(acc.date_fin) < new Date()) || (acc.end_date && new Date(acc.end_date) < new Date())).length > 0 ? (
                  <div className="space-y-3">
                    {droitsAcces.filter(acc => acc.statut === 'expire' || acc.status === 'expire' || (acc.date_fin && new Date(acc.date_fin) < new Date()) || (acc.end_date && new Date(acc.end_date) < new Date())).map((acces, index) => (
                      <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">
                                {acces.nom_professionnel || acces.nom || acces.professional_name || 'Nom non spécifié'} {acces.prenom_professionnel || acces.prenom || acces.professional_firstname || ''}
                              </span>
                              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                                Expiré
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {acces.specialite || acces.speciality || 'Spécialité non spécifiée'}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Expiré le: {new Date(acces.date_fin || acces.end_date || acces.date_modification || acces.updated_at || acces.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Aucun accès expiré</p>
                  </div>
                )}
              </div>

              {/* Accès révoqués */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                  <FaTimes className="w-4 h-4 text-gray-500 mr-2" />
                  Accès révoqués ({droitsAcces.filter(acc => acc.statut === 'revoke' || acc.statut === 'revoked' || acc.status === 'revoke' || acc.status === 'revoked').length})
                </h4>
                {droitsAcces.filter(acc => acc.statut === 'revoke' || acc.statut === 'revoked' || acc.status === 'revoke' || acc.status === 'revoked').length > 0 ? (
                  <div className="space-y-3">
                    {droitsAcces.filter(acc => acc.statut === 'revoke' || acc.statut === 'revoked' || acc.status === 'revoke' || acc.status === 'revoked').map((acces, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">
                                {acces.nom_professionnel || acces.nom || acces.professional_name || 'Nom non spécifié'} {acces.prenom_professionnel || acces.prenom || acces.professional_firstname || ''}
                              </span>
                              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">
                                Révoqué
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {acces.specialite || acces.speciality || 'Spécialité non spécifiée'}
                            </p>
                            {acces.raison_revocation && (
                              <p className="text-sm text-gray-600">
                                Raison: {acces.raison_revocation}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Révoqué le: {new Date(acces.date_revocation || acces.date_modification || acces.updated_at || acces.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Aucun accès révoqué</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rappels */}
        {activeTab === 'rappels' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Rappels et Rendez-vous</h2>
              <p className="text-gray-600">Consultez vos rendez-vous programmés et vos rappels médicaux</p>
            </div>
            
            {/* Section des rendez-vous programmés */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <FaCalendar className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Rendez-vous programmés
                    </h3>
                    <p className="text-sm text-gray-600">
                      Planning établi par votre médecin traitant
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => loadTabData('rappels')}
                  className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualiser
                </button>
              </div>

              {/* Affichage des rendez-vous */}
              {rappels && rappels.length > 0 ? (
                <div className="space-y-4">
                  {rappels.map((rendezVous, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <FaCalendar className="text-blue-600" />
                            </div>
                            <div>
                                                          <h4 className="font-medium text-gray-900">
                              Rendez-vous du {formatDateRappels(rendezVous.date || rendezVous.date_rdv || rendezVous.appointmentDate)}
                            </h4>
                              <p className="text-sm text-gray-600">
                                {rendezVous.heure || rendezVous.heure_rdv || rendezVous.appointmentTime || 'Heure non spécifiée'}
                              </p>
                            </div>
                            <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                              (rendezVous.statut || rendezVous.status || 'programme').toLowerCase() === 'confirme' || (rendezVous.statut || rendezVous.status || 'programme').toLowerCase() === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : (rendezVous.statut || rendezVous.status || 'programme').toLowerCase() === 'annule' || (rendezVous.statut || rendezVous.status || 'programme').toLowerCase() === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {rendezVous.statut || rendezVous.status || 'Programmé'}
                            </span>
                          </div>

                          {/* Informations du rendez-vous */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <span className="text-xs font-medium text-gray-600">Motif :</span>
                              <p className="text-sm text-gray-800 mt-1">
                                {rendezVous.motif || rendezVous.raison || rendezVous.reason || 'Consultation médicale'}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-600">Type :</span>
                              <p className="text-sm text-gray-800 mt-1">
                                {rendezVous.type_rdv || rendezVous.type || rendezVous.appointmentType || 'Consultation'}
                              </p>
                            </div>
                          </div>

                          {/* Informations du médecin */}
                          {(rendezVous.medecin || rendezVous.professionnel) && (
                            <div className="bg-white p-3 rounded-md border border-blue-200 mb-3">
                              <span className="text-xs font-medium text-gray-600">Médecin :</span>
                              <p className="text-sm text-gray-800 mt-1">
                                Dr. {(rendezVous.professionnel?.prenom || rendezVous.medecin?.prenom || rendezVous.medecin?.firstName || '')} {(rendezVous.professionnel?.nom || rendezVous.medecin?.nom || rendezVous.medecin?.lastName || '')}
                                {(rendezVous.professionnel?.specialite || rendezVous.medecin?.specialite || rendezVous.medecin?.speciality) && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({(rendezVous.professionnel?.specialite || rendezVous.medecin?.specialite || rendezVous.medecin?.speciality)})
                                  </span>
                                )}
                              </p>
                            </div>
                          )}

                          {/* Informations du service */}
                          {(rendezVous.service || rendezVous.ServiceSante) && (
                            <div className="bg-white p-3 rounded-md border border-blue-200 mb-3">
                              <span className="text-xs font-medium text-gray-600">Service :</span>
                              <p className="text-sm text-gray-800 mt-1">
                                {(rendezVous.ServiceSante?.nom || rendezVous.service?.nom || rendezVous.service?.name || 'Service non spécifié')}
                                {(rendezVous.ServiceSante?.code || rendezVous.service?.code) && (
                                  <span className="text-xs text-gray-500 ml-2 font-mono">
                                    ({(rendezVous.ServiceSante?.code || rendezVous.service?.code)})
                                  </span>
                                )}
                              </p>
                            </div>
                          )}

                          {/* Notes et instructions */}
                          {(rendezVous.notes || rendezVous.instructions || rendezVous.commentaires) && (
                            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                              <span className="text-xs font-medium text-yellow-700">Notes :</span>
                              <p className="text-sm text-yellow-800 mt-1">
                                {rendezVous.notes || rendezVous.instructions || rendezVous.commentaires}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-blue-200">
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>📅 Créé le : {formatDateRappels(rendezVous.createdAt || rendezVous.date_creation)}</span>
                              {rendezVous.updatedAt && (
                                <span>🔄 Modifié le : {formatDateRappels(rendezVous.updatedAt)}</span>
                              )}
                            </div>
                            
                            <div className="flex space-x-2">
                              {/* Bouton pour ouvrir la messagerie avec le médecin */}
                              {(rendezVous.medecin || rendezVous.professionnel) && (rendezVous.professionnel?.id_professionnel || rendezVous.medecin?.id || rendezVous.medecin?.id_professionnel || rendezVous.medecin?.id_medecin) && (
                                <button
                                  onClick={() => {
                                    const medecinId = rendezVous.professionnel?.id_professionnel || rendezVous.medecin?.id || rendezVous.medecin?.id_professionnel || rendezVous.medecin?.id_medecin;
                                    handleOpenMessaging(null, medecinId);
                                  }}
                                  className="flex items-center px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                  title="Contacter le médecin"
                                >
                                  <FaComments className="w-3 h-3 mr-1" />
                                  Contacter
                                </button>
                              )}
                              
                              {/* Bouton pour voir les détails */}
                              <button
                                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                title="Voir les détails"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Détails
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCalendar className="text-gray-400 text-xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous programmé</h3>
                  <p className="text-gray-600">
                    Vous n'avez actuellement aucun rendez-vous programmé par votre médecin traitant.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Les rendez-vous apparaîtront ici une fois programmés par votre médecin.
                  </p>
                </div>
              )}
            </div>

            {/* Section des rappels médicaux (existante) */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <FaBell className="text-green-600 text-lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Rappels médicaux
                    </h3>
                    <p className="text-sm text-gray-600">
                      Rappels pour vos traitements et examens
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenu des rappels existant */}
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBell className="text-gray-400 text-xl" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Fonctionnalité en développement</h3>
                <p className="text-gray-600">
                  La gestion des rappels médicaux sera bientôt disponible.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mon Espace de Sant */}
        {activeTab === 'mon-espace-sante' && (
          <DMPMonEspaceSante />
        )}

        {/* Fiche d'Urgence */}
        {activeTab === 'urgence' && (
          <div className="bg-white rounded-lg shadow">
            ...existing code...
          </div>
        )}

        {/* Bibliothque */}
        {activeTab === 'bibliotheque' && (
          <div className="bg-white rounded-lg shadow">
            ...existing code...
          </div>
        )}
  </main>

      {/* Modal Auto-mesure */}
      {showAutoMesureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 
p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md md:max-w-lg 
lg:max-w-xl xl:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ajouter une auto-mesure</h3>
              <button
                onClick={() => setShowAutoMesureModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                
              </button>
            </div>

            <form onSubmit={handleAutoMesureSubmit}>
              {(() => {
                const config = getMesureConfig(autoMesure.type_mesure);
                const Icon = config.icon;

                return (
                  <div className="space-y-6">
                    {/* En-tte avec icne et description */}
                    <div className={`p-4 ${config.bgColor} rounded-lg`}>
                      <div className="flex items-center mb-2">
                        <Icon className={`mr-3 ${config.color} text-xl`} />
                        <h4 className="font-medium text-gray-900">{config.label}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>

                    {/* Slection du type de mesure */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type de 
mesure</label>
                      <select
                        value={autoMesure.type_mesure}
                        onChange={(e) => handleTypeMesureChange(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 
focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="poids">Poids</option>
                        <option value="taille">Taille</option>
                        <option value="tension_arterielle">Tension artrielle</option>
                        <option value="glycemie">Glycmie</option>
                        <option value="temperature">Temprature</option>
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
                              onChange={(e) => setAutoMesure({ ...autoMesure, valeur: e.target.value 
})}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 
focus:ring-blue-500 focus:border-blue-500"
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
                              onChange={(e) => setAutoMesure({ ...autoMesure, valeur_secondaire: 
e.target.value })}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 
focus:ring-blue-500 focus:border-blue-500"
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
                            onChange={(e) => setAutoMesure({ ...autoMesure, valeur: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 
focus:ring-blue-500 focus:border-blue-500"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de 
mesure</label>
                        <input
                          type="date"
                          value={autoMesure.date_mesure}
                          onChange={(e) => setAutoMesure({ ...autoMesure, date_mesure: e.target.value 
})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 
focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Heure de 
mesure</label>
                        <input
                          type="time"
                          value={autoMesure.heure_mesure}
                          onChange={(e) => setAutoMesure({ ...autoMesure, heure_mesure: 
e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 
focus:ring-blue-500 focus:border-blue-500"
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
                        onChange={(e) => setAutoMesure({ ...autoMesure, commentaire: e.target.value 
})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 
focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Ajoutez un commentaire sur cette mesure..."
                      />
                    </div>

                    {/* Informations de validation */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Plage de valeurs acceptes :</strong> {config.min} - {config.max} 
{config.unite}
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
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 border 
border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md 
hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 
p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md md:max-w-lg 
max-h-[90vh] overflow-y-auto">
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
                        <strong>Fichier slectionn :</strong> {uploadFile.name}
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>Taille :</strong> {(uploadFile.size / (1024 * 1024)).toFixed(2)}MB
                        {uploadFile.size > 8 * 1024 * 1024 && (
                          <span className="text-orange-600 font-medium"> (Proche de la limite de 
10MB)</span>
                        )}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Limite maximale : 10MB | Types accepts : JPG, PNG, GIF, PDF, TXT, DOC, DOCX
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 border 
border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md 
hover:bg-green-700 transition-colors"
                >
                  Uploader
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rejoindre une conférence */}
      {showJoinConferenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseJoinConference}>
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md md:max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Rejoindre une conférence</h3>
              <button onClick={handleCloseJoinConference} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien de conférence</label>
                <input
                  type="url"
                  value={conferenceLink}
                  onChange={(e) => { setConferenceLink(e.target.value); setConferenceError(null); }}
                  placeholder="https://..."
                  className={`w-full p-3 border rounded-md ${conferenceError ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                />
                {conferenceError && (
                  <p className="text-xs text-red-600 mt-1">{conferenceError}</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseJoinConference}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleJoinConference}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Rejoindre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Protection 2FA pour l'accs aux dossiers patients */}
      {show2FA && requires2FA && (
        <Validate2FA
          onSuccess={handle2FASuccess}
          onCancel={handle2FACancel}
          isRequired={true}
          message="Vrification 2FA requise pour accder aux dossiers patients"
        />
      )}

      {/* Composant de test WebSocket ct patient */}
  {/* supprim : PatientMessagingTest */}

    </div>
  );
}

// Composant wrapper avec protection
const DMPProtected = () => (
  <ProtectedPatientRoute>
    <DMP />
  </ProtectedPatientRoute>
);

export default DMPProtected; 




