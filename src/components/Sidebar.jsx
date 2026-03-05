import React from 'react';
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
    Settings
} from 'lucide-react';

const Sidebar = () => {
    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', active: true },
        { icon: <Users size={20} />, label: 'Employees' },
        { icon: <CalendarCheck size={20} />, label: 'Attendance' },
        { icon: <ClipboardList size={20} />, label: 'Leave Requests' },
        { icon: <CreditCard size={20} />, label: 'Payroll' },
        { icon: <Briefcase size={20} />, label: 'Projects' },
        { icon: <BarChart3 size={20} />, label: 'Analytics' },
        { icon: <Files size={20} />, label: 'Documents' },
        { icon: <Mail size={20} />, label: 'Offer Letters' },
        { icon: <History size={20} />, label: 'Audit Logs' },
        { icon: <MessageSquare size={20} />, label: 'Complaints' },
        { icon: <Settings size={20} />, label: 'Settings' },
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
            top: 0
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
                {menuItems.map((item, index) => (
                    <div
                        key={index}
                        className={`sidebar-item ${item.active ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;
