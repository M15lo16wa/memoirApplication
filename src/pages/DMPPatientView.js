import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import dmpApi from '../services/api/dmpApi';

const DMPPatientView = () => {
  const { patientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessStatus, setAccessStatus] = useState('loading');
  const [patient, setPatient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [autoMesures, setAutoMesures] = useState([]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Vérifier le statut d'accès
        const statusRes = await dmpApi.getAccessStatus(patientId);
        setAccessStatus(statusRes?.accessStatus || statusRes?.status || 'not_authorized');

        if ((statusRes?.status || statusRes?.accessStatus) !== 'authorized' && (statusRes?.status || statusRes?.accessStatus) !== 'active') {
          setLoading(false);
          return; // ne pas charger les données si non autorisé ou non actif
        }

        // 2) Charger l'ensemble des données du dossier de manière sécurisée
        const dossierData = await dmpApi.getSecureDossierForMedecin(patientId);
        setPatient(dossierData?.patient || dossierData);
        setDocuments(Array.isArray(dossierData?.documents) ? dossierData.documents : []);
        setAutoMesures(Array.isArray(dossierData?.autoMesures) ? dossierData.autoMesures : []);
      } catch (e) {
        setError(e.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    if (patientId) {
      loadAll();
    }
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600 p-4">
        <p className="text-lg font-medium mb-2">Erreur</p>
        <p>{error}</p>
      </div>
    );
  }

  if (accessStatus !== 'authorized' && accessStatus !== 'active') {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <p className="text-lg font-medium mb-2">Accès non autorisé</p>
        <p className="text-gray-600">Le statut actuel est: {String(accessStatus)}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dossier DMP du patient</h1>
          {patient && (
            <div className="mt-4 text-gray-700">
              <p><span className="font-medium">Nom:</span> {patient.prenom} {patient.nom}</p>
              <p><span className="font-medium">Date de naissance:</span> {patient.date_naissance || 'N/A'}</p>
              <p><span className="font-medium">Groupe sanguin:</span> {patient.groupe_sanguin || 'N/A'}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Documents</h2>
            {documents.length === 0 ? (
              <p className="text-gray-500">Aucun document</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="border rounded p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{doc.nom || doc.titre || 'Document'}</p>
                      <p className="text-sm text-gray-500">{doc.type || doc.format}</p>
                    </div>
                    {doc.url && (
                      <a className="text-blue-600 hover:underline" href={doc.url} target="_blank" rel="noreferrer">Ouvrir</a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Auto-mesures</h2>
            {autoMesures.length === 0 ? (
              <p className="text-gray-500">Aucune auto-mesure</p>
            ) : (
              <ul className="space-y-2">
                {autoMesures.map((m) => (
                  <li key={m.id} className="border rounded p-3">
                    <p className="font-medium">{m.type}</p>
                    <p className="text-sm text-gray-600">{m.valeur}{m.valeur_secondaire ? `/${m.valeur_secondaire}` : ''} {m.unite}</p>
                    <p className="text-xs text-gray-500">{m.date_mesure}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DMPPatientView;


