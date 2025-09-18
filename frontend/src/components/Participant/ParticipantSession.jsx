import React, { useState, useEffect } from 'react';

const ParticipantSession = ({ sessionData, onLeaveSession, socket }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [broadcastMsg, setBroadcastMsg] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    console.log('Socket instance in ParticipantSession:', socket);
    if (!socket) return;
    const handler = (data) => {
      setBroadcastMsg(`${data.message}${data.from ? ` (from ${data.from})` : ''}`);
      console.log('Broadcast received:', data);
    };
    socket.on('broadcast:message', handler);
    return () => socket.off('broadcast:message', handler);
  }, [socket]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleLeaveSession = () => {
    if (onLeaveSession) {
      onLeaveSession();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Live Session</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatTime(currentTime)}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {sessionData?.sessionName || 'Session'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Code: {sessionData?.sessionCode || 'N/A'}
                </p>
              </div>
              
              <button
                onClick={handleLeaveSession}
                className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-lg text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Leave Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-8">
            <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Main Message */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🎉 You're All Set!
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Successfully joined the session
          </p>

          {/* Session Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-auto mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Details</h3>
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Session Name:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {sessionData?.sessionName || 'Unnamed Session'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Session Code:</span>
                <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                  {sessionData?.sessionCode || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Host:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {sessionData?.hostName || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Participants:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {sessionData?.participantCount || 1}
                </span>
              </div>
            </div>
          </div>

          {/* Waiting or Broadcast Message */}
          {!broadcastMsg ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 max-w-lg mx-auto">
              <div className="flex items-center justify-center mb-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-2">
                Waiting for Host
              </h3>
              <p className="text-blue-800 dark:text-blue-300">
                Waiting for host to start an activity.....
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                Please keep this window open and wait for instructions from your instructor.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-lg mx-auto animate-fade-in">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-yellow-500 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                Announcement from Host
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200 text-lg">
                {!broadcastMsg ? 'No new announcements' : broadcastMsg}
              </p>
            </div>
          )}

          {/* Connection Status */}
          <div className="mt-8 flex items-center justify-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Connected to session</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantSession;