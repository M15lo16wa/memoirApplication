# 🔧 GUIDE DE REMPLACEMENT MANUEL - URLs Auto-mesures DMP

## ⚠️ ERREUR 404 EN COURS - CORRECTION MANUELLE REQUISE

L'erreur persiste car **5 URLs restent incorrectes**. Voici la correction manuelle étape par étape :

## 📁 **FICHIER À MODIFIER**
```
src/services/api/dmpApi.js
```

## 🔧 **CORRECTION ÉTAPE PAR ÉTAPE**

### **ÉTAPE 1 : Ouvrir le fichier**
1. Ouvrir `src/services/api/dmpApi.js` dans votre éditeur
2. Aller aux lignes 635-695 (section des auto-mesures)

### **ÉTAPE 2 : Corriger getAutoMesureByIdDMP (Ligne 640)**
**Rechercher :**
```javascript
const url = `/patient/auto-mesures/${autoMesureId}`;
```
**Remplacer par :**
```javascript
const url = `/patients/dmp/auto-mesures/${autoMesureId}`;
```

### **ÉTAPE 3 : Corriger updateAutoMesureDMP (Ligne 651)**
**Rechercher :**
```javascript
const url = `/patient/auto-mesures/${autoMesureId}`;
```
**Remplacer par :**
```javascript
const url = `/patients/dmp/auto-mesures/${autoMesureId}`;
```

### **ÉTAPE 4 : Corriger deleteAutoMesureDMP (Ligne 662)**
**Rechercher :**
```javascript
const url = `/patient/auto-mesures/${autoMesureId}`;
```
**Remplacer par :**
```javascript
const url = `/patients/dmp/auto-mesures/${autoMesureId}`;
```

### **ÉTAPE 5 : Corriger getAutoMesuresStatsDMP (Ligne 680)**
**Rechercher :**
```javascript
let url = `/patient/${patientId}/auto-mesures/stats`;
```
**Remplacer par :**
```javascript
let url = `/patients/${patientId}/dmp/auto-mesures/stats`;
```

### **ÉTAPE 6 : Corriger getLastAutoMesureByTypeDMP (Ligne 690)**
**Rechercher :**
```javascript
const url = `/patient/${patientId}/auto-mesures/last/${type}`;
```
**Remplacer par :**
```javascript
const url = `/patients/${patientId}/dmp/auto-mesures/last/${type}`;
```

## ⚡ **MÉTHODE RAPIDE AVEC RECHERCHE ET REMPLACEMENT**

### **Remplacement 1 : URLs CRUD par ID**
1. **Ctrl+H** (ou **Cmd+H**)
2. **Rechercher :** `/patient/auto-mesures`
3. **Remplacer par :** `/patients/dmp/auto-mesures`
4. **Remplacer tout**

### **Remplacement 2 : URL des Statistiques**
1. **Rechercher :** `/patient/${patientId}/auto-mesures/stats`
2. **Remplacer par :** `/patients/${patientId}/dmp/auto-mesures/stats`
3. **Remplacer tout**

### **Remplacement 3 : URL de la Dernière Mesure**
1. **Rechercher :** `/patient/${patientId}/auto-mesures/last`
2. **Remplacer par :** `/patients/${patientId}/dmp/auto-mesures/last`
3. **Remplacer tout**

## 📋 **CHECKLIST DE CORRECTION**

- [ ] ✅ `getAutoMesureByIdDMP` - URL corrigée
- [ ] ✅ `updateAutoMesureDMP` - URL corrigée
- [ ] ✅ `deleteAutoMesureDMP` - URL corrigée
- [ ] ✅ `getAutoMesuresStatsDMP` - URL corrigée
- [ ] ✅ `getLastAutoMesureByTypeDMP` - URL corrigée

## 🎯 **RÉSULTAT ATTENDU**

**Après correction, toutes les URLs devraient être :**
```javascript
✅ /patients/${patientId}/dmp/auto-mesures           // Liste
✅ /patients/dmp/auto-mesures                        // Création
✅ /patients/dmp/auto-mesures/${autoMesureId}        // CRUD par ID
✅ /patients/${patientId}/dmp/auto-mesures/stats     // Statistiques
✅ /patients/${patientId}/dmp/auto-mesures/last/${type} // Dernière mesure
```

## 🧪 **TEST POST-CORRECTION**

1. **Sauvegarder le fichier**
2. **Recharger l'application**
3. **Vérifier que l'erreur 404 est résolue**
4. **Tester le composant AutoMesuresWidget**

## 🎉 **RÉSULTAT FINAL**

**Une fois toutes les URLs corrigées :**
- ✅ **Plus d'erreur 404**
- ✅ **API auto-mesures fonctionnelle**
- ✅ **Composant AutoMesuresWidget opérationnel**
- ✅ **Intégration frontend-backend complète**

## 🚀 **ACTION IMMÉDIATE REQUISE**

**APPLIQUEZ CES 5 CORRECTIONS MAINTENANT POUR RÉSOUDRE L'ERREUR 404 !**

**Utilisez la méthode manuelle ou la recherche et remplacement global.**
