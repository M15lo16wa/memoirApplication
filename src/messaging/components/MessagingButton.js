import React, { useState, useEffect } from 'react';
import { FaComments } from 'react-icons/fa';

// Bouton de messagerie simplifié
export const MessagingButton = ({ userId, role, token, conversationId, onClick, unreadCount = 0 }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    useEffect(() => {
        // WebRTC supprimé - fonctionnalité gérée côté serveur
        console.log('📞 Service de signalisation supprimé - WebRTC géré côté serveur');
        setIsConnected(true);
        setConnectionStatus('connected');
    }, [userId, role, token]);

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`relative p-3 rounded-lg transition-all duration-200 ${
                isConnected 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
            disabled={!isConnected}
            title={isConnected ? 'Messagerie disponible' : 'Messagerie indisponible'}
        >
            <FaComments className="text-xl" />
            {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
            <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
        </button>
    );
};

export default MessagingButton;