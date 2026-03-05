import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import KPICard from '../components/Dashboard/KPICard';
import AttendanceChart from '../components/Dashboard/AttendanceChart';
import LeaveRequests from '../components/Dashboard/LeaveRequests';
import UpcomingBirthdays from '../components/Dashboard/UpcomingBirthdays';
import Announcements from '../components/Dashboard/Announcements';
import { Users, UserPlus, FileText, Gift, Loader2 } from 'lucide-react';
import { CardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const HRDashboard = () => {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        newEmployees: 0,
        activeLeaves: 0,
        upcomingBirthdays: 0
    });
    const [deptData, setDeptData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await api.get('/analytics');
                setStats({
                    totalEmployees: data.headcount || 0,
                    newEmployees: 5,
                    activeLeaves: (data.leaveData || []).reduce((acc, curr) => acc + (parseInt(curr.value) || 0), 0),
                    upcomingBirthdays: 3
                });
                setDeptData(data.deptData || []);
            } catch (error) {
                console.error('Dashboard fetch failed:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '24px', color: 'var(--text-main)' }}>HR Dashboard</h1>
                </div>
                <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
                <div className="dashboard-grid">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </>
        );
    }
    return (
        <>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--text-main)' }}>HR Dashboard</h1>
            </div>

            <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
                <KPICard
                    title="Total Employees"
                    value={stats.totalEmployees.toString()}
                    icon={<Users size={24} />}
                    color="#3B82F6"
                />
                <KPICard
                    title="New Employees"
                    value={stats.newEmployees.toString()}
                    icon={<UserPlus size={24} />}
                    color="#F59E0B"
                />
                <KPICard
                    title="Active Leave Requests"
                    value={stats.activeLeaves.toString()}
                    icon={<FileText size={24} />}
                    color="#3B82F6"
                />
                <KPICard
                    title="Upcoming Birthdays"
                    value={stats.upcomingBirthdays.toString()}
                    icon={<Gift size={24} />}
                    color="#F59E0B"
                />
            </div>

            <div className="dashboard-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <AttendanceChart data={deptData} />
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '24px'
                    }}>
                        <UpcomingBirthdays />
                        <Announcements />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <LeaveRequests />
                </div>
            </div>
        </>
    );
};

export default HRDashboard;
