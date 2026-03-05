import React, { useState } from 'react';
import EmployeeTable from '../components/Employees/EmployeeTable';
import AddEmployeeModal from '../components/Employees/AddEmployeeModal';
import { CreditCard, Users, Printer } from 'lucide-react';
import IDCard from '../components/IDCard';
import { api } from '../lib/api';

const EmployeesPage = () => {
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'id-cards'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState(null);
    const [employees, setEmployees] = useState([]);

    const handleDataLoaded = (data) => {
        setEmployees(data);
    };

    const handleEdit = (employee) => {
        setEmployeeToEdit(employee);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEmployeeToEdit(null);
    };

    const handleBulkPrint = () => {
        window.print();
    };

    return (
        <>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '24px', color: 'var(--text-main)', fontWeight: '700' }}>Workforce Management</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                        Manage employees, view details, and issue digital identity cards.
                    </p>
                </div>

                {activeTab === 'id-cards' && (
                    <button
                        onClick={handleBulkPrint}
                        className="btn-bulk"
                    >
                        <Printer size={18} />
                        Bulk Print All IDs
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <button
                    onClick={() => setActiveTab('list')}
                    style={{
                        padding: '12px 4px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: activeTab === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'list' ? '2px solid var(--primary)' : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Users size={18} />
                    Employee Directory
                </button>
                <button
                    onClick={() => setActiveTab('id-cards')}
                    style={{
                        padding: '12px 4px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: activeTab === 'id-cards' ? 'var(--primary)' : 'var(--text-muted)',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'id-cards' ? '2px solid var(--primary)' : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <CreditCard size={18} />
                    Digital ID Cards
                </button>
            </div>

            {activeTab === 'list' ? (
                <EmployeeTable
                    onAddClick={() => { setEmployeeToEdit(null); setIsModalOpen(true); }}
                    onEditClick={handleEdit}
                    onDataLoaded={handleDataLoaded}
                />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px', padding: '16px 0' }}>
                    {employees.map(emp => (
                        <div key={emp.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <IDCard employee={emp} />
                            <button
                                onClick={() => window.print()}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: 'white',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Download / Print
                            </button>
                        </div>
                    ))}
                    {employees.length === 0 && (
                        <div className="card" style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No employees found to generate ID cards.
                        </div>
                    )}
                </div>
            )}

            <AddEmployeeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                employeeData={employeeToEdit}
                onRefresh={() => window.location.reload()}
            />

            <style>{`
                .btn-bulk {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                @media print {
                    header, nav, .btn-bulk, button, h1, p, [role="tablist"] { display: none !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                    .main-content { padding: 0 !important; margin: 0 !important; }
                    #digital-id-card { 
                        margin: 20px auto !important; 
                        box-shadow: none !important; 
                        page-break-after: always;
                    }
                }
            `}</style>
        </>
    );
};

export default EmployeesPage;
