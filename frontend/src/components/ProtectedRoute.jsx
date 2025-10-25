import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/UserContext.jsx";

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  //Checking Authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-800">
        {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div> */}
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
