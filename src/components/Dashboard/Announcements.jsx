import React from 'react';

const Announcements = ({ announcements = [] }) => {
    return (
        <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Announcements</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {announcements.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '14px', padding: '20px' }}>No new announcements</p>
                ) : (
                    announcements.map((ann) => (
                        <div key={ann.id} style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ width: '4px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img src={ann.author_avatar || `https://i.pravatar.cc/150?u=${ann.id}`} className="avatar" style={{ width: '32px', height: '32px' }} />
                                <div>
                                    <p style={{ fontWeight: '600', fontSize: '14px' }}>{ann.title}</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                                        {ann.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Announcements;
