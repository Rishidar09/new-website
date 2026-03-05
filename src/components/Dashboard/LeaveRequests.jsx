import React from 'react';

const mockRequests = [
    { id: 1, name: 'Sarah Collins', type: 'Vacation', status: 'pending', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 2, name: 'Mark Johnson', type: 'Sick Leave', status: 'approved', avatar: 'https://i.pravatar.cc/150?u=mark' },
    { id: 3, name: 'Lisa Wong', type: 'Personal Leave', status: 'rejected', avatar: 'https://i.pravatar.cc/150?u=lisa' },
    { id: 4, name: 'John Miller', type: 'Work From Home', status: 'approved', avatar: 'https://i.pravatar.cc/150?u=john' },
];

const LeaveRequests = () => {
    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px' }}>Leave Requests</h3>
                <a href="#" style={{ fontSize: '14px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>View All</a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {mockRequests.map((req) => (
                    <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={req.avatar} alt={req.name} className="avatar" />
                            <div>
                                <p style={{ fontWeight: '600', fontSize: '14px' }}>{req.name}</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{req.type}</p>
                            </div>
                        </div>
                        <span className={`status-badge ${req.status}`}>
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeaveRequests;
