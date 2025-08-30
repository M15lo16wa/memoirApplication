import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllConsultations, getAllDossiersMedical } from '../services/api/medicalApi';
import { getPatients } from '../services/api/patientApi';
import { createRendezVous, getAllRendezVous, getRendezVousByMedecin } from '../services/api/rendezVous';

function Agenda() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Charger les données réelles de l'API
  const loadRealData = useCallback(async () => {
    try {
      console.log('🔄 [loadRealData] Début du chargement des données...');
      setLoading(true);

      // Charger les patients
      console.log('👥 [loadRealData] Chargement des patients...');
      const patientsData = await getPatients();
      console.log('📊 [loadRealData] Réponse patients:', patientsData);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      console.log(`✅ [loadRealData] Patients chargés: ${patients.length}`);

      // Charger les consultations
      console.log('🏥 [loadRealData] Chargement des consultations...');
      const consultationsData = await getAllConsultations();
      console.log('📊 [loadRealData] Réponse consultations:', consultationsData);
      setConsultations(Array.isArray(consultationsData) ? consultationsData : []);

      // Charger les dossiers médicaux
      console.log('📁 [loadRealData] Chargement des dossiers médicaux...');
      const dossiersData = await getAllDossiersMedical();
      console.log('📊 [loadRealData] Réponse dossiers:', dossiersData);
      setDossiers(Array.isArray(dossiersData) ? dossiersData : []);

      console.log('✅ [loadRealData] Données réelles chargées:', {
        patients: patients.length,
        consultations: consultations.length,
        dossiers: dossiers.length
      });

    } catch (error) {
      console.error('❌ [loadRealData] Erreur lors du chargement des données réelles:', error);
      console.error('❌ [loadRealData] Détails:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
    } finally {
      setLoading(false);
      console.log('🔄 [loadRealData] Chargement terminé, loading = false');
    }
  }, []);

  // Créer un rappel pour le patient dans le DMP
  const createPatientReminder = useCallback(async (appointmentData) => {
    try {
      console.log('🔔 Création du rappel pour le patient:', appointmentData);
      
      // Récupérer les informations du patient
      const patient = patients.find(p => (p.id || p.id_patient) === appointmentData.patientId);
      if (!patient) {
        console.warn('⚠️ Patient non trouvé pour la création du rappel');
        return;
      }

      // Créer l'objet rappel
      const reminder = {
        id: `rappel_rdv_${Date.now()}`,
        titre: `Rendez-vous médical - ${appointmentData.type}`,
        description: `Vous avez un rendez-vous le ${new Date(appointmentData.startTime).toLocaleDateString('fr-FR')} à ${new Date(appointmentData.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        date_rappel: new Date(appointmentData.startTime).toISOString(),
        date_creation: new Date().toISOString(),
        priorite: appointmentData.type === 'urgence' ? 'haute' : 'moyenne',
        type: 'rendez-vous',
        statut: 'actif',
        patient_id: appointmentData.patientId,
        rendez_vous_id: appointmentData.id,
        notes: appointmentData.notes,
        // Données pour l'affichage dans le DMP
        heure_debut: new Date(appointmentData.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        heure_fin: new Date(appointmentData.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        duree: Math.round((new Date(appointmentData.endTime) - new Date(appointmentData.startTime)) / (1000 * 60)), // durée en minutes
        medecin: 'Dr. Médecin', // À remplacer par le vrai nom du médecin connecté
        lieu: 'Cabinet médical', // À remplacer par le vrai lieu
        instructions: [
          'Arrivez 10 minutes avant l\'heure du rendez-vous',
          'Apportez vos documents médicaux récents',
          'Venez à jeun si nécessaire pour des analyses',
          'Préparez vos questions pour le médecin'
        ]
      };

      // Simuler l'envoi du rappel au patient via l'API
      // En production, vous appelleriez ici l'API pour créer le rappel
      console.log('✅ Rappel créé pour le patient:', reminder);
      
      // Stocker le rappel dans le localStorage du patient (simulation)
      const patientRemindersKey = `patient_reminders_${appointmentData.patientId}`;
      const existingReminders = JSON.parse(localStorage.getItem(patientRemindersKey) || '[]');
      existingReminders.push(reminder);
      localStorage.setItem(patientRemindersKey, JSON.stringify(existingReminders));
      
      // Afficher la notification de succès
      setNotificationMessage(`Rendez-vous créé et rappel envoyé à ${patient.nom} ${patient.prenom}`);
      setShowNotification(true);
      
      // Masquer la notification après 5 secondes
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);

      return reminder;
      
    } catch (error) {
      console.error('❌ Erreur lors de la création du rappel:', error);
      throw error;
    }
  }, [patients]);

    // Fonction pour récupérer l'ID du médecin connecté
  const getMedecinConnecteId = () => {
    // Essayer de récupérer depuis le localStorage
    const storedMedecin = localStorage.getItem('medecinConnecte');
    if (storedMedecin) {
      try {
        const medecinData = JSON.parse(storedMedecin);
        return medecinData.id_professionnel || medecinData.id || 79;
      } catch (e) {
        console.warn('⚠️ Erreur parsing médecin connecté:', e);
      }
    }
    
    // Fallback : ID codé en dur (à remplacer par le vrai système d'auth)
    return 79;
  };

    // Charger les vrais rendez-vous depuis l'API via le service
  const loadRealAppointments = useCallback(async () => {
    try {
      console.log('🚀 [loadRealAppointments] Début du chargement des rendez-vous...');
      console.log('🔍 [loadRealAppointments] Médecin connecté ID:', getMedecinConnecteId());
      
      // Utiliser le service getRendezVousByMedecin pour récupérer directement les RDV du médecin
      const medecinConnecteId = getMedecinConnecteId();
      console.log('📡 [loadRealAppointments] Appel du service getRendezVousByMedecin pour le médecin ID:', medecinConnecteId);
      const allRendezVousResponse = await getRendezVousByMedecin(medecinConnecteId);
      
      console.log('📡 [loadRealAppointments] Réponse complète du service:', allRendezVousResponse);
      console.log('📊 [loadRealAppointments] Type de la réponse:', typeof allRendezVousResponse);
      console.log('📊 [loadRealAppointments] Clés de la réponse:', Object.keys(allRendezVousResponse || {}));
      
      // ✅ CORRECTION : Traiter toutes les structures de réponse possibles
      let rendezVousList = [];
      
      // Structure 1: Réponse directe (array)
      if (Array.isArray(allRendezVousResponse)) {
        rendezVousList = allRendezVousResponse;
        console.log('📋 [loadRealAppointments] Structure 1 détectée: réponse directe (array)');
      }
      // Structure 2: { data: [...] }
      else if (allRendezVousResponse && allRendezVousResponse.data && Array.isArray(allRendezVousResponse.data)) {
        rendezVousList = allRendezVousResponse.data;
        console.log('📋 [loadRealAppointments] Structure 2 détectée: data direct (array)');
      }
      // Structure 3: { data: { rendezVous: [...] } }
      else if (allRendezVousResponse && allRendezVousResponse.data && allRendezVousResponse.data.rendezVous && Array.isArray(allRendezVousResponse.data.rendezVous)) {
        rendezVousList = allRendezVousResponse.data.rendezVous;
        console.log('📋 [loadRealAppointments] Structure 3 détectée: data.rendezVous');
      }
      // Structure 4: { rendezVous: [...] }
      else if (allRendezVousResponse && allRendezVousResponse.rendezVous && Array.isArray(allRendezVousResponse.rendezVous)) {
        rendezVousList = allRendezVousResponse.rendezVous;
        console.log('📋 [loadRealAppointments] Structure 4 détectée: rendezVous direct');
      }
      // Structure 5: { results: X, data: [...] }
      else if (allRendezVousResponse && allRendezVousResponse.results && allRendezVousResponse.data && Array.isArray(allRendezVousResponse.data)) {
        rendezVousList = allRendezVousResponse.data;
        console.log('📋 [loadRealAppointments] Structure 5 détectée: results + data');
      }
      // Structure 6: { success: true, data: [...] }
      else if (allRendezVousResponse && allRendezVousResponse.success && allRendezVousResponse.data && Array.isArray(allRendezVousResponse.data)) {
        rendezVousList = allRendezVousResponse.data;
        console.log('📋 [loadRealAppointments] Structure 6 détectée: success + data');
      }
      else {
        console.warn('⚠️ [loadRealAppointments] Structure de données non reconnue, tentative de fallback...');
        console.log('🔍 [loadRealAppointments] Contenu complet de la réponse:', JSON.stringify(allRendezVousResponse, null, 2));
        
        // Fallback: essayer de trouver un tableau dans la réponse
        const findArrayInObject = (obj) => {
          for (const key in obj) {
            if (Array.isArray(obj[key])) {
              return obj[key];
            }
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              const found = findArrayInObject(obj[key]);
              if (found) return found;
            }
          }
          return null;
        };
        
        const fallbackArray = findArrayInObject(allRendezVousResponse);
        if (fallbackArray) {
          rendezVousList = fallbackArray;
          console.log('🔄 [loadRealAppointments] Fallback: tableau trouvé dans la réponse:', fallbackArray);
        }
      }
      
      console.log('📋 [loadRealAppointments] Liste des rendez-vous extraite:', rendezVousList);
      console.log('📊 [loadRealAppointments] Nombre de rendez-vous extraits:', rendezVousList.length);
      
      if (!rendezVousList || rendezVousList.length === 0) {
        console.warn('⚠️ [loadRealAppointments] Aucun rendez-vous trouvé dans la réponse');
        console.log('💾 [loadRealAppointments] Mise à jour du state avec tableau vide');
        setAppointments([]);
        return 0;
      }
      
      // L'API retourne déjà les RDV du bon médecin, pas besoin de filtrer
      const medecinRendezVous = rendezVousList;
      console.log('👨‍⚕️ [loadRealAppointments] Rendez-vous du médecin connecté (déjà filtrés par l\'API):', medecinRendezVous);
      console.log('📊 [loadRealAppointments] Nombre de RDV reçus:', medecinRendezVous.length);
      
      if (medecinRendezVous.length === 0) {
        console.warn('⚠️ [loadRealAppointments] Aucun rendez-vous trouvé pour ce médecin');
      }
      
      console.log('🔄 [loadRealAppointments] Début de la conversion des données...');
      
      // Convertir au format de l'agenda avec la nouvelle structure API
      const realAppointments = medecinRendezVous.map((rdv, index) => {
        console.log(`🔄 [loadRealAppointments] Conversion RDV ${index + 1}/${medecinRendezVous.length}:`, rdv);
        
        // Gérer les différents formats de date/heure
        let startTime, endTime;
        
        if (rdv.DateHeure) {
          // Nouvelle structure : DateHeure unique
          startTime = new Date(rdv.DateHeure);
          endTime = new Date(rdv.DateHeure);
          if (rdv.duree) {
            endTime.setMinutes(endTime.getMinutes() + rdv.duree);
          } else {
            endTime.setMinutes(endTime.getMinutes() + 30); // Durée par défaut
          }
          console.log(`📅 [loadRealAppointments] RDV ${index + 1}: DateHeure détecté, startTime=${startTime}, endTime=${endTime}`);
        } else if (rdv.date && rdv.heure) {
          // Ancienne structure : date + heure séparées
          startTime = new Date(`${rdv.date}T${rdv.heure}`);
          endTime = new Date(`${rdv.date}T${rdv.heure}`);
          if (rdv.duree) {
            endTime.setMinutes(endTime.getMinutes() + rdv.duree);
          } else {
            endTime.setMinutes(endTime.getMinutes() + 30);
          }
          console.log(`📅 [loadRealAppointments] RDV ${index + 1}: date+heure détectés, startTime=${startTime}, endTime=${endTime}`);
        } else {
          // Fallback : utiliser la date de création
          startTime = new Date(rdv.createdAt);
          endTime = new Date(rdv.createdAt);
          endTime.setMinutes(endTime.getMinutes() + 30);
          console.log(`📅 [loadRealAppointments] RDV ${index + 1}: fallback createdAt, startTime=${startTime}, endTime=${endTime}`);
        }
        
        const appointment = {
          id: rdv.id || rdv.id_rendezvous || `rdv_${Date.now()}`,
          title: `${rdv.type_rdv || rdv.motif_consultation || 'Consultation'} ${rdv.nom || 'Patient'} ${rdv.prenom || ''}`,
          patient: `${rdv.nom || 'Nom'} ${rdv.prenom || 'Prénom'}`,
          patientId: rdv.patient_id || rdv.id_patient,
          startTime: startTime,
          endTime: endTime,
          type: rdv.type_rdv || 'consultation',
          color: getAppointmentColor(rdv.type_rdv || 'consultation'),
          status: (rdv.statut || 'programme') === 'confirme' ? 'confirmed' : 'pending',
          notes: rdv.notes || rdv.motif_consultation || rdv.motif || '',
          duration: rdv.duree || 30,
          // Données de l'API
          apiId: rdv.id || rdv.id_rendezvous,
          createdAt: rdv.createdAt,
          lieu: rdv.lieu || 'Cabinet médical'
        };
        
        console.log(`📋 [loadRealAppointments] RDV ${index + 1} converti:`, appointment);
        return appointment;
      });
      
      console.log('✅ [loadRealAppointments] Rendez-vous réels convertis:', realAppointments);
      console.log('💾 [loadRealAppointments] Mise à jour du state appointments...');
      setAppointments(realAppointments);
      
      // Log pour déboguer l'affichage
      console.log('🎯 [loadRealAppointments] État des rendez-vous après mise à jour:', {
        count: realAppointments.length,
        appointments: realAppointments,
        stateUpdated: true
      });
      
      // Retourner le nombre de rendez-vous pour confirmation
      console.log(`✅ [loadRealAppointments] Fonction terminée avec succès, retour de ${realAppointments.length} rendez-vous`);
      return realAppointments.length;
      
    } catch (error) {
      console.error('❌ [loadRealAppointments] Erreur lors du chargement des rendez-vous:', error);
      console.error('❌ [loadRealAppointments] Détails de l\'erreur:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      console.log('💾 [loadRealAppointments] Mise à jour du state avec tableau vide en cas d\'erreur');
      setAppointments([]);
      return 0;
    }
  }, []);

  // Charger les données et les vrais rendez-vous
  useEffect(() => {
    const initializeAgenda = async () => {
      try {
        console.log('🚀 [useEffect] Début de l\'initialisation de l\'agenda...');
        console.log('📊 [useEffect] État initial - appointments:', appointments.length, 'loading:', loading);
        
        // Charger d'abord les données de base
        console.log('🔄 [useEffect] Étape 1: Chargement des données de base...');
        await loadRealData();
        console.log('✅ [useEffect] Données de base chargées avec succès');
        
        // Puis charger les rendez-vous
        console.log('🔄 [useEffect] Étape 2: Chargement des rendez-vous...');
        const count = await loadRealAppointments();
        console.log(`✅ [useEffect] Agenda initialisé avec ${count} rendez-vous`);
        console.log('📊 [useEffect] État final - appointments:', appointments.length, 'loading:', loading);
        
      } catch (error) {
        console.error('❌ [useEffect] Erreur lors de l\'initialisation de l\'agenda:', error);
        console.error('❌ [useEffect] Détails:', {
          message: error.message,
          stack: error.stack
        });
      }
    };
    
    console.log('🔄 [useEffect] Déclenchement de l\'initialisation...');
    initializeAgenda();
  }, [loadRealData, loadRealAppointments]); // Ajouter les dépendances

  // Effect pour ajuster la date du calendrier quand les rendez-vous sont chargés
  useEffect(() => {
    if (appointments.length > 0) {
      const firstAppointmentDate = new Date(appointments[0].startTime);
      // Vérifier si la date actuelle du calendrier inclut déjà ce rendez-vous
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const appointmentMonth = firstAppointmentDate.getMonth();
      const appointmentYear = firstAppointmentDate.getFullYear();
      
      // Si le calendrier n'affiche pas le bon mois/année, l'ajuster
      if (currentMonth !== appointmentMonth || currentYear !== appointmentYear) {
        setCurrentDate(firstAppointmentDate);
        setSelectedDate(firstAppointmentDate);
        console.log(`📅 [useEffect - appointments] Date de l'agenda ajustée au premier RDV: ${firstAppointmentDate.toLocaleDateString('fr-FR')}`);
        console.log(`📅 [useEffect - appointments] Ancienne date: ${currentDate.toLocaleDateString('fr-FR')} → Nouvelle date: ${firstAppointmentDate.toLocaleDateString('fr-FR')}`);
      } else {
        console.log(`📅 [useEffect - appointments] Le calendrier affiche déjà la bonne période (${firstAppointmentDate.toLocaleDateString('fr-FR')})`);
      }
    }
  }, [appointments, currentDate]);

  // Navigation dans le calendrier
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Générer les jours de la semaine
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Générer les créneaux horaires
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // Obtenir les rendez-vous pour une date et heure données
  const getAppointmentsForSlot = (date, time) => {
    const slotAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      const slotDate = new Date(date);
      const slotHour = parseInt(time.split(':')[0]);
      
      const matchesDate = appointmentDate.toDateString() === slotDate.toDateString();
      const matchesHour = appointmentDate.getHours() === slotHour;
      
      if (matchesDate && matchesHour) {
        console.log(`🔍 [getAppointmentsForSlot] RDV trouvé pour ${slotDate.toDateString()} à ${slotHour}:00:`, appointment);
      }
      
      return matchesDate && matchesHour;
    });
    
    console.log(`🔍 [getAppointmentsForSlot] ${slotAppointments.length} RDV trouvés pour ${date.toDateString()} à ${time}`);
    return slotAppointments;
  };

  // Formater l'heure
  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Obtenir la couleur selon le type de rendez-vous
  const getAppointmentColor = (type) => {
    const colors = {
      consultation: 'bg-blue-500',
      suivi: 'bg-green-500',
      examen: 'bg-purple-500',
      vaccination: 'bg-yellow-500',
      urgence: 'bg-red-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  // Obtenir le statut du rendez-vous
  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { text: 'Confirmé', color: 'bg-green-100 text-green-800' },
      pending: { text: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      cancelled: { text: 'Annulé', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Fonction pour créer un nouveau rendez-vous (API réelle)
  const handleCreateAppointment = async (appointmentData) => {
    try {
      console.log('🚀 [handleCreateAppointment] Début de la création du rendez-vous...');
      console.log('📊 [handleCreateAppointment] Données reçues:', appointmentData);
      console.log('👨‍⚕️ [handleCreateAppointment] ID médecin connecté:', getMedecinConnecteId());
      
      // Préparer les données pour l'API
      const rendezVousData = {
        patient_id: appointmentData.patientId,
        medecin_id: getMedecinConnecteId(), // ID du médecin connecté (dynamique)
        // Utiliser le nouveau format DateHeure
        DateHeure: new Date(appointmentData.startTime).toISOString(),
        motif_consultation: appointmentData.notes || 'Consultation médicale',
        type_rdv: appointmentData.type || 'consultation',
        statut: 'confirme',
        notes: appointmentData.notes || '',
        // Données supplémentaires
        duree: Math.round((new Date(appointmentData.endTime) - new Date(appointmentData.startTime)) / (1000 * 60)), // durée en minutes
        lieu: 'Cabinet médical' // À personnaliser selon le contexte
      };
      
      console.log('📋 [handleCreateAppointment] Données formatées pour l\'API:', rendezVousData);
      console.log('📅 [handleCreateAppointment] DateHeure formatée:', rendezVousData.DateHeure);
      console.log('⏱️ [handleCreateAppointment] Durée calculée:', rendezVousData.duree, 'minutes');
      
      // Appeler l'API réelle pour créer le rendez-vous
      console.log('📡 [handleCreateAppointment] Appel de l\'API createRendezVous...');
      const apiResponse = await createRendezVous(rendezVousData);
      console.log('📡 [handleCreateAppointment] Réponse de l\'API:', apiResponse);
      
      if (apiResponse.success) {
        console.log('✅ [handleCreateAppointment] Rendez-vous créé via API avec succès');
        console.log('📊 [handleCreateAppointment] Données retournées par l\'API:', apiResponse.data);
        
        // Créer l'objet local avec l'ID retourné par l'API
        const newAppointment = {
          id: apiResponse.data.id || `rdv_${Date.now()}`,
          title: `${appointmentData.type || 'Consultation'} ${appointmentData.patientName || 'Patient'}`,
          patient: appointmentData.patientName || 'Patient',
          patientId: appointmentData.patientId,
          startTime: new Date(appointmentData.startTime),
          endTime: new Date(appointmentData.endTime),
          type: appointmentData.type || 'consultation',
          color: getAppointmentColor(appointmentData.type || 'consultation'),
          status: 'confirmed',
          notes: appointmentData.notes || '',
          duration: Math.round((new Date(appointmentData.endTime) - new Date(appointmentData.startTime)) / (1000 * 60)),
          // Données de l'API
          apiId: apiResponse.data.id,
          createdAt: apiResponse.data.createdAt || new Date().toISOString()
        };
        
        console.log('📋 [handleCreateAppointment] Nouveau rendez-vous formaté:', newAppointment);
        console.log('📊 [handleCreateAppointments] État actuel des appointments:', appointments.length);
        
        // Ajouter à la liste locale
        console.log('💾 [handleCreateAppointment] Mise à jour du state appointments...');
        setAppointments(prev => {
          const updated = [...prev, newAppointment].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
          console.log('📊 [handleCreateAppointment] Nouveaux appointments après ajout:', updated.length);
          console.log('📋 [handleCreateAppointment] Détail du nouveau RDV ajouté:', newAppointment);
          return updated;
        });
        
        // Créer le rappel pour le patient
        console.log('🔔 [handleCreateAppointment] Création du rappel patient...');
        await createPatientReminder(newAppointment);
        
        console.log('✅ [handleCreateAppointment] Rendez-vous créé avec succès et sauvegardé en base');
        setShowAddModal(false);
        
        // Recharger les rendez-vous depuis l'API pour afficher le nouveau
        console.log('🔄 [handleCreateAppointment] Rechargement de l\'agenda après création...');
        const reloadCount = await loadRealAppointments();
        console.log(`✅ [handleCreateAppointment] Rechargement terminé: ${reloadCount} rendez-vous`);
        
        // Afficher la notification de succès
        setNotificationMessage(`Rendez-vous créé et sauvegardé pour ${appointmentData.patientName || 'le patient'}`);
        setShowNotification(true);
        
        // Masquer la notification après 5 secondes
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        
      } else {
        console.error('❌ [handleCreateAppointment] Erreur de l\'API:', apiResponse);
        throw new Error(apiResponse.message || 'Erreur lors de la création du rendez-vous');
      }
      
    } catch (error) {
      console.error('❌ [handleCreateAppointment] Erreur lors de la création du rendez-vous:', error);
      console.error('❌ [handleCreateAppointment] Détails de l\'erreur:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      alert(`Erreur lors de la création du rendez-vous: ${error.message}`);
    }
  };

  // Rendu de la vue jour
  const renderDayView = () => {
    const timeSlots = getTimeSlots();
    console.log('📅 [renderDayView] Rendu de la vue jour pour:', selectedDate.toLocaleDateString('fr-FR'));
    console.log('📊 [renderDayView] Nombre total d\'appointments:', appointments.length);
    console.log('📋 [renderDayView] Détail des appointments:', appointments);
    
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedDate.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        <div className="overflow-y-auto max-h-96">
          {timeSlots.map(time => {
            const slotAppointments = getAppointmentsForSlot(selectedDate, time);
            return (
              <div key={time} className="flex border-b border-gray-100">
                <div className="w-20 p-3 text-sm font-medium text-gray-500 bg-gray-50">
                  {time}
                </div>
                <div className="flex-1 p-3 min-h-[60px]">
                  {slotAppointments.map(appointment => (
                    <div
                      key={appointment.id}
                      className={`${appointment.color} text-white p-2 rounded mb-2 text-sm`}
                    >
                      <div className="font-medium">{appointment.title}</div>
                      <div className="text-xs opacity-90">
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </div>
                      <div className="text-xs opacity-90">{appointment.patient}</div>
                      <div className="text-xs opacity-90 mt-1">{appointment.notes}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Rendu de la vue semaine
  const renderWeekView = () => {
    const weekDays = getWeekDays();
    const timeSlots = getTimeSlots();

    return (
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="min-w-[800px]">
          {/* En-tête des jours */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-3 bg-gray-50"></div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="p-3 text-center bg-gray-50 border-l">
                <div className="text-sm font-medium text-gray-900">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className="text-xs text-gray-500">
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Créneaux horaires */}
          {timeSlots.map(time => (
            <div key={time} className="grid grid-cols-8 border-b border-gray-100">
              <div className="p-3 text-sm font-medium text-gray-500 bg-gray-50">
                {time}
              </div>
              {weekDays.map(day => {
                const slotAppointments = getAppointmentsForSlot(day, time);
                return (
                  <div key={day.toISOString()} className="p-1 border-l min-h-[60px]">
                    {slotAppointments.map(appointment => (
                      <div
                        key={appointment.id}
                        className={`${appointment.color} text-white p-2 rounded mb-1 text-xs`}
                      >
                        <div className="font-medium truncate">{appointment.title}</div>
                        <div className="opacity-90 truncate">{appointment.patient}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Rendu de la vue mois
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className="p-3 text-center bg-gray-50 text-sm font-medium text-gray-900">
              {day}
            </div>
          ))}
          
          {days.map(day => {
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === new Date().toDateString();
            const dayAppointments = appointments.filter(appointment => {
              const appointmentDate = new Date(appointment.startTime);
              return appointmentDate.toDateString() === day.toDateString();
            });

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 bg-white ${
                  !isCurrentMonth ? 'text-gray-300' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-blue-600' : ''
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map(appointment => (
                    <div
                      key={appointment.id}
                      className={`${appointment.color} text-white p-1 rounded text-xs truncate`}
                    >
                      {appointment.title}
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayAppointments.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agenda Médical</h1>
              <p className="text-gray-600">Gérez vos rendez-vous et consultations</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouveau RDV
              </button>
              <button
                onClick={async () => {
                  console.log('🔄 [Bouton Rafraîchir] Début du rafraîchissement manuel...');
                  console.log('📊 [Bouton Rafraîchir] État avant rafraîchissement - appointments:', appointments.length);
                  const count = await loadRealAppointments();
                  console.log(`✅ [Bouton Rafraîchir] Agenda rafraîchi: ${count} rendez-vous chargés`);
                  console.log('📊 [Bouton Rafraîchir] État après rafraîchissement - appointments:', appointments.length);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                title="Rafraîchir l'agenda"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Rafraîchir
              </button>
              
              <button
                onClick={() => navigate('/medecin')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Retour au Tableau de Bord
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification de succès */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}

      {/* Contrôles de navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            {/* Boutons de navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevious}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
              >
                Aujourd'hui
              </button>
              
              <button
                onClick={goToNext}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Sélecteur de vue */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
              {[
                { key: 'day', label: 'Jour' },
                { key: 'week', label: 'Semaine' },
                { key: 'month', label: 'Mois' }
              ].map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setViewMode(mode.key)}
                  className={`px-3 py-1 text-sm font-medium rounded ${
                    viewMode === mode.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Date actuelle */}
            <div className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('fr-FR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
          </div>
        </div>

         {/* Contenu du calendrier */}
         <div className="space-y-6">


           
           {/* Rendez-vous du jour */}
           <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Rendez-vous du {selectedDate.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            <div className="bg-white rounded-lg shadow p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Chargement des rendez-vous...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">Aucun rendez-vous chargé</p>
                  <p className="text-sm text-gray-400 mt-1">Vérifiez la console pour plus de détails</p>
                   <button 
                     onClick={async () => {
                       console.log('🔄 [Bouton Recharger] Début du rechargement manuel...');
                       console.log('📊 [Bouton Recharger] État avant rechargement - appointments:', appointments.length, 'loading:', loading);
                       setLoading(true);
                       console.log('🔄 [Bouton Recharger] Loading mis à true');
                       const count = await loadRealAppointments();
                       console.log(`✅ [Bouton Recharger] Rechargement terminé: ${count} rendez-vous`);
                       setLoading(false);
                       console.log('🔄 [Bouton Recharger] Loading mis à false');
                       console.log('📊 [Bouton Recharger] État après rechargement - appointments:', appointments.length, 'loading:', loading);
                     }}
                     className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                   >
                     Recharger
                   </button>
                </div>
              ) : appointments.filter(appointment => {
                const appointmentDate = new Date(appointment.startTime);
                return appointmentDate.toDateString() === selectedDate.toDateString();
              }).length > 0 ? (
                <div className="space-y-3">
                  {appointments
                    .filter(appointment => {
                      const appointmentDate = new Date(appointment.startTime);
                      return appointmentDate.toDateString() === selectedDate.toDateString();
                    })
                    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                    .map(appointment => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 ${appointment.color} rounded-full`}></div>
                          <div>
                            <h3 className="font-medium text-gray-900">{appointment.title}</h3>
                            <p className="text-sm text-gray-600">{appointment.patient}</p>
                            <p className="text-xs text-gray-500">{appointment.notes}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                            </p>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <button 
                            onClick={() => navigate(`/dmp-patient-view/${appointment.patientId}`)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Voir le dossier patient"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">Aucun rendez-vous aujourd'hui</p>
                </div>
              )}
            </div>
          </div>

          {/* Calendrier principal */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Calendrier
            </h2>
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}
          </div>
        </div>
      </div>

      {/* Modal d'ajout de rendez-vous */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Nouveau rendez-vous
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              
              // Récupérer l'ID du patient sélectionné
              const patientId = formData.get('patientId');
              
              // Trouver le nom du patient sélectionné
              const selectedPatient = patients.find(p => (p.id || p.id_patient) == patientId);
              const patientName = selectedPatient ? `${selectedPatient.nom} ${selectedPatient.prenom}` : 'Patient';
              
              console.log('📋 [Formulaire] Patient sélectionné:', { patientId, patientName, selectedPatient });
              
              const appointmentData = {
                patientId: patientId,
                patientName: patientName, // Ajouter le nom du patient
                startTime: formData.get('startTime'),
                endTime: formData.get('endTime'),
                type: formData.get('type'),
                notes: formData.get('notes')
              };
              
              console.log('📋 [Formulaire] Données du rendez-vous préparées:', appointmentData);
              handleCreateAppointment(appointmentData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient
                  </label>
                  <select name="patientId" required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Sélectionner un patient</option>
                    {patients.map(patient => (
                      <option key={patient.id || patient.id_patient} value={patient.id || patient.id_patient}>
                        {patient.nom} {patient.prenom}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date et heure de début
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date et heure de fin
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de rendez-vous
                  </label>
                  <select name="type" required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="consultation">Consultation</option>
                    <option value="suivi">Suivi</option>
                    <option value="examen">Examen</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="urgence">Urgence</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Notes sur le rendez-vous..."
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Créer le RDV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Agenda;
