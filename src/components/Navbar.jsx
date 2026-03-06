import React, { useState, useEffect } from 'react';
import { Bell, User, Settings, LogOut, ChevronDown, CheckCircle2, AlertCircle, MessageSquare, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // Mock notifications for demonstration
    useEffect(() => {
        setNotifications([
            { id: 1, type: 'leave', text: 'Your leave request was approved', time: '2h ago', icon: <CheckCircle2 size={16} color="#10B981" /> },
            { id: 2, type: 'message', text: 'New message from Rahul Sharma', time: '1h ago', icon: <MessageSquare size={16} color="var(--primary)" /> },
            { id: 3, type: 'meeting', text: 'Upcoming: Quarterly Review in 30m', time: '30m ago', icon: <Video size={16} color="#6366F1" /> }
        ]);
    }, []);

    return (
        <div style={{
            height: '70px',
            background: 'var(--navbar-bg)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 32px',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            width: '100%'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {/* Notification Bell */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', position: 'relative' }}
                    >
                        <Bell size={22} />
                        {notifications.length > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-2px',
                                right: '-2px',
                                width: '10px',
                                height: '10px',
                                background: '#EF4444',
                                borderRadius: '50%',
                                border: '2px solid var(--navbar-bg)'
                            }}></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="card shadow-lg" style={{
                            position: 'absolute',
                            right: 0,
                            top: '40px',
                            width: '320px',
                            padding: '16px',
                            zIndex: 1000,
                            maxHeight: '400px',
                            overflowY: 'auto',
                            background: 'var(--card-bg)',
                            color: 'var(--text-main)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 style={{ fontSize: 'var(--font-lg)', fontWeight: '700', color: 'var(--text-main)' }}>Notifications</h4>
                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer' }}>Mark all as read</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {notifications.map(n => (
                                    <div key={n.id} style={{ display: 'flex', gap: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }} className="hover-bg">
                                        <div style={{ marginTop: '2px' }}>{n.icon}</div>
                                        <div>
                                            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-main)', lineHeight: '1.4' }}>{n.text}</p>
                                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{n.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Toggle */}
                <div style={{ position: 'relative' }}>
                    <div
                        onClick={() => setShowProfile(!showProfile)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}
                        className="hover-bg"
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--input-bg)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700'
                        }}>
                            {profile?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div style={{ display: 'none', md: 'block' }}>
                            <p style={{ fontSize: 'var(--font-md)', fontWeight: '700', color: 'var(--text-main)', marginBottom: '-2px' }}>{profile?.full_name}</p>
                            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>{profile?.role}</p>
                        </div>
                        <ChevronDown size={14} color="var(--text-muted)" />
                    </div>

                    {showProfile && (
                        <div className="card shadow-lg" style={{
                            position: 'absolute',
                            right: 0,
                            top: '50px',
                            width: '200px',
                            padding: '8px',
                            zIndex: 1000,
                            background: 'var(--card-bg)',
                            color: 'var(--text-main)'
                        }}>
                            <button onClick={() => navigate(profile?.role === 'hr' ? '/hr/dashboard' : '/employee/dashboard')} className="dropdown-item">
                                <User size={16} />
                                View Profile
                            </button>
                            <button
                                onClick={() => navigate(profile?.role === 'hr' ? '/hr/settings' : '/employee/settings')}
                                className="dropdown-item"
                            >
                                <Settings size={16} />
                                Settings
                            </button>
                            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }}></div>
                            <button onClick={signOut} className="dropdown-item" style={{ color: '#EF4444' }}>
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .hover-bg:hover { background: var(--input-bg); }
                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 10px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-size: var(--font-md);
                    color: var(--text-main);
                    border-radius: 6px;
                    transition: all 0.2s;
                    font-weight: 600;
                }
                .dropdown-item:hover { background: var(--input-bg); color: var(--primary); }
                .shadow-lg { box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }
            `}</style>
        </div>
    );
};

export default Navbar;
