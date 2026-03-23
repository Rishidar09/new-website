import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import {
    Folder,
    File,
    Upload,
    Search,
    MoreVertical,
    FolderPlus,
    Share2,
    Trash2,
    Download,
    ChevronRight,
    HardDrive,
    Users,
    ShieldAlert,
    Loader2,
    FileText,
    Image as ImageIcon,
    FileCode,
    Plus,
    Edit3
} from 'lucide-react';

const DrivePage = () => {
    const [contents, setContents] = useState({ folders: [], files: [] });
    const [storageUsage, setStorageUsage] = useState({ used_bytes: 0, quota_bytes: 10 * 1024 * 1024 * 1024 });
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState([]); // Array of { id, name }
    const [viewType, setViewType] = useState('my'); // 'my', 'shared', 'company', 'hr'
    const [searchTerm, setSearchTerm] = useState('');
    const [contextMenu, setContextMenu] = useState(null); // { x, y, item, isFolder }
    const fileInputRef = useRef(null);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setUserRole(user?.role || '');
        fetchContents();
        fetchStorageUsage();
    }, [viewType, currentPath.length]);

    const fetchContents = async () => {
        try {
            setLoading(true);
            const folderId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;
            const data = await api.get(`/drive/contents?type=${viewType}${folderId ? `&folder_id=${folderId}` : ''}`);
            setContents(data);
        } catch (error) {
            console.error('Error fetching drive:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStorageUsage = async () => {
        try {
            const usage = await api.get('/drive/storage-usage');
            setStorageUsage({
                used_bytes: Number(usage?.used_bytes || 0),
                quota_bytes: Number(usage?.quota_bytes || 10 * 1024 * 1024 * 1024),
            });
        } catch (error) {
            console.error('Error fetching storage usage:', error);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        const currentFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;
        if (currentFolderId) formData.append('folder_id', currentFolderId);

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('/api/drive/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) fetchContents();
            if (res.ok) fetchStorageUsage();
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const handleCreateFolder = async () => {
        const name = prompt('Enter folder name:');
        if (!name) return;

        const parentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;
        try {
            await api.post('/drive/folder', {
                name,
                parent_id: parentId,
                is_company: viewType === 'company',
                is_hr_only: viewType === 'hr'
            });
            fetchContents();
        } catch (error) {
            console.error('Folder creation failed:', error);
        }
    };

    const handleDelete = async (id, isFolder) => {
        if (!window.confirm(`Are you sure you want to delete this ${isFolder ? 'folder' : 'file'}?`)) return;
        try {
            if (isFolder) {
                // Implement folder delete route if needed
                alert('Folder deletion not implemented in this demo');
            } else {
                await api.delete(`/drive/files/${id}`);
                fetchContents();
                fetchStorageUsage();
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const usagePercent = storageUsage.quota_bytes > 0
        ? Math.min(100, (storageUsage.used_bytes / storageUsage.quota_bytes) * 100)
        : 0;

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mime) => {
        if (mime?.includes('image')) return <ImageIcon size={20} color="#3B82F6" />;
        if (mime?.includes('pdf')) return <FileText size={20} color="#EF4444" />;
        if (mime?.includes('code') || mime?.includes('javascript')) return <FileCode size={20} color="#F59E0B" />;
        return <File size={20} color="#94A3B8" />;
    };

    return (
        <>
            <div style={{ height: 'calc(100vh - 140px)', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
                {/* Left Sidebar Tree */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <NavButton active={viewType === 'my'} icon={<HardDrive size={18} />} label="My Files" onClick={() => { setViewType('my'); setCurrentPath([]); }} />
                        <NavButton active={viewType === 'shared'} icon={<Users size={18} />} label="Shared With Me" onClick={() => { setViewType('shared'); setCurrentPath([]); }} />
                        <NavButton active={viewType === 'company'} icon={<Plus size={18} />} label="Company Folder" onClick={() => { setViewType('company'); setCurrentPath([]); }} />
                        {(userRole === 'hr' || userRole === 'admin') && <NavButton active={viewType === 'hr'} icon={<ShieldAlert size={18} />} label="HR Documents" onClick={() => { setViewType('hr'); setCurrentPath([]); }} />}
                    </div>

                    <div className="card" style={{ padding: '20px', marginTop: 'auto' }}>
                        <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>Storage Usage</p>
                        <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                            <div style={{ width: `${usagePercent}%`, height: '100%', background: 'var(--primary)' }}></div>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {`${formatSize(storageUsage.used_bytes)} of ${formatSize(storageUsage.quota_bytes)} used`}
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Header Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Cloud Drive</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                <ChevronRight size={16} />
                                {currentPath.length === 0 ? viewType.charAt(0).toUpperCase() + viewType.slice(1) : currentPath.map((p, i) => (
                                    <span key={p.id} onClick={() => setCurrentPath(currentPath.slice(0, i + 1))} style={{ cursor: 'pointer', hover: { color: 'var(--primary)' } }}>{p.name}</span>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Search files..."
                                    style={{ paddingLeft: '40px', width: '240px' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button onClick={handleCreateFolder} className="btn-secondary" style={{ padding: '10px' }}><FolderPlus size={18} /></button>
                            <button onClick={() => fileInputRef.current.click()} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px' }}>
                                <Upload size={18} />
                                Upload
                            </button>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleUpload} />
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="card" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Loader2 className="animate-spin" color="var(--primary)" /></div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                                {/* Folders */}
                                {contents.folders.map(folder => (
                                    <div
                                        key={folder.id}
                                        onClick={() => setCurrentPath([...currentPath, { id: folder.id, name: folder.name }])}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            hover: { background: '#F8FAFC' }
                                        }}
                                        className="file-card"
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <Folder size={28} color="#94A3B8" fill="#F1F5F9" />
                                            <MoreVertical size={16} color="var(--text-muted)" />
                                        </div>
                                        <p style={{ fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.name}</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Folder</p>
                                    </div>
                                ))}

                                {/* Files */}
                                {contents.files.map(file => (
                                    <div
                                        key={file.id}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            position: 'relative',
                                            transition: 'all 0.2s'
                                        }}
                                        className="file-card"
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            {getFileIcon(file.mime_type)}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(file.id, false);
                                                }}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatSize(file.size)}</p>
                                            <a
                                                href={`/api/drive/download/${file.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}
                                            >
                                                <Download size={14} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .file-card:hover {
                    background: #F8FAFC;
                    transform: translateY(-2px);
                    border-color: var(--primary-light);
                }
            `}</style>
        </>
    );
};

const NavButton = ({ active, icon, label, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            background: active ? 'var(--primary-light)' : 'transparent',
            color: active ? 'var(--primary)' : 'var(--text-main)',
            fontWeight: active ? '700' : '600',
            fontSize: '14px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s'
        }}
    >
        {icon}
        {label}
    </button>
);

export default DrivePage;
