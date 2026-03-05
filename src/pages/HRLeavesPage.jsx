import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import {
    Check,
    X,
    Filter,
    CalendarDays,
    User,
    Search,
    Loader2
} from 'lucide-react';

const HRLeavesPage = () => {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await api.get(`/leaves?status=${filter}`);
            setRequests(data || []);
        } catch (error) {
            console.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        try {
            await api.patch(`/leaves/${id}`, { status });
            fetchRequests();
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <Layout>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '24px', color: 'var(--text-main)' }}>Leave Requests</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Review and manage employee leave applications.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <select
                            className="select-field"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                        <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employee</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Leave Type</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reason</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '48px', textAlign: 'center' }}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} /></td>
                                </tr>
                            ) : requests.map((req) => (
                                <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img src={req.employees?.avatar_url || `https://i.pravatar.cc/150?u=${req.employee_id}`} alt="Avatar" className="avatar" />
                                            <div>
                                                <p style={{ fontWeight: '600', fontSize: '14px' }}>{req.employees?.full_name}</p>
                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{req.employees?.department}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>{req.leave_type}</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <p style={{ fontSize: '14px' }}>{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{req.days} days</p>
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: '14px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {req.reason}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span className={`status-badge ${req.status.toLowerCase()}`}>{req.status}</span>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        {req.status === 'Pending' && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleAction(req.id, 'Approved')}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#D1FAE5',
                                                        color: '#059669',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontWeight: '600',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    <Check size={14} /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, 'Rejected')}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#FEE2E2',
                                                        color: '#DC2626',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontWeight: '600',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    <X size={14} /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!loading && requests.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>No leave requests found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
        .select-field {
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid var(--border);
          outline: none;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </Layout>
    );
};

export default HRLeavesPage;
