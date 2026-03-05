import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Tag } from 'lucide-react';

const HolidayCalendar = ({ holidays, onHolidaysChange }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filter, setFilter] = useState('All');

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const filteredHolidays = holidays.filter(h => filter === 'All' || h.type === filter);

    const renderHeader = () => {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', minWidth: '150px' }}>
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={prevMonth} className="icon-btn"><ChevronLeft size={18} /></button>
                        <button onClick={nextMonth} className="icon-btn"><ChevronRight size={18} /></button>
                    </div>
                </div>

                <div style={{ display: 'flex', background: '#F3F4F6', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                    {['All', 'National', 'Custom'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                background: filter === type ? 'white' : 'transparent',
                                color: filter === type ? 'var(--primary)' : 'var(--text-muted)',
                                boxShadow: filter === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
                {days.map(day => (
                    <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', paddingBottom: '8px' }}>
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const totalDays = daysInMonth(year, month);
        const firstDay = firstDayOfMonth(year, month);
        const cells = [];

        // Empty cells for alignment
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} style={{ padding: '20px', border: '1px solid #F3F4F6' }}></div>);
        }

        // Actual days
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayHolidays = filteredHolidays.filter(h => h.date === dateStr);
            const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

            cells.push(
                <div key={d} style={{
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #F3F4F6',
                    position: 'relative',
                    background: isToday ? '#F0F7FF' : 'transparent'
                }}>
                    <span style={{
                        fontSize: '14px',
                        fontWeight: isToday ? '700' : '500',
                        color: isToday ? 'var(--primary)' : 'var(--text-main)',
                        display: 'block',
                        marginBottom: '8px'
                    }}>
                        {d}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {dayHolidays.map((h, i) => (
                            <div key={i} style={{
                                background: '#FEE2E2',
                                color: '#991B1B',
                                fontSize: '11px',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }} title={h.name}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }}></div>
                                {h.name}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid #F3F4F6', borderRadius: '12px', overflow: 'hidden' }}>{cells}</div>;
    };

    return (
        <div className="holiday-calendar">
            {renderHeader()}
            {renderDays()}
            {renderCells()}

            <style>{`
        .icon-btn {
          background: white;
          border: 1px solid var(--border);
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .icon-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: #F0F7FF;
        }
      `}</style>
        </div>
    );
};

export default HolidayCalendar;
