// LivePoll.jsx
import React, { use } from "react";
import { useHostSession } from "../../../context/HostSessionContext";
const LivePoll = () => {
  const { activePoll, handleEndPoll } = useHostSession();
  if (!activePoll) return null;
  const totalVotes = activePoll.options.reduce(
    (sum, opt) => sum + opt.votes,
    0
  );  

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg mb-8 overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Live Poll
          </span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
            {activePoll.question}
          </h3>
        </div>
        <button
          onClick={handleEndPoll}
          className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          End Poll
        </button>
      </div>
      <div className="p-5">
        <div className="space-y-4">
          {activePoll.options.map((option, index) => {
            const percentage =
              totalVotes > 0
                ? Math.round((option.votes / totalVotes) * 100)
                : 0;
            return (
              <div key={option._id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {option.text}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {option.votes} votes ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            Total Responses: {totalVotes}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Students can vote in real-time
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePoll;
