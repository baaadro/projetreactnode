import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="text-center mt-5">Chargement...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        if (user.role === 'etudiant') {
            return <Navigate to="/student/dashboard" />;
        } else if (user.role === 'admin') {
            return <Navigate to="/admin/dashboard" />;
        }
        return <Navigate to="/login" />;
    }

    return children;
};

export default PrivateRoute;