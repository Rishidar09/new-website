import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PayslipPDF from '../components/Payroll/PayslipPDF';
import {
    Search,
    Wallet,
    Download,
    Send,
    CheckCircle,
    AlertCircle,
    Loader2,
    FileText
} from 'lucide-react';

const HRPayrollPage = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [payslip, setPayslip] = useState(null);
    const [month, setMonth] = useState('March');
    const [year, setYear] = useState('2026');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const data = await api.get('/employees');
            setEmployees(data || []);
        } catch (error) {
            console.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const calculatePayslip = (employee) => {
        const base = parseFloat(employee.salary) || 0;
        const basic = Math.round(base * 0.5);
        const hra = Math.round(base * 0.2);
        const allowances = Math.round(base * 0.3);
        const pf = Math.round(basic * 0.12);
        const tds = Math.round(base * 0.1);

        const gross = basic + hra + allowances;
        const deductions = pf + tds;
        const net = gross - deductions;

        return {
            month,
            year,
            basic_salary: basic,
            hra,
            allowances,
            pf,
            tds,
            gross_salary: gross,
            deductions,
            net_salary: net,
            created_at: new Date().toISOString()
        };
    };

    const handleSelectEmployee = (emp) => {
        setSelectedEmp(emp);
        setPayslip(calculatePayslip(emp));
    };

    const generatePayslip = async () => {
        if (!selectedEmp || !payslip) return;

        try {
            setGenerating(true);
            await api.post('/payroll', {
                employee_id: selectedEmp.id,
                ...payslip
            });
            alert('Payslip generated and saved successfully!');
        } catch (error) {
            alert(error.message);
        } finally {
            setGenerating(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Wallet size={24} color="var(--primary)" /> Payroll Management
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Generate and manage employee monthly payslips.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px' }}>
                {/* Sidebar: Employee List */}
                <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search employee..."
                                className="input-field"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '36px', width: '100%' }}
                            />
                        </div>
                    </div>
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {filteredEmployees.map(emp => (
                            <div
                                key={emp.id}
                                onClick={() => handleSelectEmployee(emp)}
                                style={{
                                    padding: '16px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    background: selectedEmp?.id === emp.id ? '#F0F7FF' : 'transparent',
                                    borderBottom: '1px solid var(--border)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <img src={emp.avatar_url || `https://i.pravatar.cc/150?u=${emp.id}`} className="avatar" style={{ width: '36px', height: '36px' }} />
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: '600' }}>{emp.full_name}</p>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main: Preview and Generate */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {selectedEmp ? (
                        <>
                            <div className="card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Payslip Preview</h3>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <select className="select-field" value={month} onChange={(e) => setMonth(e.target.value)}>
                                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
                                        </select>
                                        <select className="select-field" value={year} onChange={(e) => setYear(e.target.value)}>
                                            {['2025', '2026', '2027'].map(y => <option key={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div style={{ background: '#F9FAFB', padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Employee</p>
                                            <p style={{ fontSize: '16px', fontWeight: '700' }}>{selectedEmp.full_name}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Period</p>
                                            <p style={{ fontSize: '16px', fontWeight: '700' }}>{month} {year}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', padding: '24px' }}>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', marginBottom: '12px' }}>EARNINGS</p>
                                            <div className="pay-row"><span>Basic Salary</span> <span>₹{payslip.basic_salary}</span></div>
                                            <div className="pay-row"><span>HRA</span> <span>₹{payslip.hra}</span></div>
                                            <div className="pay-row"><span>Allowances</span> <span>₹{payslip.allowances}</span></div>
                                            <div className="pay-row total"><span>Gross Total</span> <span>₹{payslip.gross_salary}</span></div>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#EF4444', marginBottom: '12px' }}>DEDUCTIONS</p>
                                            <div className="pay-row"><span>PF</span> <span>₹{payslip.pf}</span></div>
                                            <div className="pay-row"><span>TDS / Tax</span> <span>₹{payslip.tds}</span></div>
                                            <div className="pay-row total"><span>Total Deductions</span> <span>₹{payslip.deductions}</span></div>
                                        </div>
                                    </div>

                                    <div style={{ background: '#EFF6FF', padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '600' }}>Net Salary Payable</p>
                                        <p style={{ fontSize: '24px', fontWeight: '800', color: '#1E40AF' }}>₹{payslip.net_salary}</p>
                                    </div>
                                </div>

                                <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                                    <button
                                        onClick={generatePayslip}
                                        disabled={generating}
                                        className="btn-primary"
                                        style={{ flex: 1 }}
                                    >
                                        {generating ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                        {generating ? 'Generating...' : 'Confirm & Save Payslip'}
                                    </button>

                                    <PDFDownloadLink
                                        document={<PayslipPDF payslip={payslip} employee={selectedEmp} />}
                                        fileName={`Payslip_${selectedEmp.full_name}_${month}_${year}.pdf`}
                                        style={{ flex: 1, textDecoration: 'none' }}
                                    >
                                        {({ loading: pdfLoading }) => (
                                            <button className="btn-secondary" disabled={pdfLoading} style={{ width: '100%', height: '100%' }}>
                                                <Download size={18} />
                                                {pdfLoading ? 'Loading PDF...' : 'Download PDF'}
                                            </button>
                                        )}
                                    </PDFDownloadLink>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="card" style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <div style={{ background: '#F3F4F6', padding: '20px', borderRadius: '50%' }}>
                                <Wallet size={40} color="var(--text-muted)" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Select an Employee</h3>
                            <p style={{ color: 'var(--text-muted)', maxWidth: '300px' }}>Choose an employee from the list to preview and generate their monthly payslip.</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .input-field, .select-field {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
          outline: none;
          font-size: 14px;
        }
        .pay-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          border-bottom: 1px solid #F3F4F6;
        }
        .pay-row.total {
          border-bottom: 0;
          font-weight: 700;
          margin-top: 8px;
        }
        .btn-primary {
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-secondary {
          background: white;
          color: var(--text-main);
          border: 1px solid var(--border);
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </Layout>
    );
};

export default HRPayrollPage;
