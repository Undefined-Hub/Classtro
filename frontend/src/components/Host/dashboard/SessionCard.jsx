import React from "react";

const SessionCard = ({ session, onSessionClick }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div
      className={`h-2 rounded-t-lg ${session.isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
    ></div>
    <div className="p-5">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          {session.title}
        </h4>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            session.isActive
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          {session.isActive ? "Active" : "Completed"}
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Session Code:
          </span>
          <span className="font-mono font-medium text-gray-900 dark:text-white">
            {session.code}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Participants:
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {session.participantCount} / {session.maxStudents}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Started:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {new Date(session.startAt).toLocaleString()}
          </span>
        </div>
      </div>
      <div className="mt-5 flex space-x-2">
        {session.isActive ? (
          <button
            onClick={() => onSessionClick(session)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Join Session
          </button>
        ) : (
          <button
            onClick={() => onSessionClick(session)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            View Report
          </button>
        )}
      </div>
    </div>
  </div>
);

export default SessionCard;
