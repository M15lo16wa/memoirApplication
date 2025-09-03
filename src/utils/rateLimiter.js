// src/utils/rateLimiter.js
// Utilitaire pour gérer le rate limiting côté client

class RateLimiter {
    constructor(maxRequests = 10, timeWindow = 60000) { // 10 requêtes par minute par défaut
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.requests = new Map(); // endpoint -> { count, resetTime }
    }

    canMakeRequest(endpoint) {
        const now = Date.now();
        const requestData = this.requests.get(endpoint);

        if (!requestData) {
            // Première requête pour cet endpoint
            this.requests.set(endpoint, {
                count: 1,
                resetTime: now + this.timeWindow
            });
            return true;
        }

        // Vérifier si la fenêtre de temps est expirée
        if (now > requestData.resetTime) {
            // Réinitialiser le compteur
            this.requests.set(endpoint, {
                count: 1,
                resetTime: now + this.timeWindow
            });
            return true;
        }

        // Vérifier si on peut encore faire des requêtes
        if (requestData.count < this.maxRequests) {
            requestData.count++;
            return true;
        }

        return false;
    }

    getTimeUntilReset(endpoint) {
        const requestData = this.requests.get(endpoint);
        if (!requestData) return 0;
        
        const now = Date.now();
        return Math.max(0, requestData.resetTime - now);
    }

    getRemainingRequests(endpoint) {
        const requestData = this.requests.get(endpoint);
        if (!requestData) return this.maxRequests;
        
        const now = Date.now();
        if (now > requestData.resetTime) {
            return this.maxRequests;
        }
        
        return Math.max(0, this.maxRequests - requestData.count);
    }
}

// Instance globale pour l'application
export const rateLimiter = new RateLimiter(5, 60000); // 5 requêtes par minute

// Fonction utilitaire pour wrapper les appels API
export const withRateLimit = async (endpoint, apiCall, options = {}) => {
    const { 
        maxRetries = 3, 
        retryDelay = 2000,
        onRateLimited = null 
    } = options;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (rateLimiter.canMakeRequest(endpoint)) {
            try {
                return await apiCall();
            } catch (error) {
                if (error.response?.status === 429) {
                    console.warn(`Rate limit atteint pour ${endpoint}, tentative ${attempt + 1}/${maxRetries}`);
                    
                    if (onRateLimited) {
                        onRateLimited(error, attempt);
                    }
                    
                    if (attempt < maxRetries - 1) {
                        const waitTime = rateLimiter.getTimeUntilReset(endpoint) || retryDelay;
                        console.log(`Attente de ${waitTime}ms avant la prochaine tentative...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    }
                } else {
                    throw error;
                }
            }
        } else {
            const waitTime = rateLimiter.getTimeUntilReset(endpoint);
            console.warn(`Rate limit atteint pour ${endpoint}, attente de ${waitTime}ms...`);
            
            if (onRateLimited) {
                onRateLimited(null, attempt);
            }
            
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    
    throw new Error(`Impossible de faire la requête après ${maxRetries} tentatives`);
};

export default rateLimiter;
