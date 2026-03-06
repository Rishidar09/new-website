import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Eye, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const EmployeeTable = ({ onAddClick, onEditClick, onDataLoaded }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const data = await api.get('/employees');
            setEmployees(data || []);
            if (onDataLoaded) onDataLoaded(data || []);
        } catch (error) {
            console.error('Error fetching employees:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.department?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDept = departmentFilter === 'All' || emp.department === departmentFilter;

        return matchesSearch && matchesDept;
    });

    return (
        <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            outline: 'none',
                            fontSize: '14px'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'white',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    >
                        <option value="All">All Departments</option>
                        <option>Engineering</option>
                        <option>Sales</option>
                        <option>Marketing</option>
                        <option>Design</option>
                        <option>Human Resources</option>
                    </select>
                    <button
                        onClick={onAddClick}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--primary)',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        <Plus size={18} />
                        Add Employee
                    </button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employee</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role & Department</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Joined Date</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading employees...</td>
                            </tr>
                        ) : filteredEmployees.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</td>
                            </tr>
                        ) : filteredEmployees.map((emp) => (
                            <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '12px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <img src={emp.avatar_url ? (emp.avatar_url.startsWith('http') ? emp.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${emp.avatar_url}`) : `https://i.pravatar.cc/150?u=${emp.id}`} alt={emp.full_name} className="avatar" />
                                        <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{emp.full_name}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '12px 24px' }}>
                                    <p style={{ fontSize: '14px', fontWeight: '500' }}>{emp.role}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.department}</p>
                                </td>
                                <td style={{ padding: '12px 24px' }}>
                                    <span className={`status-badge ${(emp.status || 'Active').toLowerCase().replace(' ', '-')}`}>
                                        {emp.status || 'Active'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 24px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    {new Date(emp.joining_date).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        <button
                                            onClick={() => navigate(`/hr/employees/${emp.id}`)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => onEditClick(emp)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style>{`
        .status-badge.on-leave { background: #FEF3C7; color: #D97706; }
        .status-badge.active { background: #D1FAE5; color: #059669; }
      `}</style>
        </div>
    );
};

export default EmployeeTable;
