# 🔐 Protection 2FA des Dossiers Patients

## **Vue d'ensemble**

Ce système implémente une protection 2FA (Two-Factor Authentication) pour sécuriser l'accès aux dossiers patients dans l'application DMP (Dossier Médical Partagé).

## **🎯 Composants protégés**

### **1. Page de connexion (`src/pages/connexion.js`)**
- **Fonctionnalité** : Vérification 2FA lors de la connexion
- **Déclencheur** : Réponse API avec `requires2FA: true`
- **Redirection** : Selon le type d'utilisateur après validation 2FA

### **2. Page DMP principale (`src/pages/DMP.js`)**
- **Fonctionnalité** : Protection 2FA pour l'accès aux dossiers patients
- **Déclencheur** : Erreur 403 avec `requires2FA: true`
- **Actions protégées** : Toutes les opérations sur les dossiers patients

### **3. Historique DMP (`src/components/dmp/DMPHistory.js`)**
- **Fonctionnalité** : Protection 2FA pour l'historique des accès
- **Déclencheur** : Erreur 403 lors de la récupération de l'historique
- **Actions protégées** : Consultation de l'historique des accès

### **4. Tableau de bord DMP (`src/components/dmp/DMPDashboard.js`)**
- **Fonctionnalité** : Protection 2FA pour le tableau de bord
- **Déclencheur** : Erreur 403 lors du chargement des données
- **Actions protégées** : Affichage des statistiques et données

## **🛠️ Implémentation technique**

### **Hook personnalisé `use2FA`**

```javascript
import { use2FA } from '../hooks/use2FA';

const MyComponent = () => {
  const {
    show2FA,
    requires2FA,
    handle2FASuccess,
    handle2FACancel,
    with2FAProtection
  } = use2FA();

  // Utilisation
  const protectedAction = with2FAProtection(
    async () => { /* action à protéger */ },
    'Nom de l\'action'
  );
};
```

### **Composant `Validate2FA`**

```javascript
import Validate2FA from '../components/2fa/Validate2FA';

// Dans le JSX
{show2FA && requires2FA && (
  <Validate2FA
    onSuccess={handle2FASuccess}
    onCancel={handle2FACancel}
    isRequired={true}
    message="Vérification 2FA requise pour accéder aux dossiers patients"
    userData={userData}
  />
)}
```

## **🔒 Flux de sécurité**

### **1. Tentative d'accès**
```javascript
try {
  const result = await api.get('/dossierMedical/patient/123');
  return result;
} catch (error) {
  // Gestion automatique par with2FAProtection
}
```

### **2. Déclenchement 2FA**
```javascript
if (error.response?.status === 403 && error.response?.data?.requires2FA) {
  setRequires2FA(true);
  setPendingAction(() => () => action(...args));
  setShow2FA(true);
  return null;
}
```

### **3. Validation 2FA**
- Affichage du composant `Validate2FA`
- Saisie du code par l'utilisateur
- Validation côté serveur

### **4. Exécution de l'action**
```javascript
const handle2FASuccess = () => {
  if (pendingAction) {
    pendingAction(); // Exécute l'action en attente
    setPendingAction(null);
  }
};
```

## **📱 Interface utilisateur**

### **Composant de validation**
- **Modal plein écran** avec fond semi-transparent
- **Champ de saisie** pour le code 2FA (6-8 caractères)
- **Boutons d'action** : Valider / Annuler
- **Gestion des erreurs** avec messages explicites
- **État de chargement** pendant la validation

### **Messages personnalisés**
```javascript
message="Vérification 2FA requise pour accéder aux dossiers patients"
message="Vérification 2FA requise pour accéder à l'historique des dossiers patients"
message="Vérification 2FA requise pour accéder au tableau de bord DMP"
```

## **🚀 Utilisation dans vos composants**

### **Étape 1 : Importer les dépendances**
```javascript
import { use2FA } from '../hooks/use2FA';
import Validate2FA from '../components/2fa/Validate2FA';
```

### **Étape 2 : Utiliser le hook**
```javascript
const {
  show2FA,
  requires2FA,
  handle2FASuccess,
  handle2FACancel,
  with2FAProtection
} = use2FA();
```

### **Étape 3 : Protéger les actions**
```javascript
const loadPatientData = with2FAProtection(
  async (patientId) => {
    const response = await api.get(`/patient/${patientId}`);
    return response.data;
  },
  'Chargement des données patient'
);
```

### **Étape 4 : Ajouter le composant 2FA**
```javascript
return (
  <div>
    {/* Votre composant existant */}
    
    {/* Protection 2FA */}
    {show2FA && requires2FA && (
      <Validate2FA
        onSuccess={handle2FASuccess}
        onCancel={handle2FACancel}
        isRequired={true}
        message="Vérification 2FA requise pour cette action"
      />
    )}
  </div>
);
```

## **🔧 Configuration et personnalisation**

### **Messages personnalisés**
```javascript
const messages = {
  dossier: "Vérification 2FA requise pour accéder aux dossiers patients",
  historique: "Vérification 2FA requise pour l'historique des accès",
  statistiques: "Vérification 2FA requise pour les statistiques"
};
```

### **Gestion des erreurs**
```javascript
const handle2FACancel = () => {
  // Nettoyage des états
  setShow2FA(false);
  setRequires2FA(false);
  setPendingAction(null);
  
  // Optionnel : déconnexion
  localStorage.removeItem('jwt');
  localStorage.removeItem('token');
};
```

## **📋 Checklist d'implémentation**

- [ ] **Import du hook `use2FA`**
- [ ] **Import du composant `Validate2FA`**
- [ ] **Utilisation du hook dans le composant**
- [ ] **Protection des actions sensibles avec `with2FAProtection`**
- [ ] **Ajout du composant 2FA dans le JSX**
- [ ] **Gestion des callbacks `onSuccess` et `onCancel`**
- [ ] **Test de la protection 2FA**

## **🧪 Tests et débogage**

### **Console logs**
```javascript
console.log('🔐 2FA requise pour [Action]');
console.log('✅ 2FA validée avec succès, exécution de l\'action en attente...');
console.log('❌ 2FA annulée par l\'utilisateur');
```

### **Simulation d'erreur 2FA**
```javascript
// Dans votre API, retourner une erreur 403 avec requires2FA
{
  status: 403,
  data: {
    requires2FA: true,
    message: "Vérification 2FA requise"
  }
}
```

## **🔐 Sécurité**

- **Protection automatique** : Toutes les actions sensibles sont automatiquement protégées
- **Gestion des sessions** : La 2FA est requise à chaque action critique
- **Annulation sécurisée** : L'annulation nettoie tous les états et peut déconnecter l'utilisateur
- **Validation côté serveur** : La vérification 2FA se fait côté serveur pour plus de sécurité

---

**Note** : Ce système de protection 2FA est conçu pour être transparent pour l'utilisateur final tout en maintenant un niveau de sécurité élevé pour l'accès aux dossiers patients.
