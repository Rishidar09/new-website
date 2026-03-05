import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { io } from 'socket.io-client';
import {
    Search,
    Send,
    Paperclip,
    Smile,
    Users,
    User,
    MoreVertical,
    Circle,
    Loader2,
    MessageSquare,
    Phone,
    Video,
    Hash
} from 'lucide-react';

const SOCKET_URL = 'http://localhost:5001';

const ChatPage = () => {
    const [contacts, setContacts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // { id, type, name, role }
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const socket = useRef(null);
    const scrollRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);

        // Initialize socket
        socket.current = io(SOCKET_URL);

        socket.current.on('receive_message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        fetchInitialData();

        return () => {
            if (socket.current) socket.current.disconnect();
        };
    }, []);

    useEffect(() => {
        if (activeChat) {
            fetchHistory();
            // Join room
            const myId = JSON.parse(localStorage.getItem('user'))?.id;
            const roomId = activeChat.type === 'group'
                ? activeChat.id
                : [myId, activeChat.id].sort().join('_');

            socket.current.emit('join_room', roomId);
        }
    }, [activeChat]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [contactsData, groupsData] = await Promise.all([
                api.get('/chat/contacts'),
                api.get('/chat/groups')
            ]);
            setContacts(contactsData || []);
            setGroups(groupsData || []);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const data = await api.get(`/chat/history/${activeChat.id}?type=${activeChat.type}`);
            setMessages(data || []);
        } catch (error) {
            console.error('History error:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        try {
            const payload = {
                content: newMessage,
                [activeChat.type === 'group' ? 'group_id' : 'receiver_id']: activeChat.id
            };

            await api.post('/chat/message', payload);
            setNewMessage('');
        } catch (error) {
            console.error('Send error:', error);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div style={{
                height: 'calc(100vh - 140px)',
                display: 'grid',
                gridTemplateColumns: '320px 1fr',
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '1px solid var(--border)'
            }}>
                {/* Left Panel */}
                <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Messages</h2>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search people..."
                                className="input-field"
                                style={{ paddingLeft: '40px', background: '#F8FAFC' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {/* Direct Messages */}
                        <div style={{ padding: '16px 24px 8px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Direct Messages
                        </div>
                        {loading ? <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="animate-spin" /></div> :
                            filteredContacts.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setActiveChat({ id: c.id, type: 'personal', name: c.full_name, role: c.role })}
                                    style={{
                                        padding: '12px 24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        background: activeChat?.id === c.id ? '#F1F5F9' : 'transparent',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: '700' }}>
                                            {c.full_name.charAt(0)}
                                        </div>
                                        {c.isOnline && <div style={{ position: 'absolute', right: 2, bottom: 2, width: '10px', height: '10px', background: '#10B981', borderRadius: '50%', border: '2px solid white' }}></div>}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                            <p style={{ fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.full_name}</p>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.last_time ? new Date(c.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {c.last_msg || c.role}
                                        </p>
                                    </div>
                                </div>
                            ))}

                        {/* Groups */}
                        <div style={{ padding: '24px 24px 8px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Group Chats
                        </div>
                        {groups.map(g => (
                            <div
                                key={g.id}
                                onClick={() => setActiveChat({ id: g.id, type: 'group', name: g.name })}
                                style={{
                                    padding: '12px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    background: activeChat?.id === g.id ? '#F1F5F9' : 'transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
                                    <Hash size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: '700', fontSize: '14px' }}>{g.name}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Group channel</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
                    {activeChat ? (
                        <>
                            {/* Header */}
                            <div style={{ padding: '16px 24px', background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: '700' }}>
                                        {activeChat.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{activeChat.name}</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{activeChat.role || 'Active now'}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)' }}>
                                    <Phone size={20} style={{ cursor: 'pointer' }} />
                                    <Video size={20} style={{ cursor: 'pointer' }} />
                                    <MoreVertical size={20} style={{ cursor: 'pointer' }} />
                                </div>
                            </div>

                            {/* Chat Window */}
                            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {messages.map((m, idx) => {
                                    const isMe = String(m.sender_id) === String(currentUser?.full_name === m.sender_name ? m.sender_id : (currentUser?.email === m.sender_id || (m.sender_name === currentUser?.full_name))); // Simplified check
                                    const isReceiverMe = m.receiver_id ? String(m.receiver_id) === String(currentUser?.id) : false;
                                    const trulyMe = m.sender_name === currentUser?.full_name || m.sender_id === currentUser?.id;

                                    return (
                                        <div key={idx} style={{
                                            maxWidth: '70%',
                                            alignSelf: trulyMe ? 'flex-end' : 'flex-start',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: trulyMe ? 'flex-end' : 'flex-start'
                                        }}>
                                            {!trulyMe && activeChat.type === 'group' && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', marginLeft: '4px' }}>{m.sender_name}</span>}
                                            <div style={{
                                                padding: '12px 16px',
                                                borderRadius: '16px',
                                                borderBottomRightRadius: trulyMe ? '2px' : '16px',
                                                borderBottomLeftRadius: trulyMe ? '16px' : '2px',
                                                background: trulyMe ? 'var(--primary)' : 'white',
                                                color: trulyMe ? 'white' : 'var(--text-main)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                                fontSize: '14px',
                                                lineHeight: '1.5'
                                            }}>
                                                {m.content}
                                            </div>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>

                            {/* Input Bar */}
                            <div style={{ padding: '24px', background: 'white', borderTop: '1px solid var(--border)' }}>
                                <form onSubmit={handleSendMessage} style={{
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'center',
                                    background: '#F8FAFC',
                                    padding: '8px',
                                    paddingLeft: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)'
                                }}>
                                    <Paperclip size={20} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                                    <input
                                        type="text"
                                        placeholder="Type your message..."
                                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '8px', fontSize: '14px' }}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <Smile size={20} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                                    <button
                                        type="submit"
                                        style={{
                                            background: 'var(--primary)',
                                            color: 'white',
                                            border: 'none',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <div style={{ padding: '20px', background: 'white', borderRadius: '50%', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                <MessageSquare size={48} color="var(--primary)" style={{ opacity: 0.5 }} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Select a chat to start messaging</h3>
                            <p style={{ fontSize: '14px' }}>Search for contacts or select a group from the list.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ChatPage;
