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

    React.useEffect(() => {
        if (employeeData) {
            setFormData(employeeData);
        }
    }, [employeeData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (employeeData) {
                await api.patch(`/employees/${employeeData.id}`, formData);
                toast.success('Employee profile updated successfully!');
            } else {
                await api.post('/employees', formData);
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
                                placeholder="+1 234 567 890"
                                value={formData.phone}
                                onChange={handleChange}
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
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <button type="button" onClick={onClose} disabled={loading} style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'white',
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
            <style>{`
        .input-field {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
          outline: none;
          font-size: 14px;
          width: 100%;
        }
        .input-field:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default AddEmployeeModal;
