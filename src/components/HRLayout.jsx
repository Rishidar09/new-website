import React from 'react';
import HRSidebar from './HRSidebar';
import Navbar from './Navbar';

const HRLayout = ({ children }) => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--main-bg)' }}>
            <div className="no-print">
                <HRSidebar />
            </div>
            <div className="main-content-wrapper" style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
                <div className="no-print">
                    <Navbar />
                </div>
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
            <style>{`
                @media print {
                    aside, nav, .no-print { display: none !important; }
                    .main-content-wrapper { margin-left: 0 !important; }
                    main { padding: 0 !important; margin: 0 !important; max-width: none !important; }
                    body { 
                        background: white !important; 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default HRLayout;
