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

const EmployeeSidebar = () => {
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
        <div style={{
            width: '260px',
            height: '100vh',
            background: 'white',
            borderRight: '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 0',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 100
        }}>
            {/* Logo */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '32px',
                padding: '0 24px'
            }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    background: '#4A90D9',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                }}>
                    <LayoutDashboard size={24} />
                </div>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>
                    Indus<span style={{ color: '#4A90D9' }}>Innovate</span>
                </span>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {menuItems.map((item, index) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    return (
                        <Link
                            key={index}
                            to={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 24px',
                                textDecoration: 'none',
                                color: isActive ? '#4A90D9' : '#6B7280',
                                background: isActive ? '#EEF4FF' : 'transparent',
                                borderLeft: isActive ? '4px solid #4A90D9' : '4px solid transparent',
                                fontSize: '15px',
                                fontWeight: isActive ? '600' : '500',
                                transition: 'all 0.2s'
                            }}
                        >
                            {React.cloneElement(item.icon, { color: isActive ? '#4A90D9' : '#6B7280' })}
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
                    borderTop: '1px solid #E5E7EB',
                    padding: '16px 24px 0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#6B7280',
                    fontSize: '15px',
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
