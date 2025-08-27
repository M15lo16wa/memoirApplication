import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaArrowLeft, FaIdCard } from 'react-icons/fa';
import { FaUserDoctor, FaUserInjured, FaUserTie, FaUserGear } from 'react-icons/fa6';
// gestion des service de connexion
import {login, loginPatient, loginMedecin} from "../services/api/authApi";

// authentification 2FA
import Setup2FA from "../components/2fa/Setup2FA";
import { create2FASession } from "../services/api/twoFactorApi";


function Connexion() {
    const [email, setEmail] = useState("");
    const [numero_assure, setNumeroAssure] = useState("");
    const [numero_adeli, setNumeroAdeli] = useState("");
    const [mot_de_passe, setMotDePasse] = useState("");
    const [error, setError] = useState("");
    const [selectedProfile, setSelectedProfile] = useState("");
    const [selectedProfessional, setSelectedProfessional] = useState("");
    const [show2FA, setShow2FA] = useState(false);
    const [userData, setUserData] = useState(null);
    const [requires2FA, setRequires2FA] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // 🧹 NETTOYAGE PRÉVENTIF : Supprimer les tokens temporaires avant nouvelle connexion
        console.log('🧹 NETTOYAGE PRÉVENTIF - Suppression des tokens temporaires avant nouvelle connexion...');
        const keysToClean = ['jwt', 'token'];
        keysToClean.forEach(key => {
            const token = localStorage.getItem(key);
            if (token && (token.startsWith('temp_') || token.startsWith('auth_'))) {
                localStorage.removeItem(key);
                console.log(`🧹 Token temporaire "${key}" supprimé: ${token.substring(0, 20)}...`);
            }
        });
        
        // Validation des champs
        if (selectedProfile === 'patient' && (!numero_assure || !mot_de_passe)) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        if (selectedProfile === 'professionnel') {
            if (selectedProfessional === 'medecin' && (!numero_adeli || !mot_de_passe)) {
                setError('Veuillez remplir tous les champs');
                return;
            }
            if ((selectedProfessional === 'administrateur' || selectedProfessional === 'secretaire') && (!email || !mot_de_passe)) {
                setError('Veuillez remplir tous les champs');
                return;
            }
        }

        // Préparation des identifiants selon le profil
        let identifiant = {};
        if (selectedProfile === 'patient') {
            identifiant = { numero_assure, mot_de_passe };
        } else if (selectedProfessional === 'medecin') {
            identifiant = { numero_adeli, mot_de_passe };
        } else {
            identifiant = { email, mot_de_passe };
        }

        // LOG pour débogage
        console.log('Tentative de connexion :', { 
            profile: selectedProfile,
            professionalType: selectedProfessional,
            identifiant,
            route: selectedProfile === 'patient' ? '/patient/auth/login' : 
                selectedProfessional === 'medecin' ? '/ProfessionnelSante/auth/login' : 
                '/auth/login'
        });

        try {
            let response;
            
            // ROUTE 1: Patient -> /patient/auth/login
            if (selectedProfile === 'patient') {
                console.log('🔵 Connexion PATIENT via /patient/auth/login');
                response = await loginPatient(identifiant);
                console.log('✅ Réponse complète de connexion patient:', response);
                
                // Vérifier si la 2FA est requise - amélioration de la détection
                const requires2FA = response.data?.status === 'requires2FA' ||
                    response.data?.requires2FA ||
                    response.data?.message?.includes('2FA') ||
                    response.data?.message?.includes('double facteur') ||
                    response.data?.message?.includes('authentification') ||
                    response.data?.two_factor_required ||
                    response.data?.data?.two_factor_required;

                console.log('🔍 Vérification 2FA:', {
                    status: response.data?.status,
                    requires2FA: response.data?.requires2FA,
                    message: response.data?.message,
                    two_factor_required: response.data?.two_factor_required,
                    data_two_factor: response.data?.data?.two_factor_required,
                    finalDecision: requires2FA
                });
                
                if (requires2FA) {
                    console.log('🔐 2FA requise pour le patient');
                    console.log('📊 Données utilisateur pour 2FA:', response.data);
                    
                    // Extraire les données patient de la structure imbriquée
                    const patientData = response.data.data?.patient || response.data.patient || response.data.data || response.data;
                    console.log('👤 Données patient extraites:', patientData);
                    
                    // Vérifier si le secret 2FA est présent
                    if (patientData.two_factor_secret) {
                        console.log('🔑 Secret 2FA trouvé:', patientData.two_factor_secret);
                    } else {
                        console.log('⚠️ Secret 2FA manquant dans les données patient');
                        console.log('🔍 Propriétés disponibles:', Object.keys(patientData));
                    }
                    
                    // Enrichir les données pour la 2FA (userType/identifier)
                    const enrichedPatient = {
                        ...patientData,
                        numero_assure: patientData.numero_assure || numero_assure,
                        type: 'patient',
                        // 🔐 Transmettre les informations 2FA de la réponse de connexion
                        tempTokenId: response.data.tempTokenId || null,
                        generatedToken: response.data.generatedToken || null,
                        // 🔑 CONSERVATION PRIORITAIRE DES TOKENS DE LA PREMIÈRE AUTHENTIFICATION
                        originalJWT: response.data.token || response.data.jwt || response.data.accessToken || null,
                        originalToken: response.data.token || null
                    };
                    
                                            // ✅ CONSERVATION SIMPLIFIÉE : Stocker les données patient pour la 2FA
                        console.log('🔐 CONSERVATION - Données patient stockées pour la 2FA');
                    
                    console.log('🔐 DEBUG - Patient enrichi avec tokens originaux:', {
                        tempTokenId: enrichedPatient.tempTokenId,
                        generatedToken: enrichedPatient.generatedToken,
                        originalJWT: enrichedPatient.originalJWT,
                        originalToken: enrichedPatient.originalToken,
                        stockageLocalStorage: {
                            originalJWT: localStorage.getItem('originalJWT') ? 'Présent' : 'Absent',
                            firstConnectionToken: localStorage.getItem('firstConnectionToken') ? 'Présent' : 'Absent'
                        }
                    });
                    setRequires2FA(true);
                    setUserData(enrichedPatient);
                    setShow2FA(true);
                    return;
                }
                
                // Connexion normale si pas de 2FA
                const token = localStorage.getItem('jwt');
                const patientData = localStorage.getItem('patient');
                
                if (token && patientData) {
                    console.log('🔑 Token et données patient présents, redirection vers /dmp');
                    navigate('/dmp');
                } else {
                    throw new Error('Aucun token ou données patient reçus lors de la connexion');
                }
                
            // ROUTE 2: Médecin -> /ProfessionnelSante/auth/login  
            } else if (selectedProfile === 'professionnel' && selectedProfessional === 'medecin') {
                console.log('🟢 Connexion MÉDECIN via /ProfessionnelSante/auth/login');
                console.log('📤 Identifiants envoyés:', identifiant);
                response = await loginMedecin(identifiant);
                console.log('✅ Données médecin reçues:', response);
                
                // Vérifier si la 2FA est requise
                if (response.data?.status === 'requires2FA' || response.data?.requires2FA) {
                    console.log('🔐 2FA requise pour le médecin');
                    
                    // Extraire les données médecin de la structure imbriquée
                    const medecinData = response.data.data?.medecin || response.data.medecin || response.data;
                    console.log('👨‍⚕️ Données médecin extraites:', medecinData);
                    
                    try {
                        // 🔐 CRÉER UNE SESSION 2FA POUR RÉCUPÉRER LE TEMPTOKENID
                        console.log('🔐 Création de session 2FA pour récupérer tempTokenId...');
                        const twoFAResponse = await create2FASession({
                            userType: 'professionnel',
                            identifier: medecinData.numero_adeli || numero_adeli
                        });
                        
                        console.log('🔐 Réponse create2FASession:', twoFAResponse);
                        
                        // Extraire le tempTokenId de la réponse
                        const tempTokenId = twoFAResponse.data?.tempTokenId ||
                            twoFAResponse.tempTokenId ||
                            twoFAResponse.data?.sessionId ||
                            twoFAResponse.sessionId;
                        
                        console.log('🔐 tempTokenId extrait:', tempTokenId);
                        
                        // Enrichir les données pour la 2FA (userType/identifier)
                        const enrichedMedecin = {
                            ...medecinData,
                            numero_adeli: medecinData.numero_adeli || numero_adeli,
                            type: 'professionnel',
                            // 🔐 TEMPTOKENID RÉCUPÉRÉ DE LA SESSION 2FA
                            tempTokenId: tempTokenId,
                            generatedToken: tempTokenId, // Utiliser tempTokenId comme fallback
                            // 🔑 CONSERVATION PRIORITAIRE DES TOKENS DE LA PREMIÈRE AUTHENTIFICATION
                            originalJWT: response.data.token || response.data.jwt || response.data.accessToken || null,
                            originalToken: response.data.token || null
                        };
                        
                        // ✅ CONSERVATION SIMPLIFIÉE : Stocker les données médecin pour la 2FA
                        console.log('🔐 CONSERVATION - Données médecin stockées pour la 2FA');
                        
                        console.log('🔐 DEBUG - Médecin enrichi avec tokens originaux:', {
                            tempTokenId: enrichedMedecin.tempTokenId,
                            generatedToken: enrichedMedecin.generatedToken,
                            originalJWT: enrichedMedecin.originalJWT,
                            originalToken: enrichedMedecin.originalToken,
                            stockageLocalStorage: {
                                originalJWT: localStorage.getItem('originalJWT') ? 'Présent' : 'Absent',
                                firstConnectionToken: localStorage.getItem('firstConnectionToken') ? 'Présent' : 'Absent'
                            }
                        });
                        setRequires2FA(true);
                        setUserData(enrichedMedecin);
                        setShow2FA(true);
                        return;
                    } catch (error) {
                        console.error('❌ Erreur lors de la création de la session 2FA:', error);
                        // En cas d'erreur, continuer sans tempTokenId
                        const enrichedMedecin = {
                            ...medecinData,
                            numero_adeli: medecinData.numero_adeli || numero_adeli,
                            type: 'professionnel',
                            tempTokenId: null,
                            generatedToken: null,
                            originalJWT: response.data.token || response.data.jwt || response.data.accessToken || null,
                            originalToken: response.data.token || null
                        };
                        setRequires2FA(true);
                        setUserData(enrichedMedecin);
                        setShow2FA(true);
                        return;
                    }
                }
                
                // Connexion normale si pas de 2FA
                console.log('🔑 Token stocké:', localStorage.getItem('token'));
                console.log('👨‍⚕️ Données médecin stockées:', localStorage.getItem('medecin'));
                
                // Debug: afficher tout le localStorage
                console.log('🔍 Contenu complet du localStorage:');
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    console.log(`  - ${key}:`, localStorage.getItem(key));
                }
                
                navigate('/medecin');
                
            // ROUTE 3: Admin/Secrétaire -> /auth/login
            } else if (selectedProfile === 'professionnel') {
                console.log('🟡 Connexion ADMIN/SECRÉTAIRE via /auth/login');
                response = await login(identifiant);
                console.log('✅ Données utilisateur reçues:', response);
                
                // Vérifier si la 2FA est requise
                if (response.data?.status === 'requires2FA' || response.data?.requires2FA) {
                    console.log('🔐 2FA requise pour l\'admin/secrétaire');
                    
                    // Extraire les données utilisateur de la structure imbriquée
                    const userData = response.data.data?.user || response.data.user || response.data;
                    console.log('👤 Données utilisateur extraites:', userData);
                    
                    try {
                        // 🔐 CRÉER UNE SESSION 2FA POUR RÉCUPÉRER LE TEMPTOKENID
                        console.log('🔐 Création de session 2FA pour récupérer tempTokenId...');
                        const twoFAResponse = await create2FASession({
                            userType: 'professionnel',
                            identifier: userData.email || email
                        });
                        
                        console.log('🔐 Réponse create2FASession:', twoFAResponse);
                        
                        // Extraire le tempTokenId de la réponse
                        const tempTokenId = twoFAResponse.data?.tempTokenId ||
                            twoFAResponse.tempTokenId ||
                            twoFAResponse.data?.sessionId ||
                            twoFAResponse.sessionId;
                        
                        console.log('🔐 tempTokenId extrait:', tempTokenId);
                        
                        // Enrichir les données pour la 2FA (userType/identifier)
                        const enrichedUser = {
                            ...userData,
                            email: userData.email || email,
                            type: 'professionnel',
                            // 🔐 TEMPTOKENID RÉCUPÉRÉ DE LA SESSION 2FA
                            tempTokenId: tempTokenId,
                            generatedToken: tempTokenId, // Utiliser tempTokenId comme fallback
                            // 🔑 CONSERVER LES TOKENS DE LA PREMIÈRE AUTHENTIFICATION
                            originalJWT: response.data.token || response.data.jwt || response.data.accessToken || null,
                            originalToken: response.data.token || null
                        };
                        
                        console.log('🔐 DEBUG - Utilisateur enrichi avec tokens originaux:', {
                            tempTokenId: enrichedUser.tempTokenId,
                            generatedToken: enrichedUser.generatedToken,
                            originalJWT: enrichedUser.originalJWT,
                            originalToken: enrichedUser.originalToken
                        });
                        setRequires2FA(true);
                        setUserData(enrichedUser);
                        setShow2FA(true);
                        return;
                    } catch (error) {
                        console.error('❌ Erreur lors de la création de la session 2FA:', error);
                        // En cas d'erreur, continuer sans tempTokenId
                        const enrichedUser = {
                            ...userData,
                            email: userData.email || email,
                            type: 'professionnel',
                            tempTokenId: null,
                            generatedToken: null,
                            originalJWT: response.data.token || response.data.jwt || response.data.accessToken || null,
                            originalToken: response.data.token || null
                        };
                        setRequires2FA(true);
                        setUserData(enrichedUser);
                        setShow2FA(true);
                        return;
                    }
                }
                
                // Connexion normale si pas de 2FA
                switch (selectedProfessional) {
                    case 'administrateur':
                        navigate('/admin');
                        break;
                    case 'secretaire':
                        navigate('/secretariat');
                        break;
                    default:
                        navigate('/admin');
                }
            }
            
        } catch (error) {
            console.error('❌ Erreur de connexion:', error);
            setError(error.message || "Erreur de connexion");
        }
    };

    const handle2FASuccess = () => {
        console.log('✅ 2FA validée avec succès, redirection...');
        
        // ✅ SIMPLIFICATION : Les données sont déjà stockées par Setup2FA
        console.log('✅ DEBUG - Données utilisateur déjà stockées par Setup2FA');
        
        // Redirection selon le type d'utilisateur
        if (userData) {
            switch (selectedProfile) {
                case 'patient':
                    console.log('🔵 DEBUG - Redirection patient vers /dmp');
                    navigate('/dmp');
                    break;
                case 'professionnel':
                    if (selectedProfessional === 'medecin') {
                        console.log('🟢 DEBUG - Redirection médecin vers /medecin');
                        navigate('/medecin');
                    } else if (selectedProfessional === 'administrateur') {
                        console.log('🟡 DEBUG - Redirection admin vers /admin');
                        navigate('/admin');
                    } else if (selectedProfessional === 'secretaire') {
                        console.log('🟡 DEBUG - Redirection secrétaire vers /secretariat');
                        navigate('/secretariat');
                    }
                    break;
                default:
                    console.log('⚠️ DEBUG - Profil non reconnu, redirection par défaut vers /admin');
                    navigate('/admin');
            }
        } else {
            console.error('❌ DEBUG - userData est null, impossible de rediriger');
        }
    };

    const handle2FACancel = () => {
        console.log('❌ 2FA annulée par l\'utilisateur');
        setShow2FA(false);
        setRequires2FA(false);
        setUserData(null);
        // Optionnel : déconnecter l'utilisateur
        localStorage.removeItem('jwt');
        localStorage.removeItem('token');
        localStorage.removeItem('patient');
        localStorage.removeItem('medecin');
    };

    // Si la 2FA est requise, afficher le composant de configuration
    if (show2FA && requires2FA) {
        // 🔍 DÉBOGAGE - Extraire les informations 2FA de la réponse de connexion
        const tempTokenId = userData?.tempTokenId || null;
        const generatedToken = userData?.generatedToken || null;
        const isLoginFlow = !!(tempTokenId && generatedToken);
        
        console.log('🔐 DEBUG - Rendu Setup2FA avec:', {
            tempTokenId,
            generatedToken,
            isLoginFlow,
            userDataKeys: Object.keys(userData || {})
        });
        
        return (
            <Setup2FA
                onSetupComplete={handle2FASuccess}
                onCancel={handle2FACancel}
                userData={userData}
                isLoginFlow={isLoginFlow}
                tempTokenId={tempTokenId}
                generatedToken={generatedToken}
            />
        );
    }

    const renderProfileSelection = () => (
        <div className="text-center p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Je suis un(e) :</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                <button
                    type="button"
                    onClick={() => setSelectedProfile('patient')}
                    className={`relative rounded-lg border-2 p-6 flex flex-col items-center transition-all duration-200 ${selectedProfile === 'patient' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
                >
                    <FaUserInjured className="h-10 w-10 text-blue-600 mb-3" />
                    <span className="text-base font-medium text-gray-900">Patient</span>
                    <p className="mt-1 text-sm text-gray-500">Numéro de carte d'assurance</p>
                    {selectedProfile === 'patient' && (
                        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => setSelectedProfile('professionnel')}
                    className={`relative rounded-lg border-2 p-6 flex flex-col items-center transition-all duration-200 ${selectedProfile === 'professionnel' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
                >
                    <FaUserDoctor className="h-10 w-10 text-blue-600 mb-3" />
                    <span className="text-base font-medium text-gray-900">Professionnel</span>
                    <p className="mt-1 text-sm text-gray-500">Personnel de santé</p>
                    {selectedProfile === 'professionnel' && (
                        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </button>
            </div>
            
            {error && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                    <p className="text-sm">{error}</p>
                </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                    Vous n'avez pas de compte ?{' '}
                    <a href="/fiche-inscription" className="font-medium text-blue-600 hover:text-blue-500">
                        Je créé mon espace de santé
                    </a>
                </p>
            </div>
        </div>
    );

    const renderProfessionalSelection = () => (
        <div className="p-6">
            <button
                type="button"
                onClick={() => setSelectedProfile('')}
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
            >
                <FaArrowLeft className="mr-2" /> Retour au choix du profil
            </button>
            
            <h3 className="text-lg font-medium text-gray-900 text-center mb-6">
                Type de professionnel :
            </h3>
            
            <div className="grid grid-cols-1 gap-3 mb-6">
                <button
                    type="button"
                    onClick={() => setSelectedProfessional('medecin')}
                    className={`relative rounded-lg border-2 p-4 flex items-center transition-all duration-200 ${selectedProfessional === 'medecin' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
                >
                    <FaUserDoctor className="h-8 w-8 text-blue-600 mr-4" />
                    <div className="flex-1 text-left">
                        <span className="text-base font-medium text-gray-900">Médecin</span>
                        <p className="text-sm text-gray-500">Numéro d'inscription à l'Ordre</p>
                    </div>
                    {selectedProfessional === 'medecin' && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </button>
                
                <button
                    type="button"
                    onClick={() => setSelectedProfessional('administrateur')}
                    className={`relative rounded-lg border-2 p-4 flex items-center transition-all duration-200 ${selectedProfessional === 'administrateur' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
                >
                    <FaUserTie className="h-8 w-8 text-blue-600 mr-4" />
                    <div className="flex-1 text-left">
                        <span className="text-base font-medium text-gray-900">Administrateur</span>
                        <p className="text-sm text-gray-500">Email professionnel</p>
                    </div>
                    {selectedProfessional === 'administrateur' && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </button>
                
                <button
                    type="button"
                    onClick={() => setSelectedProfessional('secretaire')}
                    className={`relative rounded-lg border-2 p-4 flex items-center transition-all duration-200 ${selectedProfessional === 'secretaire' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
                >
                    <FaUserGear className="h-8 w-8 text-blue-600 mr-4" />
                    <div className="flex-1 text-left">
                        <span className="text-base font-medium text-gray-900">Secrétaire</span>
                        <p className="text-sm text-gray-500">Email professionnel</p>
                    </div>
                    {selectedProfessional === 'secretaire' && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </button>
            </div>
            
            {error && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                    <p className="text-sm">{error}</p>
                </div>
            )}
        </div>
    );

    const renderLoginForm = () => {
        const isPatient = selectedProfile === 'patient';
        const isMedecin = selectedProfessional === 'medecin';
        const isEmailAuth = selectedProfessional === 'administrateur' || selectedProfessional === 'secretaire';
        
        let titleText = 'Connexion ';
        if (isPatient) {
            titleText += 'Patient';
        } else {
            titleText += selectedProfessional.charAt(0).toUpperCase() + selectedProfessional.slice(1);
        }

        return (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <button
                    type="button"
                    onClick={() => {
                        if (selectedProfile === 'professionnel' && selectedProfessional) {
                            setSelectedProfessional('');
                        } else {
                            setSelectedProfile('');
                        }
                    }}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
                >
                    <FaArrowLeft className="mr-2" /> 
                    {selectedProfile === 'professionnel' && selectedProfessional ? 'Retour au choix du professionnel' : 'Retour au choix du profil'}
                </button>
                
                <h3 className="text-lg font-medium text-gray-900 text-center">
                    {titleText}
                </h3>
                
                <div>
                    <label htmlFor="identifiant" className="block text-sm font-medium text-gray-700">
                        {isPatient ? 'Numéro de carte d\'assurance' : 
                        isMedecin ? 'Numéro d\'inscription à l\'Ordre des Médecins' : 
                        'Email professionnel'}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {isMedecin ? <FaIdCard className="h-4 w-4 text-gray-400" /> : <FaUser className="h-4 w-4 text-gray-400" />}
                        </div>
                        <input
                            id="identifiant"
                            type={isEmailAuth ? 'email' : 'text'}
                            value={isPatient ? numero_assure : isMedecin ? numero_adeli : email}
                            onChange={(e) => {
                                if (isPatient) {
                                    setNumeroAssure(e.target.value);
                                } else if (isMedecin) {
                                    setNumeroAdeli(e.target.value);
                                } else {
                                    setEmail(e.target.value);
                                }
                            }}
                            required
                            className="block w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm transition-all duration-200"
                            placeholder={
                                isPatient ? 'Votre numéro de carte' : 
                                isMedecin ? 'Ex: SN-12345' : 
                                'votre@email.santesenegal.sn'
                            }
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="mot_de_passe" className="block text-sm font-medium text-gray-700">
                        Mot de passe
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaLock className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            id="mot_de_passe"
                            type="password"
                            value={mot_de_passe}
                            onChange={(e) => setMotDePasse(e.target.value)}
                            required
                            className="block w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm transition-all duration-200"
                            placeholder="Votre mot de passe"
                        />
                    </div>
                    {selectedProfile === 'professionnel' && (
                        <div className="mt-1 text-right">
                            <a href="/mot-de-passe-oublie" className="text-xs text-blue-600 hover:text-blue-500">
                                Mot de passe oublié ?
                            </a>
                        </div>
                    )}
                </div>

                <div>
                    <button 
                        type="submit" 
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md"
                    >
                        Se connecter
                    </button>
                </div>
                
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                        <p className="text-sm">{error}</p>
                    </div>
                )}
            </form>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 bg-gray-50">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    {/* En-tête */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center">
                        <img 
                            src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/50c12644-747a-4de2-b038-72ea475da28c.png" 
                            alt="Logo Santé Sénégal" 
                            className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white p-1"
                        />
                        <h1 className="mt-4 text-xl sm:text-2xl font-bold text-white">Santé Sénégal</h1>
                        <p className="mt-1 text-blue-100 text-sm">
                            {!selectedProfile ? 'Sélectionnez votre profil' : 
                             selectedProfile === 'professionnel' && !selectedProfessional ? 'Choisissez votre fonction' :
                             'Connectez-vous à votre compte'}
                        </p>
                    </div>
                    
                    {/* Contenu */}
                    <div className="bg-white">
                        {error && !selectedProfile && (
                            <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        
                        {!selectedProfile ? renderProfileSelection() : 
                         selectedProfile === 'professionnel' && !selectedProfessional ? renderProfessionalSelection() :
                         renderLoginForm()}
                    </div>
                </div>
                
                {/* Lien d'aide */}
                <div className="mt-6 text-center">
                    <a href="/aide" className="text-sm text-gray-600 hover:text-blue-600">
                        Besoin d'aide pour vous connecter ?
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Connexion;