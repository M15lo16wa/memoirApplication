# Fonctionnalité de Révocation Automatique d'Accès

## Vue d'ensemble

Cette fonctionnalité permet de révoquer automatiquement l'accès d'un médecin à un dossier patient dès qu'il clique sur "Quitter dossier patient". Cela garantit la sécurité des données en s'assurant qu'un médecin ne peut plus accéder au dossier d'un patient une fois qu'il a quitté la consultation.

## Fonctionnement

### 1. Bouton "Quitter dossier patient"

- **Localisation** : Header de la page `DMPPatientView.js`
- **Comportement** : Affiche une modal de confirmation avant de quitter
- **État visuel** : 
  - Normal : Bouton bleu avec icône de flèche
  - En cours de révocation : Bouton gris avec spinner et texte "Révocation en cours..."

### 2. Modal de confirmation

La modal affiche :
- ⚠️ **Avertissement clair** que l'accès sera révoqué
- **Nom du patient** concerné
- **Deux boutons** :
  - "Annuler" : Ferme la modal sans action
  - "Quitter et révoquer l'accès" : Confirme l'action

### 3. Processus de révocation

1. **Vérification des identifiants** : Récupération de l'ID du médecin et du patient
2. **Appel API** : `revokerAutorisationMedecin(professionnelId, patientId, raison)`
3. **Vérification** : Confirmation que l'accès a bien été révoqué
4. **Redirection** : Retour à la page DMP principale

## API Endpoints

### Révocation d'accès
```javascript
DELETE /api/access/authorization/{patientId}
```

**Paramètres :**
- `patientId` : ID du patient (utilisé comme autorisationId)
- `reason` : Raison de la révocation (ex: "Accès révoqué automatiquement lors de la fermeture du dossier")
- `type` : Type de révocation ("medecin_patient_revocation")
- `professionnelId` : ID du médecin qui révoque l'accès

### Vérification d'accès
```javascript
GET /api/access/check/{professionnelId}/{patientId}/status
```

**Retour :**
```json
{
  "hasAccess": false,
  "status": "revoked",
  "message": "Accès révoqué"
}
```

## Fonctions d'API (Frontend)

### `revokerAutorisationMedecin(professionnelId, patientId, raisonRevocation)`

Révoque l'accès d'un médecin spécifique à un patient spécifique.

**Paramètres :**
- `professionnelId` : ID du professionnel de santé
- `patientId` : ID du patient
- `raisonRevocation` : Raison de la révocation

**Retour :** Promise avec la réponse de l'API

**Fallback :** Si l'endpoint spécifique n'existe pas, utilise l'endpoint général

### `verifierAccesMedecinPatient(professionnelId, patientId)`

Vérifie si un médecin a encore accès à un patient.

**Retour :**
```javascript
{
  hasAccess: boolean,
  status: string,
  message: string
}
```

## Sécurité

### Garanties
- ✅ **Révocation immédiate** : L'accès est révoqué dès la confirmation
- ✅ **Vérification** : Confirmation que l'accès a bien été révoqué
- ✅ **Logs complets** : Toutes les actions sont tracées dans la console
- ✅ **Gestion d'erreur** : Même en cas d'erreur, l'utilisateur quitte le dossier

### Prévention
- ⚠️ **Confirmation obligatoire** : L'utilisateur doit confirmer son intention
- ⚠️ **Avertissement clair** : Message explicite sur les conséquences
- ⚠️ **Pas de retour en arrière** : Une fois confirmé, l'action est irréversible

## Interface utilisateur

### États du bouton
1. **Normal** : Bouton bleu avec icône et texte "Quitter dossier patient"
2. **Désactivé** : Bouton gris avec spinner et texte "Révocation en cours..."
3. **Modal ouverte** : Bouton reste dans son état actuel

### Modal de confirmation
- **Overlay** : Fond noir semi-transparent
- **Z-index** : 50 (au-dessus de tout le contenu)
- **Responsive** : S'adapte aux différentes tailles d'écran
- **Accessibilité** : Boutons clairement identifiés et contrastés

## Logs et débogage

### Console logs
```
🔒 Révocation automatique de l'accès au dossier patient...
🔒 Révocation de l'accès: Médecin 123 → Patient 456
✅ Accès révoqué avec succès
✅ Vérification confirmée: accès révoqué
```

### Gestion d'erreur
```
❌ Erreur lors de la révocation de l'accès: [détails]
⚠️ L'accès n'a pas été complètement révoqué
```

## Utilisation

### Pour les médecins
1. Cliquer sur "Quitter dossier patient"
2. Confirmer dans la modal
3. Attendre la révocation (spinner)
4. Être redirigé vers le DMP

### Pour les développeurs
1. **Tester la révocation** : Vérifier les logs dans la console
2. **Vérifier l'API** : S'assurer que les endpoints existent côté backend
3. **Gérer les erreurs** : Vérifier la gestion des cas d'échec

## Maintenance

### Points d'attention
- **Endpoints API** : Vérifier que les routes de révocation existent
- **Gestion d'erreur** : Tester les cas d'échec de l'API
- **Logs** : Surveiller les erreurs de révocation
- **Performance** : La révocation doit être rapide (< 2 secondes)

### Évolutions possibles
- **Historique des révocations** : Traçabilité complète des actions
- **Notifications** : Informer le patient de la révocation
- **Audit trail** : Journal détaillé des accès et révocations
- **Révocation en lot** : Révoquer plusieurs accès simultanément
