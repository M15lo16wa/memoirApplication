// src/hooks/useChat.js
import { useState, useEffect, useCallback } from 'react';
import { signalingService } from '../messaging';


export const useChat = (conversationId, userId) => {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initialiser et connecter le service
        signalingService.initialize();
        signalingService.connect();

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        signalingService.on('connect', handleConnect);
        signalingService.on('disconnect', handleDisconnect);

        // -- Gestion des messages (conforme au guide) --
        const handleNewMessage = (data) => {
            if (data.conversation.id === conversationId) {
                setMessages(prev => [...prev, data.message]);
            }
        };

        signalingService.on('message:received', handleNewMessage);
        
        // -- Chargement initial des messages --
        if (conversationId) {
            loadMessages(conversationId);
        } else {
            setIsLoading(false);
        }

        // -- Nettoyage --
        return () => {
            signalingService.off('connect', handleConnect);
            signalingService.off('disconnect', handleDisconnect);
            signalingService.off('message:received', handleNewMessage);
        };
    }, [conversationId]);

    // Fonction pour charger les messages (conforme au guide)
    const loadMessages = async (convId) => {
        try {
            setIsLoading(true);
            const result = await signalingService.getConversationMessages(convId, 1, 50);
            if (result.success) {
                setMessages(result.messages || []);
            } else {
                console.error('Erreur lors du chargement des messages:', result.error);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = useCallback(async (content) => {
        if (content.trim() && conversationId) {
            try {
                const result = await signalingService.sendMessage(
                    conversationId,
                    content.trim(),
                    'text'
                );
                
                if (result.success) {
                    // Le message sera ajouté automatiquement via l'événement 'message:received'
                    console.log('Message envoyé avec succès:', result.message);
                } else {
                    console.error('Erreur lors de l\'envoi du message:', result.error);
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi du message:', error);
            }
        }
    }, [conversationId]);

    return { messages, sendMessage, isConnected, isLoading };
};
