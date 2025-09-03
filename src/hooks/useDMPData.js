// src/hooks/useDMPData.js
// Hook personnalisé pour gérer les données DMP avec debouncing et cache

import { useState, useEffect, useRef, useCallback } from 'react';
import { withCache } from '../utils/requestCache';
import { getDMP, getAutoMesuresDMP, getStatistiquesDMP } from '../services/api/dmpApi';

export const useDMPData = (patientId, options = {}) => {
    const {
        autoRefresh = false,
        refreshInterval = 60000, // 1 minute
        useCache = true,
        debounceMs = 1000
    } = options;

    const [data, setData] = useState({
        dmp: null,
        autoMesures: [],
        statistiques: null,
        loading: false,
        error: null,
        lastUpdate: null
    });

    const [isInitialized, setIsInitialized] = useState(false);
    const intervalRef = useRef(null);
    const debounceRef = useRef(null);
    const lastRequestTimeRef = useRef(0);

    // Fonction pour charger les données DMP avec cache
    const loadDMPData = useCallback(async (forceRefresh = false) => {
        if (!patientId) {
            return;
        }

        // Éviter les requêtes trop fréquentes (minimum 2 secondes entre les requêtes)
        const now = Date.now();
        if (now - lastRequestTimeRef.current < 2000) {
            console.log('⏭️ Requête DMP ignorée - trop récente');
            return;
        }

        lastRequestTimeRef.current = now;
        setData(prev => ({ ...prev, loading: true, error: null }));

        try {
            console.log(`🔄 Chargement des données DMP pour patient ${patientId}...`);

            // Charger les données en parallèle avec cache
            const [dmpData, autoMesuresData, statistiquesData] = await Promise.allSettled([
                withCache(
                    () => getDMP(patientId),
                    `/dossierMedical/patient/${patientId}/complet`,
                    { patientId },
                    { useCache, forceRefresh }
                ),
                withCache(
                    () => getAutoMesuresDMP(patientId),
                    `/patient/auto-mesures/${patientId}`,
                    { patientId },
                    { useCache, forceRefresh }
                ),
                withCache(
                    () => getStatistiquesDMP(patientId),
                    `/dossierMedical/patient/${patientId}/statistiques`,
                    { patientId },
                    { useCache, forceRefresh }
                )
            ]);

            // Traiter les résultats
            const newData = {
                dmp: dmpData.status === 'fulfilled' ? dmpData.value : null,
                autoMesures: autoMesuresData.status === 'fulfilled' ? 
                    (autoMesuresData.value?.data || []) : [],
                statistiques: statistiquesData.status === 'fulfilled' ? 
                    statistiquesData.value : null,
                loading: false,
                error: null,
                lastUpdate: new Date()
            };

            setData(newData);
            setIsInitialized(true);

            console.log('✅ Données DMP chargées avec succès');

        } catch (error) {
            console.error('❌ Erreur lors du chargement des données DMP:', error);
            setData(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Erreur lors du chargement des données'
            }));
        }
    }, [patientId, useCache]);

    // Fonction debounced pour éviter les appels multiples
    const debouncedLoadData = useCallback((forceRefresh = false) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            loadDMPData(forceRefresh);
        }, debounceMs);
    }, [loadDMPData, debounceMs]);

    // Fonction pour forcer le rafraîchissement
    const refresh = useCallback(() => {
        console.log('🔄 Rafraîchissement forcé des données DMP');
        loadDMPData(true);
    }, [loadDMPData]);

    // Fonction pour arrêter le rafraîchissement automatique
    const stopAutoRefresh = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log('⏹️ Rafraîchissement automatique arrêté');
        }
    }, []);

    // Fonction pour démarrer le rafraîchissement automatique
    const startAutoRefresh = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            console.log('🔄 Rafraîchissement automatique des données DMP');
            loadDMPData();
        }, refreshInterval);

        console.log(`🔄 Rafraîchissement automatique démarré (${refreshInterval}ms)`);
    }, [loadDMPData, refreshInterval]);

    // Effet pour le chargement initial
    useEffect(() => {
        if (patientId && !isInitialized) {
            console.log(`🚀 Initialisation des données DMP pour patient ${patientId}`);
            debouncedLoadData();
        }
    }, [patientId, isInitialized, debouncedLoadData]);

    // Effet pour le rafraîchissement automatique
    useEffect(() => {
        if (autoRefresh && patientId && isInitialized) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }

        return () => {
            stopAutoRefresh();
        };
    }, [autoRefresh, patientId, isInitialized, startAutoRefresh, stopAutoRefresh]);

    // Nettoyage à la destruction du composant
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            stopAutoRefresh();
        };
    }, [stopAutoRefresh]);

    return {
        ...data,
        isInitialized,
        refresh,
        startAutoRefresh,
        stopAutoRefresh,
        // Fonctions utilitaires
        hasData: data.dmp !== null || data.autoMesures.length > 0,
        isLoading: data.loading,
        hasError: data.error !== null
    };
};

export default useDMPData;
