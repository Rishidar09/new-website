import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HRLayout from './components/HRLayout';
import EmployeeLayout from './components/EmployeeLayout';
import { useAuth } from './context/AuthContext';
import HRDashboard from './pages/HRDashboard';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import ApplyLeavePage from './pages/ApplyLeavePage';
import HRLeavesPage from './pages/HRLeavesPage';
import HRHolidaysPage from './pages/HRHolidaysPage';
import EmployeeHolidaysPage from './pages/EmployeeHolidaysPage';
import HRPayrollPage from './pages/HRPayrollPage';
import EmployeePayslipsPage from './pages/EmployeePayslipsPage';
import HRDocumentsPage from './pages/HRDocumentsPage';
import EmployeeDocumentsPage from './pages/EmployeeDocumentsPage';
import HRAnalyticsPage from './pages/HRAnalyticsPage';
import HRAttendancePage from './pages/HRAttendancePage';
import HRProjectsPage from './pages/HRProjectsPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeAttendancePage from './pages/EmployeeAttendancePage';
import EmployeeProjectsPage from './pages/EmployeeProjectsPage';
import OfferLetterPage from './pages/OfferLetterPage';
import EmployeeIDCardPage from './pages/EmployeeIDCardPage';
import EmployeeComplaintsPage from './pages/EmployeeComplaintsPage';
import HRComplaintsPage from './pages/HRComplaintsPage';
import HRAuditLogsPage from './pages/HRAuditLogsPage';
import ChatPage from './pages/ChatPage';
import MeetingsPage from './pages/MeetingsPage';
import MeetingRoomPage from './pages/MeetingRoomPage';
import DrivePage from './pages/DrivePage';
import { Toaster } from 'react-hot-toast';
import './index.css';

const CommonLayoutWrapper = ({ children }) => {
  const { profile } = useAuth();
  if (profile?.role === 'hr') {
    return <HRLayout>{children}</HRLayout>;
  }
  return <EmployeeLayout>{children}</EmployeeLayout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* HR Routes */}
          <Route path="/hr/*" element={
            <ProtectedRoute requiredRole="hr">
              <HRLayout>
                <Routes>
                  <Route path="dashboard" element={<HRDashboard />} />
                  <Route path="employees" element={<EmployeesPage />} />
                  <Route path="employees/:id" element={<EmployeeProfilePage />} />
                  <Route path="leaves" element={<HRLeavesPage />} />
                  <Route path="attendance" element={<HRAttendancePage />} />
                  <Route path="projects" element={<HRProjectsPage />} />
                  <Route path="holidays" element={<HRHolidaysPage />} />
                  <Route path="offer-letters" element={<OfferLetterPage />} />
                  <Route path="payroll" element={<HRPayrollPage />} />
                  <Route path="documents" element={<HRDocumentsPage />} />
                  <Route path="analytics" element={<HRAnalyticsPage />} />
                  <Route path="complaints" element={<HRComplaintsPage />} />
                  <Route path="audit-logs" element={<HRAuditLogsPage />} />
                  <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
                </Routes>
              </HRLayout>
            </ProtectedRoute>
          } />

          {/* Employee Routes */}
          <Route path="/employee/*" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeLayout>
                <Routes>
                  <Route path="dashboard" element={<EmployeeDashboard />} />
                  <Route path="attendance" element={<EmployeeAttendancePage />} />
                  <Route path="projects" element={<EmployeeProjectsPage />} />
                  <Route path="apply-leave" element={<ApplyLeavePage />} />
                  <Route path="holidays" element={<EmployeeHolidaysPage />} />
                  <Route path="payslips" element={<EmployeePayslipsPage />} />
                  <Route path="documents" element={<EmployeeDocumentsPage />} />
                  <Route path="id-card" element={<EmployeeIDCardPage />} />
                  <Route path="complaints" element={<EmployeeComplaintsPage />} />
                  <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
                </Routes>
              </EmployeeLayout>
            </ProtectedRoute>
          } />

          {/* Common Routes with Dynamic Layout */}
          <Route path="/chat" element={
            <ProtectedRoute>
              <CommonLayoutWrapper>
                <ChatPage />
              </CommonLayoutWrapper>
            </ProtectedRoute>
          } />
          <Route path="/meetings" element={
            <ProtectedRoute>
              <CommonLayoutWrapper>
                <MeetingsPage />
              </CommonLayoutWrapper>
            </ProtectedRoute>
          } />
          <Route path="/meetings/:id" element={
            <ProtectedRoute>
              <CommonLayoutWrapper>
                <MeetingRoomPage />
              </CommonLayoutWrapper>
            </ProtectedRoute>
          } />
          <Route path="/drive" element={
            <ProtectedRoute>
              <CommonLayoutWrapper>
                <DrivePage />
              </CommonLayoutWrapper>
            </ProtectedRoute>
          } />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
