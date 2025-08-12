import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaUser, FaFileMedical, FaShieldAlt, 
  FaUpload, FaBell, FaQrcode, FaBook, FaChartBar,
  FaSignOutAlt, FaPlus, FaDownload,
  FaHeartbeat, FaPills, FaThermometerHalf, FaWeight,
  FaTint, FaPrint, FaUserShield, FaCheck, FaTimes
} from "react-icons/fa";
import { ProtectedPatientRoute } from "../services/api/protectedRoute";
import { logoutPatient, getStoredPatient } from "../services/api/authApi";
import { DMPProvider } from "../context/DMPContext";
import { useDMP } from "../hooks/useDMP";
import DMPDashboard from "../components/dmp/DMPDashboard";
import DMPMonEspaceSante from "../components/dmp/DMPMonEspaceSante";
import DMPNotification from "../components/ui/DMPNotification";
import AutorisationsEnAttente from "../components/dmp/AutorisationsEnAttente";
import * as dmpApi from "../services/api/dmpApi";
import * as patientApi from "../services/api/patientApi";

// Composant HistoriqueMedical qui utilise les fonctions de patientApi
const HistoriqueMedical = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [patientId, setPatientId] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer l'ID du patient connecté
      const storedPatient = getStoredPatient();
      const currentPatientId = storedPatient?.id_patient || storedPatient?.id;
      
      if (!currentPatientId) {
        throw new Error('ID du patient non disponible');
      }

      setPatientId(currentPatientId);
      
      // Charger toutes les prescriptions du patient
      const result = await patientApi.getAllPrescriptionsByPatient(currentPatientId);
      
      if (result.success) {
        setPrescriptions(result.prescriptions || []);
        setStats(result.stats);
        console.log('✅ Historique médical chargé:', result.prescriptions.length, 'prescriptions');
      } else {
        throw new Error(result.message || 'Erreur lors du chargement des prescriptions');
      }

    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'historique médical:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (filter) => {
    try {
      setLoading(true);
      setActiveFilter(filter);
      
      let result;
      switch (filter) {
        case 'all':
          result = await patientApi.getAllPrescriptionsByPatient(patientId);
          break;
        case 'active':
          result = await patientApi.getActivePrescriptionsByPatient(patientId);
          break;
        case 'ordonnances':
          result = await patientApi.getOrdonnancesByPatient(patientId);
          break;
        case 'examens':
          result = await patientApi.getExamensByPatient(patientId);
          break;
        default:
          result = await patientApi.getAllPrescriptionsByPatient(patientId);
      }

      if (result.success) {
        setPrescriptions(result.prescriptions || []);
        setStats(result.stats);
      } else {
        throw new Error(result.message || 'Erreur lors du filtrage');
      }

    } catch (error) {
      console.error('❌ Erreur lors du filtrage:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
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

  // Fermer le modal avec la touche Escape
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showPrescriptionModal) {
        closePrescriptionModal();
      }
    };

    if (showPrescriptionModal) {
      document.addEventListener('keydown', handleEscapeKey);
      // Empêcher le scroll du body quand le modal est ouvert
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
              Réessayer
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
                {stats.totalPrescriptions} prescription(s) au total
              </p>
            )}
          </div>
          
          {/* Statistiques rapides */}
          {stats && (
            <div className="flex flex-wrap gap-2">
              {stats.parType && Object.entries(stats.parType).map(([type, count]) => (
                <span key={type} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {type}: {count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Toutes', count: prescriptions.length },
            { key: 'active', label: 'Actives', count: stats?.parStatut?.active || 0 },
            { key: 'ordonnances', label: 'Ordonnances', count: stats?.parType?.ordonnance || 0 },
            { key: 'examens', label: 'Examens', count: stats?.parType?.examen || 0 }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleFilterChange(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {filter.label}
              <span className="ml-2 bg-opacity-20 bg-black text-inherit px-2 py-1 rounded-full text-xs">
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {prescriptions.length > 0 ? (
          <div className="space-y-4">
            {prescriptions.map((prescription, index) => (
              <div 
                key={index} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                onClick={() => handlePrescriptionClick(prescription)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePrescriptionClick(prescription);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Voir les détails de la prescription ${prescription.type_prescription} du ${formatDate(prescription.date_prescription)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(prescription.type_prescription)}
                      <div>
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {prescription.type_prescription === 'ordonnance' ? 'Ordonnance médicale' :
                           prescription.type_prescription === 'examen' ? 'Demande d\'examen' :
                           prescription.type_prescription === 'consultation' ? 'Consultation' :
                           prescription.type_prescription}
                          <span className="ml-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </span>
                          {/* Badge pour indiquer qu'il y a des détails */}
                          {(prescription.nom_commercial || prescription.principe_actif || prescription.dosage || prescription.medicaments || prescription.examens) && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Détails
                            </span>
                          )}
                          
                          {/* Badge pour indiquer qu'il y a un QR Code */}
                          {prescription.qrCode && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
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
                            N° {prescription.prescriptionNumber}
                          </p>
                        )}
                        <p className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                          Cliquez pour voir les détails
                        </p>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {prescription.description && (
                      <p className="text-sm text-gray-700 mb-3">{prescription.description}</p>
                    )}
                    
                    {/* Détails spécifiques selon le type de prescription */}
                    {prescription.type_prescription === 'ordonnance' && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Détails de l'ordonnance</h4>
                        {(prescription.nom_commercial || prescription.principe_actif || prescription.dosage || prescription.frequence || prescription.voie_administration || prescription.quantite || prescription.posologie || prescription.contre_indications || prescription.effets_indesirables) ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {prescription.nom_commercial && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Médicament :</span>
                                  <span className="text-sm text-blue-900 font-medium">{prescription.nom_commercial}</span>
                                </div>
                              )}
                              {prescription.principe_actif && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Principe actif :</span>
                                  <span className="text-sm text-blue-900">{prescription.principe_actif}</span>
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
                                  <span className="text-xs font-medium text-blue-700">Fréquence :</span>
                                  <span className="text-sm text-blue-900">{prescription.frequence}</span>
                                </div>
                              )}
                              {prescription.voie_administration && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Voie :</span>
                                  <span className="text-sm text-blue-900">{prescription.voie_administration}</span>
                                </div>
                              )}
                              {prescription.quantite && prescription.unite && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Quantité :</span>
                                  <span className="text-sm text-blue-900">{prescription.quantite} {prescription.unite}</span>
                                </div>
                              )}
                              
                              {prescription.forme_pharmaceutique && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Forme :</span>
                                  <span className="text-sm text-blue-900">{prescription.forme_pharmaceutique}</span>
                                </div>
                              )}
                              
                              {prescription.code_cip && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Code CIP :</span>
                                  <span className="text-sm text-blue-900 font-mono">{prescription.code_cip}</span>
                                </div>
                              )}
                              
                              {prescription.atc && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-700">Code ATC :</span>
                                  <span className="text-sm text-blue-900 font-mono">{prescription.atc}</span>
                                </div>
                              )}
                            </div>
                            {prescription.posologie && (
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <span className="text-xs font-medium text-blue-700">Posologie :</span>
                                <span className="text-sm text-blue-900 ml-2">{prescription.posologie}</span>
                              </div>
                            )}
                            {prescription.contre_indications && (
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <span className="text-xs font-medium text-red-700">Contre-indications :</span>
                                <span className="text-sm text-red-800 ml-2">{prescription.contre_indications}</span>
                              </div>
                            )}
                            {prescription.effets_indesirables && (
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <span className="text-xs font-medium text-orange-700">Effets indésirables :</span>
                                <span className="text-sm text-orange-800 ml-2">{prescription.effets_indesirables}</span>
                              </div>
                            )}
                            
                            {/* QR Code et informations de traitement */}
                            {(prescription.qrCode || prescription.duree_traitement || prescription.renouvelable !== null) && (
                              <div className="mt-3 pt-3 border-t border-blue-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* QR Code */}
                                  {prescription.qrCode && (
                                    <div className="flex flex-col items-center">
                                      <span className="text-xs font-medium text-blue-700 mb-2">QR Code</span>
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
                                        <span className="text-xs font-medium text-blue-700">Durée :</span>
                                        <span className="text-sm text-blue-900">{prescription.duree_traitement}</span>
                                      </div>
                                    )}
                                    {prescription.renouvelable !== null && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-blue-700">Renouvelable :</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          prescription.renouvelable 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {prescription.renouvelable ? 'Oui' : 'Non'}
                                        </span>
                                      </div>
                                    )}
                                    {prescription.nb_renouvellements > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-blue-700">Renouvellements :</span>
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
                          <p className="text-sm text-blue-600 italic">Aucun détail spécifique disponible pour cette ordonnance</p>
                        )}
                      </div>
                    )}
                    
                    {/* Médicaments (pour les prescriptions avec structure medicaments) */}
                    {prescription.medicaments && prescription.medicaments.length > 0 ? (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">Médicaments prescrits :</p>
                        <div className="space-y-2">
                          {prescription.medicaments.map((med, idx) => (
                            <div key={idx} className="p-2 bg-blue-50 rounded border border-blue-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-900">{med.nom}</span>
                                {med.quantite && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    Qté: {med.quantite}
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
                                  <span className="font-medium">Durée :</span> {med.duree}
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
                        <p className="text-xs text-gray-500 italic">Aucun médicament spécifique listé</p>
                      </div>
                    )}
                    
                    {/* Examens (pour les prescriptions avec structure examens) */}
                    {prescription.examens && prescription.examens.length > 0 ? (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">Examens demandés :</p>
                        <div className="space-y-2">
                          {prescription.examens.map((exam, idx) => (
                            <div key={idx} className="p-2 bg-green-50 rounded border border-green-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-900">{exam.nom}</span>
                                {exam.urgence && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    exam.urgence === 'urgent' 
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
                                  <span className="font-medium">Préparation :</span> {exam.preparation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : prescription.type_prescription === 'examen' && (
                      <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs text-gray-500 italic">Aucun examen spécifique listé</p>
                      </div>
                    )}
                    
                    {/* Informations complémentaires */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Première colonne - Statut et dates */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">Statut :</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.statut)}`}>
                              {prescription.statut || 'Statut inconnu'}
                            </span>
                          </div>
                          
                          {prescription.date_debut && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Début :</span>
                              <span className="text-xs text-gray-900">{formatDate(prescription.date_debut)}</span>
                            </div>
                          )}
                          
                          {prescription.date_fin && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Fin :</span>
                              <span className="text-xs text-gray-900">{formatDate(prescription.date_fin)}</span>
                            </div>
                          )}
                          
                          {prescription.date_arret && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Arrêt :</span>
                              <span className="text-xs text-gray-900">{formatDate(prescription.date_arret)}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Deuxième colonne - Médecin et établissement */}
                        <div className="space-y-2">
                          {prescription.medecin && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Médecin :</span>
                              <span className="text-xs text-gray-900">
                                Dr. {prescription.medecin.prenom} {prescription.medecin.nom}
                              </span>
                            </div>
                          )}
                          
                          {prescription.redacteur && (
                            <div className="space-y-1">
                                           <div className="flex items-center gap-2">
               <span className="text-xs font-medium text-gray-600">Rédacteur :</span>
               <span className="text-xs text-gray-900">
                 Dr. {prescription.redacteur.nom_complet || `${prescription.redacteur.prenom || ''} ${prescription.redacteur.nom || ''}`.trim() || 'N/A'}
               </span>
             </div>
                              {prescription.redacteur.specialite && (
                                <div className="flex items-center gap-2 ml-4">
                                  <span className="text-xs text-gray-500">Spécialité :</span>
                                  <span className="text-xs text-gray-700">{prescription.redacteur.specialite}</span>
                                </div>
                              )}
                              {prescription.redacteur.numero_adeli && (
                                <div className="flex items-center gap-2 ml-4">
                                  <span className="text-xs text-gray-500">N° ADELI :</span>
                                  <span className="text-xs text-gray-700 font-mono">{prescription.redacteur.numero_adeli}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {prescription.etablissement && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Établissement :</span>
                              <span className="text-xs text-gray-900">{prescription.etablissement}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Informations supplémentaires */}
                      {(prescription.instructions_speciales || prescription.pharmacieDelivrance || prescription.signatureElectronique) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                          {prescription.instructions_speciales && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-medium text-gray-600">Instructions spéciales :</span>
                              <span className="text-xs text-gray-900">{prescription.instructions_speciales}</span>
                            </div>
                          )}
                          
                          {prescription.pharmacieDelivrance && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Pharmacie de délivrance :</span>
                              <span className="text-xs text-gray-900">{prescription.pharmacieDelivrance}</span>
                            </div>
                          )}
                          
                          {prescription.signatureElectronique && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Signature électronique :</span>
                              <span className="text-xs text-gray-500 font-mono truncate">
                                {prescription.signatureElectronique.substring(0, 20)}...
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    {/* Boutons d'action principaux */}
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                        title="Télécharger"
                      >
                        <FaDownload />
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
                        title="Imprimer"
                      >
                        <FaPrint />
                      </button>
                    </div>
                    
                    {/* Boutons spécifiques au QR Code */}
                    {prescription.qrCode && (
                      <div className="flex space-x-2 pt-2 border-t border-gray-200">
                        <button 
                          className="text-purple-600 hover:text-purple-800 p-2 rounded hover:bg-purple-50 text-xs"
                          title="Télécharger QR Code"
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = prescription.qrCode;
                            link.download = `QR_${prescription.prescriptionNumber || 'prescription'}.png`;
                            link.click();
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                          </svg>
                        </button>
                        <button 
                          className="text-indigo-600 hover:text-indigo-800 p-2 rounded hover:bg-indigo-50 text-xs"
                          title="Voir QR Code en grand"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Ouvrir le QR code dans une nouvelle fenêtre
                            window.open(prescription.qrCode, '_blank');
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FaFileMedical className="text-4xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">
              Aucune prescription trouvée
            </p>
            <p className="text-gray-400">
              {activeFilter === 'all' 
                ? 'Vous n\'avez pas encore de prescriptions dans votre historique médical.'
                : `Aucune prescription de type "${activeFilter}" trouvée.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal pour afficher les détails de la prescription */}
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
                    {selectedPrescription.type_prescription === 'ordonnance' ? 'Ordonnance médicale' :
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

              {/* Médicaments */}
              {selectedPrescription.medicaments && selectedPrescription.medicaments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Médicaments prescrits</h4>
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
                                <span className="font-medium">Durée :</span> {med.duree}
                              </p>
                            )}
                          </div>
                          {med.quantite && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                              Qté: {med.quantite}
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
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Examens demandés</h4>
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
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
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
                            <span className="font-medium">Préparation :</span> {exam.preparation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informations complémentaires */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Statut et médecin */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Informations générales</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Statut :</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPrescription.statut)}`}>
                        {selectedPrescription.statut || 'Statut inconnu'}
                      </span>
                    </div>
                    {selectedPrescription.medecin && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Médecin :</span>
                        <span className="text-gray-900 font-medium">
                          Dr. {selectedPrescription.medecin.prenom} {selectedPrescription.medecin.nom}
                        </span>
                      </div>
                    )}
                    {selectedPrescription.etablissement && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Établissement :</span>
                        <span className="text-gray-900 font-medium">
                          {selectedPrescription.etablissement}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates et validité */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Dates et validité</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Date de prescription :</span>
                      <span className="text-gray-900 font-medium">
                        {formatDate(selectedPrescription.date_prescription)}
                      </span>
                    </div>
                    {selectedPrescription.date_debut && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Date de début :</span>
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
                        <span className="text-gray-600">Validité :</span>
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
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Fermer
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  title="Télécharger"
                >
                  <FaDownload />
                  Télécharger
                </button>
                <button 
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  title="Imprimer"
                >
                  <FaPrint />
                  Imprimer
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
  const [, setAutorisationsValidees] = useState([]);
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
      try {
        const tableauData = await dmpApi.getTableauDeBord();
        setTableauDeBord(tableauData.data?.tableau_de_bord);
      } catch (tableauError) {
        console.warn('⚠️ Tableau de bord non disponible:', tableauError.message);
        setTableauDeBord(null);
      }

      // Charger les notifications des droits d'accès depuis l'API réelle
      console.log('🔍 Chargement des notifications des droits d\'accès depuis l\'API...');
      try {
        // Récupérer l'ID du patient connecté
        const storedPatient = getStoredPatient();
        const patientId = storedPatient?.id_patient || storedPatient?.id;
        
        if (!patientId) {
          console.warn('⚠️ ID patient non disponible pour charger les notifications');
          setNotificationsDroitsAcces([]);
        } else {
          const pendingRequests = await dmpApi.getMedecinAccessRequests(patientId); 
          console.log('📄 Demandes reçues de l\'API:', pendingRequests);
          setNotificationsDroitsAcces(pendingRequests || []);
        }
      } catch (notificationsError) {
        console.warn('⚠️ Notifications non disponibles:', notificationsError.message);
        setNotificationsDroitsAcces([]);
      }

      // Charger les autorisations validées
      await loadAutorisationsValidees();

    } catch (error) {
      console.error('❌ Erreur lors du chargement des données initiales:', error);
      setError(`Erreur lors du chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Nouvelle fonction pour charger les autorisations validées
  const loadAutorisationsValidees = async () => {
    try {
      console.log('🔍 Chargement des autorisations validées...');
      const autorisationsData = await dmpApi.getAutorisations();
      console.log('📄 Autorisations reçues de l\'API:', autorisationsData);

      // Normaliser la réponse, en gérant différentes structures possibles
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
      console.log('✅ Autorisations validées chargées:', autorisationsActives.length);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des autorisations validées:', error);
      // En cas d'erreur, initialiser avec un tableau vide
      setAutorisationsValidees([]);
    }
  };

  // Fonction pour obtenir les notifications à afficher
  const getNotificationsToDisplay = () => {
    return notificationsDroitsAcces;
  };

  const loadTabData = async (tab) => {
    try {
      setLoading(true);
      setError(null);

      switch (tab) {
        case 'historique':
          // L'historique médical est maintenant géré par le composant HistoriqueMedical
          break;
        case 'droits-acces':
          // Charger les notifications des droits d'accès depuis l'API réelle
          console.log('🔍 Chargement des notifications (onglet droits-acces) depuis l\'API...');
          try {
            // Récupérer l'ID du patient connecté
            const storedPatient = getStoredPatient();
            const patientId = storedPatient?.id_patient || storedPatient?.id;
            
            if (!patientId) {
              console.warn('⚠️ ID patient non disponible pour charger les notifications');
              setNotificationsDroitsAcces([]);
            } else {
              const pendingRequests = await dmpApi.getMedecinAccessRequests(patientId);
              console.log('📄 Notifications reçues (onglet):', pendingRequests);
              setNotificationsDroitsAcces(Array.isArray(pendingRequests) ? pendingRequests : []);
            }
          } catch (notificationsError) {
            console.warn('⚠️ Notifications non disponibles:', notificationsError.message);
            setNotificationsDroitsAcces([]);
          }
          
          // Charger aussi les autorisations validées
          await loadAutorisationsValidees();
          break;
        case 'rappels':
          try {
            const rappelsData = await dmpApi.getRappels(); // Utilise automatiquement l'ID du patient connecté
            setRappels(rappelsData.data || []);
          } catch (rappelsError) {
            console.warn('⚠️ Rappels non disponibles:', rappelsError.message);
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
      console.error("Erreur lors du chargement des données de l'onglet:", error);
      setError(`Erreur lors du chargement de l'onglet: ${error.message}`);
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
      console.log('📝 DMP: Marquage de la notification comme lue, ID:', notificationId);
      
      // Appel API pour marquer comme lue
      await dmpApi.marquerNotificationDroitsAccesLue(notificationId);
      
      console.log('✅ DMP: Notification marquée comme lue avec succès');
      
      // Recharger les notifications depuis l'API pour avoir les données à jour
      console.log('🔄 DMP: Rechargement des notifications après marquage...');
      const storedPatient = getStoredPatient();
      const patientId = storedPatient?.id_patient || storedPatient?.id;
      
      if (patientId) {
        const pendingRequests = await dmpApi.getMedecinAccessRequests(patientId);
        console.log('📄 DMP: Nouvelles notifications reçues:', pendingRequests);
        setNotificationsDroitsAcces(Array.isArray(pendingRequests) ? pendingRequests : []);
      }

      // Recharger aussi les autorisations validées
      await loadAutorisationsValidees();
      
      // Afficher une confirmation
      alert('Notification marquée comme lue');
      
    } catch (error) {
      console.error('❌ DMP: Erreur lors du marquage de la notification:', error);
      alert(`Erreur lors du marquage de la notification: ${error.message}`);
    }
  };

  const handleRepondreDemandeAcces = async (request, reponse) => {
    try {
      const apiDecision = reponse === 'accepter' || reponse === 'accept' ? 'accept' : 'refuse';
      const confirmationMessage = apiDecision === 'accept' 
        ? `Êtes-vous sûr de vouloir autoriser l'accès au Dr. ${request.professionnel.prenom} ${request.professionnel.nom} ?`
        : `Êtes-vous sûr de vouloir refuser l'accès ?`;
      
      if (!window.confirm(confirmationMessage)) {
        return;
      }

      // L'ID est directement disponible dans l'objet 'request'
      const autorisationId = request.id_acces_autorisation;
      console.log(`🚀 Réponse à la demande ID: ${autorisationId}, Réponse: ${reponse}`);

      // Appel direct à la nouvelle fonction API
      await dmpApi.respondToAccessRequest(autorisationId, apiDecision);

      const message = apiDecision === 'accept' 
        ? 'Demande d\'accès acceptée avec succès !' 
        : 'Demande d\'accès refusée.';
      alert(message);
      rafraichirNotifications();

    } catch (error) {
      console.error('❌ Erreur lors de la réponse à la demande:', error);
      alert(`Erreur : ${error.message || "Impossible de traiter votre réponse."}`);
    }
};

    const rafraichirNotifications = async () => {
    try {
      console.log('🔄 DMP: Rafraîchissement des notifications depuis l\'API...');
      const pendingRequests = await dmpApi.getMedecinAccessRequests();
      console.log('✅ DMP: Notifications reçues de l\'API:', pendingRequests);
      setNotificationsDroitsAcces(Array.isArray(pendingRequests) ? pendingRequests : []);
      
      // Recharger aussi les autorisations validées
      await loadAutorisationsValidees();
      
    } catch (error) {
      console.error('❌ DMP: Erreur lors du rafraîchissement des notifications:', error);
      alert(`Erreur lors du rafraîchissement des notifications: ${error.message}`);
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
  const handleAcceptAccess = async (notificationId) => {
    try {
      console.log('🎯 DMP: === DÉBUT ACCEPTATION DEMANDE D\'ACCÈS ===');
      console.log('📋 DMP: notificationId reçu:', notificationId);
      console.log('📋 DMP: Nombre total de notifications:', notificationsDroitsAcces.length);
      
      // Trouver la notification correspondante
      const notification = notificationsDroitsAcces.find(n => n.id_notification === notificationId);
      if (!notification) {
        console.error('❌ DMP: Notification non trouvée pour l\'ID:', notificationId);
        console.log('🔍 DMP: Notifications disponibles:', notificationsDroitsAcces.map(n => ({ id: n.id_notification, type: n.type_notification })));
        alert('Erreur: Notification non trouvée');
        return;
      }
      
      console.log('✅ DMP: Notification trouvée:', {
        id_notification: notification.id_notification,
        type_notification: notification.type_notification,
        session_id: notification.session_id,
        professionnel_id: notification.professionnel_id,
        date_creation: notification.date_creation,
        statut_envoi: notification.statut_envoi
      });
      
      // Utiliser la fonction helper pour trouver l'ID d'autorisation
      console.log('🔍 DMP: Recherche de l\'ID d\'autorisation pour la notification...');
      const autorisationId = await dmpApi.findAutorisationIdFromNotification(notification);
      
      if (!autorisationId) {
        console.error('❌ DMP: Impossible de trouver l\'ID d\'autorisation pour cette notification');
        console.log('🔍 DMP: Détails de la notification pour debug:', notification);
        
        // Vérifier si l'autorisation existe
        console.log('🔍 DMP: Vérification de l\'existence de l\'autorisation...');
        const autorisation = await dmpApi.verifierAutorisationExistence(notificationId);
        console.log('🔍 DMP: Résultat de la vérification:', autorisation);
        
        if (!autorisation) {
          alert('Erreur: Impossible de trouver l\'autorisation correspondante. Veuillez réessayer ou contacter le support.');
          return;
        }
      }

      console.log('✅ DMP: ID d\'autorisation trouvé:', autorisationId);
      
      // Vérifier si l'autorisation existe
      const autorisation = await dmpApi.verifierAutorisationExistence(autorisationId);
      console.log('🔍 DMP: Vérification de l\'autorisation:', autorisation);
      
      if (!autorisation) {
        console.error('❌ DMP: L\'autorisation trouvée n\'existe pas ou n\'est pas valide');
        alert('Erreur: L\'autorisation trouvée n\'est pas valide. Veuillez réessayer ou contacter le support.');
        return;
      }
      
      console.log('✅ DMP: Acceptation de la demande d\'accès:', autorisationId);
      const result = await dmpApi.accepterAutorisation(autorisationId, 'Accès autorisé par le patient');
      
      // Vérifier si l'autorisation était déjà active
      if (result && result.success && result.message === 'L\'autorisation est déjà active') {
        console.log('⚠️ DMP: L\'autorisation était déjà active');
        alert('Cette autorisation est déjà active');
      } else {
        console.log('✅ DMP: Autorisation acceptée avec succès');
        
                            // Recharger les notifications depuis l'API
                    console.log('🔄 DMP: Rechargement des notifications après acceptation...');
                    const pendingRequests = await dmpApi.getMedecinAccessRequests();
                    console.log('📄 DMP: Nouvelles notifications reçues:', pendingRequests);
                    setNotificationsDroitsAcces(Array.isArray(pendingRequests) ? pendingRequests : []);

                    // Recharger aussi les autorisations validées
                    await loadAutorisationsValidees();
        
        // Afficher une confirmation
        alert('Demande d\'accès acceptée avec succès');
      }
      
      console.log('🎯 DMP: === FIN ACCEPTATION DEMANDE D\'ACCÈS ===');
    } catch (error) {
      console.error('❌ DMP: Erreur lors de l\'acceptation:', error);
      console.error('❌ DMP: Stack trace:', error.stack);
      alert(`Erreur lors de l'acceptation de la demande d'accès: ${error.message}`);
    }
  };

  // Fonction pour gérer le refus d'une demande d'accès
  const handleRejectAccess = async (notificationId) => {
    try {
      console.log('🎯 DMP: === DÉBUT REFUS DEMANDE D\'ACCÈS ===');
      console.log('📋 DMP: notificationId reçu:', notificationId);
      console.log('📋 DMP: Nombre total de notifications:', notificationsDroitsAcces.length);
      
      // Trouver la notification correspondante
      const notification = notificationsDroitsAcces.find(n => n.id_notification === notificationId);
      if (!notification) {
        console.error('❌ DMP: Notification non trouvée pour l\'ID:', notificationId);
        console.log('🔍 DMP: Notifications disponibles:', notificationsDroitsAcces.map(n => ({ id: n.id_notification, type: n.type_notification })));
        alert('Erreur: Notification non trouvée');
        return;
      }
      
      console.log('✅ DMP: Notification trouvée:', {
        id_notification: notification.id_notification,
        type_notification: notification.type_notification,
        session_id: notification.session_id,
        professionnel_id: notification.professionnel_id,
        date_creation: notification.date_creation,
        statut_envoi: notification.statut_envoi
      });
      
      // Utiliser la fonction helper pour trouver l'ID d'autorisation
      console.log('🔍 DMP: Recherche de l\'ID d\'autorisation pour la notification...');
      const autorisationId = await dmpApi.findAutorisationIdFromNotification(notification);
      
      if (!autorisationId) {
        console.error('❌ DMP: Impossible de trouver l\'ID d\'autorisation pour cette notification');
        console.log('🔍 DMP: Détails de la notification pour debug:', notification);
        
        // Vérifier si l'autorisation existe
        console.log('🔍 DMP: Vérification de l\'existence de l\'autorisation...');
        const autorisation = await dmpApi.verifierAutorisationExistence(notificationId);
        console.log('🔍 DMP: Résultat de la vérification:', autorisation);
        
        if (!autorisation) {
          alert('Erreur: Impossible de trouver l\'autorisation correspondante. Veuillez réessayer ou contacter le support.');
          return;
        }
      }

      console.log('✅ DMP: ID d\'autorisation trouvé:', autorisationId);
      
      // Vérifier si l'autorisation existe
      const autorisation = await dmpApi.verifierAutorisationExistence(autorisationId);
      console.log('🔍 DMP: Vérification de l\'autorisation:', autorisation);
      
      if (!autorisation) {
        console.error('❌ DMP: L\'autorisation trouvée n\'existe pas ou n\'est pas valide');
        alert('Erreur: L\'autorisation trouvée n\'est pas valide. Veuillez réessayer ou contacter le support.');
        return;
      }
      
      console.log('✅ DMP: Refus de la demande d\'accès:', autorisationId);
      const result = await dmpApi.refuserAutorisation(autorisationId, 'Accès refusé par le patient');
      
      // Vérifier si l'autorisation était déjà refusée
      if (result && result.success && result.message === 'L\'autorisation est déjà refusée') {
        console.log('⚠️ DMP: L\'autorisation était déjà refusée');
        alert('Cette autorisation est déjà refusée');
      } else {
        console.log('✅ DMP: Autorisation refusée avec succès');
        
                            // Recharger les notifications depuis l'API
                    console.log('🔄 DMP: Rechargement des notifications après refus...');
                    const pendingRequests = await dmpApi.getMedecinAccessRequests();
                    console.log('📄 DMP: Nouvelles notifications reçues:', pendingRequests);
                    setNotificationsDroitsAcces(Array.isArray(pendingRequests) ? pendingRequests : []);

                    // Recharger aussi les autorisations validées
                    await loadAutorisationsValidees();
        
        // Afficher une confirmation
        alert('Demande d\'accès refusée');
      }
      
      console.log('🎯 DMP: === FIN REFUS DEMANDE D\'ACCÈS ===');
    } catch (error) {
      console.error('❌ DMP: Erreur lors du refus:', error);
      console.error('❌ DMP: Stack trace:', error.stack);
      alert(`Erreur lors du refus de la demande d'accès: ${error.message}`);
    }
  };

  // Fonction pour marquer une notification comme lue
  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      console.log('📝 DMP: Marquage de la notification comme lue (handleMarkNotificationAsRead), ID:', notificationId);
      
      await dmpApi.marquerNotificationDroitsAccesLue(notificationId);
      
      console.log('✅ DMP: Notification marquée comme lue avec succès (handleMarkNotificationAsRead)');
      
      // Mettre à jour la liste des notifications
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
      console.error('❌ DMP: Erreur lors du marquage de la notification (handleMarkNotificationAsRead):', error);
      alert(`Erreur lors du marquage de la notification: ${error.message}`);
    }
  };



  // Vérifier les nouvelles notifications périodiquement
  useEffect(() => {
    const checkNewNotifications = async () => {
      try {
        // Utiliser l'endpoint approprié pour les médecins
        const newNotifications = await dmpApi.getMedecinAccessRequests();
        const list = Array.isArray(newNotifications) ? newNotifications : [];
        
        // Trouver les nouvelles notifications non lues
        const unreadNotifications = list.filter(n => n.statut_envoi === 'en_attente');
        
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
              {notificationsDroitsAcces.filter(n => n.statut_envoi === 'en_attente').length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setActiveTab('droits-acces')}
                    className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
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
                badge: notificationsDroitsAcces.filter(n => n.statut_envoi === 'en_attente').length > 0 ? notificationsDroitsAcces.filter(n => n.statut_envoi === 'en_attente').length : null
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
          <HistoriqueMedical />
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
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                notification.type_notification === 'demande_validation' ? 'bg-orange-100 text-orange-800' :
                                notification.type_notification === 'acces_autorise' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
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