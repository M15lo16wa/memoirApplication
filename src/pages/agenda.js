import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllConsultations, getAllDossiersMedical } from '../services/api/medicalApi';
import { getPatients } from '../services/api/patientApi';

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
      setLoading(true);
      console.log('🚀 Chargement des données réelles pour l\'agenda...');

      // Charger les patients
      const patientsData = await getPatients();
      setPatients(Array.isArray(patientsData) ? patientsData : []);

      // Charger les consultations
      const consultationsData = await getAllConsultations();
      setConsultations(Array.isArray(consultationsData) ? consultationsData : []);

      // Charger les dossiers médicaux
      const dossiersData = await getAllDossiersMedical();
      setDossiers(Array.isArray(dossiersData) ? dossiersData : []);

      console.log('✅ Données réelles chargées:', {
        patients: patients.length,
        consultations: consultations.length,
        dossiers: dossiers.length
      });

    } catch (error) {
      console.error('❌ Erreur lors du chargement des données réelles:', error);
    } finally {
      setLoading(false);
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

  // Générer des rendez-vous réalistes basés sur les données réelles
  const generateRealisticAppointments = useCallback(() => {
    if (patients.length === 0 || consultations.length === 0) {
      return [];
    }

    const realisticAppointments = [];
    const today = new Date();
    
    // Types de rendez-vous réalistes
    const appointmentTypes = [
      { type: 'consultation', color: 'bg-blue-500', duration: 30, title: 'Consultation' },
      { type: 'suivi', color: 'bg-green-500', duration: 20, title: 'Suivi' },
      { type: 'examen', color: 'bg-purple-500', duration: 45, title: 'Examen' },
      { type: 'vaccination', color: 'bg-yellow-500', duration: 15, title: 'Vaccination' },
      { type: 'urgence', color: 'bg-red-500', duration: 60, title: 'Urgence' }
    ];

    // Statuts réalistes
    const statuses = ['confirmed', 'pending', 'confirmed', 'confirmed', 'pending'];

    // Générer des rendez-vous pour les 7 prochains jours
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + dayOffset);
      
      // 2-4 rendez-vous par jour
      const appointmentsPerDay = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < appointmentsPerDay; i++) {
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const appointmentType = appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Heures de consultation réalistes (8h-18h)
        const hour = Math.floor(Math.random() * 10) + 8; // 8h à 17h
        const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
        
        const startTime = new Date(appointmentDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(startTime.getMinutes() + appointmentType.duration);
        
        // Créer des notes réalistes basées sur le type
        const notes = generateRealisticNotes(appointmentType.type, patient);
        
        realisticAppointments.push({
          id: `rdv_${dayOffset}_${i}_${Date.now()}`,
          title: `${appointmentType.title} ${patient?.nom || 'Patient'} ${patient?.prenom || ''}`,
          patient: `${patient?.nom || 'Nom'} ${patient?.prenom || 'Prénom'}`,
          patientId: patient?.id || patient?.id_patient,
          startTime,
          endTime,
          type: appointmentType.type,
          color: appointmentType.color,
          status,
          notes,
          duration: appointmentType.duration,
          // Données réelles liées
          consultationId: consultations.length > 0 ? consultations[Math.floor(Math.random() * consultations.length)]?.id : null,
          dossierId: dossiers.length > 0 ? dossiers[Math.floor(Math.random() * dossiers.length)]?.id : null
        });
      }
    }

    // Trier par date et heure
    realisticAppointments.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    console.log('✅ Rendez-vous réalistes générés:', realisticAppointments.length);
    return realisticAppointments;
  }, [patients, consultations, dossiers]);

  // Générer des notes réalistes
  const generateRealisticNotes = (type, patient) => {
    const notesByType = {
      consultation: [
        'Suivi tension artérielle',
        'Contrôle glycémie',
        'Bilan de santé général',
        'Suivi traitement en cours',
        'Consultation de routine'
      ],
      suivi: [
        'Contrôle poids',
        'Suivi tension',
        'Vérification traitement',
        'Bilan biologique'
      ],
      examen: [
        'Analyse sanguine',
        'Radiographie thorax',
        'Échographie abdominale',
        'Test d\'effort',
        'Bilan cardiaque'
      ],
      vaccination: [
        'Rappel vaccinal',
        'Vaccin grippe saisonnière',
        'Vaccin COVID-19',
        'Vaccin tétanos'
      ],
      urgence: [
        'Douleur thoracique',
        'Traumatisme',
        'Fièvre élevée',
        'Symptômes aigus'
      ]
    };

    const notes = notesByType[type] || ['Consultation médicale'];
    return notes[Math.floor(Math.random() * notes.length)];
  };

  // Charger les données et générer les rendez-vous
  useEffect(() => {
    const initializeAgenda = async () => {
      await loadRealData();
    };
    
    initializeAgenda();
  }, [loadRealData]);

  // Mettre à jour les rendez-vous quand les données changent
  useEffect(() => {
    if (patients.length > 0 && consultations.length > 0) {
      const newAppointments = generateRealisticAppointments();
      setAppointments(newAppointments);
    }
  }, [patients, consultations, dossiers, generateRealisticAppointments]);

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
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      const slotDate = new Date(date);
      const slotHour = parseInt(time.split(':')[0]);
      
      return appointmentDate.toDateString() === slotDate.toDateString() && 
             appointmentDate.getHours() === slotHour;
    });
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

  // Fonction pour créer un nouveau rendez-vous (simulation)
  const handleCreateAppointment = async (appointmentData) => {
    try {
      console.log('🚀 Création d\'un nouveau rendez-vous:', appointmentData);
      
      // Simuler la création via API
      const newAppointment = {
        id: `rdv_${Date.now()}`,
        ...appointmentData,
        status: 'confirmed',
        startTime: new Date(appointmentData.startTime),
        endTime: new Date(appointmentData.endTime)
      };
      
      // Ajouter à la liste locale
      setAppointments(prev => [...prev, newAppointment].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
      
      // Créer le rappel pour le patient
      await createPatientReminder(newAppointment);
      
      // Ici, vous pourriez appeler une vraie API pour créer le RDV
      // await createAppointmentAPI(appointmentData);
      
      console.log('✅ Rendez-vous créé avec succès');
      setShowAddModal(false);
      
    } catch (error) {
      console.error('❌ Erreur lors de la création du rendez-vous:', error);
      alert('Erreur lors de la création du rendez-vous');
    }
  };

  // Rendu de la vue jour
  const renderDayView = () => {
    const timeSlots = getTimeSlots();
    const dayAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return appointmentDate.toDateString() === selectedDate.toDateString();
    });

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
              Rendez-vous du {new Date().toLocaleDateString('fr-FR', { 
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
              ) : appointments.filter(appointment => {
                const appointmentDate = new Date(appointment.startTime);
                return appointmentDate.toDateString() === new Date().toDateString();
              }).length > 0 ? (
                <div className="space-y-3">
                  {appointments
                    .filter(appointment => {
                      const appointmentDate = new Date(appointment.startTime);
                      return appointmentDate.toDateString() === new Date().toDateString();
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
              const appointmentData = {
                patientId: formData.get('patientId'),
                startTime: formData.get('startTime'),
                endTime: formData.get('endTime'),
                type: formData.get('type'),
                notes: formData.get('notes')
              };
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
