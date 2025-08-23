# 🔧 **Routes Manquantes à Implémenter dans le Backend**

## 📋 **Vue d'ensemble**

Ce document liste les routes manquantes dans le backend qui causent les erreurs 404 dans le frontend. Ces routes doivent être implémentées pour une synchronisation complète.

## ❌ **Routes Manquantes Identifiées**

### **1. Tableau de Bord Médecin**
```
GET /api/medecin/dashboard/stats
```

**Objectif** : Récupérer les statistiques du tableau de bord pour un médecin connecté.

**Paramètres** :
- `medecin_id` (depuis le token JWT)

**Réponse attendue** :
```json
{
  "status": "success",
  "data": {
    "statistiques": {
      "total_patients": 25,
      "consultations_aujourd_hui": 8,
      "rendez_vous_aujourd_hui": 12,
      "messages_non_lus": 5,
      "ordonnances_en_attente": 3
    },
    "activite_recente": [
      {
        "type": "consultation",
        "patient_nom": "Dupont Marie",
        "date": "2025-08-21T10:30:00Z",
        "statut": "terminée"
      }
    ]
  }
}
```

### **2. Messages Récents Médecin**
```
GET /api/medecin/messages/recent?limit=5
```

**Objectif** : Récupérer les messages récents pour un médecin connecté.

**Paramètres** :
- `limit` (optionnel, défaut: 5)
- `medecin_id` (depuis le token JWT)

**Réponse attendue** :
```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "id_message": 123,
        "contenu": "Question sur ma prescription",
        "patient_nom": "Martin Pierre",
        "date_envoi": "2025-08-21T14:30:00Z",
        "conversation_id": 45,
        "statut": "non_lu"
      }
    ],
    "total": 5
  }
}
```

## 🏗️ **Implémentation dans le Backend**

### **1. Créer le fichier de routes**
```javascript
// src/modules/medecin/medecin.route.js
const express = require('express');
const router = express.Router();
const medecinController = require('./medecin.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware');

// Route tableau de bord
router.get('/dashboard/stats',
  authenticateToken,
  medecinController.getDashboardStats
);

// Route messages récents
router.get('/messages/recent',
  authenticateToken,
  medecinController.getRecentMessages
);

module.exports = router;
```

### **2. Créer le contrôleur**
```javascript
// src/modules/medecin/medecin.controller.js
const catchAsync = require('../../utils/catchAsync');
const { Conversation, MessageModel, Consultation, Patient } = require('../../models');

class MedecinController {
  // Récupérer les statistiques du tableau de bord
  static getDashboardStats = catchAsync(async (req, res, next) => {
    const medecinId = req.user.id_professionnel;
    
    // Logique pour récupérer les statistiques
    const stats = await this.calculateDashboardStats(medecinId);
    
    res.status(200).json({
      status: 'success',
      data: {
        statistiques: stats
      }
    });
  });

  // Récupérer les messages récents
  static getRecentMessages = catchAsync(async (req, res, next) => {
    const medecinId = req.user.id_professionnel;
    const limit = parseInt(req.query.limit) || 5;
    
    const messages = await this.getRecentMessagesForMedecin(medecinId, limit);
    
    res.status(200).json({
      status: 'success',
      data: {
        messages: messages
      }
    });
  });
}

module.exports = MedecinController;
```

### **3. Monter les routes dans app.js**
```javascript
// src/routes/api.js
const medecinRoutes = require('../modules/medecin/medecin.route');

// Ajouter cette ligne
router.use('/medecin', medecinRoutes);
```

## 🔄 **Synchronisation Frontend/Backend**

### **1. Mettre à jour le service frontend**
```javascript
// src/services/api/medecinApi.js

// Ajouter ces méthodes
export const getDashboardStats = async () => {
  const response = await api.get('/medecin/dashboard/stats');
  return response.data;
};

export const getRecentMessages = async (limit = 5) => {
  const response = await api.get(`/medecin/messages/recent?limit=${limit}`);
  return response.data;
};
```

### **2. Mettre à jour le composant frontend**
```javascript
// src/components/header/headerMed.js

// Dans loadDashboardData()
try {
  const statsResponse = await getDashboardStats();
  const messagesResponse = await getRecentMessages(5);
  
  // Traiter les réponses
} catch (error) {
  console.error('Erreur lors de la récupération des données:', error);
}
```

## 📊 **Structure des Données**

### **Modèles de base de données nécessaires**
```sql
-- Table pour les statistiques du tableau de bord
CREATE TABLE medecin_dashboard_stats (
  id SERIAL PRIMARY KEY,
  medecin_id INTEGER REFERENCES professionnels_sante(id_professionnel),
  total_patients INTEGER DEFAULT 0,
  consultations_aujourd_hui INTEGER DEFAULT 0,
  rendez_vous_aujourd_hui INTEGER DEFAULT 0,
  messages_non_lus INTEGER DEFAULT 0,
  ordonnances_en_attente INTEGER DEFAULT 0,
  date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_medecin_dashboard_stats_medecin_id ON medecin_dashboard_stats(medecin_id);
CREATE INDEX idx_medecin_dashboard_stats_date ON medecin_dashboard_stats(date_mise_a_jour);
```

## 🧪 **Tests et Validation**

### **1. Tests des endpoints**
```bash
# Test tableau de bord
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/medecin/dashboard/stats

# Test messages récents
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/medecin/messages/recent?limit=5
```

### **2. Validation des réponses**
- Vérifier les codes de statut HTTP
- Valider la structure JSON des réponses
- Tester avec différents utilisateurs

## 🚀 **Plan d'Implémentation**

### **Phase 1 : Backend (Priorité Haute)**
1. ✅ Créer le module `medecin`
2. ✅ Implémenter les routes manquantes
3. ✅ Créer les contrôleurs
4. ✅ Tester les endpoints

### **Phase 2 : Frontend (Priorité Moyenne)**
1. ✅ Mettre à jour les services API
2. ✅ Adapter les composants
3. ✅ Gérer les erreurs et fallbacks

### **Phase 3 : Optimisation (Priorité Basse)**
1. ✅ Mise en cache des statistiques
2. ✅ Pagination des messages
3. ✅ Filtres avancés

## 📝 **Notes d'Implémentation**

### **Points d'attention**
1. **Authentification** : Toutes les routes nécessitent un token JWT valide
2. **Autorisation** : Vérifier que le médecin accède uniquement à ses données
3. **Performance** : Les statistiques peuvent être mises en cache
4. **Sécurité** : Valider et sanitizer tous les paramètres d'entrée

### **Compatibilité**
- Maintenir la compatibilité avec l'API existante
- Utiliser les mêmes conventions de nommage
- Respecter la structure de réponse standardisée

---

**Résultat attendu** : Élimination des erreurs 404 et synchronisation complète entre frontend et backend.
