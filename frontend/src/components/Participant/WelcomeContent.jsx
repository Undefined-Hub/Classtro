import React, { useRef, useEffect, useState } from "react";
import ParticipantLivePoll from "./ParticipantLivePoll";
import { useParticipantSession } from "../../context/ParticipantSessionContext";
const WelcomeContent = ({
  questionsCount,
  onShowQNA,
  handlePollSubmit,
  participantCount,
  broadcastMsg,
}) => {
  const { sessionData, activePoll } = useParticipantSession();

  const [hasInteracted, setHasInteracted] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    // If a poll appears after first render, mark as interacted
    if (!firstRender.current && activePoll) {
      setHasInteracted(true);
    }
    // Mark first render as done
    firstRender.current = false;
  }, [activePoll]);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      <div className="text-center">
        <>
          {!activePoll && !hasInteracted ? (
            <>
              <div className="mx-auto flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-100 via-green-50 to-green-200 dark:from-green-900/40 dark:via-green-900/20 dark:to-green-800 rounded-full shadow-lg mb-8">
                <svg
                  className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 px-2 tracking-tight">
                Successfully joined the session
              </p>
              <div className="flex justify-center">
                <span className="inline-block px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  Waiting for host activities
                </span>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                Live Polls
              </h1>
              <div className="flex justify-center">
                <span className="inline-block px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 shadow text-sm text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Participate in real-time polls from your host
                </span>
              </div>
            </>
          )}

          <div className="my-4 sm:mt-6 inline-flex items-center justify-center px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
            <svg
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 dark:text-gray-400 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {participantCount} participant{participantCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="sm:hidden mt-6 px-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm space-y-3">
              {/* Session Title */}
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-200 dark:border-gray-700">
                <svg
                  className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                <span className="font-semibold text-gray-900 dark:text-white truncate text-base">
                  {sessionData?.session?.title || "Session"}
                </span>
              </div>
              
              {/* Session Code */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
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
                  <span className="text-sm text-gray-500 dark:text-gray-400">Session Code</span>
                </div>
                <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
                  {sessionData?.joinCode || "N/A"}
                </span>
              </div>
              
              {/* Host Name */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
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
                  <span className="text-sm text-gray-500 dark:text-gray-400">Hosted by</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[160px]">
                  {sessionData?.session?.teacherId?.name || "Unknown"}
                </span>
              </div>
            </div>
          </div>

          {activePoll && <ParticipantLivePoll />}

          {/* Show waiting state when no active poll */}
          {!activePoll && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 max-w-lg mx-auto mt-8">
              <div className="flex items-center justify-center mb-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-2">
                Waiting for Host
              </h3>
              <p className="text-blue-800 dark:text-blue-300 text-sm">
                Please keep this window open
              </p>
              {broadcastMsg && (
                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                      />
                    </svg>
                    <span className="text-sm font-medium">New announcement available</span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Check the notification bell in the bottom-right corner
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 max-w-xs sm:max-w-md mx-auto px-4 sm:px-0">
            <button
              onClick={onShowQNA}
              className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
            >
              Open Q&A ({questionsCount})
            </button>
          </div>
          <div className="mt-6 sm:mt-8 flex items-center justify-center space-x-2 text-xs sm:text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Connected to session
            </span>
          </div>
        </>
      </div>
    </div>
  );
};

export default WelcomeContent;
