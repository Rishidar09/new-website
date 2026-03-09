import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { api } from '../lib/api';

const HRAttendancePage = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        department: ''
    });

    useEffect(() => {
        fetchAttendance();
        const interval = setInterval(fetchAttendance, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, [filters]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams(filters).toString();
            const data = await api.get(`/attendance/all?${query}`);
            setRecords(data);
        } catch (err) {
            console.error('Failed to fetch attendance', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateHours = (start, end) => {
        if (!start || !end) return '0.0';
        const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
        return diff.toFixed(1);
    };

    const handleExport = () => {
        const headers = ['Employee', 'Department', 'Check-In', 'Check-Out', 'Hours', 'Status'];
        const rows = records.map(r => [
            r.full_name,
            r.department,
            new Date(r.check_in).toLocaleTimeString(),
            r.check_out ? new Date(r.check_out).toLocaleTimeString() : '--',
            calculateHours(r.check_in, r.check_out),
            r.status
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_report_${filters.date}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const stats = {
        total: records.length,
        present: records.filter(r => r.status === 'Present' || r.status === 'Late').length,
        late: records.filter(r => r.status === 'Late').length,
        absent: 0
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', color: 'var(--text-main)' }}>Company Attendance</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Monitor and manage employee daily presence.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={fetchAttendance}
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: 'var(--card-bg)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        <Clock size={18} /> {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                        onClick={handleExport}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        <Download size={18} /> Export CSV
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }} className="grid-cols-4">
                <div className="card">
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Records</p>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Users color="var(--primary)" /> {stats.total}
                    </h2>
                </div>
                <div className="card">
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Present Today</p>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CheckCircle color="#10B981" /> {stats.present}
                    </h2>
                </div>
                <div className="card">
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Late Entries</p>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Clock color="#F59E0B" /> {stats.late}
                    </h2>
                </div>
                <div className="card">
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Leaves/Absent</p>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <AlertCircle color="#EF4444" /> {stats.absent}
                    </h2>
                </div>
            </div>

            {/* Filters */}
            <div className="card responsive-flex-header" style={{ marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>DATE</label>
                    <input
                        type="date"
                        value={filters.date}
                        onChange={e => setFilters({ ...filters, date: e.target.value })}
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>DEPARTMENT</label>
                    <select
                        value={filters.department}
                        onChange={e => setFilters({ ...filters, department: e.target.value })}
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }}
                    >
                        <option value="">All Departments</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Sales">Sales</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0 }}>
                <div className="table-scroll-wrapper">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>EMPLOYEE</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>DEPARTMENT</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>CHECK-IN</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>CHECK-OUT</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>HOURS</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No records found for this criteria.</td>
                                </tr>
                            ) : (
                                records.map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '16px', fontWeight: '500' }}>{row.full_name}</td>
                                        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{row.department}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div>{new Date(row.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            {row.location && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    📍 {row.location}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div>{row.check_out ? new Date(row.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                                            {row.checkout_location && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    📍 {row.checkout_location}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px' }}>{calculateHours(row.check_in, row.check_out)}h</td>
                                        <td style={{ padding: '16px' }}>
                                            <span className={`status-badge ${row.status.toLowerCase()}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default HRAttendancePage;
