// src/components/webrtc/ConferenceRoom.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import useWebRTC from '../../hooks/useWebRTC';
import './webrtc.css';

const ConferenceRoom = ({ conferenceCode, onEnd, userType, user, token }) => {
    const [error, setError] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);

    // Utiliser le hook WebRTC avec les paramètres nécessaires
    const {
        joinConference,
        endConference,
        config: webrtcConfig,
        toggleAudio,
        toggleVideo,
        leaveConference,
        localStream,
        remoteStream,
        isConnected,
        isMuted,
        isVideoOff,
        isLoading,
        error: webrtcError
    } = useWebRTC(token, conferenceCode, userType, user);

    // Le hook useWebRTC gère l'initialisation automatiquement

    // Mettre à jour les références vidéo quand les streams changent
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Gérer les erreurs du hook
    useEffect(() => {
        if (webrtcError) {
            setError(webrtcError);
        }
    }, [webrtcError]);

    const cleanup = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
    }, [localStream]);

    // Nettoyage au démontage
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    // La configuration WebRTC est gérée par le hook

    const handleToggleMute = () => {
        toggleAudio();
    };

    const handleToggleVideo = () => {
        toggleVideo();
    };

    const handleEndCall = async () => {
        try {
            leaveConference();
            cleanup();
            onEnd();
        } catch (err) {
            console.error('Erreur fin de conférence:', err);
        }
    };

    if (error) {
        return (
            <div className="conference-error">
                <h3>Erreur de connexion</h3>
                <p>{error}</p>
                <button onClick={onEnd} className="btn btn-primary">Fermer</button>
            </div>
        );
    }

    return (
        <div className="conference-room">
            <div className="video-container">
                <div className="remote-video">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="remote-video-element"
                    />
                    {!isConnected && (
                        <div className="connection-status">
                            <p>{isLoading ? 'Connexion en cours...' : 'En attente de connexion...'}</p>
                        </div>
                    )}
                </div>

                <div className="local-video">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="local-video-element"
                    />
                </div>
            </div>

            <div className="conference-controls">
                <button
                    onClick={handleToggleMute}
                    className={`control-btn ${isMuted ? 'muted' : ''}`}
                >
                    {isMuted ? '🔇' : '🎤'}
                </button>

                <button
                    onClick={handleToggleVideo}
                    className={`control-btn ${isVideoOff ? 'video-off' : ''}`}
                >
                    {isVideoOff ? '📹' : '📹'}
                </button>

                <button
                    onClick={handleEndCall}
                    className="control-btn end-call"
                >
                    📞
                </button>
            </div>
        </div>
    );
};

export default ConferenceRoom;