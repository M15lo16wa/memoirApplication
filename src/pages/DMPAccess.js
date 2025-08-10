import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
// On importe les fonctions spécifiques dont on a besoin
import dmpApi, { 
    authenticateCPS, 
    requestStandardAccess,
    grantEmergencyAccess,
    grantSecretAccess,
} from "../services/api/dmpApi";

function DMPAccess() {
    const { patientId } = useParams();
    
    // États pour l'authentification CPS
    const [codeCPS, setCodeCPS] = useState(['', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const maxAttempts = 3;

    // États pour la sélection du mode d'accès
    const [selectedMode, setSelectedMode] = useState(null);
    const [raisonAcces, setRaisonAcces] = useState('');
    
    const [patientInfo, setPatientInfo] = useState(null);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [currentStep, setCurrentStep] = useState('cps'); // 'cps', 'mode', 'confirmation'
    const [accessStatus, setAccessStatus] = useState('loading');

    const accessModes = [
        { id: 'standard', title: 'Accès autorisé par le patient', description: 'Le patient doit valider votre demande.', requiresPatientApproval: true },
        { id: 'urgence', title: 'Mode urgence', description: 'Accès immédiat en cas d\'urgence.', requiresPatientApproval: false },
        { id: 'secret', title: 'Connexion secrète', description: 'Accès discret pour consultation.', requiresPatientApproval: false }
    ];

    const loadPatientInfo = useCallback(async () => {
        // Simuler un appel API pour récupérer les informations du patient
        setPatientInfo({ id: patientId, nom: "MOLOWA", prenom: "ESSONGA", numero_dossier: "PAT-17540449445" });
    }, [patientId]);

    useEffect(() => {
        if (patientId) {
            loadPatientInfo();
        }
    }, [patientId, loadPatientInfo]);

  // Récupérer le statut d'accès du DMP pour ce patient
  useEffect(() => {
      if (!patientId) {
          return;
      }
      let isMounted = true;
      const fetchStatus = async () => {
          try {
              const response = await dmpApi.getAccessStatus(patientId);
              if (isMounted) {
                  setAccessStatus(response.data.data.status);
              }
          } catch (error) {
              console.error("Erreur lors de la récupération du statut d'accès", error);
              if (isMounted) {
                  setAccessStatus('error');
              }
          }
      };
      fetchStatus();
      return () => {
          isMounted = false;
      };
  }, [patientId]);

    const validateCPS = async () => {
        if (isBlocked) {
            return;
        }
        const code = codeCPS.join('');
        if (code.length !== 4) {
            setError('Le code CPS doit contenir 4 chiffres.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            // Note: Le back-end n'a pas besoin du numéro ADELI, juste du code CPS
            // Le professionnel connecté est identifié par son token JWT
            const response = await authenticateCPS({ cpsCode: code });
            
            // L'API retourne déjà response.data, on vérifie la structure de la réponse
            console.log('Réponse API:', response);
            
            if (response.status === 'success') {
                const sessionData = response.data || response;
                setSessionInfo(sessionData); // Stocke les infos de la session et le token
                console.log('Session info:', sessionData); // Utilisation explicite pour ESLint
                setCurrentStep('mode');
            } else {
                throw new Error(response.message || 'Code CPS invalide');
            }
        } catch (err) {
            console.error('Erreur authentification CPS:', err);
            setError('Code CPS invalide ou erreur serveur.');
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            if (newAttempts >= maxAttempts) {
                setIsBlocked(true);
                setError('Trop de tentatives. Compte bloqué temporairement.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const demanderAcces = async () => {
        if (!selectedMode || !raisonAcces || raisonAcces.length < 10) {
            setError('Veuillez sélectionner un mode et fournir une raison valide (min 10 caractères).');
            return;
        }

        setIsLoading(true);
        setError(null);

        const accessData = {
            patient_id: patientId,
            raison_demande: raisonAcces, // Pour standard
            justification_urgence: raisonAcces, // Pour urgence
            raison_secrete: raisonAcces // Pour secret
        };

        try {
            let response;
            // On appelle la bonne fonction API en fonction du mode sélectionné
            if (selectedMode === 'standard') {
                response = await requestStandardAccess(accessData);
            } else if (selectedMode === 'urgence') {
                response = await grantEmergencyAccess(accessData);
            } else if (selectedMode === 'secret') {
                response = await grantSecretAccess(accessData);
            }

            console.log('Réponse demande accès:', response);

            if (response.status === 'success') {
                setCurrentStep('confirmation');
            } else {
                throw new Error(response.message || 'Erreur lors de la demande d\'accès.');
            }
        } catch (err) {
            console.error('Erreur demande accès:', err);
            setError(err.response?.data?.message || err.message || 'Une erreur est survenue.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCPSInputChange = (index, value) => {
        if (value.length <= 1 && /^\d*$/.test(value)) {
            const newCodeCPS = [...codeCPS];
            newCodeCPS[index] = value;
            setCodeCPS(newCodeCPS);
            
            // Auto-focus sur le champ suivant
            if (value && index < 3) {
                const nextInput = document.querySelector(`input[data-index="${index + 1}"]`);
                if (nextInput) {
                    nextInput.focus();
                }
            }
        }
    };

    const handleCPSKeyDown = (event, index) => {
        if (event.key === 'Backspace' && !codeCPS[index] && index > 0) {
            const newCodeCPS = [...codeCPS];
            newCodeCPS[index - 1] = '';
            setCodeCPS(newCodeCPS);
            
            const prevInput = document.querySelector(`input[data-index="${index - 1}"]`);
            if (prevInput) {
                prevInput.focus();
            }
        }
    };

    const renderCPSStep = () => (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentification CPS</h2>
            <p className="text-gray-600 mb-6">Veuillez saisir votre code CPS à 4 chiffres</p>
            
            <div className="flex justify-center space-x-2 mb-6">
                {codeCPS.map((digit, index) => (
                    <input
                        key={index}
                        type="text"
                        data-index={index}
                        value={digit}
                        onChange={(e) => handleCPSInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleCPSKeyDown(e, index)}
                        className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        maxLength={1}
                        disabled={isBlocked}
                    />
                ))}
            </div>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            
            <button
                onClick={validateCPS}
                disabled={isLoading || isBlocked || codeCPS.join('').length !== 4}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Vérification...' : 'Valider'}
            </button>
        </div>
    );

    const renderModeStep = () => (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sélection du mode d'accès</h2>
            <p className="text-gray-600 mb-6">Choisissez le type d'accès au DMP du patient</p>
            
            <div className="space-y-4 mb-6">
                {accessModes.map((mode) => (
                    <div
                        key={mode.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedMode === mode.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedMode(mode.id)}
                    >
                        <h3 className="font-semibold text-gray-800">{mode.title}</h3>
                        <p className="text-gray-600 text-sm">{mode.description}</p>
                    </div>
                ))}
            </div>
            
            {selectedMode && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Raison de la demande
                    </label>
                    <textarea
                        value={raisonAcces}
                        onChange={(e) => setRaisonAcces(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        rows={4}
                        placeholder="Décrivez la raison de votre demande d'accès..."
                    />
                </div>
            )}
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            
            <button
                onClick={demanderAcces}
                disabled={isLoading || !selectedMode || raisonAcces.length < 10}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Envoi en cours...' : 'Demander l\'accès'}
            </button>
        </div>
    );

    const renderConfirmationStep = () => (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Demande envoyée</h2>
            <p className="text-gray-600 mb-6">
                Votre demande d'accès a été envoyée avec succès. 
                {selectedMode === 'standard' && ' Le patient devra valider votre demande.'}
            </p>
            <button
                onClick={() => setCurrentStep('cps')}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
                Nouvelle demande
            </button>
        </div>
    );

    const accessStatusMeta = (status) => {
        switch (status) {
            case 'authorized':
                return { label: 'Accès autorisé', cls: 'text-green-600' };
            case 'expired':
                return { label: 'Accès expiré', cls: 'text-yellow-600' };
            case 'pending':
                return { label: 'Demande en attente', cls: 'text-orange-600' };
            case 'not_authorized':
                return { label: 'Accès non autorisé', cls: 'text-red-600' };
            case 'loading':
                return { label: 'Vérification du statut...', cls: 'text-gray-500' };
            case 'error':
                return { label: 'Erreur de statut', cls: 'text-red-600' };
            default:
                return { label: String(status || ''), cls: 'text-gray-600' };
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto px-4">
                {patientInfo && (
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Accès DMP - {patientInfo.nom} {patientInfo.prenom}
                        </h1>
                        <p className="text-gray-600">Dossier: {patientInfo.numero_dossier}</p>
                        <p className={`text-sm mt-1 ${accessStatusMeta(accessStatus).cls}`}>
                            Statut d'accès: {accessStatusMeta(accessStatus).label}
                        </p>
                        {sessionInfo && (
                            <p className="text-sm text-green-600 mt-2">
                                Session active - Professionnel authentifié
                            </p>
                        )}
                    </div>
                )}
                
                {currentStep === 'cps' && renderCPSStep()}
                {currentStep === 'mode' && renderModeStep()}
                {currentStep === 'confirmation' && renderConfirmationStep()}
            </div>
        </div>
    );
}

export default DMPAccess;