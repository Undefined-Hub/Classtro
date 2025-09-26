import React from "react";
import SessionStats from "./SessionStats";
import { useHostSession } from "../../../context/HostSessionContext";

const MainContent = () => {
  // * Context
  const {
    sessionData, 
    participantsList,
    questions,
    pastPolls,
    activePoll,
    setActiveView,
    setShowPollForm,
    setActiveParticipantsCount
    
  } = useHostSession();

  // * Active Participants Count
  const activeParticipantsCount = participantsList.filter((p) => p.isActive).length;
  // * Setting active participants count in context to be used in other components
  setActiveParticipantsCount(activeParticipantsCount);
  
  return (
    <div className="p-4 h-full flex flex-col items-center justify-center text-center">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to {sessionData.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            Your session is active with {activeParticipantsCount} students
            currently joined.
          </p>
          <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs dark:bg-green-900/30 dark:text-green-400">
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
            Live Session
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 text-left">
            <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-2">
              Student Engagement
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm">
              Create polls to check understanding or gather opinions.
            </p>
            <button
              onClick={() => {
                setActiveView("polls");
                setShowPollForm(true);
              }}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Create Poll
            </button>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 text-left">
            <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-2">
              Q&A Session
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm">
              View and answer student questions.
            </p>
            <button
              onClick={() => setActiveView("qa")}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              View Q&A ({questions.length})
            </button>
          </div>
        </div>

        <SessionStats
          activeParticipantsCount={activeParticipantsCount}
          questions={questions}
          pastPolls={pastPolls}
          activePoll={activePoll}
        />
      </div>
    </div>
  );
};

export default MainContent;
