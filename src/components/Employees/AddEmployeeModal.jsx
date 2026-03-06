import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

const AddEmployeeModal = ({ isOpen, onClose, onRefresh, employeeData = null }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(employeeData || {
        full_name: '',
        email: '',
        role: '',
        department: 'Engineering',
        phone: '',
        joining_date: '',
        salary: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(employeeData?.avatar_url || null);

    React.useEffect(() => {
        if (employeeData) {
            setFormData(employeeData);
            setPreviewUrl(employeeData.avatar_url);
        }
    }, [employeeData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Phone number validation: Allow only +, space, and digits
        if (name === 'phone') {
            const cleanedValue = value.replace(/[^\d+ ]/g, '');
            setFormData(prev => ({ ...prev, [name]: cleanedValue }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final phone validation: pattern check (+ country code followed by 10 digits)
        const phoneRegex = /^\+\d+\s\d{10}$|^\+\d{12}$/;
        if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
            toast.error('Invalid phone format. Please use: +[CountryCode] [10 Digits]');
            return;
        }

        try {
            setLoading(true);
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            if (avatarFile) {
                data.append('avatar', avatarFile);
            }

            if (employeeData) {
                await api.patch(`/employees/${employeeData.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Employee profile updated successfully!');
            } else {
                await api.post('/employees', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('New employee recruited successfully!');
            }
            onRefresh();
            onClose();
            if (!employeeData) {
                setFormData({
                    full_name: '',
                    email: '',
                    role: '',
                    department: 'Engineering',
                    phone: '',
                    joining_date: '',
                    salary: ''
                });
                setAvatarFile(null);
                setPreviewUrl(null);
            }
        } catch (error) {
            toast.error('Action failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '20px' }}>{employeeData ? 'Edit Employee Profile' : 'Add New Employee'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Full Name</label>
                            <input
                                name="full_name"
                                type="text"
                                className="input-field"
                                placeholder="John Doe"
                                required
                                value={formData.full_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Email Address</label>
                            <input
                                name="email"
                                type="email"
                                className="input-field"
                                placeholder="john@indusinnovate.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Role</label>
                            <input
                                name="role"
                                type="text"
                                className="input-field"
                                placeholder="Software Engineer"
                                required
                                value={formData.role}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Department</label>
                            <select
                                name="department"
                                className="input-field"
                                value={formData.department}
                                onChange={handleChange}
                            >
                                <option>Engineering</option>
                                <option>Sales</option>
                                <option>Marketing</option>
                                <option>Design</option>
                                <option>Human Resources</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Phone Number</label>
                            <input
                                name="phone"
                                type="tel"
                                className="input-field"
                                placeholder="+1 2345678901"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                title="Please enter country code followed by 10 digits (e.g., +1 1234567890)"
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Joining Date</label>
                            <input
                                name="joining_date"
                                type="date"
                                className="input-field"
                                required
                                value={formData.joining_date}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Annual Salary</label>
                            <input
                                name="salary"
                                type="number"
                                className="input-field"
                                placeholder="75000"
                                required
                                value={formData.salary}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Employee Photo</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: '#F3F4F6',
                                    overflow: 'hidden',
                                    border: '2px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {previewUrl ? (
                                        <img src={previewUrl.startsWith('blob:') ? previewUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${previewUrl}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No Photo</span>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ fontSize: '14px' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <button type="button" onClick={onClose} disabled={loading} style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: '#F3F4F6',
                            color: '#000000',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--primary)',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}>
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            {loading ? (employeeData ? 'Updating...' : 'Creating...') : (employeeData ? 'Update Profile' : 'Create Employee')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
