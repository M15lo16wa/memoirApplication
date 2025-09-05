// src/components/webrtc/ConferenceRoom.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import useWebRTC from '../../hooks/useWebRTC';
import './webrtc.css';

const ConferenceRoom = ({ conferenceCode, onEnd, userType }) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [error, setError] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const { joinConference, endConference, config: webrtcConfig } = useWebRTC();

    const initializeWebRTC = useCallback(async () => {
        try {
            const conferenceData = await joinConference(conferenceCode);
            console.log('Conférence rejointe:', conferenceData);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setLocalStream(stream);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            await setupPeerConnection();

        } catch (err) {
            setError(err.message);
            console.error('Erreur initialisation WebRTC:', err);
        }
    }, [conferenceCode, joinConference]);

    const cleanup = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
    }, [localStream]);

    useEffect(() => {
        if (conferenceCode && webrtcConfig) {
            initializeWebRTC();
        }
        return () => {
            cleanup();
        };
    }, [conferenceCode, webrtcConfig, initializeWebRTC, cleanup]);

    const setupPeerConnection = useCallback(async () => {
        try {
            const peerConnection = new RTCPeerConnection(webrtcConfig);
            peerConnectionRef.current = peerConnection;

            if (localStream) {
                localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream);
                });
            }

            peerConnection.ontrack = (event) => {
                const [remoteStream] = event.streams;
                setRemoteStream(remoteStream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
                setIsConnected(true);
            };

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    // Signaling via WebSocket (à implémenter)
                }
            };

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

        } catch (err) {
            setError('Erreur configuration WebRTC: ' + err.message);
        }
    }, [webrtcConfig, localStream]);

    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!isMuted);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOn(!isVideoOn);
            }
        }
    };

    const handleEndCall = async () => {
        try {
            await endConference(conferenceCode);
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
                            <p>Connexion en cours...</p>
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
                    onClick={toggleMute}
                    className={`control-btn ${isMuted ? 'muted' : ''}`}
                >
                    {isMuted ? '🔇' : '🎤'}
                </button>

                <button
                    onClick={toggleVideo}
                    className={`control-btn ${isVideoOn ? '' : 'video-off'}`}
                >
                    {isVideoOn ? '📹' : '📹'}
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