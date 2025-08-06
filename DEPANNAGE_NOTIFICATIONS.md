# Guide de Dépannage - Notifications DMP

## 🔍 Problème Identifié
Les notifications des droits d'accès ne s'affichent pas sur la page DMP.

## 🛠️ Solutions Implémentées

### 1. Ajout de Logs de Débogage
- ✅ Logs ajoutés dans `loadInitialData()` pour tracer le chargement
- ✅ Logs ajoutés dans `loadTabData()` pour l'onglet droits-acces
- ✅ Logs ajoutés dans le rendu pour voir l'état des notifications

### 2. Données Mock de Fallback
- ✅ Données mock ajoutées dans les blocs catch
- ✅ 3 notifications de test avec différents statuts
- ✅ Gestion des erreurs améliorée

### 3. Vérifications à Effectuer

#### A. Vérifier la Console du Navigateur
1. Ouvrir les outils de développement (F12)
2. Aller dans l'onglet "Console"
3. Recharger la page DMP
4. Chercher les logs suivants :
   ```
   🔍 Chargement des notifications des droits d'accès...
   📄 Notifications reçues: [objet]
   🔍 État des notifications dans le rendu: [array]
   ```

#### B. Vérifier le Serveur Backend
1. S'assurer que le serveur backend est démarré :
   ```bash
   cd backend
   npm start
   ```

2. Tester la route directement :
   ```bash
   curl -X GET "http://localhost:3000/api/patient/dmp/droits-acces/notifications?patient_id=5" \
        -H "Authorization: Bearer test-token" \
        -H "Content-Type: application/json"
   ```

#### C. Vérifier l'Authentification
1. Vérifier que l'utilisateur est connecté
2. Vérifier que le token JWT est présent dans localStorage
3. Vérifier que l'ID du patient est correct

### 4. Tests de Fonctionnalité

#### Test 1 : Données Mock
- Ouvrir la page DMP
- Aller dans l'onglet "Droits d'accès"
- Vérifier que les notifications s'affichent (même en mode mock)

#### Test 2 : API Backend
- Démarrer le serveur backend
- Recharger la page
- Vérifier que les vraies données s'affichent

#### Test 3 : Fichier HTML de Test
- Ouvrir `test_notifications.html` dans un navigateur
- Vérifier que les notifications s'affichent correctement

### 5. Points de Contrôle

#### ✅ Backend
- [ ] Serveur démarré sur le port 3000
- [ ] Route `/api/patient/dmp/droits-acces/notifications` accessible
- [ ] Données mock présentes dans `server.js`

#### ✅ Frontend
- [ ] Utilisateur connecté
- [ ] Token JWT présent
- [ ] ID patient correct
- [ ] Logs de débogage visibles

#### ✅ Interface
- [ ] Onglet "Droits d'accès" accessible
- [ ] Section notifications visible
- [ ] Boutons d'action fonctionnels

### 6. Messages d'Erreur Courants

#### Erreur : "Network Error"
- **Cause** : Serveur backend non démarré
- **Solution** : Démarrer le serveur avec `npm start`

#### Erreur : "401 Unauthorized"
- **Cause** : Token d'authentification manquant ou invalide
- **Solution** : Se reconnecter ou vérifier le localStorage

#### Erreur : "404 Not Found"
- **Cause** : Route backend non implémentée
- **Solution** : Vérifier que la route existe dans `server.js`

### 7. Commandes de Diagnostic

#### Vérifier le Serveur
```bash
# Vérifier si le serveur répond
curl http://localhost:3000/api/health

# Tester la route des notifications
curl -X GET "http://localhost:3000/api/patient/dmp/droits-acces/notifications?patient_id=5" \
     -H "Authorization: Bearer test-token"
```

#### Vérifier le Frontend
```javascript
// Dans la console du navigateur
console.log('Token JWT:', localStorage.getItem('jwt'));
console.log('Patient:', JSON.parse(localStorage.getItem('patient')));
```

### 8. Solutions Alternatives

#### Si les notifications ne s'affichent toujours pas :

1. **Forcer l'affichage** : Modifier temporairement la condition
   ```javascript
   // Remplacer
   {notificationsDroitsAcces.length > 0 && (
   // Par
   {true && (
   ```

2. **Utiliser les données mock directement** :
   ```javascript
   const [notificationsDroitsAcces, setNotificationsDroitsAcces] = useState([
     // Données mock ici
   ]);
   ```

3. **Vérifier le composant de rendu** :
   - S'assurer que la condition `activeTab === 'droits-acces'` est vraie
   - Vérifier que le composant se rend correctement

### 9. Prochaines Étapes

1. **Tester avec le serveur backend** démarré
2. **Vérifier les logs** dans la console
3. **Tester les fonctionnalités** (marquer comme lue, accepter/refuser)
4. **Nettoyer les logs** une fois le problème résolu

---

**Statut** : 🔧 **En cours de résolution**
**Priorité** : ⭐⭐⭐ **Haute**
**Impact** : 📱 **Interface utilisateur**
