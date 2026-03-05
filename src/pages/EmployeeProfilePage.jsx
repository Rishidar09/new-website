import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
    ArrowLeft,
    User,
    FileText,
    Calendar,
    CreditCard,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Loader2
} from 'lucide-react';

const EmployeeProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('Personal Info');
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    const tabs = ['Personal Info', 'Documents', 'Attendance', 'ID Card', 'NDA'];

    useEffect(() => {
        if (!id && profile) {
            setEmployee(profile);
            setLoading(false);
        } else if (id) {
            fetchEmployee();
        } else {
            setLoading(false);
        }
    }, [id, profile]);

    const fetchEmployee = async () => {
        try {
            setLoading(true);
            const data = await api.get(`/employees/${id}`);
            setEmployee(data);
        } catch (error) {
            console.error('Error fetching employee:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                    <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary)' }} />
                    <style>{`
            .animate-spin { animation: spin 1s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
                </div>
            </>
        );
    }

    if (!employee) {
        return (
            <>
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <h2>Employee not found</h2>
                    <button onClick={() => navigate('/hr/employees')}>Back to list</button>
                </div>
            </>
        );
    }

    return (
        <>
            <div style={{ marginBottom: '24px' }}>
                <button
                    onClick={() => navigate('/hr/employees')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '8px 0',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    <ArrowLeft size={18} />
                    Back to Employees
                </button>
            </div>

            <div className="card" style={{ marginBottom: '32px', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <img src={employee.avatar_url || `https://i.pravatar.cc/150?u=${employee.id}`} alt={employee.full_name} style={{ width: '100px', height: '100px', borderRadius: '50%' }} />
                    <div>
                        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>{employee.full_name}</h1>
                        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={16} /> {employee.role}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={16} /> {employee.email}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={16} /> Joined {new Date(employee.joining_date).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <span className={`status-badge ${(employee.status || 'Active').toLowerCase()}`} style={{ fontSize: '14px', padding: '6px 16px' }}>{employee.status || 'Active'}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '12px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: activeTab === tab ? '600' : '500',
                            cursor: 'pointer',
                            fontSize: '15px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="card" style={{ minHeight: '400px', padding: '32px' }}>
                {activeTab === 'Personal Info' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Contact Information</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <InfoItem icon={<Mail size={18} />} label="Email Address" value={employee.email} />
                                <InfoItem icon={<Phone size={18} />} label="Phone Number" value={employee.phone || 'Not provided'} />
                            </div>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Employment Details</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <InfoItem icon={<Briefcase size={18} />} label="Department" value={employee.department} />
                                <InfoItem icon={<CreditCard size={18} />} label="Annual Salary" value={employee.salary ? `$${employee.salary}` : 'Not provided'} />
                                <InfoItem icon={<Calendar size={18} />} label="Joining Date" value={new Date(employee.joining_date).toLocaleDateString()} />
                            </div>
                        </div>
                    </div>
                )}
                {activeTab !== 'Personal Info' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)' }}>
                        <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p style={{ fontSize: '18px', fontWeight: '500' }}>{activeTab} content coming soon</p>
                        <p style={{ fontSize: '14px', marginTop: '8px' }}>This section is currently under development.</p>
                    </div>
                )}
            </div>
            <style>{`
        .status-badge.active { background: #D1FAE5; color: #059669; }
        .status-badge.on-leave { background: #FEF3C7; color: #D97706; }
      `}</style>
        </>
    );
};

const InfoItem = ({ icon, label, value }) => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ color: 'var(--primary)', marginTop: '2px' }}>{icon}</div>
        <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
            <p style={{ fontSize: '15px', fontWeight: '600' }}>{value}</p>
        </div>
    </div>
);

export default EmployeeProfilePage;
