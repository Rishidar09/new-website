import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    ClipboardList,
    CreditCard,
    Briefcase,
    BarChart3,
    Files,
    Mail,
    History,
    MessageSquare,
    Settings,
    Send,
    CalendarDays
} from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();
    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/hr/dashboard' },
        { icon: <Users size={20} />, label: 'Employees', path: '/hr/employees' },
        { icon: <CalendarCheck size={20} />, label: 'Attendance', path: '/hr/attendance' },
        { icon: <ClipboardList size={20} />, label: 'Leave Requests', path: '/hr/leaves' },
        { icon: <CalendarDays size={20} />, label: 'Holidays', path: '/hr/holidays' },
        { icon: <Send size={20} />, label: 'Apply Leave', path: '/employee/apply-leave' },
        { icon: <CalendarDays size={20} />, label: 'Employee Holidays', path: '/employee/holidays' },
        { icon: <CreditCard size={20} />, label: 'Payroll', path: '/hr/payroll' },
        { icon: <Briefcase size={20} />, label: 'Projects', path: '/hr/projects' },
        { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/hr/analytics' },
        { icon: <Files size={20} />, label: 'Documents', path: '/hr/documents' },
        { icon: <Mail size={20} />, label: 'Offer Letters', path: '/hr/offer-letters' },
        { icon: <History size={20} />, label: 'Audit Logs', path: '/hr/audit-logs' },
        { icon: <MessageSquare size={20} />, label: 'Complaints', path: '/hr/complaints' },
        { icon: <Settings size={20} />, label: 'Settings', path: '/hr/settings' },
    ];

    return (
        <div style={{
            width: '240px',
            height: '100vh',
            background: 'white',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 16px',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 100
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '32px',
                paddingLeft: '12px'
            }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'var(--primary)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                }}>
                    <LayoutDashboard size={20} />
                </div>
                <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
                    Work<span style={{ color: 'var(--primary)' }}>Nest</span>
                </span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {menuItems.map((item, index) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={index}
                            to={item.path}
                            className={`sidebar-item ${isActive ? 'active' : ''}`}
                            style={{ textDecoration: 'none' }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default Sidebar;
