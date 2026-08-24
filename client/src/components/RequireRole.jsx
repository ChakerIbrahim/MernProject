import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequireRole({ roles, children }) {
    const { user } = useAuth();

    if (!user || !roles.includes(user.role)) {
        if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user?.role === 'organization') return <Navigate to="/org/dashboard" replace />;
        if (user?.role === 'individual') return <Navigate to="/dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
}
