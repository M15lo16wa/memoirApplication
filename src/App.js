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
import FicheInscription from './pages/ficheInscription';


// protection des routes
import { 
  ProtectedMedecinRoute, 
  ProtectedPatientRoute,
  ProtectedMedecinOrPatientRoute 
} from './services/api/protectedRoute';


function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/connexion" element={<Connexion />} />
      
      {/* Routes pour les médecins uniquement */}
      <Route path="/admin" element={<ProtectedMedecinRoute><Admin /></ProtectedMedecinRoute>} />
      <Route path="/utilisateurs" element={<ProtectedMedecinRoute><Utilisateurs /></ProtectedMedecinRoute>} />
      <Route path='/medecin' element={<ProtectedMedecinRoute><Medecin/></ProtectedMedecinRoute>}/>
      <Route path='/consultation' element={<ProtectedMedecinRoute><Consultation/></ProtectedMedecinRoute>}/>
      
      {/* Routes pour les patients uniquement */}
      <Route path="/dossier-medical" element={<DossierMedical />} />
      <Route path="/dmp" element={<ProtectedPatientRoute><DMP /></ProtectedPatientRoute>} />
      
      {/* Routes accessibles aux médecins ET aux patients */}
      <Route path="/rendezVous" element={<ProtectedMedecinOrPatientRoute><RendezVous /></ProtectedMedecinOrPatientRoute>}/>
      <Route path='/dossier-patient' element={<ProtectedMedecinOrPatientRoute><DossierPatient /></ProtectedMedecinOrPatientRoute>}/>
      
      {/* Routes publiques */}
      <Route path='/fiche-inscription' element={<FicheInscription/>}/>
    </Routes>
  );
}

export default App;

