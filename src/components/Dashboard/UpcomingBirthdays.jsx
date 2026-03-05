import React from 'react';
import { Cake } from 'lucide-react';

const mockBirthdays = [
    { id: 1, name: 'Emma Johnson', role: 'Sales', date: 'April 26', avatar: 'https://i.pravatar.cc/150?u=emma' },
    { id: 2, name: 'Jessica Lee', role: 'Customer Support', date: 'April 28', avatar: 'https://i.pravatar.cc/150?u=jessica' },
    { id: 3, name: 'Michael Brown', role: 'Software Engineer', date: 'May 3', avatar: 'https://i.pravatar.cc/150?u=michael' },
];

const UpcomingBirthdays = () => {
    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px' }}>Upcoming Birthdays</h3>
                <Cake size={18} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {mockBirthdays.map((person) => (
                    <div key={person.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={person.avatar} alt={person.name} className="avatar" />
                            <div>
                                <p style={{ fontWeight: '600', fontSize: '14px' }}>{person.name}</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{person.role}</p>
                            </div>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{person.date}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UpcomingBirthdays;
