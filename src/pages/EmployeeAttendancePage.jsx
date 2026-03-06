import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, Calendar, CheckCircle, AlertCircle, Timer } from 'lucide-react';
import { api } from '../lib/api';

const EmployeeAttendancePage = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [attendance, setAttendance] = useState([]);
    const [todayRecord, setTodayRecord] = useState(null);
    const [todayRecords, setTodayRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDuration, setActiveDuration] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());

            // Update active session duration every second
            setTodayRecord(currentActive => {
                if (currentActive && !currentActive.check_out) {
                    const diffSeconds = Math.floor((new Date() - new Date(currentActive.check_in)) / 1000);
                    setActiveDuration(diffSeconds > 0 ? diffSeconds : 0);
                } else {
                    setActiveDuration(0);
                }
                return currentActive;
            });
        }, 1000);
        fetchAttendance();
        return () => clearInterval(timer);
    }, []);

    const fetchAttendance = async () => {
        try {
            const data = await api.get('/attendance/my');
            setAttendance(data);

            // Get all records for today
            const today = new Date().toISOString().split('T')[0];
            const foundToday = data.filter(rec => rec.check_in.startsWith(today));
            setTodayRecords(foundToday);

            // Find an active session (not checked out) or the most recent one
            const activeSession = foundToday.find(rec => !rec.check_out);
            const mostRecentSession = foundToday.length > 0 ? foundToday[0] : null;

            setTodayRecord(activeSession || mostRecentSession || null);
        } catch (err) {
            console.error('Failed to fetch attendance', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            setLoading(true);
            let locationString = "Unknown Location";

            // 1. Try Browser Geolocation (GPS)
            if ("geolocation" in navigator) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 5000,
                            enableHighAccuracy: true
                        });
                    });

                    const { latitude, longitude } = position.coords;

                    // OpenStreetMap Reverse Geocoding
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await res.json();
                        locationString = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.address?.state_district || "Unknown Location";
                    } catch (geoErr) {
                        locationString = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
                    }
                } catch (posErr) {
                    console.warn("GPS access denied or failed, falling back to IP...");

                    // 2. IP-based Geolocation Fallback
                    try {
                        const ipRes = await fetch('https://ipapi.co/json/');
                        const ipData = await ipRes.json();
                        locationString = `${ipData.city || 'Unknown City'}, ${ipData.region || ''} (via IP)`;
                    } catch (ipErr) {
                        console.error("IP Geolocaiton also failed", ipErr);
                    }
                }
            } else {
                // Fallback for browsers without geolocation support
                try {
                    const ipRes = await fetch('https://ipapi.co/json/');
                    const ipData = await ipRes.json();
                    locationString = `${ipData.city || 'Unknown City'}, ${ipData.region || ''} (via IP)`;
                } catch (ipErr) {
                    console.error("IP Geolocaiton failed", ipErr);
                }
            }

            await api.post('/attendance/check-in', { location: locationString });
            fetchAttendance();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        try {
            const data = await api.post('/attendance/check-out', {});
            fetchAttendance();
        } catch (err) {
            alert(err.message);
        }
    };

    const calculateHours = (start, end) => {
        if (!start) return 0;
        const startTime = new Date(start);
        const endTime = end ? new Date(end) : new Date();
        return (endTime - startTime) / (1000 * 60 * 60);
    };

    const calculateTotalTodayHours = () => {
        const total = todayRecords.reduce((sum, record) => sum + calculateHours(record.check_in, record.check_out), 0);
        return total.toFixed(1);
    };

    const formatDuration = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
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

                    {(!todayRecord || todayRecord.check_out) ? (
                        <button
                            onClick={handleCheckIn}
                            disabled={loading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '16px 40px',
                                background: loading ? 'var(--text-muted)' : 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50px',
                                fontSize: '18px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                boxShadow: loading ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.4)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <Play fill="white" size={20} /> {loading ? 'Locating...' : 'Check-In'}
                        </button>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: 'var(--primary)',
                                fontFamily: 'monospace',
                                background: 'rgba(59, 130, 246, 0.1)',
                                padding: '12px 24px',
                                borderRadius: '12px'
                            }}>
                                {formatDuration(activeDuration)}
                            </div>
                            <button
                                onClick={handleCheckOut}
                                disabled={loading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '16px 40px',
                                    background: loading ? 'var(--text-muted)' : '#EF4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50px',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: loading ? 'none' : '0 4px 14px rgba(239, 68, 68, 0.4)',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.05)')}
                                onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                <Square fill="white" size={20} /> Check-Out
                            </button>
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
                                <h3 style={{ fontSize: '24px', marginTop: '4px', color: 'var(--text-main)' }}>{calculateTotalTodayHours()}h</h3>
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
