# 🚀 Serveurs de Simulation - Application de Rendez-vous

Ce dossier contient les serveurs de simulation nécessaires pour tester l'application de prise de rendez-vous.

## 📋 Serveur Disponible

### Serveur Simple (Port 3001)
- **Fichier**: `server-simple.js`
- **Port**: 3001
- **URL**: http://localhost:3001
- **Fonction**: Gère à la fois les professionnels de santé ET les rendez-vous

## 🚀 Démarrage Rapide

### Option 1: Démarrage automatique (Recommandé)
```bash
node server-simple.js
```

### Option 2: Démarrage manuel
```bash
node server-simple.js
```

## 🔗 URLs de Test

### Serveur Simple (Port 3001)
- **Test général**: http://localhost:3001/api/test
- **Liste des professionnels**: http://localhost:3001/api/professionnelSante
- **Professionnel spécifique**: http://localhost:3001/api/professionnelSante/1
- **Liste des rendez-vous**: http://localhost:3001/api/rendez-vous
- **Rendez-vous spécifique**: http://localhost:3001/api/rendez-vous/1

## 📊 Données de Test

### Professionnels de Santé Disponibles
- Dr. Jean Dupont (Cardiologie)
- Dr. Marie Martin (Dermatologie)
- Dr. Pierre Leclerc (Endocrinologie)
- Dr. Sophie Garcia (Gastro-entérologie)
- Dr. Thi Nguyen (Neurologie)
- Dr. Fatou Diallo (Pédiatrie)
- Dr. Moussa Sow (Radiologie)
- Dr. Aissatou Diop (Chirurgie)

## 🛠️ Configuration de l'API

L'API frontend est configurée pour pointer vers le port 3001 (serveur simple). Si vous modifiez le port, mettez à jour :

```javascript
// src/services/api/rendezVous.js
const API_URL = "http://localhost:3001/api";
```

## 🔍 Test de l'Application

1. **Démarrer les serveurs** avec `node start-servers.js`
2. **Ouvrir l'application** dans le navigateur
3. **Naviguer vers la page de rendez-vous**
4. **Remplir le formulaire** - les professionnels de santé seront chargés automatiquement
5. **Soumettre le formulaire** - le rendez-vous sera créé via l'API

## 📝 Logs des Serveurs

Les serveurs affichent des logs détaillés incluant :
- ✅ Requêtes réussies avec temps de réponse
- ❌ Erreurs et problèmes
- 📊 Statistiques des opérations
- 🔍 Détails des requêtes (méthode, URL, statut)

## 🛑 Arrêt des Serveurs

- **Arrêt automatique**: Ctrl+C dans le terminal principal
- **Arrêt manuel**: Fermer chaque terminal individuellement

## 🔧 Personnalisation

### Ajouter de nouveaux professionnels
Modifiez le tableau `professionnelsSante` dans `server-professionnels.js`

### Modifier la logique des rendez-vous
Modifiez les routes dans `server-rendez-vous-simple.js`

### Changer le port
Modifiez la variable `PORT` dans `server-simple.js`

## 📚 Dépendances

Assurez-vous d'avoir installé :
```bash
npm install express cors
```

## 🚨 Dépannage

### Port déjà utilisé
```bash
# Vérifier le port utilisé
netstat -ano | findstr :3001

# Tuer le processus si nécessaire
taskkill /PID <PID> /F
```

### Erreur de module non trouvé
```bash
npm install
```

### Problème de CORS
Les serveurs sont configurés avec CORS activé. Si vous avez des problèmes, vérifiez que les ports correspondent dans la configuration frontend.
