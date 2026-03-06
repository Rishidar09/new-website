import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { io } from 'socket.io-client';
import {
    Mic,
    MicOff,
    Camera,
    VideoOff,
    Monitor,
    Disc,
    PhoneOff,
    Users,
    MessageSquare,
    MoreHorizontal,
    Maximize,
    Loader2,
    Shield,
    X,
    Send
} from 'lucide-react';

const SOCKET_URL = window.location.origin;

const MeetingRoomPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [sidebarTab, setSidebarTab] = useState('participants'); // 'participants' or 'chat'
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socket = useRef(null);
    const chatEndRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);
        fetchMeetingDetails();

        socket.current = io(SOCKET_URL);
        socket.current.emit('join_room', `meeting_${id}`);

        socket.current.on('receive_meeting_chat', (msg) => {
            setChatMessages(prev => [...prev, msg]);
        });

        // Add some dummy chat history for atmosphere
        setChatMessages([
            { sender: 'System', content: 'You joined the meeting room.', time: new Date() },
        ]);

        return () => {
            if (socket.current) socket.current.disconnect();
        };
    }, [id]);

    const fetchMeetingDetails = async () => {
        try {
            const data = await api.get(`/meetings/${id}`);
            setMeeting(data);
        } catch (error) {
            console.error('Error fetching meeting:', error);
            navigate('/meetings');
        } finally {
            setLoading(false);
        }
    };

    const handleSendChat = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msg = {
            sender: currentUser?.full_name || 'Me',
            content: newMessage,
            time: new Date()
        };
        socket.current.emit('send_meeting_chat', { roomId: `meeting_${id}`, ...msg });
        setChatMessages(prev => [...prev, msg]);
        setNewMessage('');
    };

    if (loading) return <>
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={40} className="animate-spin" color="var(--primary)" />
        </div>
    </>;

    return (
        <>
            <div style={{ height: 'calc(100vh - 140px)', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
                {/* Main Meeting Stage */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Video Grid */}
                    <div style={{ flex: 1, background: '#0F172A', borderRadius: '16px', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', position: 'relative' }}>

                        {/* Self Tile (Mock) */}
                        <div style={{
                            background: '#1E293B',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative',
                            aspectRatio: '16/9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid var(--primary)'
                        }}>
                            {isCamOff ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', margin: '0 auto 12px' }}>
                                        {currentUser?.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <p style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Camera is Off</p>
                                </div>
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #1e293b, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Camera size={48} color="#475569" style={{ opacity: 0.5 }} />
                                    <p style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {isMuted ? <MicOff size={12} color="#EF4444" /> : <Mic size={12} />}
                                        You (Presenter)
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Remote Participants (Mock Tiles) */}
                        {meeting?.participants?.slice(0, 3).map((p, idx) => (
                            <div key={idx} style={{
                                background: '#1E293B',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                position: 'relative',
                                aspectRatio: '16/9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#475569', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                                        {p.full_name.charAt(0)}
                                    </div>
                                    <p style={{ color: '#94A3B8', fontSize: '13px' }}>{p.full_name}</p>
                                </div>
                                <p style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Mic size={12} />
                                    {p.full_name} ({p.role})
                                </p>
                            </div>
                        ))}

                        {/* No participants overlay */}
                        {(!meeting.participants || meeting.participants.length === 0) && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#64748B' }}>
                                <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p>Waiting for participants to join...</p>
                            </div>
                        )}
                    </div>

                    {/* Toolbar */}
                    <div style={{ background: '#1E293B', padding: '16px 32px', borderRadius: '16px', display: 'flex', justifyContent: 'center', gap: '16px', color: 'white' }}>
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            style={{ width: '48px', height: '48px', borderRadius: '12px', border: 'none', background: isMuted ? '#EF4444' : '#334155', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                        </button>
                        <button
                            onClick={() => setIsCamOff(!isCamOff)}
                            style={{ width: '48px', height: '48px', borderRadius: '12px', border: 'none', background: isCamOff ? '#EF4444' : '#334155', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {isCamOff ? <VideoOff size={22} /> : <Camera size={22} />}
                        </button>
                        <button
                            onClick={() => setIsSharing(!isSharing)}
                            style={{ width: '48px', height: '48px', borderRadius: '12px', border: 'none', background: isSharing ? 'var(--primary)' : '#334155', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Monitor size={22} />
                        </button>
                        <button
                            onClick={() => setIsRecording(!isRecording)}
                            style={{ width: '48px', height: '48px', borderRadius: '12px', border: 'none', background: isRecording ? '#EF4444' : '#334155', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Disc size={22} className={isRecording ? 'animate-pulse' : ''} />
                        </button>
                        <div style={{ width: '1px', background: '#475569', margin: '0 8px' }}></div>
                        <button
                            onClick={() => { if (window.confirm('Are you sure you want to end this call?')) navigate('/meetings'); }}
                            style={{ padding: '0 24px', height: '48px', borderRadius: '12px', border: 'none', background: '#EF4444', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}
                        >
                            <PhoneOff size={22} />
                            End Call
                        </button>
                    </div>
                </div>

                {/* Sidebar (List/Chat) */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0' }}>
                    <div style={{ display: 'flex', background: '#F8FAFC', padding: '4px' }}>
                        <button
                            onClick={() => setSidebarTab('participants')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: 'none',
                                background: sidebarTab === 'participants' ? 'white' : 'transparent',
                                color: sidebarTab === 'participants' ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: '700',
                                fontSize: '13px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <Users size={16} />
                            People ({meeting?.participants?.length || 0})
                        </button>
                        <button
                            onClick={() => setSidebarTab('chat')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: 'none',
                                background: sidebarTab === 'chat' ? 'white' : 'transparent',
                                color: sidebarTab === 'chat' ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: '700',
                                fontSize: '13px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <MessageSquare size={16} />
                            Live Chat
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {sidebarTab === 'participants' ? (
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '8px', background: '#EEF2FF' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px' }}>
                                        {currentUser?.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: '800' }}>{currentUser?.full_name} (You)</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Organizer</p>
                                    </div>
                                </div>

                                {meeting?.participants?.map((p, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px' }}>
                                            {p.full_name.charAt(0)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '13px', fontWeight: '700' }}>{p.full_name}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.role}</p>
                                        </div>
                                        <Mic size={14} color="#94A3B8" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                                    {chatMessages.map((m, idx) => (
                                        <div key={idx} style={{ background: '#F1F5F9', padding: '10px', borderRadius: '8px', maxWidth: '90%' }}>
                                            <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', marginBottom: '4px' }}>{m.sender}</p>
                                            <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.4' }}>{m.content}</p>
                                            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                                                {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>
                                <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                                    <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Say something..."
                                            style={{ fontSize: '13px', borderRadius: '8px' }}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                        <button type="submit" style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </>
    );
};

export default MeetingRoomPage;
