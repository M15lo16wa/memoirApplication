import { useContext, useEffect, useCallback } from 'react';
import { DMPContext } from '../context/DMPContext';

export const useDMP = () => {
    const { state, actions } = useContext(DMPContext);

    // Charger automatiquement les données DMP au montage
    useEffect(() => {
        if (state.patientId && !state.dmpData) {
            actions.loadDMP();
        }
    }, [state.patientId, state.dmpData, actions]);

    // Fonctions utilitaires
    const refreshData = useCallback(() => {
        actions.loadDMP();
    }, [actions]);

    const getMesuresByType = useCallback((type) => {
        return (state.autoMesures || []).filter(mesure => mesure.type === type);
    }, [state.autoMesures]);

    const getDocumentsByType = useCallback((type) => {
        const documents = Array.isArray(state.documents) ? state.documents : [];
        return documents.filter(doc => doc.type === type);
    }, [state.documents]);

    const getRecentActivity = useCallback((limit = 10) => {
        return (state.journal || []).slice(0, limit);
    }, [state.journal]);

    const getHistoriqueByType = useCallback((type) => {
        return (state.historique || []).filter(entry => entry.type === type);
    }, [state.historique]);

    const getRendezVousByStatus = useCallback((status) => {
        return (state.rendezVous || []).filter(rdv => rdv.statut === status);
    }, [state.rendezVous]);

    const getUpcomingRendezVous = useCallback(() => {
        const now = new Date();
        return (state.rendezVous || [])
            .filter(rdv => new Date(rdv.date) > now)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [state.rendezVous]);

    const getPastRendezVous = useCallback(() => {
        const now = new Date();
        return (state.rendezVous || [])
            .filter(rdv => new Date(rdv.date) <= now)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [state.rendezVous]);

    const getLatestAutoMesures = useCallback((limit = 5) => {
        return (state.autoMesures || [])
            .sort((a, b) => new Date(b.date_mesure) - new Date(a.date_mesure))
            .slice(0, limit);
    }, [state.autoMesures]);

    const getLatestDocuments = useCallback((limit = 5) => {
        const documents = Array.isArray(state.documents) ? state.documents : [];
        return documents
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }, [state.documents]);

    const getStatistiquesResume = useCallback(() => {
        // S'assurer que les documents sont un tableau
        const documents = Array.isArray(state.documents) ? state.documents : [];
        const autoMesures = Array.isArray(state.autoMesures) ? state.autoMesures : [];
        const rendezVous = Array.isArray(state.rendezVous) ? state.rendezVous : [];
        const historique = Array.isArray(state.historique) ? state.historique : [];
        
        return {
            totalAutoMesures: autoMesures.length,
            totalDocuments: documents.length,
            totalRendezVous: rendezVous.length,
            totalHistorique: historique.length,
            autoMesuresParType: autoMesures.reduce((acc, mesure) => {
                acc[mesure.type] = (acc[mesure.type] || 0) + 1;
                return acc;
            }, {}),
            documentsParType: documents.reduce((acc, doc) => {
                acc[doc.type] = (acc[doc.type] || 0) + 1;
                return acc;
            }, {})
        };
    }, [state.autoMesures, state.documents, state.rendezVous, state.historique]);

    const isDataStale = useCallback((maxAgeMinutes = 5) => {
        if (!state.lastUpdate) return true;
        const lastUpdate = new Date(state.lastUpdate);
        const now = new Date();
        const diffMinutes = (now - lastUpdate) / (1000 * 60);
        return diffMinutes > maxAgeMinutes;
    }, [state.lastUpdate]);

    const shouldRefreshData = useCallback(() => {
        return !state.dmpData || isDataStale();
    }, [state.dmpData, isDataStale]);

    return {
        ...state,
        ...actions,
        refreshData,
        getMesuresByType,
        getDocumentsByType,
        getRecentActivity,
        getHistoriqueByType,
        getRendezVousByStatus,
        getUpcomingRendezVous,
        getPastRendezVous,
        getLatestAutoMesures,
        getLatestDocuments,
        getStatistiquesResume,
        isDataStale,
        shouldRefreshData
    };
}; 