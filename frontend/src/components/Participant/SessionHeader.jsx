import React from 'react';
import SessionClock from './SessionClock.jsx';

const SessionHeader = ({ sessionData, onLeave }) => {
    return (
        <>
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                    Live Session
                                </span>
                            </div>
                            <SessionClock className="text-sm text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {sessionData?.session?.title || "Session"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Code: {sessionData?.joinCode || "N/A"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Host: {sessionData?.session?.teacherId?.name || "Unknown"}
                                </p>
                            </div>

                            <button
                                onClick={onLeave}
                                className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-lg text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                                Leave Session
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>

    );
};

export default SessionHeader;
