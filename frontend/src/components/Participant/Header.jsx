import React from "react";
import { useAuth } from "../../context/UserContext.jsx";

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
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.name || "Student"}!
            </h1>
            <p className="text-blue-100 mt-1">
              Ready to join a learning session?
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Logout Button */}
            <button
              onClick={onLogout}
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

            <div className="text-right">
              <p className="text-sm text-blue-100">Student ID</p>
              <p className="font-medium">
                {user?.email?.split("@")[0] || "N/A"}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold">
                {getInitials(user?.name)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
