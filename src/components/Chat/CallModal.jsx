import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, X, Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from 'lucide-react';

const CallModal = ({
    isOpen,
    onClose,
    type,
    remoteUser,
    isIncoming,
    incomingOffer,
    socket,
    currentUser
}) => {
    const [callStatus, setCallStatus] = useState(isIncoming ? 'ringing' : 'initializing');
    // Status: initializing -> requesting_media -> calling -> connected | error
    // For incoming: ringing -> accepting -> connected | error
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(type === 'voice');
    const [error, setError] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const localStream = useRef(null);
    const pendingCandidates = useRef([]);

    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            // TURN servers are REQUIRED for media relay when peers are behind NAT (e.g. ngrok)
            {
                urls: 'turn:a.relay.metered.ca:80',
                username: 'e8dd65b92f6dde70d3ce84e4',
                credential: '3RoB/YKGOaVMnqdv'
            },
            {
                urls: 'turn:a.relay.metered.ca:80?transport=tcp',
                username: 'e8dd65b92f6dde70d3ce84e4',
                credential: '3RoB/YKGOaVMnqdv'
            },
            {
                urls: 'turn:a.relay.metered.ca:443',
                username: 'e8dd65b92f6dde70d3ce84e4',
                credential: '3RoB/YKGOaVMnqdv'
            },
            {
                urls: 'turns:a.relay.metered.ca:443',
                username: 'e8dd65b92f6dde70d3ce84e4',
                credential: '3RoB/YKGOaVMnqdv'
            }
        ],
        iceCandidatePoolSize: 10
    };

    const myId = currentUser?.employee_uuid || currentUser?.id;

    // ─── Cleanup helper ──────────────────────────────────────────────
    const cleanup = useCallback(() => {
        if (localStream.current) {
            localStream.current.getTracks().forEach(t => t.stop());
            localStream.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        pendingCandidates.current = [];
    }, []);

    // ─── Create PeerConnection with all event handlers ──────────────
    const createPeerConnection = useCallback(() => {
        const pc = new RTCPeerConnection(configuration);

        pc.ontrack = (event) => {
            console.log('[Call] Remote track received:', event.track.kind, '| streams:', event.streams.length);
            if (remoteVideoRef.current && event.streams[0]) {
                // Only set srcObject if it's not already set to this stream to avoid AbortError
                if (remoteVideoRef.current.srcObject !== event.streams[0]) {
                    console.log('[Call] Setting remote srcObject');
                    remoteVideoRef.current.srcObject = event.streams[0];
                }

                // Use a small delay to ensure the browser has processed the stream
                setTimeout(() => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.play().catch(e => {
                            if (e.name !== 'AbortError') {
                                console.log('[Call] Playback issue:', e);
                            }
                        });
                    }
                }, 100);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socket?.current) {
                console.log('[Call] Sending ICE candidate');
                socket.current.emit('ice_candidate', {
                    to: remoteUser.id,
                    from: myId,
                    candidate: event.candidate
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('[Call] ICE state:', pc.iceConnectionState);
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                setCallStatus('connected');
            }
            if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                setError('Connection lost. Please try again.');
                setCallStatus('error');
            }
        };

        peerConnection.current = pc;
        return pc;
    }, [remoteUser, myId, socket]);

    // ─── Get local media stream ─────────────────────────────────────
    const getLocalStream = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('Your browser does not support media access. Make sure you are using HTTPS.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
            video: type === 'video',
            audio: true
        });
        console.log('[Call] Got local stream. Tracks:', stream.getTracks().map(t => `${t.kind}:${t.enabled}`).join(', '));
        localStream.current = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(e => console.log('[Call] Local video autoplay issue:', e));
        }
        return stream;
    };

    // ─── Outgoing call: get media → create offer → send ─────────────
    const startOutgoingCall = async () => {
        try {
            setCallStatus('requesting_media');
            console.log('[Call] Requesting media...');
            const stream = await getLocalStream();

            console.log('[Call] Creating peer connection...');
            const pc = createPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            console.log('[Call] Creating offer...');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            console.log('[Call] Sending call_user event to:', remoteUser.id);
            socket.current.emit('call_user', {
                to: remoteUser.id,
                from: myId,
                caller_name: currentUser.full_name || 'Someone',
                offer: offer,
                type: type
            });

            setCallStatus('calling');
        } catch (err) {
            console.error('[Call] Failed to start call:', err);
            setError(err.message);
            setCallStatus('error');
        }
    };

    // ─── Incoming call: accept → get media → answer ─────────────────
    const handleAccept = async () => {
        try {
            setCallStatus('accepting');
            console.log('[Call] Accepting call, requesting media...');
            const stream = await getLocalStream();

            console.log('[Call] Creating peer connection for answer...');
            const pc = createPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            console.log('[Call] Setting remote description from offer...');
            await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));

            // Process any ICE candidates that arrived before we were ready
            for (const candidate of pendingCandidates.current) {
                console.log('[Call] Adding buffered ICE candidate');
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidates.current = [];

            console.log('[Call] Creating answer...');
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            console.log('[Call] Sending answer_call event to:', remoteUser.id);
            socket.current.emit('answer_call', {
                to: remoteUser.id,
                from: myId,
                answer: answer
            });

            setCallStatus('connected');
        } catch (err) {
            console.error('[Call] Failed to accept call:', err);
            setError(err.message);
            setCallStatus('error');
        }
    };

    // ─── Socket event handlers ──────────────────────────────────────
    const handleCallAnswered = useCallback(async (data) => {
        try {
            console.log('[Call] call_answered received');
            if (peerConnection.current) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                setCallStatus('connected');
            }
        } catch (err) {
            console.error('[Call] Error setting remote description:', err);
        }
    }, []);

    const handleIceCandidate = useCallback(async (data) => {
        try {
            if (peerConnection.current && peerConnection.current.remoteDescription) {
                console.log('[Call] Adding ICE candidate');
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            } else {
                // Buffer candidates until remote description is set
                console.log('[Call] Buffering ICE candidate (peer not ready)');
                pendingCandidates.current.push(data.candidate);
            }
        } catch (err) {
            console.error('[Call] Error adding ICE candidate:', err);
        }
    }, []);

    const handleCallEnded = useCallback(() => {
        console.log('[Call] Remote hangup received');
        cleanup();
        onClose();
    }, [cleanup, onClose]);

    // ─── Wire up socket listeners ───────────────────────────────────
    useEffect(() => {
        if (!socket?.current || !isOpen) return;

        socket.current.on('call_answered', handleCallAnswered);
        socket.current.on('ice_candidate', handleIceCandidate);
        socket.current.on('call_ended', handleCallEnded);

        return () => {
            socket.current.off('call_answered', handleCallAnswered);
            socket.current.off('ice_candidate', handleIceCandidate);
            socket.current.off('call_ended', handleCallEnded);
        };
    }, [isOpen, socket, handleCallAnswered, handleIceCandidate, handleCallEnded]);

    // ─── Auto-start outgoing calls ──────────────────────────────────
    useEffect(() => {
        if (isOpen && !isIncoming) {
            startOutgoingCall();
        }

        return () => {
            cleanup();
        };
    }, [isOpen]);

    // ─── End call button handler ────────────────────────────────────
    const handleHangup = () => {
        if (socket?.current) {
            socket.current.emit('hangup', { to: remoteUser.id });
        }
        cleanup();
        onClose();
    };

    // ─── Media controls ─────────────────────────────────────────────
    const toggleMute = () => {
        if (localStream.current) {
            const audioTrack = localStream.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = isMuted; // toggle: if muted, enable; if not, disable
                setIsMuted(!isMuted);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream.current && type === 'video') {
            const videoTrack = localStream.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = isVideoOff;
                setIsVideoOff(!isVideoOff);
            }
        }
    };

    // ─── Render ─────────────────────────────────────────────────────
    if (!isOpen) return null;

    const getStatusText = () => {
        switch (callStatus) {
            case 'initializing': return 'Initializing...';
            case 'requesting_media': return 'Requesting Camera/Microphone...';
            case 'calling': return `Calling ${remoteUser.name}...`;
            case 'ringing': return `Incoming call from ${remoteUser.name}`;
            case 'accepting': return 'Connecting...';
            case 'connected': return 'Connected';
            case 'error': return 'Call Failed';
            default: return '';
        }
    };

    const isCallActive = callStatus === 'connected';
    const isRinging = callStatus === 'ringing';

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(10px)'
        }}>
            <div style={{
                width: '90%',
                maxWidth: '800px',
                aspectRatio: '16/9',
                background: '#111',
                borderRadius: '24px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Remote Video (Large) */}
                <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {!isCallActive && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '20px', textAlign: 'center' }}>
                            {error ? (
                                <>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                        <X size={40} />
                                    </div>
                                    <h3 style={{ color: '#EF4444', marginBottom: '10px' }}>Call Error</h3>
                                    <p style={{ maxWidth: '400px', fontSize: '14px', lineHeight: '1.6', opacity: 0.9 }}>{error}</p>
                                    <button
                                        onClick={handleHangup}
                                        style={{ marginTop: '20px', padding: '10px 24px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer' }}
                                    >
                                        Close
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '32px', fontWeight: 'bold' }}>
                                        {remoteUser.name?.charAt(0) || '?'}
                                    </div>
                                    <h3>{getStatusText()}</h3>
                                    {(callStatus === 'requesting_media' || callStatus === 'accepting') && (
                                        <p style={{ marginTop: '10px', opacity: 0.7, fontSize: '14px' }}>
                                            <Loader2 style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} className="animate-spin" size={16} />
                                            {callStatus === 'requesting_media' ? 'Please allow camera/microphone access...' : 'Setting up connection...'}
                                        </p>
                                    )}
                                    {callStatus === 'calling' && (
                                        <p style={{ marginTop: '10px', opacity: 0.5, fontSize: '13px' }}>Waiting for answer...</p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Local Video (Small Overlay) */}
                {type === 'video' && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        width: '180px',
                        height: '110px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '2px solid rgba(255,255,255,0.2)',
                        background: '#222'
                    }}>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                        />
                    </div>
                )}

                {/* Controls */}
                <div style={{
                    padding: '30px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    position: 'absolute',
                    bottom: 0,
                    width: '100%'
                }}>
                    {isRinging ? (
                        /* Incoming call: Accept / Reject buttons */
                        <>
                            <button
                                onClick={handleAccept}
                                style={{
                                    width: '60px', height: '60px', borderRadius: '50%',
                                    background: '#10B981', border: 'none', color: 'white',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <Phone size={28} />
                            </button>
                            <button
                                onClick={handleHangup}
                                style={{
                                    width: '60px', height: '60px', borderRadius: '50%',
                                    background: '#EF4444', border: 'none', color: 'white',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <PhoneOff size={28} />
                            </button>
                        </>
                    ) : (
                        /* Active/outgoing call controls */
                        <>
                            <button
                                onClick={toggleMute}
                                style={{
                                    width: '50px', height: '50px', borderRadius: '50%',
                                    background: isMuted ? '#EF4444' : 'rgba(255,255,255,0.2)',
                                    border: 'none', color: 'white', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>

                            {type === 'video' && (
                                <button
                                    onClick={toggleVideo}
                                    style={{
                                        width: '50px', height: '50px', borderRadius: '50%',
                                        background: isVideoOff ? '#EF4444' : 'rgba(255,255,255,0.2)',
                                        border: 'none', color: 'white', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                                </button>
                            )}

                            <button
                                onClick={handleHangup}
                                style={{
                                    width: '50px', height: '50px', borderRadius: '50%',
                                    background: '#EF4444', border: 'none', color: 'white',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginLeft: '20px'
                                }}
                            >
                                <PhoneOff size={20} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallModal;
