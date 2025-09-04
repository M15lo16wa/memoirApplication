import React, { useState, useEffect } from 'react';
import { FaFileMedical, FaSync, FaExclamationTriangle, FaCheckCircle, FaShieldAlt } from 'react-icons/fa';
import { getPatientAuthorizations, getPatientAccessHistory, getPendingAccessRequests } from '../../services/api/dmpApi';
import AutorisationCard from './AutorisationCard';

const AutorisationsEnAttente = () => {
  const [autorisations, setAutorisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAutorisations();
  }, []);

  const loadAutorisations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 AutorisationsEnAttente: Chargement des autorisations...');
      
      // Utiliser les fonctions spécifiques aux patients de dmpApi
      const [authorizations, accessHistory, pendingRequests] = await Promise.all([
        getPatientAuthorizations(),
        getPatientAccessHistory(),
        getPendingAccessRequests()
      ]);
      
      // Combiner les données des différentes sources
      const result = {
        authorizations: authorizations?.data || authorizations || [],
        accessHistory: accessHistory?.data || accessHistory || [],
        pendingRequests: pendingRequests?.data || pendingRequests || []
      };
      
      console.log('✅ AutorisationsEnAttente: Réponse API reçue:', result);
      console.log('🔍 AutorisationsEnAttente: Détail pendingRequests:', {
        pendingRequests: result.pendingRequests,
        pendingRequestsData: result.pendingRequests?.data,
        pendingRequestsArray: result.pendingRequests?.data?.pendingRequests,
        pendingRequestsKeys: result.pendingRequests ? Object.keys(result.pendingRequests) : [],
        pendingRequestsDataKeys: result.pendingRequests?.data ? Object.keys(result.pendingRequests.data) : []
      });

      // Normalisation robuste des formats de réponse possibles
      const extractList = (payload) => {
        console.log('🔍 AutorisationsEnAttente: Extraction depuis payload:', payload);
        
        if (Array.isArray(payload)) {
          console.log('✅ AutorisationsEnAttente: Payload est directement un tableau');
          return payload;
        }
        if (Array.isArray(payload?.authorizationAccess)) {
          console.log('✅ AutorisationsEnAttente: Trouvé authorizationAccess');
          return payload.authorizationAccess;
        }
        if (Array.isArray(payload?.autorisations)) {
          console.log('✅ AutorisationsEnAttente: Trouvé autorisations');
          return payload.autorisations;
        }
        if (Array.isArray(payload?.authorizations)) {
          console.log('✅ AutorisationsEnAttente: Trouvé authorizations');
          return payload.authorizations;
        }
        if (Array.isArray(payload?.pendingRequests)) {
          console.log('✅ AutorisationsEnAttente: Trouvé pendingRequests');
          return payload.pendingRequests;
        }
        if (Array.isArray(payload?.data?.authorizationAccess)) {
          console.log('✅ AutorisationsEnAttente: Trouvé data.authorizationAccess');
          return payload.data.authorizationAccess;
        }
        if (Array.isArray(payload?.data?.autorisations)) {
          console.log('✅ AutorisationsEnAttente: Trouvé data.autorisations');
          return payload.data.autorisations;
        }
        if (Array.isArray(payload?.data?.authorizations)) {
          console.log('✅ AutorisationsEnAttente: Trouvé data.authorizations');
          return payload.data.authorizations;
        }
        if (Array.isArray(payload?.data?.pendingRequests)) {
          console.log('✅ AutorisationsEnAttente: Trouvé data.pendingRequests');
          return payload.data.pendingRequests;
        }
        if (Array.isArray(payload?.data)) {
          console.log('✅ AutorisationsEnAttente: Trouvé data comme tableau');
          return payload.data;
        }
        if (Array.isArray(payload?.data?.data)) {
          console.log('✅ AutorisationsEnAttente: Trouvé data.data');
          return payload.data.data;
        }
        
        console.warn('⚠️ AutorisationsEnAttente: Aucun tableau trouvé dans payload:', payload);
        return [];
      };

      // Combiner toutes les sources d'autorisations
      const extractedAuthorizations = extractList(result.authorizations);
      const extractedAccessHistory = extractList(result.accessHistory);
      const extractedPendingRequests = extractList(result.pendingRequests);
      
      console.log('🔍 AutorisationsEnAttente: Données extraites de chaque source:', {
        authorizations: extractedAuthorizations,
        accessHistory: extractedAccessHistory,
        pendingRequests: extractedPendingRequests
      });
      
      const allAuthorizations = [
        ...extractedAuthorizations,
        ...extractedAccessHistory,
        ...extractedPendingRequests
      ];
      
      // Supprimer les doublons basés sur l'ID
      const uniqueAuthorizations = allAuthorizations.filter((auth, index, self) => 
        index === self.findIndex(a => 
          (a.id_acces === auth.id_acces) || 
          (a.id === auth.id) || 
          (a.id_acces_autorisation === auth.id_acces_autorisation) ||
          (a.id_notification === auth.id_notification)
        )
      );
      
      const autorisationsRaw = uniqueAuthorizations;

      // Adapter les clés pour l'affichage (professionnel, dates...)
      const autorisationsData = (autorisationsRaw || []).map((a) => ({
        ...a,
        professionnel: a.professionnel || a.professionnelDemandeur || a.professionnel_demandeur || a.demandeur || a.professional || {},
        date_creation: a.date_creation || a.createdAt || a.date_debut || a.date_validation || a.updatedAt,
        // Gérer les cas où les données sont dans des objets imbriqués
        ...(a.professionnelDemandeur && {
          professionnel: {
            ...a.professionnelDemandeur,
            nom: a.professionnelDemandeur.nom || a.professionnelDemandeur.nom_professionnel,
            prenom: a.professionnelDemandeur.prenom || a.professionnelDemandeur.prenom_professionnel,
            specialite: a.professionnelDemandeur.specialite || a.professionnelDemandeur.specialite_professionnel
          }
        }),
        ...(a.patientConcerne && {
          patient: {
            ...a.patientConcerne,
            nom: a.patientConcerne.nom || a.patientConcerne.nom_patient,
            prenom: a.patientConcerne.prenom || a.patientConcerne.prenom_patient
          }
        })
      }));

      console.log('📋 AutorisationsEnAttente: Données normalisées:', autorisationsData);
      console.log('🔍 AutorisationsEnAttente: Structure des données après normalisation:', {
        total: autorisationsData.length,
        premier: autorisationsData[0],
        statuts: autorisationsData.map(a => ({ 
          id: a.id_acces || a.id_acces_autorisation, 
          statut: a.statut, 
          professionnel: a.professionnel,
          type: a.type || 'demande_acces'
        }))
      });
      setAutorisations(autorisationsData);
    } catch (error) {
      console.error('❌ AutorisationsEnAttente: Erreur lors du chargement:', error);
      setError(`Erreur lors du chargement des autorisations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAutorisations();
    setRefreshing(false);
  };

  const handleAutorisationUpdate = () => {
    // Recharger la liste après une action
    loadAutorisations();
  };

  // Filtrer les autorisations par statut
  // Gérer les demandes d'accès qui n'ont pas de statut mais sont des notifications de demande
  const autorisationsEnAttente = autorisations.filter(a => 
    a.statut === 'attente_validation' || 
    (a.id_notification && a.id_acces_autorisation && !a.statut) // Demandes d'accès en attente
  );
  const autorisationsActives = autorisations.filter(a => a.statut === 'actif');
  const autorisationsRefusees = autorisations.filter(a => a.statut === 'refuse');
  const autorisationsExpirees = autorisations.filter(a => a.statut === 'expire');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des autorisations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <FaExclamationTriangle className="h-5 w-5 text-red-400 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Erreur</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button 
              onClick={loadAutorisations}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton de rafraîchissement */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestion des autorisations DMP</h2>
          <p className="text-sm text-gray-600">
            Gérez les demandes d'accès à votre dossier médical partagé
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <FaSync className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaFileMedical className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-800">En attente</p>
              <p className="text-2xl font-bold text-yellow-900">{autorisationsEnAttente.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaCheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-800">Actives</p>
              <p className="text-2xl font-bold text-green-900">{autorisationsActives.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-800">Refusées</p>
              <p className="text-2xl font-bold text-red-900">{autorisationsRefusees.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaFileMedical className="h-5 w-5 text-gray-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-800">Expirées</p>
              <p className="text-2xl font-bold text-gray-900">{autorisationsExpirees.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section des demandes en attente */}
      {autorisationsEnAttente.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaFileMedical className="w-5 h-5 mr-2 text-yellow-600" />
            Demandes en attente de validation ({autorisationsEnAttente.length})
          </h3>
          <div className="space-y-4">
            {autorisationsEnAttente.map((autorisation) => (
              <AutorisationCard
                key={autorisation.id_acces || autorisation.id_acces_autorisation || autorisation.id_notification}
                autorisation={autorisation}
                onUpdate={handleAutorisationUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section des autorisations actives (validées) */}
      {autorisationsActives.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaShieldAlt className="w-5 h-5 mr-2 text-green-600" />
            Autorisations actives ({autorisationsActives.length})
          </h3>
          <div className="space-y-4">
            {autorisationsActives.map((autorisation) => (
              <AutorisationCard
                key={autorisation.id_acces || autorisation.id_acces_autorisation || autorisation.id_notification}
                autorisation={autorisation}
                onUpdate={handleAutorisationUpdate}
                isActive={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section des autorisations refusées */}
      {autorisationsRefusees.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaExclamationTriangle className="w-5 h-5 mr-2 text-red-600" />
            Autorisations refusées ({autorisationsRefusees.length})
          </h3>
          <div className="space-y-4">
            {autorisationsRefusees.map((autorisation) => (
              <AutorisationCard
                key={autorisation.id_acces || autorisation.id_acces_autorisation || autorisation.id_notification}
                autorisation={autorisation}
                onUpdate={handleAutorisationUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section des autorisations expirées */}
      {autorisationsExpirees.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaFileMedical className="w-5 h-5 mr-2 text-gray-600" />
            Autorisations expirées ({autorisationsExpirees.length})
          </h3>
          <div className="space-y-4">
            {autorisationsExpirees.map((autorisation) => (
              <AutorisationCard
                key={autorisation.id_acces || autorisation.id_acces_autorisation || autorisation.id_notification}
                autorisation={autorisation}
                onUpdate={handleAutorisationUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Message quand aucune autorisation */}
      {autorisations.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaFileMedical className="text-gray-400 text-xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune autorisation</h3>
          <p className="text-gray-600">
            Vous n'avez actuellement aucune demande d'accès ou autorisation active.
          </p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Actualiser
          </button>
        </div>
      )}
    </div>
  );
};

export default AutorisationsEnAttente;
