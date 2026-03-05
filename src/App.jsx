import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HRDashboard from './pages/HRDashboard';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/hr/dashboard" element={<HRDashboard />} />
        <Route path="/hr/employees" element={<EmployeesPage />} />
        <Route path="/hr/employees/:id" element={<EmployeeProfilePage />} />
        <Route path="/" element={<Navigate to="/hr/dashboard" replace />} />
        {/* Fallback for components in progress */}
        <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
