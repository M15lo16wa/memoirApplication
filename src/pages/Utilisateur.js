import React, { useEffect, useState } from "react";
// import { getPatients, createPatient } from '../services/api/patientApi';
import { register } from '../services/api/authApi';
import { getProfSante, createProfSante } from '../services/api/profSante';

// Rôles possibles
const ROLES = ["patient", "secretaire", "medecin"];

function Utilisateurs() {
    // États pour les patients
    // const [patients, setPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [errorPatients, setErrorPatients] = useState(null);
    // const [formPatient, setFormPatient] = useState({
    //     nom: "",
    //     prenom: "",
    //     email: "",
    //     password: "",
    //     numero_dossier: "",
    //     date_naissance: "",
    //     lieu_naissance:"",
    //     sexe:"",
    //     civilite:"",
    //     numero_secu:"",
    //     confirmPassword: "",
    // });
    // const [formPatientError, setFormPatientError] = useState("");
    // const [formPatientSuccess, setFormPatientSuccess] = useState("");
    // const [creatingPatient, setCreatingPatient] = useState(false);

    // États pour les professionnels de santé (médecins)
    const [medecins, setMedecins] = useState([]);
    const [loadingMedecins, setLoadingMedecins] = useState(true);
    const [errorMedecins, setErrorMedecins] = useState(null);
    const [formMedecin, setFormMedecin] = useState({
        nom: "",
        prenom: "",
        date_naissance: "",
        lieu_naissance: "",
        sexe: "",
        adresse: "",
        code_postal: "",
        ville: "",
        pays: "",
        numero_pp: "",
        numero_finess: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "medecin"
    });
    const [formMedecinError, setFormMedecinError] = useState("");
    const [formMedecinSuccess, setFormMedecinSuccess] = useState("");
    const [creatingMedecin, setCreatingMedecin] = useState(false);

    // États pour les utilisateurs (secrétaires)
    const [secretaires, setSecretaires] = useState([]);
    const [loadingSecretaires, setLoadingSecretaires] = useState(true);
    const [errorSecretaires, setErrorSecretaires] = useState(null);
    const [formSecretaire, setFormSecretaire] = useState({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "secretaire"
    });
    const [formSecretaireError, setFormSecretaireError] = useState("");
    const [formSecretaireSuccess, setFormSecretaireSuccess] = useState("");
    const [creatingSecretaire, setCreatingSecretaire] = useState(false);

    // Récupération des patients
    // useEffect(() => {
    //     setLoadingPatients(true);
    //     setErrorPatients(null);
    //     getPatients()
    //         .then(data => {
    //             setPatients(data.data || data);
    //             setLoadingPatients(false);
    //         })
    //         .catch(err => {
    //             setErrorPatients("Erreur lors du chargement des patients");
    //             setLoadingPatients(false);
    //         });
    // }, []);

    // Récupération des médecins
    useEffect(() => {
        setLoadingMedecins(true);
        setErrorMedecins(null);
        getProfSante()
            .then(data => {
                setMedecins(data.data || data);
                setLoadingMedecins(false);
            })
            .catch(err => {
                setErrorMedecins("Erreur lors du chargement des professionnels de santé");
                setLoadingMedecins(false);
            });
    }, []);

    // Récupération des secrétaires
    useEffect(() => {
        setLoadingSecretaires(true);
        setErrorSecretaires(null);
        fetch("/auth/utilisateurs?role=secretaire")
            .then(res => {
                if (!res.ok) throw new Error("Erreur lors du chargement des secrétaires");
                return res.json();
            })
            .then(data => {
                setSecretaires(data);
                setLoadingSecretaires(false);
            })
            .catch(err => {
                setErrorSecretaires(err.message);
                setLoadingSecretaires(false);
            });
    }, []);

    // Gestion du changement de rôle
    const handleRoleChange = (id, newRole) => {
        // This function is no longer used for patients, medecins, or secretaires
        // as they have their own specific forms and roles.
        // Keeping it for now, but it will be removed if not used elsewhere.
    };

    // Gestion de l'activation/désactivation
    const handleActivationToggle = (id) => {
        // This function is no longer used for patients, medecins, or secretaires
        // as they have their own specific forms and roles.
        // Keeping it for now, but it will be removed if not used elsewhere.
    };

    // Gestion du formulaire patient
    // const handleFormPatientChange = (e) => {
    //     const { name, value } = e.target;
    //     setFormPatient(f => ({ ...f, [name]: value }));
    //     setFormPatientError("");
    //     setFormPatientSuccess("");
    // };
    // const handleFormPatientSubmit = async (e) => {
    //     e.preventDefault();
    //     if (!formPatient.nom || !formPatient.prenom || !formPatient.email || !formPatient.password || !formPatient.confirmPassword) {
    //         setFormPatientError("Tous les champs sont obligatoires.");
    //         return;
    //     }
    //     if (formPatient.password !== formPatient.confirmPassword) {
    //         setFormPatientError("Les mots de passe ne correspondent pas.");
    //         return;
    //     }
    //     setCreatingPatient(true);
    //     setFormPatientError("");
    //     setFormPatientSuccess("");
    //     try {
    //         const newPatient = await createPatient({
    //             nom: formPatient.nom,
    //             prenom: formPatient.prenom,
    //             email: formPatient.email,
    //             mot_de_passe: formPatient.password
    //         });
    //         setPatients([newPatient, ...patients]);
    //         setFormPatient({ nom: "", prenom: "", email: "", password: "", confirmPassword: "" });
    //         setFormPatientSuccess("Patient créé avec succès !");
    //     } catch (err) {
    //         setFormPatientError("Erreur lors de la création du patient");
    //     } finally {
    //         setCreatingPatient(false);
    //     }
    // };

    // Gestion du formulaire médecin
    const handleFormMedecinChange = (e) => {
        const { name, value } = e.target;
        setFormMedecin(f => ({ ...f, [name]: value }));
        setFormMedecinError("");
        setFormMedecinSuccess("");
    };
    const handleFormMedecinSubmit = async (e) => {
        e.preventDefault();
        if (!formMedecin.nom || !formMedecin.prenom || !formMedecin.email || !formMedecin.password || !formMedecin.confirmPassword) {
            setFormMedecinError("Tous les champs sont obligatoires.");
            return;
        }
        if (formMedecin.password !== formMedecin.confirmPassword) {
            setFormMedecinError("Les mots de passe ne correspondent pas.");
            return;
        }
        setCreatingMedecin(true);
        setFormMedecinError("");
        setFormMedecinSuccess("");
        try {
            const newMedecin = await createProfSante({
                nom: formMedecin.nom,
                prenom: formMedecin.prenom,
                email: formMedecin.email,
                mot_de_passe: formMedecin.password
            });
            setMedecins([newMedecin, ...medecins]);
            setFormMedecin({ nom: "", prenom: "", email: "", password: "", confirmPassword: "", role: "medecin" });
            setFormMedecinSuccess("Médecin créé avec succès !");
        } catch (err) {
            setFormMedecinError("Erreur lors de la création du médecin");
        } finally {
            setCreatingMedecin(false);
        }
    };

    // Gestion du formulaire secrétaire
    const handleFormSecretaireChange = (e) => {
        const { name, value } = e.target;
        setFormSecretaire(f => ({ ...f, [name]: value }));
        setFormSecretaireError("");
        setFormSecretaireSuccess("");
    };
    const handleFormSecretaireSubmit = async (e) => {
        e.preventDefault();
        if (!formSecretaire.nom || !formSecretaire.prenom || !formSecretaire.email || !formSecretaire.password || !formSecretaire.confirmPassword) {
            setFormSecretaireError("Tous les champs sont obligatoires.");
            return;
        }
        if (formSecretaire.password !== formSecretaire.confirmPassword) {
            setFormSecretaireError("Les mots de passe ne correspondent pas.");
            return;
        }
        setCreatingSecretaire(true);
        setFormSecretaireError("");
        setFormSecretaireSuccess("");
        try {
            const newSecretaire = await register({
                nom: formSecretaire.nom,
                prenom: formSecretaire.prenom,
                email: formSecretaire.email,
                role: "secretaire",
                password: formSecretaire.password
            });
            setSecretaires([newSecretaire, ...secretaires]);
            setFormSecretaire({ nom: "", prenom: "", email: "", password: "", confirmPassword: "", role: "secretaire" });
            setFormSecretaireSuccess("Secrétaire créée avec succès !");
        } catch (err) {
            setFormSecretaireError("Erreur lors de la création de la secrétaire");
        } finally {
            setCreatingSecretaire(false);
        }
    };

    if (loadingPatients) return <div className="flex justify-center items-center h-40 text-lg font-semibold text-blue-600">Chargement des patients...</div>;
    if (errorPatients) return <div className="text-red-600 font-semibold">Erreur : {errorPatients}</div>;

    if (loadingMedecins) return <div className="flex justify-center items-center h-40 text-lg font-semibold text-blue-600">Chargement des médecins...</div>;
    if (errorMedecins) return <div className="text-red-600 font-semibold">Erreur : {errorMedecins}</div>;

    if (loadingSecretaires) return <div className="flex justify-center items-center h-40 text-lg font-semibold text-blue-600">Chargement des secrétaires...</div>;
    if (errorSecretaires) return <div className="text-red-600 font-semibold">Erreur : {errorSecretaires}</div>;

    return (
        <div className="p-2 sm:p-4 md:p-6 max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 text-blue-700">Gestion des utilisateurs</h2>

            {/* Formulaire de création de compte
            <form onSubmit={handleFormPatientSubmit} className="mb-8 sm:mb-10 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-700">Créer un nouveau patient</h3>
                {formPatientError && <div className="text-red-600 mb-3 font-medium text-sm">{formPatientError}</div>}
                {formPatientSuccess && <div className="text-green-600 mb-3 font-medium text-sm">{formPatientSuccess}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Nom</label>
                        <input type="text" name="nom" value={formPatient.nom} onChange={handleFormPatientChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Prénom</label>
                        <input type="text" name="prenom" value={formPatient.prenom} onChange={handleFormPatientChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Email</label>
                        <input type="email" name="email" value={formPatient.email} onChange={handleFormPatientChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Mot de passe</label>
                        <input type="password" name="password" value={formPatient.password} onChange={handleFormPatientChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Confirmer le mot de passe</label>
                        <input type="password" name="confirmPassword" value={formPatient.confirmPassword} onChange={handleFormPatientChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                </div>
                <button type="submit" disabled={creatingPatient} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold shadow transition text-sm sm:text-base disabled:opacity-60">{creatingPatient ? "Création..." : "Créer le compte"}</button>
            </form> */}

            <form onSubmit={handleFormMedecinSubmit} className="mb-8 sm:mb-10 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-700">Créer un nouveau médecin</h3>
                {formMedecinError && <div className="text-red-600 mb-3 font-medium text-sm">{formMedecinError}</div>}
                {formMedecinSuccess && <div className="text-green-600 mb-3 font-medium text-sm">{formMedecinSuccess}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Nom</label>
                        <input type="text" name="nom" value={formMedecin.nom} onChange={handleFormMedecinChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Prénom</label>
                        <input type="text" name="prenom" value={formMedecin.prenom} onChange={handleFormMedecinChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Email</label>
                        <input type="email" name="email" value={formMedecin.email} onChange={handleFormMedecinChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Mot de passe</label>
                        <input type="password" name="password" value={formMedecin.password} onChange={handleFormMedecinChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Confirmer le mot de passe</label>
                        <input type="password" name="confirmPassword" value={formMedecin.confirmPassword} onChange={handleFormMedecinChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                </div>
                <button type="submit" disabled={creatingMedecin} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold shadow transition text-sm sm:text-base disabled:opacity-60">{creatingMedecin ? "Création..." : "Créer le compte"}</button>
            </form>

            <form onSubmit={handleFormSecretaireSubmit} className="mb-8 sm:mb-10 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-700">Créer une nouvelle secrétaire</h3>
                {formSecretaireError && <div className="text-red-600 mb-3 font-medium text-sm">{formSecretaireError}</div>}
                {formSecretaireSuccess && <div className="text-green-600 mb-3 font-medium text-sm">{formSecretaireSuccess}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Nom</label>
                        <input type="text" name="nom" value={formSecretaire.nom} onChange={handleFormSecretaireChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Prénom</label>
                        <input type="text" name="prenom" value={formSecretaire.prenom} onChange={handleFormSecretaireChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Email</label>
                        <input type="email" name="email" value={formSecretaire.email} onChange={handleFormSecretaireChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Mot de passe</label>
                        <input type="password" name="password" value={formSecretaire.password} onChange={handleFormSecretaireChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Confirmer le mot de passe</label>
                        <input type="password" name="confirmPassword" value={formSecretaire.confirmPassword} onChange={handleFormSecretaireChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                </div>
                <button type="submit" disabled={creatingSecretaire} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold shadow transition text-sm sm:text-base disabled:opacity-60">{creatingSecretaire ? "Création..." : "Créer le compte"}</button>
            </form>

            <div className="overflow-x-auto rounded-xl shadow border border-gray-100 bg-white">
                <table className="min-w-[600px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
                    <thead className="bg-blue-50">
                        <tr>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Nom</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Prénom</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Email</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Rôle</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Statut</th>
                            <th className="py-3 px-4 text-center font-bold text-blue-700 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {/* {patients.map((patient, idx) => (
                            <tr key={patient.id} className={idx % 2 === 0 ? "bg-white" : "bg-blue-50/50"}>
                                <td className="py-2 px-4 whitespace-nowrap">{patient.nom}</td>
                                <td className="py-2 px-4 whitespace-nowrap">{patient.prenom}</td>
                                <td className="py-2 px-4 whitespace-nowrap">{patient.email}</td>
                                <td className="py-2 px-4 whitespace-nowrap">Patient</td>
                                <td className="py-2 px-4 whitespace-nowrap">
                                    {patient.actif ? (
                                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">Actif</span>
                                    ) : (
                                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700">Inactif</span>
                                    )}
                                </td>
                                <td className="py-2 px-4 whitespace-nowrap text-center">
                                    <button
                                        onClick={() => handleActivationToggle(patient.id)}
                                        className={`px-3 sm:px-4 py-1 rounded-lg font-semibold shadow-sm transition text-white text-xs sm:text-sm ${patient.actif ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
                                    >
                                        {patient.actif ? "Désactiver" : "Activer"}
                                    </button>
                                </td>
                            </tr>
                        ))} */}
                    </tbody>
                </table>
            </div>

            <div className="overflow-x-auto rounded-xl shadow border border-gray-100 bg-white">
                <table className="min-w-[600px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
                    <thead className="bg-blue-50">
                        <tr>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Nom</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Prénom</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Email</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Rôle</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Statut</th>
                            <th className="py-3 px-4 text-center font-bold text-blue-700 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {medecins.map((medecin, idx) => (
                            <tr key={medecin.id} className={idx % 2 === 0 ? "bg-white" : "bg-blue-50/50"}>
                                <td className="py-2 px-4 whitespace-nowrap">{medecin.nom}</td>
                                <td className="py-2 px-4 whitespace-nowrap">{medecin.prenom}</td>
                                <td className="py-2 px-4 whitespace-nowrap">{medecin.email}</td>
                                <td className="py-2 px-4 whitespace-nowrap">Médecin</td>
                                <td className="py-2 px-4 whitespace-nowrap">
                                    {medecin.actif ? (
                                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">Actif</span>
                                    ) : (
                                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700">Inactif</span>
                                    )}
                                </td>
                                <td className="py-2 px-4 whitespace-nowrap text-center">
                                    <button
                                        onClick={() => handleActivationToggle(medecin.id)}
                                        className={`px-3 sm:px-4 py-1 rounded-lg font-semibold shadow-sm transition text-white text-xs sm:text-sm ${medecin.actif ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
                                    >
                                        {medecin.actif ? "Désactiver" : "Activer"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="overflow-x-auto rounded-xl shadow border border-gray-100 bg-white">
                <table className="min-w-[600px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
                    <thead className="bg-blue-50">
                        <tr>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Nom</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Prénom</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Email</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Rôle</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Statut</th>
                            <th className="py-3 px-4 text-center font-bold text-blue-700 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {secretaires.map((secretaire, idx) => (
                            <tr key={secretaire.id} className={idx % 2 === 0 ? "bg-white" : "bg-blue-50/50"}>
                                <td className="py-2 px-4 whitespace-nowrap">{secretaire.nom}</td>
                                <td className="py-2 px-4 whitespace-nowrap">{secretaire.prenom}</td>
                                <td className="py-2 px-4 whitespace-nowrap">{secretaire.email}</td>
                                <td className="py-2 px-4 whitespace-nowrap">Secrétaire</td>
                                <td className="py-2 px-4 whitespace-nowrap">
                                    {secretaire.actif ? (
                                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">Actif</span>
                                    ) : (
                                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700">Inactif</span>
                                    )}
                                </td>
                                <td className="py-2 px-4 whitespace-nowrap text-center">
                                    <button
                                        onClick={() => handleActivationToggle(secretaire.id)}
                                        className={`px-3 sm:px-4 py-1 rounded-lg font-semibold shadow-sm transition text-white text-xs sm:text-sm ${secretaire.actif ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
                                    >
                                        {secretaire.actif ? "Désactiver" : "Activer"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Utilisateurs;
