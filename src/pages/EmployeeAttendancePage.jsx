import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, Calendar, CheckCircle, AlertCircle, Timer } from 'lucide-react';
import { api } from '../lib/api';

const EmployeeAttendancePage = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [attendance, setAttendance] = useState([]);
    const [todayRecord, setTodayRecord] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchAttendance();
        return () => clearInterval(timer);
    }, []);

    const fetchAttendance = async () => {
        try {
            const data = await api.get('/attendance/my');
            setAttendance(data);

            // Check if there's a record for today
            const today = new Date().toISOString().split('T')[0];
            const found = data.find(rec => rec.check_in.startsWith(today));
            setTodayRecord(found);
        } catch (err) {
            console.error('Failed to fetch attendance', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            const data = await api.post('/attendance/check-in', {});
            setTodayRecord(data);
            fetchAttendance();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCheckOut = async () => {
        try {
            const data = await api.post('/attendance/check-out', {});
            setTodayRecord(data);
            fetchAttendance();
        } catch (err) {
            alert(err.message);
        }
    };

    const calculateHours = (start, end) => {
        if (!start) return '0.0';
        const startTime = new Date(start);
        const endTime = end ? new Date(end) : new Date();
        const diff = (endTime - startTime) / (1000 * 60 * 60);
        return diff.toFixed(1);
    };

    // Calendar Heatmap logic
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const now = new Date();
    const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

    const getStatusColor = (dateString) => {
        const record = attendance.find(rec => rec.check_in.startsWith(dateString));
        if (!record) return 'var(--input-bg)';
        switch (record.status) {
            case 'Present': return 'var(--status-approved-text)';
            case 'Late': return 'var(--status-pending-text)';
            case 'Absent': return 'var(--status-rejected-text)';
            case 'Half-Day': return 'var(--primary)';
            default: return 'var(--status-approved-text)';
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', color: 'var(--text-main)', marginBottom: '8px' }}>Attendance Tracker</h1>
                <p style={{ color: 'var(--text-muted)' }}>Keep track of your daily presence and work hours.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* Check-in Card */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>

                    {!todayRecord ? (
                        <button
                            onClick={handleCheckIn}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '16px 40px',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50px',
                                fontSize: '18px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Play fill="white" size={20} /> Check-In
                        </button>
                    ) : !todayRecord.check_out ? (
                        <button
                            onClick={handleCheckOut}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '16px 40px',
                                background: '#EF4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50px',
                                fontSize: '18px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Square fill="white" size={20} /> Check-Out
                        </button>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-approved-text)', fontWeight: '600' }}>
                            <CheckCircle size={24} /> Work Completed for Today
                        </div>
                    )}

                    {todayRecord && (
                        <div style={{ marginTop: '24px', display: 'flex', gap: '24px' }}>
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CHECK-IN</p>
                                <p style={{ fontWeight: '600' }}>{new Date(todayRecord.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CHECK-OUT</p>
                                <p style={{ fontWeight: '600' }}>{todayRecord.check_out ? new Date(todayRecord.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>STATUS</p>
                                <span className={`status-badge ${todayRecord.status.toLowerCase()}`}>
                                    {todayRecord.status}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card" style={{ background: 'var(--card-bg)', borderLeft: '4px solid #F59E0B' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Hours Worked (Today)</p>
                                <h3 style={{ fontSize: '24px', marginTop: '4px', color: 'var(--text-main)' }}>{todayRecord ? calculateHours(todayRecord.check_in, todayRecord.check_out) : '0.0'}h</h3>
                            </div>
                            <Timer color="#F59E0B" size={32} />
                        </div>
                    </div>
                    <div className="card" style={{ background: 'var(--card-bg)', borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Present (Month)</p>
                                <h3 style={{ fontSize: '24px', marginTop: '4px', color: 'var(--text-main)' }}>
                                    {attendance.filter(r => r.status === 'Present' || r.status === 'Late').length}
                                </h3>
                            </div>
                            <AlertCircle color="var(--primary)" size={32} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Heatmap Calendar */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', color: 'var(--text-main)' }}>Attendance History</h3>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '12px', height: '12px', background: 'var(--status-approved-text)', borderRadius: '2px' }}></div> Present
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '12px', height: '12px', background: 'var(--status-pending-text)', borderRadius: '2px' }}></div> Late
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '12px', height: '12px', background: 'var(--status-rejected-text)', borderRadius: '2px' }}></div> Absent
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '8px',
                    textAlign: 'center'
                }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', paddingBottom: '8px' }}>{day}</div>
                    ))}
                    {[...Array(firstDayOfMonth)].map((_, i) => <div key={`empty-${i}`}></div>)}
                    {[...Array(daysInMonth)].map((_, i) => {
                        const day = i + 1;
                        const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        return (
                            <div
                                key={day}
                                style={{
                                    aspectRatio: '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: getStatusColor(dateString),
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: getStatusColor(dateString) === 'var(--input-bg)' ? 'var(--text-main)' : 'white',
                                    cursor: 'pointer'
                                }}
                                title={dateString}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default EmployeeAttendancePage;
