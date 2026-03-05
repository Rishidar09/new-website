import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import {
    Users,
    UserMinus,
    Briefcase,
    Clock,
    TrendingUp,
    BarChart3,
    PieChart as PieChartIcon,
    Loader2
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

const HRAnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        headcount: 0,
        attrition: 0,
        openPositions: 12, // Mock or derived
        avgTenure: 0,
    });
    const [deptData, setDeptData] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [leaveData, setLeaveData] = useState([]);
    const [absentees, setAbsentees] = useState([]);

    const COLORS = ['#3B82F6', '#94A3B8', '#60A5FA', '#CBD5E1', '#1D4ED8'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await api.get('/analytics');

            setStats({
                headcount: data.headcount,
                attrition: data.attrition,
                openPositions: data.openPositions,
                avgTenure: data.avgTenure || 2.4
            });
            setDeptData(data.deptData || []);
            setLeaveData(data.leaveData || []);
            setAbsentees(data.absentees || []);

            setTrendData([
                { month: 'Jan', joining: 4, exit: 1 },
                { month: 'Feb', joining: 6, exit: 2 },
                { month: 'Mar', joining: 8, exit: 3 },
                { month: 'Apr', joining: 5, exit: 1 },
                { month: 'May', joining: 9, exit: 2 },
                { month: 'Jun', joining: 7, exit: 1 },
            ]);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 className="animate-spin" color="var(--primary)" size={48} />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingUp size={24} color="var(--primary)" /> HR Analytics
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Strategic insights into workforce and operations.</p>
            </div>

            {/* KPI Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                {[
                    { label: 'Total Headcount', value: stats.headcount, icon: <Users color="#3B82F6" />, trend: '+4% vs last month' },
                    { label: 'Attrition Rate', value: `${stats.attrition}%`, icon: <UserMinus color="#94A3B8" />, trend: '-0.5% vs last year' },
                    { label: 'Open Positions', value: stats.openPositions, icon: <Briefcase color="#3B82F6" />, trend: '8 active listings' },
                    { label: 'Avg Tenure', value: `${stats.avgTenure}Y`, icon: <Clock color="#94A3B8" />, trend: '+0.2Y increase' },
                ].map((kpi, i) => (
                    <div key={i} className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ background: '#F0F7FF', padding: '12px', borderRadius: '12px' }}>{kpi.icon}</div>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>{kpi.label}</p>
                        <h3 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>{kpi.value}</h3>
                        <p style={{ fontSize: '12px', color: i === 1 ? '#EF4444' : '#10B981', fontWeight: '500' }}>{kpi.trend}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={18} color="var(--primary)" /> Department Wise Headcount
                    </h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PieChartIcon size={18} color="var(--primary)" /> Leave Type Breakdown
                    </h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={leaveData}
                                    innerRadius={60}
                                    style={{ outline: 'none' }}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {leaveData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Monthly Joining vs Exit Trend
                    </h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="joining" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="exit" stroke="#94A3B8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px' }}>
                        Top Absentees (Current Month)
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ paddingBottom: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>EMPLOYEE</th>
                                <th style={{ paddingBottom: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>DAYS OFF</th>
                            </tr>
                        </thead>
                        <tbody>
                            {absentees.length > 0 ? absentees.map((abs, i) => (
                                <tr key={i} style={{ borderBottom: i === absentees.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                                    <td style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500' }}>{abs.name}</td>
                                    <td style={{ padding: '12px 0', fontSize: '14px', textAlign: 'right' }}>
                                        <span style={{ background: '#FEF2F2', color: '#EF4444', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                                            {abs.count} Days
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="2" style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No absenteeism data for this month.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </Layout>
    );
};

export default HRAnalyticsPage;
