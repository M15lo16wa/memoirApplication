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
      
      // Serveur WebRTC (HTTPS) - API WebRTC
      webrtcServer: {
        baseURL: process.env.REACT_APP_WEBRTC_SERVER || 'https://localhost:3443',
        apiURL: process.env.REACT_APP_WEBRTC_API_URL || 'https://localhost:3443/api',
        protocol: 'https', 
        port: 3443
      },
      
      // Configuration WebRTC
      webrtc: {
        stunServers: (process.env.REACT_APP_WEBRTC_STUN_SERVERS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302').split(','),
        turnServers: (process.env.REACT_APP_WEBRTC_TURN_SERVERS || '').split(',').filter(Boolean),
        iceTimeout: parseInt(process.env.REACT_APP_WEBRTC_ICE_TIMEOUT) || 5000,
        iceCandidatePoolSize: 10
      },
      
      // Configuration de développement
      development: {
        devMode: process.env.NODE_ENV === 'development',
        sslVerify: process.env.REACT_APP_SSL_VERIFY !== 'false',
        debugMode: process.env.REACT_APP_DEBUG_MODE === 'true'
      },
      
      // URLs frontend - CORRIGÉ ICI
      frontend: {
        // URL de votre application frontend (React)
        baseURL: process.env.REACT_APP_FRONTEND_URL || 'https://localhost:3443',
        
        // URL pour les pages de conférence - doit pointer vers le FRONTEND, pas le serveur WebRTC
        webrtcURL: process.env.REACT_APP_WEBRTC_FRONTEND_URL || 
                  process.env.REACT_APP_FRONTEND_URL || 
                  'https://localhost:3443'
      }
    };
  }
  
  // Méthode de validation pour éviter l'erreur
  static validateConfig() {
    const config = this.getConfig();
    
    // Vérifier que les URLs de conférence utilisent HTTPS (obligatoire pour WebRTC)
    if (!config.frontend.baseURL.startsWith('https://')) {
      console.warn('⚠️ L\'interface de conférence doit utiliser HTTPS pour WebRTC');
    }
    
    // Vérifier que l'interface pointe vers le port 3443
    if (!config.frontend.baseURL.includes(':3443')) {
      console.warn('⚠️ L\'interface de conférence devrait pointer vers le port 3443');
    }
    
    console.log('✅ Configuration WebRTC validée:', {
      webrtcServer: config.webrtcServer.baseURL,
      frontend: config.frontend.baseURL
    });
    
    return true;
  }
  
  static getWebRTCConfig() {
    const config = this.getConfig();
    return {
      iceServers: [
        ...config.webrtc.stunServers.map(url => ({ urls: url.trim() })),
        ...config.webrtc.turnServers.map(url => ({ urls: url.trim() }))
      ],
      iceCandidatePoolSize: config.webrtc.iceCandidatePoolSize,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };
  }
  
  static getSocketConfig(serverType = 'main') {
    const config = this.getConfig();
    const server = serverType === 'webrtc' ? config.webrtcServer : config.mainServer;
    
    return {
      url: server.baseURL,
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
        rememberUpgrade: false,
        // Configuration SSL pour le serveur WebRTC
        ...(serverType === 'webrtc' && {
          secure: true,
          rejectUnauthorized: config.development.sslVerify
        })
      }
    };
  }
  
  static getApiConfig(serverType = 'main') {
    const config = this.getConfig();
    const server = serverType === 'webrtc' ? config.webrtcServer : config.mainServer;
    
    return {
      baseURL: server.apiURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      // Configuration pour les requêtes HTTPS avec certificats auto-signés
      ...(serverType === 'webrtc' && {
        httpsAgent: config.development.devMode ? {
          rejectUnauthorized: config.development.sslVerify
        } : undefined
      })
    };
  }
  
  static generateConferenceUrl(conferenceCode, shareToken = null) {
    const config = this.getConfig();
    // Utiliser l'interface React (port 3001) - le serveur 3443 servira l'interface via proxy
    const baseUrl = config.frontend.baseURL;
    
    if (shareToken) {
      return `${baseUrl}/conference/join/${shareToken}`;
    }
    
    return `${baseUrl}/conference/${conferenceCode}`;
  }
  
  static generateShareUrl(shareToken) {
    const config = this.getConfig();
    // Utiliser l'interface React (port 3001)
    return `${config.frontend.baseURL}/conference/join/${shareToken}`;
  }
  
  static isWebRTCServer(url) {
    return url && url.includes(':3443');
  }
  
  static getServerType(url) {
    if (this.isWebRTCServer(url)) {
      return 'webrtc';
    }
    return 'main';
  }
}

// Validation au chargement
try {
  FrontendConfigService.validateConfig();
  console.log('✅ Configuration frontend validée avec succès');
} catch (error) {
  console.error('❌ Erreur de configuration:', error.message);
  console.log('💡 Assurez-vous que REACT_APP_WEBRTC_FRONTEND_URL pointe vers votre frontend (port 3001) et non vers le serveur WebRTC (port 3443)');
}

export default FrontendConfigService;