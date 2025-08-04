# API Documents avec Filtres - Documentation

## Vue d'ensemble

L'API de récupération des documents personnels a été mise à jour pour supporter des filtres avancés, permettant aux utilisateurs de rechercher leurs documents par type, date de début et date de fin.

## Modifications Frontend

### 1. Service API (`src/services/api/dmpApi.js`)

#### Fonction `getDocumentsDMP` mise à jour

```javascript
export const getDocumentsDMP = async (patientId = null, filters = {}) => {
    try {
        // Récupérer l'ID du patient connecté si non fourni
        if (!patientId) {
            const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
            patientId = storedPatient.id_patient || storedPatient.id;
        }
        
        if (!patientId) {
            throw new Error('Patient non connecté');
        }

        // Paramètres requis par l'API backend
        const params = { 
            patient_id: patientId,
            type: filters.type || null,
            date_debut: filters.date_debut || null,
            date_fin: filters.date_fin || null
        };

        // Filtrer les paramètres null/undefined
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([key, value]) => value !== null && value !== undefined)
        );

        // Appel API réel pour récupérer les documents
        const response = await dmpApi.get('/dmp/documents-personnels', { params: cleanParams });
        
        console.log('✅ Documents récupérés avec succès:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des documents:', error);
        
        // Fallback vers les données mock en cas d'erreur
        console.warn("Mode développement: utilisation des données mock");
        const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
        const mockData = getMockDataForPatient(storedPatient.id_patient || storedPatient.id);
        let {documents, ...rest} = mockData;
        
        // Appliquer les filtres sur les données mock
        if (filters.type) {
            documents = documents.filter(d => d.type === filters.type);
        }
        if (filters.date_debut) {
            documents = documents.filter(d => new Date(d.date_upload) >= new Date(filters.date_debut));
        }
        if (filters.date_fin) {
            documents = documents.filter(d => new Date(d.date_upload) <= new Date(filters.date_fin));
        }
        
        return { data: documents };
    }
};
```

**Changements principaux :**
- Signature modifiée : `(patientId = null, type = null)` → `(patientId = null, filters = {})`
- Support des paramètres : `type`, `date_debut`, `date_fin`
- Nettoyage automatique des paramètres null/undefined
- Filtrage des données mock en cas d'erreur API

### 2. Contexte DMP (`src/context/DMPContext.js`)

#### Action `loadDocuments` mise à jour

```javascript
loadDocuments: async (filters = {}) => {
    if (!state.patientId) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        const response = await dmpApi.getDocumentsDMP(null, filters);
        dispatch({ type: 'SET_DOCUMENTS', payload: response.data });
    } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
    }
},
```

### 3. Composant DMPMonEspaceSante (`src/components/dmp/DMPMonEspaceSante.js`)

#### Interface de filtres ajoutée

```javascript
// États pour les filtres de documents
const [documentFilters, setDocumentFilters] = useState({
    type: '',
    date_debut: '',
    date_fin: ''
});
const [showFilters, setShowFilters] = useState(false);

// Fonctions pour gérer les filtres
const handleFilterChange = (field, value) => {
    setDocumentFilters(prev => ({
        ...prev,
        [field]: value
    }));
};

const applyFilters = () => {
    const cleanFilters = Object.fromEntries(
        Object.entries(documentFilters).filter(([key, value]) => value !== '' && value !== null)
    );
    loadDocuments(cleanFilters);
};

const clearFilters = () => {
    setDocumentFilters({
        type: '',
        date_debut: '',
        date_fin: ''
    });
    loadDocuments({});
};
```

#### Interface utilisateur

L'interface de filtres inclut :
- **Type de document** : Dropdown avec options (Ordonnance, Résultat d'examen, Certificat médical, etc.)
- **Date de début** : Input de type date
- **Date de fin** : Input de type date
- **Boutons** : "Effacer" et "Appliquer"

## Spécifications API Backend

### Endpoint : `GET /dmp/documents-personnels`

#### Paramètres de requête

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `patient_id` | Integer | Oui | ID du patient |
| `type` | String | Non | Type de document (ordonnance, resultat, certificat, general, autre) |
| `date_debut` | Date (YYYY-MM-DD) | Non | Date de début pour le filtrage |
| `date_fin` | Date (YYYY-MM-DD) | Non | Date de fin pour le filtrage |

#### Exemple de requête

```javascript
// Récupérer tous les documents
GET /dmp/documents-personnels?patient_id=123

// Récupérer les ordonnances
GET /dmp/documents-personnels?patient_id=123&type=ordonnance

// Récupérer les documents entre deux dates
GET /dmp/documents-personnels?patient_id=123&date_debut=2024-01-01&date_fin=2024-12-31

// Récupérer les ordonnances entre deux dates
GET /dmp/documents-personnels?patient_id=123&type=ordonnance&date_debut=2024-01-01&date_fin=2024-12-31
```

#### Réponse

```json
{
  "data": [
    {
      "id": 1,
      "patient_id": 123,
      "nom": "Ordonnance cardiologue",
      "type": "ordonnance",
      "description": "Ordonnance du Dr. Martin",
      "date_upload": "2024-01-15",
      "taille": 1024,
      "url": "/documents/1"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

## Implémentation Backend Recommandée

### Modèle Sequelize

```javascript
static async getDocumentsPersonnels(filters = {}) {
  const { patientId, type, date_debut, date_fin, limit = 50, offset = 0 } = filters;
  
  const whereClause = {};
  
  if (patientId) {
    whereClause.patient_id = patientId;
  }
  
  if (type) {
    whereClause.type = type;
  }
  
  if (date_debut || date_fin) {
    whereClause.date_upload = {};
    if (date_debut) {
      whereClause.date_upload[Op.gte] = new Date(date_debut);
    }
    if (date_fin) {
      whereClause.date_upload[Op.lte] = new Date(date_fin);
    }
  }

  return await Document.findAndCountAll({
    include: [
      {
        model: Patient,
        as: 'patient',
        attributes: ['id_patient', 'nom', 'prenom']
      }
    ],
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['date_upload', 'DESC']]
  });
}
```

### Route Express

```javascript
router.get('/dmp/documents-personnels', async (req, res) => {
  try {
    const { patient_id, type, date_debut, date_fin } = req.query;
    
    const filters = {
      patientId: patient_id,
      type,
      date_debut,
      date_fin
    };
    
    const result = await Document.getDocumentsPersonnels(filters);
    
    res.json({
      data: result.rows,
      total: result.count,
      page: 1,
      pageSize: 20
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des documents',
      details: error.message 
    });
  }
});
```

## Validation des Données

### Frontend
- Validation des dates (format YYYY-MM-DD)
- Nettoyage automatique des paramètres vides
- Gestion des erreurs avec fallback vers les données mock

### Backend (Recommandé)
- Validation du `patient_id` (existence et autorisation)
- Validation du format des dates
- Validation des types de documents autorisés
- Pagination pour éviter les requêtes trop lourdes

## Types de Documents Supportés

| Type | Description |
|------|-------------|
| `ordonnance` | Ordonnances médicales |
| `resultat` | Résultats d'examens |
| `certificat` | Certificats médicaux |
| `general` | Documents généraux |
| `autre` | Autres types de documents |

## Gestion des Erreurs

### Erreurs 404
- Vérifier que le patient existe
- Vérifier que le patient a des documents
- Retourner une liste vide au lieu d'une erreur 404

### Erreurs de Validation
- Retourner des messages d'erreur clairs
- Indiquer les paramètres manquants ou invalides

## Tests Recommandés

1. **Test sans filtres** : Vérifier que tous les documents sont retournés
2. **Test avec type** : Vérifier le filtrage par type
3. **Test avec dates** : Vérifier le filtrage par période
4. **Test combiné** : Vérifier les filtres combinés
5. **Test erreurs** : Vérifier la gestion des erreurs
6. **Test pagination** : Vérifier le comportement avec beaucoup de données 