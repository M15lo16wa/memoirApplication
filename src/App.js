import { Routes, Route } from 'react-router-dom';
import Connexion from './pages/connexion';
import Admin from './pages/Admin';
import HomePage from './pages/HomePage';
import RendezVous from './pages/rendezVous';
import Utilisateurs from './pages/Utilisateur';
import DMP from './pages/DMP';
import DossierMedical from './pages/DossierMedical';
import Medecin from './pages/medecin';
import Consultation from './pages/consultation';
import DossierPatient from './pages/dossierPatient';
import DMPAccess from './pages/DMPAccess';
import PatientAutorisations from './pages/PatientAutorisations';
import FicheInscription from './pages/ficheInscription';
import DMPPatientView from './pages/DMPPatientView';
import Agenda from './pages/agenda';

// messagerie
import { ChatMessage } from './messaging';
// webRTC
import WebRTCPage from './pages/webrtc';


// protection des routes
import { 
  ProtectedMedecinRoute, 
  ProtectedPatientRoute,
  ProtectedMedecinOrPatientRoute,
  ProtectedAdminRoute
} from './services/api/protectedRoute';


function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/connexion" element={<Connexion />} />
      
      {/* Routes pour les administrateurs */}
      <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
      <Route path="/utilisateurs" element={<ProtectedAdminRoute><Utilisateurs /></ProtectedAdminRoute>} />
      
      {/* Routes pour les médecins uniquement */}
      <Route path='/medecin' element={<ProtectedMedecinRoute><Medecin/></ProtectedMedecinRoute>}/>
      <Route path='/consultation' element={<ProtectedMedecinRoute><Consultation/></ProtectedMedecinRoute>}/>
      <Route path='/agenda' element={<ProtectedMedecinRoute><Agenda/></ProtectedMedecinRoute>}/>
      
      {/* Routes pour les patients uniquement */}
      <Route path="/dossier-medical" element={<DossierMedical />} />
      <Route path="/dmp" element={<ProtectedPatientRoute><DMP /></ProtectedPatientRoute>} />
      <Route path="/patient/autorisations" element={<PatientAutorisations />} />
      
      {/* Prise de rendez-vous: publique (pas d'authentification requise) */}
      <Route path="/rendezVous" element={<RendezVous />}/>
      <Route path='/dossier-patient' element={<ProtectedMedecinOrPatientRoute><DossierPatient /></ProtectedMedecinOrPatientRoute>}/>
      
      {/* Routes DMP pour les médecins */}
      <Route path='/dmp-access/:patientId' element={<ProtectedMedecinRoute><DMPAccess /></ProtectedMedecinRoute>}/>
      <Route path='/dmp-patient-view/:patientId' element={<ProtectedMedecinRoute><DMPPatientView /></ProtectedMedecinRoute>}/>
      
      {/* Routes publiques */}
      <Route path='/fiche-inscription' element={<FicheInscription/>}/>
      {/* Nouvelle route pour la messagerie */}
      <Route path="/chat-message" element={<ChatMessage />} />
      {/* Nouvelle route pour la webRTC */}
      <Route path="/webrtc" element={<WebRTCPage />} />
    </Routes>
  );
}

export default App;
