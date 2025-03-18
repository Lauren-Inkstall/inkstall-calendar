// src/components/ProtectedRoute.js
import React from "react";
import PropTypes from 'prop-types';
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ roles = [] }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0) {
    const hasAccess = roles.some(allowedRole => {
      if (allowedRole === 'super-admin' && userRole === 'super-admin') return true;
      if (allowedRole === 'admin' && (userRole === 'admin' || userRole === 'super-admin')) return true;
      return userRole === allowedRole;
    });
    
    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};

ProtectedRoute.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.string)
};

export default ProtectedRoute;