import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FaPaperPlane, FaPaperclip, FaMicrophone, FaSmile, FaTimes, FaShieldAlt, FaUserMd, FaUser } from 'react-icons/fa';
import useSecureMessaging from '../../hooks/useSecureMessaging';
import useMessaging from '../../hooks/useMessaging';
import messagingService from '../../services/api/messagingApi';

const SecureMessaging = ({ 
  contextType, 
  contextId, 
  medecinInfo = null, 
  isOpen = false,
  onClose, 
  patientProfile = null,
  currentUserName = null,
  currentUserRole = null
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // 🔌 Hook unifié pour la messagerie (HTTP + WebSocket)
  const { isConnected: wsConnected, socketId } = useMessaging();
  
  // Récupérer directement les informations de connexion depuis la session
  const getCurrentSessionUser = useCallback(() => {
    try {
      console.log('🔍 [SecureMessaging] getCurrentSessionUser appelé');
      console.log('🔍 [SecureMessaging] Props reçues:', { currentUserName, currentUserRole });
      
      // Priorité aux props passées depuis le composant parent
      if (currentUserName && currentUserRole) {
        console.log('🔍 [SecureMessaging] Utilisation des props utilisateur:', { currentUserName, currentUserRole });
        
        // Récupérer l'ID depuis localStorage même quand on utilise les props
        const patientData = localStorage.getItem('patient');
        const medecinData = localStorage.getItem('medecin');
        
        console.log('🔍 [SecureMessaging] Données localStorage:', { 
          patient: patientData ? 'présent' : 'absent',
          medecin: medecinData ? 'présent' : 'absent'
        });
        
        let userId = null;
        if (currentUserRole === 'patient' && patientData) {
          const patient = JSON.parse(patientData);
          userId = patient.id || patient.id_patient;
          console.log('🔍 [SecureMessaging] ID patient extrait:', userId);
        } else if (currentUserRole === 'medecin' && medecinData) {
          const medecin = JSON.parse(medecinData);
          userId = medecin.id_professionnel || medecin.id;
          console.log('🔍 [SecureMessaging] ID médecin extrait:', userId);
        }
        
        console.log('🔍 [SecureMessaging] Utilisateur créé avec props:', { id: userId, type: currentUserRole, name: currentUserName });
        return {
          id: userId,
          type: currentUserRole,
          name: currentUserName,
          data: null
        };
      }

      // Vérifier d'abord si on est connecté en tant que patient
      const patientData = localStorage.getItem('patient');
      if (patientData) {
        const patient = JSON.parse(patientData);
        console.log('🔍 [SecureMessaging] Patient connecté détecté:', patient);
        return {
          id: patient.id || patient.id_patient,
          type: 'patient',
          name: `${patient.prenom || 'Patient'} ${patient.nom || ''}`.trim(),
          data: patient
        };
      }

      // Vérifier ensuite si on est connecté en tant que médecin
      const medecinData = localStorage.getItem('medecin');
      if (medecinData) {
        const medecin = JSON.parse(medecinData);
        console.log('🔍 [SecureMessaging] Médecin connecté détecté:', medecin);
        return {
          id: medecin.id_professionnel || medecin.id,
          type: 'medecin',
          name: `Dr. ${medecin.nom || 'Médecin'} ${medecin.prenom || ''}`.trim(),
          data: medecin
        };
      }

      // Vérifier le token JWT pour déterminer le type d'utilisateur
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔍 [SecureMessaging] Token JWT décodé:', payload);
          
          if (payload.role === 'patient') {
            return {
              id: payload.id || payload.patient_id,
              type: 'patient',
              name: 'Patient (JWT)',
              data: payload
            };
          } else if (payload.role === 'medecin' || payload.role === 'professionnel') {
            return {
              id: payload.id || payload.professionnel_id,
              type: 'medecin',
              name: 'Médecin (JWT)',
              data: payload
            };
          }
        } catch (jwtError) {
          console.warn('⚠️ [SecureMessaging] Erreur décodage JWT:', jwtError);
        }
      }

      console.warn('⚠️ [SecureMessaging] Aucun utilisateur connecté détecté');
      return null;
    } catch (error) {
      console.error('❌ [SecureMessaging] Erreur détection utilisateur:', error);
      return null;
    }
  }, [currentUserName, currentUserRole]);

  // Utiliser l'utilisateur de session au lieu de celui du hook
  const sessionUser = useMemo(() => getCurrentSessionUser(), [getCurrentSessionUser]);
  
  const {
    messages,
    loading,
    error,
    sendMessageUnified,
    currentUser: hookUser,
    conversationId,
    isConnected
  } = useSecureMessaging(contextType, contextId, medecinInfo);

  // 🔍 DEBUG : Afficher les informations de contexte et de conversation (OPTIMISÉ : seulement au montage)
  const debugInfo = useMemo(() => ({
    contextType,
    contextId,
    conversationId,
    medecinInfo: medecinInfo ? {
      id: medecinInfo.id_professionnel || medecinInfo.id,
      nom: medecinInfo.nom,
      prenom: medecinInfo.prenom
    } : null,
    currentUser: sessionUser || hookUser ? {
      id: (sessionUser || hookUser)?.id,
      type: (sessionUser || hookUser)?.type,
      name: (sessionUser || hookUser)?.name
    } : null,
    messagesCount: messages.length,
    isConnected,
    loading,
    error
  }), [contextType, contextId, conversationId, medecinInfo, sessionUser, hookUser, messages.length, isConnected, loading, error]);

  // Log debug info seulement au montage ou changement significatif
  useEffect(() => {
    console.log('🔍 [SecureMessaging] Initialisation avec:', {
      contextType,
      contextId,
      currentUser: sessionUser || hookUser,
      messagesCount: messages.length
    });
  }, []); // ✅ Seulement au montage

  // Priorité à l'utilisateur de session
  const currentUser = useMemo(() => sessionUser || hookUser, [sessionUser, hookUser]);

  // Fonction pour déterminer si un message est de l'utilisateur actuel
  const isOwnMessage = useCallback((message) => {
    // Vérification de sécurité renforcée
    if (!message) {
      return false;
    }
    
    // Priorité absolue à l'utilisateur de session
    const user = sessionUser || currentUser;
    
    if (!user || !user.type || !user.id) {
      return false;
    }
    
    // 🔧 CORRECTION : Gérer les messages temporaires qui n'ont pas encore expediteur_info
    if (message.status === 'sending' || message.status === 'error') {
      // Pour les messages temporaires, vérifier le sender
      if (message.sender && message.sender.id === user.id) {
        return true;
      }
      return false;
    }
    
    // Pour les messages confirmés, vérifier expediteur_info
    if (!message.expediteur_info) {
      return false;
    }
    
    const expediteur = message.expediteur_info;
    
    // 🔧 CORRECTION : Comparaison avec expediteur_id et expediteur_type
    if (message.expediteur_id && user.id && message.expediteur_id === user.id) {
      return true;
    }

    // Vérification par type et ID
    if (expediteur.type === user.type && expediteur.id && user.id && expediteur.id === user.id) {
      return true;
    }

    return false;
  }, [currentUser, sessionUser]);

  // Vérification en temps réel de la session (OPTIMISÉ : moins fréquent)
  useEffect(() => {
    const checkSession = () => {
      const currentSessionUser = getCurrentSessionUser();
      if (currentSessionUser && (!sessionUser || currentSessionUser.id !== sessionUser.id)) {
        console.log('🔄 [SecureMessaging] Session utilisateur mise à jour:', currentSessionUser);
        // Note: Plus de re-render forcé pour éviter les interruptions
      }
    };

    // Vérifier la session toutes les 2 minutes (beaucoup moins fréquent)
    const interval = setInterval(checkSession, 120000);
    return () => clearInterval(interval);
  }, [sessionUser, getCurrentSessionUser]);

  // Debug des messages reçus (OPTIMISÉ : seulement en cas de changement significatif)
  useEffect(() => {
    // Log seulement si le nombre de messages change ou si c'est le premier chargement
    if (messages.length > 0) {
      console.log('🔍 [SecureMessaging] Messages chargés:', messages.length);
      
      // Debug détaillé seulement pour le premier message
      if (messages.length === 1) {
        const firstMsg = messages[0];
        console.log('🔍 [SecureMessaging] Premier message:', {
          id: firstMsg.id,
          content: firstMsg.content,
          expediteur_info: firstMsg.expediteur_info,
          hasExpediteurInfo: !!firstMsg.expediteur_info
        });
      }
    }
  }, [messages.length]); // ✅ Seulement la longueur, pas le contenu complet

  // Auto-scroll vers le bas (OPTIMISÉ : avec debounce)
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    // Debounce le scroll pour éviter les appels trop fréquents
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages.length, scrollToBottom]); // ✅ Seulement la longueur, pas le contenu complet

  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) return;

    try {
      console.log('📤 [SecureMessaging] Tentative d\'envoi du message:', message.trim());
      await sendMessageUnified(message.trim());
      setMessage('');
      console.log('✅ [SecureMessaging] Message envoyé avec succès');
    } catch (error) {
      console.error('❌ [SecureMessaging] Erreur lors de l\'envoi du message:', error);
      // 🔧 CORRECTION : Afficher l'erreur à l'utilisateur
      alert(`Erreur lors de l'envoi du message: ${error.message || 'Erreur inconnue'}`);
    }
  }, [message, sendMessageUnified]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // OPTIMISATION : Mémoriser le rendu des messages pour éviter les re-renders
  const renderedMessages = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          Aucun message pour le moment
        </div>
      );
    }

    return messages.map((msg, index) => {
      // Vérification de sécurité pour éviter les erreurs
      if (!msg) {
        console.warn(`⚠️ [SecureMessaging] Message ${index} invalide:`, msg);
        return null; // Ignorer ce message
      }
      
      const isOwn = isOwnMessage(msg);
      
      // 🔧 CORRECTION : Gérer les messages temporaires et confirmés
      let messageContent = '';
      let messageTime = '';
      let senderName = '';
      
      if (msg.status === 'sending' || msg.status === 'error') {
        // Message temporaire
        messageContent = msg.content || msg.contenu || 'Message en cours d\'envoi...';
        messageTime = new Date(msg.timestamp).toLocaleTimeString();
        senderName = isOwn ? 'Vous' : (msg.sender?.name || 'Utilisateur');
      } else {
        // Message confirmé
        messageContent = msg.contenu || msg.content || 'Message sans contenu';
        messageTime = new Date(msg.date_envoi || msg.timestamp).toLocaleTimeString();
        senderName = isOwn ? 'Vous' : (msg.expediteur_info?.nom || 'Utilisateur');
      }

      // 🔧 CORRECTION : Gérer les messages d'erreur
      const messageClass = msg.status === 'error' 
        ? 'bg-red-500 text-white' 
        : isOwn 
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-800';

      return (
        <div
          key={msg.id || `msg_${index}`}
          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
        >
          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${messageClass}`}>
            <div className="flex items-center space-x-2 mb-1">
              {isOwn ? (
                <FaUser className="w-4 h-4" />
              ) : (
                <FaUserMd className="w-4 h-4" />
              )}
              <span className="text-xs font-medium">
                {senderName}
              </span>
              {/* 🔧 CORRECTION : Afficher le statut pour les messages temporaires */}
              {msg.status === 'sending' && (
                <span className="text-xs opacity-75">(envoi...)</span>
              )}
              {msg.status === 'error' && (
                <span className="text-xs opacity-75">(échec)</span>
              )}
            </div>
            <p className="text-sm">{messageContent}</p>
            <span className="text-xs opacity-75 mt-1 block">
              {messageTime}
            </span>
          </div>
        </div>
      );
    }).filter(Boolean); // Filtrer les messages null
  }, [messages, isOwnMessage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <FaShieldAlt className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Messagerie Sécurisée
              </h3>
              <p className="text-sm text-gray-600">
                {contextType === 'ordonnance' ? 'Ordonnance' : 'Consultation'} #{contextId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Zone des messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Chargement des messages...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Erreur: {error}
            </div>
          ) : (
            <div className="space-y-4">
              {renderedMessages}
            </div>
          )}
          
          {/* Référence pour l'auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaPaperPlane className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureMessaging;
