import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  authenticateCPS, 
  requestDMPAccess, 
  validateAccessRequest 
} from "../services/api/dmpApi";
import { getStoredMedecin } from "../services/api/authApi";

function DMPAccess() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  
  // États pour l'authentification CPS
  const [codeCPS, setCodeCPS] = useState(['', '', '', '']);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // États pour la sélection du mode d'accès
  const [selectedMode, setSelectedMode] = useState(null);
  const [raisonAcces, setRaisonAcces] = useState('');
  const [dureeAcces, setDureeAcces] = useState(60);

  
  // États pour les informations du patient et de la session
  const [patientInfo, setPatientInfo] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [notificationInfo, setNotificationInfo] = useState(null);
  
  // États pour les étapes du processus
  const [currentStep, setCurrentStep] = useState('cps'); // 'cps', 'mode', 'confirmation'
  
  // Modes d'accès disponibles
  const accessModes = [
    {
      id: 'autorise_par_patient',
      title: 'Accès autorisé par le patient',
      description: 'Le patient doit valider votre demande d\'accès',
      icon: 'user-check',
      color: 'primary',
      requiresPatientApproval: true
    },
    {
      id: 'urgence',
      title: 'Mode urgence',
      description: 'Accès immédiat en cas d\'urgence médicale',
      icon: 'alert-triangle',
      color: 'warning',
      requiresPatientApproval: false
    },
    {
      id: 'connexion_secrete',
      title: 'Connexion secrète',
      description: 'Accès discret pour consultation confidentielle',
      icon: 'shield',
      color: 'info',
      requiresPatientApproval: false
    }
  ];

  // Charger les informations du patient
  const loadPatientInfo = useCallback(async () => {
    try {
      // Simuler un appel API pour récupérer les informations du patient
      // En production, cela viendrait de votre API
      const mockPatientInfo = {
        id: patientId,
        nom: "MOLOWA",
        prenom: "ESSONGA",
        numero_dossier: "PAT-17540449445"
      };
      setPatientInfo(mockPatientInfo);
    } catch (error) {
      console.error('Erreur lors du chargement des informations du patient:', error);
      setError('Impossible de charger les informations du patient');
    }
  }, [patientId]);

  // Charger les informations du patient au montage
  useEffect(() => {
    if (patientId) {
      loadPatientInfo();
    }
  }, [patientId, loadPatientInfo]);

  // Gestion de la saisie du code CPS
  const handleCPSInputChange = (index, value) => {
    if (isBlocked) {
      return;
    }
    
    const newCode = [...codeCPS];
    newCode[index] = value;
    setCodeCPS(newCode);
    
    // Auto-focus sur le champ suivant
    if (value && index < 3) {
      const nextInput = document.getElementById(`cps-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
    
    // Auto-focus sur le champ précédent lors de la suppression
    if (!value && index > 0) {
      const prevInput = document.getElementById(`cps-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  // Gestion des touches pour la navigation
  const handleCPSKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !codeCPS[index] && index > 0) {
      const prevInput = document.getElementById(`cps-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  // Validation du code CPS
  const validateCPS = async () => {
    if (isBlocked) {
      return;
    }
    
    const code = codeCPS.join('');
    if (code.length !== 4) {
      setError('Le code CPS doit contenir 4 chiffres');
      return;
    }
    
    if (!/^\d{4}$/.test(code)) {
      setError('Le code CPS ne doit contenir que des chiffres');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Récupérer le numéro ADELI du médecin connecté
      const medecinConnecte = getStoredMedecin();
      if (!medecinConnecte || !medecinConnecte.numero_adeli) {
        setError('Impossible de récupérer le numéro ADELI du médecin connecté');
        return;
      }
      
      // Utiliser la fonction API d'authentification CPS
      console.log('=== AUTHENTIFICATION CPS ===');
      console.log('Code CPS:', code);
      console.log('Patient ID:', patientId);
      console.log('Numéro ADELI:', medecinConnecte.numero_adeli);
      console.log('Médecin connecté:', medecinConnecte);
      
      const result = await authenticateCPS({
        numero_adeli: medecinConnecte.numero_adeli,
        code_cps: code,
        patient_id: patientId
      });
      
      console.log('Résultat authentification:', result);
      if (result.success || result.status === 'success') {
        setSessionInfo(result.data);
        setCurrentStep('mode');
      } else {
        throw new Error(result.message || 'Code CPS invalide');
      }
    } catch (error) {
      console.error('Erreur authentification CPS:', error);
      setError('Code CPS invalide');
      setAttempts(prev => prev + 1);
      
      if (attempts + 1 >= maxAttempts) {
        setIsBlocked(true);
        setError('Trop de tentatives échouées. Compte bloqué temporairement.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sélection du mode d'accès
  const selectAccessMode = (mode) => {
    setSelectedMode(mode);
  };

  // Demande d'accès au DMP
  const demanderAcces = async () => {
    console.log('=== DÉBUT DEMANDE ACCÈS ===');
    console.log('demanderAcces appelée avec:', { selectedMode, raisonAcces, dureeAcces });
    console.log('sessionInfo:', sessionInfo);
    
    if (!selectedMode) {
      setError('Veuillez sélectionner un mode d\'accès');
      return;
    }
    
    if (!raisonAcces || raisonAcces.length < 10) {
      setError('La raison d\'accès doit contenir au moins 10 caractères');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Vérifier que nous avons les données d'authentification
      console.log('Vérification sessionInfo:', sessionInfo);
      if (!sessionInfo?.authentification_reussie) {
        console.error('❌ Authentification échouée - sessionInfo:', sessionInfo);
        setError('Authentification CPS échouée. Veuillez recommencer.');
        return;
      }
      
      // Valider les données avant envoi
      const validation = validateAccessRequest({
        mode_acces: selectedMode,
        duree_acces: dureeAcces,
        raison_acces: raisonAcces
      });
      
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return;
      }
      
      console.log('=== DEBUG DMP ACCESS ===');
      console.log('Session Info:', sessionInfo);
      console.log('Données envoyées à l\'API:', {
        professionnel_id: sessionInfo.professionnel_id,
        patient_id: sessionInfo.patient_id,
        mode_acces: selectedMode,
        duree_acces: dureeAcces,
        raison_acces: raisonAcces
      });
              console.log('URL de l\'API:', 'http://localhost:3000/api/medecin/dmp/demande-acces');
      console.log('Token utilisé:', localStorage.getItem('token'));
      
      console.log('🚀 Envoi de la requête à l\'API...');
      const result = await requestDMPAccess({
        professionnel_id: sessionInfo.professionnel_id,
        patient_id: sessionInfo.patient_id,
        mode_acces: selectedMode,
        duree_acces: dureeAcces,
        raison_acces: raisonAcces
      });
      
      console.log('✅ Réponse de l\'API reçue:', result);
      console.log('=== FIN DEBUG ===');
      
      if (result.success || result.status === 'success') {
        setNotificationInfo(result.data?.notification);
        setCurrentStep('confirmation');
      } else {
        throw new Error(result.message || 'Erreur lors de la demande d\'accès');
      }
    } catch (error) {
      console.error('Erreur demande accès:', error);
      setError('Erreur lors de la demande d\'accès: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Retour à l'étape précédente
  const goBack = () => {
    if (currentStep === 'mode') {
      setCurrentStep('cps');
      setSelectedMode(null);
      setRaisonAcces('');
    } else if (currentStep === 'confirmation') {
      setCurrentStep('mode');
      setNotificationInfo(null);
    }
  };

  // Retour au dossier patient
  const handleBackToPatient = () => {
    navigate('/dossier-patient');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBackToPatient}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Retour au dossier patient
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Accès DMP</h1>
          </div>
          
          {patientInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Patient sélectionné</h3>
              <p className="text-blue-800">
                {patientInfo.prenom} {patientInfo.nom} - Dossier #{patientInfo.numero_dossier}
              </p>
            </div>
          )}
        </div>

        {/* Étape 1: Authentification CPS */}
        {currentStep === 'cps' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentification CPS</h2>
              <p className="text-gray-600">Saisissez votre code CPS à 4 chiffres</p>
            </div>

            <div className="max-w-xs mx-auto">
              <div className="flex justify-center space-x-2 mb-6">
                {codeCPS.map((digit, index) => (
                  <input
                    key={index}
                    id={`cps-input-${index}`}
                    type="number"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleCPSInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleCPSKeyDown(e, index)}
                    className={`w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      error ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isBlocked}
                  />
                ))}
              </div>

              {error && (
                <div className="text-center mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="text-center mb-4">
                <p className="text-sm text-gray-500">
                  Tentatives: {attempts}/{maxAttempts}
                </p>
              </div>

              <button
                onClick={validateCPS}
                disabled={isLoading || isBlocked || codeCPS.join('').length !== 4}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validation...
                  </div>
                ) : (
                  'Valider'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Étape 2: Sélection du mode d'accès */}
        {currentStep === 'mode' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Sélection du mode d'accès</h2>
              <p className="text-gray-600">Choisissez le mode d'accès approprié</p>
            </div>

            <div className="space-y-4 mb-6">
              {accessModes.map((mode) => (
                <div
                  key={mode.id}
                  onClick={() => selectAccessMode(mode.id)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMode === mode.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      mode.color === 'primary' ? 'bg-blue-100' :
                      mode.color === 'warning' ? 'bg-yellow-100' :
                      'bg-gray-100'
                    }`}>
                      <svg className={`h-5 w-5 ${
                        mode.color === 'primary' ? 'text-blue-600' :
                        mode.color === 'warning' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{mode.title}</h3>
                      <p className="text-sm text-gray-600">{mode.description}</p>
                    </div>
                    <input
                      type="radio"
                      name="accessMode"
                      value={mode.id}
                      checked={selectedMode === mode.id}
                      onChange={() => selectAccessMode(mode.id)}
                      className="text-blue-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            {selectedMode && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison d'accès *
                  </label>
                  <textarea
                    value={raisonAcces}
                    onChange={(e) => setRaisonAcces(e.target.value)}
                    placeholder="Décrivez la raison de votre demande d'accès..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    minLength="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 10 caractères requis
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée d'accès (minutes)
                  </label>
                  <select
                    value={dureeAcces}
                    onChange={(e) => setDureeAcces(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 heure</option>
                    <option value={120}>2 heures</option>
                    <option value={240}>4 heures</option>
                    <option value={480}>8 heures</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={goBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Retour
              </button>
              
              {/* Debug info */}
              <div className="text-xs text-gray-500 mb-2">
                Debug: selectedMode={selectedMode}, raisonAcces.length={raisonAcces.length}, isLoading={isLoading.toString()}
              </div>
              
              <button
                onClick={demanderAcces}
                disabled={!selectedMode || !raisonAcces || raisonAcces.length < 10 || isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Demande en cours...' : 'Demander l\'accès'}
              </button>
            </div>
          </div>
        )}

        {/* Étape 3: Confirmation */}
        {currentStep === 'confirmation' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès confirmé</h2>
              <p className="text-gray-600">Votre demande d'accès a été traitée avec succès</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">Détails de l'accès</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Patient:</span> {patientInfo?.prenom} {patientInfo?.nom}</p>
                <p><span className="font-medium">Mode d'accès:</span> {
                  accessModes.find(m => m.id === selectedMode)?.title
                }</p>
                <p><span className="font-medium">Durée:</span> {dureeAcces} minutes</p>
                <p><span className="font-medium">Raison:</span> {raisonAcces}</p>
              </div>
            </div>

            {notificationInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Notification envoyée</h3>
                <p className="text-sm text-blue-800">{notificationInfo.contenu}</p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={goBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Modifier
              </button>
              <button
                onClick={handleBackToPatient}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Terminer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DMPAccess; 