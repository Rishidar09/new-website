import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import {
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    Plus,
    FileText,
    CalendarDays,
    Loader2
} from 'lucide-react';

const ApplyLeavePage = () => {
    const [loading, setLoading] = useState(false);
    const [balances, setBalances] = useState({ casual: 0, sick: 0, earned: 0 });
    const [history, setHistory] = useState([]);
    const [formData, setFormData] = useState({
        leave_type: 'Casual',
        start_date: '',
        end_date: '',
        reason: '',
    });

    // For demo/simplicity, we'll assume a fixed employee_id or fetch the first one from employees
    const [employeeId, setEmployeeId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const leaves = await api.get('/leaves');
            setHistory(leaves || []);
            // Mock balances for now since we don't have a specific table yet
            setBalances({ casual: 10, sick: 5, earned: 15 });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            await api.post('/leaves', {
                ...formData,
                days
            });

            alert('Leave application submitted!');
            setFormData({ leave_type: 'Casual', start_date: '', end_date: '', reason: '' });
            fetchData();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--text-main)' }}>Apply for Leave</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Request time off and track your leave history.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <BalanceCard title="Casual Leave" count={balances.casual} color="#3B82F6" />
                <BalanceCard title="Sick Leave" count={balances.sick} color="#EF4444" />
                <BalanceCard title="Earned Leave" count={balances.earned} color="#10B981" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={20} color="var(--primary)" /> Apply New Leave
                    </h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Leave Type</label>
                            <select
                                className="input-field"
                                value={formData.leave_type}
                                onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                            >
                                <option>Casual</option>
                                <option>Sick</option>
                                <option>Earned</option>
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500' }}>Start Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    required
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500' }}>End Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    required
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Reason</label>
                            <textarea
                                className="input-field"
                                rows="4"
                                placeholder="Briefly explain the reason for your leave..."
                                required
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                style={{ resize: 'none' }}
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '8px' }}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </form>
                </div>

                <div className="card" style={{ padding: '0' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={20} color="var(--primary)" /> Leave History
                        </h3>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dates</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '500' }}>{item.leave_type}</td>
                                        <td style={{ padding: '12px 24px' }}>
                                            <p style={{ fontSize: '14px' }}>{new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.days} days</p>
                                        </td>
                                        <td style={{ padding: '12px 24px' }}>
                                            <span className={`status-badge ${item.status.toLowerCase()}`}>{item.status}</span>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No leave history found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style>{`
        .input-field {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
          outline: none;
          font-size: 14px;
        }
        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </Layout>
    );
};

const BalanceCard = ({ title, count, color }) => (
    <div className="card" style={{ padding: '24px', borderLeft: `4px solid ${color}` }}>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>{title}</p>
        <h2 style={{ fontSize: '28px', color: 'var(--text-main)', fontWeight: '700' }}>{count} <span style={{ fontSize: '14px', fontWeight: '500' }}>days</span></h2>
    </div>
);

export default ApplyLeavePage;
