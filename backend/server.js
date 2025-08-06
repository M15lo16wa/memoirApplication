const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mock data for testing
const mockSessions = new Map();
const mockAccessHistory = [];
const mockNotificationsDroitsAcces = [
  {
    id: 1,
    patient_id: 5,
    titre: "Nouvelle demande d'accès DMP",
    message: "Le Dr. Martin a demandé l'accès à votre DMP pour une consultation d'urgence.",
    type: "demande_acces",
    demande_id: "access_1234567890_abc123",
    lue: false,
    repondue: false,
    date_creation: new Date().toISOString(),
    medecin_nom: "Dr. Martin",
    medecin_id: 79
  },
  {
    id: 2,
    patient_id: 5,
    titre: "Accès DMP autorisé",
    message: "Vous avez autorisé l'accès au Dr. Dupont pour 30 minutes.",
    type: "acces_autorise",
    demande_id: "access_1234567891_def456",
    lue: true,
    repondue: true,
    date_creation: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    medecin_nom: "Dr. Dupont",
    medecin_id: 80
  },
  {
    id: 3,
    patient_id: 5,
    titre: "Accès DMP refusé",
    message: "Vous avez refusé l'accès au Dr. Bernard.",
    type: "acces_refuse",
    demande_id: "access_1234567892_ghi789",
    lue: false,
    repondue: true,
    date_creation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    medecin_nom: "Dr. Bernard",
    medecin_id: 81
  }
];

// Middleware to verify JWT token (simplified)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token d\'authentification manquant' 
    });
  }
  
  // For demo purposes, we'll accept any Bearer token
  // In production, you would verify the JWT token here
  next();
};

// Test DMP system endpoint
app.get('/api/medecin/dmp/test/systeme', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  });
});

// CPS Authentication endpoint
app.post('/api/medecin/dmp/authentification-cps', verifyToken, (req, res) => {
  const { numero_adeli, code_cps, patient_id } = req.body;
  
  // Mock validation - in production, validate against real CPS database
  if (!numero_adeli || !code_cps || !patient_id) {
    return res.status(400).json({
      success: false,
      error: 'Données d\'authentification incomplètes'
    });
  }
  
  // Mock CPS validation (4-digit code)
  if (code_cps.length !== 4 || !/^\d{4}$/.test(code_cps)) {
    return res.status(400).json({
      success: false,
      error: 'Code CPS invalide (4 chiffres requis)'
    });
  }
  
  // Mock successful authentication
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  mockSessions.set(sessionId, {
    session_id: sessionId,
    medecin_id: 79, // From JWT token
    patient_id: patient_id,
    numero_adeli: numero_adeli,
    authenticated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
  });
  
  res.json({
    success: true,
    data: {
      session_id: sessionId,
      authenticated: true,
      message: 'Authentification CPS réussie'
    }
  });
});

// Create DMP session endpoint
app.post('/api/medecin/dmp/creer-session', verifyToken, (req, res) => {
  const { patient_id, medecin_id } = req.body;
  
  if (!patient_id || !medecin_id) {
    return res.status(400).json({
      success: false,
      error: 'Données de session incomplètes'
    });
  }
  
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  mockSessions.set(sessionId, {
    session_id: sessionId,
    medecin_id: medecin_id,
    patient_id: patient_id,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
  });
  
  res.json({
    success: true,
    data: {
      session_id: sessionId,
      message: 'Session DMP créée avec succès'
    }
  });
});

// Request DMP access endpoint (the one that was missing)
app.post('/api/medecin/dmp/demande-acces', verifyToken, (req, res) => {
  const { session_id, mode_acces, duree_acces, raison_acces } = req.body;
  
  if (!session_id || !mode_acces || !duree_acces || !raison_acces) {
    return res.status(400).json({
      success: false,
      error: 'Données de demande d\'accès incomplètes'
    });
  }
  
  // Validate session
  const session = mockSessions.get(session_id);
  if (!session) {
    return res.status(400).json({
      success: false,
      error: 'Session invalide ou expirée'
    });
  }
  
  // Validate access mode
  const validModes = ['autorise_par_patient', 'urgence', 'connexion_secrete'];
  if (!validModes.includes(mode_acces)) {
    return res.status(400).json({
      success: false,
      error: 'Mode d\'accès invalide'
    });
  }
  
  // Validate duration (1-1440 minutes)
  if (duree_acces < 1 || duree_acces > 1440) {
    return res.status(400).json({
      success: false,
      error: 'Durée d\'accès invalide (1-1440 minutes)'
    });
  }
  
  // Validate reason length
  if (raison_acces.length < 10 || raison_acces.length > 500) {
    return res.status(400).json({
      success: false,
      error: 'Raison d\'accès invalide (10-500 caractères)'
    });
  }
  
  // Create access request
  const accessRequest = {
    id: `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    session_id: session_id,
    medecin_id: session.medecin_id,
    patient_id: session.patient_id,
    mode_acces: mode_acces,
    duree_acces: duree_acces,
    raison_acces: raison_acces,
    statut: 'en_attente',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + duree_acces * 60 * 1000).toISOString()
  };
  
  // Add to history
  mockAccessHistory.push(accessRequest);
  
  res.json({
    success: true,
    data: {
      access_id: accessRequest.id,
      message: 'Demande d\'accès DMP créée avec succès',
      notification_sent: true,
      expires_at: accessRequest.expires_at
    }
  });
});

// Get DMP access history endpoint
app.get('/api/medecin/dmp/historique/:patientId?', verifyToken, (req, res) => {
  const { patientId } = req.params;
  
  let filteredHistory = mockAccessHistory;
  
  if (patientId) {
    filteredHistory = mockAccessHistory.filter(access => 
      access.patient_id.toString() === patientId.toString()
    );
  }
  
  res.json({
    success: true,
    data: filteredHistory.map(access => ({
      id: access.id,
      date: access.created_at,
      medecin: `Dr. ${access.medecin_id}`,
      patient: `Patient ${access.patient_id}`,
      mode: access.mode_acces,
      raison: access.raison_acces,
      statut: access.statut,
      expires_at: access.expires_at
    }))
  });
});

// Validate DMP session endpoint
app.post('/api/medecin/dmp/valider-session', verifyToken, (req, res) => {
  const { session_id } = req.body;
  
  if (!session_id) {
    return res.status(400).json({
      success: false,
      error: 'ID de session manquant'
    });
  }
  
  const session = mockSessions.get(session_id);
  if (!session) {
    return res.status(400).json({
      success: false,
      error: 'Session invalide'
    });
  }
  
  const now = new Date();
  const expiresAt = new Date(session.expires_at);
  
  if (now > expiresAt) {
    return res.status(400).json({
      success: false,
      error: 'Session expirée'
    });
  }
  
  res.json({
    success: true,
    data: {
      valid: true,
      session: session
    }
  });
});

// Close DMP session endpoint
app.post('/api/medecin/dmp/fermer-session', verifyToken, (req, res) => {
  const { session_id } = req.body;
  
  if (!session_id) {
    return res.status(400).json({
      success: false,
      error: 'ID de session manquant'
    });
  }
  
  const deleted = mockSessions.delete(session_id);
  
  if (!deleted) {
    return res.status(400).json({
      success: false,
      error: 'Session non trouvée'
    });
  }
  
  res.json({
    success: true,
    data: {
      message: 'Session fermée avec succès'
    }
  });
});

// Get DMP notifications endpoint
app.get('/api/medecin/dmp/notifications', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        type: 'access_request',
        message: 'Nouvelle demande d\'accès DMP',
        created_at: new Date().toISOString(),
        read: false
      }
    ]
  });
});

// Mock data for patient DMP
const mockPatientDocuments = [
  {
    id: 1,
    patient_id: 5,
    nom: "test API",
    type: "ordonnance",
    description: "document certificat",
    url: "http://localhost:3000/uploads/documents/doc_1754310347742-817240231.pdf",
    taille: 1668173,
    format: "application/pdf",
    createdAt: "2025-08-04T12:25:47.803Z",
    updatedAt: "2025-08-04T12:25:47.803Z",
    patient: {
      nom: "MOLOWA",
      prenom: "ESSONGA"
    }
  }
];

const mockPatientAutoMesures = [
  {
    id: 1,
    patient_id: 5,
    type: "tension",
    valeur: "120/80",
    unite: "mmHg",
    date_mesure: new Date().toISOString(),
    notes: "Mesure matinale"
  },
  {
    id: 2,
    patient_id: 5,
    type: "glycemie",
    valeur: "5.2",
    unite: "mmol/L",
    date_mesure: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    notes: "Mesure avant repas"
  }
];

const mockPatientAccessRights = [
  {
    id: 1,
    patient_id: 5,
    medecin_nom: "Dr. Martin",
    medecin_id: 79,
    type_acces: "consultation",
    duree: 30,
    date_autorisation: new Date().toISOString(),
    statut: "actif"
  }
];

const mockPatientStats = {
  patient_id: 5,
  total_documents: 1,
  total_auto_mesures: 2,
  derniere_connexion: new Date().toISOString(),
  notifications_non_lues: 2
};

// General patient DMP endpoints
app.get('/api/patient/dmp', verifyToken, (req, res) => {
  const patientId = req.query.patient_id || 5;
  
  res.json({
    success: true,
    data: {
      patient_id: patientId,
      statut: "actif",
      derniere_mise_a_jour: new Date().toISOString()
    }
  });
});

app.get('/api/patient/dmp/tableau-de-bord', verifyToken, (req, res) => {
  const patientId = req.query.patient_id || 5;
  
  res.json({
    success: true,
    data: {
      patient_id: patientId,
      documents_count: mockPatientDocuments.length,
      auto_mesures_count: mockPatientAutoMesures.length,
      notifications_count: mockNotificationsDroitsAcces.filter(n => !n.lue).length,
      derniere_activite: new Date().toISOString()
    }
  });
});

app.get('/api/patient/dmp/documents', verifyToken, (req, res) => {
  const patientId = req.query.patient_id || 5;
  
  const patientDocs = mockPatientDocuments.filter(
    doc => doc.patient_id.toString() === patientId.toString()
  );
  
  res.json({
    success: true,
    data: patientDocs
  });
});

app.get('/api/patient/dmp/auto-mesures', verifyToken, (req, res) => {
  const patientId = req.query.patient_id || 5;
  
  const patientAutoMesures = mockPatientAutoMesures.filter(
    mesure => mesure.patient_id.toString() === patientId.toString()
  );
  
  res.json({
    success: true,
    data: patientAutoMesures
  });
});

app.get('/api/patient/dmp/droits-acces', verifyToken, (req, res) => {
  const patientId = req.query.patient_id || 5;
  
  const patientAccessRights = mockPatientAccessRights.filter(
    access => access.patient_id.toString() === patientId.toString()
  );
  
  res.json({
    success: true,
    data: patientAccessRights
  });
});

app.get('/api/patient/dmp/statistiques', verifyToken, (req, res) => {
  const patientId = req.query.patient_id || 5;
  
  res.json({
    success: true,
    data: {
      ...mockPatientStats,
      patient_id: patientId
    }
  });
});

// Patient DMP access rights notifications endpoints
app.get('/api/patient/dmp/droits-acces/notifications', verifyToken, (req, res) => {
  // Get patient ID from token or query parameter
  const patientId = req.query.patient_id || 5; // Default for demo
  
  const patientNotifications = mockNotificationsDroitsAcces.filter(
    notification => notification.patient_id.toString() === patientId.toString()
  );
  
  res.json({
    success: true,
    notifications: patientNotifications
  });
});

app.put('/api/patient/dmp/droits-acces/notifications/:notificationId/lue', verifyToken, (req, res) => {
  const { notificationId } = req.params;
  
  const notification = mockNotificationsDroitsAcces.find(
    n => n.id.toString() === notificationId.toString()
  );
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      error: 'Notification non trouvée'
    });
  }
  
  // Mark as read
  notification.lue = true;
  
  res.json({
    success: true,
    data: {
      message: 'Notification marquée comme lue',
      notification: notification
    }
  });
});

app.post('/api/patient/dmp/droits-acces/demandes/:demandeId/reponse', verifyToken, (req, res) => {
  const { demandeId } = req.params;
  const { reponse } = req.body; // 'accepter' ou 'refuser'
  
  if (!reponse || !['accepter', 'refuser'].includes(reponse)) {
    return res.status(400).json({
      success: false,
      error: 'Réponse invalide. Doit être "accepter" ou "refuser"'
    });
  }
  
  const notification = mockNotificationsDroitsAcces.find(
    n => n.demande_id === demandeId
  );
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      error: 'Demande d\'accès non trouvée'
    });
  }
  
  if (notification.repondue) {
    return res.status(400).json({
      success: false,
      error: 'Cette demande a déjà été répondue'
    });
  }
  
  // Update notification
  notification.repondue = true;
  notification.lue = true;
  
  if (reponse === 'accepter') {
    notification.type = 'acces_autorise';
    notification.titre = 'Accès DMP autorisé';
    notification.message = `Vous avez autorisé l'accès au ${notification.medecin_nom}.`;
  } else {
    notification.type = 'acces_refuse';
    notification.titre = 'Accès DMP refusé';
    notification.message = `Vous avez refusé l'accès au ${notification.medecin_nom}.`;
  }
  
  // Update corresponding access request in mockAccessHistory
  const accessRequest = mockAccessHistory.find(
    access => access.id === demandeId
  );
  
  if (accessRequest) {
    accessRequest.statut = reponse === 'accepter' ? 'autorise' : 'refuse';
  }
  
  res.json({
    success: true,
    data: {
      message: `Demande d'accès ${reponse === 'accepter' ? 'autorisée' : 'refusée'}`,
      notification: notification
    }
  });
});

// Nouveau endpoint pour obtenir les statistiques des notifications
app.get('/api/patient/dmp/notifications/stats', verifyToken, (req, res) => {
  const patientId = req.query.patient_id || 5;
  
  const patientNotifications = mockNotificationsDroitsAcces.filter(
    notification => notification.patient_id.toString() === patientId.toString()
  );
  
  const stats = {
    total: patientNotifications.length,
    non_lues: patientNotifications.filter(n => !n.lue).length,
    demandes_en_attente: patientNotifications.filter(n => n.type === 'demande_acces' && !n.repondue).length,
    acces_autorises: patientNotifications.filter(n => n.type === 'acces_autorise').length,
    acces_refuses: patientNotifications.filter(n => n.type === 'acces_refuse').length
  };
  
  res.json({
    success: true,
    data: stats
  });
});

// Nouveau endpoint pour marquer toutes les notifications comme lues
app.put('/api/patient/dmp/droits-acces/notifications/marquer-toutes-lues', verifyToken, (req, res) => {
  const patientId = req.query.patient_id || 5;
  
  const patientNotifications = mockNotificationsDroitsAcces.filter(
    notification => notification.patient_id.toString() === patientId.toString()
  );
  
  // Marquer toutes les notifications comme lues
  patientNotifications.forEach(notification => {
    notification.lue = true;
  });
  
  res.json({
    success: true,
    data: {
      message: 'Toutes les notifications ont été marquées comme lues',
      count: patientNotifications.length
    }
  });
});

// Nouveau endpoint pour obtenir les détails d'une notification spécifique
app.get('/api/patient/dmp/droits-acces/notifications/:notificationId', verifyToken, (req, res) => {
  const { notificationId } = req.params;
  const patientId = req.query.patient_id || 5;
  
  const notification = mockNotificationsDroitsAcces.find(
    n => n.id.toString() === notificationId.toString() && 
         n.patient_id.toString() === patientId.toString()
  );
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      error: 'Notification non trouvée'
    });
  }
  
  res.json({
    success: true,
    data: notification
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DMP Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`DMP Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 