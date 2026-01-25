import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { useAuth } from "../../context/UserContext.jsx";
import ProfileImageOrInitials from "../ProfileImageOrInitials.jsx";

const Header = ({ onLogout }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const hideTimeoutRef = React.useRef(null);

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

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "S"
    );
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 min-w-0 border-b border-blue-400 pb-3 sm:pb-0 mb-3 sm:mb-0 sm:border-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              Welcome back, {user?.name || "Student"}!
            </h1>
            <p className="text-blue-100 mt-1 text-sm sm:text-base">
              Ready to join a learning session?
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
            {/* User Info - Hidden on mobile, shown on larger screens */}
            {/* <div className="hidden sm:block text-right">
              <p className="text-sm text-blue-100">Student</p>
              <p className="font-medium text-sm">
                {user?.name || "Student"}
              </p>
            </div> */}

            {/* Profile Dropdown */}
            <div className="flex-shrink-0 flex items-center gap-2">
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
                    initials={user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U"}
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
                        onClick={() => navigate("/participant/profile")}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3" />
                        View Profile
                      </button>
                      <button
                        onClick={onLogout}
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

        {/* Mobile-only user info */}
        {/* <div className="sm:hidden mt-3 pt-3 border-t border-blue-500/30">
          <p className="text-xs text-blue-200">
            Student ID: {user?.username || user?.email?.split("@")[0] || "N/A"}
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default Header;
