import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#F9FAFB'
            }}>
                <div className="loader">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && profile?.role !== requiredRole) {
        // Rule 1 & 2: Redirect unauthorized users to their respective dashboards
        const target = profile?.role === 'hr' ? '/hr/dashboard' : '/employee/dashboard';
        return <Navigate to={target} replace />;
    }

    return children;
};

export default ProtectedRoute;
