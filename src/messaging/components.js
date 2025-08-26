// src/messaging/components.js
import React, { useState, useEffect, useCallback } from "react";
import signalingService from "../services/signalingService";
import { FaComments, FaVideo, FaBell, FaSpinner } from "react-icons/fa";

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

// Widget de messagerie complet avec service
export const MessagingWidget = ({
    userId,
    role,
    token,
    conversationId,
    toUserId,
    onClose
}) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Charger l'historique des messages
    const loadMessageHistory = useCallback(async () => {
        try {
            setLoading(true);
            if (conversationId) {
                const response = await signalingService.getConversationMessages(conversationId, 1, 50);
                if (response.success) {
                    setMessages(response.messages || []);
                } else {
                    setError("Erreur lors du chargement des messages");
                }
            }
        } catch (err) {
            console.error("Erreur lors du chargement de l'historique:", err);
            setError("Impossible de charger les messages");
        } finally {
            setLoading(false);
        }
    }, [conversationId]);

    // Initialiser la connexion
    useEffect(() => {
        if (userId && role && token) {
            const socket = signalingService.connectSocket(userId, role, token);

            socket.on('connect', () => {
                console.log('✅ Connecté au service de messagerie');
                setIsConnected(true);
                setError(null);

                if (conversationId) {
                    signalingService.joinConversation(conversationId);
                    loadMessageHistory();
                }
            });

            socket.on('disconnect', () => {
                console.log('❌ Déconnecté du service de messagerie');
                setIsConnected(false);
                setError("Connexion perdue");
            });

            socket.on('connect_error', (error) => {
                console.error('❌ Erreur de connexion:', error);
                setError("Erreur de connexion au serveur");
            });

            // Écouter les nouveaux messages
            signalingService.onMessageReceived((data) => {
                console.log('📨 Nouveau message reçu:', data);
                setMessages(prev => [...prev, {
                    id: data.messageId || Date.now(),
                    sender: data.senderId === userId ? role : 'patient',
                    content: data.message,
                    timestamp: data.timestamp || new Date().toISOString(),
                    type: data.type || 'text'
                }]);
            });

            return () => {
                if (conversationId) {
                    signalingService.leaveConversation(conversationId);
                }
                signalingService.closeConnection();
            };
        }
    }, [userId, role, token, conversationId, loadMessageHistory]);

    // Envoyer un message
    const handleSend = useCallback(() => {
        if (input.trim() && isConnected) {
            try {
                if (conversationId) {
                    signalingService.sendMessage(conversationId, input.trim());
                } else if (toUserId) {
                    signalingService.createConversation([toUserId], 'private')
                        .then(response => {
                            if (response.success && response.conversationId) {
                                signalingService.joinConversation(response.conversationId);
                                signalingService.sendMessage(response.conversationId, input.trim());
                            }
                        });
                }

                setMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: role,
                    content: input.trim(),
                    timestamp: new Date().toISOString(),
                    type: 'text',
                    pending: true
                }]);

                setInput("");
            } catch (err) {
                console.error("Erreur lors de l'envoi du message:", err);
                setError("Erreur lors de l'envoi du message");
            }
        }
    }, [input, isConnected, conversationId, toUserId, role]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleReconnect = () => {
        setError(null);
        if (userId && role && token) {
            signalingService.connectSocket(userId, role, token);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Messagerie</h2>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                        {isConnected ? 'Connecté' : 'Déconnecté'}
                    </span>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-lg"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex justify-between items-center">
                    <span className="text-red-800 text-sm">{error}</span>
                    <button
                        onClick={handleReconnect}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                        Réessayer
                    </button>
                </div>
            )}

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <FaSpinner className="animate-spin text-blue-500 mr-2" />
                        <span className="text-gray-600">Chargement des messages...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <FaComments className="text-3xl mx-auto mb-2 opacity-50" />
                        <p>Aucun message</p>
                        <p className="text-sm">Envoyez un message pour démarrer la conversation</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`p-3 rounded-lg ${msg.sender === role
                                    ? "bg-blue-50 text-blue-800 ml-8"
                                    : "bg-gray-100 text-gray-700 mr-8"
                                } ${msg.pending ? 'opacity-70' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm">
                                    {msg.sender === role ? "Moi" : "Patient"}:
                                </span>
                                <span className="text-xs opacity-70">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="text-sm">{msg.content}</div>
                            {msg.pending && (
                                <div className="text-xs italic mt-1 opacity-70">Envoi en cours...</div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    className="border rounded px-3 py-2 flex-1"
                    placeholder={isConnected ? "Écrire un message..." : "Connexion perdue..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!isConnected}
                />
                <button
                    onClick={handleSend}
                    className={`px-4 py-2 rounded font-medium ${isConnected && input.trim()
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    disabled={!input.trim() || !isConnected}
                >
                    Envoyer
                </button>
            </div>
        </div>
    );
};

// Composant de bouton d'appel vidéo
export const VideoCallButton = ({ onClick, disabled = false }) => (
    <button
        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-bold transition ${disabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
        onClick={onClick}
        disabled={disabled}
    >
        <FaVideo />
        Appel Vidéo
    </button>
);

// Composant de notifications
export const NotificationsButton = ({ count = 0, onClick }) => (
    <button
        className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-bold bg-purple-500 hover:bg-purple-600 transition relative"
        onClick={onClick}
    >
        <FaBell />
        Notifications
        {count > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                {count > 99 ? '99+' : count}
            </span>
        )}
    </button>
);
