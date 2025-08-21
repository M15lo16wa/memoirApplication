# 🏥 Séparation Claire des Responsabilités - Services API

## 📋 **Vue d'ensemble**

Cette documentation décrit la nouvelle architecture des services API avec une séparation claire des responsabilités pour améliorer la maintenabilité et éviter les conflits.

## 🎯 **Principe de Séparation**

### **`medicalApi.js` - Service Médecin/Professionnel**
- **Responsabilité** : Gestion administrative et médicale
- **Utilisateur cible** : Médecins, professionnels de santé
- **Fonctions** : Création, modification, suppression, gestion des dossiers

### **`patientApi.js` - Service Patient**
- **Responsabilité** : Consultation et lecture des données
- **Utilisateur cible** : Patients
- **Fonctions** : Lecture, consultation, gestion des prescriptions personnelles

### **`authApi.js` - Service Authentification**
- **Responsabilité** : Gestion des tokens et authentification
- **Utilisateur cible** : Tous les utilisateurs
- **Fonctions** : Login, validation, gestion des sessions

## 🔧 **Détails des Services**

### **🏥 medicalApi.js (Service Médecin)**

#### **Rendez-vous et Traitements**
- `getPatientRendezVous()` - Récupération des RDV d'un patient
- `getProchainRendezVous()` - Prochain RDV d'un patient
- `getTraitementsActifs()` - Traitements actifs d'un patient

#### **Prescriptions (Création/Gestion)**
- `createOrdonnance()` - Création d'ordonnance
- `createExamen()` - Création de demande d'examen
- `getAllPrescriptions()` - Toutes les prescriptions d'un patient
- `getOrdonnancesRecentes()` - Ordonnances récentes
- `createOrdonnanceComplete()` - Ordonnance complète avec notification

#### **Dossiers Médicaux (Administration)**
- `createDossierMedical()` - Création de dossier
- `getAllDossiersMedical()` - Tous les dossiers
- `updateDossierPatient()` - Mise à jour de dossier
- `closeDossierPatient()` - Fermeture de dossier

#### **Consultations (Gestion)**
- `createConsultation()` - Création de consultation
- `getAllConsultations()` - Toutes les consultations
- `updateConsultation()` - Mise à jour de consultation
- `deleteConsultation()` - Suppression de consultation

#### **Documents (Administration)**
- `uploadDocument()` - Upload de document
- `downloadDocument()` - Téléchargement de document
- `viewDocument()` - Visualisation de documents

#### **Logique d'Authentification**
```javascript
// Priorité : Token médecin/professionnel
if (generalToken && hasMedecin) {
    config.headers.Authorization = `Bearer ${generalToken}`;
}
// Fallback : JWT patient
else if (jwtToken) {
    config.headers.Authorization = `Bearer ${jwtToken}`;
}
```

---

### **👥 patientApi.js (Service Patient)**

#### **Gestion des Patients (Lecture)**
- `getPatients()` - Liste de tous les patients
- `getPatient(id)` - Détails d'un patient spécifique
- `createPatient()` - Création (fonction administrative)
- `updatePatient()` - Mise à jour
- `deletePatient()` - Suppression (fonction administrative)

#### **Services de Santé**
- `getServices()` - Liste des services de santé

#### **Prescriptions (Consultation)**
- `getPrescriptionsByPatient()` - Prescriptions d'un patient
- `getAllPrescriptionsByPatient()` - Toutes les prescriptions avec pagination
- `getActivePrescriptionsByPatient()` - Prescriptions actives
- `getOrdonnancesByPatient()` - Ordonnances uniquement
- `getExamensByPatient()` - Examens uniquement

#### **Données Médicales (Lecture)**
- `getParametresBiologiques()` - Paramètres biologiques
- `getAntecedentsMedicaux()` - Antécédents médicaux
- `getAllergies()` - Allergies
- `getHistoriqueConsultations()` - Historique des consultations
- `getPatientDocuments()` - Documents du patient
- `getDocumentsRecents()` - Documents récents

#### **Logique d'Authentification**
```javascript
// Priorité : Token patient (JWT)
if (jwtToken) {
    config.headers.Authorization = `Bearer ${jwtToken}`;
}
// Fallback : Token général
else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
}
```

---

### **🔐 authApi.js (Service Authentification)**

#### **Gestion des Tokens**
- `getValidAuthToken()` - Récupération du token valide
- `cleanupTemporaryTokens()` - Nettoyage des tokens temporaires
- `isAuthenticated()` - Vérification de l'authentification
- `isMedecinAuthenticated()` - Vérification médecin
- `isPatientAuthenticated()` - Vérification patient

#### **Intercepteurs Axios**
- **Requête** : Ajout automatique du token d'authentification
- **Réponse** : Gestion des erreurs 401 et logging détaillé

## 📁 **Structure des Imports**

### **Composants Médecin**
```javascript
// Fonctions administratives
import { 
    createDossierMedical, 
    getAllDossiersMedical,
    createOrdonnance 
} from "../services/api/medicalApi";

// Fonctions de lecture
import { 
    getPatients, 
    getServices 
} from "../services/api/patientApi";
```

### **Composants Patient**
```javascript
// Fonctions de consultation
import { 
    getPrescriptionsByPatient,
    getPatientDocuments,
    getServices 
} from "../services/api/patientApi";
```

### **Composants Mixtes**
```javascript
// Authentification
import { 
    isAuthenticated, 
    isMedecinAuthenticated 
} from "../services/api/authApi";

// Fonctions selon le contexte
import { createConsultation } from "../services/api/medicalApi";
import { getPatients } from "../services/api/patientApi";
```

## ✅ **Avantages de cette Séparation**

### **1. Clarté des Responsabilités**
- Chaque service a un rôle bien défini
- Pas de confusion sur quelle fonction utiliser
- Code plus maintenable

### **2. Évite les Conflits**
- Plus de fonctions dupliquées
- Imports cohérents
- Logique d'authentification adaptée

### **3. Sécurité Améliorée**
- Tokens appropriés selon le contexte
- Accès restreint aux fonctions sensibles
- Logique d'authentification claire

### **4. Maintenance Facilitée**
- Modifications isolées par service
- Tests plus ciblés
- Débogage simplifié

## 🚨 **Points d'Attention**

### **1. Imports à Vérifier**
- S'assurer que les bons services sont importés
- Vérifier la cohérence des imports dans tous les composants
- Éviter les imports croisés

### **2. Logique d'Authentification**
- `medicalApi.js` : Priorité médecin
- `patientApi.js` : Priorité patient
- `authApi.js` : Gestion générale

### **3. Fonctions Déplacées**
- `getPatients()` : `medicalApi.js` → `patientApi.js`
- `getServices()` : `medicalApi.js` → `patientApi.js`
- Nouvelles fonctions ajoutées dans `patientApi.js`

## 🔄 **Migration des Composants Existants**

### **Composants Mise à Jour**
- ✅ `dossierPatient.js` - Imports corrigés
- ✅ `consultation.js` - Imports corrigés
- ✅ `DMP.js` - Utilise déjà `patientApi.js`
- ✅ `DMPContext.js` - Utilise `medicalApi.js` pour l'administration

### **Composants à Vérifier**
- `Utilisateur.js` - Commenté, à réactiver si nécessaire
- Autres composants utilisant les services API

## 📚 **Exemples d'Utilisation**

### **Création d'un Dossier (Médecin)**
```javascript
import { createDossierMedical } from "../services/api/medicalApi";

const handleCreateDossier = async (dossierData) => {
    try {
        const result = await createDossierMedical(dossierData);
        console.log('Dossier créé:', result);
    } catch (error) {
        console.error('Erreur création dossier:', error);
    }
};
```

### **Consultation des Prescriptions (Patient)**
```javascript
import { getPrescriptionsByPatient } from "../services/api/patientApi";

const loadPrescriptions = async (patientId) => {
    try {
        const result = await getPrescriptionsByPatient(patientId);
        setPrescriptions(result.prescriptions);
    } catch (error) {
        console.error('Erreur chargement prescriptions:', error);
    }
};
```

### **Vérification d'Authentification**
```javascript
import { isMedecinAuthenticated } from "../services/api/authApi";

const checkAuth = async () => {
    const isAuth = await isMedecinAuthenticated();
    if (!isAuth) {
        navigate('/login');
    }
};
```

## 🎯 **Prochaines Étapes**

### **1. Tests**
- Vérifier que tous les composants fonctionnent
- Tester les différentes logiques d'authentification
- Valider la récupération des données

### **2. Documentation**
- Mettre à jour la documentation des composants
- Créer des exemples d'utilisation
- Documenter les cas d'erreur

### **3. Optimisation**
- Analyser les performances
- Optimiser les appels API
- Améliorer la gestion des erreurs

---

**📅 Date de création** : 20 Août 2025  
**🔄 Version** : 1.0  
**👨‍💻 Auteur** : Assistant IA  
**📝 Statut** : Implémenté et documenté
