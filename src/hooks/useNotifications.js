// src/hooks/useNotifications.js
// Hook personnalisé pour gérer les notifications avec rate limiting

import { useState, useEffect, useRef, useCallback } from 'react';
import { getMedecinAccessRequests } from '../services/api/dmpApi';

export const useNotifications = (patientId, options = {}) => {
    const {
        interval = 30000, // 30 secondes par défaut
        maxRetries = 3,
        onError = null
    } = options;

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);
    
    const intervalRef = useRef(null);
    const retryCountRef = useRef(0);
    const lastRequestTimeRef = useRef(0);

    const fetchNotifications = useCallback(async (isRetry = false) => {
        // Éviter les requêtes trop fréquentes (minimum 5 secondes entre les requêtes)
        const now = Date.now();
        if (now - lastRequestTimeRef.current < 5000) {
            console.log('Requête ignorée - trop récente');
            return;
        }

        lastRequestTimeRef.current = now;
        setLoading(true);
        setError(null);

        try {
            const data = await getMedecinAccessRequests(patientId);
            
            // Réinitialiser le compteur de retry en cas de succès
            retryCountRef.current = 0;
            
            // Traiter les données selon la structure retournée
            let processedNotifications = [];
            if (data && data.authorizationAccess) {
                processedNotifications = Array.isArray(data.authorizationAccess) 
                    ? data.authorizationAccess 
                    : [];
            } else if (Array.isArray(data)) {
                processedNotifications = data;
            }

            setNotifications(processedNotifications);
            setLastFetch(now);
            
            console.log(`Notifications mises à jour: ${processedNotifications.length} éléments`);
            
        } catch (err) {
            console.error('Erreur lors de la récupération des notifications:', err);
            
            if (err.response?.status === 429) {
                // Rate limit - augmenter l'intervalle temporairement
                console.warn('Rate limit détecté, augmentation de l\'intervalle');
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = setInterval(() => {
                        fetchNotifications();
                    }, interval * 2); // Doubler l'intervalle
                }
            }
            
            setError(err);
            
            if (onError) {
                onError(err);
            }
            
            // Retry logic
            if (retryCountRef.current < maxRetries && !isRetry) {
                retryCountRef.current++;
                console.log(`Tentative ${retryCountRef.current}/${maxRetries} dans 10 secondes...`);
                setTimeout(() => {
                    fetchNotifications(true);
                }, 10000);
            }
        } finally {
            setLoading(false);
        }
    }, [patientId, interval, maxRetries, onError]);

    // Fonction pour forcer le rafraîchissement
    const refresh = useCallback(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Fonction pour arrêter les notifications
    const stop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Fonction pour démarrer les notifications
    const start = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        
        // Premier fetch immédiat
        fetchNotifications();
        
        // Puis fetch périodique
        intervalRef.current = setInterval(() => {
            fetchNotifications();
        }, interval);
    }, [fetchNotifications, interval]);

    // Effet pour démarrer/arrêter les notifications
    useEffect(() => {
        if (patientId) {
            start();
        } else {
            stop();
        }

        return () => {
            stop();
        };
    }, [patientId, start, stop]);

    // Nettoyage à la destruction du composant
    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    return {
        notifications,
        loading,
        error,
        lastFetch,
        refresh,
        start,
        stop,
        retryCount: retryCountRef.current
    };
};

export default useNotifications;
