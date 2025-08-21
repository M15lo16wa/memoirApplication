# 🔧 Centre de Diagnostic - Problèmes de Navigation et Déconnexion

## 🚨 Problème Identifié

Vous rencontrez des **déconnexions automatiques** lors de la navigation entre onglets dans votre application médicale. Ce centre de diagnostic vous aidera à identifier et résoudre la cause exacte.

## 🛠️ Outils de Diagnostic Disponibles

### 1. 🔍 Debugger d'Authentification
**Fonction :** Surveille l'état d'authentification en temps réel et trace les changements de tokens.

**Fonctionnalités :**
- Surveillance continue des tokens d'authentification
- Historique des changements d'état
- Détection des modifications localStorage
- Logs détaillés de l'authentification
- Vérification manuelle et automatique

**Utilisation :**
1. Ouvrir le composant `AuthenticationDebugger`
2. Démarrer la surveillance
3. Observer les changements en temps réel
4. Analyser l'historique des modifications

### 2. 🚨 Moniteur de Déconnexion
**Fonction :** Détecte automatiquement les déconnexions et reconnexions lors de la navigation.

**Fonctionnalités :**
- Détection en temps réel des déconnexions
- Surveillance des changements de route
- Analyse des modifications localStorage
- Historique des événements d'authentification
- Alertes automatiques

**Utilisation :**
1. Ouvrir le composant `DisconnectionMonitor`
2. Démarrer la surveillance
3. Naviguer entre les onglets
4. Observer les événements détectés

### 3. 🧪 Test de Navigation
**Fonction :** Simule la navigation entre onglets pour tester la stabilité de l'authentification.

**Fonctionnalités :**
- Changement d'onglets simulé
- Vérification automatique de l'état
- Test de navigation entre pages
- Affichage en temps réel des données
- Contrôles de test manuels

**Utilisation :**
1. Ouvrir le composant `TestNavigationDebug`
2. Changer d'onglet pour déclencher les vérifications
3. Utiliser les boutons de navigation
4. Observer la stabilité de l'authentification

## 📋 Procédure de Diagnostic

### Étape 1 : Préparation
1. **Connectez-vous** en tant que médecin
2. **Ouvrez la console** du navigateur (F12)
3. **Accédez au centre de diagnostic** : `/diagnostic`

### Étape 2 : Surveillance de Base
1. **Démarrez le moniteur de déconnexion**
2. **Laissez la page ouverte** sans naviguer
3. **Observez** s'il y a des déconnexions automatiques

### Étape 3 : Test de Navigation
1. **Démarrez le test de navigation**
2. **Changez d'onglet** plusieurs fois
3. **Observez** les logs dans la console
4. **Vérifiez** l'état d'authentification

### Étape 4 : Analyse des Logs
1. **Ouvrez le debugger d'authentification**
2. **Lancez la surveillance** continue
3. **Reproduisez le problème** de navigation
4. **Analyser** l'historique des changements

## 🔍 Causes Possibles Identifiées

### 1. Nettoyage Automatique des Tokens
- **Problème :** Les tokens temporaires 2FA sont supprimés incorrectement
- **Symptôme :** Déconnexion après validation 2FA
- **Solution :** Vérifier la logique de `cleanupTemporaryTokens`

### 2. Vérification d'Authentification Excessive
- **Problème :** Trop de vérifications déclenchent des nettoyages
- **Symptôme :** Déconnexion lors de changements d'onglets
- **Solution :** Optimiser les `useEffect` et vérifications

### 3. Gestion des Erreurs 401
- **Problème :** Les erreurs d'API déclenchent des déconnexions automatiques
- **Symptôme :** Déconnexion après appel API échoué
- **Solution :** Améliorer la gestion des erreurs d'authentification

### 4. Conflit Entre Composants
- **Problème :** Plusieurs composants nettoient les mêmes données
- **Symptôme :** Déconnexion aléatoire
- **Solution :** Centraliser la gestion des tokens

### 5. Timing des useEffect
- **Problème :** Les vérifications se déclenchent au mauvais moment
- **Symptôme :** Déconnexion lors du montage/démontage
- **Solution :** Optimiser les dépendances des useEffect

## 🛠️ Solutions Proposées

### 1. Logs Détaillés
- ✅ **Implémenté :** Logs complets dans toutes les fonctions d'authentification
- ✅ **Implémenté :** Traçage des changements d'état
- ✅ **Implémenté :** Surveillance des modifications localStorage

### 2. Surveillance en Temps Réel
- ✅ **Implémenté :** Détection automatique des changements d'état
- ✅ **Implémenté :** Alertes en temps réel
- ✅ **Implémenté :** Historique des événements

### 3. Tests de Navigation
- ✅ **Implémenté :** Simulation des changements d'onglets
- ✅ **Implémenté :** Vérification automatique de l'état
- ✅ **Implémenté :** Tests de navigation entre pages

### 4. Analyse des Tokens
- ✅ **Implémenté :** Vérification de la persistance des données
- ✅ **Implémenté :** Détection des tokens supprimés
- ✅ **Implémenté :** Analyse des modifications

### 5. Optimisation des Vérifications
- 🔄 **En cours :** Réduction des vérifications d'authentification inutiles
- 🔄 **En cours :** Optimisation des useEffect
- 🔄 **En cours :** Centralisation de la gestion des tokens

## 📊 Métriques de Diagnostic

| Outil | Couverture | Fréquence | Détection |
|-------|------------|-----------|-----------|
| **Debugger d'Auth** | 100% | Continue | Temps réel |
| **Moniteur Déconnexion** | 100% | Continue | Automatique |
| **Test Navigation** | 100% | Manuel | Immédiate |

## 🚀 Utilisation Avancée

### Surveillance Continue
```javascript
// Démarrer la surveillance automatique
const startMonitoring = () => {
    // Surveillance toutes les 2 secondes
    setInterval(checkAuthenticationState, 2000);
};
```

### Détection d'Anomalies
```javascript
// Détecter les changements suspects
const detectAnomalies = (currentState, previousState) => {
    if (wasAuthenticated && !isAuthenticated) {
        console.log('🚨 DÉCONNEXION DÉTECTÉE');
        logDisconnectionEvent(currentState, previousState);
    }
};
```

### Logs Structurés
```javascript
// Logs détaillés pour le débogage
console.log('🔍 Vérification authentification:', {
    timestamp: new Date().toISOString(),
    url: window.location.pathname,
    tokens: getTokenStatus(),
    localStorage: getLocalStorageState()
});
```

## 📝 Exemples de Logs

### Log de Vérification d'Authentification
```
🔍 ProtectedRoute - Vérification authentification...
  - URL actuelle: /medecin
  - Timestamp: 2024-01-15T10:30:00.000Z
  - Types autorisés: ['medecin']
  - 🔑 Tokens disponibles:
    - token: ✅ Présent ({"id_professionnel":79,...)
    - jwt: ❌ Absent
    - medecin: ✅ Présent ({"id_professionnel":79,...)
    - patient: ❌ Absent
  - 🔍 Résultats des vérifications:
    - Type d'utilisateur détecté: medecin
    - Médecin authentifié: true
    - Patient authentifié: false
    - Authentification générale: true
✅ ProtectedRoute - Utilisateur autorisé, affichage du contenu
```

### Log de Changement d'État
```
🔄 AuthenticationDebugger - Changement détecté:
  previous: { authToken: { present: true, ... } }
  current: { authToken: { present: false, ... } }
🚨 DÉCONNEXION DÉTECTÉE - Token supprimé ou modifié
```

## 🔧 Résolution des Problèmes

### Problème : Déconnexion lors du changement d'onglet
**Solution :**
1. Vérifier les `useEffect` dans les composants d'onglets
2. S'assurer que `cleanupTemporaryTokens` ne supprime pas les vrais tokens
3. Optimiser les vérifications d'authentification

### Problème : Token supprimé après validation 2FA
**Solution :**
1. Vérifier la logique dans `verifyAndEnable2FA`
2. S'assurer que le vrai token est stocké avant le nettoyage
3. Utiliser le fallback vers `validate-2fa-session`

### Problème : Vérifications d'authentification excessives
**Solution :**
1. Réduire la fréquence des vérifications
2. Optimiser les dépendances des `useEffect`
3. Centraliser la logique d'authentification

## 📞 Support et Aide

Si vous rencontrez des difficultés avec ces outils de diagnostic :

1. **Vérifiez la console** pour les erreurs JavaScript
2. **Consultez les logs** détaillés dans chaque composant
3. **Utilisez la surveillance continue** pour capturer les événements
4. **Testez avec la navigation simulée** pour reproduire le problème

## 🎯 Objectif Final

L'objectif de ce centre de diagnostic est de vous permettre d'identifier **exactement** quand et pourquoi vous êtes déconnecté lors de la navigation entre onglets, afin de pouvoir corriger le problème à sa source.

**Résultat attendu :** Navigation fluide entre les onglets sans déconnexion automatique, avec une authentification stable et des tokens persistants.
