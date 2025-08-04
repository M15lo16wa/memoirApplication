# Documentation des Endpoints API pour l'Upload de Documents DMP

## Endpoints Requis

### 1. Upload de Document
**POST** `/api/dmp/documents/upload`

**Description :** Upload un document pour un patient connecté

**Headers requis :**
```
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>
```

**Body (FormData) :**
- `patient_id` (number) : ID du patient
- `titre` (string) : Titre du document
- `description` (string, optionnel) : Description du document
- `type` (string) : Type de document (ex: 'ordonnance', 'analyse', 'certificat', 'document')
- `file` (File) : Le fichier à uploader

**Types de fichiers acceptés :**
- Images : JPG, PNG, GIF
- Documents : PDF, TXT, DOC, DOCX
- Taille maximale : 10MB

**Réponse de succès (200) :**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "patient_id": 456,
    "titre": "Ordonnance Dr. Martin",
    "description": "Ordonnance pour traitement antibiotique",
    "type": "ordonnance",
    "date_upload": "2024-01-20",
    "taille": "245 KB",
    "url": "/uploads/documents/123_ordonnance.pdf",
    "created_at": "2024-01-20T10:30:00Z"
  }
}
```

**Réponse d'erreur (400/500) :**
```json
{
  "success": false,
  "error": "Le fichier est trop volumineux. Taille maximale autorisée : 10MB"
}
```

### 2. Récupération des Documents
**GET** `/api/dmp/documents`

**Description :** Récupère tous les documents d'un patient connecté

**Headers requis :**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters :**
- `patient_id` (number, requis) : ID du patient
- `type` (string, optionnel) : Filtrer par type de document

**Réponse de succès (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "patient_id": 456,
      "titre": "Ordonnance Dr. Martin",
      "description": "Ordonnance pour traitement antibiotique",
      "type": "ordonnance",
      "date_upload": "2024-01-20",
      "taille": "245 KB",
      "url": "/uploads/documents/123_ordonnance.pdf",
      "created_at": "2024-01-20T10:30:00Z"
    },
    {
      "id": 124,
      "patient_id": 456,
      "titre": "Résultats analyse sang",
      "description": "Bilan sanguin complet",
      "type": "analyse",
      "date_upload": "2024-01-15",
      "taille": "1.2 MB",
      "url": "/uploads/documents/124_analyse.pdf",
      "created_at": "2024-01-15T14:20:00Z"
    }
  ]
}
```

### 3. Suppression de Document
**DELETE** `/api/dmp/documents/{document_id}`

**Description :** Supprime un document spécifique

**Headers requis :**
```
Authorization: Bearer <jwt_token>
```

**Réponse de succès (200) :**
```json
{
  "success": true,
  "message": "Document supprimé avec succès",
  "deleted_id": 123
}
```

**Réponse d'erreur (404) :**
```json
{
  "success": false,
  "error": "Document non trouvé"
}
```

## Structure de Base de Données Recommandée

### Table `documents`
```sql
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    taille BIGINT NOT NULL, -- en bytes
    url VARCHAR(500),
    date_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_type (type),
    INDEX idx_date_upload (date_upload)
);
```

## Validation Côté Serveur

### 1. Validation des Fichiers
- **Taille maximale :** 10MB (10 * 1024 * 1024 bytes)
- **Types acceptés :**
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `application/pdf`
  - `text/plain`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### 2. Validation des Données
- `patient_id` : Doit exister dans la table patients
- `titre` : Requis, max 255 caractères
- `description` : Optionnel, max 1000 caractères
- `type` : Requis, doit être dans la liste des types autorisés

## Gestion des Erreurs

### Codes d'Erreur HTTP
- **400 Bad Request :** Données invalides (fichier trop gros, type non autorisé, etc.)
- **401 Unauthorized :** Token JWT manquant ou invalide
- **403 Forbidden :** Patient n'a pas le droit d'accéder à ce document
- **404 Not Found :** Document non trouvé
- **413 Payload Too Large :** Fichier trop volumineux
- **415 Unsupported Media Type :** Type de fichier non supporté
- **500 Internal Server Error :** Erreur serveur

### Messages d'Erreur Recommandés
```json
{
  "success": false,
  "error": "Message d'erreur descriptif",
  "code": "ERROR_CODE",
  "details": {
    "field": "patient_id",
    "reason": "Patient non trouvé"
  }
}
```

## Sécurité

### 1. Authentification
- Vérification du token JWT sur tous les endpoints
- Validation que le patient connecté correspond au patient_id

### 2. Validation des Fichiers
- Vérification de l'extension du fichier
- Scan antivirus recommandé
- Stockage sécurisé des fichiers (hors du répertoire web public)

### 3. Autorisation
- Un patient ne peut accéder qu'à ses propres documents
- Validation des permissions avant toute opération

## Exemple d'Implémentation Node.js/Express

```javascript
const multer = require('multer');
const path = require('path');

// Configuration multer pour l'upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});

// Endpoint d'upload
app.post('/api/dmp/documents/upload', 
  authenticateToken, 
  upload.single('file'), 
  async (req, res) => {
    try {
      const { patient_id, titre, description, type } = req.body;
      const file = req.file;
      
      // Validation des données
      if (!patient_id || !titre || !type || !file) {
        return res.status(400).json({
          success: false,
          error: 'Données manquantes'
        });
      }
      
      // Vérifier que le patient existe et que l'utilisateur y a accès
      const patient = await Patient.findById(patient_id);
      if (!patient || patient.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Accès non autorisé'
        });
      }
      
      // Sauvegarder en base de données
      const document = await Document.create({
        patient_id,
        titre,
        description,
        type,
        nom_fichier: file.originalname,
        chemin_fichier: file.path,
        taille: file.size,
        url: `/uploads/documents/${file.filename}`
      });
      
      res.json({
        success: true,
        data: document
      });
      
    } catch (error) {
      console.error('Erreur upload document:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'upload'
      });
    }
  }
);
```

## Tests Recommandés

### Tests Unitaires
- Validation des types de fichiers
- Validation de la taille des fichiers
- Validation des données d'entrée

### Tests d'Intégration
- Upload de document avec authentification
- Récupération des documents d'un patient
- Suppression de document
- Gestion des erreurs

### Tests de Sécurité
- Tentative d'accès sans authentification
- Tentative d'accès aux documents d'un autre patient
- Upload de fichiers malveillants
- Injection SQL 