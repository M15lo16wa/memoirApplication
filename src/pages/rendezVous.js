import React, { useState } from "react";
import FooterRendezVous from "../components/layout/FooterRendezVous";
import Header from "../components/layout/Header";

function RendezVous() {
    // Gestion des étapes
    const [step, setStep] = useState(1);

    // Gestion des champs du formulaire
    const [form, setForm] = useState({
        lastName: "",
        firstName: "",
        birthDate: "",
        gender: "",
        email: "",
        phone: "",
        address: "",
        hasInsurance: false,
        insuranceProvider: "",
        insuranceNumber: "",
        service: "",
        doctor: "",
        reason: "",
        appointmentDate: "",
        appointmentTime: "",
        hospital: "", // Ajout du champ hôpital
        consent: false,
    });

    // Gestion des erreurs
    const [errors, setErrors] = useState({});

    // Gestion de la sélection de date et heure
    const days = ["Lun 10", "Mar 11", "Mer 12", "Jeu 13", "Ven 14", "Sam 15", "Dim 16"];
    const times = ["09:00", "10:15", "11:30", "14:00"];

    // Handlers génériques
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        // Si on décoche l'assurance, on vide les champs associés
        if (name === "hasInsurance" && !checked) {
            setForm((prev) => ({
                ...prev,
                insuranceProvider: "",
                insuranceNumber: "",
            }));
        }
    };

    // Sélection date/heure
    const handleDateSelect = (date) => setForm((prev) => ({ ...prev, appointmentDate: date }));
    const handleTimeSelect = (time) => setForm((prev) => ({ ...prev, appointmentTime: time }));

    // Navigation entre étapes
    const nextStep = () => {
        if (validateStep(step)) setStep(step + 1);
    };
    const prevStep = () => setStep(step - 1);

    // Validation par étape
    const validateStep = (currentStep) => {
        let newErrors = {};
        if (currentStep === 1) {
            if (!form.lastName) newErrors.lastName = "Veuillez entrer votre nom";
            if (!form.firstName) newErrors.firstName = "Veuillez entrer votre prénom";
            if (!form.birthDate) newErrors.birthDate = "Date de naissance requise";
            if (!form.email) newErrors.email = "Veuillez entrer une adresse email valide";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Email invalide";
            if (!form.phone) newErrors.phone = "Veuillez entrer un numéro de téléphone valide";
            if (form.hasInsurance) {
                if (!form.insuranceProvider) newErrors.insuranceProvider = "Veuillez spécifier votre assureur";
                if (!form.insuranceNumber) newErrors.insuranceNumber = "Veuillez entrer votre numéro d'assuré";
            }
        }
        if (currentStep === 2) {
            if (!form.hospital) newErrors.hospital = "Veuillez sélectionner un hôpital";
            if (!form.service) newErrors.service = "Veuillez sélectionner un service";
            if (!form.reason) newErrors.reason = "Veuillez décrire le motif de votre consultation";
            if (!form.appointmentDate || !form.appointmentTime) newErrors.appointment = "Veuillez sélectionner une date et heure";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Soumission finale
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.consent) {
            setErrors({ consent: "Vous devez accepter les conditions" });
            return;
        }
        alert("Votre rendez-vous a été confirmé. Vous recevrez un email de confirmation sous peu.");
        setStep(1);
        setForm({
            lastName: "",
            firstName: "",
            birthDate: "",
            gender: "",
            email: "",
            phone: "",
            address: "",
            hasInsurance: false,
            insuranceProvider: "",
            insuranceNumber: "",
            service: "",
            doctor: "",
            reason: "",
            appointmentDate: "",
            appointmentTime: "",
            hospital: "", // reset
            consent: false,
        });
        setErrors({});
    };

    // Pour l'affichage du résumé de confirmation
    const getServiceLabel = () => {
        switch (form.service) {
            case "cardiology": return "Cardiologie";
            case "dermatology": return "Dermatologie";
            case "endocrinology": return "Endocrinologie";
            case "gastroenterology": return "Gastro-entérologie";
            case "neurology": return "Neurologie";
            case "pediatrics": return "Pédiatrie";
            case "radiology": return "Radiologie";
            case "surgery": return "Chirurgie";
            default: return "";
        }
    };

    const getDoctorLabel = () => {
        switch (form.doctor) {
            case "dr_dupont": return "Dr. Dupont (Cardiologie)";
            case "dr_martin": return "Dr. Martin (Dermatologie)";
            case "dr_leclerc": return "Dr. Leclerc (Endocrinologie)";
            default: return "Aucun médecin spécifique";
        }
    };

    return (
        <div>
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="p-6 border-b">
                        <h2 className="text-2xl font-bold text-gray-800">Prendre un rendez-vous</h2>
                        <p className="text-gray-600 mt-2">Remplissez ce formulaire pour prendre rendez-vous avec nos spécialistes.</p>
                        <div className="flex mt-6 mb-2">
                            <div className="w-full flex">
                                <div className="step flex-1 relative text-center">
                                    <div className={`w-10 h-10 mx-auto rounded-full ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-800"} flex items-center justify-center font-bold mb-2`}>1</div>
                                    <p className="text-sm font-medium">Informations</p>
                                </div>
                                <div className="step flex-1 relative text-center">
                                    <div className={`w-10 h-10 mx-auto rounded-full ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-800"} flex items-center justify-center font-bold mb-2`}>2</div>
                                    <p className="text-sm font-medium">Consultation</p>
                                    <div className={`absolute h-1 w-full ${step >= 2 ? "bg-blue-600" : "bg-gray-300"} top-5 -z-10 left-0`} />
                                </div>
                                <div className="step flex-1 relative text-center">
                                    <div className={`w-10 h-10 mx-auto rounded-full ${step === 3 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-800"} flex items-center justify-center font-bold mb-2`}>3</div>
                                    <p className="text-sm font-medium">Confirmation</p>
                                    <div className={`absolute h-1 w-full ${step === 3 ? "bg-blue-600" : "bg-gray-300"} top-5 -z-10 left-0`} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <form id="appointmentForm" className="p-6" onSubmit={handleSubmit}>
                        {/* Step 1: Personal Information */}
                        {step === 1 && (
                            <div className="form-step active" id="step1">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Informations personnelles</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                        <input type="text" id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                                        {errors.lastName && <p className="error-message text-red-500">{errors.lastName}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                        <input type="text" id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                                        {errors.firstName && <p className="error-message text-red-500">{errors.firstName}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                                        <input type="date" id="birthDate" name="birthDate" value={form.birthDate} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                                        {errors.birthDate && <p className="error-message text-red-500">{errors.birthDate}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                                        <select id="gender" name="gender" value={form.gender} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                            <option value="">Sélectionner...</option>
                                            <option value="male">Masculin</option>
                                            <option value="female">Féminin</option>
                                            <option value="other">Autre</option>
                                            <option value="unknown">Préfère ne pas dire</option>
                                        </select>
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-800">Coordonnées</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                                        {errors.email && <p className="error-message text-red-500">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                                        <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                                        {errors.phone && <p className="error-message text-red-500">{errors.phone}</p>}
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                    <input type="text" id="address" name="address" value={form.address} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                                </div>
                                <div className="mt-6">
                                    <label className="inline-flex items-center">
                                        <input type="checkbox" name="hasInsurance" checked={form.hasInsurance} onChange={handleChange} className="rounded text-blue-600" />
                                        <span className="ml-2 text-gray-700">Je suis couvert par une assurance maladie</span>
                                    </label>
                                </div>
                                {form.hasInsurance && (
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700 mb-1">Assureur *</label>
                                            <input type="text" id="insuranceProvider" name="insuranceProvider" value={form.insuranceProvider} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                                            {errors.insuranceProvider && <p className="error-message text-red-500">{errors.insuranceProvider}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="insuranceNumber" className="block text-sm font-medium text-gray-700 mb-1">Numéro d'assuré *</label>
                                            <input type="text" id="insuranceNumber" name="insuranceNumber" value={form.insuranceNumber} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                                            {errors.insuranceNumber && <p className="error-message text-red-500">{errors.insuranceNumber}</p>}
                                        </div>
                                    </div>
                                )}
                                <div className="mt-8 flex justify-end">
                                    <button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">Suivant</button>
                                </div>
                            </div>
                        )}
                        {/* Step 2: Appointment Details */}
                        {step === 2 && (
                            <div className="form-step active" id="step2">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Détails de la consultation</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 mb-1">Hôpital *</label>
                                        <select id="hospital" name="hospital" value={form.hospital} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                            <option value="">Sélectionner un hôpital...</option>
                                            <option value="hopital_principal">Hôpital Principal</option>
                                            <option value="fann">Hôpital Fann</option>
                                            <option value="dalal_jamm">Hôpital Dalal Jamm</option>
                                            <option value="aristide_le_dantec">Hôpital Aristide Le Dantec</option>
                                            <option value="enfant_albert_royer">Hôpital d'Enfants Albert Royer</option>
                                            <option value="autre">Autre</option>
                                        </select>
                                        {errors.hospital && <p className="error-message text-red-500">{errors.hospital}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">Service/Spécialité *</label>
                                        <select id="service" name="service" value={form.service} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                            <option value="">Sélectionner un service...</option>
                                            <option value="cardiology">Cardiologie</option>
                                            <option value="dermatology">Dermatologie</option>
                                            <option value="endocrinology">Endocrinologie</option>
                                            <option value="gastroenterology">Gastro-entérologie</option>
                                            <option value="neurology">Neurologie</option>
                                            <option value="pediatrics">Pédiatrie</option>
                                            <option value="radiology">Radiologie</option>
                                            <option value="surgery">Chirurgie</option>
                                        </select>
                                        {errors.service && <p className="error-message text-red-500">{errors.service}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 mb-1">Médecin (optionnel)</label>
                                        <select id="doctor" name="doctor" value={form.doctor} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                            <option value="">Aucune préférence</option>
                                            <option value="dr_dupont">Dr. Dupont (Cardiologie)</option>
                                            <option value="dr_martin">Dr. Martin (Dermatologie)</option>
                                            <option value="dr_leclerc">Dr. Leclerc (Endocrinologie)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Motif de consultation *</label>
                                        <textarea id="reason" name="reason" rows={3} value={form.reason} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Décrivez brièvement la raison de votre consultation..." />
                                        {errors.reason && <p className="error-message text-red-500">{errors.reason}</p>}
                                    </div>
                                    <div id="calendarContainer" className="mt-6">
                                        <h4 className="font-medium text-gray-700 mb-3">Choisissez une disponibilité *</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-4">
                                            {days.map((day) => (
                                                <button
                                                    type="button"
                                                    key={day}
                                                    className={`py-1 px-2 border rounded ${form.appointmentDate === day ? "bg-blue-600 text-white" : "hover:bg-blue-50"}`}
                                                    onClick={() => handleDateSelect(day)}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                        <div id="timeSlots" className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {times.map((time) => (
                                                <button
                                                    type="button"
                                                    key={time}
                                                    className={`py-2 px-3 border rounded ${form.appointmentTime === time ? "bg-blue-600 text-white" : "hover:bg-blue-50"}`}
                                                    onClick={() => handleTimeSelect(time)}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.appointment && <p className="error-message text-red-500 mt-2">{errors.appointment}</p>}
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-between">
                                    <button type="button" onClick={prevStep} className="text-gray-600 hover:text-gray-800 px-6 py-2 rounded-lg border transition">Retour</button>
                                    <button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">Suivant</button>
                                </div>
                            </div>
                        )}
                        {/* Step 3: Confirmation */}
                        {step === 3 && (
                            <div className="form-step active" id="step3">
                                <div className="text-center">
                                    <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/50c12644-747a-4de2-b038-72ea475da28c.png" alt="Logo SantéSénégal avec calendrier de rendez-vous" className="mx-auto h-48" />
                                    <h3 className="text-2xl font-bold text-gray-800 mt-4">Confirmation de votre rendez-vous</h3>
                                    <p className="text-gray-600 mt-2 mb-6">Veuillez vérifier les informations ci-dessous avant de confirmer</p>
                                    <div className="bg-gray-50 rounded-lg p-6 text-left max-w-lg mx-auto">
                                        <div className="mb-4 pb-4 border-b">
                                            <h4 className="font-semibold text-gray-700 mb-2">Informations personnelles</h4>
                                            <p>{form.firstName} {form.lastName}</p>
                                            <p>{form.email} | {form.phone}</p>
                                        </div>
                                        <div className="mb-4 pb-4 border-b">
                                            <h4 className="font-semibold text-gray-700 mb-2">Détails du rendez-vous</h4>
                                            <p>Hôpital: {(() => {
                                                switch(form.hospital) {
                                                    case "hopital_principal": return "Hôpital Principal";
                                                    case "fann": return "Hôpital Fann";
                                                    case "dalal_jamm": return "Hôpital Dalal Jamm";
                                                    case "aristide_le_dantec": return "Hôpital Aristide Le Dantec";
                                                    case "enfant_albert_royer": return "Hôpital d'Enfants Albert Royer";
                                                    case "autre": return "Autre";
                                                    default: return "";
                                                }
                                            })()}</p>
                                            <p>Service: {getServiceLabel()}</p>
                                            <p>{getDoctorLabel()}</p>
                                            <p>Date et heure: {form.appointmentDate} à {form.appointmentTime}</p>
                                            <p>Motif: {form.reason}</p>
                                        </div>
                                        <div className="flex items-start">
                                            <input type="checkbox" id="consent" name="consent" checked={form.consent} onChange={handleChange} required className="mt-1 mr-2" />
                                            <label htmlFor="consent" className="text-sm text-gray-700">Je consens au traitement de mes données personnelles conformément à la politique de confidentialité de l'hôpital. *</label>
                                        </div>
                                        {errors.consent && <p className="error-message text-red-500">{errors.consent}</p>}
                                    </div>
                                    <div className="mt-8 flex justify-between">
                                        <button type="button" onClick={prevStep} className="text-gray-600 hover:text-gray-800 px-6 py-2 rounded-lg border transition">Retour</button>
                                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition">Confirmer le rendez-vous</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </main>
            <FooterRendezVous />
        </div>
    );
}

export default RendezVous;