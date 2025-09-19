import React from 'react';

const ParticipantList = ({ 
  participants, 
  sessionData, 
  questions,
  onKickParticipant,
  onShowConfirmClose,
  getInitials,
  getAvatarColor,
  showBroadcastForm,
  setShowBroadcastForm,
  broadcastMessage,
  setBroadcastMessage,
  broadcastStatus,
  handleBroadcast
}) => {
  const activeParticipantsCount = participants.filter(p => p.isActive).length;

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center justify-between">
          <span>Students ({activeParticipantsCount})</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Max: {sessionData.maxStudents}</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {participants.filter(p => p.isActive).map((participant) => (
          <div 
            key={participant._id} 
            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group"
          >
            <div className="flex items-center">
              {participant.userId.profilePicture ? (
                <img 
                  src={participant.userId.profilePicture} 
                  alt={participant.userId.name} 
                  className="w-8 h-8 rounded-full mr-3"
                />
              ) : (
                <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white ${getAvatarColor(participant.name)}`}>
                  {getInitials(participant.userId.name)}
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {participant.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Joined {new Date(participant.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <button
              onClick={() => onKickParticipant(participant.id)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          </div>
        ))}

        {participants.filter(p => !p.isActive).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Left the session
            </div>
            {participants.filter(p => !p.isActive).map((participant) => (
              <div 
                key={participant._id} 
                className="flex items-center p-2 opacity-60"
              >
                {participant.userId.profilePicture ? (
                  <img 
                    src={participant.userId.profilePicture} 
                    alt={participant.userId.name} 
                    className="w-8 h-8 rounded-full mr-3 grayscale"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white bg-gray-400 dark:bg-gray-600`}>
                    {getInitials(participant.userId.name)}
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {participant.userId.name}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Left the session
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Quick Actions
        </h4>
        <div className="space-y-2">
          <button
            className="w-full flex items-center p-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            onClick={() => setShowBroadcastForm(!showBroadcastForm)}
          >
            <svg className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Message All Students
          </button>
      {/* Broadcast to all students form - merged into Quick Actions */}
      {showBroadcastForm && (
        <form onSubmit={handleBroadcast} className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Type a message here..."
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Send
            </button>
          </div>
          {broadcastStatus && <div className="text-green-600 text-xs mt-1">{broadcastStatus}</div>}
        </form>
      )}
          <button
            onClick={onShowConfirmClose}
            className="w-full flex items-center p-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            End Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantList;