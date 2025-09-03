import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getAutorisations, 
  getDocumentsPersonnelsDMP, 
  getAutoMesuresDMP, 
  revokerAutorisation 
} from '../services/api/dmpApi';
import { getDossierPatient } from '../services/api/medicalApi';
import { downloadDocument } from '../services/api/medicalApi';
import PDFPreviewModal from '../components/common/PDFPreviewModal';

function DMPPatientView() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [dmpData, setDmpData] = useState(null);
  const [autorisations, setAutorisations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [autoMesures, setAutoMesures] = useState([]);
  const [pdfPreview, setPdfPreview] = useState({ open: false, url: null, title: '' });
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokingAccess, setRevokingAccess] = useState(false);
  const [isUrgenceMode, setIsUrgenceMode] = useState(false);
  const previewBlobUrlRef = useRef(null);

  // 🔍 DEBUG - Vérifier l'état des tokens au chargement du composant
  useEffect(() => {
    console.log('🔍 DEBUG - DMPPatientView chargé, vérification des tokens:');
    console.log('  - Token JWT (jwt):', localStorage.getItem('jwt') ? '✅ Présent' : '❌ Absent');
    console.log('  - Token (token):', localStorage.getItem('token') ? '✅ Présent' : '❌ Absent');
    console.log('  - Token JWT valeur:', localStorage.getItem('jwt'));
    console.log('  - Token valeur:', localStorage.getItem('token'));
    console.log('  - Toutes les clés localStorage:', Object.keys(localStorage));
    console.log('  - Patient ID:', patientId);
    
    // 🔍 DEBUG - Vérifier l'état des tokens IMMÉDIATEMENT
    console.log('🔍 DEBUG - État IMMÉDIAT des tokens dans DMPPatientView:');
    console.log('  - localStorage.getItem("jwt"):', localStorage.getItem('jwt'));
    console.log('  - localStorage.getItem("token"):', localStorage.getItem('token'));
    console.log('  - localStorage.getItem("medecin"):', localStorage.getItem('medecin'));
    console.log('  - localStorage.getItem("professionnel"):', localStorage.getItem('professionnel'));
    console.log('  - localStorage.getItem("tempTokenId_urgence"):', localStorage.getItem('tempTokenId_urgence'));
    
    // Détecter le mode urgence
    const tempTokenIdUrgence = localStorage.getItem('tempTokenId_urgence');
    const hasValidTokens = localStorage.getItem('jwt') || localStorage.getItem('token');
    
    if (tempTokenIdUrgence && !hasValidTokens) {
      console.log('🚨 Mode urgence détecté - Pas de tokens JWT valides, utilisation du mode urgence');
      setIsUrgenceMode(true);
    } else {
      console.log('✅ Mode normal détecté - Tokens JWT présents');
      setIsUrgenceMode(false);
    }
  }, [patientId]);

  // Normalise une URL de fichier potentiellement relative vers une URL absolue côté backend
  const resolveFileUrl = useCallback((rawUrl) => {
    if (!rawUrl) {
      return null;
    }
    try {
      if (/^https?:\/\//i.test(rawUrl)) {
        return rawUrl;
      }
      // Dev: backend sur 3000, frontend sur 3001
      const backendOrigin = window.location.origin.replace(/:\d+$/, ':3000');
      if (rawUrl.startsWith('/')) {
        return backendOrigin + rawUrl;
      }
      return backendOrigin + '/' + rawUrl;
    } catch (e) {
      return rawUrl;
    }
  }, []);

  const handleOpenDocument = useCallback(async (doc, fallbackTitle) => {
    const format = (doc.format || doc.type || '').toString().toLowerCase();
    const title = doc.titre || doc.title || doc.nom || doc.name || fallbackTitle || 'Document';
    const rawUrl = doc.url || doc.lien || doc.path;
    const fileUrl = resolveFileUrl(rawUrl);

    const isPdfLike = (u) => (format.includes('pdf') || (u && /\.pdf($|\?)/i.test(u)) || doc.mime === 'application/pdf');

    try {
      const docId = doc.id || doc.document_id || doc.id_document || doc.uuid || null;
      if (docId) {
        const blob = await downloadDocument(docId);
        const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        if (previewBlobUrlRef.current) {
          URL.revokeObjectURL(previewBlobUrlRef.current);
        }
        previewBlobUrlRef.current = blobUrl;
        setPdfPreview({ open: true, url: blobUrl, title });
        return;
      }

      if (!fileUrl) {
        console.warn('URL du document absente');
        return;
      }

      if (isPdfLike(fileUrl)) {
        setPdfPreview({ open: true, url: fileUrl, title });
      } else {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      console.error('Erreur ouverture document, fallback vers URL si disponible:', e);
      if (fileUrl) {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
    }
  }, [resolveFileUrl]);

  const handleClosePreview = useCallback(() => {
    setPdfPreview({ open: false, url: null, title: '' });
    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current);
      previewBlobUrlRef.current = null;
    }
  }, []);

  const handleDownloadDocument = useCallback(async (doc, fallbackTitle) => {
    try {
      const title = doc.titre || doc.title || doc.nom || doc.name || fallbackTitle || 'document';
      const filename = /\.pdf$/i.test(title) ? title : `${title}.pdf`;
      const docId = doc.id || doc.document_id || doc.id_document || doc.uuid || null;

      if (docId) {
        const data = await downloadDocument(docId);
        const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      const rawUrl = doc.url || doc.lien || doc.path || doc.fichier_url || doc.document_url || doc.file_url || doc.fichier || doc.file || doc.chemin || doc.chemin_document || null;
      const resolvedUrl = resolveFileUrl(rawUrl);
      if (resolvedUrl) {
        const a = document.createElement('a');
        a.href = resolvedUrl;
        a.download = filename;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        console.warn('Impossible de télécharger: aucune URL disponible');
      }
    } catch (e) {
      console.error('Erreur lors du téléchargement du document:', e);
    }
  }, [resolveFileUrl]);

  // Fonction pour révoquer l'accès et retourner au DMP
  const handleRevokeAccess = useCallback(async () => {
    try {
      setRevokingAccess(true);
      console.log('🔒 Révocation automatique de l\'accès au dossier patient...');
      
      // Récupérer les informations du médecin connecté
      const medecinData = localStorage.getItem('medecin');
      if (!medecinData) {
        console.warn('⚠️ Aucune donnée médecin trouvée, navigation directe');
        navigate('/dmp');
        return;
      }

      const medecin = JSON.parse(medecinData);
      const professionnelId = medecin.id_professionnel || medecin.id;
      
      if (!professionnelId || !patientId) {
        console.warn('⚠️ ID médecin ou patient manquant, navigation directe');
        navigate('/dmp');
        return;
      }

      // Révocation de l'accès
      const raisonRevocation = 'Accès révoqué automatiquement lors de la fermeture du dossier';
      
      // ✅ ÉTAPE 1: Récupérer l'autorisation active pour obtenir son ID
      try {
        const jwtToken = localStorage.getItem('jwt');
        console.log('🔍 DEBUG - Token utilisé pour la vérification d\'autorisation:');
        console.log('  - Token JWT récupéré:', jwtToken ? '✅ Présent' : '❌ Absent');
        console.log('  - Longueur du token:', jwtToken ? jwtToken.length : 0);
        console.log('  - Début du token:', jwtToken ? jwtToken.substring(0, 50) + '...' : 'N/A');
        console.log('  - Token complet:', jwtToken);
        
        const verification = await fetch(`http://localhost:3000/api/access/status/${patientId}?professionnelId=${professionnelId}`, {
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (verification.ok) {
          const verificationData = await verification.json();
          const autorisationId = verificationData.data?.authorization?.id_acces;
          
          if (autorisationId) {
            // ✅ ÉTAPE 2: Révoquer l'autorisation avec la fonction unifiée
            await revokerAutorisation(autorisationId, raisonRevocation);
            console.log('✅ Accès révoqué avec succès, navigation vers DMP');
          } else {
            console.log('ℹ️ Aucune autorisation active trouvée, navigation directe');
          }
        } else {
          console.warn('⚠️ Impossible de vérifier l\'autorisation, navigation directe');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification de l\'autorisation:', error);
      }
      
      navigate('/dmp');
      
    } catch (error) {
      console.error('❌ Erreur lors de la révocation de l\'accès:', error);
      // Même en cas d'erreur, on navigue vers le DMP
      alert('Erreur lors de la révocation de l\'accès, mais navigation vers le DMP...');
      navigate('/dmp');
    } finally {
      setRevokingAccess(false);
    }
  }, [patientId, navigate]);

  const [loading, setLoading] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingMesures, setLoadingMesures] = useState(false);
  const [error, setError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('loading');

  // Vérifier que l'utilisateur est autorisé (patient ou médecin)
  const checkPatientAuthorization = useCallback(() => {
    const jwtToken = localStorage.getItem('token') || localStorage.getItem('jwt');
    const patientData = localStorage.getItem('patient');
    const medecinData = localStorage.getItem('medecin');
    
    console.log('🔍 DEBUG - Vérification autorisation DMPPatientView:');
    console.log('  - Token:', jwtToken ? '✅ Présent' : '❌ Absent');
    console.log('  - Token JWT (jwt):', localStorage.getItem('jwt') ? '✅ Présent' : '❌ Absent');
    console.log('  - Token (token):', localStorage.getItem('token') ? '✅ Présent' : '❌ Absent');
    console.log('  - Token utilisé:', jwtToken);
    console.log('  - Longueur du token:', jwtToken ? jwtToken.length : 0);
    console.log('  - Début du token:', jwtToken ? jwtToken.substring(0, 50) + '...' : 'N/A');
    console.log('  - Patient data:', patientData ? '✅ Présent' : '❌ Absent');
    console.log('  - Médecin data:', medecinData ? '✅ Présent' : '❌ Absent');
    console.log('  - Toutes les clés localStorage:', Object.keys(localStorage));
    
    // Vérifier qu'il y a au moins un token et des données utilisateur
    if (!jwtToken || (!patientData && !medecinData)) {
      console.warn('⚠️ Accès refusé: Utilisateur non connecté ou données manquantes');
      return false;
    }
    
    try {
      // Si c'est un patient connecté
      if (patientData) {
        const patient = JSON.parse(patientData);
        // Vérifier que l'utilisateur connecté correspond au patient demandé
        if (patientId && patient.id !== parseInt(patientId) && patient.id_patient !== parseInt(patientId)) {
          console.warn('⚠️ Accès refusé: Patient tente d\'accéder au dossier d\'un autre patient');
          return false;
        }
        console.log('✅ Patient autorisé à consulter son dossier DMP');
        return true;
      }
      
      // Si c'est un médecin connecté
      if (medecinData) {
        const medecin = JSON.parse(medecinData);
        console.log('✅ Médecin autorisé à consulter le dossier patient:', medecin.nom, medecin.prenom);
        console.log('  - ID médecin:', medecin.id_professionnel);
        console.log('  - Patient demandé:', patientId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des autorisations:', error);
      return false;
    }
  }, [patientId]);

  // Charger les documents et auto-mesures
  const loadDocumentsAndMesures = useCallback(async (patientId) => {
    if (!patientId) {
      return;
    }
    
    try {
      console.log('🚀 Chargement des documents et auto-mesures pour le patient:', patientId);
      
      // Charger les documents
      setLoadingDocuments(true);
      const documentsResponse = await getDocumentsPersonnelsDMP(patientId);
      const documentsData = documentsResponse?.data || documentsResponse || [];
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
      console.log('✅ Documents chargés:', documentsData);
      
      // Charger les auto-mesures
      setLoadingMesures(true);
      const mesuresResponse = await getAutoMesuresDMP(patientId);
      const mesuresData = mesuresResponse?.data || mesuresResponse || [];
      setAutoMesures(Array.isArray(mesuresData) ? mesuresData : []);
      console.log('✅ Auto-mesures chargées:', mesuresData);
      
      // Statistiques désactivées (supprimé les données simulées)
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des documents/mesures:', error);
      setError('Impossible de charger les documents et auto-mesures');
    } finally {
      setLoadingDocuments(false);
      setLoadingMesures(false);
    }
  }, []);

  // Charger les données DMP
  const loadDMPData = useCallback(async () => {
    // En mode urgence, on ne vérifie pas l'autorisation
    if (!isUrgenceMode && !checkPatientAuthorization()) {
      setCurrentStatus('unauthorized');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Chargement des données DMP pour le patient:', patientId);
      console.log('🔍 Mode urgence détecté:', isUrgenceMode ? '🚨 OUI' : '✅ NON');
      
      // Utiliser getDossierPatient pour récupérer le contenu du dossier médical
      console.log('🔧 Fonction sélectionnée: getDossierPatient');
      console.log(`🔗 URL qui sera appelée: GET /api/dossierMedical/patient/${patientId}/complet`);
      
      // Charger les données en parallèle
      const [dossierResponse, autorisationsResponse] = await Promise.all([
        getDossierPatient(patientId),
        // En mode urgence, on peut passer les autorisations ou les ignorer
        isUrgenceMode ? Promise.resolve({ data: [] }) : getAutorisations(patientId)
      ]);
      
      // getDossierPatient retourne les données directement
      setDmpData(dossierResponse);
      setAutorisations(autorisationsResponse || []);
      setCurrentStatus('authorized');
      
      console.log('✅ Données DMP chargées avec succès');
      console.log('🔍 DEBUG - Types des données reçues:');
      console.log('  - dossierResponse:', typeof dossierResponse, dossierResponse);
      console.log('  - dossierResponse structure:', dossierResponse ? Object.keys(dossierResponse) : 'null');
      console.log('  - dmpData final:', dmpData);
      console.log('  - Contenu du dossier médical:', dmpData?.resume_medical, dmpData?.antecedents_medicaux, dmpData?.allergies);
      console.log(`  - URL effectivement appelée: GET /api/dossierMedical/patient/${patientId}/complet`);
      console.log('  - autorisationsResponse:', typeof autorisationsResponse, autorisationsResponse);
      console.log('  - autorisations final:', Array.isArray(autorisationsResponse || []) ? '✅ Array' : '❌ Non-Array');
      
      // Charger les documents et auto-mesures après les données principales
      await loadDocumentsAndMesures(patientId);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données DMP:', error);
      setError('Impossible de charger les données DMP');
      setCurrentStatus('error');
    } finally {
      setLoading(false);
    }
  }, [patientId, checkPatientAuthorization, loadDocumentsAndMesures, isUrgenceMode]);

  // Effet initial
  useEffect(() => {
    if (patientId) {
      loadDMPData();
    }
  }, [patientId, loadDMPData]);

  // Si l'utilisateur n'est pas autorisé, afficher un message d'erreur
  if (currentStatus === 'unauthorized') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Accès non autorisé</h2>
          <p className="text-gray-600 mb-6">
            Vous n'êtes pas autorisé à consulter ce dossier médical.
          </p>
          <button
            onClick={() => navigate('/connexion')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Si en cours de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre dossier DMP...</p>
        </div>
      </div>
    );
  }

  // Si erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadDMPData}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon Dossier Médical Partagé</h1>
              <p className="text-gray-600">Gérez votre dossier médical et suivez les accès</p>
            </div>
            <button
              onClick={() => setShowRevokeModal(true)}
              disabled={revokingAccess}
              className={`px-4 py-2 rounded-md transition-colors ${
                revokingAccess 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {revokingAccess ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Révocation en cours...
                </>
              ) : (
                'Quitter dossier patient'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal - Dossier Patient, Documents et Auto-mesures */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Section Dossier Patient */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Dossier Patient
            </h2>
            
            {/* Informations du patient */}
            {dmpData ? (
              <div className="space-y-4">
                {/* Informations de base */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Informations Personnelles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Nom</label>
                      <p className="text-sm text-blue-900 font-medium">
                        {dmpData.patient?.nom || dmpData.nom || 'Non renseigné'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Prénom</label>
                      <p className="text-sm text-blue-900 font-medium">
                        {dmpData.patient?.prenom || dmpData.prenom || 'Non renseigné'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Date de naissance</label>
                      <p className="text-sm text-blue-900">
                        {dmpData.patient?.date_naissance || dmpData.date_naissance ? 
                          new Date(dmpData.patient?.date_naissance || dmpData.date_naissance).toLocaleDateString('fr-FR') : 
                          'Non renseigné'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Sexe</label>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {dmpData.patient?.sexe === 'M' ? 'Homme' : 
                         dmpData.patient?.sexe === 'F' ? 'Femme' : 
                         dmpData.patient?.sexe || dmpData.sexe || 'Non renseigné'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informations médicales */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3">Informations Médicales</h3>
                  <div className="space-y-3">
                    {dmpData.resume_medical && (
                      <div>
                        <label className="block text-sm font-medium text-green-700">Résumé Médical</label>
                        <p className="text-sm text-green-900 mt-1 whitespace-pre-wrap">{dmpData.resume_medical}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dmpData.antecedents_medicaux && (
                        <div>
                          <label className="block text-sm font-medium text-green-700">Antécédents Médicaux</label>
                          <p className="text-sm text-green-900 mt-1 whitespace-pre-wrap">{dmpData.antecedents_medicaux}</p>
                        </div>
                      )}
                      
                      {dmpData.allergies && (
                        <div>
                          <label className="block text-sm font-medium text-green-700">Allergies</label>
                          <p className="text-sm text-green-900 mt-1 whitespace-pre-wrap">{dmpData.allergies}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dmpData.traitement && (
                        <div>
                          <label className="block text-sm font-medium text-green-700">Traitements</label>
                          <p className="text-sm text-green-900 mt-1 whitespace-pre-wrap">{dmpData.traitement}</p>
                        </div>
                      )}
                      
                      {dmpData.traitements_chroniques && (
                        <div>
                          <label className="block text-sm font-medium text-green-700">Traitements Chroniques</label>
                          <p className="text-sm text-green-900 mt-1 whitespace-pre-wrap">{dmpData.traitements_chroniques}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Signes vitaux */}
                {(dmpData.heart_rate || dmpData.blood_pressure || dmpData.temperature || dmpData.respiratory_rate || dmpData.oxygen_saturation) && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-3">Signes Vitaux</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {dmpData.heart_rate && (
                        <div className="bg-white p-3 rounded-lg">
                          <label className="block text-xs font-medium text-purple-700">Fréquence cardiaque</label>
                          <p className="text-sm font-semibold text-purple-900">{dmpData.heart_rate} bpm</p>
                        </div>
                      )}
                      {dmpData.blood_pressure && (
                        <div className="bg-white p-3 rounded-lg">
                          <label className="block text-xs font-medium text-purple-700">Pression artérielle</label>
                          <p className="text-sm font-semibold text-purple-900">{dmpData.blood_pressure} mmHg</p>
                        </div>
                      )}
                      {dmpData.temperature && (
                        <div className="bg-white p-3 rounded-lg">
                          <label className="block text-xs font-medium text-purple-700">Température</label>
                          <p className="text-sm font-semibold text-purple-900">{dmpData.temperature}°C</p>
                        </div>
                      )}
                      {dmpData.respiratory_rate && (
                        <div className="bg-white p-3 rounded-lg">
                          <label className="block text-xs font-medium text-purple-700">Fréquence respiratoire</label>
                          <p className="text-sm font-semibold text-purple-900">{dmpData.respiratory_rate} /min</p>
                        </div>
                      )}
                      {dmpData.oxygen_saturation && (
                        <div className="bg-white p-3 rounded-lg">
                          <label className="block text-xs font-medium text-purple-700">Saturation O₂</label>
                          <p className="text-sm font-semibold text-purple-900">{dmpData.oxygen_saturation}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Informations complémentaires */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Informations Complémentaires</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dmpData.histoire_familiale && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Histoire Familiale</label>
                          <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dmpData.histoire_familiale}</p>
                        </div>
                      )}
                      
                      {dmpData.habitudes_vie && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Habitudes de Vie</label>
                          <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dmpData.habitudes_vie}</p>
                        </div>
                      )}
                    </div>
                    
                    {dmpData.observations && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Observations</label>
                        <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dmpData.observations}</p>
                      </div>
                    )}
                    
                    {dmpData.directives_anticipees && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Directives Anticipées</label>
                        <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{dmpData.directives_anticipees}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statut du dossier */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-3">Statut du Dossier</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        dmpData.statut === 'actif' 
                          ? 'bg-green-100 text-green-800' 
                          : dmpData.statut === 'ferme'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dmpData.statut === 'actif' ? 'Actif' : 
                         dmpData.statut === 'ferme' ? 'Fermé' : 
                         dmpData.statut || 'Inconnu'}
                      </span>
                    </div>
                    <div className="text-sm text-yellow-700">
                      {dmpData.dateCreation ? 
                        `Créé le ${new Date(dmpData.dateCreation).toLocaleDateString('fr-FR')}` :
                        dmpData.dateOuverture ? 
                          `Ouvert le ${new Date(dmpData.dateOuverture).toLocaleDateString('fr-FR')}` :
                          'Date inconnue'
                      }
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Aucune information de dossier disponible.</p>
              </div>
            )}
          </div>

          {/* Section Documents et Auto-mesures */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Documents et Auto-mesures</h2>
          
          {/* Section Documents Uploadés */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documents Uploadés
            </h3>
            
            {/* Données réelles des documents */}
            {loadingDocuments ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse bg-gray-50">
                    <div className="h-6 w-24 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                      <div className="h-3 w-12 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc, index) => {
                  const title = doc.titre || doc.title || doc.nom || doc.name || `Document ${index + 1}`;
                  const description = doc.description || doc.resume || '';
                  const dateRaw = doc.date_upload || doc.createdAt || doc.date_creation || doc.date || null;
                  const dateLabel = dateRaw ? new Date(dateRaw).toLocaleDateString('fr-FR') : 'Date inconnue';
                  const sizeBytes = typeof doc.taille === 'number' ? doc.taille : (typeof doc.size === 'number' ? doc.size : null);
                  const sizeLabel = sizeBytes != null ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` : '';
                  const format = (doc.format || doc.type || '').toString().toUpperCase();
                  const badge = format || 'DOC';
                  const rawUrl = doc.url || doc.lien || doc.path || doc.fichier_url || doc.document_url || doc.file_url || doc.fichier || doc.file || doc.chemin || doc.chemin_document || null;
                  const resolvedUrl = resolveFileUrl(rawUrl);
                  return (
                    <div
                      key={doc.id || index}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleOpenDocument({ ...doc, url: resolvedUrl }, title)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleOpenDocument({ ...doc, url: resolvedUrl }, title);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{badge}</span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1 truncate" title={title}>{title}</h4>
                      {description ? (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
                      ) : null}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Ajouté le {dateLabel}</span>
                        <span>{sizeLabel}</span>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        {resolvedUrl ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDocument({ ...doc, url: resolvedUrl }, title);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm p-2 rounded-md hover:bg-blue-50"
                              title="Prévisualiser le PDF"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadDocument({ ...doc, url: resolvedUrl }, title);
                              }}
                              className="text-green-600 hover:text-green-800 text-sm p-2 rounded-md hover:bg-green-50"
                              title="Télécharger le document"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v12a2 2 0 002 2h12a2 2 0 002-2V4" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5m0 0l5-5m-5 5V3" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <button disabled className="text-gray-400 text-sm p-2 rounded-md cursor-not-allowed" title="Lien non disponible">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">
                <p>Aucun document trouvé.</p>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="mt-6 flex space-x-3">
              <button 
                onClick={() => loadDocumentsAndMesures(patientId)}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un document
              </button>
            </div>
          </div>

          {/* Modal de prévisualisation PDF */}
          <PDFPreviewModal
            isOpen={pdfPreview.open}
            onClose={handleClosePreview}
            fileUrl={pdfPreview.url}
            title={pdfPreview.title}
            authToken={localStorage.getItem('token') || localStorage.getItem('jwt')}
          />

          {/* Section Auto-mesures */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Auto-mesures
            </h3>

            {/* Graphique des auto-mesures */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Tension Artérielle (7 derniers jours)</h4>
                <span className="text-sm text-gray-500">Mise à jour: Aujourd'hui</span>
              </div>
              
              {/* Affichage des vraies auto-mesures du patient */}
              {loadingMesures ? (
                <div className="h-32 bg-white rounded border p-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Chargement des mesures...</span>
                </div>
              ) : autoMesures.length > 0 ? (
                <div className="h-32 bg-white rounded border p-4">
                  <div className="flex items-end justify-between h-full space-x-1">
                    {autoMesures.slice(0, 7).map((mesure, index) => {
                      const valeur = parseFloat(mesure.valeur) || 0;
                      const maxValeur = Math.max(...autoMesures.map(m => parseFloat(m.valeur) || 0));
                      const hauteur = maxValeur > 0 ? (valeur / maxValeur) * 100 : 0;
                      const date = new Date(mesure.date_mesure || mesure.date_creation);
                      const jour = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                      
                      return (
                        <div key={mesure.id || index} className="flex flex-col items-center">
                          <div 
                            className="w-8 bg-blue-500 rounded-t transition-all duration-300" 
                            style={{height: `${hauteur}%`}}
                            title={`${mesure.type_mesure || 'Mesure'}: ${valeur} ${mesure.unite || ''}`}
                          ></div>
                          <span className="text-xs text-gray-600 mt-1">{jour}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-32 bg-white rounded border p-4 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm text-gray-500 mt-2">Aucune mesure disponible</p>
                  </div>
                </div>
              )}
            </div>

            {/* Liste des dernières mesures */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 mb-3">Dernières mesures</h4>
              {autoMesures && autoMesures.length > 0 ? (
                autoMesures.slice(0, 3).map((mesure, idx) => {
                  const type = mesure.type_mesure || mesure.type || 'Mesure';
                  const valeur = mesure.valeur != null ? mesure.valeur : (mesure.value != null ? mesure.value : '');
                  const unite = mesure.unite || '';
                  const dateRaw = mesure.date_mesure || mesure.date_creation || mesure.createdAt || null;
                  const dateLabel = dateRaw ? new Date(dateRaw).toLocaleString('fr-FR') : '';
                  const color = idx === 0 ? 'green' : idx === 1 ? 'blue' : 'yellow';
                  return (
                    <div key={mesure.id || idx} className={`flex items-center justify-between p-3 bg-${color}-50 rounded-lg border border-${color}-200`}>
                      <div className="flex items-center">
                        <div className={`w-8 h-8 bg-${color}-100 rounded-full flex items-center justify-center mr-3`}>
                          <svg className={`w-4 h-4 text-${color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{type.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-600">{valeur} {unite}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium text-${color}-600}`}>Dernière</p>
                        <p className="text-xs text-gray-500">{dateLabel}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500">Aucune mesure récente.</div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="mt-6 flex space-x-3">
              <button 
                onClick={() => loadDocumentsAndMesures(patientId)}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter une mesure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Modal de confirmation de révocation d'accès */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Quitter le dossier patient
                </h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                ⚠️ <strong>Attention :</strong> En quittant ce dossier, votre accès sera automatiquement révoqué et vous ne pourrez plus y accéder sans une nouvelle autorisation.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Êtes-vous sûr de vouloir continuer ?
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Annuler
              </button>
              <button
                onClick={handleRevokeAccess}
                disabled={revokingAccess}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {revokingAccess ? 'Révocation...' : 'Quitter et révoquer l\'accès'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DMPPatientView;


