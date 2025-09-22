import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/UserContext.jsx";

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && Array.isArray(roles) && user && !roles.includes(user.role)) {
    // If role mismatch, you can redirect or render a 403 page
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
