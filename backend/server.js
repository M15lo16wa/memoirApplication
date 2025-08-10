const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// ===== DONNÉES DE SIMULATION =====

// Données simulées pour les notifications DMP
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
  }
];

// Données simulées pour les autorisations
const mockAutorisations = [
  {
    id_acces: "AUTH001",
    professionnel_id: "MED001",
    professionnel_nom: "Dr. Martin",
    professionnel_specialite: "Médecine générale",
    type_acces: "lecture",
    statut: "actif",
    date_creation: "2024-01-10T09:00:00Z",
    date_debut: "2024-01-10T09:00:00Z",
    date_fin: "2024-01-10T11:00:00Z",
    raison_demande: "Consultation de routine pour contrôle diabète",
    session_id: "SESS001"
  },
  {
    id_acces: "AUTH002",
    professionnel_id: "MED002",
    professionnel_nom: "Dr. Dubois",
    professionnel_specialite: "Cardiologie",
    type_acces: "lecture",
    statut: "en_attente",
    date_creation: "2024-01-15T14:30:00Z",
    date_debut: null,
    date_fin: null,
    raison_demande: "Évaluation cardiologique pour douleur thoracique",
    session_id: "SESS002"
  }
];

// Données simulées pour les documents
const mockPatientDocuments = [
  {
    id: 1,
    patient_id: 5,
    nom: "Ordonnance diabète",
    type: "ordonnance",
    description: "Ordonnance pour traitement diabète",
    url: "http://localhost:3000/uploads/documents/doc_1754310347742-817240231.pdf",
    taille: 1668173,
    format: "application/pdf",
    createdAt: "2025-08-04T12:25:47.803Z",
    updatedAt: "2025-08-04T12:25:47.803Z"
  }
];

// Données simulées pour les auto-mesures
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

// ===== ROUTES DMP SIMULÉES =====

// Test DMP system endpoint
app.get('/api/medecin/dmp/test/systeme', verifyToken, (req, res) => {
  console.log('📄 Simulation - Test système DMP');
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
  
  console.log('📄 Simulation - Authentification CPS:', { numero_adeli, code_cps, patient_id });
  
  // Mock validation
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
  
  res.json({
    success: true,
    data: {
      session_id: sessionId,
      authenticated: true,
      message: 'Authentification CPS réussie (simulation)'
    }
  });
});

// Create DMP session endpoint
app.post('/api/medecin/dmp/creer-session', verifyToken, (req, res) => {
  const { patient_id, medecin_id } = req.body;
  
  console.log('📄 Simulation - Création session DMP:', { patient_id, medecin_id });
  
  if (!patient_id || !medecin_id) {
    return res.status(400).json({
      success: false,
      error: 'Données de session incomplètes'
    });
  }
  
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.json({
    success: true,
    data: {
      session_id: sessionId,
      message: 'Session DMP créée avec succès (simulation)'
    }
  });
});

// Request DMP access endpoint
app.post('/api/medecin/dmp/demande-acces', verifyToken, (req, res) => {
  const { patient_id, type_acces, duree, raison_demande } = req.body;
  
  console.log('📄 Simulation - Demande d\'accès DMP:', { patient_id, type_acces, duree, raison_demande });
  
  if (!patient_id || !type_acces || !duree || !raison_demande) {
    return res.status(400).json({
      success: false,
      error: 'Données de demande d\'accès incomplètes'
    });
  }
  
  const accessId = `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.json({
    success: true,
    data: {
      access_id: accessId,
      message: 'Demande d\'accès DMP créée avec succès (simulation)',
      notification_sent: true,
      expires_at: new Date(Date.now() + duree * 60 * 1000).toISOString()
    }
  });
});

// Get DMP access history endpoint
app.get('/api/medecin/dmp/historique/:patientId?', verifyToken, (req, res) => {
  const { patientId } = req.params;
  
  console.log('📄 Simulation - Historique DMP pour patient:', patientId);
  
  res.json({
    success: true,
    data: [
      {
        id: "HIST001",
        date: new Date().toISOString(),
        medecin: "Dr. Martin",
        patient: `Patient ${patientId || '5'}`,
        mode: "lecture",
        raison: "Consultation de routine",
        statut: "termine",
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
    ]
  });
});

// Validate DMP session endpoint
app.post('/api/medecin/dmp/valider-session', verifyToken, (req, res) => {
  const { session_id } = req.body;
  
  console.log('📄 Simulation - Validation session DMP:', session_id);
  
  if (!session_id) {
    return res.status(400).json({
      success: false,
      error: 'ID de session manquant'
    });
  }
  
  res.json({
    success: true,
    data: {
      valid: true,
      session: {
        session_id: session_id,
        medecin_id: 79,
        patient_id: 5,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
    }
  });
});

// Close DMP session endpoint
app.post('/api/medecin/dmp/fermer-session', verifyToken, (req, res) => {
  const { session_id } = req.body;
  
  console.log('📄 Simulation - Fermeture session DMP:', session_id);
  
  if (!session_id) {
    return res.status(400).json({
      success: false,
      error: 'ID de session manquant'
    });
  }
  
  res.json({
    success: true,
    data: {
      message: 'Session fermée avec succès (simulation)'
    }
  });
});

// Get DMP notifications endpoint
app.get('/api/medecin/dmp/notifications/:sessionId', verifyToken, (req, res) => {
  const { sessionId } = req.params;
  
  console.log('📄 Simulation - Notifications DMP pour session:', sessionId);
  
  res.json({
    success: true,
    data: {
      session_id: sessionId,
      notifications: [
        {
          id: "NOTIF001",
          type: "acces_autorise",
          message: "Accès autorisé au DMP",
          date: new Date().toISOString(),
          statut: "non_lu"
        }
      ]
    }
  });
});

// Validate DMP session status endpoint
app.get('/api/medecin/dmp/session/:sessionId/statut', verifyToken, (req, res) => {
  const { sessionId } = req.params;
  
  console.log('📄 Simulation - Statut session DMP:', sessionId);
  
  res.json({
    success: true,
    data: {
      session_id: sessionId,
      statut: "active",
      date_creation: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      duree_restante_minutes: 30,
      acces_autorise: true
    }
  });
});

// Close DMP session endpoint
app.post('/api/medecin/dmp/session/:sessionId/fermer', verifyToken, (req, res) => {
  const { sessionId } = req.params;
  
  console.log('📄 Simulation - Fermeture session DMP:', sessionId);
  
  res.json({
    success: true,
    data: {
      message: "Session DMP fermée avec succès (simulation)",
      session_id: sessionId,
      date_fermeture: new Date().toISOString()
    }
  });
});

// ===== ROUTES PATIENT DMP SIMULÉES =====

// General patient DMP endpoint
app.get('/api/patient/dmp', verifyToken, (req, res) => {
  console.log('📄 Simulation - DMP patient');
  
  res.json({
    success: true,
    data: {
      patient_id: 5,
      nom: "Dupont",
      prenom: "Jean",
      date_naissance: "1985-03-15",
      groupe_sanguin: "A+",
      allergies: ["Pénicilline", "Latex"],
      antecedents: [
        {
          id: 1,
          type: "Chirurgie",
          description: "Appendicectomie",
          date: "2010-05-20",
          etablissement: "Hôpital Central"
        }
      ],
      traitements_actuels: [
        {
          id: 1,
          medicament: "Metformine",
          dosage: "500mg",
          frequence: "2x/jour",
          date_debut: "2015-08-15",
          prescripteur: "Dr. Martin"
        }
      ],
      derniere_mise_a_jour: new Date().toISOString()
    }
  });
});

// Update DMP endpoint
app.put('/api/patient/dmp', verifyToken, (req, res) => {
  const dmpData = req.body;
  
  console.log('📄 Simulation - Mise à jour DMP:', dmpData);
  
  res.json({
    success: true,
    data: {
      message: "DMP mis à jour avec succès (simulation)",
      data: dmpData
    }
  });
});

// Historique médical endpoint
app.get('/api/patient/dmp/historique-medical', verifyToken, (req, res) => {
  console.log('📄 Simulation - Historique médical');
  
  res.json({
    success: true,
    data: {
      patient_id: 5,
      consultations: [
        {
          id: 1,
          date: "2024-01-15",
          medecin: "Dr. Martin",
          motif: "Contrôle diabète",
          diagnostic: "Diabète stable",
          prescription: "Continuer Metformine",
          notes: "Glycémie à jeun: 1.26 g/l"
        }
      ],
      examens: [
        {
          id: 1,
          date: "2024-01-12",
          type: "Analyse sanguine",
          resultats: "Glycémie: 1.26 g/l, HbA1c: 6.8%",
          laboratoire: "Labo Central"
        }
      ]
    }
  });
});

// Add historique entry endpoint
app.post('/api/patient/dmp/historique-medical', verifyToken, (req, res) => {
  const entry = req.body;
  
  console.log('📄 Simulation - Ajout entrée historique:', entry);
  
  res.json({
    success: true,
    data: {
      message: "Entrée ajoutée à l'historique (simulation)",
      data: entry
    }
  });
});

// Journal activité endpoint
app.get('/api/patient/dmp/journal-activite', verifyToken, (req, res) => {
  const filters = req.query;
  
  console.log('📄 Simulation - Journal activité avec filtres:', filters);
  
  res.json({
    success: true,
    data: {
      activites: [
        {
          id: 1,
          type: "consultation",
          date: "2024-01-15T10:00:00Z",
          description: "Consultation Dr. Martin",
          statut: "termine"
        },
        {
          id: 2,
          type: "autorisation",
          date: "2024-01-15T14:30:00Z",
          description: "Demande d'accès Dr. Dubois",
          statut: "en_attente"
        }
      ]
    }
  });
});

// Droits d'accès endpoint
app.get('/api/patient/dmp/droits-acces', verifyToken, (req, res) => {
  console.log('📄 Simulation - Droits d\'accès');
  
  res.json({
    success: true,
    data: {
      droits: {
        lecture: true,
        ecriture: false,
        administration: false,
        partage: true
      }
    }
  });
});

// Update droits d'accès endpoint
app.put('/api/patient/dmp/droits-acces', verifyToken, (req, res) => {
  const droits = req.body;
  
  console.log('📄 Simulation - Mise à jour droits d\'accès:', droits);
  
  res.json({
    success: true,
    data: {
      message: "Droits d'accès mis à jour (simulation)",
      data: droits
    }
  });
});

// Notifications droits d'accès endpoint
app.get('/api/patient/dmp/droits-acces/notifications', verifyToken, (req, res) => {
  console.log('📄 Simulation - Notifications droits d\'accès');
  
  res.json({
    success: true,
    notifications: mockNotificationsDroitsAcces
  });
});

// Marquer notification comme lue endpoint
app.put('/api/patient/dmp/droits-acces/notifications/:notificationId/lue', verifyToken, (req, res) => {
  const { notificationId } = req.params;
  
  console.log('📄 Simulation - Marquer notification comme lue:', notificationId);
  
  res.json({
    success: true,
    data: {
      message: "Notification marquée comme lue (simulation)",
      notification_id: notificationId
    }
  });
});

// Répondre à une demande d'accès endpoint
app.post('/api/patient/dmp/droits-acces/demandes/:demandeId/reponse', verifyToken, (req, res) => {
  const { demandeId } = req.params;
  const { reponse } = req.body;
  
  console.log('📄 Simulation - Réponse demande d\'accès:', { demandeId, reponse });
  
  res.json({
    success: true,
    data: {
      message: `Demande ${reponse} avec succès (simulation)`,
      demande_id: demandeId,
      reponse: reponse
    }
  });
});

// Statistiques notifications endpoint
app.get('/api/patient/dmp/notifications/stats', verifyToken, (req, res) => {
  console.log('📄 Simulation - Statistiques notifications');
  
  res.json({
    success: true,
    data: {
      total: 1,
      non_lues: 1,
      lues: 0,
      en_attente: 1,
      acceptees: 0,
      refusees: 0
    }
  });
});

// Marquer toutes notifications comme lues endpoint
app.put('/api/patient/dmp/droits-acces/notifications/marquer-toutes-lues', verifyToken, (req, res) => {
  console.log('📄 Simulation - Marquer toutes notifications comme lues');
  
  res.json({
    success: true,
    data: {
      message: "Toutes les notifications marquées comme lues (simulation)",
      notifications_marquees: 1
    }
  });
});

// Détails notification endpoint
app.get('/api/patient/dmp/droits-acces/notifications/:notificationId', verifyToken, (req, res) => {
  const { notificationId } = req.params;
  
  console.log('📄 Simulation - Détails notification:', notificationId);
  
  const notification = mockNotificationsDroitsAcces.find(n => n.id.toString() === notificationId);
  
  res.json({
    success: true,
    data: notification || {
      id_notification: notificationId,
      type_notification: "demande_acces",
      professionnel_id: "MED001",
      professionnel_nom: "Dr. Test",
      date_creation: "2024-01-15T10:00:00Z",
      statut_envoi: "non_lu"
    }
  });
});

// Auto-mesures endpoint
app.get('/api/patient/dmp/auto-mesures', verifyToken, (req, res) => {
  const { type } = req.query;
  
  console.log('📄 Simulation - Auto-mesures, type:', type);
  
  let mesures = mockPatientAutoMesures;
  if (type) {
    mesures = mockPatientAutoMesures.filter(m => m.type === type);
  }
  
  res.json({
    success: true,
    data: {
      mesures: mesures
    }
  });
});

// Create auto-mesure endpoint
app.post('/api/patient/dmp/auto-mesures', verifyToken, (req, res) => {
  const mesureData = req.body;
  
  console.log('📄 Simulation - Création auto-mesure:', mesureData);
  
  res.json({
    success: true,
    data: {
      message: "Auto-mesure créée avec succès (simulation)",
      data: { id: Date.now(), ...mesureData, date_mesure: new Date().toISOString() }
    }
  });
});

// Rendez-vous endpoint
app.get('/api/patient/dmp/rendez-vous', verifyToken, (req, res) => {
  console.log('📄 Simulation - Rendez-vous');
  
  res.json({
    success: true,
    data: {
      rendez_vous: [
        {
          id: 1,
          date: "2024-01-20T10:00:00Z",
          medecin: "Dr. Martin",
          specialite: "Médecine générale",
          motif: "Contrôle diabète",
          statut: "confirme"
        },
        {
          id: 2,
          date: "2024-01-25T14:30:00Z",
          medecin: "Dr. Dubois",
          specialite: "Cardiologie",
          motif: "Évaluation cardiologique",
          statut: "en_attente"
        }
      ]
    }
  });
});

// Create rendez-vous endpoint
app.post('/api/patient/dmp/rendez-vous', verifyToken, (req, res) => {
  const rdvData = req.body;
  
  console.log('📄 Simulation - Création rendez-vous:', rdvData);
  
  res.json({
    success: true,
    data: {
      message: "Rendez-vous créé avec succès (simulation)",
      data: { id: Date.now(), ...rdvData }
    }
  });
});

// Documents endpoint
app.get('/api/patient/dmp/documents', verifyToken, (req, res) => {
  const { type } = req.query;
  
  console.log('📄 Simulation - Documents, type:', type);
  
  let documents = mockPatientDocuments;
  if (type) {
    documents = mockPatientDocuments.filter(d => d.type === type);
  }
  
  res.json({
    success: true,
    data: {
      documents: documents
    }
  });
});

// Upload document endpoint
app.post('/api/patient/dmp/upload-document', verifyToken, (req, res) => {
  const documentData = req.body;
  
  console.log('📄 Simulation - Upload document:', documentData);
  
  res.json({
    success: true,
    data: {
      message: "Document uploadé avec succès (simulation)",
      data: {
        id: Date.now(),
        nom: documentData.file?.name || "Document",
        type: documentData.type,
        date_upload: new Date().toISOString()
      }
    }
  });
});

// Bibliothèque santé endpoint
app.get('/api/patient/dmp/bibliotheque-sante', verifyToken, (req, res) => {
  console.log('📄 Simulation - Bibliothèque santé');
  
  res.json({
    success: true,
    data: {
      ressources: [
        {
          id: 1,
          titre: "Guide du diabète",
          type: "guide",
          description: "Informations sur la gestion du diabète",
          url: "#"
        },
        {
          id: 2,
          titre: "Conseils nutritionnels",
          type: "conseil",
          description: "Recommandations alimentaires",
          url: "#"
        }
      ]
    }
  });
});

// Statistiques endpoint
app.get('/api/patient/dmp/statistiques', verifyToken, (req, res) => {
  const { periode } = req.query;
  
  console.log('📄 Simulation - Statistiques, période:', periode);
  
  res.json({
    success: true,
    data: {
      periode: periode || '30j',
      consultations: 2,
      autorisations: 2,
      auto_mesures: 5,
      documents: 3,
      activite_moyenne: "2.5 consultations/mois"
    }
  });
});

// Tableau de bord endpoint
app.get('/api/patient/dmp/tableau-de-bord', verifyToken, (req, res) => {
  console.log('📄 Simulation - Tableau de bord');
  
  res.json({
    success: true,
    data: {
      resume: {
        derniere_consultation: "2024-01-15",
        prochain_rdv: "2024-01-20",
        autorisations_actives: 1,
        notifications_non_lues: 1
      },
      alertes: [
        {
          type: "glycemie",
          message: "Glycémie élevée détectée",
          niveau: "modere"
        }
      ],
      activites_recentes: [
        {
          type: "consultation",
          date: "2024-01-15",
          description: "Consultation Dr. Martin"
        }
      ]
    }
  });
});

// Rappels endpoint
app.get('/api/patient/dmp/rappels', verifyToken, (req, res) => {
  console.log('📄 Simulation - Rappels');
  
  res.json({
    success: true,
    data: {
      rappels: [
        {
          id: 1,
          type: "consultation",
          titre: "Rendez-vous Dr. Martin",
          date: "2024-01-20T10:00:00Z",
          description: "Contrôle diabète",
          statut: "a_venir"
        },
        {
          id: 2,
          type: "mesure",
          titre: "Mesure glycémie",
          date: "2024-01-16T08:00:00Z",
          description: "Mesure à jeun",
          statut: "a_venir"
        }
      ]
    }
  });
});

// Autorisations endpoint
app.get('/api/patient/dmp/autorisations', verifyToken, (req, res) => {
  console.log('📄 Simulation - Autorisations');
  
  res.json({
    success: true,
    data: mockAutorisations
  });
});

// Create autorisation endpoint
app.post('/api/patient/dmp/autorisations', verifyToken, (req, res) => {
  const autorisationData = req.body;
  
  console.log('📄 Simulation - Création autorisation:', autorisationData);
  
  res.json({
    success: true,
    data: {
      message: "Autorisation directe créée avec succès (simulation)",
      autorisation_id: "AUTH_" + Date.now(),
      statut: "actif",
      date_creation: new Date().toISOString(),
      data: autorisationData
    }
  });
});

// Accepter autorisation endpoint
app.post('/api/patient/dmp/autorisations/:autorisationId/accepter', verifyToken, (req, res) => {
  const { autorisationId } = req.params;
  const { commentaire } = req.body;
  
  console.log('📄 Simulation - Acceptation autorisation:', { autorisationId, commentaire });
  
  res.json({
    success: true,
    data: {
      message: "Autorisation acceptée avec succès (simulation)",
      autorisation_id: autorisationId,
      statut: "actif",
      date_acceptation: new Date().toISOString()
    }
  });
});

// Refuser autorisation endpoint
app.post('/api/patient/dmp/autorisations/:autorisationId/refuser', verifyToken, (req, res) => {
  const { autorisationId } = req.params;
  const { raison_refus } = req.body;
  
  console.log('📄 Simulation - Refus autorisation:', { autorisationId, raison_refus });
  
  res.json({
    success: true,
    data: {
      message: "Autorisation refusée avec succès (simulation)",
      autorisation_id: autorisationId,
      statut: "refuse",
      raison_refus: raison_refus,
      date_refus: new Date().toISOString()
    }
  });
});

// Vérifier accès endpoint
app.get('/api/dmp/verifier-acces', verifyToken, (req, res) => {
  const { professionnel_id, patient_id } = req.query;
  
  console.log('📄 Simulation - Vérification accès:', { professionnel_id, patient_id });
  
  res.json({
    success: true,
    data: {
      acces_autorise: true,
      type_acces: "lecture",
      date_expiration: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      session_id: "SESS_" + Date.now()
    }
  });
});

// Durée restante endpoint
app.get('/api/dmp/autorisations/:autorisationId/duree-restante', verifyToken, (req, res) => {
  const { autorisationId } = req.params;
  
  console.log('📄 Simulation - Durée restante autorisation:', autorisationId);
  
  res.json({
    success: true,
    data: {
      autorisation_id: autorisationId,
      duree_restante_minutes: 45,
      date_expiration: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      statut: "actif"
    }
  });
});

// Autorisations demandées endpoint (médecin)
app.get('/api/medecin/dmp/autorisations', verifyToken, (req, res) => {
  console.log('📄 Simulation - Autorisations demandées (médecin)');
  
  res.json({
    success: true,
    data: {
      demandes: [
        {
          id: "DEM001",
          patient_id: "PAT001",
          patient_nom: "Dupont Jean",
          type_acces: "lecture",
          statut: "en_attente",
          date_demande: "2024-01-15T14:30:00Z",
          raison_demande: "Consultation de routine"
        }
      ]
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DMP Backend API is running (simulation mode)',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`DMP Backend server running on port ${PORT} (simulation mode)`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 