// src/services/config.service.js
class FrontendConfigService {
  static getConfig() {
    return {
                  // Serveur principal (API + Messagerie)
            mainServer: {
                baseURL: process.env.REACT_APP_MAIN_SERVER || 'http://localhost:3000',
                apiURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
                protocol: 'http',
                port: 3000
            },
            
      
      
      
      // Configuration de développement
      development: {
        devMode: process.env.NODE_ENV === 'development',
        sslVerify: process.env.REACT_APP_SSL_VERIFY !== 'false',
        debugMode: process.env.REACT_APP_DEBUG_MODE === 'true'
      },
      
      // URLs frontend
      frontend: {
        baseURL: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3001'
      }
    };
  }
  
  // Méthode de validation pour éviter l'erreur
  
  static validateConfig() {
    const config = this.getConfig();
    
    console.log('✅ Configuration validée:', {
      mainServer: config.mainServer.baseURL,
      frontend: config.frontend.baseURL
    });
    
    return true;
  }
  
  
  
  static getSocketConfig() {
    const config = this.getConfig();
    
    return {
      url: config.mainServer.baseURL,
      options: {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        upgrade: true,
        rememberUpgrade: false
      }
    };
  }
  
  static getApiConfig() {
    const config = this.getConfig();
    
    return {
      baseURL: config.mainServer.apiURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
  
  
}

// Validation au chargement
try {
  FrontendConfigService.validateConfig();
  console.log('✅ Configuration frontend validée avec succès');
} catch (error) {
  console.error('❌ Erreur de configuration:', error.message);
}

export default FrontendConfigService;