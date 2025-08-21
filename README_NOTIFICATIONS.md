# 🔔 Système de Notifications de Rendez-vous - DMP

## 🎯 Vue d'ensemble

Ce système permet aux médecins de créer des rendez-vous dans l'agenda et d'envoyer automatiquement des notifications aux patients dans leur DMP. Les patients reçoivent des rappels en temps réel et peuvent accepter ou décliner les rendez-vous directement depuis l'interface.

## 🚀 Fonctionnalités

### **Pour les Médecins (Agenda)**
- ✅ Création de rendez-vous avec sélection de patient
- ✅ Génération automatique de rappels pour les patients
- ✅ Types de rendez-vous : Consultation, Suivi, Examen, Vaccination, Urgence
- ✅ Priorités : Haute (urgence), Moyenne, Basse
- ✅ Instructions automatiques selon le type de RDV

### **Pour les Patients (DMP)**
- ✅ Notifications en temps réel des nouveaux rendez-vous
- ✅ Rappels détaillés dans l'onglet "Rappels"
- ✅ Actions directes : Accepter, Décliner, Marquer comme lu
- ✅ Gestionnaire de notifications dans le header
- ✅ Notifications toast avec compte à rebours

## 🏗️ Architecture Technique

### **1. Composants Principaux**

#### **Agenda.js** - Gestion des rendez-vous
```javascript
// Création d'un rendez-vous
const handleCreateAppointment = async (appointmentData) => {
  // 1. Créer le RDV
  const newAppointment = { ...appointmentData, status: 'confirmed' };
  
  // 2. Ajouter à l'agenda
  setAppointments(prev => [...prev, newAppointment]);
  
  // 3. Créer le rappel pour le patient
  await createPatientReminder(newAppointment);
};
```

#### **createPatientReminder()** - Génération des rappels
```javascript
const createPatientReminder = async (appointmentData) => {
  // Créer l'objet rappel avec toutes les informations
  const reminder = {
    id: `rappel_rdv_${Date.now()}`,
    titre: `Rendez-vous médical - ${appointmentData.type}`,
    description: `Vous avez un rendez-vous le ${date} à ${heure}`,
    priorite: appointmentData.type === 'urgence' ? 'haute' : 'moyenne',
    type: 'rendez-vous',
    statut: 'actif',
    patient_id: appointmentData.patientId,
    // ... autres données
  };
  
  // Stocker dans le localStorage du patient
  const patientRemindersKey = `patient_reminders_${appointmentData.patientId}`;
  localStorage.setItem(patientRemindersKey, JSON.stringify([...existingReminders, reminder]));
};
```

### **2. Système de Notifications**

#### **useAppointmentNotifications** - Hook personnalisé
```javascript
const useAppointmentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Charger les notifications depuis le localStorage
  const loadNotifications = useCallback(() => {
    const patientId = getCurrentPatient().id;
    const patientRemindersKey = `patient_reminders_${patientId}`;
    const storedNotifications = JSON.parse(localStorage.getItem(patientRemindersKey) || '[]');
    
    const unreadNotifications = storedNotifications.filter(
      notification => !notification.lu && notification.type === 'rendez-vous'
    );
    
    setNotifications(unreadNotifications);
    setUnreadCount(unreadNotifications.length);
  }, []);
  
  return {
    notifications,
    unreadCount,
    markAsRead,
    acceptAppointment,
    declineAppointment,
    // ... autres fonctions
  };
};
```

#### **NotificationManager** - Interface de gestion
```javascript
const NotificationManager = () => {
  const { notifications, unreadCount, acceptAppointment, declineAppointment } = useAppointmentNotifications();
  
  return (
    <div className="relative">
      {/* Icône avec compteur */}
      <button className="relative p-2">
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5">
            {unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown des notifications */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl">
          {/* Liste des notifications avec actions */}
        </div>
      )}
    </div>
  );
};
```

#### **AppointmentNotification** - Notification toast
```javascript
const AppointmentNotification = ({ appointment, onAccept, onDecline, onClose }) => {
  const [timeRemaining, setTimeRemaining] = useState(30);
  
  // Compte à rebours automatique
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [onClose]);
  
  return (
    <div className="fixed top-4 right-4 z-50 w-96 bg-white rounded-lg shadow-xl">
      {/* Contenu de la notification avec boutons d'action */}
      <div className="flex space-x-3">
        <button onClick={() => onAccept(appointment)} className="bg-green-600 text-white">
          <FaCheck className="mr-2" />
          Accepter
        </button>
        <button onClick={() => onDecline(appointment)} className="bg-red-600 text-white">
          <FaTimes className="mr-2" />
          Décliner
        </button>
      </div>
    </div>
  );
};
```

### **3. Intégration dans le DMP**

#### **Onglet Rappels** - Affichage des rappels
```javascript
{activeTab === 'rappels' && (
  <div className="bg-white rounded-lg shadow">
    <div className="p-6">
      {/* Récupérer les rappels de rendez-vous depuis le localStorage */}
      {(() => {
        const patientId = getStoredPatient().id;
        const patientRemindersKey = `patient_reminders_${patientId}`;
        const appointmentReminders = JSON.parse(localStorage.getItem(patientRemindersKey) || '[]');
        const allReminders = [...rappels, ...appointmentReminders];
        
        return (
          <div className="space-y-4">
            {allReminders.map((rappel, index) => (
              <div key={index} className="border rounded-lg p-4">
                {/* Affichage détaillé du rappel avec actions */}
                {rappel.type === 'rendez-vous' && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    {/* Informations spécifiques aux rendez-vous */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>Heure : {rappel.heure_debut} - {rappel.heure_fin}</div>
                      <div>Durée : {rappel.duree} minutes</div>
                      <div>Médecin : {rappel.medecin}</div>
                      <div>Lieu : {rappel.lieu}</div>
                    </div>
                    
                    {/* Instructions */}
                    <ul className="mt-3 space-y-1">
                      {rappel.instructions.map((instruction, idx) => (
                        <li key={idx} className="text-xs text-gray-600">
                          • {instruction}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  </div>
)}
```

## 🔄 Flux de Données

### **1. Création d'un Rendez-vous**
```
Médecin crée RDV → Agenda.js → createPatientReminder() → 
localStorage patient → NotificationManager → Patient DMP
```

### **2. Réception de la Notification**
```
localStorage change → useAppointmentNotifications → 
NotificationManager → Toast + Dropdown → Actions patient
```

### **3. Actions du Patient**
```
Patient clique → acceptAppointment/declineAppointment → 
localStorage update → Interface refresh → Statut mis à jour
```

## 📱 Interface Utilisateur

### **Header du DMP**
- 🔔 Icône de notifications avec compteur
- 📊 Dropdown des notifications non lues
- ⚡ Actions rapides (Accepter/Décliner)

### **Onglet Rappels**
- 📅 Rappels de rendez-vous détaillés
- 🎯 Priorités visuelles (Haute/Moyenne/Basse)
- 📋 Instructions et informations complètes
- ✅ Actions contextuelles

### **Notifications Toast**
- ⏰ Compte à rebours de 30 secondes
- 🚨 Indicateurs de priorité
- 🎯 Boutons d'action directs
- 📱 Design responsive

## 🎨 Styles et Animations

### **CSS Animations**
```css
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out forwards;
}

.animate-pulse-urgent {
  animation: pulse-urgent 2s ease-in-out infinite;
}
```

### **Classes Tailwind**
- **Priorités** : `bg-red-100 text-red-800`, `bg-yellow-100 text-yellow-800`
- **Types** : `bg-blue-100 text-blue-800` pour les rendez-vous
- **États** : `border-l-4 border-blue-500` pour les notifications non lues

## 🧪 Test du Système

### **1. Créer un Rendez-vous**
1. Aller dans l'agenda (`/agenda`)
2. Cliquer sur "Nouveau RDV"
3. Sélectionner un patient
4. Remplir les détails
5. Créer le RDV

### **2. Vérifier la Notification**
1. Se connecter en tant que patient
2. Aller dans le DMP (`/dmp`)
3. Vérifier l'icône de notifications (compteur)
4. Cliquer pour voir le dropdown
5. Vérifier la notification toast

### **3. Consulter les Rappels**
1. Aller dans l'onglet "Rappels"
2. Voir le rappel de rendez-vous
3. Tester les actions (Accepter/Décliner)
4. Vérifier la mise à jour du statut

## 🔧 Configuration et Personnalisation

### **Types de Rendez-vous**
```javascript
const appointmentTypes = [
  { type: 'consultation', color: 'bg-blue-500', duration: 30, title: 'Consultation' },
  { type: 'suivi', color: 'bg-green-500', duration: 20, title: 'Suivi' },
  { type: 'examen', color: 'bg-purple-500', duration: 45, title: 'Examen' },
  { type: 'vaccination', color: 'bg-yellow-500', duration: 15, title: 'Vaccination' },
  { type: 'urgence', color: 'bg-red-500', duration: 60, title: 'Urgence' }
];
```

### **Instructions Automatiques**
```javascript
const notesByType = {
  consultation: [
    'Suivi tension artérielle',
    'Contrôle glycémie',
    'Bilan de santé général'
  ],
  urgence: [
    'Douleur thoracique',
    'Traumatisme',
    'Fièvre élevée'
  ]
  // ... autres types
};
```

## 🚀 Améliorations Futures

### **Fonctionnalités Avancées**
- 📧 Notifications par email/SMS
- 🔔 Rappels automatiques avant le RDV
- 📱 Application mobile dédiée
- 🤖 Chatbot pour la prise de RDV

### **Intégrations**
- 🏥 Système de gestion hospitalière
- 📅 Calendriers externes (Google, Outlook)
- 💳 Système de paiement
- 📊 Analytics et statistiques

## 📝 Notes Techniques

### **Stockage des Données**
- **localStorage** : Stockage temporaire des notifications
- **Structure** : `patient_reminders_{patientId}` → Array de rappels
- **Persistance** : Survit aux rechargements de page

### **Gestion des États**
- **React Hooks** : `useState`, `useEffect`, `useCallback`
- **Context** : Gestion globale des notifications
- **Local State** : État local des composants

### **Performance**
- **Debouncing** : Vérification des notifications toutes les 30s
- **Memoization** : `useCallback` pour les fonctions
- **Lazy Loading** : Chargement à la demande

---

## 🎉 Résultat Final

Le système de notifications de rendez-vous est maintenant **entièrement fonctionnel** et permet :

1. **Aux médecins** de créer des RDV et notifier automatiquement les patients
2. **Aux patients** de recevoir des notifications en temps réel
3. **Aux deux** de gérer efficacement les rendez-vous via une interface intuitive

Le système se confond parfaitement avec une vraie plateforme médicale et offre une expérience utilisateur professionnelle ! 🏥✨
