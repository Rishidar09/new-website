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
        employee_id: '',
        designation: '',
        department: 'Unassigned',
        location: '',
        phone: '',
        joining_date: '',
        salary: '',
        personal_email: '',
        emergency_contact: '',
        technology: '',
        experience_years: '',
        aadhaar_card: '',
        pan: '',
        bank_account: '',
        bank_name: '',
        department_id: '',
        manager_id: '',
        onboarding_template_id: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(employeeData?.avatar_url || null);
    const [templates, setTemplates] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [managerOptions, setManagerOptions] = useState([]);

    React.useEffect(() => {
        if (employeeData) {
            setFormData({
                ...employeeData,
                manager_id: employeeData.manager_id || employeeData.reporting_manager_id || '',
                department_id: employeeData.department_id || ''
            });
            setPreviewUrl(employeeData.avatar_url);
            return;
        }

        setFormData({
            full_name: '',
            email: '',
            role: '',
            employee_id: '',
            designation: '',
            department: 'Unassigned',
            location: '',
            phone: '',
            joining_date: '',
            salary: '',
            personal_email: '',
            emergency_contact: '',
            technology: '',
            experience_years: '',
            aadhaar_card: '',
            pan: '',
            bank_account: '',
            bank_name: '',
            department_id: '',
            manager_id: '',
            onboarding_template_id: ''
        });
        setPreviewUrl(null);
    }, [employeeData, isOpen]);

    React.useEffect(() => {
        const fetchLookups = async () => {
            if (!isOpen) return;
            try {
                const [templateData, departmentData, employeesData] = await Promise.all([
                    api.get('/onboarding/templates').catch(() => []),
                    api.get('/departments').catch(() => []),
                    api.get('/employees').catch(() => [])
                ]);

                setTemplates(templateData || []);
                setDepartments(departmentData || []);
                setManagerOptions(
                    (employeesData || []).filter((emp) => !employeeData || emp.id !== employeeData.id)
                );

                if (!employeeData) {
                    const engineering = (departmentData || []).find((dep) => dep.name === 'Engineering');
                    if (engineering) {
                        setFormData((prev) => ({
                            ...prev,
                            department_id: prev.department_id || engineering.id,
                            department: prev.department && prev.department !== 'Unassigned' ? prev.department : engineering.name
                        }));
                    }
                }
            } catch (error) {
                console.error('Failed to load employee lookups', error);
                setTemplates([]);
                setDepartments([]);
                setManagerOptions([]);
            }
        };

        fetchLookups();
    }, [employeeData, isOpen]);

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
                const value = formData[key];
                if (value !== '' && value !== null && value !== undefined) {
                    data.append(key, value);
                }
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
                    employee_id: '',
                    designation: '',
                    department: 'Unassigned',
                    location: '',
                    phone: '',
                    joining_date: '',
                    salary: '',
                    personal_email: '',
                    emergency_contact: '',
                    technology: '',
                    experience_years: '',
                    aadhaar_card: '',
                    pan: '',
                    bank_account: '',
                    bank_name: '',
                    department_id: '',
                    manager_id: '',
                    onboarding_template_id: ''
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
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            overflowY: 'auto'
        }}>
            <div className="card add-employee-modal-card" style={{ width: '100%', maxWidth: '760px', padding: '0', overflow: 'hidden', maxHeight: 'calc(100vh - 40px)', margin: 'auto 0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '20px' }}>{employeeData ? 'Edit Employee Profile' : 'Add New Employee'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="add-employee-modal-form" style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
                    <div className="add-employee-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Employee Code</label>
                            <input
                                name="employee_id"
                                type="text"
                                className="input-field"
                                placeholder="IIT-EMP-001"
                                value={formData.employee_id || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Designation</label>
                            <input
                                name="designation"
                                type="text"
                                className="input-field"
                                placeholder="Software Engineer"
                                value={formData.designation || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Department</label>
                            <select
                                name="department_id"
                                className="input-field"
                                value={formData.department_id || ''}
                                onChange={(e) => {
                                    const selectedDepartment = departments.find((dep) => dep.id === e.target.value);
                                    setFormData((prev) => ({
                                        ...prev,
                                        department_id: e.target.value,
                                        department: selectedDepartment?.name || 'Unassigned'
                                    }));
                                }}
                            >
                                <option value="">Unassigned</option>
                                {departments.map((dep) => (
                                    <option key={dep.id} value={dep.id}>{dep.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Reporting Manager</label>
                            <select
                                name="manager_id"
                                className="input-field"
                                value={formData.manager_id || ''}
                                onChange={handleChange}
                            >
                                <option value="">No manager</option>
                                {managerOptions.map((manager) => (
                                    <option key={manager.id} value={manager.id}>{manager.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Location</label>
                            <input
                                name="location"
                                type="text"
                                className="input-field"
                                placeholder="Hyderabad"
                                value={formData.location || ''}
                                onChange={handleChange}
                            />
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
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Annual Salary (INR)</label>
                            <input
                                name="salary"
                                type="number"
                                className="input-field"
                                placeholder="Enter annual salary"
                                required
                                value={formData.salary}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Personal Email</label>
                            <input
                                name="personal_email"
                                type="email"
                                className="input-field"
                                placeholder="john.personal@gmail.com"
                                value={formData.personal_email || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Emergency Contact</label>
                            <input
                                name="emergency_contact"
                                type="text"
                                className="input-field"
                                placeholder="+91XXXXXXXXXX"
                                value={formData.emergency_contact || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Technology</label>
                            <input
                                name="technology"
                                type="text"
                                className="input-field"
                                placeholder="Frontend / Backend / QA"
                                value={formData.technology || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Experience (Years)</label>
                            <input
                                name="experience_years"
                                type="number"
                                step="0.1"
                                min="0"
                                className="input-field"
                                placeholder="2.5"
                                value={formData.experience_years || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Aadhaar Number</label>
                            <input
                                name="aadhaar_card"
                                type="text"
                                className="input-field"
                                placeholder="XXXX XXXX XXXX"
                                value={formData.aadhaar_card || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>PAN Number</label>
                            <input
                                name="pan"
                                type="text"
                                className="input-field"
                                placeholder="ABCDE1234F"
                                value={formData.pan || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Bank Account Number</label>
                            <input
                                name="bank_account"
                                type="text"
                                className="input-field"
                                placeholder="123456789012"
                                value={formData.bank_account || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Bank Name</label>
                            <input
                                name="bank_name"
                                type="text"
                                className="input-field"
                                placeholder="HDFC"
                                value={formData.bank_name || ''}
                                onChange={handleChange}
                            />
                        </div>
                        {!employeeData && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500' }}>Onboarding Template (Optional)</label>
                                <select
                                    name="onboarding_template_id"
                                    className="input-field"
                                    value={formData.onboarding_template_id || ''}
                                    onChange={handleChange}
                                >
                                    <option value="">No template</option>
                                    {templates.map((template) => (
                                        <option key={template.id} value={template.id}>{template.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="employee-photo-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
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
                                        <img src={previewUrl.startsWith('blob:') ? previewUrl : `${previewUrl}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
            <style>{`
                @media (max-width: 768px) {
                    .add-employee-grid {
                        grid-template-columns: 1fr !important;
                        gap: 14px !important;
                    }

                    .employee-photo-field {
                        grid-column: span 1 !important;
                    }

                    .add-employee-modal-card {
                        max-height: calc(100vh - 20px) !important;
                    }

                    .add-employee-modal-form {
                        max-height: calc(100vh - 120px) !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default AddEmployeeModal;
