import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main style={{
                marginLeft: '240px',
                flex: 1,
                minHeight: '100vh',
                padding: '32px',
                background: '#F3F4F6'
            }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
