/**
 * Composant DMPAccess - Accès sécurisé aux dossiers patients avec protection 2FA
 * 
 * Ce composant implémente un système d'accès aux dossiers patients avec plusieurs niveaux de sécurité :
 * 1. Authentification CPS (Code de Professionnel de Santé)
 * 2. Sélection du mode d'accès (standard, urgence, secret)
 * 3. Protection 2FA pour l'accès aux données sensibles
 * 4. Gestion des autorisations et des demandes d'accès
 * 
 * Utilisation du hook use2FA :
 * - with2FAProtection : Enveloppe les fonctions sensibles avec protection 2FA
 * - show2FAModal : Affiche la modale de vérification 2FA
 * - handle2FAValidation : Gère la validation 2FA
 * - handle2FACancel : Gère l'annulation 2FA
 * 
 * Exemple d'utilisation :
 * ```jsx
 * <DMPAccess patientId="123" />
 * ```
 */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
// On importe les fonctions spécifiques dont on a besoin
import dmpApi from "../services/api/dmpApi";

// Protection 2FA pour l'accès aux dossiers patients
import { use2FA } from '../hooks/use2FA';
import { getPatient } from '../services/api/patientApi'; // API pour récupérer un dossier
import Validate2FA from '../components/2fa/Validate2FA';

function DMPAccess() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    
    // Hook 2FA pour la protection des dossiers patients
    const { 
        show2FAModal, 
        with2FAProtection, 
        handle2FAValidation, 
        handle2FACancel,
        isSubmitting,
        error: error2FA,
        tempTokenId,
        setUserDataFor2FA // Ajout de setUserDataFor2FA
    } = use2FA();
    
    // États pour l'authentification CPS
    const [codeCPS, setCodeCPS] = useState(['', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isBlocked] = useState(false);

    // États pour la sélection du mode d'accès
    const [selectedMode, setSelectedMode] = useState(null);
    const [raisonAcces, setRaisonAcces] = useState('');
    
    // Nouveaux états pour le mode urgence
    const [patientNom, setPatientNom] = useState('');
    const [patientPrenom, setPatientPrenom] = useState('');
    const [justificationUrgence, setJustificationUrgence] = useState('');
    
    const [patientInfo, setPatientInfo] = useState(null);
    const [currentStep, setCurrentStep] = useState('cps'); // 'cps', 'mode', 'confirmation', 'urgence'
    const [accessStatus, setAccessStatus] = useState('loading');

    // On "enveloppe" notre fonction d'accès aux données avec le protecteur 2FA
    const protectedGetPatientRecord = with2FAProtection(async () => {
        console.log('🚀 Accès autorisé, récupération du dossier patient...');
        try {
            const data = await getPatient(patientId);
            setPatientInfo(data);
            console.log('✅ Dossier patient récupéré avec succès:', data);
            return data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération du dossier patient:', error);
            setError('Erreur lors de la récupération du dossier patient');
            throw error;
        }
    }, 'Accès au dossier patient');

    // Fonction protégée pour demander l'accès
    const protectedRequestAccess = with2FAProtection(async () => {
        console.log('🚀 Accès autorisé, envoi de la demande d\'accès...');
        try {
            const accessData = {
                mode: selectedMode,
                raison: raisonAcces,
                patient_id: Number(patientId)
            };
            await dmpApi.requestStandardAccess(accessData);
            alert('Demande envoyée avec succès !');
            setCurrentStep('cps');
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de la demande d\'accès:', error);
            alert('Erreur lors de l\'envoi de la demande d\'accès');
            throw error;
        }
    }, 'Demande d\'accès au dossier patient');

    // Fonction protégée pour l'accès d'urgence
    const protectedEmergencyAccess = with2FAProtection(useCallback(async () => {
        try {
            console.log('🚀 Accès d\'urgence autorisé, récupération des informations patient...');
            
            // Première étape : appeler searchPatientFullData SANS twoFactorToken pour déclencher la 2FA
            const searchData = {
                nom: patientNom.trim(),
                prenom: patientPrenom.trim()
                // Ne pas passer twoFactorToken ici - laisser searchPatientFullData créer la session 2FA
            };
            
            console.log('🔍 Tentative de recherche patient - déclenchement 2FA...');
            
            // Appel API pour rechercher le patient - cela va déclencher la création de session 2FA
            const patientResponse = await dmpApi.searchPatientFullData(searchData);
            
            // Si on arrive ici, c'est que la 2FA a été validée et la recherche a réussi
            if (!patientResponse || !patientResponse.data || patientResponse.data.length === 0) {
                throw new Error('Patient non trouvé avec ces informations');
            }
            
            // Prendre le premier patient trouvé
            const patientData = patientResponse.data[0];
            
            if (!patientData || !patientData.id) {
                throw new Error('Données patient incomplètes');
            }
            
            // Enregistrement de l'accès d'urgence
            const emergencyAccessData = {
                mode: 'urgence',
                raison: justificationUrgence,
                patient_id: patientData.id,
                justification_urgence: justificationUrgence,
                timestamp: new Date().toISOString()
            };
            
            // Utiliser la fonction recordEmergencyAccess si elle existe, sinon créer une entrée dans l'historique
            try {
                await dmpApi.recordEmergencyAccess(emergencyAccessData);
            } catch (recordError) {
                console.warn('⚠️ Impossible d\'enregistrer l\'accès d\'urgence, continuation...', recordError);
            }
            
            // Récupération du dossier complet
            const fullPatientData = await getPatient(patientData.id);
            setPatientInfo(fullPatientData);
            
            console.log('✅ Accès d\'urgence réussi, dossier patient récupéré:', fullPatientData);
            
            // Nettoyer le tempTokenId temporaire après utilisation réussie
            const tempTokenId = localStorage.getItem('tempTokenId_urgence');
            if (tempTokenId) {
                localStorage.removeItem('tempTokenId_urgence');
                console.log('🧹 tempTokenId temporaire nettoyé après utilisation réussie');
            }
            
            // Redirection vers la vue du patient
            navigate(`/dmp-patient-view/${patientData.id}`);
            
            return fullPatientData;
        } catch (error) {
            console.error('❌ Erreur lors de l\'accès d\'urgence:', error);
            setError('Erreur lors de l\'accès d\'urgence: ' + (error?.message || 'Inconnue'));
            throw error;
        }
    }, [patientNom, patientPrenom, justificationUrgence, navigate]), 'Accès d\'urgence au dossier patient');

    const accessModes = [
        { id: 'standard', title: 'Accès autorisé par le patient', description: 'Le patient doit valider votre demande.', requiresPatientApproval: true },
        { id: 'urgence', title: 'Mode urgence', description: "Accès immédiat pour situations critiques (traçage obligatoire).", requiresPatientApproval: false }
    ];

    // Ajouter une étape pour l'accès au dossier patient
    // const addPatientAccessStep = () => {
    //     if (accessStatus === 'authorized' || accessStatus === 'active') {
    //         setCurrentStep('patient_access');
    //     } else {
    //         // Si pas d'accès autorisé, commencer par la demande d'accès
    //         setCurrentStep('cps');
    //     }
    // };

    const loadPatientInfo = useCallback(async () => {
        if (!patientId) {
            return;
        }
        try {
            setIsLoading(true);
            const response = await dmpApi.getAccessStatus(patientId);
            const status = response?.accessStatus || response?.status || 'not_authorized';
            setAccessStatus(status);

            // Si l'accès est déjà autorisé ou actif, proposer l'accès au dossier
            if (status === 'authorized' || status === 'active') {
                setCurrentStep('patient_access');
                return;
            }

            if (status === 'active') {
                setCurrentStep('confirmation');
            } else {
                setCurrentStep('cps');
            }
        } catch (e) {
            setError("Erreur lors de la vérification du statut d'accès.");
            setCurrentStep('error');
        } finally {
            setIsLoading(false);
        }
    }, [patientId, navigate]);

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
                console.log('🔍 DEBUG - Vérification du statut d\'accès pour patient:', patientId);
                const response = await dmpApi.getAccessStatus(patientId);
                console.log('🔍 DEBUG - Réponse API getAccessStatus:', response);
                
                if (isMounted) {
                    const status = response?.accessStatus || response?.status || 'not_authorized';
                    console.log('🔍 DEBUG - Statut d\'accès déterminé:', status);
                    setAccessStatus(status);
                    
                    // Si l'accès est déjà autorisé ou actif, rediriger directement vers DMPPatientView
                    if (status === 'authorized' || status === 'active') {
                        console.log('✅ SUCCESS - Accès autorisé, redirection vers DMPPatientView...');
                        console.log('  - URL de redirection:', `/dmp-patient-view/${patientId}`);
                        navigate(`/dmp-patient-view/${patientId}`);
                        return;
                    } else {
                        console.log('⚠️ WARNING - Statut d\'accès non autorisé:', status);
                        console.log('  - Statuts autorisés: authorized, active');
                        console.log('  - Statut actuel:', status);
                    }
                }
            } catch (error) {
                console.error("❌ ERROR - Erreur lors de la récupération du statut d'accès", error);
                if (isMounted) {
                    setAccessStatus('error');
                }
            }
        };
        fetchStatus();
        return () => {
            isMounted = false;
        };
    }, [patientId, navigate]);

    // Fonction appelée quand la validation 2FA réussit
    const handle2FASuccess = useCallback(async () => {
        console.log('🎉 Validation 2FA réussie, fermeture de la modale et recherche directe du patient...');
        console.log('🔍 DEBUG - État des variables:', {
            patientNom,
            patientPrenom,
            justificationUrgence,
            currentStep
        });
        
        try {
            // Maintenant que la 2FA est validée, faire directement la recherche patient
            console.log('🔍 Recherche directe du patient après validation 2FA...');
            
            const searchData = {
                nom: patientNom.trim(),
                prenom: patientPrenom.trim(),
                twoFactorToken: 'VALIDATED' // Indiquer que la 2FA est validée
            };
            
            const patientResponse = await dmpApi.searchPatientFullData(searchData);
            
            // 🔍 DEBUG - Vérifier la structure de la réponse
            console.log('🔍 DEBUG - Structure de la réponse patientResponse:', {
                patientResponse,
                hasData: !!patientResponse,
                hasDataProperty: !!patientResponse?.data,
                dataType: typeof patientResponse?.data,
                isArray: Array.isArray(patientResponse?.data),
                dataLength: patientResponse?.data?.length,
                keys: patientResponse ? Object.keys(patientResponse) : [],
                fullResponse: JSON.stringify(patientResponse, null, 2)
            });
            
            // Gérer différentes structures de réponse possibles
            let patientDataArray = null;
            
            if (patientResponse?.data && Array.isArray(patientResponse.data)) {
                // Structure: { data: [...] }
                patientDataArray = patientResponse.data;
            } else if (Array.isArray(patientResponse)) {
                // Structure: [...] (réponse directe)
                patientDataArray = patientResponse;
            } else if (patientResponse?.patients && Array.isArray(patientResponse.patients)) {
                // Structure: { patients: [...] }
                patientDataArray = patientResponse.patients;
            } else if (patientResponse?.results && Array.isArray(patientResponse.results)) {
                // Structure: { results: [...] }
                patientDataArray = patientResponse.results;
            }
            
            if (!patientDataArray || patientDataArray.length === 0) {
                throw new Error(`Patient non trouvé avec ces informations. Structure reçue: ${JSON.stringify(patientResponse)}`);
            }
            
            // Prendre le premier patient trouvé
            const patientData = patientDataArray[0];
            
            console.log('🔍 DEBUG - Patient data extrait:', {
                patientData,
                hasId: !!patientData?.id,
                hasPatientId: !!patientData?.patient_id,
                hasIdPatient: !!patientData?.id_patient,
                keys: patientData ? Object.keys(patientData) : []
            });
            
            // Vérifier l'ID du patient (gérer différents noms de propriété)
            // Priorité : id_patient > patient_id > id
            const patientId = patientData.id_patient || patientData.patient_id || patientData.id;
            
            if (!patientId) {
                throw new Error(`Données patient incomplètes - ID manquant. Données reçues: ${JSON.stringify(patientData)}`);
            }
            
            // Enregistrement de l'accès d'urgence
            const emergencyAccessData = {
                mode: 'urgence',
                raison: justificationUrgence,
                patient_id: patientId,
                justification_urgence: justificationUrgence,
                timestamp: new Date().toISOString()
            };
            
            try {
                const recordResult = await dmpApi.recordEmergencyAccess(emergencyAccessData);
                if (recordResult.status === 'warning') {
                    console.warn('⚠️ Enregistrement d\'urgence avec avertissement:', recordResult.message);
                } else {
                    console.log('✅ Accès d\'urgence enregistré avec succès');
                }
            } catch (recordError) {
                console.warn('⚠️ Impossible d\'enregistrer l\'accès d\'urgence, mais l\'accès principal fonctionne:', recordError);
            }
            
            // Récupération du dossier complet
            const fullPatientData = await getPatient(patientId);
            setPatientInfo(fullPatientData);
            
            console.log('✅ Accès d\'urgence réussi, dossier patient récupéré:', fullPatientData);
            
            // Nettoyer le tempTokenId temporaire après utilisation réussie
            const tempTokenId = localStorage.getItem('tempTokenId_urgence');
            if (tempTokenId) {
                localStorage.removeItem('tempTokenId_urgence');
                console.log('🧹 tempTokenId temporaire nettoyé après utilisation réussie');
            }
            
            // Redirection vers la vue du patient
            navigate(`/dmp-patient-view/${patientId}`);
            
        } catch (error) {
            console.error('❌ Erreur lors de la recherche directe après validation 2FA:', error);
            setError('Erreur lors de la recherche du patient: ' + error.message);
        }
    }, [patientNom, patientPrenom, justificationUrgence, currentStep, navigate]);

    // Initialiser les données utilisateur pour la 2FA
    useEffect(() => {
        const medecinData = localStorage.getItem('medecin');
        const professionnelData = localStorage.getItem('professionnel');
        
        if (medecinData || professionnelData) {
            const userData = medecinData ? JSON.parse(medecinData) : JSON.parse(professionnelData);
            setUserDataFor2FA(userData);
            console.log('👤 Données utilisateur initialisées pour 2FA:', userData);
        }
    }, [setUserDataFor2FA]);

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

    // Fonction de rendu pour l'étape CPS
    const renderCPSStep = () => (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
            {/* En-tête avec icône */}
            <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentification CPS</h2>
                <p className="text-gray-600 text-sm">Veuillez saisir votre code CPS à 4 chiffres</p>
            </div>
            
            {/* Champs de saisie du code */}
            <div className="mb-8">
                <div className="flex gap-3 justify-center mb-6">
                    {codeCPS.map((digit, index) => (
                        <div key={index} className="relative">
                            <input
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => {
                                    const newCode = [...codeCPS];
                                    newCode[index] = e.target.value;
                                    setCodeCPS(newCode);
                                    
                                    // Auto-focus next input
                                    if (e.target.value && index < 3) {
                                        e.target.nextElementSibling?.focus();
                                    }
                                }}
                                onKeyDown={(e) => {
                                    // Permettre la suppression et la navigation
                                    if (e.key === 'Backspace' && !digit && index > 0) {
                                        const prevInput = e.target.previousElementSibling;
                                        if (prevInput) {
                                            prevInput.focus();
                                            const newCode = [...codeCPS];
                                            newCode[index - 1] = '';
                                            setCodeCPS(newCode);
                                        }
                                    }
                                }}
                                className={`
                                    w-14 h-14 text-center text-xl font-bold border-2 rounded-xl 
                                    transition-all duration-200 ease-in-out
                                    focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                                    ${digit 
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                                        : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
                                    }
                                `}
                                style={{
                                    boxShadow: digit ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none'
                                }}
                            />
                            {/* Indicateur de focus */}
                            <div className={`
                                absolute inset-0 rounded-xl border-2 pointer-events-none
                                transition-all duration-200 ease-in-out
                                ${digit ? 'border-blue-500' : 'border-transparent'}
                            `} />
                        </div>
                    ))}
                </div>
                
                {/* Indicateur de progression */}
                <div className="flex justify-center mb-4">
                    <div className="flex gap-2">
                        {codeCPS.map((digit, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    digit ? 'bg-blue-500 scale-125' : 'bg-gray-300'
                                }`}
                            />
                        ))}
                    </div>
                </div>
                
                {/* Aide visuelle */}
                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        {codeCPS.filter(d => d).length}/4 chiffres saisis
                    </p>
                </div>
            </div>
            
            {/* Messages d'erreur et d'avertissement */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-pulse">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-red-600 text-sm font-medium">{error}</span>
                    </div>
                </div>
            )}
            
            {isBlocked && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-orange-600 text-sm font-medium">
                            Trop de tentatives. Réessayez dans 15 minutes.
                        </span>
                    </div>
                </div>
            )}
            
            {/* Bouton de validation */}
            <button
                onClick={() => setCurrentStep('mode')}
                disabled={isLoading || isBlocked || codeCPS.some(d => !d)}
                className={`
                    w-full py-4 px-6 rounded-xl font-semibold text-white text-lg
                    transition-all duration-300 ease-in-out transform
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    ${codeCPS.every(d => d) && !isLoading && !isBlocked
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-gray-400 cursor-not-allowed'
                    }
                    shadow-lg
                `}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        <span>Vérification en cours...</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Continuer</span>
                    </div>
                )}
            </button>
            
            {/* Informations supplémentaires */}
            <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                    Votre code CPS est strictement confidentiel
                </p>
                <div className="mt-2 flex items-center justify-center text-xs text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sécurisé par cryptage SSL
                </div>
            </div>
        </div>
    );

    // Fonction de rendu pour l'étape de sélection du mode
    const renderModeStep = () => (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Sélection du mode d'accès</h2>
                    <p className="text-gray-600">Choisissez le type d'accès adapté à votre contexte d'intervention</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    {accessModes.map((mode) => {
                        const isSelected = selectedMode === mode.id;
                        const isUrgence = mode.id === 'urgence';
                        return (
                            <div
                                key={mode.id}
                                className={`relative p-5 rounded-xl border transition-all duration-300 cursor-pointer 
                                    ${isSelected ? 'border-blue-600 ring-4 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}
                                    ${isUrgence ? 'bg-gradient-to-br from-red-50 to-white' : 'bg-white'}`}
                                onClick={() => {
                                    setSelectedMode(mode.id);
                                    if (isUrgence) {
                                        setCurrentStep('urgence');
                                    }
                                }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md 
                                        ${isUrgence ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
                                    >
                                        {isUrgence ? (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1a4 4 0 01-8 0v-1m12 0a8 8 0 11-16 0 8 8 0 0116 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-gray-900">{mode.title}</h3>
                                            <div className="flex items-center gap-2">
                                                {mode.requiresPatientApproval && (
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">
                                                        Approbation patient
                                                    </span>
                                                )}
                                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded 
                                                    ${isUrgence ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                                                >
                                                    {isUrgence ? 'Immédiat' : 'Standard'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">{mode.description}</p>
                                    </div>
                                </div>

                                {/* Radio visuel de sélection */}
                                <div className="absolute top-4 right-4">
                                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border-2 
                                        transition-colors duration-200 ${isSelected ? 'border-blue-600' : 'border-gray-300'}`}>
                                        {isSelected && (
                                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Zone raison pour le mode standard uniquement */}
                {selectedMode && selectedMode !== 'urgence' && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Raison de l'accès
                        </label>
                        <textarea
                            value={raisonAcces}
                            onChange={(e) => setRaisonAcces(e.target.value)}
                            placeholder="Décrivez brièvement la raison de votre demande d'accès..."
                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                            rows="3"
                        />
                        <p className="text-xs text-gray-500 mt-1">Cette information sera visible par le patient.</p>
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={() => setCurrentStep('cps')}
                        className="px-5 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Retour
                    </button>
                    {selectedMode && selectedMode !== 'urgence' && (
                        <button
                            onClick={() => setCurrentStep('confirmation')}
                            disabled={!raisonAcces.trim()}
                            className={`px-6 py-3 rounded-xl text-white font-semibold transition-all shadow-lg 
                                ${raisonAcces.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                        >
                            Continuer
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    // Fonction de rendu pour l'étape d'urgence
    const renderUrgencyStep = () => (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
                <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Accès d'urgence</h2>
                        <p className="text-sm text-red-600">Accès immédiat sans autorisation patient</p>
                    </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-800">
                        <strong>Attention :</strong> L'accès d'urgence est réservé aux situations médicales critiques. 
                        Toute utilisation abusive sera tracée et pourra faire l'objet de sanctions.
                    </p>
                </div>
            </div>
            
            <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom du patient *
                        </label>
                        <input
                            type="text"
                            value={patientNom}
                            onChange={(e) => setPatientNom(e.target.value)}
                            placeholder="Nom de famille"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prénom du patient *
                        </label>
                        <input
                            type="text"
                            value={patientPrenom}
                            onChange={(e) => setPatientPrenom(e.target.value)}
                            placeholder="Prénom"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            required
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Justification de l'urgence *
                    </label>
                    <textarea
                        value={justificationUrgence}
                        onChange={(e) => setJustificationUrgence(e.target.value)}
                        placeholder="Décrivez la situation d'urgence qui justifie cet accès immédiat..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        rows="4"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Exemples : arrêt cardiaque, traumatisme crânien, détresse respiratoire, etc.
                    </p>
                </div>
            </div>
            
            <div className="flex gap-4">
                <button
                    onClick={() => setCurrentStep('mode')}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Retour
                </button>
                <button
                    onClick={protectedEmergencyAccess}
                    disabled={!patientNom.trim() || !patientPrenom.trim() || !justificationUrgence.trim() || isSubmitting}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Accès en cours...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Accès d'urgence
                        </>
                    )}
                </button>
            </div>
            
            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}
        </div>
    );

    // Fonction de rendu pour l'étape de confirmation
    const renderConfirmationStep = () => (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirmation de la demande</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-800 mb-2">Récapitulatif de votre demande</h3>
                <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Mode d'accès:</strong> {accessModes.find(m => m.id === selectedMode)?.title}</p>
                    <p><strong>Raison:</strong> {raisonAcces}</p>
                    <p><strong>Patient:</strong> {patientInfo?.nom} {patientInfo?.prenom}</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <button
                    onClick={async () => {
                        try {
                            await protectedRequestAccess();
                        } catch (error) {
                            console.error('Erreur lors de l\'envoi de la demande d\'accès:', error);
                            alert('Erreur lors de l\'envoi de la demande d\'accès');
                        }
                    }}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700"
                >
                    Confirmer et envoyer la demande
                </button>
                
                <button
                    onClick={() => setCurrentStep('mode')}
                    className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Modifier la demande
                </button>
                
                {/* Bouton pour accéder directement au dossier patient (si autorisé) */}
                {accessStatus === 'authorized' && (
                    <button
                        onClick={() => setCurrentStep('patient_access')}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
                    >
                        Accéder au dossier patient
                    </button>
                )}
            </div>
        </div>
    );

    // Fonction de rendu pour l'accès au dossier patient
    const renderPatientAccess = () => (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Accès au dossier patient</h2>
            <p className="text-gray-600 mb-6">
                Cliquez sur le bouton ci-dessous pour accéder au dossier complet du patient.
                Une vérification 2FA sera requise pour sécuriser l'accès.
            </p>
            
            <button
                onClick={protectedGetPatientRecord}
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isSubmitting ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Accès en cours...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Accéder au dossier patient
                    </>
                )}
            </button>
            
            {error2FA && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error2FA}</p>
                </div>
            )}
            
            <div className="mt-4 flex gap-3">
                <button
                    onClick={() => setCurrentStep('cps')}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Retour à l'authentification
                </button>
                
                <button
                    onClick={() => setCurrentStep('mode')}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Demander un accès
                </button>
            </div>
        </div>
    );

    // Fonction de rendu pour l'étape d'erreur
    const renderErrorStep = () => (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Erreur</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                
                <div className="space-y-3">
                    <button
                        onClick={() => {
                            setError(null);
                            setCurrentStep('cps');
                        }}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                        Réessayer
                    </button>
                    
                    <button
                        onClick={() => navigate('/')}
                        className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Retour à l'accueil
                    </button>
                </div>
            </div>
        </div>
    );

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
                        
                        {/* Bouton d'accès rapide au dossier patient */}
                        {(accessStatus === 'authorized' || accessStatus === 'active') && (
                            <div className="mt-4">
                                <button
                                    onClick={() => setCurrentStep('patient_access')}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Accéder au dossier patient
                                </button>
                            </div>
                        )}
                        
                        {/* Bouton de test pour forcer la redirection */}
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 text-sm mb-2">🔧 DEBUG - Test de redirection</p>
                            <button
                                onClick={() => {
                                    console.log('🔧 DEBUG - Test de redirection manuelle vers:', `/dmp-patient-view/${patientId}`);
                                    navigate(`/dmp-patient-view/${patientId}`);
                                }}
                                className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                            >
                                Tester Redirection
                            </button>
                            <p className="text-yellow-700 text-xs mt-1">Statut actuel: {accessStatus}</p>
                        </div>
                    </div>
                )}
                
                {currentStep === 'cps' && renderCPSStep()}
                {currentStep === 'mode' && renderModeStep()}
                {currentStep === 'urgence' && renderUrgencyStep()}
                {currentStep === 'confirmation' && renderConfirmationStep()}
                {currentStep === 'patient_access' && renderPatientAccess()}
                {currentStep === 'error' && renderErrorStep()}
                
                {/* Modale 2FA pour la protection des dossiers patients */}
                {show2FAModal && (
                    <Validate2FA
                        onSuccess={handle2FASuccess}
                        onCancel={handle2FACancel}
                        loading={isSubmitting}
                        error={error2FA}
                        message="Vérification 2FA requise pour accéder aux dossiers patients"
                        tempTokenId={localStorage.getItem('tempTokenId_urgence')}
                        // userData nécessaire pour extraire userType et identifier
                        // mais Validate2FA ne doit utiliser que la validation simple
                        userData={JSON.parse(localStorage.getItem('medecin') || localStorage.getItem('professionnel') || '{}')}
                        simpleMode={true} // Activer le mode simple pour l'accès d'urgence
                    />
                )}
            </div>
        </div>
    );
}

export default DMPAccess;