import { useState, useEffect, useCallback } from 'react';
import { getStoredPatient } from '../services/api/authApi';

const useAppointmentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Récupérer le patient connecté
  const getCurrentPatient = useCallback(() => {
    return getStoredPatient();
  }, []);

  // Charger les notifications existantes
  const loadNotifications = useCallback(() => {
    const patient = getCurrentPatient();
    if (!patient) return;

    const patientId = patient.id_patient || patient.id;
    const patientRemindersKey = `patient_reminders_${patientId}`;
    const storedNotifications = JSON.parse(localStorage.getItem(patientRemindersKey) || '[]');
    
    // Filtrer les notifications non lues
    const unreadNotifications = storedNotifications.filter(notification => 
      !notification.lu && notification.type === 'rendez-vous'
    );
    
    setNotifications(unreadNotifications);
    setUnreadCount(unreadNotifications.length);
  }, [getCurrentPatient]);

  // Marquer une notification comme lue
  const markAsRead = useCallback((notificationId) => {
    const patient = getCurrentPatient();
    if (!patient) return;

    const patientId = patient.id_patient || patient.id;
    const patientRemindersKey = `patient_reminders_${patientId}`;
    const storedNotifications = JSON.parse(localStorage.getItem(patientRemindersKey) || '[]');
    
    const updatedNotifications = storedNotifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, lu: true, date_lecture: new Date().toISOString() }
        : notification
    );
    
    localStorage.setItem(patientRemindersKey, JSON.stringify(updatedNotifications));
    loadNotifications();
  }, [getCurrentPatient, loadNotifications]);

  // Accepter un rendez-vous
  const acceptAppointment = useCallback((notificationId) => {
    const patient = getCurrentPatient();
    if (!patient) return;

    const patientId = patient.id_patient || patient.id;
    const patientRemindersKey = `patient_reminders_${patientId}`;
    const storedNotifications = JSON.parse(localStorage.getItem(patientRemindersKey) || '[]');
    
    const updatedNotifications = storedNotifications.map(notification => 
      notification.id === notificationId 
        ? { 
            ...notification, 
            lu: true, 
            statut: 'accepte',
            date_reponse: new Date().toISOString(),
            reponse: 'accepte'
          }
        : notification
    );
    
    localStorage.setItem(patientRemindersKey, JSON.stringify(updatedNotifications));
    loadNotifications();
    
    // Ici, vous pourriez appeler une API pour confirmer l'acceptation
    console.log('✅ Rendez-vous accepté:', notificationId);
  }, [getCurrentPatient, loadNotifications]);

  // Décliner un rendez-vous
  const declineAppointment = useCallback((notificationId) => {
    const patient = getCurrentPatient();
    if (!patient) return;

    const patientId = patient.id_patient || patient.id;
    const patientRemindersKey = `patient_reminders_${patientId}`;
    const storedNotifications = JSON.parse(localStorage.getItem(patientRemindersKey) || '[]');
    
    const updatedNotifications = storedNotifications.map(notification => 
      notification.id === notificationId 
        ? { 
            ...notification, 
            lu: true, 
            statut: 'decline',
            date_reponse: new Date().toISOString(),
            reponse: 'decline'
          }
        : notification
    );
    
    localStorage.setItem(patientRemindersKey, JSON.stringify(updatedNotifications));
    loadNotifications();
    
    // Ici, vous pourriez appeler une API pour confirmer le refus
    console.log('❌ Rendez-vous décliné:', notificationId);
  }, [getCurrentPatient, loadNotifications]);

  // Supprimer une notification
  const removeNotification = useCallback((notificationId) => {
    const patient = getCurrentPatient();
    if (!patient) return;

    const patientId = patient.id_patient || patient.id;
    const patientRemindersKey = `patient_reminders_${patientId}`;
    const storedNotifications = JSON.parse(localStorage.getItem(patientRemindersKey) || '[]');
    
    const updatedNotifications = storedNotifications.filter(notification => 
      notification.id !== notificationId
    );
    
    localStorage.setItem(patientRemindersKey, JSON.stringify(updatedNotifications));
    loadNotifications();
  }, [getCurrentPatient, loadNotifications]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(() => {
    const patient = getCurrentPatient();
    if (!patient) return;

    const patientId = patient.id_patient || patient.id;
    const patientRemindersKey = `patient_reminders_${patientId}`;
    const storedNotifications = JSON.parse(localStorage.getItem(patientRemindersKey) || '[]');
    
    const updatedNotifications = storedNotifications.map(notification => 
      notification.type === 'rendez-vous' 
        ? { ...notification, lu: true, date_lecture: new Date().toISOString() }
        : notification
    );
    
    localStorage.setItem(patientRemindersKey, JSON.stringify(updatedNotifications));
    loadNotifications();
  }, [getCurrentPatient, loadNotifications]);

  // Écouter les changements dans le localStorage (pour les notifications en temps réel)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('patient_reminders_')) {
        loadNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Charger les notifications au montage du composant
    loadNotifications();
    
    // Vérifier les nouvelles notifications toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [loadNotifications]);

  // Obtenir les notifications par priorité
  const getNotificationsByPriority = useCallback(() => {
    const urgent = notifications.filter(n => n.priorite === 'haute');
    const normal = notifications.filter(n => n.priorite === 'moyenne');
    const low = notifications.filter(n => n.priorite === 'basse');
    
    return { urgent, normal, low };
  }, [notifications]);

  // Obtenir les notifications par type
  const getNotificationsByType = useCallback(() => {
    const appointments = notifications.filter(n => n.type === 'rendez-vous');
    const reminders = notifications.filter(n => n.type === 'rappel');
    const alerts = notifications.filter(n => n.type === 'alerte');
    
    return { appointments, reminders, alerts };
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    acceptAppointment,
    declineAppointment,
    removeNotification,
    markAllAsRead,
    getNotificationsByPriority,
    getNotificationsByType
  };
};

export default useAppointmentNotifications;
