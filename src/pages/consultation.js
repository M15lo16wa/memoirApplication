import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createConsultation, getDossierPatient } from "../services/api/medicalApi";
import { getPatients, getServices } from "../services/api/patientApi";

function Consultation() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedPatientDossier, setSelectedPatientDossier] = useState(null);
    const [loadingDossier, setLoadingDossier] = useState(false);
    const [consultationForm, setConsultationForm] = useState({
        patient_id: '',
        professionnel_sante_id: '', // This should be set from logged-in user
        service_id: '',
        date_consultation: new Date().toISOString().split('T')[0],
        heure_consultation: new Date().toTimeString().split(' ')[0].substring(0, 5),
        motif_consultation: '',
        symptomes: '',
        diagnostic: '',
        code_cim10: '',
        prescription: '',
        notes_medecin: '',
        prochaine_consultation: '',
        // Patient info
        nom: '',
        prenom: '',
        age: '',
        date_naissance: '',
        sexe: '',
        numero_securite_sociale: '',
        telephone: '',
        ville_region: '',
        email: '',
        adresse: '',
        // Medical history
        antecedents_personnels: '',
        antecedents_familiaux: '',
        traitements_en_cours: '',
        pas_de_traitement: false,
        // Physical examination
        poids: '',
        taille: '',
        imc: '',
        temperature: '',
        pouls: '',
        tension_systolique: '',
        tension_diastolique: '',
        examen_physique: '',
        // Pain scale
        echelle_douleur: 0,
        // Follow-up
        examens_complementaires: false,
        hospitalisation: false,
        orientation_specialiste: false
    });

    useEffect(() => {
        loadPatients();
        loadServices();
        // Set professionnel_sante_id from logged-in user (you'll need to implement this)
        // const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
        // if (userId) {
        //     setConsultationForm(prev => ({ ...prev, professionnel_sante_id: userId }));
        // }
    }, []);

    const loadPatients = async () => {
        try {
            const patientsData = await getPatients();
            setPatients(Array.isArray(patientsData) ? patientsData : []);
        } catch (error) {
            console.error('Erreur lors du chargement des patients:', error);
        }
    };

    const loadServices = async () => {
        try {
            const servicesData = await getServices();
            setServices(Array.isArray(servicesData) ? servicesData : []);
        } catch (error) {
            console.error('Erreur lors du chargement des services:', error);
        }
    };

    const handleInputChange = async (e) => {
        const { name, value, type, checked } = e.target;
        setConsultationForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // If patient_id is being changed, fetch the patient's dossier
        if (name === 'patient_id' && value) {
            setLoadingDossier(true);
            setSelectedPatientDossier(null);
            try {
                console.log('Fetching dossier for patient ID:', value);
                const dossierData = await getDossierPatient(value);
                console.log('Raw dossier data from API:', dossierData);
                
                if (dossierData && dossierData.data) {
                    console.log('Setting dossier data:', dossierData.data);
                    setSelectedPatientDossier(dossierData.data);
                } else if (dossierData) {
                    console.log('Setting dossier data directly:', dossierData);
                    setSelectedPatientDossier(dossierData);
                } else {
                    console.log('No dossier data found');
                    setSelectedPatientDossier(null);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération du dossier patient:', error);
                setSelectedPatientDossier(null);
            } finally {
                setLoadingDossier(false);
            }
        }
    };

    const calculateIMC = () => {
        const poids = parseFloat(consultationForm.poids);
        const taille = parseFloat(consultationForm.taille) / 100; // Convert cm to m
        if (poids && taille) {
            const imc = (poids / (taille * taille)).toFixed(1);
            setConsultationForm(prev => ({ ...prev, imc }));
        }
    };

    useEffect(() => {
        calculateIMC();
    }, [consultationForm.poids, consultationForm.taille]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate required fields
            if (!consultationForm.patient_id) {
                alert('Veuillez sélectionner un patient');
                return;
            }
            if (!consultationForm.motif_consultation) {
                alert('Veuillez saisir le motif de consultation');
                return;
            }
            if (!selectedPatientDossier) {
                alert('Impossible de récupérer le dossier du patient. Veuillez réessayer.');
                return;
            }

            // Get dossier_id from the selected patient's dossier
            console.log('Selected patient dossier structure:', selectedPatientDossier);
            if (selectedPatientDossier.dossier) {
                console.log('Dossier object structure:', selectedPatientDossier.dossier);
                console.log('Available fields in dossier:', Object.keys(selectedPatientDossier.dossier));
            }
            
            // Try multiple possible field names for dossier ID
            const dossierId = selectedPatientDossier.id || 
                             selectedPatientDossier.Id || 
                             selectedPatientDossier.dossier_id || 
                             selectedPatientDossier.id_dossier ||
                             selectedPatientDossier.dossierId ||
                             (selectedPatientDossier.data && selectedPatientDossier.data.id) ||
                             (selectedPatientDossier.data && selectedPatientDossier.data.dossier_id) ||
                             (selectedPatientDossier.dossier && selectedPatientDossier.dossier.id) ||
                             (selectedPatientDossier.dossier && selectedPatientDossier.dossier.dossier_id) ||
                             (selectedPatientDossier.dossier && selectedPatientDossier.dossier.Id) ||
                             (selectedPatientDossier.dossier && selectedPatientDossier.dossier.id_dossier);
            
            console.log('Extracted dossier ID:', dossierId);
            
            if (!dossierId) {
                console.error('Available fields in selectedPatientDossier:', Object.keys(selectedPatientDossier));
                alert('Impossible de récupérer l\'ID du dossier patient. Structure des données: ' + JSON.stringify(selectedPatientDossier, null, 2));
                return;
            }

            // Prepare consultation data for backend
            const consultationData = {
                dossier_id: dossierId,
                patient_id: parseInt(consultationForm.patient_id),
                professionnel_sante_id: parseInt(consultationForm.professionnel_sante_id) || 1, // Default to 1 if not set
                service_id: parseInt(consultationForm.service_id) || null,
                date_consultation: consultationForm.date_consultation,
                heure_consultation: consultationForm.heure_consultation,
                motif: consultationForm.motif_consultation, // Map to 'motif' as expected by backend
                symptomes: consultationForm.symptomes,
                diagnostic: consultationForm.diagnostic,
                code_cim10: consultationForm.code_cim10,
                prescription: consultationForm.prescription,
                notes_medecin: consultationForm.notes_medecin,
                prochaine_consultation: consultationForm.prochaine_consultation || null,
                // Physical examination data
                poids: parseFloat(consultationForm.poids) || null,
                taille: parseFloat(consultationForm.taille) || null,
                temperature: parseFloat(consultationForm.temperature) || null,
                pouls: parseInt(consultationForm.pouls) || null,
                tension_arterielle: consultationForm.tension_systolique && consultationForm.tension_diastolique
                    ? `${consultationForm.tension_systolique}/${consultationForm.tension_diastolique}`
                    : null,
                examen_physique: consultationForm.examen_physique,
                echelle_douleur: parseInt(consultationForm.echelle_douleur) || 0
            };

            console.log('Submitting consultation:', consultationData);
            const response = await createConsultation(consultationData);
            console.log('Consultation created:', response);
            
            alert('Consultation enregistrée avec succès!');
            
            // Reset form or navigate
            if (window.confirm('Voulez-vous créer une nouvelle consultation ?')) {
                // Reset form
                setConsultationForm({
                    ...consultationForm,
                    motif_consultation: '',
                    symptomes: '',
                    diagnostic: '',
                    code_cim10: '',
                    prescription: '',
                    notes_medecin: '',
                    prochaine_consultation: '',
                    poids: '',
                    taille: '',
                    imc: '',
                    temperature: '',
                    pouls: '',
                    tension_systolique: '',
                    tension_diastolique: '',
                    examen_physique: '',
                    echelle_douleur: 0
                });
                setSelectedPatientDossier(null);
                setLoadingDossier(false);
            } else {
                navigate('/medecin');
            }

        } catch (error) {
            console.error('Erreur lors de la création de la consultation:', error);
            alert('Erreur lors de l\'enregistrement de la consultation: ' + error);
        } finally {
            setLoading(false);
        }
    };

    return(
    <div className="bg-gray-100 min-h-screen p-6">
        <button
            onClick={() => navigate('/medecin')}
            className="fixed top-4 left-4 z-10 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center mb-6"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Retour
        </button>

        <div className="max-w-6xl mx-auto mt-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Nouvelle Consultation</h1>
            
            <form onSubmit={handleSubmit}>
            {/* Patient Selection Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-6">1. Sélection du Patient</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Patient <span className="text-red-500">*</span></label>
                        <select
                            name="patient_id"
                            value={consultationForm.patient_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        >
                            <option value="">Sélectionner un patient</option>
                            {patients.map(patient => (
                                <option key={patient.id_patient} value={patient.id_patient}>
                                    {patient.prenom} {patient.nom} - {patient.numero_dossier}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                        <select
                            name="service_id"
                            value={consultationForm.service_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Sélectionner un service</option>
                            {services.map(service => (
                                <option key={service.id || service.id_service} value={service.id || service.id_service}>
                                    {service.nom || service.name || service.libelle}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de consultation <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            name="date_consultation"
                            value={consultationForm.date_consultation}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Heure de consultation</label>
                        <input
                            type="time"
                            name="heure_consultation"
                            value={consultationForm.heure_consultation}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                
                {/* Patient Dossier Status */}
                {consultationForm.patient_id && (
                    <div className="mt-4 p-3 rounded-md">
                        {loadingDossier ? (
                            <div className="flex items-center text-blue-600">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Chargement du dossier patient...
                            </div>
                        ) : selectedPatientDossier ? (
                            <div className="flex items-center text-green-600">
                                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Dossier patient chargé avec succès
                            </div>
                        ) : (
                            <div className="flex items-center text-red-600">
                                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Erreur lors du chargement du dossier patient
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Motif de Consultation */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">2. Motif de Consultation</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motif principal <span className="text-red-500">*</span></label>
                    <textarea
                        name="motif_consultation"
                        value={consultationForm.motif_consultation}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        rows="3"
                        placeholder="Décrivez ici le motif principal de la consultation..."
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Symptômes</label>
                    <textarea
                        name="symptomes"
                        value={consultationForm.symptomes}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        rows="3"
                        placeholder="Symptômes observés, durée, circonstances d'apparition..."
                    />
                </div>
                <div>
                    <h3 className="font-medium text-gray-800 mb-2">Échelle de douleur (0-10)</h3>
                    <div className="flex items-center mb-2">
                        <span className="mr-2 text-sm">0</span>
                        <input
                            type="range"
                            name="echelle_douleur"
                            min="0"
                            max="10"
                            value={consultationForm.echelle_douleur}
                            onChange={handleInputChange}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none"
                        />
                        <span className="ml-2 text-sm">10</span>
                    </div>
                    <div className="text-center text-sm text-gray-600">
                        Niveau de douleur: {consultationForm.echelle_douleur}/10
                    </div>
                </div>
            </div>

            {/* Examen Clinique */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">3. Examen Clinique</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
                        <input
                            type="number"
                            name="poids"
                            value={consultationForm.poids}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="70"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taille (cm)</label>
                        <input
                            type="number"
                            name="taille"
                            value={consultationForm.taille}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="175"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IMC</label>
                        <input
                            type="text"
                            name="imc"
                            value={consultationForm.imc}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Température (°C)</label>
                        <input
                            type="number"
                            step="0.1"
                            name="temperature"
                            value={consultationForm.temperature}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="36.6"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pouls (bpm)</label>
                        <input
                            type="number"
                            name="pouls"
                            value={consultationForm.pouls}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="72"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TA (mmHg)</label>
                        <div className="flex">
                            <input
                                type="number"
                                name="tension_systolique"
                                value={consultationForm.tension_systolique}
                                onChange={handleInputChange}
                                className="w-1/2 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="120"
                            />
                            <input
                                type="number"
                                name="tension_diastolique"
                                value={consultationForm.tension_diastolique}
                                onChange={handleInputChange}
                                className="w-1/2 px-3 py-2 border-t border-b border-r border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="80"
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Examen physique</label>
                    <textarea
                        name="examen_physique"
                        value={consultationForm.examen_physique}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        rows="5"
                        placeholder="Description détaillée de l'examen..."
                    />
                </div>
            </div>

            {/* Diagnostic et Prescription */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">4. Diagnostic et Prescription</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-medium text-gray-800 mb-2">Diagnostic (CIM-10)</h3>
                        <input
                            type="text"
                            name="code_cim10"
                            value={consultationForm.code_cim10}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                            placeholder="Code CIM-10"
                        />
                        <textarea
                            name="diagnostic"
                            value={consultationForm.diagnostic}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            rows="4"
                            placeholder="Diagnostic principal et diagnostics secondaires..."
                        />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-800 mb-2">Prescription</h3>
                        <textarea
                            name="prescription"
                            value={consultationForm.prescription}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            rows="6"
                            placeholder="Médicaments, posologie, durée du traitement, recommandations..."
                        />
                    </div>
                </div>
            </div>

            {/* Notes et Suivi */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">5. Notes et Suivi</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes du médecin</label>
                    <textarea
                        name="notes_medecin"
                        value={consultationForm.notes_medecin}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        rows="4"
                        placeholder="Observations particulières, conseils, orientation vers spécialiste..."
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date de la prochaine consultation</label>
                        <input
                            type="date"
                            name="prochaine_consultation"
                            value={consultationForm.prochaine_consultation}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">À suivre</label>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="examens_complementaires"
                                    checked={consultationForm.examens_complementaires}
                                    onChange={handleInputChange}
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-sm">Examens complémentaires</span>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="hospitalisation"
                                    checked={consultationForm.hospitalisation}
                                    onChange={handleInputChange}
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-sm">Hospitalisation</span>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="orientation_specialiste"
                                    checked={consultationForm.orientation_specialiste}
                                    onChange={handleInputChange}
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-sm">Orientation spécialiste</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <p className="text-sm text-gray-600">
                            Vérifiez toutes les informations avant d'enregistrer la consultation.
                        </p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate('/medecin')}
                            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer la consultation'}
                        </button>
                    </div>
                </div>
            </div>
            </form>
        </div>
    </div>
    );
}

export default Consultation;