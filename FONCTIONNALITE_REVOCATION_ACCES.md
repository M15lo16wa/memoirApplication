# Fonctionnalité de Révocation d'Accès DMP

## Vue d'ensemble

La fonctionnalité de révocation d'accès permet aux patients de révoquer (annuler) l'accès d'un professionnel de santé à leur dossier médical partagé (DMP), même après que l'autorisation ait été acceptée et soit active.

## Implémentation

### 1. API Backend (`dmpApi.js`)

#### Nouvelle fonction `revokerAutorisation`
```javascript
export const revokerAutorisation = async (autorisationId, raisonRevocation) => {
    const response = await dmpApi.patch(`/access/authorization/${autorisationId}`, { 
        statut: 'revoke', 
        raisonRevocation 
    });
    return response.data.data;
};
```

**Endpoint utilisé** : `PATCH /access/authorization/{autorisationId}`
**Paramètres** :
- `statut: 'revoke'` - Marque l'autorisation comme révoquée
- `raisonRevocation` - Raison de la révocation (obligatoire)

### 2. Interface Utilisateur (`AutorisationCard.js`)

#### Bouton de révocation
- **Affichage** : Visible uniquement pour les autorisations avec le statut `'actif'`
- **Style** : Bouton rouge compact avec icône "X"
- **Position** : Dans l'en-tête de la section "Accès actif"

```javascript
<button
  onClick={handleRevoke}
  className="flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors shadow-sm"
>
  <FaTimes className="w-3 h-3 mr-1" />
  Révoquer
</button>
```

#### Modal de confirmation
- **Titre** : "Révoquer l'accès"
- **Champ obligatoire** : Raison de la révocation
- **Validation** : Le bouton est désactivé si la raison n'est pas renseignée
- **Actions** : Annuler / Révoquer

### 3. Gestion des États

#### Nouveaux états ajoutés
```javascript
const [raisonRevocation, setRaisonRevocation] = useState('');
```

#### Logique de validation
```javascript
disabled={loading || 
  (actionType === 'refuse' && !raisonRefus.trim()) ||
  (actionType === 'revoke' && !raisonRevocation.trim())
}
```

#### Nettoyage des états
```javascript
setRaisonRevocation('');
```

### 4. Statut Visuel

#### Badge "Révoqué"
```javascript
case 'revoke':
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
    <FaTimes className="w-3 h-3 mr-1" />
    Révoqué
  </span>;
```

## Flux Utilisateur

### 1. Révocation d'un accès actif
1. **Patient** : Consulte ses autorisations dans l'onglet "droits-acces"
2. **Identification** : Repère une autorisation active (statut "actif")
3. **Action** : Clique sur le bouton "Révoquer"
4. **Confirmation** : Remplit le formulaire avec la raison de révocation
5. **Validation** : Confirme la révocation
6. **Résultat** : L'autorisation passe au statut "revoke"

### 2. Gestion des erreurs
- **Validation** : La raison de révocation est obligatoire
- **Feedback** : Messages d'erreur et de succès appropriés
- **Rollback** : En cas d'erreur, l'autorisation reste active

## Sécurité et Contrôles

### 1. Vérifications côté client
- Seuls les patients peuvent révoquer leurs propres autorisations
- La raison de révocation est obligatoire
- Confirmation requise avant la révocation

### 2. Vérifications côté serveur
- L'endpoint vérifie l'authentification du patient
- Validation que l'autorisation appartient bien au patient
- Enregistrement de la raison de révocation

## Cas d'Usage

### 1. Révocation immédiate
- **Situation** : Le patient change d'avis sur un accès accordé
- **Action** : Révoque l'accès sans attendre l'expiration
- **Impact** : L'accès est immédiatement suspendu

### 2. Révocation pour cause de changement
- **Situation** : Le patient change de médecin traitant
- **Action** : Révoque l'accès de l'ancien médecin
- **Impact** : Sécurisation du dossier médical

### 3. Révocation pour cause de sécurité
- **Situation** : Le patient suspecte un accès non autorisé
- **Action** : Révoque l'accès par précaution
- **Impact** : Protection immédiate des données

## Intégration avec l'API

### 1. Endpoint utilisé
```
PATCH /api/access/authorization/{autorisationId}
```

### 2. Corps de la requête
```json
{
  "statut": "revoke",
  "raisonRevocation": "Changement de médecin traitant"
}
```

### 3. Réponse attendue
```json
{
  "success": true,
  "data": {
    "id_acces": 123,
    "statut": "revoke",
    "raisonRevocation": "Changement de médecin traitant",
    "date_revocation": "2024-01-15T10:30:00Z"
  }
}
```

## Tests et Validation

### 1. Tests fonctionnels
- [ ] Révocation d'un accès actif
- [ ] Validation de la raison obligatoire
- [ ] Confirmation de la révocation
- [ ] Mise à jour du statut visuel
- [ ] Rechargement de la liste

### 2. Tests de sécurité
- [ ] Seuls les patients peuvent révoquer
- [ ] Validation côté serveur
- [ ] Enregistrement des actions

### 3. Tests d'interface
- [ ] Affichage du bouton pour les accès actifs
- [ ] Modal de confirmation
- [ ] Messages d'erreur et de succès
- [ ] Responsive design

## Maintenance et Évolutions

### 1. Améliorations futures
- **Historique des révocations** : Traçabilité des actions
- **Notifications** : Informer le professionnel de la révocation
- **Raison prédéfinies** : Liste de raisons communes
- **Révocation temporaire** : Suspension temporaire de l'accès

### 2. Monitoring
- **Logs** : Enregistrement des révocations
- **Métriques** : Taux de révocation par type d'accès
- **Alertes** : Détection de révocations multiples

## Conclusion

La fonctionnalité de révocation d'accès renforce le contrôle des patients sur leurs données médicales partagées, offrant une sécurité supplémentaire et une flexibilité dans la gestion des autorisations DMP.
