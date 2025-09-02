// src/messaging/components/WebRTCWidget.js
import React, { useState, useEffect, useRef } from 'react';
import { FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideoSlash } from 'react-icons/fa';
import signalingService from '../../services/signalingService';
import './WebRTCWidget.css';

const WebRTCWidget = ({ 
    conversationId,
    onClose,
    isInitiator = false,
    initialConferenceLink = null
}) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isInCall, setIsInCall] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [conferenceLink, setConferenceLink] = useState(null);
    const [copied, setCopied] = useState(false);
    const iceQueueRef = useRef([]);

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peerConnectionRef = useRef();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (initialConferenceLink) {
            setConferenceLink(initialConferenceLink);
        }
        setupWebRTCEventListeners();
        if (isInitiator) {
            startCall();
        }
        // Auto-join flow when opened via direct conference link
        try {
            const href = window?.location?.href || '';
            if (href.includes('/conference')) {
                // Extract code and optional session/conversation id from URL
                const url = new URL(href);
                const code = url.searchParams.get('code');
                const pathParts = url.pathname.split('/').filter(Boolean);
                const maybeId = pathParts[pathParts.length - 1];
                // Initialize signaling if needed
                if (!signalingService.isConnected()) {
                    signalingService.initialize();
                    // Try to connect as patient using localStorage
                    const patientRaw = localStorage.getItem('patient');
                    const token = localStorage.getItem('jwt') || localStorage.getItem('token');
                    let pid = null;
                    try {
                        const p = patientRaw ? JSON.parse(patientRaw) : null;
                        pid = p?.id_patient || p?.id || null;
                    } catch (e) {}
                    if (pid && token) {
                        signalingService.connectSocket(pid, 'patient', token);
                    }
                }
                // Emit a generic join event so server can send offer to this client
                signalingService.emit && signalingService.emit('join_conference', {
                    code: code,
                    sessionId: maybeId,
                    link: href
                });
                // Ask server to send SDP offer to this client
                signalingService.emit && signalingService.emit('request_webrtc_offer', {
                    code: code,
                    sessionId: maybeId
                });
            }
        } catch {}
        return () => cleanup();
    }, []);

    const setupWebRTCEventListeners = () => {
        signalingService.on('webrtc:offer', handleWebRTCOffer);
        signalingService.on('webrtc:answer', handleWebRTCAnswer);
        signalingService.on('webrtc:ice_candidates', handleICECandidates);
        signalingService.on('webrtc:session_ended', handleSessionEnded);
        signalingService.on('webrtc:session_created', handleSessionCreated);
    };

    const startCall = async () => {
        try {
            // Obtenir le flux média local
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideoEnabled,
                audio: isAudioEnabled
            });

            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Créer la connexion peer
            createPeerConnection(stream);

            // Générer et envoyer l'offre SDP côté initiateur
            if (peerConnectionRef.current) {
                const offer = await peerConnectionRef.current.createOffer();
                await peerConnectionRef.current.setLocalDescription(offer);
                signalingService.emit('webrtc_offer', {
                    conversationId,
                    sdpOffer: offer.sdp,
                    sessionType: 'audio_video'
                });
            }

            setIsInCall(true);

            // Optionnel: demander un lien de conférence via REST si nécessaire
            try {
                const session = await signalingService.createWebRTCSessionWithConferenceLink(
                    conversationId,
                    'audio_video',
                    null,
                    true
                );
                // Utiliser l'id retourné si disponible (sinon on le recevra via webrtc:session_created)
                if (session && (session.session?.id || session.id_session)) {
                    setSessionId(session.session?.id || session.id_session);
                    // Si des ICE ont été mis en file d'attente avant la création de session, les envoyer maintenant
                    if (iceQueueRef.current.length > 0) {
                        signalingService.addICECandidates(session.session?.id || session.id_session, iceQueueRef.current);
                        iceQueueRef.current = [];
                    }
                }
                // Enregistrer le lien/conférence si fourni par l'API
                if (session && (session.conferenceLink || session.data?.conference_link || session.data?.conference_code)) {
                    const link = session.conferenceLink || session.data?.conference_link || session.data?.conference_code;
                    setConferenceLink(link);
                    console.log('🔐 Lien de conférence reçu (REST):', link);
                }
            } catch (e) {
                // Ignorer si l'API REST n'est pas nécessaire
            }
        } catch (error) {
            console.error('Erreur démarrage appel:', error);
        }
    };

    const createPeerConnection = (stream) => {
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });

        // Ajouter le flux local
        stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
        });

        // Gérer les candidats ICE
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                if (sessionId) {
                    signalingService.addICECandidates(sessionId, [event.candidate]);
                } else {
                    iceQueueRef.current.push(event.candidate);
                }
            }
        };

        // Gérer le flux distant
        peerConnection.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        peerConnectionRef.current = peerConnection;
    };

    const handleSessionCreated = (data) => {
        const newSessionId = data.sessionId || data.session?.id || data.id_session || null;
        if (newSessionId) {
            setSessionId(newSessionId);
            // Envoyer les ICE en attente
            if (iceQueueRef.current.length > 0) {
                signalingService.addICECandidates(newSessionId, iceQueueRef.current);
                iceQueueRef.current = [];
            }
        }
        // Capturer le lien/conférence envoyé par le serveur
        const link = data.conferenceLink || data.conference_link || data.conference_code || data.session?.conference_link || data.session?.conference_code || null;
        if (link) {
            setConferenceLink(link);
            console.log('🔐 Lien de conférence reçu (socket):', link);
        }
    };

    const handleWebRTCOffer = async (data) => {
        try {
            // Obtenir le flux média local du répondeur
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideoEnabled,
                audio: isAudioEnabled
            });

            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            const peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            });

            // Ajouter flux local
            stream.getTracks().forEach(track => {
                peerConnection.addTrack(track, stream);
            });

            // Gérer ICE côté répondeur
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    signalingService.addICECandidates(data.sessionId, [event.candidate]);
                }
            };

            // Gérer flux distant
            peerConnection.ontrack = (event) => {
                setRemoteStream(event.streams[0]);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            setSessionId(data.sessionId || null);

            // Créer la réponse SDP
            await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdpOffer }));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Envoyer la réponse
            await signalingService.answerWebRTCSession(data.sessionId, answer.sdp);

            peerConnectionRef.current = peerConnection;
            setIsInCall(true);
        } catch (error) {
            console.error('Erreur gestion offre WebRTC:', error);
        }
    };

    const handleWebRTCAnswer = async (data) => {
        try {
            if (!peerConnectionRef.current) {
                return;
            }
            await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription({ type: 'answer', sdp: data.sdpAnswer })
            );
        } catch (error) {
            console.error('Erreur gestion réponse WebRTC:', error);
        }
    };

    const handleICECandidates = async (data) => {
        if (peerConnectionRef.current && Array.isArray(data.candidates)) {
            try {
                for (const candidate of data.candidates) {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (error) {
                console.error('Erreur ajout candidat ICE:', error);
            }
        }
    };

    const handleSessionEnded = (data) => {
        if (data.sessionId === sessionId) {
            cleanup();
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const endCall = async () => {
        if (sessionId) {
            try {
                await signalingService.endWebRTCSession(sessionId);
            } catch (error) {
                console.error('Erreur fin appel:', error);
            }
        }
        cleanup();
    };

    const cleanup = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setIsInCall(false);
        setSessionId(null);
        setConferenceLink(null);
        onClose?.();
    };

    return (
        <>
        <div className="webrtc-backdrop" />
        <div className="webrtc-widget">
            <div className="webrtc-header">
                <h3>Appel en cours</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
            </div>

            {/* Bandeau lien de conférence si disponible */}
            {conferenceLink && (
                <div style={{
                    background: '#f3f4ff',
                    border: '1px solid #dcdcff',
                    color: '#2b2b6f',
                    padding: '12px 16px',
                    margin: '12px 20px 0 20px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Lien de conférence</div>
                        <input
                            type="text"
                            readOnly
                            value={conferenceLink}
                            onFocus={(e) => e.target.select()}
                            style={{
                                width: '100%',
                                background: '#fff',
                                border: '1px solid #cfd2f6',
                                borderRadius: '6px',
                                padding: '8px 10px',
                                fontFamily: 'monospace',
                                fontSize: 13,
                                color: '#1b1b4d'
                            }}
                        />
                        {copied && (
                            <div style={{ color: '#1b5e20', fontSize: 12, marginTop: 6 }}>Lien copié ✅</div>
                        )}
                    </div>
                    <button
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(conferenceLink);
                            } catch (e) {
                                const textarea = document.createElement('textarea');
                                textarea.value = conferenceLink;
                                document.body.appendChild(textarea);
                                textarea.select();
                                document.execCommand('copy');
                                document.body.removeChild(textarea);
                            }
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                        }}
                        aria-label="Copier le lien de conférence"
                        title="Copier le lien"
                        style={{
                            background: '#4f46e5',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            height: 38,
                            alignSelf: 'flex-end'
                        }}
                    >
                        {copied ? 'Copié' : 'Copier'}
                    </button>
                </div>
            )}

            <div className="webrtc-videos">
                <div className="local-video">
                    <video ref={localVideoRef} autoPlay muted playsInline />
                    <span>Vous</span>
                </div>
                {remoteStream && (
                    <div className="remote-video">
                        <video ref={remoteVideoRef} autoPlay playsInline />
                        <span>Interlocuteur</span>
                    </div>
                )}
            </div>

            <div className="webrtc-controls">
                <button
                    className={`control-button ${isAudioEnabled ? 'active' : 'inactive'}`}
                    onClick={toggleAudio}
                >
                    {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
                </button>

                <button
                    className={`control-button ${isVideoEnabled ? 'active' : 'inactive'}`}
                    onClick={toggleVideo}
                >
                    {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
                </button>

                <button className="control-button end-call" onClick={endCall}>Terminer</button>
            </div>
        </div>
        </>
    );
};

export default WebRTCWidget;