import React from 'react';

const Announcements = () => {
    return (
        <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Announcements</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '4px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src="https://i.pravatar.cc/150?u=admin1" className="avatar" style={{ width: '32px', height: '32px' }} />
                        <div>
                            <p style={{ fontWeight: '600', fontSize: '14px' }}>Remote Work Policy Update</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                                Our remote work guidelines have been updated. <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Read More</a>
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '4px', background: '#E5E7EB', borderRadius: '4px' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src="https://i.pravatar.cc/150?u=admin2" className="avatar" style={{ width: '32px', height: '32px' }} />
                        <div>
                            <p style={{ fontWeight: '600', fontSize: '14px' }}>Quarterly All-Hands Meeting Scheduled</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                                Our next all-hands meeting is scheduled for April 30th.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Announcements;
