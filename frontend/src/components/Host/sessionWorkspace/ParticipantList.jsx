import React from "react";
import ProfileImageOrInitials from "../../ProfileImageOrInitials";

const ParticipantList = ({
  participants,
  sessionData,
  questions,
  onKickParticipant,
  onShowConfirmClose,
  getInitials,
  getAvatarColor,
  onOpenBroadcastModal,
}) => {
  const activeParticipantsCount = participants.filter((p) => p.isActive).length;

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center justify-between">
          <span>Students ({activeParticipantsCount})</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Max: {sessionData.maxStudents}
          </span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {participants.filter((p) => p.isActive).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No active participants yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Share the session code to allow students to join
            </p>
          </div>
        ) : (
          participants
            .filter((p) => p.isActive)
            .map((participant) => (
              <div
                key={participant._id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group"
              >
                <div className="flex items-center">
                  <ProfileImageOrInitials
                    src={participant.userId.profilePicture}
                    alt={participant.userId.name}
                    initials={getInitials(participant.userId.name)}
                    className="w-8 h-8 rounded-full mr-3"
                    avatarColorClass={getAvatarColor(participant.name)}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {participant.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Joined{" "}
                      {new Date(participant.joinedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onKickParticipant(participant.id)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
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
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                </button>
              </div>
            ))
        )}

        {participants.filter((p) => !p.isActive).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Left the session
            </div>
            {participants
              .filter((p) => !p.isActive)
              .map((participant) => (
                <div
                  key={participant._id}
                  className="flex items-center p-2 opacity-60"
                >
                  <ProfileImageOrInitials
                    src={participant.userId?.profilePicture}
                    alt={participant.userId.name}
                    initials={getInitials(participant.userId.name)}
                    className="w-8 h-8 rounded-full mr-3 grayscale"
                    avatarColorClass="bg-gray-400 dark:bg-gray-600"
                  />
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
            onClick={onOpenBroadcastModal}
          >
            <svg
              className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400"
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
            Session Announcements
          </button>
          <button
            onClick={onShowConfirmClose}
            className="w-full flex items-center p-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            End Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantList;
