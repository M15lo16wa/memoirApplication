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
    const [connectionState, setConnectionState] = useState('new');
    const [isRemoteWaiting, setIsRemoteWaiting] = useState(true);
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
                const runJoinFlow = async () => {
                    try {
                        // Emit join + request for offer
                        signalingService.emit && signalingService.emit('join_conference', {
                            code: code,
                            sessionId: maybeId,
                            link: href
                        });
                        signalingService.emit && signalingService.emit('request_webrtc_offer', {
                            code: code,
                            sessionId: maybeId
                        });

                        // Fallback/optimisé: si l'API REST est dispo, récupérer les détails et répondre immédiatement
                        if (typeof signalingService.getWebRTCSessionDetailsWithConferenceLink === 'function') {
                            const details = await signalingService.getWebRTCSessionDetailsWithConferenceLink(maybeId);
                            if (details && (details.session?.sdp_offer || details.sdp_offer)) {
                                const sdpOffer = details.session?.sdp_offer || details.sdp_offer;
                                const conversationIdFromServer = details.session?.conversation_id || details.conversation_id || null;
                                if (conversationIdFromServer && typeof signalingService.joinConversation === 'function') {
                                    console.log('🧩 Patient: joinConversation with conversationId =', conversationIdFromServer);
                                    signalingService.joinConversation(conversationIdFromServer);
                                    setIsRemoteWaiting(false);
                                }
                                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                                setLocalStream(stream);
                                if (localVideoRef.current) {
                                    localVideoRef.current.srcObject = stream;
                                }
                                const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
                                peerConnectionRef.current = pc;
                                stream.getTracks().forEach(tr => pc.addTrack(tr, stream));
                                pc.ontrack = (e) => {
                                    setRemoteStream(e.streams[0]);
                                    if (remoteVideoRef.current) {
                                        remoteVideoRef.current.srcObject = e.streams[0];
                                    }
                                };
                                pc.onicecandidate = (e) => {
                                    if (e.candidate) {
                                        signalingService.addICECandidates && signalingService.addICECandidates(maybeId, [e.candidate]);
                                    }
                                };
                                pc.onconnectionstatechange = () => {
                                    setConnectionState(pc.connectionState);
                                };
                                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: sdpOffer }));
                                const answer = await pc.createAnswer();
                                await pc.setLocalDescription(answer);
                                if (typeof signalingService.answerWebRTCSessionWithConferenceValidation === 'function') {
                                    await signalingService.answerWebRTCSessionWithConferenceValidation(
                                        maybeId,
                                        answer.sdp,
                                        details?.conferenceLink?.joinCode || code
                                    );
                                } else {
                                    await signalingService.answerWebRTCSession(maybeId, answer.sdp);
                                }
                                setIsInCall(true);
                                setSessionId(maybeId);
                            }
                        }
                    } catch (e) {}
                };

                if (signalingService.isConnected && signalingService.isConnected()) {
                    runJoinFlow();
                } else {
                    // Attendre la connexion socket avant d'émettre
                    const onConnect = () => {
                        runJoinFlow();
                        signalingService.off && signalingService.off('connect', onConnect);
                    };
                    signalingService.on && signalingService.on('connect', onConnect);
                }
            }
        } catch {}
        return () => cleanup();
    }, []);

    const setupWebRTCEventListeners = () => {
        // Supporter ':' et '_' pour compat
        signalingService.on('webrtc:offer', handleWebRTCOffer);
        signalingService.on && signalingService.on('webrtc_offer', handleWebRTCOffer);
        signalingService.on('webrtc:answer', handleWebRTCAnswer);
        signalingService.on && signalingService.on('webrtc_answer', handleWebRTCAnswer);
        signalingService.on('webrtc:ice_candidates', handleICECandidates);
        signalingService.on && signalingService.on('webrtc_ice_candidates', handleICECandidates);
        signalingService.on('webrtc:session_ended', handleSessionEnded);
        signalingService.on('webrtc:session_created', handleSessionCreated);
        signalingService.on && signalingService.on('webrtc_session_created', handleSessionCreated);
        // Présence/état si disponibles côté serveur
        signalingService.on && signalingService.on('conference:participant_joined', () => setIsRemoteWaiting(false));
        signalingService.on && signalingService.on('conference:participant_left', ({ participantsCount }) => {
            if (participantsCount <= 1) setIsRemoteWaiting(true);
        });
        // Nouveaux événements normalisés côté serveur
        signalingService.on && signalingService.on('webrtc_participant_joined', ({ participantsCount }) => {
            if (participantsCount >= 2) setIsRemoteWaiting(false);
        });
        signalingService.on && signalingService.on('webrtc_participant_left', ({ participantsCount }) => {
            if (!participantsCount || participantsCount <= 1) setIsRemoteWaiting(true);
        });
    };

    const startCall = async () => {
        try {
            // 1) Créer la session côté serveur AVANT d'émettre l'offre pour garantir un sessionId
            let createdSessionId = null;
            let serverConversationId = conversationId || null;
            try {
                const session = await signalingService.createWebRTCSessionWithConferenceLink(
                    conversationId,
                    'audio_video',
                    null,
                    true
                );
                if (session && (session.session?.id || session.id_session)) {
                    createdSessionId = session.session?.id || session.id_session;
                    setSessionId(createdSessionId);
                }
                if (session && (session.session?.conversation_id || session.data?.conversation_id)) {
                    serverConversationId = session.session?.conversation_id || session.data?.conversation_id;
                }
                if (session && (session.conferenceLink || session.data?.conference_link || session.data?.conference_code)) {
                    const link = session.conferenceLink || session.data?.conference_link || session.data?.conference_code;
                    setConferenceLink(link);
                    console.log('🔐 Lien de conférence reçu (REST):', link);
                }
            } catch (e) {
                console.warn('Création de session REST échouée ou non nécessaire:', e?.message);
            }

            // 0) Rejoindre la salle avec l'identifiant exact attendu par le serveur
            if (serverConversationId && typeof signalingService.joinConversation === 'function') {
                try {
                    console.log('🧩 Médecin: joinConversation with conversationId =', serverConversationId);
                    signalingService.joinConversation(serverConversationId); // numérique
                } catch (_) {}
            }

            // 2) Obtenir le flux média local
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideoEnabled,
                audio: isAudioEnabled
            });
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // 3) Créer la connexion peer
            createPeerConnection(stream);

            // 4) Générer et envoyer l'offre SDP avec un sessionId valide
            if (peerConnectionRef.current) {
                const offer = await peerConnectionRef.current.createOffer();
                await peerConnectionRef.current.setLocalDescription(offer);
                signalingService.emit('webrtc_offer', {
                    sessionId: createdSessionId || sessionId, // préférer l'id créé
                    conversationId: serverConversationId,
                    sdpOffer: offer.sdp,
                    sessionType: 'audio_video'
                });
            }

            setIsInCall(true);
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
            setIsRemoteWaiting(false);
        };

        // Suivre l'état de connexion
        peerConnection.onconnectionstatechange = () => {
            setConnectionState(peerConnection.connectionState);
            if (peerConnection.connectionState === 'connected') {
                setIsRemoteWaiting(false);
            }
            if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
                setIsRemoteWaiting(true);
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
        // Rejoindre la salle conversation si fournie
        const convId = data.conversationId || data.session?.conversation_id || data.conversation_id || null;
        if (convId && typeof signalingService.joinConversation === 'function') {
            try {
                console.log('🧩 Join via session_created, conversationId =', convId);
                signalingService.joinConversation(convId); // numérique
                setIsRemoteWaiting(false);
            } catch (e) {}
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
            // Optionnel: enlever l’état “en attente” une fois l'answer appliquée
            setIsRemoteWaiting(false);
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

            <div className="webrtc-videos" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 20px' }}>
                <div className="local-video" style={{ background: '#111827', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: '100%', height: 360, objectFit: 'cover', transform: 'scaleX(-1)' }}
                    />
                    <span style={{ position: 'absolute', left: 8, bottom: 8, color: '#fff', fontSize: 12, background: 'rgba(0,0,0,0.35)', padding: '2px 6px', borderRadius: 4 }}>Vous</span>
                </div>
                <div className="remote-video" style={{ background: '#111827', borderRadius: 8, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: 360, objectFit: 'cover' }}
                    />
                    {isRemoteWaiting && (
                        <div style={{ position: 'absolute', color: '#d1d5db', fontSize: 14 }}>
                            {connectionState === 'failed' || connectionState === 'disconnected' ? 'Connexion perdue. Tentative de reconnexion…' : 'En attente du participant…'}
                        </div>
                    )}
                    <span style={{ position: 'absolute', left: 8, bottom: 8, color: '#fff', fontSize: 12, background: 'rgba(0,0,0,0.35)', padding: '2px 6px', borderRadius: 4 }}>Interlocuteur</span>
                </div>
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
