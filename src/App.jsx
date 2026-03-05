import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
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
import EmployeeDashboard from './pages/EmployeeDashboard';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* HR Routes */}
          <Route path="/hr/dashboard" element={
            <ProtectedRoute requiredRole="hr">
              <HRDashboard />
            </ProtectedRoute>
          } />
          <Route path="/hr/employees" element={
            <ProtectedRoute requiredRole="hr">
              <EmployeesPage />
            </ProtectedRoute>
          } />
          <Route path="/hr/employees/:id" element={
            <ProtectedRoute requiredRole="hr">
              <EmployeeProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/hr/leaves" element={
            <ProtectedRoute requiredRole="hr">
              <HRLeavesPage />
            </ProtectedRoute>
          } />
          <Route path="/hr/holidays" element={
            <ProtectedRoute requiredRole="hr">
              <HRHolidaysPage />
            </ProtectedRoute>
          } />
          <Route path="/hr/payroll" element={
            <ProtectedRoute requiredRole="hr">
              <HRPayrollPage />
            </ProtectedRoute>
          } />
          <Route path="/hr/documents" element={
            <ProtectedRoute requiredRole="hr">
              <HRDocumentsPage />
            </ProtectedRoute>
          } />

          {/* Employee Routes */}
          <Route path="/employee/dashboard" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/employee/apply-leave" element={
            <ProtectedRoute requiredRole="employee">
              <ApplyLeavePage />
            </ProtectedRoute>
          } />
          <Route path="/employee/holidays" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeHolidaysPage />
            </ProtectedRoute>
          } />
          <Route path="/employee/payslips" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeePayslipsPage />
            </ProtectedRoute>
          } />
          <Route path="/employee/documents" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeDocumentsPage />
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
