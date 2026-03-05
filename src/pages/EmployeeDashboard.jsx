import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const EmployeeDashboard = () => {
    const { profile } = useAuth();

    return (
        <Layout>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--text-main)' }}>Employee Dashboard</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                    Welcome back, {profile?.email || 'Employee'}
                </p>
            </div>

            <div style={{
                background: 'white',
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                textAlign: 'center'
            }}>
                <h3 style={{ marginBottom: '16px' }}>Your Personalized Dashboard</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                    This area is under construction. Soon you will be able to see your attendance,
                    pay slips, and leave records here.
                </p>
            </div>
        </Layout>
    );
};

export default EmployeeDashboard;
