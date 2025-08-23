// src/hooks/useNotifications.js

import { useState, useEffect, useCallback } from 'react';
import messagingService from '../services/api/messagingApi';

/**
 * Hook pour gérer les notifications en temps réel (nouveaux messages, etc.)
 * en s'intégrant avec le service de messagerie et les WebSockets.
 */
const useNotifications = () => {
  // Les notifications peuvent être des messages, des alertes, etc.
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Charge l'état initial des notifications.
   * Pour la messagerie, cela signifie charger les conversations avec des messages non lus.
   */
  const loadInitialNotifications = useCallback(async () => {
    try {
      // Note : Cette fonction n'existe pas encore dans votre service, mais c'est l'approche idéale.
      // En attendant, on peut se baser sur le rechargement des conversations.
      // const unreadConvs = await messagingService.getUnreadConversations();
      
      // Pour l'instant, on se contente d'initialiser. Le rafraîchissement se fera via WebSocket.
      console.log('🔔 [useNotifications] Hook initialisé.');

    } catch (error) {
      console.error('❌ Erreur lors du chargement des notifications initiales:', error);
    }
  }, []);

  // Effet principal pour l'initialisation et l'écoute des événements WebSocket
  useEffect(() => {
    // 1. Charger l'état initial au montage du hook
    loadInitialNotifications();

    // 2. Définir le gestionnaire pour les nouveaux messages reçus via WebSocket
    const handleNewMessage = (newMessage) => {
      console.log('🔔 [useNotifications] Nouveau message reçu, création d\'une notification.');
      
      const newNotification = {
        id: newMessage.id || `notif_${Date.now()}`,
        type: 'nouveau_message',
        titre: `Nouveau message de ${newMessage.sender?.name || 'Utilisateur'}`,
        message: newMessage.content,
        timestamp: newMessage.timestamp,
        isRead: false,
        priorite: 'haute',
        data: newMessage // Contient toutes les infos du message original
      };

      // Ajoute la nouvelle notification en haut de la liste
      setNotifications(prev => [newNotification, ...prev]);
    };

    // 3. S'abonner aux nouveaux messages via notre service centralisé
    const unsubscribe = messagingService.onNewMessage(handleNewMessage);

    // 4. Nettoyer l'abonnement quand le composant qui utilise le hook est démonté
    return () => {
      unsubscribe();
    };
  }, [loadInitialNotifications]);

  // Mettre à jour le compteur de messages non lus à chaque changement des notifications
  useEffect(() => {
    const count = notifications.filter(n => !n.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  /**
   * Marque une notification spécifique comme lue.
   */
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    // Dans une application réelle, on appellerait ici une API:
    // messagingService.markNotificationAsRead(notificationId);
  }, []);

  /**
   * Marque toutes les notifications comme lues.
   */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  }, []);

  /**
   * Supprime une notification de la liste.
   */
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
  }, []);
  
  /**
   * Vide toutes les notifications.
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
};

export default useNotifications;