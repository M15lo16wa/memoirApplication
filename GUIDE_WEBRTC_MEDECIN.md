# 🎥 Guide d'Utilisation WebRTC pour Médecins

## 📍 **Comment Accéder au Service WebRTC**

### **1. 🧭 Navigation Principale**
- **Bouton WebRTC** dans la barre de navigation (en haut)
- **Icône 📹** verte dans le header du médecin
- **Lien direct** : `/webrtc`

### **2. 🏠 Tableau de Bord**
- **Section "Communication WebRTC"** avec 2 boutons :
  - **📹 Conférences Vidéo** : Appels vidéo avec patients
  - **🎤 Appels Audio** : Communication vocale uniquement

### **3. 👥 Liste des Patients**
- **Boutons d'action** pour chaque patient :
  - **📹** : Appel vidéo avec le patient sélectionné
  - **🎤** : Appel audio avec le patient sélectionné
  - **💬** : Messagerie (existant)

---

## 🚀 **Fonctionnalités Disponibles**

### **📹 Conférences Vidéo**
- **Création** : Médecin crée une conférence
- **Code de partage** : Généré automatiquement
- **Rejoindre** : Patient utilise le code pour rejoindre
- **Contrôles** : Mute, vidéo on/off, fin d'appel

### **🎤 Appels Audio**
- **Communication vocale** uniquement
- **Contrôles** : Mute, fin d'appel
- **Interface simplifiée** pour les appels rapides

### **👥 Gestion des Conférences**
- **Liste des conférences** actives
- **Statuts** : En attente, En cours, Terminée
- **Historique** des appels

---

## 🎯 **Workflow d'Utilisation**

### **Étape 1 : Accès**
1. Se connecter en tant que médecin
2. Cliquer sur **📹 WebRTC** dans la navigation
3. Ou utiliser les boutons du tableau de bord

### **Étape 2 : Créer une Conférence**
1. Cliquer sur **"Nouvelle conférence"**
2. Sélectionner le patient (si disponible)
3. Choisir le type : Vidéo ou Audio
4. La conférence est créée avec un code

### **Étape 3 : Partager le Code**
1. **Copier le code** généré
2. **Partager** avec le patient via :
   - SMS
   - Email
   - Messagerie de la plateforme
   - Téléphone

### **Étape 4 : Démarrer l'Appel**
1. Le patient rejoint avec le code
2. **Autoriser** l'accès caméra/micro
3. **Contrôler** l'appel (mute, vidéo, etc.)
4. **Terminer** l'appel quand nécessaire

---

## 🔧 **Contrôles Disponibles**

### **Pendant l'Appel Vidéo**
- **🎤 Mute/Unmute** : Activer/désactiver le micro
- **📹 Vidéo On/Off** : Activer/désactiver la caméra
- **📞 Fin d'appel** : Terminer la conférence

### **Pendant l'Appel Audio**
- **🎤 Mute/Unmute** : Activer/désactiver le micro
- **📞 Fin d'appel** : Terminer la conférence

---

## 📱 **Accès Mobile**

### **Interface Responsive**
- **Adaptation automatique** sur mobile
- **Contrôles tactiles** optimisés
- **Interface simplifiée** pour petits écrans

### **Fonctionnalités Mobile**
- **Appels vidéo** en mode portrait/paysage
- **Contrôles flottants** pour faciliter l'utilisation
- **Notifications** de statut d'appel

---

## 🛡️ **Sécurité et Confidentialité**

### **Authentification**
- **Connexion requise** pour accéder
- **Vérification** du rôle médecin
- **Sessions sécurisées** avec JWT

### **Protection des Données**
- **Chiffrement** des communications
- **Codes de conférence** uniques
- **Expiration automatique** des sessions

---

## 🆘 **Dépannage**

### **Problèmes Courants**

#### **"Erreur de connexion"**
- Vérifier la connexion internet
- Autoriser l'accès caméra/micro
- Rafraîchir la page

#### **"Code de conférence invalide"**
- Vérifier le code saisi
- S'assurer que la conférence est active
- Créer une nouvelle conférence

#### **"Patient ne peut pas rejoindre"**
- Vérifier que le code est correct
- S'assurer que la conférence n'est pas expirée
- Vérifier la connexion du patient

### **Support Technique**
- **Logs** disponibles dans la console
- **Messages d'erreur** explicites
- **Redirection** automatique en cas de problème

---

## 📊 **Statistiques et Historique**

### **Tableau de Bord**
- **Nombre de conférences** créées
- **Durée moyenne** des appels
- **Patients contactés** via WebRTC

### **Historique des Appels**
- **Liste** des conférences passées
- **Détails** : Date, durée, participant
- **Export** possible des données

---

## 🎉 **Avantages du Service WebRTC**

### **Pour le Médecin**
- **Communication directe** avec les patients
- **Interface intuitive** et moderne
- **Intégration** dans l'écosystème existant
- **Sécurité** et confidentialité garanties

### **Pour les Patients**
- **Accès simple** via code de conférence
- **Pas d'installation** d'application
- **Compatible** avec tous les navigateurs
- **Qualité** audio/vidéo optimisée

---

## 📞 **Support et Contact**

Pour toute question ou problème :
- **Documentation** : Voir les fichiers de configuration
- **Logs** : Consulter la console du navigateur
- **Tests** : Utiliser les pages de test fournies

---

**🚀 Votre service WebRTC est maintenant prêt à être utilisé !**
