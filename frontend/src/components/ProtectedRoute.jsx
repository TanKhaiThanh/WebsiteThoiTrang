import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Đang tải...</div>;
    }

    if (!user) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles && roles.length > 0 && !roles.includes(user.role)) {
        // Redirect to forbidden page if not authorized
        return <Navigate to="/403" replace />;
    }

    return children;
};

export default ProtectedRoute;
