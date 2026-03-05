import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import {
    Folder,
    FileText,
    Download,
    Eye,
    CheckCircle,
    Clock,
    Files,
    Loader2
} from 'lucide-react';

const EmployeeDocumentsPage = () => {
    const [activeFolder, setActiveFolder] = useState('NDA');
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employee, setEmployee] = useState(null);

    const folders = ['NDA', 'Contracts', 'Offer Letters', 'Policies'];

    useEffect(() => {
        fetchEmployeeAndDocs();
    }, [activeFolder]);

    const fetchEmployeeAndDocs = async () => {
        try {
            setLoading(true);
            const data = await api.get(`/documents?folder=${activeFolder}`);
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFileUrl = (path) => {
        return path;
    };

    return (
        <Layout>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Files size={24} color="var(--primary)" /> My Documents
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Securely access your employment records and company policies.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px' }}>
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

                {/* File Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" color="var(--primary)" /></div>
                    ) : documents.length > 0 ? (
                        documents.map((doc) => (
                            <div key={doc.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ background: '#F3F4F6', padding: '10px', borderRadius: '10px' }}>
                                        <FileText size={24} color="var(--primary)" />
                                    </div>
                                    <span className={`badge ${doc.status === 'Signed' ? 'badge-active' : 'badge-pending'}`} style={{ fontSize: '11px' }}>
                                        {doc.status}
                                    </span>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{doc.name}</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Uploaded on {new Date(doc.created_at).toLocaleDateString()}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                    <a
                                        href={getFileUrl(doc.file_path)}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ flex: 1, textDecoration: 'none' }}
                                    >
                                        <button className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <Eye size={16} /> View
                                        </button>
                                    </a>
                                    <button className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => window.open(getFileUrl(doc.file_path))}>
                                        <Download size={16} /> Download
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="card" style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No documents found in this folder.
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .btn-secondary {
                    background: white;
                    color: var(--text-main);
                    border: 1px solid var(--border);
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                }
                .btn-secondary:hover { background: #F9FAFB; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </Layout>
    );
};

export default EmployeeDocumentsPage;
