/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
// On importe les fonctions spécifiques dont on a besoin
import dmpApi from "../services/api/dmpApi";

function DMPAccess() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    
    // États pour l'authentification CPS
    const [codeCPS, setCodeCPS] = useState(['', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isBlocked] = useState(false);

    // États pour la sélection du mode d'accès
    const [selectedMode, setSelectedMode] = useState(null);
    const [raisonAcces, setRaisonAcces] = useState('');
    
    const [patientInfo] = useState(null);
    const [currentStep, setCurrentStep] = useState('cps'); // 'cps', 'mode', 'confirmation'
    const [accessStatus, setAccessStatus] = useState('loading');

    const accessModes = [
        { id: 'standard', title: 'Accès autorisé par le patient', description: 'Le patient doit valider votre demande.', requiresPatientApproval: true },
        { id: 'urgence', title: 'Mode urgence', description: 'Accès immédiat en cas d\'urgence.', requiresPatientApproval: false },
        { id: 'secret', title: 'Connexion secrète', description: 'Accès discret pour consultation.', requiresPatientApproval: false }
    ];

    const loadPatientInfo = useCallback(async () => {
        if (!patientId) {
            return;
        }
        try {
            setIsLoading(true);
            const response = await dmpApi.getAccessStatus(patientId);
            const status = response?.accessStatus || response?.status || 'not_authorized';
            setAccessStatus(status);

            // Si l'accès est déjà autorisé ou actif, rediriger directement vers DMPPatientView
            if (status === 'authorized' || status === 'active') {
                navigate(`/dmp-patient-view/${patientId}`);
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
                const response = await dmpApi.getAccessStatus(patientId);
                if (isMounted) {
                    const status = response?.accessStatus || response?.status || 'not_authorized';
                    setAccessStatus(status);
                    
                    // Si l'accès est déjà autorisé ou actif, rediriger directement vers DMPPatientView
                    if (status === 'authorized' || status === 'active') {
                        navigate(`/dmp-patient-view/${patientId}`);
                        return;
                    }
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
                    onClick={() => {
                        // Ici vous pouvez implémenter la logique d'envoi de la demande
                        console.log('Demande envoyée:', { selectedMode, raisonAcces, patientId });
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