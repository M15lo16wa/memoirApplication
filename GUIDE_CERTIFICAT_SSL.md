# 🔐 Guide : Résoudre l'erreur ERR_CERT_AUTHORITY_INVALID

## ❌ Problème identifié

L'erreur `ERR_CERT_AUTHORITY_INVALID` indique que le navigateur refuse le certificat SSL auto-signé du serveur WebSocket.

## ✅ Solutions

### **Solution 1 : Configuration WebSocket côté client (AUTOMATIQUE)**

Cette solution est déjà implémentée dans le code ! Le client WebSocket est configuré pour accepter automatiquement les certificats auto-signés :

```javascript
// Configuration WebSocket avec gestion des certificats
const socket = io('https://192.168.4.81:3443', {
    transports: ['websocket', 'polling'], // Essayer les deux transports
    rejectUnauthorized: false, // Accepter les certificats auto-signés
    timeout: 20000, // Timeout plus long
    forceNew: true, // Forcer une nouvelle connexion
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});
```

**Cette configuration devrait résoudre automatiquement le problème !**

### **Solution 2 : Accepter le certificat dans le navigateur (MANUEL)**

1. **Ouvrez un nouvel onglet** et accédez à :
   ```
   https://192.168.4.81:3443
   ```

2. **Vous verrez une page d'erreur de sécurité** avec :
   - "Votre connexion n'est pas privée"
   - "ERR_CERT_AUTHORITY_INVALID"

3. **Cliquez sur "Avancé"** (en bas de la page)

4. **Cliquez sur "Continuer vers 192.168.4.81 (non sécurisé)"**

5. **Le navigateur acceptera le certificat** pour cette session

6. **Revenez à votre application** - la connexion WebSocket devrait maintenant fonctionner

### **Solution 3 : Configuration Chrome pour accepter les certificats auto-signés**

1. **Fermez Chrome complètement**

2. **Lancez Chrome avec ces paramètres** :
   ```bash
   chrome.exe --ignore-certificate-errors --ignore-ssl-errors --allow-running-insecure-content
   ```

3. **Ou ajoutez ces paramètres au raccourci Chrome** :
   - Clic droit sur le raccourci Chrome
   - Propriétés
   - Dans "Cible", ajoutez à la fin :
   ```
   --ignore-certificate-errors --ignore-ssl-errors --allow-running-insecure-content
   ```

### **Solution 4 : Ajouter le certificat aux certificats de confiance (AVANCÉ)**

1. **Téléchargez le certificat** depuis `https://192.168.4.81:3443`

2. **Installez-le dans le magasin de certificats Windows** :
   - Ouvrez "Gérer les certificats d'ordinateur"
   - Importez le certificat dans "Autorités de certification racines de confiance"

## 🎯 Test de la solution

Après avoir appliqué une des solutions :

1. **Rechargez la page** de votre application
2. **Vérifiez la console** - vous ne devriez plus voir d'erreurs `ERR_CERT_AUTHORITY_INVALID`
3. **La connexion WebSocket devrait s'établir** avec des logs comme :
   ```
   ✅ Connexion WebSocket établie
   🔌 Service de signalisation connecté
   ```

## 📝 Note importante

- **Solution 1** est automatique et déjà implémentée dans le code
- **Solution 2** est manuelle mais simple
- **Solution 3** est pratique pour le développement
- **Solution 4** est permanente mais plus complexe

**Une fois le certificat accepté, WebRTC fonctionnera parfaitement !** 🎉
