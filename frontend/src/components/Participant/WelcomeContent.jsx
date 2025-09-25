import React,{useRef, useEffect, useState} from "react";
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
    // If a poll or broadcast appears after first render, mark as interacted
    if (!firstRender.current && (activePoll || broadcastMsg)) {
      setHasInteracted(true);
    }
    // Mark first render as done
    firstRender.current = false;
  }, [activePoll, broadcastMsg]);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      <div className="text-center">
        <>
          {
            (!activePoll && !broadcastMsg && !hasInteracted) ? (
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
                    Waiting for host to start a poll or send an announcement
                  </span>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                  {activePoll ? "Live Polls" : "Session Updates"}
                </h1>
                <div className="flex justify-center">
                  <span className="inline-block px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 shadow text-sm text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {activePoll
                      ? "Participate in real-time polls from your host"
                      : "Stay tuned for announcements and activities"}
                  </span>
                </div>
              </>
            )
          }

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

          <div className="sm:hidden mt-4 px-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm space-y-1">
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {sessionData?.session?.title || "Session"}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                Code: {sessionData?.joinCode || "N/A"}
              </div>
              <div className="text-gray-500 dark:text-gray-400 truncate">
                Host: {sessionData?.session?.teacherId?.name || "Unknown"}
              </div>
            </div>
          </div>

          {activePoll && <ParticipantLivePoll/>}

          {/* Only show "Waiting for Host" if there is NO activePoll and NO broadcastMsg */}
          {!activePoll && !broadcastMsg && (
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
              <p className="text-blue-800 dark:text-blue-300">
                Please keep this window open
              </p>
            </div>
          )}

          {/* Show broadcast message if present and no activePoll */}
          {!activePoll && broadcastMsg && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-lg mx-auto mt-8 animate-fade-in">
              <div className="flex items-center justify-center mb-2">
                <svg
                  className="w-8 h-8 text-yellow-500 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                Announcement from Host
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200 text-lg">
                {broadcastMsg}
              </p>
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
