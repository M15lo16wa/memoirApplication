// 🔧 FONCTION CORRIGÉE POUR REMPLACER LA SIMULATION PAR L'API RÉELLE

// Remplacez la fonction handleCreateAppointment dans src/pages/agenda.js (lignes 351-381)

// ❌ ANCIENNE VERSION (SIMULATION) - À REMPLACER :
/*
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
    setAppointments(prev => [...prev, newAppointment].sort((a, b) => new Date(a.startTime) - new Date(a.startTime)));
    
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
*/

// ✅ NOUVELLE VERSION (API RÉELLE) - À UTILISER :
const handleCreateAppointment = async (appointmentData) => {
  try {
    console.log('🚀 Création d\'un nouveau rendez-vous:', appointmentData);
    
    // Préparer les données pour l'API
    const rendezVousData = {
      patient_id: appointmentData.patientId,
      medecin_id: 79, // ID du médecin connecté (à récupérer dynamiquement)
      date: new Date(appointmentData.startTime).toISOString().split('T')[0], // Format YYYY-MM-DD
      heure: new Date(appointmentData.startTime).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      motif: appointmentData.notes || 'Consultation médicale',
      type_rdv: appointmentData.type || 'consultation',
      statut: 'confirme',
      notes: appointmentData.notes || '',
      // Données supplémentaires
      duree: Math.round((new Date(appointmentData.endTime) - new Date(appointmentData.startTime)) / (1000 * 60)), // durée en minutes
      lieu: 'Cabinet médical' // À personnaliser selon le contexte
    };
    
    console.log('📋 Données formatées pour l\'API:', rendezVousData);
    
    // Appeler l'API réelle pour créer le rendez-vous
    const apiResponse = await createRendezVous(rendezVousData);
    
    if (apiResponse.success) {
      console.log('✅ Rendez-vous créé via API:', apiResponse.data);
      
      // Créer l'objet local avec l'ID retourné par l'API
      const newAppointment = {
        id: apiResponse.data.id || `rdv_${Date.now()}`,
        ...appointmentData,
        status: 'confirmed',
        startTime: new Date(appointmentData.startTime),
        endTime: new Date(appointmentData.endTime),
        // Données de l'API
        apiId: apiResponse.data.id,
        createdAt: apiResponse.data.createdAt
      };
      
      // Ajouter à la liste locale
      setAppointments(prev => [...prev, newAppointment].sort((a, b) => new Date(a.startTime) - new Date(a.startTime)));
      
      // Créer le rappel pour le patient
      await createPatientReminder(newAppointment);
      
      console.log('✅ Rendez-vous créé avec succès et sauvegardé en base');
      setShowAddModal(false);
      
      // Afficher la notification de succès
      setNotificationMessage(`Rendez-vous créé et sauvegardé pour ${appointmentData.patientName || 'le patient'}`);
      setShowNotification(true);
      
      // Masquer la notification après 5 secondes
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      
    } else {
      throw new Error(apiResponse.message || 'Erreur lors de la création du rendez-vous');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du rendez-vous:', error);
    alert(`Erreur lors de la création du rendez-vous: ${error.message}`);
  }
};

// 🔧 INSTRUCTIONS DE REMPLACEMENT :

/*
1. Ouvrez le fichier src/pages/agenda.js
2. Localisez la fonction handleCreateAppointment (lignes 351-381)
3. Remplacez TOUT le contenu de cette fonction par le code ci-dessus
4. Sauvegardez le fichier
5. Rechargez la page dans le navigateur
6. Testez la création d'un rendez-vous

⚠️ IMPORTANT : Assurez-vous que l'import de createRendezVous est présent en haut du fichier :
import { createRendezVous } from '../services/api/rendezVous';
*/
