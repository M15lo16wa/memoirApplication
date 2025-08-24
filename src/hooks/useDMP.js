// src/hooks/useDMP.js

import { useContext, useEffect, useCallback } from 'react';
import DMPContext from '../context/DMPContext';

export const useDMP = () => {
    const context = useContext(DMPContext);

    if (!context) {
        throw new Error('useDMP doit être utilisé à l\'intérieur d\'un DMPProvider');
    }

    const { state, actions } = context;

    // Charger les données une seule fois si elles ne sont pas déjà là
    useEffect(() => {
        if (state.patientId && !state.dmpData && !state.loading) {
            actions.loadDMP();
        }
    }, [state.patientId, state.dmpData, state.loading, actions]);


    // === Fonctions Utilitaires (Helpers) - Toutes restaurées et corrigées ===
    
    const refreshData = useCallback(() => actions.loadDMP(), [actions]);

    const getMesuresByType = useCallback((type) => {
        const autoMesures = Array.isArray(state.autoMesures) ? state.autoMesures : [];
        return autoMesures.filter(m => m.type_mesure === type);
    }, [state.autoMesures]);

    const getDocumentsByType = useCallback((type) => {
        const documents = Array.isArray(state.documents) ? state.documents : [];
        return documents.filter(d => d.type === type);
    }, [state.documents]);

    const getRecentActivity = useCallback((limit = 10) => {
        const journal = Array.isArray(state.journal) ? state.journal : [];
        return journal.slice(0, limit);
    }, [state.journal]);

    const getHistoriqueByType = useCallback((type) => {
        const historique = Array.isArray(state.historique) ? state.historique : [];
        return historique.filter(e => e.type === type);
    }, [state.historique]);

    const getRendezVousByStatus = useCallback((status) => {
        const rendezVous = Array.isArray(state.rendezVous) ? state.rendezVous : [];
        return rendezVous.filter(rdv => rdv.statut === status);
    }, [state.rendezVous]);

    const getUpcomingRendezVous = useCallback(() => {
        const rendezVous = Array.isArray(state.rendezVous) ? state.rendezVous : [];
        return rendezVous.filter(rdv => new Date(rdv.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [state.rendezVous]);

    const getPastRendezVous = useCallback(() => {
        const rendezVous = Array.isArray(state.rendezVous) ? state.rendezVous : [];
        return rendezVous.filter(rdv => new Date(rdv.date) <= new Date()).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [state.rendezVous]);

    const getLatestAutoMesures = useCallback((limit = 5) => {
        const autoMesures = Array.isArray(state.autoMesures) ? state.autoMesures : [];
        return autoMesures.sort((a, b) => new Date(b.date_mesure) - new Date(a.date_mesure)).slice(0, limit);
    }, [state.autoMesures]);

    const getLatestDocuments = useCallback((limit = 5) => {
        const documents = Array.isArray(state.documents) ? state.documents : [];
        return documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
    }, [state.documents]);

    const getStatistiquesResume = useCallback(() => {
        // Vérification de sécurité pour s'assurer que les données sont des tableaux
        const autoMesures = Array.isArray(state.autoMesures) ? state.autoMesures : [];
        const documents = Array.isArray(state.documents) ? state.documents : [];
        const rendezVous = Array.isArray(state.rendezVous) ? state.rendezVous : [];
        const historique = Array.isArray(state.historique) ? state.historique : [];
        
        return {
            totalAutoMesures: autoMesures.length,
            totalDocuments: documents.length,
            totalRendezVous: rendezVous.length,
            totalHistorique: historique.length,
            autoMesuresParType: autoMesures.reduce((acc, m) => ({ ...acc, [m.type_mesure]: (acc[m.type_mesure] || 0) + 1 }), {}),
            documentsParType: documents.reduce((acc, d) => ({ ...acc, [d.type]: (acc[d.type] || 0) + 1 }), {})
        };
    }, [state.autoMesures, state.documents, state.rendezVous, state.historique]);

    const isDataStale = useCallback((maxAgeMinutes = 5) => {
        if (!state.lastUpdate) return true;
        return (new Date() - new Date(state.lastUpdate)) / 60000 > maxAgeMinutes;
    }, [state.lastUpdate]);

    const shouldRefreshData = useCallback(() => !state.dmpData || isDataStale(), [state.dmpData, isDataStale]);

    // L'objet retourné expose tout ce dont les composants ont besoin
    return {
        // L'état complet du DMP
        ...state,
        
        // Toutes les actions du contexte
        ...actions,
        
        // Toutes vos fonctions utilitaires
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
export default useDMP;