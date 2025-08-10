# 📋 Documentation - Configuration Plateforme DMP
## Gestion des Autorisations d'Accès et Notifications

---

## 🎯 Vue d'ensemble

Cette documentation décrit l'état actuel de la configuration de la plateforme concernant la gestion des autorisations d'accès au DMP (Dossier Médical Partagé) et le système de notifications associé.

---

## 📡 API Endpoints Utilisés

### 1. Récupération des Notifications
```javascript
GET /api/patient/dmp/autorisations/notifications
```
- **Description**: Récupère toutes les notifications de demandes d'accès
- **Réponse attendue**: 
```json
{
  "notifications": [
    {
      "id_notification": 27,
      "session_id": 38,
      "professionnel_id": 2,
      "date_creation": "2024-01-XX",
      "statut": "non_lu",
      "message": "Demande d'accès au DMP",
      "type": "demande_acces"
    }
  ]
}
```

### 2. Récupération des Autorisations
```javascript
GET /api/patient/dmp/autorisations
```
- **Description**: Récupère toutes les autorisations du patient
- **Réponse attendue**: 
```json
{
  "status": "success",
  "data": {
    "autorisations": [
      {
        "id_acces": 1,
        "session_id": 38,
        "professionnel_id": 2,
        "statut": "attente_validation",
        "type_acces": "lecture",
        "date_creation": "2024-01-XX",
        "date_debut": null,
        "date_fin": null,
        "raison_demande": "Consultation médicale"
      }
    ]
  }
}
```

### 3. Accepter une Autorisation
```javascript
POST /api/patient/dmp/autorisations/{id_acces}/accepter
```
- **Description**: Accepte une demande d'accès
- **Body**: 
```json
{
  "commentaire": "Accès autorisé par le patient"
}
```

### 4. Refuser une Autorisation
```javascript
POST /api/patient/dmp/autorisations/{id_acces}/refuser
```
- **Description**: Refuse une demande d'accès
- **Body**: 
```json
{
  "raison_refus": "Accès refusé par le patient"
}
```

### 5. Marquer une Notification comme Lue
```javascript
POST /api/patient/dmp/autorisations/notifications/{id_notification}/marquer-lu
```
- **Description**: Marque une notification comme lue

### 6. Créer une Autorisation Directe
```javascript
POST /api/patient/dmp/autorisations
```
- **Description**: Crée une autorisation directe (sans demande préalable)
- **Body**: 
```json
{
  "professionnel_id": 2,
  "type_acces": "lecture",
  "duree_minutes": 60,
  "raison_demande": "Consultation médicale"
}
```

---

## 🔄 Flux de Données et Logique

### 1. Problème Principal Identifié
**Mismatch entre `id_notification` et `id_acces`**:
- Les notifications contiennent `id_notification` (ex: 27)
- Les autorisations contiennent `id_acces` (ex: 1)
- L'API d'acceptation/refus attend `id_acces`, pas `id_notification`

### 2. Solution Implémentée
**Fonction `findAutorisationIdFromNotification`**:
```javascript
// Logique de correspondance flexible
1. Correspondance par professionnel_id
2. Correspondance par date_creation (tolérance 10 minutes)
3. Fallback: utilisation de la seule autorisation disponible
```

### 3. Vérifications Préventives
**Avant acceptation/refus**:
```javascript
// Vérification du statut actuel
if (statut === 'actif') → Retourne succès sans appel API
if (statut === 'refuse') → Erreur (impossible d'accepter)
if (statut === 'expire') → Erreur (impossible d'accepter)
```

---

## 🏗️ Architecture Frontend

### 1. Composants Principaux
- **`DMP.js`**: Page principale du DMP patient
- **`DMPAccess.js`**: Gestion des accès
- **`AutorisationCard.js`**: Carte d'autorisation
- **`AutorisationsEnAttente.js`**: Autorisations en attente
- **`DMPDemandesAcces.js`**: Demandes d'accès
- **`DMPNotification.js`**: Notifications
- **`PatientAutorisations.js`**: Gestion des autorisations

### 2. Service API (`dmpApi.js`)
**Fonctions principales**:
- `getDroitsAccesNotifications()`: Récupère les notifications
- `getAutorisations()`: Récupère les autorisations
- `accepterAutorisation(id, commentaire)`: Accepte une autorisation
- `refuserAutorisation(id, raison)`: Refuse une autorisation
- `marquerNotificationLue(id)`: Marque comme lue
- `createDirectAutorisation(data)`: Crée une autorisation directe

### 3. Gestion d'État
```javascript
// États principaux dans DMP.js
const [notificationsDroitsAcces, setNotificationsDroitsAcces] = useState([]);
const [autorisations, setAutorisations] = useState([]);
const [loading, setLoading] = useState(false);
```

---

## 🔍 Points de Debug Actuels

### 1. Logs Détaillés
**Dans `dmpApi.js`**:
```javascript
console.log('🔍 dmpApi: === DÉBUT ACCEPTATION AUTORISATION ===');
console.log('📋 dmpApi: autorisationId:', autorisationId);
console.log('📊 dmpApi: Statut actuel de l\'autorisation:', autorisation);
```

**Dans `DMP.js`**:
```javascript
console.log('🎯 DMP: === DÉBUT ACCEPTATION DEMANDE D\'ACCÈS ===');
console.log('📄 DMP: Notification sélectionnée:', notification);
```

### 2. Vérifications Implémentées
- **Existence de l'autorisation**: `testAutorisationExistence()`
- **Correspondance notification/autorisation**: `findAutorisationIdFromNotification()`
- **Statut pré-acceptation**: Vérification avant appel API

---

## ⚠️ Problèmes Connus et Solutions

### 1. Erreur 404 - Endpoint Inexistant
**Problème**: `GET /patient/dmp/autorisations/{id}` n'existe pas
**Solution**: Utilisation de `GET /patient/dmp/autorisations` + filtrage frontend

### 2. Erreur 400 - Autorisation Déjà Active
**Problème**: Tentative d'accepter une autorisation déjà active
**Solution**: Vérification préventive du statut avant appel API

### 3. Structure de Réponse API Variable
**Problème**: Réponse API peut être `{status: 'success', data: {...}}` ou `{autorisations: [...]}`
**Solution**: Parsing flexible dans `getAutorisations()`

---

## 🚨 Erreurs Actuellement Rencontrées

### 1. Erreur 400 - Bad Request lors de l'Acceptation
**Erreur**: `POST /api/patient/dmp/autorisations/1/accepter 400 (Bad Request)`
**Contexte**: Tentative d'accepter une autorisation déjà active
**Logs associés**:
```
🔍 dmpApi: === DÉBUT ACCEPTATION AUTORISATION ===
📋 dmpApi: autorisationId: 1
📊 dmpApi: Statut actuel de l'autorisation: {id_acces: 1, statut: 'actif', ...}
⚠️ dmpApi: L'autorisation est déjà active, pas besoin d'acceptation
```
**Solution implémentée**: Vérification préventive du statut avant appel API

### 2. Erreur de Correspondance Notification/Autorisation
**Problème**: Mismatch entre `id_notification` (27) et `id_acces` (1)
**Erreur**: `Erreur: Impossible de trouver l'autorisation correspondante`
**Contexte**: La fonction `findAutorisationIdFromNotification` ne trouve pas de correspondance
**Logs typiques**:
```
🔍 dmpApi: Tentative de correspondance pour notification: {id_notification: 27, professionnel_id: 2}
❌ dmpApi: Aucune autorisation correspondante trouvée
```
**Solution implémentée**: Logique de correspondance flexible avec fallbacks

### 3. Erreur de Parsing API Response
**Problème**: Structure de réponse API incohérente
**Erreur**: `DMP: Résultat du test d'existence: {exists: false, status: 'no_data'}`
**Contexte**: La fonction `getAutorisations` ne parse pas correctement la réponse
**Logs typiques**:
```
📄 dmpApi: Réponse getAutorisations reçue: {status: 'success', data: {...}}
⚠️ dmpApi: Structure de réponse inattendue
```
**Solution implémentée**: Parsing flexible des réponses API

### 4. Erreur de Cache/Version
**Problème**: L'application utilise une version mise en cache
**Symptôme**: Les modifications de code ne sont pas prises en compte
**Solution**: Redémarrage de `npm start`

### 5. Erreur ESLint - Comparaisons Strictes
**Erreur**: `Expected '===' and instead saw '=='`
**Fichiers concernés**: `src/services/api/dmpApi.js` lignes 574 et 608
**Solution**: Remplacement de `==` par `===` pour les comparaisons strictes

### 6. Erreur de Logique de Correspondance Trop Stricte
**Problème**: La correspondance notification/autorisation échoue
**Erreur**: `Autorisation non trouvée dans la liste`
**Contexte**: Logique de correspondance trop restrictive
**Solution implémentée**: 
- Correspondance par `professionnel_id` sans vérification de statut
- Tolérance de 10 minutes pour les dates
- Fallback sur la seule autorisation disponible

### 7. Erreur de Gestion d'État Incohérente
**Problème**: Les notifications ne se mettent pas à jour après action
**Contexte**: Les états frontend ne sont pas synchronisés avec l'API
**Solution implémentée**: Rechargement des données après chaque action

### 8. Erreur de Validation Côté Frontend
**Problème**: Validation insuffisante avant envoi à l'API
**Contexte**: Tentative d'actions sur des autorisations invalides
**Solution implémentée**: Vérifications préventives dans `accepterAutorisation` et `refuserAutorisation`

### 9. Erreur de Debug Insuffisant
**Problème**: Manque d'informations pour diagnostiquer les problèmes
**Contexte**: Logs insuffisants pour tracer le flux de données
**Solution implémentée**: Logs détaillés avec marqueurs de début/fin et stack traces

### 10. Erreur de Gestion des Timeouts
**Problème**: Pas de gestion des timeouts API
**Contexte**: Appels API qui peuvent prendre du temps
**Solution recommandée**: Implémenter des timeouts et retry automatiques

---

## 🧪 Tests et Validation

### 1. Tests Manuels Recommandés
```javascript
// 1. Vérifier la récupération des notifications
GET /api/patient/dmp/autorisations/notifications

// 2. Vérifier la récupération des autorisations
GET /api/patient/dmp/autorisations

// 3. Tester l'acceptation d'une autorisation
POST /api/patient/dmp/autorisations/1/accepter
Body: {"commentaire": "Test"}

// 4. Tester le refus d'une autorisation
POST /api/patient/dmp/autorisations/1/refuser
Body: {"raison_refus": "Test"}
```

### 2. Validation des Données
**Notifications**:
- `id_notification` doit être présent
- `professionnel_id` doit correspondre à une autorisation
- `date_creation` doit être cohérente

**Autorisations**:
- `id_acces` doit être unique
- `statut` doit être valide ('attente_validation', 'actif', 'refuse', 'expire')
- `professionnel_id` doit correspondre à un professionnel existant

---

## 🔧 Configuration Recommandée

### 1. Variables d'Environnement
```javascript
// .env
REACT_APP_API_BASE_URL=http://localhost:3000/api
REACT_APP_DEBUG_MODE=true
```

### 2. Headers API
```javascript
// Configuration axios dans dmpApi.js
headers: {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ${token}'
}
```

---

## 📊 Métriques et Monitoring

### 1. Logs à Surveiller
- **Succès**: `✅ dmpApi: Autorisation acceptée avec succès`
- **Erreurs**: `❌ dmpApi: Erreur lors de l'acceptation`
- **Warnings**: `⚠️ dmpApi: L'autorisation est déjà active`

### 2. Points de Contrôle
- Correspondance notification/autorisation
- Statut des autorisations avant action
- Réponses API cohérentes
- Gestion des erreurs 400/404

---

## 🚀 Prochaines Étapes

### 1. Améliorations Suggérées
- [ ] Ajouter des tests unitaires pour les fonctions API
- [ ] Implémenter un système de retry automatique
- [ ] Ajouter des métriques de performance
- [ ] Créer une interface d'administration pour les autorisations

### 2. Optimisations Possibles
- [ ] Cache des autorisations côté frontend
- [ ] Pagination des notifications
- [ ] Notifications en temps réel (WebSocket)
- [ ] Validation côté serveur renforcée

---

## 📞 Support et Debug

### 1. Commandes de Debug
```bash
# Redémarrer l'application
npm start

# Vérifier les logs
# Ouvrir la console du navigateur (F12)
# Filtrer par "dmpApi" ou "DMP:"
```

### 2. Points de Contact
- **Frontend**: `src/pages/DMP.js`
- **API Service**: `src/services/api/dmpApi.js`
- **Composants**: `src/components/dmp/`

---

*Dernière mise à jour: Janvier 2024*
*Version: 1.0*
