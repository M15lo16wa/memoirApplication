# Guide d'Implémentation - Accès DMP Médecin

## 📋 Vue d'ensemble

Cette implémentation permet aux médecins d'accéder au DMP (Dossier Médical Partagé) des patients avec une authentification CPS sécurisée et une gestion des modes d'accès.

## 🚀 Fonctionnalités implémentées

### 1. **Authentification CPS**
- Saisie du code CPS à 4 chiffres avec validation en temps réel
- Gestion des tentatives échouées (maximum 3)
- Blocage temporaire après échec des tentatives
- Auto-focus sur les champs suivants

### 2. **Sélection du mode d'accès**
- **Accès autorisé par le patient** : Nécessite la validation du patient
- **Mode urgence** : Accès immédiat en cas d'urgence médicale
- **Connexion secrète** : Accès discret pour consultation confidentielle

### 3. **Gestion des sessions**
- Création de sessions d'accès temporaires
- Validation des données avant envoi
- Gestion des notifications automatiques
- Historique des accès

## 📁 Structure des fichiers

```
src/
├── pages/
│   └── DMPAccess.js              # Page principale d'accès DMP
├── components/
│   └── dmp/
│       └── DMPHistory.js         # Composant historique des accès
├── services/
│   └── api/
│       └── dmpApi.js             # Service API DMP
└── App.js                        # Routes ajoutées
```

## 🔧 Configuration requise

### Variables d'environnement
```env
REACT_APP_API_URL=http://localhost:3001
```

### Dépendances
```json
{
  "react-router-dom": "^6.x",
  "tailwindcss": "^3.x"
}
```

## 🎯 Utilisation

### 1. Accès depuis la liste des patients
1. Aller dans `/dossier-patient`
2. Cliquer sur le bouton vert "Accès DMP" à côté d'un patient
3. Saisir le code CPS à 4 chiffres
4. Sélectionner le mode d'accès approprié
5. Remplir la raison d'accès (minimum 10 caractères)
6. Choisir la durée d'accès
7. Confirmer la demande

### 2. Historique des accès
1. Aller dans l'onglet "Gestion des Accès"
2. Consulter l'historique des accès DMP
3. Voir les détails de chaque accès
4. Fermer les accès actifs si nécessaire

## 🔌 API Endpoints utilisés

### Authentification CPS
```http
POST /api/medecin/dmp/authentification-cps
```

### Demande d'accès
```http
POST /api/medecin/dmp/demande-acces
```

### Historique des accès
```http
GET /api/medecin/dmp/historique
GET /api/medecin/dmp/historique/:patientId
```

### Test du système
```http
GET /api/medecin/dmp/test/systeme
```

## 🎨 Interface utilisateur

### Composants principaux

#### 1. **DMPAccess.js**
- Interface d'authentification CPS avec 4 champs numériques
- Sélection du mode d'accès avec cartes visuelles
- Formulaire de demande d'accès avec validation
- Page de confirmation avec détails

#### 2. **DMPHistory.js**
- Affichage de l'historique des accès
- Statuts colorés (actif, expiré, en attente)
- Actions pour fermer les accès actifs
- Actualisation en temps réel

### Styles CSS
- Utilisation de Tailwind CSS
- Design responsive
- Animations et transitions fluides
- États de chargement et d'erreur

## 🔐 Sécurité

### Validation côté client
- Code CPS : 4 chiffres exactement
- Raison d'accès : minimum 10 caractères
- Durée d'accès : entre 15 et 480 minutes
- Tentatives limitées à 3 pour l'authentification CPS

### Gestion des erreurs
- Messages d'erreur explicites
- Retry automatique pour les erreurs réseau
- Fallback en cas d'échec de l'API

## 📊 États et données

### États locaux (DMPAccess.js)
```javascript
const [codeCPS, setCodeCPS] = useState(['', '', '', '']);
const [attempts, setAttempts] = useState(0);
const [currentStep, setCurrentStep] = useState('cps');
const [selectedMode, setSelectedMode] = useState(null);
const [sessionInfo, setSessionInfo] = useState(null);
```

### Données de session
```javascript
{
  session_id: 15,
  expires_at: "2025-08-06T10:35:14.000Z",
  patient_info: {
    id: 5,
    nom: "MOLOWA",
    prenom: "ESSONGA",
    numero_dossier: "PAT-17540449445"
  }
}
```

## 🧪 Tests recommandés

### Tests unitaires
```javascript
// Test validation CPS
expect(validateCPS('1234')).toEqual({ valid: true });
expect(validateCPS('123')).toEqual({ valid: false, message: 'Le code CPS doit contenir 4 chiffres' });

// Test validation demande d'accès
const validation = validateAccessRequest({
  mode_acces: 'autorise_par_patient',
  raison_acces: 'Consultation de routine',
  duree_acces: 60
});
expect(validation.valid).toBe(true);
```

### Tests d'intégration
- Test du flux complet d'authentification
- Test de la création de session
- Test de la demande d'accès
- Test de l'historique

## 🚨 Gestion des erreurs

### Erreurs courantes
1. **Code CPS invalide** : Vérifier le format et les tentatives
2. **Erreur réseau** : Retry automatique avec délai
3. **Session expirée** : Redirection vers l'authentification
4. **Permissions insuffisantes** : Message d'erreur explicite

### Logs de débogage
```javascript
console.log('Authentification CPS:', credentials);
console.log('Session créée:', sessionInfo);
console.log('Demande d\'accès:', accessData);
```

## 🔄 Workflow complet

1. **Sélection du patient** → Bouton vert dans la liste
2. **Authentification CPS** → Saisie du code à 4 chiffres
3. **Sélection du mode** → Choix entre 3 modes d'accès
4. **Saisie des détails** → Raison et durée d'accès
5. **Confirmation** → Validation et notification
6. **Historique** → Suivi des accès dans l'onglet dédié

## 📈 Améliorations futures

### Fonctionnalités à ajouter
- [ ] Notifications push en temps réel
- [ ] Signature électronique des demandes
- [ ] Intégration avec la carte CPS physique
- [ ] Audit trail complet
- [ ] Export des historiques en PDF

### Optimisations techniques
- [ ] Cache des sessions actives
- [ ] Synchronisation offline
- [ ] Compression des données
- [ ] Lazy loading des historiques

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs de la console
2. Contrôler la connectivité réseau
3. Valider les permissions utilisateur
4. Consulter la documentation API

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024-01-20  
**Auteur** : Équipe de développement 