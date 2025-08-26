import React, { useState, useEffect } from 'react';
import { FaComments, FaVideo, FaBell, FaSpinner } from 'react-icons/fa';
import signalingService from '../../services/signalingService';

// Bouton de messagerie avec connexion au service
export const MessagingButton = ({ userId, role, token, conversationId, onClick, unreadCount = 0 }) => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (userId && role && token) {
            const socket = signalingService.connectSocket(userId, role, token);

            socket.on('connect', () => {
                console.log('✅ Connecté au service de messagerie');
                setIsConnected(true);

                // Rejoindre la conversation si un ID est fourni
                if (conversationId) {
                    signalingService.joinConversation(conversationId);
                }
            });

            socket.on('disconnect', () => {
                console.log('❌ Déconnecté du service de messagerie');
                setIsConnected(false);
            });

            return () => {
                if (conversationId) {
                    signalingService.leaveConversation(conversationId);
                }
                signalingService.closeConnection();
            };
        }
    }, [userId, role, token, conversationId]);

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    return (
        <button
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-bold transition relative ${isConnected
                ? 'bg-pink-500 hover:bg-pink-600'
                : 'bg-gray-400 cursor-not-allowed'
                }`}
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
            {!isConnected && (
                <span className="ml-2 text-xs">(hors ligne)</span>
            )}
        </button>
    );
};

export default MessagingButton; 