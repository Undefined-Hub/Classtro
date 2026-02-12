import React from "react";
import SessionClock from "./SessionClock.jsx";

const SessionHeader = ({ sessionData, onLeave }) => {
  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left Section - Session Info */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {/* Live Indicator */}
              <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-md flex-shrink-0">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Live
                </span>
              </div>
              
              {/* Session Clock */}
              <SessionClock className="text-base text-gray-600 dark:text-gray-400 font-medium flex-shrink-0" />
              
              {/* Divider */}
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>
              
              {/* Session Title */}
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate hidden sm:block">
                {sessionData?.session?.title || "Session"}
              </h1>
              
              {/* Session Code */}
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-md flex-shrink-0">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
                <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  {sessionData?.joinCode || "N/A"}
                </span>
              </div>
              
              {/* Host Name */}
              <div className="hidden lg:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-md flex-shrink-0">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {sessionData?.session?.teacherId?.name || "Unknown"}
                </span>
              </div>
            </div>

            {/* Right Section - Leave Button */}
            <button
              onClick={onLeave}
              className="inline-flex items-center justify-center px-4 py-2 bg-red-50 dark:bg-red-900/20 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors duration-150 flex-shrink-0"
            >
              <svg
                className="w-4 h-4 mr-2"
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
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionHeader;
