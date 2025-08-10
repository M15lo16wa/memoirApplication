# 📋 Guide de Migration DMP API

## 🔄 **Changements Apportés au fichier `dmpApi.js`**

### **✅ Fonctions Mises à Jour**

#### **1. `requestDMPAccess` (Lignes 351-365)**
- **Avant :** Utilisait l'ancien système `SessionAccesDMP`
- **Après :** Compatible avec le nouveau système `AutorisationAccesService`
- **Nouveaux paramètres requis :**
  ```javascript
  {
    patient_id: 1,
    type_acces: "lecture", // "lecture", "ecriture", "administration"
    raison_demande: "Consultation d'urgence...",
    duree: 30 // 1-1440 minutes
  }
  ```

#### **2. Validation Renforcée**
- **Nouvelle fonction :** `validateNewAccessRequest`
- **Validation côté client** avant envoi au serveur
- **Contrôles :**
  - Type d'accès : enum ['lecture', 'ecriture', 'administration']
  - Raison : 10-500 caractères
  - Durée : 1-1440 minutes
  - Patient ID : requis

### **🆕 Nouvelles Fonctions Ajoutées**

#### **1. Gestion des Autorisations (Patient)**
```javascript
// Accepter une autorisation
accepterAutorisation(autorisationId, commentaire)

// Refuser une autorisation
refuserAutorisation(autorisationId, raisonRefus)

// Récupérer les autorisations
getAutorisations(patientId)
```

#### **2. Gestion des Autorisations (Médecin)**
```javascript
// Récupérer les autorisations demandées
getAutorisationsDemandees()

// Vérifier l'accès
verifierAcces(professionnelId, patientId)
```

#### **3. Utilitaires**
```javascript
// Récupérer la durée restante
getDureeRestante(autorisationId)

// Validation des nouvelles données
validateNewAccessRequest(data)
```

### **📡 Routes API Mises à Jour**

#### **Routes Patient :**
- `POST /patient/dmp/autorisations/{id}/accepter`
- `POST /patient/dmp/autorisations/{id}/refuser`
- `GET /patient/dmp/autorisations`

#### **Routes Médecin :**
- `GET /medecin/dmp/autorisations`
- `GET /dmp/verifier-acces`

#### **Routes Utilitaires :**
- `GET /dmp/autorisations/{id}/duree-restante`

### **🔧 Utilisation des Nouvelles Fonctions**

#### **Exemple : Demande d'Accès**
```javascript
import { requestDMPAccess, validateNewAccessRequest } from './dmpApi';

const demandeAcces = async () => {
  const accessData = {
    patient_id: 1,
    type_acces: 'lecture',
    raison_demande: 'Consultation d\'urgence - Patient en détresse respiratoire',
    duree: 30
  };

  try {
    // Validation côté client
    const validation = validateNewAccessRequest(accessData);
    if (!validation.valid) {
      console.error('Erreurs de validation:', validation.errors);
      return;
    }

    // Envoi de la demande
    const result = await requestDMPAccess(accessData);
    console.log('Demande créée:', result);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

#### **Exemple : Gestion des Autorisations (Patient)**
```javascript
import { getAutorisations, accepterAutorisation, refuserAutorisation } from './dmpApi';

const gererAutorisations = async () => {
  try {
    // Récupérer les autorisations
    const autorisations = await getAutorisations();
    
    // Accepter une autorisation
    await accepterAutorisation(123, 'Accès autorisé pour consultation');
    
    // Refuser une autorisation
    await refuserAutorisation(124, 'Pas d\'urgence justifiée');
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### **⚠️ Fonctions Obsolètes**

#### **`validateAccessRequest` (Ancienne version)**
- **Raison :** Structure de données incompatible
- **Remplacement :** `validateNewAccessRequest`
- **Action :** À supprimer dans la prochaine version

### **🧪 Tests Recommandés**

#### **1. Test de Validation**
```javascript
const testValidation = () => {
  const validData = {
    patient_id: 1,
    type_acces: 'lecture',
    raison_demande: 'Test de validation',
    duree: 30
  };
  
  const validation = validateNewAccessRequest(validData);
  console.log('Validation:', validation.valid);
};
```

#### **2. Test de Demande d'Accès**
```javascript
const testDemandeAcces = async () => {
  try {
    const result = await requestDMPAccess({
      patient_id: 1,
      type_acces: 'lecture',
      raison_demande: 'Test de demande d\'accès',
      duree: 30
    });
    console.log('Résultat:', result);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### **📊 Métriques à Surveiller**

1. **Taux de succès** des demandes d'accès
2. **Temps de réponse** des patients
3. **Erreurs de validation** côté client
4. **Utilisation** des nouvelles fonctions

### **🚀 Prochaines Étapes**

1. **Tester** toutes les nouvelles fonctions
2. **Mettre à jour** les composants frontend
3. **Former** les développeurs aux nouvelles APIs
4. **Supprimer** les fonctions obsolètes
5. **Ajouter** des tests unitaires

---

**📞 Support :** Pour toute question sur cette migration, consulter la documentation technique ou contacter l'équipe de développement.
