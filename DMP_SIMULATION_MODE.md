# Mode Simulation DMP

## Vue d'ensemble

Le système DMP a été converti en mode simulation pour faciliter le développement et les tests. Toutes les routes DMP réelles ont été remplacées par des simulations qui retournent des données fictives mais réalistes.

## Changements effectués

### 1. Frontend (`src/services/api/dmpApi.js`)

**Avant :** Appels API réels vers le backend
**Après :** Fonctions simulées qui retournent des données fictives

#### Fonctions principales simulées :
- `getDMP()` - Retourne les données DMP simulées
- `getHistoriqueMedical()` - Historique médical fictif
- `getAutorisations()` - Autorisations simulées
- `getDroitsAccesNotifications()` - Notifications simulées
- `getAutoMesuresDMP()` - Auto-mesures fictives
- `getRendezVousDMP()` - Rendez-vous simulés
- `getDocumentsDMP()` - Documents fictifs
- `getTableauDeBord()` - Tableau de bord simulé

#### Nouvelles fonctions d'autorisation simulées :
- `requestDMPAccess()` - Demande d'accès simulée
- `accepterAutorisation()` - Acceptation d'autorisation simulée
- `refuserAutorisation()` - Refus d'autorisation simulé
- `createDirectAutorisation()` - Création d'autorisation directe simulée

### 2. Backend (`backend/server.js`)

**Avant :** Logique complexe avec gestion d'état et validation
**Après :** Routes simples qui retournent des données simulées

#### Routes principales simulées :

##### Routes Médecin :
- `GET /api/medecin/dmp/test/systeme` - Test système
- `POST /api/medecin/dmp/authentification-cps` - Authentification CPS
- `POST /api/medecin/dmp/creer-session` - Création de session
- `POST /api/medecin/dmp/demande-acces` - Demande d'accès
- `GET /api/medecin/dmp/historique/:patientId` - Historique d'accès
- `GET /api/medecin/dmp/notifications/:sessionId` - Notifications

##### Routes Patient :
- `GET /api/patient/dmp` - Données DMP
- `GET /api/patient/dmp/historique-medical` - Historique médical
- `GET /api/patient/dmp/autorisations` - Autorisations
- `GET /api/patient/dmp/droits-acces/notifications` - Notifications
- `GET /api/patient/dmp/auto-mesures` - Auto-mesures
- `GET /api/patient/dmp/rendez-vous` - Rendez-vous
- `GET /api/patient/dmp/documents` - Documents
- `GET /api/patient/dmp/tableau-de-bord` - Tableau de bord

## Données de simulation

### Données DMP simulées :
```javascript
{
  patient_id: "PAT001",
  nom: "Dupont",
  prenom: "Jean",
  date_naissance: "1985-03-15",
  groupe_sanguin: "A+",
  allergies: ["Pénicilline", "Latex"],
  antecedents: [...],
  traitements_actuels: [...]
}
```

### Autorisations simulées :
```javascript
[
  {
    id_acces: "AUTH001",
    professionnel_id: "MED001",
    professionnel_nom: "Dr. Martin",
    type_acces: "lecture",
    statut: "actif",
    date_creation: "2024-01-10T09:00:00Z"
  }
]
```

### Notifications simulées :
```javascript
[
  {
    id: 1,
    titre: "Nouvelle demande d'accès DMP",
    message: "Le Dr. Martin a demandé l'accès à votre DMP",
    type: "demande_acces",
    lue: false
  }
]
```

## Avantages du mode simulation

1. **Développement rapide** - Pas besoin d'attendre les vraies APIs
2. **Tests facilités** - Données prévisibles et contrôlées
3. **Démo fonctionnelle** - Interface complètement opérationnelle
4. **Indépendance** - Fonctionne sans backend complexe
5. **Debugging simplifié** - Logs clairs et données cohérentes

## Logs de simulation

Toutes les fonctions simulées affichent des logs avec le préfixe `📄 Simulation` :
```
📄 Simulation getDMP - Retour des données DMP simulées
📄 Simulation - Test système DMP
📄 Simulation - Authentification CPS: { numero_adeli: "12345", code_cps: "1234" }
```

## Migration vers le mode réel

Pour revenir au mode réel plus tard :

1. **Frontend** : Remplacer les fonctions simulées par de vrais appels API
2. **Backend** : Implémenter la vraie logique métier dans chaque route
3. **Base de données** : Connecter les routes aux vraies tables
4. **Authentification** : Implémenter la vraie validation JWT
5. **Sécurité** : Ajouter les vraies vérifications d'autorisation

## Structure des réponses

Toutes les réponses suivent le format standard :
```javascript
{
  success: true,
  data: {
    // Données spécifiques à l'endpoint
  },
  message: "Message de succès (simulation)"
}
```

## Endpoints disponibles

### Médecin
- `GET /api/medecin/dmp/test/systeme`
- `POST /api/medecin/dmp/authentification-cps`
- `POST /api/medecin/dmp/creer-session`
- `POST /api/medecin/dmp/demande-acces`
- `GET /api/medecin/dmp/historique/:patientId`
- `GET /api/medecin/dmp/notifications/:sessionId`
- `GET /api/medecin/dmp/session/:sessionId/statut`
- `POST /api/medecin/dmp/session/:sessionId/fermer`
- `GET /api/medecin/dmp/autorisations`

### Patient
- `GET /api/patient/dmp`
- `PUT /api/patient/dmp`
- `GET /api/patient/dmp/historique-medical`
- `POST /api/patient/dmp/historique-medical`
- `GET /api/patient/dmp/journal-activite`
- `GET /api/patient/dmp/droits-acces`
- `PUT /api/patient/dmp/droits-acces`
- `GET /api/patient/dmp/droits-acces/notifications`
- `PUT /api/patient/dmp/droits-acces/notifications/:notificationId/lue`
- `POST /api/patient/dmp/droits-acces/demandes/:demandeId/reponse`
- `GET /api/patient/dmp/notifications/stats`
- `PUT /api/patient/dmp/droits-acces/notifications/marquer-toutes-lues`
- `GET /api/patient/dmp/droits-acces/notifications/:notificationId`
- `GET /api/patient/dmp/auto-mesures`
- `POST /api/patient/dmp/auto-mesures`
- `GET /api/patient/dmp/rendez-vous`
- `POST /api/patient/dmp/rendez-vous`
- `GET /api/patient/dmp/documents`
- `POST /api/patient/dmp/upload-document`
- `GET /api/patient/dmp/bibliotheque-sante`
- `GET /api/patient/dmp/statistiques`
- `GET /api/patient/dmp/tableau-de-bord`
- `GET /api/patient/dmp/rappels`
- `GET /api/patient/dmp/autorisations`
- `POST /api/patient/dmp/autorisations`
- `POST /api/patient/dmp/autorisations/:autorisationId/accepter`
- `POST /api/patient/dmp/autorisations/:autorisationId/refuser`

### Général
- `GET /api/dmp/verifier-acces`
- `GET /api/dmp/autorisations/:autorisationId/duree-restante`
- `GET /api/health`

## Notes importantes

1. **Authentification** : Tous les endpoints nécessitent un token Bearer (simulé)
2. **Données cohérentes** : Les données simulées sont cohérentes entre les endpoints
3. **Pas de persistance** : Les données ne sont pas sauvegardées entre les redémarrages
4. **Logs détaillés** : Toutes les actions sont loggées pour le debugging
5. **Format standard** : Toutes les réponses suivent le même format

## Prochaines étapes

1. Tester toutes les fonctionnalités DMP en mode simulation
2. Valider l'interface utilisateur avec les données simulées
3. Identifier les améliorations nécessaires
4. Préparer la migration vers le mode réel
5. Documenter les spécifications techniques pour l'implémentation réelle
