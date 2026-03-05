import React, { useState } from 'react';
import Layout from '../components/Layout';
import EmployeeTable from '../components/Employees/EmployeeTable';
import AddEmployeeModal from '../components/Employees/AddEmployeeModal';

const EmployeesPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    return (
        <Layout>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '24px', color: 'var(--text-main)' }}>Employees</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                        Manage your workforce and view employee details.
                    </p>
                </div>
            </div>

            <EmployeeTable key={refreshKey} onAddClick={() => setIsModalOpen(true)} />

            <AddEmployeeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onRefresh={handleRefresh}
            />
        </Layout>
    );
};

export default EmployeesPage;
