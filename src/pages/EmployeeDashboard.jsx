import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Calendar, UserCheck, Briefcase, Loader2 } from 'lucide-react';

const EmployeeDashboard = () => {
    const { profile } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.get('/employees/dashboard-stats');
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch dashboard stats', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--text-main)' }}>IndusInnovate Employee Portal</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                    Welcome back, {profile?.full_name || profile?.email || 'Employee'}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {/* Attendance Card */}
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '12px' }}>
                        <UserCheck size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>Monthly Attendance</p>
                        <h2 style={{ fontSize: '24px' }}>{stats?.attendanceCount || 0} Days</h2>
                    </div>
                </div>

                {/* Leaves Card */}
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px' }}>
                        <Calendar size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>Leaves Taken (This Month)</p>
                        <h2 style={{ fontSize: '24px' }}>{stats?.leavesCount || 0} Approved</h2>
                    </div>
                </div>

                {/* Projects Card */}
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px' }}>
                        <Briefcase size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>Active Projects</p>
                        <h2 style={{ fontSize: '24px' }}>{stats?.projects?.length || 0} Assigned</h2>
                    </div>
                </div>
            </div>

            {/* Current Projects List */}
            <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Your Current Projects</h3>
                {stats?.projects?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {stats.projects.map((project, idx) => (
                            <div key={idx} style={{
                                padding: '16px',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>{project.name}</h4>
                                    <span style={{
                                        padding: '4px 8px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}>
                                        {project.status}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '14px', fontWeight: '500' }}>{project.progress}%</p>
                                    <div style={{ width: '120px', height: '6px', background: 'var(--border)', borderRadius: '3px', marginTop: '8px' }}>
                                        <div style={{ width: `${project.progress}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No active projects assigned at the moment.</p>
                )}
            </div>

            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default EmployeeDashboard;
