import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { PDFViewer } from '@react-pdf/renderer';
import PayslipPDF from '../components/Payroll/PayslipPDF';
import {
    ArrowLeft,
    Wallet,
    Download,
    Send,
    CheckCircle,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const HRPayrollEmployeePage = () => {
    const { employeeId } = useParams();
    const navigate = useNavigate();

    const [selectedEmp, setSelectedEmp] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [payslip, setPayslip] = useState(null);
    const [month, setMonth] = useState('March');
    const [year, setYear] = useState('2026');
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [statutorySettings, setStatutorySettings] = useState(null);

    const round2 = (value) => Number((Math.round((Number(value) || 0) * 100) / 100).toFixed(2));

    const computeAnnualTds = (annualIncome, slabs = []) => {
        const income = Math.max(0, Number(annualIncome) || 0);
        let total = 0;

        for (const slab of slabs) {
            const from = Number(slab.income_from) || 0;
            const to = slab.income_to == null ? Number.POSITIVE_INFINITY : Number(slab.income_to);
            const rate = Number(slab.rate) || 0;

            if (income <= from) continue;

            const taxable = Math.max(0, Math.min(income, to) - from);
            total += taxable * (rate / 100);
        }

        return round2(total);
    };

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                setLoading(true);
                const [employee, settings] = await Promise.all([
                    api.get(`/employees/${employeeId}`),
                    api.get('/payroll/statutory-settings').catch(() => null)
                ]);
                setSelectedEmp(employee);
                if (settings) setStatutorySettings(settings);
            } catch (error) {
                toast.error(error.message || 'Failed to load employee details');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployee();
    }, [employeeId]);

    useEffect(() => {
        if (selectedEmp) {
            setPayslip(buildInitialPayslip(selectedEmp));
        }
    }, [selectedEmp, month, year]);

    useEffect(() => {
        setPayslip((prev) => {
            if (!prev) return prev;
            return recalculatePayslip(prev);
        });
    }, [statutorySettings]);

    useEffect(() => {
        const fetchAttendanceMetrics = async () => {
            if (!selectedEmp) return;

            try {
                setMetricsLoading(true);
                const metrics = await api.get(
                    `/payroll/attendance-metrics?employee_id=${selectedEmp.id}&month=${encodeURIComponent(month)}&year=${year}`
                );

                setPayslip((prev) => {
                    const base = prev || buildInitialPayslip(selectedEmp);
                    const next = {
                        ...base,
                        processed_days: metrics.processed_days,
                        paid_days: metrics.paid_days,
                    };
                    return recalculatePayslip(next);
                });
            } catch (error) {
                console.error(error.message);
            } finally {
                setMetricsLoading(false);
            }
        };

        fetchAttendanceMetrics();
    }, [selectedEmp, month, year]);

    const buildInitialPayslip = (employee) => {
        const annualSalaryInput = Number(employee.salary);
        const annualSalary = Number.isFinite(annualSalaryInput) && annualSalaryInput > 0 ? annualSalaryInput : 0;
        const gross = Math.round((annualSalary / 12) * 100) / 100;
        const basic = gross;
        const hra = 0;
        const conveyance = 0;
        const specialAllowance = 0;

        const ptax = 0;
        const otherDeduction = 0;

        return {
            month,
            year: Number(year),
            emp_code: employee.employee_id || employee.id || 'NA',
            designation: employee.role || '',
            department: employee.department || '',
            location: employee.location || '',
            processed_days: 31,
            paid_days: 31,
            pan_no: employee.pan || '',
            bank_account: employee.bank_account || '',
            bank_name: employee.bank_name || '',
            basic_salary: basic,
            hra,
            allowances: conveyance + specialAllowance,
            pf: 0,
            pf_employee: 0,
            pf_employer: 0,
            esi_employee: 0,
            esi_employer: 0,
            tds: 0,
            gross_salary: gross,
            deductions: 0,
            net_salary: gross,
            conveyance,
            specialAllowance,
            ptax,
            otherDeduction,
            created_at: new Date().toISOString()
        };
    };

    const recalculatePayslip = (current) => {
        const basic = Number(current.basic_salary) || 0;
        const hra = Number(current.hra) || 0;
        const conveyance = Number(current.conveyance) || 0;
        const specialAllowance = Number(current.specialAllowance) || 0;
        const otherDeduction = Number(current.otherDeduction ?? current.tds) || 0;
        const ptax = current.ptax != null && current.ptax !== '' ? Number(current.ptax) : 0;
        const processedDays = Number(current.processed_days) || 0;
        const paidDays = Number(current.paid_days) || 0;
        const factor = processedDays > 0 ? Math.min(paidDays / processedDays, 1) : 0;

        const allowances = conveyance + specialAllowance;
        const baseGross = basic + hra + allowances;
        const gross_salary = Math.round(baseGross * factor);
        const effectiveOtherDeduction = Math.round(otherDeduction * factor);

        const pfEmployeeRate = Number(statutorySettings?.settings?.pf_employee_rate) || 0;
        const pfEmployerRate = Number(statutorySettings?.settings?.pf_employer_rate) || 0;
        const esiEmployeeRate = Number(statutorySettings?.settings?.esi_employee_rate) || 0;
        const esiEmployerRate = Number(statutorySettings?.settings?.esi_employer_rate) || 0;
        const slabs = statutorySettings?.tds_slabs || [];

        const pf_employee = round2(gross_salary * (pfEmployeeRate / 100));
        const pf_employer = round2(gross_salary * (pfEmployerRate / 100));
        const esi_employee = round2(gross_salary * (esiEmployeeRate / 100));
        const esi_employer = round2(gross_salary * (esiEmployerRate / 100));
        const annualTds = computeAnnualTds(gross_salary * 12, slabs);
        const tds = round2(annualTds / 12);

        const deductions = round2(pf_employee + esi_employee + tds + ptax + effectiveOtherDeduction);
        const net_salary = gross_salary - deductions;

        return {
            ...current,
            allowances,
            pf: pf_employee,
            pf_employee,
            pf_employer,
            esi_employee,
            esi_employer,
            tds,
            gross_salary,
            deductions,
            net_salary,
            otherDeduction: effectiveOtherDeduction,
            year: Number(current.year) || Number(year)
        };
    };

    const updateNumericField = (field, value) => {
        setPayslip((prev) => {
            if (!prev) return prev;
            const parsed = value === '' ? 0 : Number(value);
            const next = { ...prev, [field]: Number.isNaN(parsed) ? 0 : parsed };
            return recalculatePayslip(next);
        });
    };

    const updateTextField = (field, value) => {
        setPayslip((prev) => {
            if (!prev) return prev;
            return { ...prev, [field]: value };
        });
    };

    const generatePayslip = async () => {
        if (!selectedEmp || !payslip) return;

        try {
            setGenerating(true);
            await new Promise(resolve => setTimeout(resolve, 1200));
            await api.post('/payroll', {
                employee_id: selectedEmp.id,
                month: payslip.month,
                year: payslip.year,
                emp_code: payslip.emp_code,
                designation: payslip.designation,
                department: payslip.department,
                location: payslip.location,
                processed_days: payslip.processed_days,
                paid_days: payslip.paid_days,
                pan_no: payslip.pan_no,
                bank_account: payslip.bank_account,
                bank_name: payslip.bank_name,
                basic_salary: payslip.basic_salary,
                hra: payslip.hra,
                conveyance: payslip.conveyance,
                special_allowance: payslip.specialAllowance,
                allowances: payslip.allowances,
                pf: payslip.pf_employee,
                pf_employee: payslip.pf_employee,
                pf_employer: payslip.pf_employer,
                esi_employee: payslip.esi_employee,
                esi_employer: payslip.esi_employer,
                ptax: payslip.ptax,
                tds: payslip.tds,
                other_deduction: payslip.otherDeduction,
                gross_salary: payslip.gross_salary,
                deductions: payslip.deductions,
                net_salary: payslip.net_salary
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
            toast.error('Employee details are still loading');
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

    if (loading || !selectedEmp || !payslip) {
        return (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading payroll details...
            </div>
        );
    }

    return (
        <>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className="btn-secondary" onClick={() => navigate('/hr/payroll')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
                        <ArrowLeft size={16} /> Back to Employee List
                    </button>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                        Payroll / {selectedEmp.full_name}
                    </p>
                    <h1 style={{ fontSize: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <Wallet size={24} color="var(--primary)" /> Payroll: {selectedEmp.full_name}
                    </h1>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    All salary amounts are in INR (₹).
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                                <div className="pay-row" style={{ alignItems: 'center' }}>
                                    <span>Basic Salary</span>
                                    <input type="number" value={payslip.basic_salary} onChange={(e) => updateNumericField('basic_salary', e.target.value)} style={{ width: '120px', textAlign: 'right' }} className="input-field" />
                                </div>
                                <div className="pay-row" style={{ alignItems: 'center' }}>
                                    <span>HRA</span>
                                    <input type="number" value={payslip.hra} onChange={(e) => updateNumericField('hra', e.target.value)} style={{ width: '120px', textAlign: 'right' }} className="input-field" />
                                </div>
                                <div className="pay-row" style={{ alignItems: 'center' }}>
                                    <span>Conveyance</span>
                                    <input type="number" value={payslip.conveyance} onChange={(e) => updateNumericField('conveyance', e.target.value)} style={{ width: '120px', textAlign: 'right' }} className="input-field" />
                                </div>
                                <div className="pay-row" style={{ alignItems: 'center' }}>
                                    <span>Special Allowance</span>
                                    <input type="number" value={payslip.specialAllowance} onChange={(e) => updateNumericField('specialAllowance', e.target.value)} style={{ width: '120px', textAlign: 'right' }} className="input-field" />
                                </div>
                                <div className="pay-row total"><span>Gross Total</span> <span>₹{payslip.gross_salary}</span></div>
                            </div>
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: '#EF4444', marginBottom: '12px' }}>DEDUCTIONS</p>
                                <div className="pay-row"><span>PF</span> <span>₹{payslip.pf}</span></div>
                                <div className="pay-row"><span>ESI (Employee)</span> <span>₹{payslip.esi_employee}</span></div>
                                <div className="pay-row"><span>TDS</span> <span>₹{payslip.tds}</span></div>
                                <div className="pay-row" style={{ alignItems: 'center' }}>
                                    <span>Other Deduction</span>
                                    <input type="number" value={payslip.otherDeduction} onChange={(e) => updateNumericField('otherDeduction', e.target.value)} style={{ width: '100px', textAlign: 'right' }} className="input-field" />
                                </div>
                                <div className="pay-row" style={{ alignItems: 'center' }}>
                                    <span>P Tax</span>
                                    <input type="number" value={payslip.ptax} onChange={(e) => updateNumericField('ptax', e.target.value)} style={{ width: '120px', textAlign: 'right' }} className="input-field" />
                                </div>
                                <div className="pay-row total"><span>Total Deductions</span> <span>₹{payslip.deductions}</span></div>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 24px', background: '#FCFCFD' }}>
                            <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>Payslip Details (Editable)</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                {metricsLoading ? 'Calculating attendance days...' : 'Paid/Processed days are auto-calculated from attendance (Mon-Fri, month start to month end). All figures below are in INR (₹).'}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Employee Code</label>
                                    <input className="input-field" value={payslip.emp_code || ''} onChange={(e) => updateTextField('emp_code', e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Designation</label>
                                    <input className="input-field" value={payslip.designation || ''} onChange={(e) => updateTextField('designation', e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Department</label>
                                    <input className="input-field" value={payslip.department || ''} onChange={(e) => updateTextField('department', e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Location</label>
                                    <input className="input-field" value={payslip.location || ''} onChange={(e) => updateTextField('location', e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PAN</label>
                                    <input className="input-field" value={payslip.pan_no || ''} onChange={(e) => updateTextField('pan_no', e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bank Name</label>
                                    <input className="input-field" value={payslip.bank_name || ''} onChange={(e) => updateTextField('bank_name', e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bank Account</label>
                                    <input className="input-field" value={payslip.bank_account || ''} onChange={(e) => updateTextField('bank_account', e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Processed Days</label>
                                    <input className="input-field" type="number" value={payslip.processed_days || 0} readOnly />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Paid Days</label>
                                    <input className="input-field" type="number" value={payslip.paid_days || 0} readOnly />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PF Employer Contribution</label>
                                    <input className="input-field" type="number" value={payslip.pf_employer || 0} readOnly />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ESI Employer Contribution</label>
                                    <input className="input-field" type="number" value={payslip.esi_employer || 0} readOnly />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#EFF6FF', padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600' }}>Net Salary Payable</p>
                            <p style={{ fontSize: '24px', fontWeight: '800', color: '#1E40AF' }}>₹{payslip.net_salary}</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                        <button id="confirm-save-btn" onClick={generatePayslip} disabled={generating} className={generating ? 'generating' : 'normal'}>
                            {generating ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                            {generating ? 'Generating...' : 'Confirm & Save Payslip'}
                        </button>

                        <button
                            onClick={async () => {
                                try {
                                    console.log(`[SIMULATION] Sending payslip email to ${selectedEmp.email}`);
                                    toast.success('Payslip sent to ' + selectedEmp.email + ' (Simulated)');
                                } catch (err) {
                                    console.error(err);
                                }
                            }}
                            className="btn-secondary"
                            style={{ flex: 1, background: '#F3F4F6', color: '#000000' }}
                        >
                            <Send size={18} /> Send Email
                        </button>

                        <button onClick={handleDownloadPDF} className="btn-secondary" style={{ flex: 1, background: '#F3F4F6', color: '#000000' }}>
                            <Download size={18} /> PDF
                        </button>
                    </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '760px' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
                        PDF Template Preview (exact generated format)
                    </div>
                    <div style={{ height: '700px', background: '#525659' }}>
                        <PDFViewer width="100%" height="100%" showToolbar={true} style={{ border: 'none' }}>
                            <PayslipPDF payslip={payslip} employee={selectedEmp} />
                        </PDFViewer>
                    </div>
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

export default HRPayrollEmployeePage;
