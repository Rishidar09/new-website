import React, { useState, useEffect, useRef } from 'react';
import { Phone, X, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

const CallModal = ({
    isOpen,
    onClose,
    type,
    remoteUser,
    isIncoming,
    onAccept,
    socket,
    currentUser
}) => {
    const [callStarted, setCallStarted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(type === 'voice');
    const [error, setError] = useState(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const localStream = useRef(null);

    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    useEffect(() => {
        if (isOpen && !isIncoming) {
            startCall();
        }

        if (isOpen && isIncoming) {
            // Wait for user to click "Accept"
        }

        return () => {
            endCallInternal();
        };
    }, [isOpen]);

    useEffect(() => {
        if (socket.current) {
            socket.current.on('call_answered', handleCallAnswered);
            socket.current.on('ice_candidate', handleIceCandidate);
            socket.current.on('call_ended', () => {
                onClose();
            });

            return () => {
                socket.current.off('call_answered');
                socket.current.off('ice_candidate');
                socket.current.off('call_ended');
            };
        }
    }, [socket]);

    const startCall = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Your browser does not support media access or you are not in a secure context (HTTPS or localhost).');
            }

            localStream.current = await navigator.mediaDevices.getUserMedia({
                video: type === 'video',
                audio: true
            });

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream.current;
            }

            peerConnection.current = new RTCPeerConnection(configuration);

            localStream.current.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, localStream.current);
            });

            peerConnection.current.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.current.emit('ice_candidate', {
                        to: remoteUser.id,
                        from: currentUser.employee_uuid || currentUser.id,
                        candidate: event.candidate
                    });
                }
            };

            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);

            socket.current.emit('call_user', {
                to: remoteUser.id,
                from: currentUser.employee_uuid || currentUser.id,
                caller_name: currentUser.full_name || 'Someone',
                offer: offer,
                type: type
            });

            setCallStarted(true);
        } catch (err) {
            console.error('Failed to start call:', err);
            setError(err.message);
        }
    };

    const handleAccept = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Your browser does not support media access or you are not in a secure context (HTTPS or localhost).');
            }

            localStream.current = await navigator.mediaDevices.getUserMedia({
                video: type === 'video',
                audio: true
            });

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream.current;
            }

            peerConnection.current = new RTCPeerConnection(configuration);

            localStream.current.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, localStream.current);
            });

            peerConnection.current.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.current.emit('ice_candidate', {
                        to: remoteUser.id,
                        from: currentUser.employee_uuid || currentUser.id,
                        candidate: event.candidate
                    });
                }
            };

            // Process the offer from the incoming call
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(onAccept.offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            socket.current.emit('answer_call', {
                to: remoteUser.id,
                from: currentUser.employee_uuid || currentUser.id,
                answer: answer
            });

            setCallStarted(true);
        } catch (err) {
            console.error('Failed to accept call:', err);
            setError(err.message);
        }
    };

    const handleCallAnswered = async (data) => {
        try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
            console.error('Error setting remote description:', err);
        }
    };

    const handleIceCandidate = async (data) => {
        try {
            if (data.candidate && peerConnection.current) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        } catch (err) {
            console.error('Error adding ice candidate:', err);
        }
    };

    const endCallInternal = () => {
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
        }
        if (peerConnection.current) {
            peerConnection.current.close();
        }
        socket.current.emit('hangup', { to: remoteUser.id });
    };

    const toggleMute = () => {
        if (localStream.current) {
            localStream.current.getAudioTracks()[0].enabled = isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream.current && type === 'video') {
            localStream.current.getVideoTracks()[0].enabled = isVideoOff;
            setIsVideoOff(!isVideoOff);
        }
    };

    if (!isOpen) return null;

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
                    {!callStarted && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '20px', textAlign: 'center' }}>
                            {error ? (
                                <>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                        <X size={40} />
                                    </div>
                                    <h3 style={{ color: '#EF4444', marginBottom: '10px' }}>Call Error</h3>
                                    <p style={{ maxWidth: '400px', fontSize: '14px', lineHeight: '1.6', opacity: 0.9 }}>{error}</p>
                                    <button
                                        onClick={onClose}
                                        style={{ marginTop: '20px', padding: '10px 24px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer' }}
                                    >
                                        Close
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '32px', fontWeight: 'bold' }}>
                                        {remoteUser.name.charAt(0)}
                                    </div>
                                    <h3>{isIncoming ? `Call from ${remoteUser.name}` : `Calling ${remoteUser.name}...`}</h3>
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
                    {isIncoming && !callStarted ? (
                        <>
                            <button
                                onClick={handleAccept}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: '#10B981',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Phone size={28} />
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: '#EF4444',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <PhoneOff size={28} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={toggleMute}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: isMuted ? '#EF4444' : 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>

                            {type === 'video' && (
                                <button
                                    onClick={toggleVideo}
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        background: isVideoOff ? '#EF4444' : 'rgba(255,255,255,0.2)',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                                </button>
                            )}

                            <button
                                onClick={onClose}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: '#EF4444',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
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
