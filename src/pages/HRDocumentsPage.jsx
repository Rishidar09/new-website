import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import {
    Folder,
    FileText,
    Upload,
    MoreVertical,
    Search,
    Download,
    Eye,
    Send,
    CheckCircle,
    Clock,
    Plus,
    X,
    Loader2
} from 'lucide-react';

const HRDocumentsPage = () => {
    const [activeFolder, setActiveFolder] = useState('NDA');
    const [documents, setDocuments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Form state for upload
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [docStatus, setDocStatus] = useState('Pending');

    const folders = ['NDA', 'Contracts', 'Offer Letters', 'Policies'];

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [activeFolder]);

    const fetchInitialData = async () => {
        try {
            const { data: empData } = await supabase.from('employees').select('id, full_name');
            setEmployees(empData || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('documents')
                .select(`
                    *,
                    employees (full_name)
                `)
                .eq('folder', activeFolder)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile || (activeFolder !== 'Policies' && !selectedEmployee)) {
            alert('Please select a file and an employee.');
            return;
        }

        try {
            setUploading(true);
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${activeFolder}/${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;

            // 2. Save metadata to DB
            const { error: dbError } = await supabase.from('documents').insert([{
                employee_id: activeFolder === 'Policies' ? null : selectedEmployee,
                name: selectedFile.name,
                file_path: filePath,
                folder: activeFolder,
                status: activeFolder === 'Policies' ? 'Signed' : docStatus
            }]);

            if (dbError) throw dbError;

            alert('Document uploaded successfully!');
            setIsUploadModalOpen(false);
            fetchDocuments();
            setSelectedFile(null);
            setSelectedEmployee('');
        } catch (error) {
            alert('Error uploading document: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const getFileUrl = (path) => {
        const { data } = supabase.storage.from('documents').getPublicUrl(path);
        return data.publicUrl;
    };

    return (
        <Layout>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Files size={24} color="var(--primary)" /> Document Management
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Manage and track employee sensitive documents.</p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="btn-primary"
                >
                    <Plus size={18} /> Upload Document
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px', alignItems: 'start' }}>
                {/* Folder Sidebar */}
                <div className="card" style={{ padding: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', paddingLeft: '8px' }}>Folders</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {folders.map(folder => (
                            <button
                                key={folder}
                                onClick={() => setActiveFolder(folder)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeFolder === folder ? '#F0F7FF' : 'transparent',
                                    color: activeFolder === folder ? 'var(--primary)' : 'var(--text-main)',
                                    fontWeight: activeFolder === folder ? '600' : '400',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Folder size={18} fill={activeFolder === folder ? 'var(--primary)' : 'none'} />
                                {folder}
                            </button>
                        ))}
                    </div>
                </div>

                {/* File Management Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card" style={{ padding: '0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>FILE NAME</th>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>EMPLOYEE</th>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>UPLOAD DATE</th>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>STATUS</th>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" /></td></tr>
                                ) : documents.length > 0 ? (
                                    documents.map((doc) => (
                                        <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <FileText size={20} color="var(--text-muted)" />
                                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{doc.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                                                {doc.employees?.full_name || 'Global Policy'}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span className={`badge ${doc.status === 'Signed' ? 'badge-active' : 'badge-pending'}`}>
                                                    {doc.status === 'Signed' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                    {doc.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <a href={getFileUrl(doc.file_path)} target="_blank" rel="noreferrer" className="btn-icon">
                                                        <Eye size={16} />
                                                    </a>
                                                    <button className="btn-icon" onClick={() => window.open(getFileUrl(doc.file_path))}>
                                                        <Download size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No documents in this folder.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '0' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Upload to {activeFolder}</h2>
                            <button onClick={() => setIsUploadModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleUpload} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {activeFolder !== 'Policies' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: '500' }}>Target Employee</label>
                                    <select
                                        className="input-field"
                                        required
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                    >
                                        <option value="">Select an employee...</option>
                                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500' }}>Select File</label>
                                <input
                                    type="file"
                                    className="input-field"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    required
                                />
                            </div>

                            {activeFolder !== 'Policies' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: '500' }}>E-Sign Status</label>
                                    <select
                                        className="input-field"
                                        value={docStatus}
                                        onChange={(e) => setDocStatus(e.target.value)}
                                    >
                                        <option value="Pending">Pending Signature</option>
                                        <option value="Signed">Already Signed</option>
                                    </select>
                                </div>
                            )}

                            <button type="submit" className="btn-primary" disabled={uploading}>
                                {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                                {uploading ? 'Uploading...' : 'Upload & Notify'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .btn-primary {
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .btn-icon {
                    padding: 8px;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    background: white;
                    cursor: pointer;
                    color: var(--text-main);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .btn-icon:hover { background: #F9FAFB; }
                .input-field {
                    padding: 10px;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    font-size: 14px;
                }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </Layout>
    );
};

export default HRDocumentsPage;
