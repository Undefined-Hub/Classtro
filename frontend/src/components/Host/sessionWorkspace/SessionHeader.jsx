import React from 'react';

const SessionHeader = ({ 
  sessionData, 
  onNavigateBack, 
  onEndSession, 
  sessionDuration,
}) => {

  // console.log("SessionHeader rendered with sessionData:", sessionData);
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md z-10 flex-shrink-0">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3">
              <button 
                onClick={onNavigateBack}
                className="p-1.5 rounded-full hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
            <div>
              <h1 className="text-lg font-bold truncate">{sessionData.title}</h1>
              <div className="flex items-center text-xs text-blue-100 space-x-3">
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <span>{sessionData.roomName}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span>{sessionData.code}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{sessionDuration}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={onEndSession}
              className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-blue-700"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              End
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SessionHeader;