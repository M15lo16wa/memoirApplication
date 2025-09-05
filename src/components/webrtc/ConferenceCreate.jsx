// src/components/webrtc/ConferenceCreate.jsx
import React, { useState, useEffect } from 'react';

/**
 * Composant de création de conférence WebRTC
 * Permet aux médecins de créer des conférences avec sélection de patient
 */
const ConferenceCreate = ({
    userType,
    user,
    token,
    serverUrl = 'http://localhost:3000',
    onConferenceCreated,
    onError,
    onBackToList
}) => {
    // États
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingPatients, setIsLoadingPatients] = useState(true);
    const [error, setError] = useState(null);
    const [patients, setPatients] = useState([]);
    const [formData, setFormData] = useState({
        patientId: '',
        sessionType: 'consultation',
        expiryHours: 24
    });

    // Charger la liste des patients au montage
    useEffect(() => {
        if (userType === 'medecin') {
            loadPatients();
        }
    }, [userType]);

    const loadPatients = async () => {
        try {
            setIsLoadingPatients(true);
            setError(null);
            console.log('📋 [ConferenceCreate] Chargement des patients autorisés via le service WebRTC...');

            // Utiliser uniquement le service WebRTC pour récupérer les patients autorisés
            const WebRTCService = (await import('../../services/webrtc.service.js')).default;
            const webrtcService = new WebRTCService();
            await webrtcService.initialize(token, null, userType, user);

            const patientsData = await webrtcService.getAuthorizedPatients();
            setPatients(Array.isArray(patientsData) ? patientsData : []);
            console.log('✅ [ConferenceCreate] Patients autorisés chargés via service WebRTC:', patientsData);

        } catch (error) {
            console.error('❌ [ConferenceCreate] Erreur chargement patients via service WebRTC:', error);

            // Message d'erreur plus informatif
            let errorMessage = 'Erreur lors du chargement des patients';
            if (error.message.includes('Format de données invalide')) {
                errorMessage = 'Format de données invalide reçu de l\'API. Vérifiez la structure des données.';
            } else if (error.message.includes('404')) {
                errorMessage = 'API des patients non trouvée. Vérifiez que le serveur est démarré.';
            } else if (error.message.includes('401')) {
                errorMessage = 'Authentification requise. Veuillez vous reconnecter.';
            } else {
                errorMessage = `Erreur lors du chargement des patients: ${error.message}`;
            }

            setError(errorMessage);
            setPatients([]);
        } finally {
            setIsLoadingPatients(false);
        }
    };

    const handleCreateConference = async (formData) => {
        try {
            setIsLoading(true);
            setError(null);

            // ✅ VALIDATION : Vérifier que patientId est valide
            if (!formData.patientId || isNaN(parseInt(formData.patientId))) {
                throw new Error('Veuillez sélectionner un patient valide');
            }

            // ✅ CONVERSION : Convertir en nombre
            const numericPatientId = parseInt(formData.patientId);

            // Utiliser le service WebRTC pour créer la conférence
            const WebRTCService = (await import('../../services/webrtc.service.js')).default;
            const webrtcService = new WebRTCService();
            await webrtcService.initialize(token, null, userType, user);

            const conferenceData = await webrtcService.createConference(
                numericPatientId,
                formData.sessionType,
                formData.expiryHours
            );

            console.log('✅ [ConferenceCreate] Conférence créée via service WebRTC:', conferenceData);

            // Afficher le lien généré
            const conferenceUrl = conferenceData.conferenceUrl || conferenceData.joinUrl;
            const conferenceCode = conferenceData.conferenceCode || conferenceData.code;

            // Copier le lien dans le presse-papier
            if (conferenceUrl) {
                navigator.clipboard.writeText(conferenceUrl);
            }

            // Notifier le succès
            alert(`Conférence créée !\nCode: ${conferenceCode}\n${conferenceUrl ? 'Lien copié dans le presse-papier.' : ''}`);

            // Appeler le callback si fourni
            if (onConferenceCreated) {
                onConferenceCreated(conferenceData);
            }

        } catch (error) {
            console.error('❌ [ConferenceCreate] Erreur création conférence:', error);
            setError(error.message);
            if (onError) {
                onError(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleCreateConference(formData);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Créer une conférence
                </h2>
                <p className="text-gray-600">
                    Créez une conférence vidéo pour consulter un patient autorisé.
                </p>
                <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                        <span className="font-medium">Service WebRTC</span> - Chargement des patients autorisés depuis l'API
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sélection du patient */}
                <div>
                    <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
                        Patients autorisés avec prescriptions actives *
                    </label>
                    <select
                        id="patientId"
                        name="patientId"
                        value={formData.patientId}
                        onChange={handleInputChange}
                        required
                        disabled={isLoadingPatients}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="">
                            {isLoadingPatients
                                ? 'Chargement des patients...'
                                : patients.length === 0
                                    ? 'Aucun patient avec prescriptions actives'
                                    : 'Sélectionner un patient'
                            }
                        </option>
                        {patients.map(patient => (
                            <option key={patient.id} value={patient.id}>
                                {patient.prenom} {patient.nom} ({patient.email})
                                {patient.prescriptionCount && ` - ${patient.prescriptionCount} prescription(s)`}
                            </option>
                        ))}
                    </select>
                    {patients.length === 0 && !isLoadingPatients && (
                        <p className="mt-2 text-sm text-amber-600">
                            ⚠️ Aucun patient autorisé trouvé. Vérifiez que vous avez des patients avec des prescriptions actives ou que l'API WebRTC est accessible.
                        </p>
                    )}
                </div>

                {/* Type de session */}
                <div>
                    <label htmlFor="sessionType" className="block text-sm font-medium text-gray-700 mb-2">
                        Type de consultation
                    </label>
                    <select
                        id="sessionType"
                        name="sessionType"
                        value={formData.sessionType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="consultation">Consultation générale</option>
                        <option value="urgence">Urgence</option>
                        <option value="suivi">Suivi médical</option>
                        <option value="preventif">Prévention</option>
                    </select>
                </div>

                {/* Durée d'expiration */}
                <div>
                    <label htmlFor="expiryHours" className="block text-sm font-medium text-gray-700 mb-2">
                        Durée de validité (heures)
                    </label>
                    <select
                        id="expiryHours"
                        name="expiryHours"
                        value={formData.expiryHours}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value={1}>1 heure</option>
                        <option value={6}>6 heures</option>
                        <option value={24}>24 heures</option>
                        <option value={72}>3 jours</option>
                        <option value={168}>1 semaine</option>
                    </select>
                </div>

                {/* Message d'erreur */}
                {error && (
                    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Boutons */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => {
                            if (onBackToList) {
                                onBackToList();
                            } else if (window.parent && window.parent.postMessage) {
                                window.parent.postMessage({ type: 'webrtc-back-to-list' }, '*');
                            } else {
                                window.history.back();
                            }
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
                    >
                        <span>←</span>
                        <span>Retour à la liste</span>
                    </button>

                    <div className="flex items-center space-x-4">
                        <button
                            type="button"
                            onClick={() => {
                                if (onBackToList) {
                                    onBackToList();
                                } else if (window.parent && window.parent.postMessage) {
                                    window.parent.postMessage({ type: 'webrtc-back-to-list' }, '*');
                                } else {
                                    window.history.back();
                                }
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !formData.patientId}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Création...</span>
                                </>
                            ) : (
                                <>
                                    <span>📹</span>
                                    <span>Créer la conférence</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ConferenceCreate;
