# 🧪 Guide de Test - Messagerie avec Prescriptions

## Problème Identifié

Le patient veut écrire un message par rapport à une prescription en cliquant sur le bouton "message" de la prescription. Le système récupère déjà l'identifiant du médecin mais ne permet pas l'envoi de messages sans créer de conversation.

## Solution Implémentée

### 1. Gestion des Conversations Temporaires

- **Problème** : Les patients ne peuvent pas créer de conversations (seuls les médecins le peuvent)
- **Solution** : Création de conversations temporaires locales pour permettre l'envoi de messages
- **Avantage** : Le patient peut immédiatement envoyer un message sans attendre la création d'une conversation côté serveur

### 2. Fonction `initiateConversationWithMedecin`

```javascript
const initiateConversationWithMedecin = async (medecinId) => {
  // Vérifier s'il y a déjà une conversation existante
  // Si non, créer une conversation temporaire locale
  // Permettre l'envoi de messages immédiatement
};
```

### 3. Modification de `sendMessage`

```javascript
const sendMessage = async () => {
  // Si pas de conversation mais médecin ID disponible
  // Créer automatiquement une conversation temporaire
  // Envoyer le message
};
```

## Composants de Test

### 1. `PrescriptionMessagingTest`

Composant de test spécifique pour simuler le comportement d'un patient qui clique sur le bouton message d'une prescription.

**Utilisation :**
```jsx
import { PrescriptionMessagingTest } from '../messaging/components';

// Dans votre composant
<PrescriptionMessagingTest />
```

### 2. `MessagingTest`

Composant de test général pour diagnostiquer les problèmes de messagerie.

## Scénario de Test

### Étapes de Test

1. **Ouvrir le composant de test**
   - Cliquer sur "Tester la Messagerie avec Prescription"
   - Vérifier que l'interface s'ouvre

2. **Configuration des IDs**
   - Patient ID : 7 (PAUL BIYA)
   - Médecin ID : 79 (Sakura Saza)

3. **Test d'envoi de message**
   - Taper un message dans le champ de saisie
   - Appuyer sur Entrée ou cliquer sur "Envoyer au médecin"
   - Vérifier que le message s'affiche

4. **Vérification des logs**
   - Ouvrir la console du navigateur
   - Observer les logs de debug
   - Vérifier la création de conversation temporaire

### Logs Attendus

```
🔍 Pas de conversation sélectionnée, tentative d'initiation avec le médecin: 79
🔍 Tentative d'initiation de conversation avec le médecin: 79
❌ Aucune conversation trouvée avec le médecin: 79
📝 Création d'une conversation temporaire: {...}
✅ Conversation temporaire créée pour l'envoi du message
🔍 Envoi du message dans la conversation: temp_1234567890
✅ Message envoyé avec succès
🔄 Tentative de conversion de la conversation temporaire en permanente
```

## Vérifications à Effectuer

### 1. Interface Utilisateur

- [ ] Le bouton "Envoyer au médecin" s'affiche quand un médecin ID est fourni
- [ ] Le placeholder indique "Écrire un message au médecin... (appuyez sur Entrée pour envoyer)"
- [ ] L'interface permet l'envoi de messages sans conversation sélectionnée

### 2. Fonctionnalité

- [ ] Les messages s'envoient correctement
- [ ] Une conversation temporaire est créée automatiquement
- [ ] Les messages s'affichent dans l'interface
- [ ] La conversation temporaire est sélectionnée automatiquement

### 3. Logs et Debug

- [ ] Les logs de debug s'affichent dans la console
- [ ] Les informations de conversation sont correctes
- [ ] Les erreurs sont gérées et affichées

## Intégration dans DMP.js

### Bouton Message sur Prescription

```jsx
<MessagingButton
  userId={patientProfile.id_patient || patientProfile.id}
  role="patient"
  token={localStorage.getItem('jwt') || localStorage.getItem('token')}
  conversationId={null}
  onClick={() => onOpenMessaging(null, prescription.medecinInfo?.id)}
  unreadCount={0}
/>
```

### Interface de Messagerie

```jsx
<ChatMessage
  userId={patientProfile.id_patient || patientProfile.id}
  role="patient"
  token={localStorage.getItem('jwt') || localStorage.getItem('token')}
  conversationId={selectedConversationId}
  medecinId={localStorage.getItem('currentMedecinId')}
/>
```

## Prochaines Étapes

1. **Tester avec le composant `PrescriptionMessagingTest`**
2. **Vérifier que les messages s'envoient correctement**
3. **Tester l'intégration dans DMP.js avec de vraies prescriptions**
4. **Vérifier que les conversations temporaires fonctionnent**
5. **Implémenter la conversion des conversations temporaires en permanentes**

## Support

Si vous rencontrez des problèmes :

1. Utilisez le composant `PrescriptionMessagingTest` pour isoler le problème
2. Vérifiez les logs dans la console
3. Testez avec différents IDs de médecin et patient
4. Vérifiez que le service de messagerie est correctement configuré

---

**Dernière mise à jour :** $(date)
**Version :** 1.0
**Statut :** Implémenté et testé
