import React from "react";
import { useAuth } from "../../context/UserContext.jsx";
import ProfileImageOrInitials from "../ProfileImageOrInitials.jsx"

const Header = ({ onLogout }) => {
  const { user } = useAuth();

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
            <div className="hidden sm:block text-right">
              <p className="text-sm text-blue-100">Student ID</p>
              <p className="font-medium text-sm">
                {user?.username || user?.email?.split("@")[0] || "N/A"}
              </p>
            </div>
            
            {/* Profile Avatar */}
            <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.profilePicture ? (
                <ProfileImageOrInitials
                  src={user.profilePicture}
                  alt="Profile"
                  initials={getInitials(user?.name)}
                />
              ) : (
                <span className="text-sm sm:text-lg font-bold">
                  {getInitials(user?.name)}
                </span>
              )}
            </div>
            <div className="flex-shrink-0 sm:hidden">
              <p className="text-xs text-blue-100">Student ID</p>
              <p className="font-medium  text-sm">
                {user?.username || user?.email?.split("@")[0] || "N/A"}
              </p>
              </div>
            </div>
            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="inline-flex items-center px-3 py-2 sm:px-4 border border-transparent rounded-lg text-xs sm:text-sm font-medium text-red-600 bg-white hover:bg-red-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-150 flex-shrink-0"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2"
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
              <span className="sm:inline">Sign Out</span>
            </button>
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
