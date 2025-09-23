import React from 'react';

const WelcomeContent = ({ sessionData, participantCount, broadcastMsg, questionsCount, onShowQNA }) => {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      <div className="text-center">
        {/* Default "You're All Set" content */}
        <>
          <div className="mx-auto flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-6 sm:mb-8">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">You're All Set!</h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-2">Successfully joined the session</p>

          <div className="mt-4 sm:mt-6 inline-flex items-center justify-center px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 dark:text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="sm:hidden mt-4 px-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm space-y-1">
              <div className="font-medium text-gray-900 dark:text-white truncate">{sessionData?.session?.title || 'Session'}</div>
              <div className="text-gray-500 dark:text-gray-400">Code: {sessionData?.joinCode || 'N/A'}</div>
              <div className="text-gray-500 dark:text-gray-400 truncate">Host: {sessionData?.session?.teacherId?.name || 'Unknown'}</div>
            </div>
          </div>

          {!broadcastMsg ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-lg mx-auto mt-6 sm:mt-8">
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-400 mb-2">Waiting for Host</h3>
              <p className="text-sm sm:text-base text-blue-800 dark:text-blue-300">Please keep this window open</p>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-lg mx-auto mt-6 sm:mt-8 animate-fade-in">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Announcement from Host</h3>
              <p className="text-sm sm:text-lg text-yellow-800 dark:text-yellow-200 break-words">{broadcastMsg}</p>
            </div>
          )}

          <div className="mt-6 sm:mt-8 flex items-center justify-center space-x-2 text-xs sm:text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Connected to session</span>
          </div>

          <div className="mt-6 max-w-xs sm:max-w-md mx-auto px-4 sm:px-0">
            <button onClick={onShowQNA} className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base">
              Open Q&A ({questionsCount})
            </button>
          </div>
        </>
      </div>
    </div>
  );
};

export default WelcomeContent;
