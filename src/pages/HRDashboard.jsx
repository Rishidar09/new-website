import React from 'react';
import Layout from '../components/Layout';
import KPICard from '../components/Dashboard/KPICard';
import AttendanceChart from '../components/Dashboard/AttendanceChart';
import LeaveRequests from '../components/Dashboard/LeaveRequests';
import UpcomingBirthdays from '../components/Dashboard/UpcomingBirthdays';
import Announcements from '../components/Dashboard/Announcements';
import { Users, UserPlus, FileText, Gift } from 'lucide-react';

const HRDashboard = () => {
    return (
        <Layout>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--text-main)' }}>HR Dashboard</h1>
            </div>

            <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
                <KPICard
                    title="Total Employees"
                    value="152"
                    icon={<Users size={24} />}
                    color="#3B82F6"
                />
                <KPICard
                    title="New Employees"
                    value="5"
                    icon={<UserPlus size={24} />}
                    color="#F59E0B"
                />
                <KPICard
                    title="Active Leave Requests"
                    value="12"
                    icon={<FileText size={24} />}
                    color="#3B82F6"
                />
                <KPICard
                    title="Upcoming Birthdays"
                    value="3"
                    icon={<Gift size={24} />}
                    color="#F59E0B"
                />
            </div>

            <div className="dashboard-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <AttendanceChart />
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
        </Layout>
    );
};

export default HRDashboard;
