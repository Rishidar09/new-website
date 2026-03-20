import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Loader2 } from 'lucide-react';

const money = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const EmployeeSalaryStructurePage = () => {
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [current, setCurrent] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyEnabled, setHistoryEnabled] = useState(false);

    const loadCurrent = async () => {
        const data = await api.get('/salary-revisions/my/current');
        setCurrent(data || null);
        setHistoryEnabled(!!data?.history_enabled);
    };

    const loadHistory = async () => {
        try {
            setHistoryLoading(true);
            const data = await api.get('/salary-revisions/my/history');
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            setHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const loadAll = async () => {
        try {
            setLoading(true);
            await loadCurrent();
            if (historyEnabled) await loadHistory();
        } catch (error) {
            console.error('Failed to load salary structure', error);
            alert(error.message || 'Failed to load salary structure');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    useEffect(() => {
        if (historyEnabled) {
            loadHistory().catch(() => {});
        }
    }, [historyEnabled]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '80px' }}>
                <Loader2 className="animate-spin" size={36} color="var(--primary)" />
            </div>
        );
    }

    return (
        <>
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '26px', color: 'var(--text-main)', fontWeight: '700' }}>My Salary Structure</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>
                    View your current salary split and approved CTC.
                </p>
            </div>

            {!current ? (
                <div className="card" style={{ padding: '16px', color: 'var(--text-muted)' }}>Salary structure not available.</div>
            ) : (
                <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
                    <p><strong>Source:</strong> {current.source === 'approved_revision' ? 'Approved Salary Revision' : 'Default Salary Setup'}</p>
                    <p><strong>Effective Date:</strong> {current.effective_date ? new Date(current.effective_date).toLocaleDateString() : '-'}</p>
                    <p><strong>Basic:</strong> {money(current.basic_salary)}</p>
                    <p><strong>HRA:</strong> {money(current.hra)}</p>
                    <p><strong>Allowances:</strong> {money(current.allowances)}</p>
                    <p><strong>Monthly Gross:</strong> {money(current.monthly_gross)}</p>
                    <p><strong>Total CTC:</strong> {money(current.total_ctc)}</p>
                </div>
            )}

            <div className="card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '17px', marginBottom: '8px' }}>Salary Revision History</h3>
                {!historyEnabled ? (
                    <p style={{ color: 'var(--text-muted)' }}>History is not enabled by HR.</p>
                ) : historyLoading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading history...</p>
                ) : history.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No revisions found.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {history.map((revision) => (
                            <div key={revision.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '10px' }}>
                                <p style={{ fontWeight: 700 }}>{revision.status.toUpperCase()} | Effective {new Date(revision.effective_date).toLocaleDateString()}</p>
                                <p style={{ fontSize: '13px' }}>
                                    Basic {money(revision.proposed_basic_salary)} | HRA {money(revision.proposed_hra)} | Allowances {money(revision.proposed_allowances)} | CTC {money(revision.proposed_total_ctc)}
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Comment: {revision.approver_comment || '-'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default EmployeeSalaryStructurePage;
