import React, { use } from "react";
import { useHostSession } from "../../../context/HostSessionContext";

const SessionStats = () => {
  // * Context
  const {
    calculateDuration, 
    activeParticipantsCount,
    questions,
    pastPolls,
    activePoll} = useHostSession();

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4">
      <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-3">
        Quick Stats
      </h3>
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {activeParticipantsCount}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Students
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
          <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
            {questions.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Questions
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {pastPolls.length + (activePoll ? 1 : 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Polls</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
          <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
            {calculateDuration()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Duration
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionStats;
