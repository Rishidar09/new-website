import React from 'react';
import EmployeeSidebar from './EmployeeSidebar';
import Navbar from './Navbar';

const EmployeeLayout = ({ children }) => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F2F5' }}>
            <EmployeeSidebar />
            <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                <main style={{
                    flex: 1,
                    padding: '24px',
                    width: '100%',
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default EmployeeLayout;
