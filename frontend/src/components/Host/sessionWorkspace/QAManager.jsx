import React from "react";

const QAManager = ({
  questions,
  onUpvoteQuestion,
  onMarkAnswered,
  activeView,
  setActiveView,
}) => {
  // Sort questions by upvotes
  const sortedQuestions = [...questions].sort((a, b) => b.upvotes - a.upvotes);

  if (activeView !== "qa") return null;

  return (
    <div className="p-3 h-full overflow-y-auto">
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
        <div className="space-y-4">
          {sortedQuestions.map((question) => (
            <div
              key={question.id}
              className={`bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden ${
                question.answered
                  ? "border-l-4 border-green-500 dark:border-green-600"
                  : ""
              }`}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start space-x-3">
                    <div>
                      <div className="flex flex-col items-center space-y-1 select-none">
                        <svg
                          className="w-6 h-6 text-gray-400 dark:text-gray-500"
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
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {question.upvotes}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white mb-1">
                        {question.text}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        {question.isAnonymous ? (
                          <span>Anonymous Student</span>
                        ) : (
                          <span>{question.studentName}</span>
                        )}
                        <span className="mx-2">•</span>
                        <span>
                          {new Date(question.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {question.answered ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Answered
                      </span>
                    ) : (
                      <button
                        onClick={() => onMarkAnswered(question.id)}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
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
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Questions Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Students haven't asked any questions yet. They can submit questions
            anonymously or with their name.
          </p>
        </div>
      )}
    </div>
  );
};

export default QAManager;
