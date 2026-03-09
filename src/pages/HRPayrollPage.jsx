import React, { useState, useEffect } from 'react';
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
import toast from 'react-hot-toast';

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

    // Sync payslip preview whenever employee, month or year changes
    useEffect(() => {
        if (selectedEmp) {
            setPayslip(calculatePayslip(selectedEmp));
        } else {
            setPayslip(null);
        }
    }, [selectedEmp, month, year]);

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
    };

    const generatePayslip = async () => {
        if (!selectedEmp || !payslip) return;

        try {
            setGenerating(true);
            // Longer delay to ensure color change is visible to user
            await new Promise(resolve => setTimeout(resolve, 1500));
            await api.post('/payroll', {
                employee_id: selectedEmp.id,
                ...payslip
            });
            toast.success('Payslip generated and saved successfully!');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!selectedEmp || !payslip) {
            toast.error('Please select an employee first');
            return;
        }

        try {
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(<PayslipPDF payslip={payslip} employee={selectedEmp} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Payslip_${selectedEmp.full_name}_${month}_${year}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF generation failed:', error);
            toast.error('Failed to generate PDF');
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Wallet size={24} color="var(--primary)" /> Payroll Management
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Generate and manage employee monthly payslips.</p>
            </div>

            <div className="responsive-grid-2-1">
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
                    {selectedEmp && payslip ? (
                        <>
                            <div className="card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Payslip Preview</h3>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <select className="input-field" value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: '8px 12px', width: 'auto' }}>
                                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
                                        </select>
                                        <select className="input-field" value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: '8px 12px', width: 'auto' }}>
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

                                    <div className="payroll-breakdown" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', padding: '24px' }}>
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
                                        id="confirm-save-btn"
                                        onClick={generatePayslip}
                                        disabled={generating}
                                        className={generating ? "generating" : "normal"}
                                    >
                                        {generating ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                        {generating ? 'Generating...' : 'Confirm & Save Payslip'}
                                    </button>

                                    <button
                                        onClick={async () => {
                                            try {
                                                console.log(`[SIMULATION] Sending payslip email to ${selectedEmp.email}`);
                                                toast.success('Payslip sent to ' + selectedEmp.email + ' (Simulated)');
                                            } catch (err) { }
                                        }}
                                        className="btn-secondary"
                                        style={{ flex: 1, background: '#F3F4F6', color: '#000000' }}
                                    >
                                        <Send size={18} /> Send Email
                                    </button>

                                    <button
                                        onClick={handleDownloadPDF}
                                        className="btn-secondary"
                                        style={{ flex: 1, background: '#F3F4F6', color: '#000000' }}
                                    >
                                        <Download size={18} /> PDF
                                    </button>
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
                #confirm-save-btn {
                    flex: 1.5;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: none !important;
                }
                #confirm-save-btn.normal {
                    background-color: #3B82F6 !important;
                    color: #000000 !important;
                    cursor: pointer;
                }
                #confirm-save-btn.generating {
                    background-color: #6B7280 !important;
                    color: #FFFFFF !important;
                    cursor: not-allowed;
                }
                #confirm-save-btn:disabled {
                    background-color: #6B7280 !important;
                    color: #FFFFFF !important;
                }
            `}</style>
        </>
    );
};

export default HRPayrollPage;
