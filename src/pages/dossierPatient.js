import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Les données statiques pour l'exemple, on peut les remplacer par des props ou du state dynamique plus tard
const patients = [
  {
    name: "Jean Martin",
    birth: "15/03/1978",
    status: "Actif",
    specialties: ["Cardiologie", "Diabète"],
    statusColor: "green",
    lastConsult: "10/05/2023",
    gender: "Homme",
    address: "12 Rue de la Paix, Paris",
    phone: "0612345678",
    email: "jean.martin@email.com",
    emergencyContacts: [
      { name: "Claire Martin", type: "Épouse", phone: "0612345679" },
      { name: "Lucas Martin", type: "Fils", phone: "0712345680" },
    ],
    pathologies: [
      "Hypertension artérielle (depuis 2018)",
      "Hypercholestérolémie (depuis 2020)",
      "Diabète type II (depuis 2021)",
    ],
    allergies: [
      "Penicilline (réaction cutanée)",
      "Pollens (rhinite saisonnière)",
    ],
    consultations: [
      { date: "10/05/2023", reason: "Suivi hypertension", doctor: "Dr. Dupont" },
      { date: "22/03/2023", reason: "Analyse diabète", doctor: "Dr. Dupont" },
    ],
    treatments: [
      { name: "Metformine", dose: "500mg", desc: "1 comprimé matin et soir", since: "15/01/2022" },
      { name: "Atorvastatine", dose: "20mg", desc: "1 comprimé le soir", since: "03/10/2021" },
    ],
    blood: "O+",
    age: 45,
    image: "https://placehold.co/150"
  },
  {
    name: "Marie Dubois",
    birth: "22/08/1985",
    status: "En attente",
    specialties: ["Pneumologie"],
    statusColor: "yellow",
    lastConsult: "18/04/2023",
    gender: "Femme",
    image: "https://placehold.co/150"
  },
  {
    name: "Pierre Lambert",
    birth: "03/11/1962",
    status: "Actif",
    specialties: ["Neurologie", "Hypertension"],
    statusColor: "green",
    lastConsult: "02/05/2023",
    gender: "Homme",
    image: "https://placehold.co/150"
  }
];

const sharedFolders = [
  {
    patient: patients[0],
    sharedService: "Cardiologie - Hôpital Central",
    doctor: "Dr. Sophie Laurent",
    sharedDate: "12/05/2023",
    status: "Actif",
    statusColor: "green"
  },
  {
    patient: patients[1],
    sharedService: "Pneumologie - Clinique du Nord",
    doctor: "Dr. Marc Thierry",
    sharedDate: "25/04/2023",
    status: "En attente",
    statusColor: "yellow"
  }
];

const accessRules = [
  {
    consultant: {
      name: "Dr. Sophie Laurent",
      specialty: "Cardiologie",
      image: "https://placehold.co/40"
    },
    patient: patients[0],
    access: "Lecture et écriture",
    expires: "12/08/2023"
  },
  {
    consultant: {
      name: "Dr. Marc Thierry",
      specialty: "Pneumologie",
      image: "https://placehold.co/40"
    },
    patient: patients[1],
    access: "Lecture seule",
    expires: "25/07/2023"
  }
];

const accessHistory = [
  {
    date: "10/05/2023 09:45",
    consultant: "Dr. Sophie Laurent",
    patient: "Jean Martin",
    action: "Consultation du dossier médical"
  },
  {
    date: "25/04/2023 14:32",
    consultant: "Dr. Marc Thierry",
    patient: "Marie Dubois",
    action: "Ajout d'une prescription"
  }
];

const notifications = [
  {
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "Demande de partage de dossier",
    time: "10 min ago",
    content: "Dr. Sophie Laurent demande l'accès au dossier de Jean Martin",
    actions: [
      { label: "Approuver", color: "bg-green-100 text-green-800 hover:bg-green-200" },
      { label: "Refuser", color: "bg-red-100 text-red-800 hover:bg-red-200" }
    ]
  },
  {
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    title: "Nouvelle prescription",
    time: "1 heure ago",
    content: "Dr. Marc Thierry a ajouté une nouvelle prescription pour Marie Dubois",
    actions: [
      { label: "Voir la prescription", color: "bg-blue-100 text-blue-800 hover:bg-blue-200" }
    ]
  }
];

function DossierPatient() {
  const navigate = useNavigate();
  // Onglets principaux
  const [activeTab, setActiveTab] = useState("patients-list");

  // Pour modals
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [modalPatient, setModalPatient] = useState(null);

  // Edition & Ajout
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPatient, setEditPatient] = useState(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePatient, setSharePatient] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);

  // Recherche (mock, pas de filtre ici)
  const [search, setSearch] = useState("");

  // Filtres mock (non utilisés dans cet exemple)
  const [filterRecent, setFilterRecent] = useState(false);
  const [filterShared, setFilterShared] = useState(false);

  // Gestion ouverture/fermeture modal
  function openPatientModal(patient) {
    setModalPatient(patient);
    setShowPatientModal(true);
  }
  function closePatientModal() {
    setShowPatientModal(false);
    setModalPatient(null);
  }
  function openEditModal(patient) {
    setEditPatient(patient);
    setShowEditModal(true);
  }
  function closeEditModal() {
    setShowEditModal(false);
    setEditPatient(null);
  }
  function openShareModal(patient) {
    setSharePatient(patient);
    setShowShareModal(true);
  }
  function closeShareModal() {
    setShowShareModal(false);
    setSharePatient(null);
  }
  function openAddModal() {
    setShowAddModal(true);
  }
  function closeAddModal() {
    setShowAddModal(false);
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <button 
        onClick={() => navigate('/medecin')} 
        className="fixed top-4 left-4 z-10 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Retour
      </button>
    
      <div className="flex container mx-auto">
        {/* Sidebar */}
        <div className="sidebar w-64 bg-white p-4 shadow-md">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Menu</h2>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab("patients-list")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${activeTab === "patients-list" ? "bg-blue-100 font-bold" : "hover:bg-blue-50"}`}>
                  <span>📁</span> <span>Liste des Patients</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("shared-folder")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${activeTab === "shared-folder" ? "bg-blue-100 font-bold" : "hover:bg-blue-50"}`}>
                  <span>🔄</span> <span>Dossiers Mutualisés</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("access-manager")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${activeTab === "access-manager" ? "bg-blue-100 font-bold" : "hover:bg-blue-50"}`}>
                  <span>🔒</span> <span>Gestion des Accès</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 relative ${activeTab === "notifications" ? "bg-blue-100 font-bold" : "hover:bg-blue-50"}`}>
                  <span>🔔</span> <span>Notifications</span>
                  <span className="notification-badge absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center" style={{display:"inline"}}>3</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Recherche</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un patient..."
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="absolute right-2 top-2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Filtres</h2>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-blue-500" checked={filterRecent} onChange={() => setFilterRecent(v=>!v)} />
                <span>Consultation récente</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-blue-500" checked={filterShared} onChange={() => setFilterShared(v=>!v)} />
                <span>Dossiers mutualisés</span>
              </label>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="content-area flex-1 p-6">
          {/* Patients List */}
          {activeTab === "patients-list" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Liste des Patients</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700" onClick={openAddModal}>+ Ajouter un patient</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patients.map((p, idx) => (
                  <div key={idx} className="patient-card bg-white rounded-lg shadow-md p-4 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{p.name}</h3>
                        <p className="text-gray-500 text-sm">Né le {p.birth}</p>
                      </div>
                      <span className={`bg-${p.statusColor}-100 text-${p.statusColor}-800 text-xs px-2 py-1 rounded-md`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      {p.specialties?.map((spec, i) => (
                        <span key={i} className={`bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md`}>{spec}</span>
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4">Dernière consultation: {p.lastConsult}</p>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-end">
                      <button className="text-blue-600 hover:text-blue-800" onClick={()=>openPatientModal(p)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button className="text-yellow-600 hover:text-yellow-800" onClick={()=>openEditModal(p)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className="text-green-600 hover:text-green-800" onClick={()=>openShareModal(p)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Shared Folders */}
          {activeTab === "shared-folder" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Dossiers Mutualisés</h2>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service partagé avec</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de partage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sharedFolders.map((sf, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src={sf.patient.image || "https://placehold.co/40"} alt={`Photo de ${sf.patient.name}`}/>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{sf.patient.name}</div>
                              <div className="text-sm text-gray-500">Né le {sf.patient.birth}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{sf.sharedService}</div>
                          <div className="text-sm text-gray-500">{sf.doctor}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sf.sharedDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${sf.statusColor}-100 text-${sf.statusColor}-800`}>{sf.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">Voir</button>
                          {sf.status === "Actif"
                            ? <button className="text-red-600 hover:text-red-900">Révoquer</button>
                            : <button className="text-green-600 hover:text-green-900">Confirmer</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Access Manager */}
          {activeTab === "access-manager" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Gestion des Accès</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">+ Nouvelle règle d'accès</button>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Règles d'accès actuelles</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultant</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accès accordé</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {accessRules.map((rule, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-full" src={rule.consultant.image} alt={`Photo du ${rule.consultant.name}`}/>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{rule.consultant.name}</div>
                                  <div className="text-sm text-gray-500">{rule.consultant.specialty}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{rule.patient.name}</div>
                              <div className="text-sm text-gray-500">Né le {rule.patient.birth}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{rule.access}</div>
                              <div className="text-sm text-gray-500">Expire le {rule.expires}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button className="text-yellow-600 hover:text-yellow-900 mr-3">Modifier</button>
                              <button className="text-red-600 hover:text-red-900">Révoquer</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Historique des accès</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultant</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {accessHistory.map((hist, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hist.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hist.consultant}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hist.patient}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hist.action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Notifications */}
          {activeTab === "notifications" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Notifications</h2>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  {notifications.map((notif, idx) => (
                    <div key={idx} className="flex items-start p-4 border-b border-gray-200 hover:bg-gray-50">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-8 h-8 rounded-full ${notif.iconBg} flex items-center justify-center`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${notif.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                          <span className="text-xs text-gray-500">{notif.time}</span>
                        </div>
                        <p className="text-sm text-gray-500">{notif.content}</p>
                        <div className="mt-2 flex space-x-2">
                          {notif.actions.map((a, i) => (
                            <button key={i} className={`text-xs px-2 py-1 rounded-md ${a.color}`}>{a.label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Patient Details Modal */}
      {showPatientModal && modalPatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-start md:justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-full md:max-w-4xl max-h-[95vh] overflow-y-auto mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Dossier de {modalPatient.name}</h2>
              <button onClick={closePatientModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-1">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <img src={modalPatient.image || "https://placehold.co/150"} alt={`Photo du patient ${modalPatient.name}`} className="rounded-full mx-auto mb-4"/>
                  <h3 className="text-xl font-bold">{modalPatient.name}</h3>
                  <p className="text-gray-600 mb-2">Né le {modalPatient.birth} {modalPatient.age && `(${modalPatient.age} ans)`}</p>
                  <p className="text-gray-600 mb-4">Groupe sanguin: {modalPatient.blood || "?"}</p>
                  <div className="flex justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">{modalPatient.gender}</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md">{modalPatient.status}</span>
                  </div>
                </div>
                <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
                  <h4 className="font-semibold mb-2">Coordonnées</h4>
                  <p className="text-gray-700 mb-1">{modalPatient.address}</p>
                  <p className="text-gray-700 mb-1">{modalPatient.phone}</p>
                  <p className="text-gray-700">{modalPatient.email}</p>
                </div>
                <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
                  <h4 className="font-semibold mb-2">Contacts d'urgence</h4>
                  {modalPatient.emergencyContacts?.map((c, i) => (
                    <div className="mb-2" key={i}>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-gray-700 mb-1">{c.type} - {c.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h4 className="font-semibold mb-2">Antécédents médicaux</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-1">Pathologies</h5>
                      <ul className="text-gray-700 space-y-1">
                        {modalPatient.pathologies?.map((p, i) => <li key={i} className="flex items-center"><span className="mr-1">•</span> {p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">Allergies</h5>
                      <ul className="text-gray-700 space-y-1">
                        {modalPatient.allergies?.map((a, i) => <li key={i} className="flex items-center"><span className="mr-1">•</span> {a}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Dernières consultations</h4>
                    <button className="text-blue-600 text-sm hover:text-blue-800">Voir tout</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-gray-500 text-sm border-b">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Motif</th>
                          <th className="pb-2">Médecin</th>
                          <th className="pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalPatient.consultations?.map((c, i) => (
                          <tr key={i} className="border-b text-sm">
                            <td className="py-3">{c.date}</td>
                            <td>{c.reason}</td>
                            <td>{c.doctor}</td>
                            <td><button className="text-blue-600 hover:text-blue-800">Voir</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Traitements actuels</h4>
                    <button className="text-blue-600 text-sm hover:text-blue-800">+ Ajouter</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modalPatient.treatments?.map((t, i) => (
                      <div key={i}>
                        <div className="flex justify-between">
                          <span className="font-medium">{t.name}</span>
                          <span className="text-gray-500 text-sm">{t.dose}</span>
                        </div>
                        <p className="text-gray-700 text-sm">{t.desc}</p>
                        <p className="text-gray-700 text-sm">Depuis {t.since}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50" onClick={closePatientModal}>Fermer</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Imprimer</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Mutualiser</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editPatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-full md:max-w-xl relative my-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Modifier {editPatient.name}</h2>
              <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatient.name.split(" ")[0]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatient.name.split(" ")[1]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <input type="date" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>Homme</option>
                  <option>Femme</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatient.address} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="tel" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatient.phone} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 border rounded-md" defaultValue={editPatient.email} />
              </div>
              <div className="md:col-span-2">
                <h3 className="font-semibold mb-2">Antécédents médicaux</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pathologies</label>
                    <textarea className="w-full px-3 py-2 border rounded-md" rows={2}>{editPatient.pathologies?.join("\n")}</textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                    <textarea className="w-full px-3 py-2 border rounded-md" rows={2}>{editPatient.allergies?.join("\n")}</textarea>
                  </div>
                </div>
              </div>
            </form>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={closeEditModal} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && sharePatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-full md:max-w-2xl relative my-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mutualiser {sharePatient.name}</h2>
              <button onClick={closeShareModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Patient : {sharePatient.name}</h3>
                <p className="text-gray-700 mb-4">Vous êtes sur le point de partager ce dossier médical avec un autre professionnel de santé.</p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service destinataire</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="">Sélectionnez un service</option>
                    <option value="cardiologie">Cardiologie</option>
                    <option value="pneumologie">Pneumologie</option>
                    <option value="neurologie">Neurologie</option>
                    <option value="rhumatologie">Rhumatologie</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Médecin destinataire</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="">Sélectionnez un médecin</option>
                    <option value="dr-laurent">Dr. Sophie Laurent</option>
                    <option value="dr-thierry">Dr. Marc Thierry</option>
                    <option value="dr-lemoine">Dr. Élise Lemoine</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type d'accès</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="read">Lecture seule</option>
                    <option value="read_write">Lecture et écriture</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée du partage</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="1_month">1 mois</option>
                    <option value="3_months">3 mois</option>
                    <option value="6_months">6 mois</option>
                    <option value="indefinite">Illimité</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lettre d'accompagnement</label>
                  <textarea className="w-full px-3 py-2 border rounded-md" rows={4} defaultValue={
`Cher confrère/consoeur,

Je vous transmets le dossier de M. ${sharePatient.name} pour prise en charge conjointe. Ce patient présente les antécédents médicaux suivants : hypertension artérielle, hypercholestérolémie et diabète type II.

N'hésitez pas à me contacter pour toute information complémentaire.

Cordialement,
Dr. Dupont`
                  } />
                  <div className="flex items-center mt-2">
                    <input type="checkbox" id="notifyEmail" className="rounded text-blue-500" defaultChecked />
                    <label htmlFor="notifyEmail" className="ml-2 text-sm text-gray-700">Envoyer une notification par email</label>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-end">
                <button type="button" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Confirmer le partage</button>
                <button type="button" onClick={closeShareModal} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 order-first sm:order-last">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start md:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-full md:max-w-xl relative my-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Ajouter un nouveau patient</h2>
              <button onClick={closeAddModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <input type="date" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>Homme</option>
                  <option>Femme</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="tel" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="md:col-span-2">
                <h3 className="font-semibold mb-2">Antécédents médicaux</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pathologies</label>
                    <textarea className="w-full px-3 py-2 border rounded-md" rows={2}></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                    <textarea className="w-full px-3 py-2 border rounded-md" rows={2}></textarea>
                  </div>
                </div>
              </div>
            </form>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={closeAddModal} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Style pour notification badge */}
      <style>{`
        .notification-badge {
          display: none;
        }
        .sidebar .notification-badge {
          display: inline-flex !important;
        }
      `}</style>
    </div>
  );
}

export default DossierPatient;