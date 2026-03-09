import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import CallModal from '../components/Chat/CallModal';
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
    Hash,
    Megaphone,
    X,
    Plus,
    Bell,
    BellOff,
    Trash2
} from 'lucide-react';

const SOCKET_URL = window.location.origin;

const CreateGroupModal = ({ isOpen, onClose, contacts, onSuccess, initialMembers = [] }) => {
    const [name, setName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState(initialMembers);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedMembers(initialMembers);
            setName('');
        }
    }, [isOpen, initialMembers]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedMembers.length === 0) return alert('Select at least one member');
        try {
            setLoading(true);
            await api.post('/chat/create-group', { name, memberIds: selectedMembers });
            onSuccess();
            onClose();
            setName('');
            setSelectedMembers([]);
        } catch (error) {
            console.error('Failed to create group', error);
            alert(error.response?.data?.error || 'Failed to create group. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = (id) => {
        setSelectedMembers(prev =>
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        );
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', background: 'var(--main-bg)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Create New Group</h3>
                    <X size={20} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Group Name</label>
                        <input
                            type="text"
                            className="input-field"
                            style={{ width: '100%' }}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Project Alpha Team"
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Select Members</label>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}>
                            {contacts.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => toggleMember(c.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '8px',
                                        cursor: 'pointer',
                                        background: selectedMembers.includes(c.id) ? 'var(--primary-light)' : 'transparent',
                                        borderRadius: '6px',
                                        marginBottom: '4px'
                                    }}
                                >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                        {c.full_name.charAt(0)}
                                    </div>
                                    <p style={{ fontSize: '13px', fontWeight: '600', flex: 1 }}>{c.full_name}</p>
                                    <div style={{ width: '16px', height: '16px', border: '1px solid var(--border)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {selectedMembers.includes(c.id) && <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '2px' }}></div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="btn-primary"
                        style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
                    >
                        {loading ? <Loader2 className="spin" size={18} /> : 'Create Group'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const AddMembersModal = ({ isOpen, onClose, contacts, groupId, onSuccess }) => {
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedMembers.length === 0) return alert('Select at least one member');
        try {
            setLoading(true);
            await api.post('/chat/add-members', { groupId, memberIds: selectedMembers });
            onSuccess();
            onClose();
            setSelectedMembers([]);
        } catch (error) {
            console.error('Failed to add members', error);
            alert(error.response?.data?.error || 'Failed to add members. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = (id) => {
        setSelectedMembers(prev =>
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        );
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', background: 'var(--main-bg)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Add Members</h3>
                    <X size={20} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Select Members to Add</label>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}>
                            {contacts.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => toggleMember(c.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '8px',
                                        cursor: 'pointer',
                                        background: selectedMembers.includes(c.id) ? 'var(--primary-light)' : 'transparent',
                                        borderRadius: '6px',
                                        marginBottom: '4px'
                                    }}
                                >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                        {c.full_name.charAt(0)}
                                    </div>
                                    <p style={{ fontSize: '13px', fontWeight: '600', flex: 1 }}>{c.full_name}</p>
                                    <div style={{ width: '16px', height: '16px', border: '1px solid var(--border)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {selectedMembers.includes(c.id) && <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '2px' }}></div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || selectedMembers.length === 0}
                        className="btn-primary"
                        style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
                    >
                        {loading ? <Loader2 className="spin" size={18} /> : 'Add Members'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const AnnouncementsModal = ({ isOpen, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.post('/announcements', { title, content });
            onSuccess();
            onClose();
            setTitle('');
            setContent('');
        } catch (error) {
            console.error('Failed to post announcement', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', background: 'var(--main-bg)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px' }}>Create Announcement</h3>
                    <X size={20} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Title</label>
                        <input
                            type="text"
                            className="input-field"
                            style={{ width: '100%' }}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Content</label>
                        <textarea
                            className="input-field"
                            style={{ width: '100%', minHeight: '120px', resize: 'none' }}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Post Announcement'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const ChatPage = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // { id, type, name, role }
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Direct chat features
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [mutedChats, setMutedChats] = useState({});
    const [initialGroupMembers, setInitialGroupMembers] = useState([]);

    const handleClearChat = async () => {
        if (!window.confirm(`Are you sure you want to clear the chat history with ${activeChat.name}?`)) return;
        try {
            await api.delete(`/chat/history/${activeChat.id}`);
            setMessages([]);
            setIsMoreMenuOpen(false);
        } catch (error) {
            console.error('Failed to clear chat', error);
            alert('Failed to clear chat');
        }
    };

    const toggleMute = () => {
        setMutedChats(prev => ({ ...prev, [activeChat.id]: !prev[activeChat.id] }));
        setIsMoreMenuOpen(false);
    };

    // Calling State
    const [callConfig, setCallConfig] = useState(null); // { type, remoteUser, isIncoming, offer }

    const socket = useRef(null);
    const messageContainerRef = useRef(null);
    const fileInputRef = useRef(null);

    const commonEmojis = ['😊', '😂', '❤️', '👍', '🔥', '🎉', '🙌', '👀', '✨', '✅', '🚀', '⭐'];

    useEffect(() => {
        if (!currentUser) return;

        // Initialize socket with explicit options to respect HTTPS proxy
        socket.current = io({
            path: '/socket.io',
            transports: ['polling', 'websocket'],
            secure: true
        });

        socket.current.on('connect', () => {
            console.log('Successfully connected to socket server via proxy');
            const myId = currentUser.employee_uuid || currentUser.id;
            if (myId) {
                console.log('Identifying as:', myId);
                socket.current.emit('identify', myId);
            }
        });

        socket.current.on('receive_message', (message) => {
            console.log('New message received:', message);
            setMessages(prev => [...prev, message]);
        });

        socket.current.on('incoming_call', (data) => {
            console.log('Incoming call event received:', data);
            setCallConfig({
                type: data.type,
                remoteUser: { id: data.from, name: data.caller_name },
                isIncoming: true,
                offer: data.offer
            });
        });

        socket.current.on('user_online', (userId) => {
            console.log('User online:', userId);
            setContacts(prev => prev.map(c =>
                c.id === userId ? { ...c, isOnline: true } : c
            ));
        });

        socket.current.on('user_offline', (userId) => {
            console.log('User offline:', userId);
            setContacts(prev => prev.map(c =>
                c.id === userId ? { ...c, isOnline: false } : c
            ));
        });

        fetchInitialData();

        return () => {
            if (socket.current) socket.current.disconnect();
        };
    }, [currentUser]);

    useEffect(() => {
        if (activeChat && currentUser) {
            fetchHistory();
            // Join room
            const myEmployeeId = currentUser?.employee_uuid || currentUser?.id;
            const roomId = activeChat.type === 'group'
                ? `group_${activeChat.id}`
                : [myEmployeeId, activeChat.id].sort().join('_');

            console.log('Joining room:', roomId);
            socket.current.emit('join_room', roomId);
        }
    }, [activeChat, currentUser]);

    useEffect(() => {
        console.log('Current Groups state:', groups);
    }, [groups]);

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTo({
                top: messageContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
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

    const handleSendMessage = async (e, attachmentUrl = null) => {
        if (e) e.preventDefault();
        if (!attachmentUrl && !newMessage.trim()) return;
        if (!activeChat) return;

        try {
            const payload = {
                content: attachmentUrl ? (attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'Sent an image' : 'Sent a file') : newMessage,
                [activeChat.type === 'group' ? 'group_id' : 'receiver_id']: activeChat.id,
                attachment_url: attachmentUrl
            };

            await api.post('/chat/message', payload);
            if (!attachmentUrl) setNewMessage('');
        } catch (error) {
            console.error('Send error:', error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post('/chat/upload', formData);
            if (res.url) {
                await handleSendMessage(null, res.url);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const addEmoji = (emoji) => {
        setNewMessage(prev => prev + emoji);
        setIsEmojiPickerOpen(false);
    };

    const handleCreateCall = async (type) => {
        if (!activeChat) return;

        if (activeChat.type === 'personal') {
            setCallConfig({ type, remoteUser: { id: activeChat.id, name: activeChat.name }, isIncoming: false });
        } else {
            // Group Call Logic: Create a meeting and share the link
            try {
                const meetingData = {
                    title: `Group Call: ${activeChat.name}`,
                    agenda: 'Live group discussion',
                    date_time: new Date(),
                    duration: 60,
                    participants: [] // In a real app, you might auto-add group members
                };
                const meeting = await api.post('/meetings', meetingData);
                const joinUrl = `/meetings/${meeting.id}`;

                await api.post('/chat/message', {
                    content: `🎥 started a ${type} call. Click here to join: ${joinUrl}`,
                    group_id: activeChat.id
                });
            } catch (error) {
                console.error('Failed to start group call', error);
            }
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="chat-layout" style={{
                height: 'calc(100vh - 118px)',
                display: 'flex',
                background: 'var(--card-bg)',
                color: 'var(--text-main)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '1px solid var(--border)',
                position: 'relative'
            }}>
                {/* Left Panel */}
                <div className="chat-contacts-panel" style={{
                    width: '320px',
                    minWidth: '320px',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Messages</h2>
                            <button
                                onClick={() => setIsAnnounceModalOpen(true)}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '6px 10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                                title="Create Announcement"
                            >
                                <Megaphone size={14} />
                                Announcement
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search people..."
                                className="input-field"
                                style={{ paddingLeft: '40px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
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
                                        background: activeChat?.id === c.id ? 'var(--input-bg)' : 'transparent',
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
                        <div style={{ padding: '24px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Group Chats
                            </span>
                            <button
                                onClick={() => setIsCreateGroupModalOpen(true)}
                                style={{
                                    background: 'var(--primary-light)',
                                    color: 'var(--primary)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                                title="Create New Group"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {groups.length === 0 ? (
                            <div style={{ padding: '16px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                No groups yet. Create one above!
                            </div>
                        ) : groups.map(g => (
                            <div
                                key={g.id}
                                onClick={() => {
                                    console.log('Selecting group:', g);
                                    setActiveChat({ id: g.id, type: 'group', name: g.name });
                                }}
                                style={{
                                    padding: '12px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    background: activeChat?.id === g.id ? '#F1F5F9' : 'transparent',
                                    transition: 'all 0.2s',
                                    borderRadius: '8px',
                                    margin: '0 8px'
                                }}
                            >
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
                                    <Hash size={20} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Group channel</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel */}
                <div className={`chat-messages-panel ${activeChat ? 'active' : ''}`} style={{
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    background: 'var(--main-bg)',
                    height: '100%',
                    minWidth: 0,
                    overflow: 'hidden'
                }}>
                    {activeChat ? (
                        <>
                            {/* Header */}
                            <div style={{
                                padding: '16px 24px',
                                background: 'var(--card-bg)',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexShrink: 0
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                        className="chat-back-btn"
                                        onClick={() => setActiveChat(null)}
                                        style={{
                                            display: 'none',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-muted)',
                                            padding: '4px'
                                        }}
                                    >
                                        ←
                                    </button>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: '700' }}>
                                        {activeChat.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{activeChat.name}</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{activeChat.role || 'Active now'}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)' }}>
                                    <Phone
                                        size={20}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleCreateCall('voice')}
                                    />
                                    <Video
                                        size={20}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleCreateCall('video')}
                                    />
                                    <div style={{ position: 'relative' }}>
                                        <MoreVertical
                                            size={20}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                                        />
                                        {isMoreMenuOpen && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                right: 0,
                                                background: 'var(--card-bg)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                zIndex: 10,
                                                minWidth: '220px',
                                                marginTop: '8px'
                                            }}>
                                                {activeChat.type === 'group' ? (
                                                    <button
                                                        onClick={() => {
                                                            setIsAddMembersModalOpen(true);
                                                            setIsMoreMenuOpen(false);
                                                        }}
                                                        style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                    >
                                                        <Plus size={16} /> Add People
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button onClick={() => { setIsSearchActive(!isSearchActive); setIsMoreMenuOpen(false); }} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <Search size={16} /> Search in Chat
                                                        </button>
                                                        <button onClick={toggleMute} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {mutedChats[activeChat.id] ? <Bell size={16} /> : <BellOff size={16} />}
                                                            {mutedChats[activeChat.id] ? 'Unmute' : 'Mute'} Notifications
                                                        </button>
                                                        <button onClick={handleClearChat} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <Trash2 size={16} /> Clear Chat
                                                        </button>
                                                        <button onClick={() => { setInitialGroupMembers([activeChat.id]); setIsCreateGroupModalOpen(true); setIsMoreMenuOpen(false); }} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <Plus size={16} /> Create Group with {activeChat.name.split(' ')[0]}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Search Bar */}
                            {isSearchActive && (
                                <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', background: 'var(--main-bg)' }}>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            placeholder="Search messages..."
                                            value={chatSearchQuery}
                                            onChange={(e) => setChatSearchQuery(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px 8px 36px',
                                                borderRadius: '20px',
                                                border: '1px solid var(--border)',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-main)',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                            autoFocus
                                        />
                                        <X size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => { setIsSearchActive(false); setChatSearchQuery(''); }} />
                                    </div>
                                </div>
                            )}

                            {/* Chat Window */}
                            <div
                                ref={messageContainerRef}
                                style={{
                                    flex: 1,
                                    padding: '24px',
                                    overflowY: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    minHeight: 0 // CRITICAL: Allows flex child to overflow and scroll
                                }}
                            >
                                {messages.filter(m => chatSearchQuery ? (m.content && m.content.toLowerCase().includes(chatSearchQuery.toLowerCase())) : true).map((m, idx) => {
                                    const trulyMe = String(m.sender_id) === String(currentUser?.employee_uuid);

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
                                                background: trulyMe ? 'var(--primary)' : 'var(--input-bg)',
                                                color: trulyMe ? 'white' : 'var(--text-main)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                                fontSize: '14px',
                                                lineHeight: '1.5'
                                            }}>
                                                {m.attachment_url ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {m.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                            <img
                                                                src={m.attachment_url}
                                                                alt="Attachment"
                                                                style={{ maxWidth: '100%', borderRadius: '8px', cursor: 'pointer' }}
                                                                onClick={() => window.open(m.attachment_url, '_blank')}
                                                            />
                                                        ) : (
                                                            <a
                                                                href={m.attachment_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    color: trulyMe ? 'white' : 'var(--primary)',
                                                                    textDecoration: 'underline',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px'
                                                                }}
                                                            >
                                                                <Paperclip size={14} /> Download File
                                                            </a>
                                                        )}
                                                        {m.content && <p>{m.content}</p>}
                                                    </div>
                                                ) : m.content && m.content.includes('/meetings/') ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <p>{m.content.split('Click here to join:')[0]}</p>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const url = m.content.split('Click here to join: ')[1];
                                                                if (url) navigate(url);
                                                            }}
                                                            style={{
                                                                background: trulyMe ? 'white' : 'var(--primary)',
                                                                color: trulyMe ? 'var(--primary)' : 'white',
                                                                border: 'none',
                                                                padding: '6px 12px',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: '700',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Join Live Call
                                                        </button>
                                                    </div>
                                                ) : m.content}
                                            </div>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}

                            </div>

                            {/* Input Bar */}
                            <div style={{ padding: '24px', background: 'var(--card-bg)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                                <form onSubmit={handleSendMessage} style={{
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'center',
                                    background: 'var(--input-bg)',
                                    padding: '8px',
                                    paddingLeft: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)'
                                }}>
                                    {/* Hidden File Input */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleFileUpload}
                                    />

                                    <Paperclip
                                        size={20}
                                        style={{ color: uploading ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer' }}
                                        onClick={() => fileInputRef.current?.click()}
                                    />

                                    <input
                                        type="text"
                                        placeholder={uploading ? "Uploading..." : "Type your message..."}
                                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '8px', fontSize: '14px' }}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        disabled={uploading}
                                    />

                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <Smile
                                            size={20}
                                            style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                                            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                                        />
                                        {isEmojiPickerOpen && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '100%',
                                                right: 0,
                                                background: 'var(--card-bg)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '12px',
                                                padding: '12px',
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(4, 1fr)',
                                                gap: '8px',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                zIndex: 100,
                                                marginBottom: '12px'
                                            }}>
                                                {commonEmojis.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => addEmoji(emoji)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            fontSize: '20px',
                                                            cursor: 'pointer',
                                                            padding: '4px',
                                                            borderRadius: '4px',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.background = 'var(--primary-light)'}
                                                        onMouseLeave={(e) => e.target.style.background = 'none'}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={uploading || (!newMessage.trim())}
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
                            <div style={{ padding: '20px', background: 'var(--input-bg)', borderRadius: '50%', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                <MessageSquare size={48} color="var(--primary)" style={{ opacity: 0.5 }} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Select a chat to start messaging</h3>
                            <p style={{ fontSize: '14px' }}>Search for contacts or select a group from the list.</p>
                        </div>
                    )}
                </div>
            </div>
            <AnnouncementsModal
                isOpen={isAnnounceModalOpen}
                onClose={() => setIsAnnounceModalOpen(false)}
                onSuccess={() => {
                    // Could add a toast here
                    console.log('Announcement posted!');
                }}
            />
            <CreateGroupModal
                isOpen={isCreateGroupModalOpen}
                onClose={() => { setIsCreateGroupModalOpen(false); setInitialGroupMembers([]); }}
                contacts={contacts}
                initialMembers={initialGroupMembers}
                onSuccess={fetchInitialData}
            />
            <AddMembersModal
                isOpen={isAddMembersModalOpen}
                onClose={() => setIsAddMembersModalOpen(false)}
                contacts={contacts}
                groupId={activeChat?.id}
                onSuccess={() => {
                    fetchInitialData();
                    fetchHistory();
                }}
            />

            {callConfig && (
                <CallModal
                    isOpen={!!callConfig}
                    onClose={() => setCallConfig(null)}
                    type={callConfig.type}
                    remoteUser={callConfig.remoteUser}
                    isIncoming={callConfig.isIncoming}
                    incomingOffer={callConfig.offer || null}
                    socket={socket}
                    currentUser={currentUser}
                />
            )}
        </>
    );
};

export default ChatPage;
