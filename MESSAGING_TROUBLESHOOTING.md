# 🔧 Guide de Dépannage - Messagerie DMP

## Problèmes Identifiés et Solutions

### 1. Problème de Création de Conversations

**Symptôme :** Les conversations sont créées côté serveur mais ne s'affichent pas côté client.

**Causes possibles :**
- Désynchronisation entre la création et la récupération
- Problème de formatage des données
- Gestion d'état incorrecte

**Solutions appliquées :**
- ✅ Ajout de logs de debug détaillés
- ✅ Amélioration de la synchronisation des conversations
- ✅ Gestion locale des nouvelles conversations
- ✅ Rechargement automatique après création

### 2. Problème de Récupération des Messages

**Symptôme :** Les messages ne s'affichent pas ou s'affichent mal formatés.

**Causes possibles :**
- Structure de données différente entre serveur et client
- Problème de mapping des champs
- Gestion des timestamps incorrecte

**Solutions appliquées :**
- ✅ Formatage robuste des messages avec fallbacks
- ✅ Gestion des différents formats de données
- ✅ Logs détaillés pour le debugging

### 3. Problème de Synchronisation

**Symptôme :** Les données ne sont pas à jour entre les composants.

**Solutions appliquées :**
- ✅ Mise à jour immédiate de l'état local
- ✅ Rechargement différé depuis le serveur
- ✅ Gestion des doublons avec Map

## Tests et Vérifications

### Composant de Test

Utilisez le composant `MessagingTest` pour diagnostiquer les problèmes :

```jsx
import { MessagingTest } from '../messaging/components';

// Dans votre composant
<MessagingTest />
```

### Vérifications à Effectuer

1. **Connexion au service :**
   - Vérifiez que `signalingService.baseURL` est correct
   - Vérifiez que les tokens sont présents
   - Vérifiez la connexion WebSocket

2. **Création de conversations :**
   - Testez avec des IDs valides
   - Vérifiez la réponse de l'API
   - Vérifiez la mise à jour de l'état local

3. **Récupération des conversations :**
   - Vérifiez la structure de la réponse
   - Vérifiez le formatage des données
   - Vérifiez l'affichage dans l'interface

## Logs de Debug

### Logs Ajoutés

- 🔍 **Chargement des conversations** : Affiche les paramètres et la réponse
- 📨 **Réponse du serveur** : Affiche la structure complète des données
- ✅ **Conversations trouvées** : Affiche le nombre et les détails
- 📝 **Messages formatés** : Affiche le formatage de chaque message
- 🔍 **Création de conversation** : Affiche les paramètres de création

### Utilisation des Logs

1. Ouvrez la console du navigateur
2. Naviguez vers la messagerie
3. Observez les logs pour identifier les problèmes
4. Utilisez le composant de test pour des diagnostics approfondis

## Structure des Données Attendues

### Conversation
```json
{
  "id": "conversation_id",
  "type_conversation": "patient_medecin",
  "titre": "Titre de la conversation",
  "participants": ["patient_id", "medecin_id"],
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Message
```json
{
  "id": "message_id",
  "contenu": "Contenu du message",
  "expediteur_id": "user_id",
  "type_message": "texte",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

## Prochaines Étapes

1. **Tester la messagerie** avec le composant de test
2. **Vérifier les logs** pour identifier les problèmes
3. **Tester la création** de nouvelles conversations
4. **Vérifier l'affichage** des messages existants
5. **Signaler les erreurs** spécifiques rencontrées

## Support

Si vous rencontrez des problèmes persistants :

1. Collectez les logs de la console
2. Notez les étapes de reproduction
3. Testez avec le composant `MessagingTest`
4. Fournissez les détails de l'erreur

---

**Dernière mise à jour :** $(date)
**Version :** 1.0
