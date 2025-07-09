import { Routes, Route } from 'react-router-dom';
import Connexion from './pages/connexion';
import Admin from './pages/Admin';
import HomePage from './pages/HomePage';
import RendezVous from './pages/rendezVous';
import Utilisateurs from './pages/Utilisateur';
import DossierMedical from './pages/DossierMedical';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/rendezVous" element={<RendezVous />}/>
      <Route path="/utilisateurs" element={<Utilisateurs />} />
      <Route path="/dossier-medical" element={<DossierMedical />} />
    </Routes>
  );
}

export default App;

