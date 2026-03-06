import React, { useState, useEffect } from 'react';
import {
    FileText, Download, Send, Plus,
    History, Clock, CheckCircle, ChevronRight,
    Printer, Link as LinkIcon, Briefcase, Mail
} from 'lucide-react';
import {
    Document, Page, Text, View,
    StyleSheet, PDFViewer, PDFDownloadLink
} from '@react-pdf/renderer';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

// PDF Styles
const pdfStyles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, color: '#333' },
    header: { marginBottom: 30, borderBottom: '1 solid #EEE', paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
    brand: { fontSize: 18, fontWeight: 'bold', color: '#3B82F6' },
    letterhead: { textAlign: 'right', fontSize: 9, color: '#666' },
    title: { fontSize: 14, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', textDecoration: 'underline' },
    content: { lineHeight: 1.6, marginBottom: 15 },
    field: { fontWeight: 'bold' },
    footer: { marginTop: 50, borderTop: '1 solid #EEE', paddingTop: 10, fontSize: 9, color: '#999' },
    signature: { marginTop: 40 }
});

// Offer Letter Document
const LetterPDF = ({ data, type }) => (
    <Document>
        <Page size="A4" style={pdfStyles.page}>
            <View style={pdfStyles.header}>
                <Text style={pdfStyles.brand}>INDUSINNOVATE TECHNOLOGIES</Text>
                <View style={pdfStyles.letterhead}>
                    <Text>IndusInnovate HR Solutions</Text>
                    <Text>Bangalore, Karnataka, India</Text>
                    <Text>contact@indusinnovate.com</Text>
                </View>
            </View>

            <Text style={pdfStyles.title}>{type === 'joining' ? 'LETTER OF APPOINTMENT' : 'OFFER OF EMPLOYMENT'}</Text>

            <Text style={pdfStyles.content}>Date: {new Date().toLocaleDateString()}</Text>
            <Text style={[pdfStyles.content, { marginBottom: 25 }]}>To, {'\n'}{data.candidate_name}</Text>

            {type === 'joining' ? (
                <>
                    <Text style={pdfStyles.content}>
                        Dear {data.candidate_name},
                    </Text>
                    <Text style={pdfStyles.content}>
                        We are delighted to formally appoint you as <Text style={pdfStyles.field}>{data.role}</Text> in our
                        <Text style={pdfStyles.field}> {data.department} </Text> department. This appointment is effective
                        from your joining date <Text style={pdfStyles.field}>{data.joining_date}</Text>.
                    </Text>
                    <Text style={pdfStyles.content}>
                        As discussed, your primary place of work will be our Bangalore office. You will be reporting to
                        the Department Head of {data.department}.
                    </Text>
                </>
            ) : (
                <>
                    <Text style={pdfStyles.content}>
                        We are pleased to offer you the position of <Text style={pdfStyles.field}>{data.role}</Text> in the
                        <Text style={pdfStyles.field}> {data.department} </Text> department at IndusInnovate Technologies. We were impressed with
                        your background and believe you will be a valuable addition to our team.
                    </Text>
                    <Text style={pdfStyles.content}>
                        Your Annual Total Compensation (CTC) will be <Text style={pdfStyles.field}>₹{data.ctc}</Text>.
                        Your scheduled joining date is <Text style={pdfStyles.field}>{data.joining_date}</Text>.
                    </Text>
                </>
            )}

            <Text style={pdfStyles.content}>
                Please find the detailed terms and conditions attached to this letter. We look forward to welcome
                you on board.
            </Text>

            <View style={pdfStyles.signature}>
                <Text style={pdfStyles.field}>Human Resources</Text>
                <Text>IndusInnovate Team</Text>
            </View>

            <View style={pdfStyles.footer}>
                <Text>© 2026 IndusInnovate Technologies. All rights reserved. Confidential Document.</Text>
            </View>
        </Page>
    </Document>
);

const OfferLetterPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [letterType, setLetterType] = useState('offer'); // 'offer' or 'joining'
    const [formData, setFormData] = useState({
        candidate_name: '',
        role: '',
        department: 'Engineering',
        ctc: '',
        joining_date: ''
    });

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await api.get('/offer-letters');
            setHistory(data);
        } catch (err) { }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await api.post('/offer-letters', { ...formData, type: letterType });
            fetchHistory();
            toast.success(`${letterType === 'offer' ? 'Offer' : 'Joining'} letter record created!`);
        } catch (err) {
            toast.error('Failed to save record');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (id) => {
        try {
            await api.post(`/offer-letters/${id}/send`, {});
            fetchHistory();
            console.log(`[SIMULATION] Sending offer letter email for ID: ${id}`);
            toast.success('Offer letter sent (simulated)');
        } catch (err) {
            toast.error('Failed to send offer letter');
        }
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <header className="no-print" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '28px', color: 'var(--text-main)', marginBottom: '4px' }}>Document Generator</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Draft, preview, and transmit professional employment letters.</p>
                </div>
                <div className="no-print" style={{ display: 'flex', background: 'white', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <button
                        onClick={() => setLetterType('offer')}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                            background: letterType === 'offer' ? 'var(--primary)' : 'transparent',
                            color: letterType === 'offer' ? 'white' : 'var(--text-muted)'
                        }}
                    >Offer Letter</button>
                    <button
                        onClick={() => setLetterType('joining')}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                            background: letterType === 'joining' ? 'var(--primary)' : 'transparent',
                            color: letterType === 'joining' ? 'white' : 'var(--text-muted)'
                        }}
                    >Joining Letter</button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px' }}>
                {/* Form Column */}
                <div className="card no-print" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={18} color="var(--primary)" /> Candidate Details
                    </h3>

                    <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>CANDIDATE FULL NAME</label>
                            <input
                                className="input-field"
                                placeholder="e.g. John Doe"
                                value={formData.candidate_name}
                                onChange={e => setFormData({ ...formData, candidate_name: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>POSITION ROLE</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. Senior Dev"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>DEPARTMENT</label>
                                <select
                                    className="input-field"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                >
                                    <option>Engineering</option>
                                    <option>Design</option>
                                    <option>Marketing</option>
                                    <option>HR</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>TOTAL CTC (INR)</label>
                                <input
                                    className="input-field"
                                    type="number"
                                    placeholder="e.g. 1200000"
                                    value={formData.ctc}
                                    onChange={e => setFormData({ ...formData, ctc: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>JOINING DATE</label>
                                <input
                                    className="input-field"
                                    type="date"
                                    value={formData.joining_date}
                                    onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            <button
                                type="button"
                                onClick={handleSave}
                                style={{
                                    flex: 1, padding: '14px', background: 'var(--primary)', color: 'white',
                                    border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <Plus size={18} /> Generate {letterType === 'offer' ? 'Offer' : 'Joining'}
                            </button>
                            <PDFDownloadLink
                                document={<LetterPDF data={formData} type={letterType} />}
                                fileName={`${letterType}_letter_${formData.candidate_name}.pdf`}
                                style={{ flex: 1 }}
                            >
                                {({ loading }) => (
                                    <button
                                        disabled={loading}
                                        style={{
                                            width: '100%', padding: '14px', background: 'white', color: 'var(--primary)',
                                            border: '1.5px solid var(--primary)', borderRadius: '12px', fontWeight: '700', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}
                                    >
                                        <Download size={18} /> {loading ? 'Preparing...' : 'Download PDF'}
                                    </button>
                                )}
                            </PDFDownloadLink>
                        </div>
                    </form>
                </div>

                {/* Preview Column */}
                <div className="card" style={{ padding: '0', overflow: 'hidden', height: '600px', position: 'relative' }}>
                    <div style={{ padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>LIVE PREVIEW (INDUSINNOVATE LETTERHEAD)</span>
                        <Printer size={16} color="#64748B" />
                    </div>
                    <div style={{ padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>LIVE PREVIEW ({letterType.toUpperCase()} LETTERHEAD)</span>
                        <Printer size={16} color="#64748B" />
                    </div>
                    <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: 'none' }}>
                        <LetterPDF data={formData} type={letterType} />
                    </PDFViewer>
                </div>
            </div>

            {/* History List */}
            <div className="no-print" style={{ marginTop: '48px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={18} color="var(--primary)" /> Generation History
                </h3>
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>CANDIDATE</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>ROLE</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>JOINING</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>STATUS</th>
                                <th style={{ textAlign: 'right', padding: '16px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((h, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>{h.candidate_name}</td>
                                    <td style={{ padding: '16px', fontSize: '14px' }}>{h.role}</td>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748B' }}>{new Date(h.joining_date).toLocaleDateString()}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span className={`status-badge ${h.status.toLowerCase()}`}>
                                            {h.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleSend(h.id)}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px' }}
                                            title="Send Email"
                                        >
                                            <Mail size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <style>{`
                @media print {
                    .card { border: none !important; box-shadow: none !important; }
                    h1, p, header { display: none !important; }
                    .main-content { padding: 0 !important; }
                }
            `}</style>
        </div>
    );
};

export default OfferLetterPage;
