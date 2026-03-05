import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    Briefcase,
    ClipboardList,
    CreditCard,
    Files,
    BarChart3,
    Mail,
    History,
    MessageSquare,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HRSidebar = () => {
    const { signOut } = useAuth();
    const location = useLocation();

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/hr/dashboard' },
        { icon: <Users size={20} />, label: 'Employees', path: '/hr/employees' },
        { icon: <CalendarCheck size={20} />, label: 'Attendance', path: '/hr/attendance' },
        { icon: <ClipboardList size={20} />, label: 'Leave Requests', path: '/hr/leaves' },
        { icon: <CreditCard size={20} />, label: 'Payroll', path: '/hr/payroll' },
        { icon: <Briefcase size={20} />, label: 'Projects', path: '/hr/projects' },
        { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/hr/analytics' },
        { icon: <Files size={20} />, label: 'Documents', path: '/hr/documents' },
        { icon: <Mail size={20} />, label: 'Offer Letters', path: '/hr/offer-letters' },
        { icon: <History size={20} />, label: 'Audit Logs', path: '/hr/audit-logs' },
        { icon: <MessageSquare size={20} />, label: 'Complaints', path: '/hr/complaints' },
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

export default HRSidebar;
