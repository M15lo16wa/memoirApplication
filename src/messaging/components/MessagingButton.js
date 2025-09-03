import React, { useState, useEffect } from 'react';
import { FaComments } from 'react-icons/fa';
import { signalingService } from '../index';

// Bouton de messagerie avec connexion au service
export const MessagingButton = ({ userId, role, token, conversationId, onClick, unreadCount = 0 }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    useEffect(() => {
        if (userId && role && token) {
            console.log('🔌 Initialisation de la connexion messagerie:', { userId, role, hasToken: !!token });
            
            // Initialiser le service de signalisation
            signalingService.initialize();
            
            const socket = signalingService.connectSocket(userId, role, token);

            if (socket) {
                socket.on('connect', () => {
                    console.log('✅ Connecté au service de messagerie');
                    setIsConnected(true);
                    setConnectionStatus('connected');

                    // Rejoindre la conversation si un ID est fourni
                    if (conversationId) {
                        signalingService.joinConversation(conversationId);
                    }
                });

                socket.on('disconnect', (reason) => {
                    console.log('❌ Déconnecté du service de messagerie:', reason);
                    setIsConnected(false);
                    setConnectionStatus('disconnected');
                });

                socket.on('connect_error', (error) => {
                    console.error('❌ Erreur de connexion messagerie:', error);
                    setIsConnected(false);
                    setConnectionStatus('error');
                });

                // Vérifier l'état de connexion immédiatement
                if (socket.connected) {
                    console.log('✅ Socket déjà connecté');
                    setIsConnected(true);
                    setConnectionStatus('connected');
                }
            } else {
                console.error('❌ Impossible de créer la connexion WebSocket');
                setConnectionStatus('error');
            }

            return () => {
                if (conversationId) {
                    signalingService.leaveConversation(conversationId);
                }
                signalingService.closeConnection();
            };
        } else {
            console.log('⚠️ Paramètres manquants pour la messagerie:', { userId, role, hasToken: !!token });
            setConnectionStatus('missing_params');
        }
    }, [userId, role, token, conversationId]);

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    // Déterminer le style et le texte selon l'état de connexion
    const getButtonStyle = () => {
        switch (connectionStatus) {
            case 'connected':
                return 'bg-pink-500 hover:bg-pink-600';
            case 'connecting':
                return 'bg-yellow-500 hover:bg-yellow-600';
            case 'error':
                return 'bg-red-500 hover:bg-red-600';
            case 'missing_params':
                return 'bg-gray-400 cursor-not-allowed';
            default:
                return 'bg-gray-400 cursor-not-allowed';
        }
    };

    const getStatusText = () => {
        switch (connectionStatus) {
            case 'connected':
                return null; // Pas de texte supplémentaire quand connecté
            case 'connecting':
                return <span className="ml-2 text-xs">(connexion...)</span>;
            case 'error':
                return <span className="ml-2 text-xs">(erreur)</span>;
            case 'missing_params':
                return <span className="ml-2 text-xs">(paramètres manquants)</span>;
            default:
                return <span className="ml-2 text-xs">(hors ligne)</span>;
        }
    };

    return (
        <button
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-bold transition relative ${getButtonStyle()}`}
            onClick={handleClick}
            disabled={!isConnected}
        >
            <FaComments />
            Messagerie
            {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
            {getStatusText()}
        </button>
    );
};

export default MessagingButton;
