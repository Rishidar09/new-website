import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const data = [
    { name: 'Active', value: 108, color: '#3B82F6' },
    { name: 'On Leave', value: 82, color: '#FBBF24' },
    { name: 'Inactive', value: 54, color: '#9CA3AF' },
];

const AttendanceChart = () => {
    return (
        <div className="card" style={{ height: '400px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>Employees Overview</h3>
            <ResponsiveContainer width="100%" height="80%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '20px' }}>
                {data.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: item.color }}></div>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AttendanceChart;
