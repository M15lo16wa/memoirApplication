// src/utils/requestCache.js
// Système de cache et debouncing pour éviter les requêtes répétitives

class RequestCache {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.cacheTimeout = 60000; // 60 secondes pour éviter les requêtes répétitives
        this.requestCooldown = 15000; // 15 secondes de cooldown entre les requêtes
        this.lastRequestTimes = new Map(); // Suivi des dernières requêtes par clé
    }

    // Générer une clé de cache basée sur l'URL et les paramètres
    generateKey(url, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        return `${url}?${sortedParams}`;
    }

    // Vérifier si une requête est en cours
    isPending(key) {
        return this.pendingRequests.has(key);
    }

    // Vérifier si une requête est en cooldown
    isInCooldown(key) {
        const lastRequestTime = this.lastRequestTimes.get(key);
        if (!lastRequestTime) return false;
        
        const timeSinceLastRequest = Date.now() - lastRequestTime;
        return timeSinceLastRequest < this.requestCooldown;
    }

    // Marquer une requête comme en cours
    setPending(key, promise) {
        this.pendingRequests.set(key, promise);
        this.lastRequestTimes.set(key, Date.now()); // Enregistrer le temps de la requête
        promise.finally(() => {
            this.pendingRequests.delete(key);
        });
        return promise;
    }

    // Obtenir une valeur du cache
    get(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log(`📦 Cache hit pour: ${key}`);
            return cached.data;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }

    // Mettre en cache une valeur
    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        console.log(`💾 Données mises en cache: ${key}`);
    }

    // Nettoyer le cache expiré
    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
            }
        }
    }

    // Vider le cache
    clear() {
        this.cache.clear();
        this.pendingRequests.clear();
        console.log('🗑️ Cache vidé');
    }

    // Obtenir les statistiques du cache
    getStats() {
        return {
            cacheSize: this.cache.size,
            pendingRequests: this.pendingRequests.size,
            cacheKeys: Array.from(this.cache.keys())
        };
    }
}

// Instance globale
export const requestCache = new RequestCache();

// Fonction utilitaire pour wrapper les appels API avec cache
export const withCache = async (apiCall, url, params = {}, options = {}) => {
    const {
        useCache = true,
        cacheTimeout = 30000,
        forceRefresh = false
    } = options;

    const key = requestCache.generateKey(url, params);

    // Si on force le rafraîchissement, on ignore le cache
    if (forceRefresh) {
        requestCache.clear();
    }

    // Vérifier le cache
    if (useCache && !forceRefresh) {
        const cachedData = requestCache.get(key);
        if (cachedData) {
            return cachedData;
        }
    }

    // Vérifier si une requête est déjà en cours
    if (requestCache.isPending(key)) {
        console.log(`⏳ Requête en cours pour: ${key}`);
        return requestCache.pendingRequests.get(key);
    }

    // Vérifier le cooldown
    if (requestCache.isInCooldown(key)) {
        console.log(`⏸️ Requête en cooldown pour: ${key}`);
        const cachedData = requestCache.get(key);
        if (cachedData) {
            console.log(`📦 Retour des données en cache (cooldown) pour: ${key}`);
            return cachedData;
        }
        // Si pas de cache, on attend la fin du cooldown
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(withCache(apiCall, url, params, options));
            }, requestCache.requestCooldown);
        });
    }

    // Faire la requête et la mettre en cache
    const promise = apiCall()
        .then(data => {
            if (useCache) {
                requestCache.set(key, data);
            }
            return data;
        })
        .catch(error => {
            // En cas d'erreur, on peut retourner les données en cache si disponibles
            const cachedData = requestCache.get(key);
            if (cachedData) {
                console.warn(`⚠️ Erreur API, utilisation du cache pour: ${key}`);
                return cachedData;
            }
            throw error;
        });

    return requestCache.setPending(key, promise);
};

// Nettoyage automatique du cache toutes les 5 minutes
setInterval(() => {
    requestCache.cleanup();
}, 5 * 60 * 1000);

export default requestCache;
