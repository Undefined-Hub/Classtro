import React, { useState } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import LogoutModal from "./LogoutModal.jsx";

function DashboardLayout() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem("user")) || {
    name: "Teacher",
    role: "TEACHER",
    email: "teacher@example.com",
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // Clear user data and token
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    // Close the modal
    setShowLogoutModal(false);
    // Redirect to login page
    navigate("/login");
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
              <p className="text-blue-100">Welcome back, {user.name}</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-150"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center space-x-4">
            <NavLink
              to="/dashboard/rooms"
              className={({ isActive }) =>
                `py-4 px-2 text-sm font-medium border-b-2 ${
                  isActive
                    ? "text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500"
                    : "text-gray-500 dark:text-gray-400 border-transparent hover:text-blue-600 dark:hover:text-blue-500"
                }`
              }
            >
              My Rooms
            </NavLink>
            <NavLink
              to="/dashboard/sessions"
              className={({ isActive }) =>
                `py-4 px-2 text-sm font-medium border-b-2 ${
                  isActive
                    ? "text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500"
                    : "text-gray-500 dark:text-gray-400 border-transparent hover:text-blue-600 dark:hover:text-blue-500"
                }`
              }
            >
              All Sessions
            </NavLink>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <Outlet />
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

export default DashboardLayout;
