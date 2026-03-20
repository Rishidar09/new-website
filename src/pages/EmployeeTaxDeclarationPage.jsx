import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { Loader2, PlusCircle, Upload } from 'lucide-react';

const sectionOptions = [
    { value: '80C', label: '80C Investments' },
    { value: 'HRA', label: 'HRA Exemption' },
    { value: 'HOME_LOAN_INTEREST', label: 'Home Loan Interest' },
    { value: 'STANDARD_DEDUCTION', label: 'Standard Deduction' },
    { value: 'OTHER', label: 'Other Deductions' },
];

const getCurrentFinancialYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startYear = month >= 4 ? year : year - 1;
    return `${startYear}-${startYear + 1}`;
};

const EmployeeTaxDeclarationPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [declaration, setDeclaration] = useState(null);
    const [items, setItems] = useState([]);
    const [financialYear, setFinancialYear] = useState(getCurrentFinancialYear());

    const fetchDeclaration = async (fy = financialYear) => {
        try {
            setLoading(true);
            const data = await api.get(`/income-tax/my?financial_year=${encodeURIComponent(fy)}`);
            setDeclaration(data);
            setItems(Array.isArray(data?.items) ? data.items : []);
        } catch (error) {
            console.error('Failed to load declaration', error);
            alert(error.message || 'Failed to load declaration');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeclaration();
    }, []);

    const totalDeclared = useMemo(
        () => items.reduce((sum, row) => sum + Number(row.declared_amount || 0), 0),
        [items]
    );

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                section_code: '80C',
                item_label: '',
                declared_amount: 0,
                status: 'pending',
                proofs: [],
            },
        ]);
    };

    const updateItem = (index, patch) => {
        setItems((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
    };

    const saveDeclaration = async () => {
        try {
            setSaving(true);
            const payload = {
                financial_year: financialYear,
                items: items.map((row) => ({
                    id: row.id,
                    section_code: row.section_code,
                    item_label: row.item_label,
                    declared_amount: Number(row.declared_amount || 0),
                })),
            };
            const data = await api.put('/income-tax/my', payload);
            setDeclaration(data);
            setItems(Array.isArray(data?.items) ? data.items : []);
            alert('Declaration saved');
        } catch (error) {
            console.error('Failed to save declaration', error);
            alert(error.message || 'Failed to save declaration');
        } finally {
            setSaving(false);
        }
    };

    const submitDeclaration = async () => {
        try {
            setSubmitting(true);
            const data = await api.post('/income-tax/my/submit', { financial_year: financialYear });
            setDeclaration(data);
            setItems(Array.isArray(data?.items) ? data.items : []);
            alert('Declaration submitted for HR review');
        } catch (error) {
            console.error('Failed to submit declaration', error);
            alert(error.message || 'Failed to submit declaration');
        } finally {
            setSubmitting(false);
        }
    };

    const uploadProof = async (itemId, file) => {
        if (!itemId) {
            alert('Save declaration once before uploading proofs');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('proof', file);
            await api.post(`/income-tax/my/items/${itemId}/proofs`, formData);
            await fetchDeclaration(financialYear);
        } catch (error) {
            console.error('Failed to upload proof', error);
            alert(error.message || 'Failed to upload proof');
        }
    };

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
                <h1 style={{ fontSize: '26px', color: 'var(--text-main)', fontWeight: '700' }}>Income Tax Declaration</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>
                    Declare planned deductions and upload supporting proofs for FY.
                </p>
            </div>

            <div className="card" style={{ padding: '16px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Financial Year</p>
                        <input
                            className="input-field"
                            value={financialYear}
                            onChange={(e) => setFinancialYear(e.target.value)}
                            style={{ width: '160px' }}
                        />
                    </div>
                    <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Status</p>
                        <p style={{ fontWeight: 700 }}>{declaration?.status || 'draft'}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Declared</p>
                        <p style={{ fontWeight: 700 }}>Rs {totalDeclared.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '17px' }}>Declaration Items</h3>
                    <button className="btn-primary" onClick={addItem}><PlusCircle size={16} /> Add Item</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '8px' }}>Section</th>
                                <th style={{ padding: '8px' }}>Item</th>
                                <th style={{ padding: '8px' }}>Declared Amount</th>
                                <th style={{ padding: '8px' }}>Status</th>
                                <th style={{ padding: '8px' }}>HR Comment</th>
                                <th style={{ padding: '8px' }}>Proofs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '10px', color: 'var(--text-muted)' }}>No declaration items added.</td>
                                </tr>
                            ) : items.map((row, index) => (
                                <tr key={row.id || `new-${index}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px' }}>
                                        <select
                                            className="input-field"
                                            value={row.section_code}
                                            onChange={(e) => updateItem(index, { section_code: e.target.value })}
                                        >
                                            {sectionOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <input
                                            className="input-field"
                                            value={row.item_label || ''}
                                            onChange={(e) => updateItem(index, { item_label: e.target.value })}
                                        />
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <input
                                            className="input-field"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={row.declared_amount || 0}
                                            onChange={(e) => updateItem(index, { declared_amount: e.target.value })}
                                        />
                                    </td>
                                    <td style={{ padding: '8px' }}>{row.status || 'pending'}</td>
                                    <td style={{ padding: '8px' }}>{row.hr_comment || '-'}</td>
                                    <td style={{ padding: '8px' }}>
                                        <div style={{ display: 'grid', gap: '6px' }}>
                                            {(row.proofs || []).map((proof) => (
                                                <a key={proof.id} href={proof.file_path} target="_blank" rel="noreferrer">
                                                    {proof.file_name}
                                                </a>
                                            ))}
                                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                                <Upload size={14} /> Upload
                                                <input
                                                    type="file"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) uploadProof(row.id, file);
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                    <button className="btn-primary" onClick={saveDeclaration} disabled={saving}>
                        {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                        Save
                    </button>
                    <button className="btn-primary" onClick={submitDeclaration} disabled={submitting || declaration?.status === 'reviewed'}>
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                        Submit For Review
                    </button>
                </div>
            </div>
        </>
    );
};

export default EmployeeTaxDeclarationPage;
