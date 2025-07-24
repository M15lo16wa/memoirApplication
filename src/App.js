import { Routes, Route } from 'react-router-dom';
import Connexion from './pages/connexion';
import Admin from './pages/Admin';
import HomePage from './pages/HomePage';
import RendezVous from './pages/rendezVous';
import Utilisateurs from './pages/Utilisateur';
import DossierMedical from './pages/DossierMedical';
import Medecin from './pages/medecin';
import Consultation from './pages/consultation';
import DossierPatient from './pages/dossierPatient';
import FicheInscription from './pages/ficheInscription';

// protection des routes
import ProtectedRoute from './services/api/protectedRoute';


function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/rendezVous" element={<RendezVous />}/>
      <Route path="/utilisateurs" element={<ProtectedRoute><Utilisateurs /></ProtectedRoute>} />
      <Route path="/dossier-medical" element={<ProtectedRoute><DossierMedical /></ProtectedRoute>} />
      <Route path='/medecin' element={<ProtectedRoute><Medecin/></ProtectedRoute>}/>
      <Route path='/consultation' element={<ProtectedRoute><Consultation/></ProtectedRoute>}/>
      <Route path='/dossier-patient' element={<ProtectedRoute><DossierPatient/></ProtectedRoute>}/>
      <Route path='/fiche-inscription' element={<FicheInscription/>}/>
    </Routes>
  );
}

export default App;

