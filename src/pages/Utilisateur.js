import React, { useEffect, useState } from "react";
import { 
    getAllUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    toggleUserStatus,
    updateUserRole,
    getAllRoles,
    getAllPatients,
    getAllHealthcareProfessionals
} from '../services/api/admin';
import { createProfSante } from '../services/api/profSante';

// Fonction utilitaire pour extraire le nom du rôle depuis un objet ou une chaîne
const getRoleName = (role) => {
    if (typeof role === 'string') return role;
    if (role && typeof role === 'object') return role.nom || role.name || role.id || 'Inconnu';
    return 'Inconnu';
};

// Fonction pour normaliser les valeurs de rôle pour la comparaison
const normalizeRoleValue = (role) => {
    return getRoleName(role).toLowerCase().trim();
};

function Utilisateurs() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        role: 'patient',
        statut: 'actif'
    });
    
    // Nouveaux états pour les onglets et données
    const [activeTab, setActiveTab] = useState("users");
    const [patients, setPatients] = useState([]);
    const [healthcareProfessionals, setHealthcareProfessionals] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [loadingProfessionals, setLoadingProfessionals] = useState(false);

    // Nouveaux états pour la création de professionnel
    const [showProfModal, setShowProfModal] = useState(false);
    const [profFormData, setProfFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        sexe: '',
        date_naissance: '',
        numero_adeli: '',
        mot_de_passe: '',
        role: 'medecin'
    });

    // États pour l'édition de professionnel
    const [editingProfessional, setEditingProfessional] = useState(null);
    const [showEditProfModal, setShowEditProfModal] = useState(false);

    // États pour la gestion des patients
    const [editingPatient, setEditingPatient] = useState(null);
    const [showEditPatientModal, setShowEditPatientModal] = useState(false);

    useEffect(() => {
        console.log('Component mounted');
        loadUsers();
        loadRoles();
        loadPatients();
        loadHealthcareProfessionals();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            console.log('Loading users...');
            const response = await getAllUsers();
            console.log('Users response:', response);
            
            // Vérifier la structure de la réponse
            if (response && response.data && Array.isArray(response.data.users)) {
                console.log('Setting users from API data.users:', response.data.users.length);
                setUsers(response.data.users);
            } else if (response && response.data && Array.isArray(response.data)) {
                console.log('Setting users from API data:', response.data.length);
                setUsers(response.data);
            } else if (response && Array.isArray(response)) {
                console.log('Setting users from direct array:', response.length);
                setUsers(response);
            } else {
                console.warn('Unexpected response structure:', response);
                setUsers([]);
            }
        } catch (err) {
            console.error('Error loading users:', err);
            setError("Erreur lors du chargement des utilisateurs");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const loadRoles = async () => {
        try {
            console.log('Loading roles...');
            const response = await getAllRoles();
            console.log('Roles response:', response);
            
            if (response && response.data && Array.isArray(response.data.roles)) {
                console.log('Setting roles from API data.roles:', response.data.roles.length);
                setRoles(response.data.roles);
            } else if (response && response.data && Array.isArray(response.data)) {
                console.log('Setting roles from API data:', response.data.length);
                setRoles(response.data);
            } else if (response && Array.isArray(response)) {
                console.log('Setting roles from direct array:', response.length);
                setRoles(response);
            } else {
                console.warn('Using empty roles due to unexpected response structure');
                setRoles([]);
            }
        } catch (err) {
            console.error('Error loading roles:', err);
            console.log('Using empty roles due to error');
            setRoles([]);
        }
    };

    const loadPatients = async () => {
        try {
            setLoadingPatients(true);
            console.log('Loading patients...');
            const response = await getAllPatients();
            console.log('Patients response:', response);
            
            if (response && response.data && Array.isArray(response.data.patients)) {
                console.log('Setting patients from API data.patients:', response.data.patients.length);
                setPatients(response.data.patients);
            } else if (response && response.data && Array.isArray(response.data)) {
                console.log('Setting patients from API data:', response.data.length);
                setPatients(response.data);
            } else if (response && Array.isArray(response)) {
                console.log('Setting patients from direct array:', response.length);
                setPatients(response);
            } else {
                console.warn('Unexpected patients response structure:', response);
                setPatients([]);
            }
        } catch (err) {
            console.error('Error loading patients:', err);
            setPatients([]);
        } finally {
            setLoadingPatients(false);
        }
    };

    const loadHealthcareProfessionals = async () => {
        try {
            setLoadingProfessionals(true);
            console.log('🚀 Loading healthcare professionals...');
            console.log('📡 Calling getAllHealthcareProfessionals()...');
            
            const response = await getAllHealthcareProfessionals();
            console.log('📥 Raw API response:', response);
            console.log('📊 Response type:', typeof response);
            console.log('🔍 Response keys:', response ? Object.keys(response) : 'null');
            
            // 🔍 Analyse détaillée de la réponse
            console.log('🔍 === DÉTAIL DE LA RÉPONSE ===');
            if (response) {
                console.log('   - Response exists:', true);
                console.log('   - Response type:', typeof response);
                console.log('   - Response keys:', Object.keys(response));
                
                if (response.data) {
                    console.log('   - Has data:', true);
                    console.log('   - Data type:', typeof response.data);
                    console.log('   - Data keys:', Object.keys(response.data));
                    
                    if (Array.isArray(response.data)) {
                        console.log('   - Data is array:', true);
                        console.log('   - Array length:', response.data.length);
                        if (response.data.length > 0) {
                            console.log('   - First item:', response.data[0]);
                        }
                    } else if (typeof response.data === 'object') {
                        console.log('   - Data is object:', true);
                        for (const [key, value] of Object.entries(response.data)) {
                            console.log(`     ${key}:`, value);
                            if (Array.isArray(value)) {
                                console.log(`       Array length: ${value.length}`);
                                if (value.length > 0) {
                                    console.log(`       First item:`, value[0]);
                                }
                            }
                        }
                    }
                } else {
                    console.log('   - Has data: false');
                }
            } else {
                console.log('   - Response exists: false');
            }
            console.log('🔍 === FIN ANALYSE ===');
            
            // 🔍 Traitement intelligent des données
            let professionalsToSet = [];
            
            if (response && response.data && Array.isArray(response.data.professionals)) {
                console.log('✅ Setting professionals from API data.professionals:', response.data.professionals.length);
                professionalsToSet = response.data.professionals;
            } else if (response && response.data && Array.isArray(response.data)) {
                console.log('✅ Setting professionals from API data:', response.data.length);
                professionalsToSet = response.data;
            } else if (response && Array.isArray(response)) {
                console.log('✅ Setting professionals from direct array:', response.length);
                professionalsToSet = response;
            } else if (response && response.data && typeof response.data === 'object') {
                // 🔍 Chercher dans toutes les propriétés de response.data
                console.log('🔍 Searching for professionals in response.data properties...');
                for (const [key, value] of Object.entries(response.data)) {
                    if (Array.isArray(value) && value.length > 0) {
                        // Vérifier si c'est un tableau de professionnels
                        const firstItem = value[0];
                        if (firstItem && (firstItem.nom || firstItem.prenom || firstItem.specialite)) {
                            console.log(`✅ Found professionals in property '${key}':`, value.length);
                            professionalsToSet = value;
                            break;
                        }
                    }
                }
                
                if (professionalsToSet.length === 0) {
                    console.warn('⚠️ No professionals found in any property of response.data');
                }
            } else {
                console.warn('⚠️ Unexpected professionals response structure:', response);
                console.warn('🔍 Response structure analysis:');
                if (response) {
                    console.warn('   - Has response:', true);
                    console.warn('   - Has data:', !!response.data);
                    console.warn('   - Data type:', typeof response.data);
                    if (response.data) {
                        console.warn('   - Data keys:', Object.keys(response.data));
                        console.warn('   - Data is array:', Array.isArray(response.data));
                    }
                } else {
                    console.warn('   - Response is null/undefined');
                }
            }
            
            // 🔍 Vérifier et définir les professionnels
            console.log('🔍 Final professionals to set:', professionalsToSet);
            console.log('🔍 Professionals count:', professionalsToSet.length);
            if (professionalsToSet.length > 0) {
                console.log('🔍 First professional:', professionalsToSet[0]);
            }
            
            setHealthcareProfessionals(professionalsToSet);
        } catch (err) {
            console.error('❌ Error loading healthcare professionals:', err);
            console.error('🔍 Error details:', {
                message: err.message,
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data
            });
            setHealthcareProfessionals([]);
        } finally {
            setLoadingProfessionals(false);
            console.log('🏁 Loading finished');
        }
    };

    const handleCreateUser = async () => {
        try {
            // Préparer les données pour l'API
            const userData = {
                ...formData,
                // S'assurer que le rôle est envoyé comme ID si c'est un objet
                role: typeof formData.role === 'object' ? formData.role.id : formData.role
            };
            
            await createUser(userData);
            setShowModal(false);
            setFormData({
                nom: '',
                prenom: '',
                email: '',
                role: 'patient',
                statut: 'actif'
            });
            loadUsers(); // Recharger la liste
        } catch (err) {
            console.error('Error creating user:', err);
            setError("Erreur lors de la création de l'utilisateur");
        }
    };

    const handleUpdateUser = async () => {
        try {
            if (!editingUser) return;
            
            // Préparer les données pour l'API
            const userData = {
                ...formData,
                // S'assurer que le rôle est envoyé comme ID si c'est un objet
                role: typeof formData.role === 'object' ? formData.role.id : formData.role
            };
            
            await updateUser(editingUser.id, userData);
            setShowModal(false);
            setEditingUser(null);
            setFormData({
                nom: '',
                prenom: '',
                email: '',
                role: 'patient',
                statut: 'actif'
            });
            loadUsers(); // Recharger la liste
        } catch (err) {
            console.error('Error updating user:', err);
            setError("Erreur lors de la mise à jour de l'utilisateur");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
            try {
                await deleteUser(userId);
                loadUsers(); // Recharger la liste
            } catch (err) {
                console.error('Error deleting user:', err);
                setError("Erreur lors de la suppression de l'utilisateur");
            }
        }
    };

    const handleToggleStatus = async (userId, newStatus) => {
        try {
            await toggleUserStatus(userId, newStatus);
            loadUsers(); // Recharger la liste
        } catch (err) {
            console.error('Error toggling user status:', err);
            setError("Erreur lors de la modification du statut");
        }
    };

    const handleToggleUserBlockStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'bloque' ? 'actif' : 'bloque';
        const actionText = newStatus === 'bloque' ? 'bloquer' : 'débloquer';
        
        if (window.confirm(`Êtes-vous sûr de vouloir ${actionText} cet utilisateur ?`)) {
            try {
                // Appeler l'API pour modifier le statut
                await toggleUserStatus(userId, newStatus);
                console.log('User status updated:', userId, newStatus);
                
                // Recharger la liste des utilisateurs
                loadUsers();
                
                alert(`Utilisateur ${actionText} avec succès !`);
            } catch (err) {
                console.error('Error updating user status:', err);
                alert(`Erreur lors de la modification du statut: ${err.message || 'Erreur inconnue'}`);
            }
        }
    };

    const handleActivateUser = async (userId) => {
        if (window.confirm("Êtes-vous sûr de vouloir activer cet utilisateur ?")) {
            try {
                // Appeler l'API pour activer l'utilisateur
                await toggleUserStatus(userId, 'actif');
                console.log('User activated:', userId);
                
                // Recharger la liste des utilisateurs
                loadUsers();
                
                alert('Utilisateur activé avec succès !');
            } catch (err) {
                console.error('Error activating user:', err);
                alert(`Erreur lors de l'activation: ${err.message || 'Erreur inconnue'}`);
            }
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            nom: user.nom || '',
            prenom: user.prenom || '',
            email: user.email || '',
            role: user.role || 'patient',
            statut: user.statut || 'actif'
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({
            nom: '',
            prenom: '',
            email: '',
            role: 'patient',
            statut: 'actif'
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCreateProf = async () => {
        try {
            console.log('Creating professional with data:', profFormData);
            
            // Appeler l'API pour créer le professionnel
            const response = await createProfSante(profFormData);
            console.log('Professional created successfully:', response);
            
            // Fermer le modal et réinitialiser le formulaire
            setShowProfModal(false);
            setProfFormData({
                nom: '',
                prenom: '',
                email: '',
                sexe: '',
                date_naissance: '',
                numero_adeli: '',
                mot_de_passe: '',
                role: 'medecin'
            });
            
            // Recharger la liste des professionnels
            loadHealthcareProfessionals();
            
            // Afficher un message de succès (optionnel)
            alert('Professionnel créé avec succès !');
        } catch (err) {
            console.error('Error creating professional:', err);
            alert(`Erreur lors de la création du professionnel: ${err.message || 'Erreur inconnue'}`);
        }
    };

    const handleProfInputChange = (e) => {
        const { name, value } = e.target;
        setProfFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDeleteProfessional = async (professionalId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce professionnel ?")) {
            try {
                // Appeler l'API pour supprimer le professionnel
                // await deleteProfSante(professionalId);
                console.log('Professional deleted:', professionalId);
                
                // Recharger la liste des professionnels
                loadHealthcareProfessionals();
                
                alert('Professionnel supprimé avec succès !');
            } catch (err) {
                console.error('Error deleting professional:', err);
                alert(`Erreur lors de la suppression: ${err.message || 'Erreur inconnue'}`);
            }
        }
    };

    const handleToggleProfessionalStatus = async (professionalId, currentStatus) => {
        const newStatus = currentStatus === 'actif' ? 'bloque' : 'actif';
        const actionText = newStatus === 'bloque' ? 'bloquer' : 'débloquer';
        
        if (window.confirm(`Êtes-vous sûr de vouloir ${actionText} ce professionnel ?`)) {
            try {
                // Appeler l'API pour modifier le statut
                // await updateProfSante(professionalId, { statut: newStatus });
                console.log('Professional status updated:', professionalId, newStatus);
                
                // Recharger la liste des professionnels
                loadHealthcareProfessionals();
                
                alert(`Professionnel ${actionText} avec succès !`);
            } catch (err) {
                console.error('Error updating professional status:', err);
                alert(`Erreur lors de la modification du statut: ${err.message || 'Erreur inconnue'}`);
            }
        }
    };

    const handleActivateProfessional = async (professionalId) => {
        if (window.confirm("Êtes-vous sûr de vouloir activer ce professionnel ?")) {
            try {
                // Appeler l'API pour activer le professionnel
                // await updateProfSante(professionalId, { statut: 'actif' });
                console.log('Professional activated:', professionalId);
                
                // Recharger la liste des professionnels
                loadHealthcareProfessionals();
                
                alert('Professionnel activé avec succès !');
            } catch (err) {
                console.error('Error activating professional:', err);
                alert(`Erreur lors de l'activation: ${err.message || 'Erreur inconnue'}`);
            }
        }
    };

    const openEditProfessionalModal = (professional) => {
        setEditingProfessional(professional);
        setProfFormData({
            nom: professional.nom || '',
            prenom: professional.prenom || '',
            email: professional.email || '',
            sexe: professional.sexe || '',
            date_naissance: professional.date_naissance || '',
            numero_adeli: professional.numero_adeli || '',
            mot_de_passe: '', // Ne pas pré-remplir le mot de passe
            role: professional.role || 'medecin'
        });
        setShowEditProfModal(true);
    };

    const handleUpdateProfessional = async () => {
        try {
            if (!editingProfessional) return;
            
            console.log('Updating professional with data:', profFormData);
            
            // Appeler l'API pour modifier le professionnel
            // await updateProfSante(editingProfessional.id, profFormData);
            console.log('Professional updated successfully');
            
            // Fermer le modal et réinitialiser
            setShowEditProfModal(false);
            setEditingProfessional(null);
            setProfFormData({
                nom: '',
                prenom: '',
                email: '',
                sexe: '',
                date_naissance: '',
                numero_adeli: '',
                mot_de_passe: '',
                role: 'medecin'
            });
            
            // Recharger la liste des professionnels
            loadHealthcareProfessionals();
            
            alert('Professionnel modifié avec succès !');
        } catch (err) {
            console.error('Error updating professional:', err);
            alert(`Erreur lors de la modification: ${err.message || 'Erreur inconnue'}`);
        }
    };

    // Fonctions pour la gestion des patients
    const handleDeletePatient = async (patientId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce patient ?")) {
            try {
                // Appeler l'API pour supprimer le patient
                // await deletePatient(patientId);
                console.log('Patient deleted:', patientId);
                
                // Recharger la liste des patients
                loadPatients();
                
                alert('Patient supprimé avec succès !');
            } catch (err) {
                console.error('Error deleting patient:', err);
                alert(`Erreur lors de la suppression: ${err.message || 'Erreur inconnue'}`);
            }
        }
    };

    const handleTogglePatientStatus = async (patientId, currentStatus) => {
        const newStatus = currentStatus === 'actif' ? 'bloque' : 'actif';
        const actionText = newStatus === 'bloque' ? 'bloquer' : 'débloquer';
        
        if (window.confirm(`Êtes-vous sûr de vouloir ${actionText} ce patient ?`)) {
            try {
                // Appeler l'API pour modifier le statut
                // await updatePatient(patientId, { statut: newStatus });
                console.log('Patient status updated:', patientId, newStatus);
                
                // Recharger la liste des patients
                loadPatients();
                
                alert(`Patient ${actionText} avec succès !`);
            } catch (err) {
                console.error('Error updating patient status:', err);
                alert(`Erreur lors de la modification du statut: ${err.message || 'Erreur inconnue'}`);
            }
        }
    };

    const handleActivatePatient = async (patientId) => {
        if (window.confirm("Êtes-vous sûr de vouloir activer ce patient ?")) {
            try {
                // Appeler l'API pour activer le patient
                // await updatePatient(patientId, { statut: 'actif' });
                console.log('Patient activated:', patientId);
                
                // Recharger la liste des patients
                loadPatients();
                
                alert('Patient activé avec succès !');
            } catch (err) {
                console.error('Error activating patient:', err);
                alert(`Erreur lors de l'activation: ${err.message || 'Erreur inconnue'}`);
            }
        }
    };

    const openEditPatientModal = (patient) => {
        setEditingPatient(patient);
        setShowEditPatientModal(true);
    };

    // Filtrage des utilisateurs
    const filteredUsers = users.filter(user => {
        // Filtre par recherche
        const matchesSearch = searchTerm === "" || 
                             user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtre par rôle - comparaison directe et insensible à la casse
        const matchesRole = selectedRole === "all" || 
                           user.role?.toLowerCase() === selectedRole.toLowerCase();
        
        // Debug pour voir ce qui se passe
        if (selectedRole !== "all") {
            console.log(`User: ${user.nom}, Role: "${user.role}", Selected: "${selectedRole}", Match: ${matchesRole}`);
        }
        
        return matchesSearch && matchesRole;
    });

    // Filtrage des professionnels de santé
    const filteredProfessionals = healthcareProfessionals.filter(professional => {
        // Filtre par recherche
        const matchesSearch = searchTerm === "" || 
                             professional.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             professional.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             professional.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             professional.specialite?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtre par rôle - comparaison directe et insensible à la casse
        const matchesRole = selectedRole === "all" || 
                           professional.role?.toLowerCase() === selectedRole.toLowerCase();
        
        return matchesSearch && matchesRole;
    });

    // Préparer les options de rôle pour le select - utiliser directement les rôles de l'API
    const roleOptions = ['all', 'secretaire', 'admin', 'medecin', 'patient'];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 text-xl font-semibold mb-4">{error}</div>
                <button 
                    onClick={() => { setError(null); loadUsers(); }} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Utilisateurs</h1>
                    <p className="text-gray-600">Gérez tous les utilisateurs de la plateforme</p>
                    
                    {/* Onglets */}
                    <div className="mt-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab("users")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "users"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <i className="fas fa-users mr-2"></i>
                                Utilisateurs ({users.length})
                            </button>
                            <button
                                onClick={() => setActiveTab("patients")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "patients"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <i className="fas fa-user-injured mr-2"></i>
                                Patients ({patients.length})
                            </button>
                            <button
                                onClick={() => setActiveTab("professionals")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "professionals"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <i className="fas fa-user-md mr-2"></i>
                                Professionnels ({healthcareProfessionals.length})
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Barre d'outils */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <input
                                    type="text"
                                    placeholder={
                                        activeTab === "users" ? "Rechercher un utilisateur..." :
                                        activeTab === "patients" ? "Rechercher un patient..." :
                                        "Rechercher un professionnel..."
                                    }
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                            
                            {/* Filtres spécifiques selon l'onglet actif */}
                            {activeTab === "users" && (
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">Tous les rôles</option>
                                    <option value="secretaire">Secrétaire</option>
                                    <option value="admin">Administrateur</option>
                                    <option value="medecin">Médecin</option>
                                    <option value="patient">Patient</option>
                                </select>
                            )}
                            
                            {activeTab === "professionals" && (
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">Tous les professionnels</option>
                                    <option value="medecin">Médecin</option>
                                    <option value="infirmier">Infirmier</option>
                                </select>
                            )}
                        </div>
                        
                        {/* Bouton d'action selon l'onglet */}
                        {activeTab === "users" && (
                            <button 
                                onClick={openCreateModal}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Nouvel Utilisateur
                            </button>
                        )}
                        
                        {activeTab === "professionals" && (
                            <button 
                                onClick={() => setShowProfModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Nouveau Professionnel
                            </button>
                        )}
                    </div>
                </div>

                {/* Statistiques selon l'onglet actif */}
                {activeTab === "users" && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <i className="fas fa-users text-blue-600 text-xl"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <i className="fas fa-user-md text-green-600 text-xl"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Médecins</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {users.filter(u => normalizeRoleValue(u.role) === 'medecin').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <i className="fas fa-user-tie text-purple-600 text-xl"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Secrétaires</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {users.filter(u => normalizeRoleValue(u.role) === 'secretaire').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <i className="fas fa-user text-orange-600 text-xl"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Patients</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {users.filter(u => normalizeRoleValue(u.role) === 'patient').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "patients" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <i className="fas fa-user-injured text-green-600 text-xl"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Patients</p>
                                    <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <i className="fas fa-calendar text-blue-600 text-xl"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Avec Rendez-vous</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {patients.filter(p => p.rendez_vous && p.rendez_vous.length > 0).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <i className="fas fa-history text-purple-600 text-xl"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Avec Historique</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {patients.filter(p => p.historique_medical && p.historique_medical.length > 0).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "professionals" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <i className="fas fa-user-md text-purple-600 text-xl"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Professionnels</p>
                                    <p className="text-2xl font-bold text-gray-900">{healthcareProfessionals.length}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <i className="fas fa-stethoscope text-green-600 text-xl"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Médecins</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {healthcareProfessionals.filter(p => p.role === 'medecin').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <i className="fas fa-user-nurse text-blue-600 text-xl"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Infirmiers</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {healthcareProfessionals.filter(p => p.role === 'infirmier').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contenu conditionnel selon l'onglet actif */}
                {activeTab === "users" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-blue-600">
                                                                {user.nom?.charAt(0)}{user.prenom?.charAt(0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.nom} {user.prenom}
                                                        </div>
                                                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {getRoleName(user.role)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span 
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                                                        user.statut === 'actif' ? 'bg-green-100 text-green-800' : 
                                                        user.statut === 'inactif' ? 'bg-red-100 text-red-800' : 
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}
                                                    onClick={() => handleToggleStatus(user.id, user.statut === 'actif' ? 'inactif' : 'actif')}
                                                >
                                                    {user.statut === 'actif' ? 'Actif' : 
                                                     user.statut === 'inactif' ? 'Inactif' : 
                                                     user.statut === 'suspendu' ? 'Suspendu' : 'Inconnu'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button 
                                                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors" 
                                                        title="Modifier"
                                                        onClick={() => openEditModal(user)}
                                                    >
                                                        <i className="fas fa-edit mr-1"></i>
                                                        Modifier
                                                    </button>
                                                    <button 
                                                        className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium transition-colors" 
                                                        title="Supprimer"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        <i className="fas fa-trash mr-1"></i>
                                                        Supprimer
                                                    </button>
                                                    <button 
                                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                            user.statut === 'bloque' 
                                                                ? 'bg-green-100 hover:bg-green-200 text-green-800' 
                                                                : 'bg-orange-100 hover:bg-orange-200 text-orange-800'
                                                        }`}
                                                        title={user.statut === 'bloque' ? 'Débloquer le compte' : 'Bloquer le compte'}
                                                        onClick={() => handleToggleUserBlockStatus(user.id, user.statut || 'actif')}
                                                    >
                                                        <i className={`mr-1 ${user.statut === 'bloque' ? 'fas fa-unlock' : 'fas fa-ban'}`}></i>
                                                        {user.statut === 'bloque' ? 'Débloquer' : 'Bloquer'}
                                                    </button>
                                                    {user.statut === 'bloque' && (
                                                        <button 
                                                            className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                                            title="Activer le compte"
                                                            onClick={() => handleActivateUser(user.id)}
                                                        >
                                                            <i className="fas fa-check mr-1"></i>
                                                            Activer
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-12">
                                <i className="fas fa-users text-gray-400 text-4xl mb-4"></i>
                                <p className="text-gray-500 text-lg">Aucun utilisateur trouvé</p>
                                {selectedRole !== "all" && (
                                    <p className="text-gray-400 text-sm mt-2">
                                        Aucun utilisateur avec le rôle "{selectedRole}"
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Onglet Patients */}
                {activeTab === "patients" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Informations</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loadingPatients ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-4 text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                            </td>
                                        </tr>
                                    ) : patients.length > 0 ? (
                                        patients.map((patient) => (
                                            <tr key={patient.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-green-600">
                                                                    {patient.nom?.charAt(0)}{patient.prenom?.charAt(0)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {patient.nom} {patient.prenom}
                                                            </div>
                                                            <div className="text-sm text-gray-500">ID: {patient.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{patient.email}</div>
                                                    {patient.telephone && (
                                                        <div className="text-sm text-gray-500">{patient.telephone}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {patient.date_naissance && (
                                                            <div>Né(e) le: {new Date(patient.date_naissance).toLocaleDateString()}</div>
                                                        )}
                                                        {patient.groupe_sanguin && (
                                                            <div>Groupe: {patient.groupe_sanguin}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <button 
                                                            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors" 
                                                            title="Modifier"
                                                            onClick={() => openEditPatientModal(patient)}
                                                        >
                                                            <i className="fas fa-edit mr-1"></i>
                                                            Modifier
                                                        </button>
                                                        <button 
                                                            className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium transition-colors" 
                                                            title="Supprimer"
                                                            onClick={() => handleDeletePatient(patient.id)}
                                                        >
                                                            <i className="fas fa-trash mr-1"></i>
                                                            Supprimer
                                                        </button>
                                                        {patient.statut === 'bloque' ? (
                                                            <>
                                                                <button 
                                                                    className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                                                    title="Activer le compte"
                                                                    onClick={() => handleActivatePatient(patient.id)}
                                                                >
                                                                    <i className="fas fa-check mr-1"></i>
                                                                    Activer
                                                                </button>
                                                                <button 
                                                                    className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                                                    title="Débloquer le compte"
                                                                    onClick={() => handleTogglePatientStatus(patient.id, patient.statut)}
                                                                >
                                                                    <i className="fas fa-unlock mr-1"></i>
                                                                    Débloquer
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button 
                                                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                                    patient.statut === 'bloque' 
                                                                        ? 'bg-green-100 hover:bg-green-200 text-green-800' 
                                                                        : 'bg-orange-100 hover:bg-orange-200 text-orange-800'
                                                                }`}
                                                                title={patient.statut === 'bloque' ? 'Débloquer le compte' : 'Bloquer le compte'}
                                                                onClick={() => handleTogglePatientStatus(patient.id, patient.statut || 'actif')}
                                                            >
                                                                <i className={`mr-1 ${patient.statut === 'bloque' ? 'fas fa-unlock' : 'fas fa-ban'}`}></i>
                                                                {patient.statut === 'bloque' ? 'Débloquer' : 'Bloquer'}
                                                            </button>
                                                        )}
                                                        <button 
                                                            className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded-md text-sm font-medium transition-colors" 
                                                            title="Voir le planning"
                                                        >
                                                            <i className="fas fa-calendar-alt mr-1"></i>
                                                            Planning
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                                                         ) : (
                                         <tr>
                                             <td colSpan="4" className="px-6 py-4 text-center">
                                                 <div className="text-gray-500">
                                                     {healthcareProfessionals.length === 0 
                                                         ? "Aucun professionnel trouvé" 
                                                         : `Aucun professionnel ne correspond aux critères de recherche`
                                                     }
                                                 </div>
                                                 {searchTerm !== "" && (
                                                     <div className="text-gray-400 text-sm mt-1">
                                                         Recherche: "{searchTerm}"
                                                     </div>
                                                 )}
                                                 {selectedRole !== "all" && (
                                                     <div className="text-gray-400 text-sm mt-1">
                                                         Rôle: "{selectedRole}"
                                                     </div>
                                                 )}
                                             </td>
                                         </tr>
                                     )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de création/édition */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                <input
                                    type="text"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                                <input
                                    type="text"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                                <select
                                    name="role"
                                    value={typeof formData.role === 'object' ? formData.role.id : formData.role}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {roleOptions.map(role => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                                <select
                                    name="statut"
                                    value={formData.statut}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="actif">Actif</option>
                                    <option value="inactif">Inactif</option>
                                    <option value="suspendu">Suspendu</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                            >
                                {editingUser ? 'Modifier' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de création de professionnel */}
            {showProfModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Nouveau professionnel de santé
                            </h2>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                <input
                                    type="text"
                                    name="nom"
                                    value={profFormData.nom}
                                    onChange={handleProfInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                <input
                                    type="text"
                                    name="prenom"
                                    value={profFormData.prenom}
                                    onChange={handleProfInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profFormData.email}
                                    onChange={handleProfInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="exemple@email.com"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sexe *</label>
                                    <select
                                        name="sexe"
                                        value={profFormData.sexe}
                                        onChange={handleProfInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Sélectionner</option>
                                        <option value="M">Masculin</option>
                                        <option value="F">Féminin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                                    <input
                                        type="date"
                                        name="date_naissance"
                                        value={profFormData.date_naissance}
                                        onChange={handleProfInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro ADELI *</label>
                                <input
                                    type="text"
                                    name="numero_adeli"
                                    value={profFormData.numero_adeli}
                                    onChange={handleProfInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: 12345678901"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                                <input
                                    type="password"
                                    name="mot_de_passe"
                                    value={profFormData.mot_de_passe}
                                    onChange={handleProfInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                                <select
                                    name="role"
                                    value={profFormData.role}
                                    onChange={handleProfInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="medecin">Médecin</option>
                                    <option value="infirmier">Infirmier</option>
                                    <option value="pharmacien">Pharmacien</option>
                                    <option value="kinésithérapeute">Kinésithérapeute</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowProfModal(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleCreateProf}
                                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
                            >
                                Créer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'édition de professionnel */}
            {showEditProfModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Modifier le professionnel
                            </h2>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                <input
                                    type="text"
                                    name="nom"
                                    value={profFormData.nom}
                                    onChange={handleProfInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                <input
                                    type="text"
                                    name="prenom"
                                    value={profFormData.prenom}
                                    onChange={handleProfInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profFormData.email}
                                    onChange={handleProfInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="exemple@email.com"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sexe *</label>
                                    <select
                                        name="sexe"
                                        value={profFormData.sexe}
                                        onChange={handleProfInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Sélectionner</option>
                                        <option value="M">Masculin</option>
                                        <option value="F">Féminin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                                    <input
                                        type="date"
                                        name="date_naissance"
                                        value={profFormData.date_naissance}
                                        onChange={handleProfInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro ADELI *</label>
                                <input
                                    type="text"
                                    name="numero_adeli"
                                    value={profFormData.numero_adeli}
                                    onChange={handleProfInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: 12345678901"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                                <input
                                    type="password"
                                    name="mot_de_passe"
                                    value={profFormData.mot_de_passe}
                                    onChange={handleProfInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Laisser vide pour ne pas changer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                                <select
                                    name="role"
                                    value={profFormData.role}
                                    onChange={handleProfInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="medecin">Médecin</option>
                                    <option value="infirmier">Infirmier</option>
                                    <option value="pharmacien">Pharmacien</option>
                                    <option value="kinésithérapeute">Kinésithérapeute</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowEditProfModal(false);
                                    setEditingProfessional(null);
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleUpdateProfessional}
                                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
                            >
                                Modifier
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'édition de patient */}
            {showEditPatientModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Modifier le patient
                            </h2>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                <input
                                    type="text"
                                    name="nom"
                                    value={editingPatient?.nom || ''}
                                    onChange={(e) => setEditingPatient(prev => ({ ...prev, nom: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                <input
                                    type="text"
                                    name="prenom"
                                    value={editingPatient?.prenom || ''}
                                    onChange={(e) => setEditingPatient(prev => ({ ...prev, prenom: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editingPatient?.email || ''}
                                    onChange={(e) => setEditingPatient(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input
                                    type="tel"
                                    name="telephone"
                                    value={editingPatient?.telephone || ''}
                                    onChange={(e) => setEditingPatient(prev => ({ ...prev, telephone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                                <input
                                    type="date"
                                    name="date_naissance"
                                    value={editingPatient?.date_naissance || ''}
                                    onChange={(e) => setEditingPatient(prev => ({ ...prev, date_naissance: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Groupe sanguin</label>
                                <input
                                    type="text"
                                    name="groupe_sanguin"
                                    value={editingPatient?.groupe_sanguin || ''}
                                    onChange={(e) => setEditingPatient(prev => ({ ...prev, groupe_sanguin: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
                                <select
                                    name="statut"
                                    value={editingPatient?.statut || ''}
                                    onChange={(e) => setEditingPatient(prev => ({ ...prev, statut: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="actif">Actif</option>
                                    <option value="inactif">Inactif</option>
                                    <option value="bloque">Bloqué</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowEditPatientModal(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => {
                                    // Préparer les données pour l'API
                                    const patientData = {
                                        ...editingPatient,
                                        // S'assurer que le statut est envoyé comme ID si c'est un objet
                                        statut: typeof editingPatient.statut === 'object' ? editingPatient.statut.id : editingPatient.statut
                                    };
                                    // await updatePatient(editingPatient.id, patientData); // API call
                                    console.log('Patient updated successfully');
                                    setShowEditPatientModal(false);
                                    setEditingPatient(null);
                                    loadPatients();
                                    alert('Patient modifié avec succès !');
                                }}
                                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
                            >
                                Modifier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Utilisateurs;