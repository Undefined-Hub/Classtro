import React, { useState } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import LogoutModal from "./LogoutModal.jsx";
import ProfileImageOrInitials from "./ProfileImageOrInitials.jsx";

function DashboardLayout() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hideTimeoutRef = React.useRef(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowProfileDropdown(false);
    };

    if (showProfileDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showProfileDropdown]);

  // Handle mouse enter with immediate show
  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowProfileDropdown(true);
  };

  // Handle mouse leave with delay
  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowProfileDropdown(false);
    }, 150); // 150ms delay before hiding
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

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
              {/* Profile Dropdown */}
              <div 
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileDropdown(!showProfileDropdown);
                }}
              >
                <div
                  className="p-1 rounded-full hover:bg-white/10 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-white/20"
                  title="Profile Options"
                >
                  <ProfileImageOrInitials
                    src={user.profilePicture}
                    alt={user.name}
                    name={user?.name}
                    className="w-8 h-8 sm:w-14 sm:h-14 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-colors cursor-pointer"
                    avatarColorClass="bg-blue-500"
                    textSizeClass="text-lg"
                  />
                </div>
                

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <>
                    {/* Invisible bridge to prevent gap issues */}
                    <div className="absolute right-0 top-full h-1 w-full"></div>
                    <div className="absolute left-0 sm:right-0 sm:left-auto mt-1 w-40 sm:w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <button
                      onClick={() => navigate("/teacher/profile")}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <User className="w-4 h-4 mr-3" />
                      View Profile
                    </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
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
              All Quizzes
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
