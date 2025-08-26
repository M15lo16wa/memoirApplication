import { useState, useEffect, useCallback } from 'react';
import signalingService from '../services/signalingService';

// Simule un appel API pour l'historique (à adapter avec votre vrai service API)
const getMessageHistory = async (conversationId) => {
    // C'est ici que vous appelleriez votre messagingAPI.getConversationMessages
    console.log(`Récupération de l'historique pour ${conversationId}`);
    return []; // Retourne un tableau vide pour l'exemple
};


export const useChat = (conversationId, userId) => {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        signalingService.connect(); // S'assure que le service est connecté

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        signalingService.on('connect', handleConnect);
        signalingService.on('disconnect', handleDisconnect);

        // -- Gestion des messages --
        const handleNewMessage = (newMessage) => {
            if (newMessage.conversationId === conversationId) {
                setMessages(prev => [...prev, newMessage]);
            }
        };

        signalingService.on('receive_message', handleNewMessage);
        
        // -- Chargement initial --
        if (conversationId) {
            signalingService.emit('join_conversation', conversationId);
            
            getMessageHistory(conversationId).then(history => {
                setMessages(history);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }

        // -- Nettoyage --
        return () => {
            signalingService.off('connect', handleConnect);
            signalingService.off('disconnect', handleDisconnect);
            signalingService.off('receive_message', handleNewMessage);
            if (conversationId) {
                signalingService.emit('leave_conversation', conversationId);
            }
        };
    }, [conversationId]);

    const sendMessage = useCallback((content) => {
        if (content.trim() && conversationId) {
            const messageData = {
                conversationId,
                message: content,
                type: 'text',
                senderId: userId,
                timestamp: new Date().toISOString()
            };
            signalingService.emit('send_message', messageData);
        }
    }, [conversationId, userId]);

    return { messages, sendMessage, isConnected, isLoading };
};
