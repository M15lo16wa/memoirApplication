# 🔧 Remplacement Simulation par API Réelle - Agenda

## 🎯 **Problème Identifié**

L'agenda utilise actuellement une **simulation** au lieu de l'API réelle pour créer les rendez-vous :

```javascript
// ❌ SIMULATION ACTUELLE
const handleCreateAppointment = async (appointmentData) => {
  // Simuler la création via API
  const newAppointment = {
    id: `rdv_${Date.now()}`,  // ID temporaire
    ...appointmentData,
    status: 'confirmed'
  };
  
  // Ajouter à la liste locale seulement
  setAppointments(prev => [...prev, newAppointment]);
  
  // Commenté : await createAppointmentAPI(appointmentData);
};
```

## 🚨 **Conséquences du Problème**

1. **Rendez-vous non persistés** : Restent en mémoire locale seulement
2. **Patient ne voit rien** : L'API `/api/rendez-vous/patient/7` retourne `[]`
3. **Données perdues** : Au rechargement de la page, tout disparaît
4. **Synchronisation impossible** : Pas de partage entre médecin et patient

## 🛠️ **Solution : Remplacer par l'API Réelle**

### **1. Import de l'API**

```javascript
// Ajouter cet import en haut du fichier
import { createRendezVous } from '../services/api/rendezVous';
```

### **2. Fonction Corrigée**

```javascript
// ✅ NOUVELLE VERSION AVEC API RÉELLE
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

## 🔄 **Flux de Données Corrigé**

### **Avant (Simulation) :**
```
Médecin crée RDV → Stockage local → Patient ne voit rien
```

### **Après (API Réelle) :**
```
Médecin crée RDV → API POST /rendez-vous → Base de données → API GET /rendez-vous/patient/7 → Patient voit ses RDV
```

## 📋 **Structure des Données API**

### **Données Envoyées (POST) :**
```json
{
  "patient_id": 7,
  "medecin_id": 79,
  "date": "2025-01-15",
  "heure": "14:30",
  "motif": "Consultation de suivi cardiologie",
  "type_rdv": "consultation",
  "statut": "confirme",
  "notes": "Veuillez apporter vos derniers examens",
  "duree": 30,
  "lieu": "Cabinet médical"
}
```

### **Données Reçues (GET) :**
```json
{
  "status": "success",
  "results": 1,
  "data": {
    "rendezVous": [
      {
        "id": 1,
        "patient_id": 7,
        "medecin_id": 79,
        "date": "2025-01-15",
        "heure": "14:30",
        "motif": "Consultation de suivi cardiologie",
        "type_rdv": "consultation",
        "statut": "confirme",
        "notes": "Veuillez apporter vos derniers examens",
        "createdAt": "2025-01-10T10:00:00.000Z",
        "updatedAt": "2025-01-10T10:00:00.000Z"
      }
    ]
  }
}
```

## 🧪 **Tests à Effectuer**

### **Test 1 : Création de Rendez-vous**
1. **Se connecter** en tant que médecin
2. **Créer un rendez-vous** dans l'agenda
3. **Vérifier** que l'API est appelée (logs console)
4. **Vérifier** que la réponse API est reçue

### **Test 2 : Persistance des Données**
1. **Créer plusieurs rendez-vous**
2. **Recharger la page**
3. **Vérifier** que les rendez-vous sont toujours là
4. **Vérifier** qu'ils viennent de l'API

### **Test 3 : Synchronisation Patient**
1. **Créer un rendez-vous** pour le patient 7
2. **Se connecter** en tant que patient 7
3. **Aller dans l'onglet Rappels**
4. **Vérifier** que le rendez-vous apparaît

## 🔍 **Points de Vérification**

### **Logs Console Attendus :**
```
🚀 Création d'un nouveau rendez-vous: {...}
📋 Données formatées pour l'API: {...}
✅ Rendez-vous créé via API: {...}
✅ Rendez-vous créé avec succès et sauvegardé en base
```

### **Erreurs Possibles :**
1. **400 Bad Request** : Données mal formatées
2. **401 Unauthorized** : Token JWT invalide
3. **403 Forbidden** : Permissions insuffisantes
4. **500 Internal Server Error** : Problème côté serveur

## 🎯 **Prochaines Étapes**

### **Phase 1 : Implémentation**
1. **Remplacer** la fonction `handleCreateAppointment`
2. **Tester** la création de rendez-vous
3. **Vérifier** la persistance des données

### **Phase 2 : Optimisation**
1. **Récupérer** l'ID du médecin connecté dynamiquement
2. **Ajouter** la gestion d'erreurs avancée
3. **Implémenter** la validation des données

### **Phase 3 : Fonctionnalités Avancées**
1. **Modification** de rendez-vous existants
2. **Suppression** de rendez-vous
3. **Notifications** en temps réel

---

**Date de création** : 2025-01-10  
**Version** : 1.0.0  
**Statut** : 🔴 Critique (bloque la fonctionnalité)  
**Priorité** : 🔴 Haute (synchronisation patient-médecin)
