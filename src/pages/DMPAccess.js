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
        error: error2FA
    } = use2FA();
    
    // États pour l'authentification CPS
    const [codeCPS, setCodeCPS] = useState(['', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isBlocked] = useState(false);

    // États pour la sélection du mode d'accès
    const [selectedMode, setSelectedMode] = useState(null);
    const [raisonAcces, setRaisonAcces] = useState('');
    
    const [patientInfo, setPatientInfo] = useState(null);
    const [currentStep, setCurrentStep] = useState('cps'); // 'cps', 'mode', 'confirmation'
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

    const accessModes = [
        { id: 'standard', title: 'Accès autorisé par le patient', description: 'Le patient doit valider votre demande.', requiresPatientApproval: true },
        { id: 'urgence', title: 'Mode urgence', description: 'Accès immédiat en cas d\'urgence.', requiresPatientApproval: false },
        { id: 'secret', title: 'Connexion secrète', description: 'Accès discret pour consultation.', requiresPatientApproval: false }
    ];

    // Ajouter une étape pour l'accès au dossier patient
    const addPatientAccessStep = () => {
        if (accessStatus === 'authorized' || accessStatus === 'active') {
            setCurrentStep('patient_access');
        } else {
            // Si pas d'accès autorisé, commencer par la demande d'accès
            setCurrentStep('cps');
        }
    };

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
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentification CPS</h2>
            <p className="text-gray-600 mb-4">Veuillez saisir votre code CPS à 4 chiffres</p>
            
            <div className="flex gap-2 mb-4">
                {codeCPS.map((digit, index) => (
                    <input
                        key={index}
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
                        className="w-12 h-12 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                ))}
            </div>
            
            {error && (
                <div className="text-red-600 text-sm mb-4">{error}</div>
            )}
            
            {isBlocked && (
                <div className="text-red-600 text-sm mb-4">
                    Trop de tentatives. Réessayez dans 15 minutes.
                </div>
            )}
            
            <button
                onClick={() => setCurrentStep('mode')}
                disabled={isLoading || isBlocked || codeCPS.some(d => !d)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Vérification...' : 'Continuer'}
            </button>
        </div>
    );

    // Fonction de rendu pour l'étape de sélection du mode
    const renderModeStep = () => (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sélection du mode d'accès</h2>
            <p className="text-gray-600 mb-6">Choisissez le type d'accès que vous souhaitez demander</p>
            
            <div className="space-y-4 mb-6">
                {accessModes.map((mode) => (
                    <div
                        key={mode.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedMode === mode.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedMode(mode.id)}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-gray-800">{mode.title}</h3>
                                <p className="text-sm text-gray-600">{mode.description}</p>
                                {mode.requiresPatientApproval && (
                                    <p className="text-xs text-orange-600 mt-1">
                                        Nécessite l'approbation du patient
                                    </p>
                                )}
                            </div>
                            <input
                                type="radio"
                                name="accessMode"
                                value={mode.id}
                                checked={selectedMode === mode.id}
                                onChange={() => setSelectedMode(mode.id)}
                                className="text-blue-600"
                            />
                        </div>
                    </div>
                ))}
            </div>
            
            {selectedMode && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Raison de l'accès
                    </label>
                    <textarea
                        value={raisonAcces}
                        onChange={(e) => setRaisonAcces(e.target.value)}
                        placeholder="Décrivez brièvement la raison de votre demande d'accès..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                    />
                </div>
            )}
            
            <div className="flex gap-4">
                <button
                    onClick={() => setCurrentStep('cps')}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Retour
                </button>
                <button
                    onClick={() => setCurrentStep('confirmation')}
                    disabled={!selectedMode || !raisonAcces.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Continuer
                </button>
            </div>
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
                {currentStep === 'confirmation' && renderConfirmationStep()}
                {currentStep === 'patient_access' && renderPatientAccess()}
                {currentStep === 'error' && renderErrorStep()}
                
                {/* Modale 2FA pour la protection des dossiers patients */}
                {show2FAModal && (
                    <Validate2FA
                        onSubmit={handle2FAValidation}
                        onCancel={handle2FACancel}
                        loading={isSubmitting}
                        error={error2FA}
                        message="Vérification 2FA requise pour accéder aux dossiers patients"
                    />
                )}
            </div>
        </div>
    );
}

export default DMPAccess;