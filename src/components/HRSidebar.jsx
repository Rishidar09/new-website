import React, { useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    Briefcase,
    ClipboardList,
    CreditCard,
    Building2,
    Network,
    BarChart3,
    Mail,
    Settings,
    FileCheck,
    MessageSquare,
    Wallet,
    Receipt,
    Laptop,
    Clock3,
    HandCoins,
    UserMinus,
    LifeBuoy,
    Video,
    HardDrive,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HRSidebar = ({ isOpen, toggleSidebar, isMobile }) => {
    const { signOut } = useAuth();
    const location = useLocation();
    const navRef = useRef(null);

    useEffect(() => {
        const savedTop = window.sessionStorage.getItem('hr_sidebar_scroll_top');
        if (navRef.current && savedTop != null) {
            navRef.current.scrollTop = Number(savedTop) || 0;
        }
    }, []);

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return undefined;

        const handleScroll = () => {
            window.sessionStorage.setItem('hr_sidebar_scroll_top', String(nav.scrollTop));
        };

        nav.addEventListener('scroll', handleScroll);
        return () => {
            handleScroll();
            nav.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/hr/dashboard' },
        { icon: <Users size={20} />, label: 'Employees', path: '/hr/employees' },
        { icon: <CalendarCheck size={20} />, label: 'Attendance', path: '/hr/attendance' },
        { icon: <ClipboardList size={20} />, label: 'Leave Requests', path: '/hr/leaves' },
        { icon: <CreditCard size={20} />, label: 'Payroll', path: '/hr/payroll' },
        { icon: <Settings size={20} />, label: 'Statutory Settings', path: '/hr/payroll/statutory-settings' },
        { icon: <FileCheck size={20} />, label: 'Statutory Report', path: '/hr/payroll/statutory-compliance' },
        { icon: <FileCheck size={20} />, label: 'IT Declarations', path: '/hr/tax-declarations' },
        { icon: <FileCheck size={20} />, label: 'Form 16', path: '/hr/form16' },
        { icon: <Wallet size={20} />, label: 'Expense Approvals', path: '/hr/expense-approvals' },
        { icon: <Laptop size={20} />, label: 'Assets', path: '/hr/assets' },
        { icon: <Receipt size={20} />, label: 'Reimbursement Summary', path: '/hr/reimbursement-summary' },
        { icon: <Clock3 size={20} />, label: 'Shift Management', path: '/hr/shifts' },
        { icon: <HandCoins size={20} />, label: 'Leave Encashment', path: '/hr/leave-encashment' },
        { icon: <UserMinus size={20} />, label: 'Offboarding', path: '/hr/employees/offboarding' },
        { icon: <LifeBuoy size={20} />, label: 'Helpdesk', path: '/hr/helpdesk' },
        { icon: <ClipboardList size={20} />, label: 'Surveys', path: '/hr/surveys' },
        { icon: <Briefcase size={20} />, label: 'Projects', path: '/hr/projects' },
        { icon: <CalendarCheck size={20} />, label: 'Calendar', path: '/hr/calendar' },
        { icon: <Mail size={20} />, label: 'Offer Letters', path: '/hr/offer-letters' },
        { icon: <MessageSquare size={20} />, label: 'Chat', path: '/hr/chat' },
        { icon: <Video size={20} />, label: 'Meetings', path: '/hr/meetings' },
        { icon: <HardDrive size={20} />, label: 'Drive', path: '/hr/drive' },
        { icon: <MessageSquare size={20} />, label: 'Complaints', path: '/hr/complaints' },
        { icon: <BarChart3 size={20} />, label: 'Performance', path: '/hr/performance' },
        { icon: <ClipboardList size={20} />, label: 'Onboarding', path: '/hr/onboarding' },
        { icon: <Building2 size={20} />, label: 'Departments', path: '/hr/departments' },
        { icon: <Network size={20} />, label: 'Org Chart', path: '/hr/org-chart' },
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
            <Link to="/hr/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', padding: '0 24px' }}>
                <img src="/logo.png" alt="Company Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
                <div className="brand-lockup">
                    <span className="brand-name-animated" style={{ fontSize: '17px', fontWeight: '800' }}>IndusInnovate</span>
                    <span className="brand-name-animated-subline" style={{ fontSize: '11px', fontWeight: '500' }}>Technologies Pvt. Ltd.</span>
                </div>
            </Link>

            {/* Navigation */}
            <nav ref={navRef} style={{
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
                {(() => {
                    // Find the deepest matching path
                    let maxMatchLen = -1;
                    let activeIndex = -1;
                    menuItems.forEach((item, idx) => {
                        if (location.pathname === item.path || location.pathname.startsWith(item.path + '/')) {
                            if (item.path.length > maxMatchLen) {
                                maxMatchLen = item.path.length;
                                activeIndex = idx;
                            }
                        }
                    });
                    return menuItems.map((item, index) => {
                        const isActive = index === activeIndex;
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
                    });
                })()}
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

export default HRSidebar;
