import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PayslipPDF from '../components/Payroll/PayslipPDF';
import {
    FileText,
    Download,
    Eye,
    Loader2,
    Calendar
} from 'lucide-react';

const EmployeePayslipsPage = () => {
    const [payslips, setPayslips] = useState([]);
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch payslips for the logged-in user
            const psData = await api.get('/payroll');
            setPayslips(psData || []);

            // Employee data will be part of the payslip relation in local API
            if (psData.length > 0) {
                setEmployee({ full_name: psData[0].full_name });
            }
        } catch (error) {
            console.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={24} color="var(--primary)" /> My Payslips
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Access and download your monthly salary statements.</p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                    {payslips.map((ps) => (
                        <div key={ps.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px', background: '#F9FAFB', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <Calendar size={20} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{ps.month} {ps.year}</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Generated on {new Date(ps.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>₹{ps.net_salary}</span>
                            </div>

                            <div style={{ padding: '20px', display: 'flex', gap: '12px' }}>
                                <PDFDownloadLink
                                    document={<PayslipPDF payslip={ps} employee={employee} />}
                                    fileName={`Payslip_${ps.month}_${ps.year}.pdf`}
                                    style={{ flex: 1, textDecoration: 'none' }}
                                >
                                    {({ loading: pdfLoading }) => (
                                        <button className="btn-action" disabled={pdfLoading} style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
                                            <Download size={16} />
                                            {pdfLoading ? 'Loading...' : 'Download PDF'}
                                        </button>
                                    )}
                                </PDFDownloadLink>
                                <button className="btn-action" style={{ background: 'white', border: '1px solid var(--border)' }}>
                                    <Eye size={16} />
                                    Preview
                                </button>
                            </div>
                        </div>
                    ))}

                    {payslips.length === 0 && (
                        <div className="card" style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No payslips found for your account.
                        </div>
                    )}
                </div>
            )}

            <style>{`
        .btn-action {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-action:hover { opacity: 0.9; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </Layout>
    );
};

export default EmployeePayslipsPage;
