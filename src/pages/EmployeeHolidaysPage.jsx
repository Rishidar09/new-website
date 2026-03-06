import React, { useState, useEffect } from 'react';
import HolidayCalendar from '../components/Holidays/HolidayCalendar';
import { api } from '../lib/api';
import { Calendar as CalendarIcon, Loader2, PartyPopper } from 'lucide-react';

const EmployeeHolidaysPage = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                setLoading(true);
                const data = await api.get('/holidays');
                setHolidays(data || []);
            } catch (error) {
                console.error('Error fetching holidays:', error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchHolidays();
    }, []);

    const upcomingHolidays = holidays.filter(h => new Date(h.date) >= new Date()).slice(0, 5);

    return (
        <>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CalendarIcon size={24} color="var(--primary)" /> Holiday Calendar
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                    View upcoming holidays and plan your time.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
                <div className="card" style={{ padding: '24px' }}>
                    {loading ? (
                        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                        </div>
                    ) : (
                        <HolidayCalendar holidays={holidays} />
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <PartyPopper size={18} color="#EF4444" /> Upcoming Holidays
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {upcomingHolidays.map((holiday) => (
                                <div key={holiday.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F9FAFB', borderRadius: '8px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'var(--card-bg)',
                                        color: 'var(--text-main)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#EF4444', textTransform: 'uppercase' }}>
                                            {new Date(holiday.date).toLocaleString('default', { month: 'short' })}
                                        </span>
                                        <span style={{ fontSize: '14px', fontWeight: '800' }}>
                                            {new Date(holiday.date).getDate()}
                                        </span>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: '600' }}>{holiday.name}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{holiday.type}</p>
                                    </div>
                                </div>
                            ))}
                            {upcomingHolidays.length === 0 && !loading && (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', padding: '20px' }}>No upcoming holidays.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </>
    );
};

export default EmployeeHolidaysPage;
