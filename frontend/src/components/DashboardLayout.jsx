import React, { useState } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import LogoutModal from "./LogoutModal.jsx";
import ProfileImageOrInitials from "./ProfileImageOrInitials.jsx";

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
              {/* Profile Button */}
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-white/20"
                title="View Profile"
              >
                <ProfileImageOrInitials
                  src={user.profilePicture}
                  alt={user.name}
                  initials={user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U"}
                  className="w-10 h-10 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-colors"
                  avatarColorClass="bg-blue-500"
                />
                <div className="hidden md:block text-left">
                  <p className="text-white font-medium text-sm truncate max-w-32">{user.name || "User"}</p>
                  <p className="text-blue-100 text-xs">View Profile</p>
                </div>
                <svg className="hidden md:block w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
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
