import React from "react";

const QAManager = ({
  questions,
  // onUpvoteQuestion,
  onMarkAnswered,
  activeView,
  setActiveView,
  isParticipantListOpen = true,
}) => {
  // Sort questions by upvotes
  const sortedQuestions = [...questions].sort((a, b) => b.upvotes - a.upvotes);

  if (activeView !== "qa") return null;

  return (
    <div className="p-3 h-full overflow-y-auto no-scrollbar">
      <div
        className={`mx-auto transition-all duration-300 ${
          isParticipantListOpen ? "max-w-5xl" : "max-w-4xl"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Q&A Session ({sortedQuestions.length})
          </h2>
          <button
            onClick={() => setActiveView("main")}
            className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
        </div>

        {sortedQuestions.length > 0 ? (
          <div className="space-y-3">
            {sortedQuestions.map((question) => (
              <div
                key={question.id}
                className={`group relative bg-white dark:bg-gray-700 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
                  question.answered
                    ? "border-green-200 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                {/* Status indicator */}
                {question.answered && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500 dark:bg-green-400 rounded-l-xl"></div>
                )}

                <div className="p-5">
                  <div className="flex items-start space-x-4">
                    {/* Upvote section */}
                    <div className="flex flex-col items-center space-y-1 select-none flex-shrink-0">
                      <button
                        // onClick={() => onUpvoteQuestion && onUpvoteQuestion(question.id)}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                          question.upvotes > 0
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500"
                        }`}
                        disabled={question.answered}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <span
                        className={`text-sm font-semibold min-w-[20px] text-center ${
                          question.upvotes > 0
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {question.upvotes}
                      </span>
                    </div>

                    {/* Question content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-4">
                          <p className="text-base font-medium text-gray-900 dark:text-white mb-2 leading-relaxed break-words">
                            {question.text}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              {question.isAnonymous ? (
                                <>
                                  {/* <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <svg className="w-2 h-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                </div> */}
                                  <span className="font-medium">Anonymous</span>
                                </>
                              ) : (
                                <>
                                  {/* <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                  <svg className="w-2 h-2 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                </div> */}
                                  <span className="font-medium">
                                    {question.studentName}
                                  </span>
                                </>
                              )}
                            </div>
                            <span className="text-gray-300 dark:text-gray-600">
                              •
                            </span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                              {new Date(question.timestamp).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Action button */}
                        <div className="flex-shrink-0 ml-3">
                          {question.answered ? (
                            <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                              <svg
                                className="w-3 h-3 mr-1.5"
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
                              Answered
                            </div>
                          ) : (
                            <button
                              onClick={() => onMarkAnswered(question.id)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <svg
                                className="w-3 h-3 mr-1.5"
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
                              Mark Answered
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-8 text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl mb-4">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Questions Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              Students haven't asked any questions yet. They can submit
              questions anonymously or with their name during the session.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QAManager;
