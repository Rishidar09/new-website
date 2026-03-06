import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    CalendarCheck,
    Send,
    FileText,
    Briefcase,
    Files,
    MessageSquare,
    HardDrive,
    CreditCard,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EmployeeSidebar = ({ isOpen, toggleSidebar, isMobile }) => {
    const { signOut } = useAuth();
    const location = useLocation();

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'My Dashboard', path: '/employee/dashboard' },
        { icon: <CalendarCheck size={20} />, label: 'My Attendance', path: '/employee/attendance' },
        { icon: <Send size={20} />, label: 'Apply Leave', path: '/employee/apply-leave' },
        { icon: <FileText size={20} />, label: 'My Payslips', path: '/employee/payslips' },
        { icon: <Briefcase size={20} />, label: 'My Projects', path: '/employee/projects' },
        { icon: <Files size={20} />, label: 'My Documents', path: '/employee/documents' },
        { icon: <MessageSquare size={20} />, label: 'Complaint Box', path: '/employee/complaints' },
        { icon: <MessageSquare size={20} />, label: 'Chat', path: '/chat' },
        { icon: <HardDrive size={20} />, label: 'Drive', path: '/drive' },
        { icon: <CreditCard size={20} />, label: 'My ID Card', path: '/employee/id-card' },
    ];

    return (
        <div className={`sidebar-fixed ${isOpen ? 'sidebar-open' : ''}`} style={{
            width: '260px',
            height: '100vh',
            background: 'var(--sidebar-bg)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 0',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 100,
            transition: 'transform 0.3s ease-in-out'
        }}>
            {/* Logo */}
            <Link to="/employee/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '0 24px' }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    background: 'var(--primary)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                }}>
                    <LayoutDashboard size={24} />
                </div>
                <span style={{ fontSize: 'var(--font-3xl)', fontWeight: '800', color: 'var(--text-main)' }}>
                    Indus<span style={{ color: 'var(--primary)' }}>Innovate</span>
                </span>
            </Link>

            {/* Navigation */}
            <nav style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                overflowY: 'auto',
                scrollbarWidth: 'none', // For Firefox
                msOverflowStyle: 'none' // For Internet Explorer
            }}>
                <style>{`
                    nav::-webkit-scrollbar {
                        display: none; /* For Chrome, Safari, and Opera */
                    }
                `}</style>
                {menuItems.map((item, index) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    return (
                        <Link
                            key={index}
                            to={item.path}
                            onClick={() => isMobile && toggleSidebar()}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 24px',
                                textDecoration: 'none',
                                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                background: isActive ? 'var(--input-bg)' : 'transparent',
                                borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent',
                                fontSize: 'var(--font-lg)',
                                fontWeight: isActive ? '600' : '500',
                                transition: 'all 0.2s'
                            }}
                        >
                            {React.cloneElement(item.icon, { color: isActive ? 'var(--primary)' : 'var(--text-muted)' })}
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div
                onClick={signOut}
                style={{
                    marginTop: 'auto',
                    borderTop: '1px solid var(--border)',
                    padding: '16px 24px 0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--font-lg)',
                    fontWeight: '500'
                }}
            >
                <LogOut size={20} />
                <span>Logout</span>
            </div>
        </div>
    );
};

export default EmployeeSidebar;
