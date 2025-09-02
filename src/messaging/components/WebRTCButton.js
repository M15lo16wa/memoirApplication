// src/messaging/components/WebRTCButton.js
import React, { useState, useEffect } from 'react';
import { FaVideo, FaStop } from 'react-icons/fa';
import { signalingService } from '../index';

const WebRTCButton = ({
    conversationId,
    sessionType = 'audio_video',
    disabled = false,
    onSessionStart,
    onSessionEnd
}) => {
    const [isInCall, setIsInCall] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    useEffect(() => {
        // Écouter les événements WebRTC
        signalingService.on('webrtc:session_created', handleSessionCreated);
        signalingService.on('webrtc:session_ended', handleSessionEnded);

        return () => {
            signalingService.off('webrtc:session_created', handleSessionCreated);
            signalingService.off('webrtc:session_ended', handleSessionEnded);
        };
    }, []);

    const handleSessionCreated = (data) => {
        if (data.conversationId === conversationId) {
            setIsInCall(true);
            setSessionId(data.sessionId);
            onSessionStart?.(data);
        }
    };

    const handleSessionEnded = (data) => {
        if (data.sessionId === sessionId) {
            setIsInCall(false);
            setSessionId(null);
            onSessionEnd?.(data);
        }
    };

    const startCall = async () => {
        try {
                    const session = await signalingService.createWebRTCSessionWithConferenceLink(
            conversationId,
            sessionType,
            null, // SDP offer
            true // Générer un code de conférence
        );
        console.log('Session WebRTC créée avec code de conférence:', session);
            
            // Afficher le code de conférence si disponible
            if (session.success && session.conferenceLink) {
                console.log('🔐 Code de conférence:', session.conferenceLink);
                // Ici vous pouvez ajouter une notification ou un affichage du code
            }
        } catch (error) {
            console.error('Erreur démarrage appel:', error);
        }
    };

    const endCall = async () => {
        if (sessionId) {
            try {
                await signalingService.endWebRTCSession(sessionId);
                console.log('Appel terminé');
            } catch (error) {
                console.error('Erreur fin appel:', error);
            }
        }
    };

    const getButtonIcon = () => {
        if (isInCall) return <FaStop />;
        if (sessionType === 'audio') return <FaStop />;
        return <FaVideo />;
    };

    const getButtonText = () => {
        if (isInCall) return 'Terminer';
        if (sessionType === 'audio') return 'Appel';
        return 'Visioconférence';
    };

    const getButtonClass = () => {
        if (isInCall) return 'webrtc-button end-call';
        return 'webrtc-button start-call';
    };

    return (
        <button
            className={getButtonClass()}
            onClick={isInCall ? endCall : startCall}
            disabled={disabled}
            title={getButtonText()}
        >
            {getButtonIcon()}
            <span>{getButtonText()}</span>
        </button>
    );
};

export default WebRTCButton;
