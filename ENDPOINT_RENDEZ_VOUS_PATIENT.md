# 🔧 Endpoint Rendez-vous Patient - Implémentation Côté Serveur

## 🎯 **Problème Identifié**

L'endpoint `/api/rendez-vous/patient/{patientId}` retourne une erreur **404 (Not Found)**, ce qui signifie qu'il n'est pas encore implémenté côté serveur.

## 📊 **Logs d'Erreur**

```
GET http://localhost:3001/api/rendez-vous/patient/7 404 (Not Found)
❌ Erreur lors de la récupération des rendez-vous du patient: AxiosError
```

## 🛠️ **Solutions Implémentées**

### **1. Fallback Automatique (Frontend)**
- **Tentative 1** : Appel à `/api/rendez-vous/patient/{patientId}`
- **Fallback** : Si 404, appel à `/api/rendez-vous` + filtrage côté client
- **Avantage** : Fonctionne même sans endpoint spécifique

### **2. Filtrage Côté Client**
```javascript
const patientRendezVous = allRendezVous.filter(rdv => 
    rdv.patient_id === patientId || 
    rdv.patientId === patientId || 
    rdv.patient?.id === patientId ||
    rdv.patient?.id_patient === patientId
);
```

## 🚀 **Implémentation Côté Serveur (Recommandée)**

### **Route Express.js**
```javascript
// routes/rendezVous.js
router.get('/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        
        // Vérifier l'authentification
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token d\'authentification requis' 
            });
        }
        
        // Vérifier que le patient peut accéder à ses propres rendez-vous
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        if (decodedToken.patientId != patientId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès non autorisé' 
            });
        }
        
        // Récupérer les rendez-vous du patient
        const rendezVous = await RendezVous.findAll({
            where: {
                patient_id: patientId
            },
            include: [
                {
                    model: Medecin,
                    as: 'medecin',
                    attributes: ['id', 'nom', 'prenom', 'specialite']
                },
                {
                    model: Service,
                    as: 'service',
                    attributes: ['id', 'nom', 'code']
                }
            ],
            order: [['date', 'ASC']]
        });
        
        res.json({
            success: true,
            data: rendezVous,
            message: `${rendezVous.length} rendez-vous trouvé(s)`
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des rendez-vous'
        });
    }
});
```

### **Modèle Sequelize (si applicable)**
```javascript
// models/RendezVous.js
module.exports = (sequelize, DataTypes) => {
    const RendezVous = sequelize.define('RendezVous', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        heure: {
            type: DataTypes.STRING,
            allowNull: false
        },
        motif: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type_rdv: {
            type: DataTypes.STRING,
            defaultValue: 'consultation'
        },
        statut: {
            type: DataTypes.ENUM('programme', 'confirme', 'annule'),
            defaultValue: 'programme'
        },
        patient_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Patients',
                key: 'id'
            }
        },
        medecin_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Medecins',
                key: 'id'
            }
        },
        service_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Services',
                key: 'id'
            }
        },
        notes: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'rendez_vous',
        timestamps: true
    });
    
    RendezVous.associate = (models) => {
        RendezVous.belongsTo(models.Patient, { 
            foreignKey: 'patient_id', 
            as: 'patient' 
        });
        RendezVous.belongsTo(models.Medecin, { 
            foreignKey: 'medecin_id', 
            as: 'medecin' 
        });
        RendezVous.belongsTo(models.Service, { 
            foreignKey: 'service_id', 
            as: 'service' 
        });
    };
    
    return RendezVous;
};
```

## 📋 **Structure de Données Attendue**

### **Format de Réponse API**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "date": "2025-01-15T14:30:00.000Z",
            "heure": "14:30",
            "motif": "Consultation de suivi",
            "type_rdv": "consultation",
            "statut": "confirme",
            "patient_id": 7,
            "medecin_id": 79,
            "service_id": 5,
            "notes": "Veuillez apporter vos derniers examens",
            "createdAt": "2025-01-10T10:00:00.000Z",
            "updatedAt": "2025-01-10T10:00:00.000Z",
            "medecin": {
                "id": 79,
                "nom": "Sakura",
                "prenom": "Saza",
                "specialite": "Cardiologie"
            },
            "service": {
                "id": 5,
                "nom": "Cardiologie",
                "code": "CARDIO_7"
            }
        }
    ],
    "message": "1 rendez-vous trouvé(s)"
}
```

## 🔒 **Sécurité et Authentification**

### **Vérifications Requises**
1. **Token JWT valide** dans les headers
2. **Patient ID** correspond au token connecté
3. **Permissions** d'accès aux données
4. **Validation** des paramètres d'entrée

### **Middleware d'Authentification**
```javascript
// middleware/auth.js
const authenticatePatient = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token d\'authentification requis' 
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.patientId = decoded.patientId;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token invalide' 
        });
    }
};
```

## 🧪 **Tests de l'Endpoint**

### **Test avec cURL**
```bash
# Récupérer les rendez-vous du patient 7
curl -X GET \
  http://localhost:3001/api/rendez-vous/patient/7 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### **Test avec Postman**
- **Method** : GET
- **URL** : `http://localhost:3001/api/rendez-vous/patient/7`
- **Headers** : 
  - `Authorization: Bearer YOUR_JWT_TOKEN`
  - `Content-Type: application/json`

## 📊 **Statistiques et Monitoring**

### **Logs à Implémenter**
```javascript
// Logs de performance
console.log(`⏱️ Rendez-vous patient ${patientId} récupérés en ${Date.now() - startTime}ms`);

// Logs de sécurité
console.log(`🔒 Accès aux rendez-vous patient ${patientId} autorisé pour ${decodedToken.patientId}`);

// Logs d'erreur
console.error(`❌ Erreur récupération rendez-vous patient ${patientId}:`, error);
```

## 🎯 **Prochaines Étapes**

### **Phase 1 : Implémentation de Base**
1. **Créer la route** `/api/rendez-vous/patient/:patientId`
2. **Implémenter l'authentification** et autorisation
3. **Tester** avec des données existantes

### **Phase 2 : Optimisation**
1. **Ajouter la pagination** pour de gros volumes
2. **Implémenter le cache** Redis si nécessaire
3. **Ajouter les filtres** par date, statut, etc.

### **Phase 3 : Fonctionnalités Avancées**
1. **Notifications** de nouveaux rendez-vous
2. **Synchronisation** calendrier externe
3. **Historique** des modifications

## 🔍 **Debug et Maintenance**

### **Points de Vérification**
1. **Route enregistrée** dans Express
2. **Modèle Sequelize** correctement configuré
3. **Associations** entre tables
4. **Permissions** d'accès à la base de données
5. **Logs** de debug activés

### **Commandes de Debug**
```bash
# Vérifier les routes enregistrées
npm run dev
# Regarder les logs de démarrage

# Tester la base de données
npx sequelize-cli db:seed:all
# Vérifier que les données existent
```

---

**Date de création** : 2025-01-10  
**Version** : 1.0.0  
**Statut** : ⚠️ Endpoint à implémenter côté serveur  
**Priorité** : 🔴 Haute (fonctionnalité bloquée)
