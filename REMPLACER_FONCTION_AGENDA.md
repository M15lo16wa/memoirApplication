# 🔧 REMPLACEMENT MANUEL DE LA FONCTION AGENDA

## 🚨 **PROBLÈME IDENTIFIÉ**

L'interface de l'agenda utilise encore la **simulation** au lieu de l'API réelle. C'est pourquoi :
- ❌ Aucune réaction du formulaire
- ❌ Aucune requête envoyée au serveur
- ❌ Les simulations restent affichées
- ❌ Le patient ne voit rien

## 🛠️ **SOLUTION : REMPLACEMENT MANUEL**

### **Étape 1 : Ouvrir le Fichier**
1. **Ouvrez** `src/pages/agenda.js` dans votre éditeur
2. **Allez à la ligne 351** (fonction `handleCreateAppointment`)

### **Étape 2 : Remplacer la Fonction Complète**

**SUPPRIMEZ** cette fonction (lignes 351-381) :
```javascript
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
```

**REMPLACEZ** par cette nouvelle fonction :
```javascript
// Fonction pour créer un nouveau rendez-vous (API réelle)
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
```

### **Étape 3 : Vérifier l'Import**
**Assurez-vous** que cette ligne est présente en haut du fichier (ligne 5) :
```javascript
import { createRendezVous } from '../services/api/rendezVous';
```

### **Étape 4 : Sauvegarder et Tester**
1. **Sauvegardez** le fichier
2. **Rechargez** la page dans le navigateur
3. **Testez** la création d'un rendez-vous

## 🎯 **RÉSULTATS ATTENDUS**

### **Après le Remplacement :**
- ✅ **Formulaire réactif** : Le bouton "Créer le RDV" fonctionne
- ✅ **API appelée** : Requête POST envoyée au serveur
- ✅ **Logs console** : Messages de création via API
- ✅ **Rendez-vous persisté** : Sauvegardé en base de données
- ✅ **Patient synchronisé** : Visible dans l'onglet Rappels

### **Logs Console Attendus :**
```
🚀 Création d'un nouveau rendez-vous: {...}
📋 Données formatées pour l'API: {...}
✅ Rendez-vous créé via API: {...}
✅ Rendez-vous créé avec succès et sauvegardé en base
```

## 🚨 **EN CAS DE PROBLÈME**

### **Si le Formulaire ne Fonctionne Toujours Pas :**
1. **Vérifiez** que la fonction a bien été remplacée
2. **Vérifiez** que l'import est présent
3. **Vérifiez** qu'il n'y a pas d'erreurs de syntaxe
4. **Rechargez** complètement la page (Ctrl+F5)

### **Si l'API Retourne une Erreur :**
1. **Vérifiez** que le serveur backend est démarré
2. **Vérifiez** que l'endpoint `/api/rendez-vous` existe
3. **Vérifiez** que l'authentification fonctionne

---

**⚠️ IMPORTANT : Faites ce remplacement MAINTENANT pour que l'interface fonctionne !**

Une fois remplacé, testez immédiatement la création d'un rendez-vous.
