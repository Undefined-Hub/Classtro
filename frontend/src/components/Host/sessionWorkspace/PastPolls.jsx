// PastPolls.jsx
import React from "react";
import { useHostSession } from "../../../context/HostSessionContext";
const PastPolls = () => {
    const {pastPolls} = useHostSession();
  if (!pastPolls || pastPolls.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Past Polls
      </h3>
      <div className="space-y-4">
        {pastPolls.map((poll) => {
          const totalVotes = poll.options.reduce(
            (sum, opt) => sum + opt.votes,
            0
          );
          const winningOption = [...poll.options].sort(
            (a, b) => b.votes - a.votes
          )[0];
          const winningPercentage =
            totalVotes > 0
              ? Math.round((winningOption.votes / totalVotes) * 100)
              : 0;

          return (
            <div
              key={poll._id}
              className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {poll.question}
                </h4>
                <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Ended{" "}
                  {new Date(poll.endedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div className="p-4">
                <div className="text-sm mb-3">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Most Popular Answer:
                  </span>{" "}
                  <span className="text-gray-900 dark:text-white">
                    "{winningOption.text}" ({winningPercentage}%)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {poll.options.map((option) => {
                    const optionPercentage =
                      totalVotes > 0
                        ? Math.round((option.votes / totalVotes) * 100)
                        : 0;
                    return (
                      <div key={option.id} className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-2 ${
                            option.id === winningOption.id
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-500"
                          }`}
                        ></div>
                        <span className="text-gray-700 dark:text-gray-300 truncate">
                          {option.text}
                        </span>
                        <span className="ml-auto text-gray-500 dark:text-gray-400">
                          {optionPercentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Total responses: {totalVotes}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PastPolls;
