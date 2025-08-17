# 🚀 Composant DMPAccess avec Protection 2FA - Guide d'utilisation

## 📋 Vue d'ensemble

Le composant `DMPAccess` implémente un système d'accès sécurisé aux dossiers patients avec **protection 2FA intégrée**. Il utilise le hook `use2FA` pour sécuriser toutes les opérations sensibles.

## 🔐 Fonctionnalités de sécurité

### 1. **Authentification CPS**
- Code de Professionnel de Santé à 4 chiffres
- Validation automatique et sécurisée

### 2. **Protection 2FA**
- Vérification 2FA obligatoire pour l'accès aux données
- Utilisation du hook `use2FA` pour la gestion
- Modale de validation automatique

### 3. **Modes d'accès**
- **Standard** : Nécessite l'approbation du patient
- **Urgence** : Accès immédiat en cas d'urgence
- **Secret** : Accès discret pour consultation

## 🛠️ Implémentation technique

### **Imports requis**
```javascript
import { use2FA } from '../hooks/use2FA';
import { getPatient } from '../services/api/patientApi';
import Validate2FA from '../components/2fa/Validate2FA';
```

### **Hook 2FA**
```javascript
const { 
    show2FAModal, 
    with2FAProtection, 
    handle2FAValidation, 
    handle2FACancel,
    isSubmitting,
    error: error2FA
} = use2FA();
```

### **Fonctions protégées**
```javascript
// Accès au dossier patient protégé par 2FA
const protectedGetPatientRecord = with2FAProtection(async () => {
    const data = await getPatient(patientId);
    setPatientInfo(data);
    return data;
}, 'Accès au dossier patient');

// Demande d'accès protégée par 2FA
const protectedRequestAccess = with2FAProtection(async () => {
    const accessData = {
        mode: selectedMode,
        raison: raisonAcces,
        patient_id: Number(patientId)
    };
    await dmpApi.requestStandardAccess(accessData);
    return true;
}, 'Demande d\'accès au dossier patient');
```

## 🎯 Utilisation du composant

### **1. Rendu conditionnel des étapes**
```javascript
{currentStep === 'cps' && renderCPSStep()}
{currentStep === 'mode' && renderModeStep()}
{currentStep === 'confirmation' && renderConfirmationStep()}
{currentStep === 'patient_access' && renderPatientAccess()}
{currentStep === 'error' && renderErrorStep()}
```

### **2. Modale 2FA automatique**
```javascript
{show2FAModal && (
    <Validate2FA
        onSubmit={handle2FAValidation}
        onCancel={handle2FACancel}
        loading={isSubmitting}
        error={error2FA}
        message="Vérification 2FA requise pour accéder aux dossiers patients"
    />
)}
```

## 🔄 Flux d'utilisation

### **Étape 1 : Authentification CPS**
- Saisie du code CPS à 4 chiffres
- Validation et passage à l'étape suivante

### **Étape 2 : Sélection du mode d'accès**
- Choix entre standard, urgence ou secret
- Saisie de la raison d'accès

### **Étape 3 : Confirmation**
- Récapitulatif de la demande
- Envoi protégé par 2FA

### **Étape 4 : Accès au dossier patient**
- Bouton d'accès direct (si autorisé)
- Protection 2FA obligatoire
- Récupération des données patient

## 🚨 Gestion des erreurs

### **Types d'erreurs gérées**
- Erreurs d'authentification CPS
- Erreurs de validation 2FA
- Erreurs d'API et de réseau
- Erreurs de statut d'accès

### **Interface d'erreur**
```javascript
const renderErrorStep = () => (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            
            <div className="space-y-3">
                <button onClick={() => setCurrentStep('cps')}>
                    Réessayer
                </button>
                <button onClick={() => navigate('/')}>
                    Retour à l'accueil
                </button>
            </div>
        </div>
    </div>
);
```

## 🎨 Interface utilisateur

### **Design responsive**
- Interface adaptée mobile et desktop
- Composants Tailwind CSS
- Animations et transitions fluides

### **Éléments visuels**
- Icônes SVG pour une meilleure UX
- Indicateurs de chargement
- Messages d'état clairs
- Boutons d'action intuitifs

## 🔒 Sécurité renforcée

### **Protection des données**
- Toutes les fonctions sensibles sont protégées par 2FA
- Validation automatique des sessions
- Gestion sécurisée des tokens

### **Audit et traçabilité**
- Logs détaillés des accès
- Traçage des tentatives d'accès
- Historique des validations 2FA

## 📱 Responsive Design

### **Breakpoints supportés**
- Mobile : < 768px
- Tablet : 768px - 1024px
- Desktop : > 1024px

### **Adaptations mobiles**
- Champs de saisie optimisés
- Boutons tactiles
- Navigation simplifiée

## 🚀 Déploiement

### **Prérequis**
- Hook `use2FA` fonctionnel
- API `patientApi` accessible
- Composant `Validate2FA` disponible

### **Configuration**
- Variables d'environnement pour les URLs API
- Gestion des tokens d'authentification
- Configuration des timeouts 2FA

## 📊 Performance

### **Optimisations**
- `useCallback` pour les fonctions
- `useEffect` optimisés
- Gestion des composants montés/démontés

### **Monitoring**
- Métriques de performance
- Temps de réponse des APIs
- Utilisation mémoire et CPU

---

## 🎯 **Résumé des fonctionnalités**

✅ **Protection 2FA intégrée** avec le hook `use2FA`  
✅ **Authentification CPS** sécurisée  
✅ **Modes d'accès multiples** (standard, urgence, secret)  
✅ **Interface utilisateur moderne** et responsive  
✅ **Gestion d'erreurs complète** avec étapes dédiées  
✅ **Sécurité maximale** pour l'accès aux dossiers patients  
✅ **Navigation fluide** entre les étapes  
✅ **Validation automatique** des sessions 2FA  

Le composant est maintenant **entièrement fonctionnel et sécurisé** ! 🎉
