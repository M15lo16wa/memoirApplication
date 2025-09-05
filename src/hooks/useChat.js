// src/hooks/useChat.js
import { useState, useEffect, useCallback } from 'react';

export const useChat = (conversationId, userId) => {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fonctionnalité gérée côté serveur
        console.log('📞 Service de signalisation supprimé - géré côté serveur');
        setIsConnected(true);
        setIsLoading(false);
    }, [conversationId]);

    // Fonction pour charger les messages (simulation)
    const loadMessages = async (convId) => {
        try {
            setIsLoading(true);
            // Simulation - remplacer par un vrai appel API
            setMessages([]);
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = useCallback(async (content) => {
        if (content.trim() && conversationId) {
            try {
                // Simulation - remplacer par un vrai appel API
                console.log('📞 Message simulé envoyé:', content);
            } catch (error) {
                console.error('Erreur lors de l\'envoi du message:', error);
            }
        }
    }, [conversationId]);

    const handleConferenceLink = (conferenceUrl) => {
        const code = conferenceUrl.split('/').pop();
        // Rediriger vers la page WebRTC
        window.location.href = `/webrtc?join=${code}`;
    };

    return { messages, sendMessage, isConnected, isLoading };
};