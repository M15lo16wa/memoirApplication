import React, { useState } from "react";

const DossierMedical = () => {
  // MOCK DATA
  const [profil] = useState({
    avatar: "👤",
    nom: "Samba Ndiaye",
    dateNaissance: "01/01/1980"
  });
  const [alertes] = useState([
    { message: "Allergie à la pénicilline" },
    { message: "Diabète de type 2" }
  ]);
  const [rendezVous] = useState({
    details: "15 juin 2024 à 10h00 avec Dr. Ba (Cardiologue)"
  });
  const [traitement] = useState({
    nom: "Metformine 500mg, 2x/jour"
  });
  const [documents] = useState([
    {
      type: "Ordonnance",
      date: "10/05/2024",
      medecin: "Dr. Ba",
      specialite: "Cardiologie",
      lienVoir: "#",
      lienTelecharger: "#"
    },
    {
      type: "Résultat d'analyse",
      date: "08/05/2024",
      medecin: "Dr. Diop",
      specialite: "Biologie",
      lienVoir: "#",
      lienTelecharger: "#"
    }
  ]);
  const [resume] = useState({
    pathologies: "Diabète, Hypertension",
    antecedents: "Père: diabète, Mère: hypertension",
    groupeSanguin: "O+",
    derniereHospitalisation: "Mars 2023"
  });
  const [parametresBio] = useState({
    valeurs: "Glycémie: 1.2g/L, Cholestérol: 2.1g/L"
  });
  const [loading] = useState(false);
  const [error] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Supprimer le useEffect d'origine

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 pt-16">
      {/* Sidebar responsive */}
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}
      <aside className={`fixed z-50 top-0 left-0 h-full w-64 bg-white border-r flex flex-col items-center py-6 px-4 transform transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:flex md:translate-x-0 md:w-64 md:h-auto`}> 
        <button className="absolute top-4 right-4 md:hidden text-gray-500 text-2xl" onClick={() => setSidebarOpen(false)}>&times;</button>
        <div className="flex flex-col items-center mb-8 mt-8 md:mt-0">
          {/* Profil patient */}
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold mb-2">{profil?.avatar || "?"}</div>
          <div className="text-gray-800 font-semibold">{profil?.nom || "Nom Patient"}</div>
          <div className="text-gray-500 text-sm">Né le {profil?.dateNaissance || "--/--/----"}</div>
        </div>
        <nav className="flex-1 w-full">
          <ul className="space-y-2">
            {/* Menu dynamique si besoin */}
            <li><a href="#" className="flex items-center px-3 py-2 rounded-md bg-blue-50 text-blue-600 font-medium"><span className="mr-2"><i className="fas fa-tachometer-alt"></i></span>Tableau de bord</a></li>
            <li><a href="#" className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"><span className="mr-2"><i className="fas fa-pills"></i></span>Traitements</a></li>
            <li><a href="#" className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"><span className="mr-2"><i className="fas fa-vials"></i></span>Résultats d'examens</a></li>
            <li><a href="#" className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"><span className="mr-2"><i className="fas fa-user-shield"></i></span>Gestion des accès</a></li>
            <li><a href="#" className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"><span className="mr-2"><i className="fas fa-history"></i></span>Historique des accès</a></li>
            <li><a href="#" className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"><span className="mr-2"><i className="fas fa-envelope"></i></span>Messagerie sécurisée <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2">3</span></a></li>
          </ul>
        </nav>
        <button className="mt-auto w-full flex items-center px-3 py-2 rounded-md text-gray-500 hover:bg-gray-100"><i className="fas fa-sign-out-alt mr-2"></i>Déconnexion</button>
      </aside>
      {/* Bouton menu burger */}
      <button className="fixed top-20 left-4 z-50 md:hidden bg-white border rounded-full p-2 shadow-md" onClick={() => setSidebarOpen(true)}>
        <i className="fas fa-bars text-xl text-gray-700"></i>
      </button>
      {/* Main Content responsive */}
      <main className="flex-1 p-2 sm:p-4 md:p-8 md:ml-64 w-full">
        <div className="flex flex-col gap-4">
          {/* Header & Alerts */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Mon Dossier Médical Partagé</h1>
            <button className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base">+ Nouveau document</button>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              {/* Alertes (ex: allergies) */}
              {alertes && alertes.length > 0 ? (
                alertes.map((alerte, idx) => (
                  <div key={idx} className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded flex items-center mb-2 text-sm sm:text-base">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    <span>{alerte.message}</span>
                  </div>
                ))
              ) : null}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              {/* Prochain rendez-vous */}
              {rendezVous && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex items-center text-sm sm:text-base">
                  <i className="fas fa-calendar-alt mr-2"></i>
                  <span>Prochain rendez-vous<br /><span className="font-normal text-xs text-blue-600">{rendezVous.details}</span></span>
                </div>
              )}
              {/* Traitement en cours */}
              {traitement && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center text-sm sm:text-base">
                  <i className="fas fa-check-circle mr-2"></i>
                  <span>Traitement en cours<br /><span className="font-normal text-xs text-green-700">{traitement.nom}</span></span>
                </div>
              )}
            </div>
          </div>
          {/* Documents récents */}
          <div className="bg-white rounded-lg shadow p-2 sm:p-4 md:p-6 mb-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Documents récents</h2>
              <a href="#" className="text-blue-600 text-xs sm:text-sm font-medium">Voir tout</a>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[500px] w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b">
                    <th className="py-2">Type</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Médecin</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents && documents.length > 0 ? (
                    documents.map((doc, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2"><span className="font-medium text-blue-600">{doc.type}</span></td>
                        <td className="py-2">{doc.date}</td>
                        <td className="py-2"><span className="font-medium">{doc.medecin}</span><br /><span className="text-xs text-gray-500">{doc.specialite}</span></td>
                        <td className="py-2"><a href={doc.lienVoir || "#"} className="text-blue-600 mr-2">Voir</a><a href={doc.lienTelecharger || "#"} className="text-gray-500">Télécharger</a></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="text-center text-gray-400 py-4">Aucun document récent</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Résumé médical & Paramètres biologiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-md font-semibold mb-2">Résumé médical</h3>
              {resume ? (
                <>
                  <div className="mb-2">
                    <div className="font-medium">Pathologies chroniques</div>
                    <div className="text-gray-700 text-xs sm:text-sm">{resume.pathologies}</div>
                  </div>
                  <div className="mb-2">
                    <div className="font-medium">Antécédents familiaux</div>
                    <div className="text-gray-700 text-xs sm:text-sm">{resume.antecedents}</div>
                  </div>
                  <div className="mb-2">
                    <div className="font-medium">Groupe sanguin</div>
                    <div className="text-gray-700 text-xs sm:text-sm">{resume.groupeSanguin}</div>
                  </div>
                  <div>
                    <div className="font-medium">Dernière hospitalisation</div>
                    <div className="text-gray-700 text-xs sm:text-sm">{resume.derniereHospitalisation}</div>
                  </div>
                </>
              ) : <div className="text-gray-400">Aucun résumé disponible</div>}
            </div>
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 flex flex-col items-center justify-center">
              <h3 className="text-md font-semibold mb-2">Paramètres biologiques</h3>
              {/* Ici tu pourras afficher un graphique ou des valeurs */}
              {parametresBio ? (
                <div className="w-full flex items-center justify-center">
                  {/* Exemple : Affichage d'une image ou d'un graphique */}
                  <div className="bg-gray-200 flex items-center justify-center w-full h-32 sm:h-48 text-gray-400 text-2xl sm:text-4xl">{parametresBio.valeurs || ""}</div>
                </div>
              ) : <div className="bg-gray-100 w-full h-32 sm:h-48 flex items-center justify-center text-gray-400">Aucun paramètre</div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DossierMedical; 