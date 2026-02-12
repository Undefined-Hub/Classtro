import React, { useState, useEffect } from "react";
import URLPreviewCard from "../shared/URLPreviewCard";
import FilePreviewCard from "../shared/FilePreviewCard";
import ReactionPicker from "../shared/ReactionPicker";
import ReactionTrigger from "../shared/ReactionTrigger";
import { renderMarkdownJSX } from "../../utils/markdownUtils.jsx";
import api from "../../utils/api.js";

const BroadcastFeed = ({ broadcasts = [], onClose, sessionId, userId, userName }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [seenBroadcastIds, setSeenBroadcastIds] = useState(new Set());
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [pendingReactions, setPendingReactions] = useState({}); // Track optimistic updates: {broadcastId: {emoji: true/false}}

  // Format timestamp to readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "just now";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date; // difference in milliseconds
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  // Helper to render message with clickable URLs and markdown formatting
  const renderMessageWithLinks = (text) => {
    // First apply markdown formatting
    const markdownFormatted = renderMarkdownJSX(text);

    // Then handle URLs within the rendered elements
    if (typeof markdownFormatted === "string") {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = markdownFormatted.split(urlRegex);

      return parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline break-all inline-flex items-center"
            >
              {part}
              <svg
                className="w-3 h-3 ml-1 flex-shrink-0 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      });
    }

    // If markdown returned JSX array, handle URLs separately
    return (
      <span>
        {markdownFormatted}
      </span>
    );
  };

  // Mark initial broadcasts as seen (history loaded on join)
  useEffect(() => {
    if (!initialLoadComplete && broadcasts.length > 0) {
      const initialIds = new Set(broadcasts.map(b => b._id));
      setSeenBroadcastIds(initialIds);
      setInitialLoadComplete(true);
    }
  }, [broadcasts.length, initialLoadComplete]);

  // Count new unread broadcasts (only those arriving after initial load)
  useEffect(() => {
    if (!initialLoadComplete) return;

    const newBroadcasts = broadcasts.filter(b => !seenBroadcastIds.has(b._id));
    setUnreadCount(newBroadcasts.length);
  }, [broadcasts, seenBroadcastIds, initialLoadComplete]);

  // Clear pending reactions once socket confirmatio arrives (broadcasts state updated)
  // This ensures we don't show stale optimistic updates
  useEffect(() => {
    if (Object.keys(pendingReactions).length === 0) return;

    // Check if any pending reactions have been confirmed via socket updates
    // If a broadcast now has reactions where we had pending reactions, clear the pending
    setPendingReactions((prev) => {
      const updated = { ...prev };
      broadcasts.forEach((broadcast) => {
        if (updated[broadcast._id] && broadcast.reactions && broadcast.reactions.length > 0) {
          // Broadcast was updated via socket, clear pending reactions for it
          delete updated[broadcast._id];
        }
      });
      return updated;
    });
  }, [broadcasts]);

  const handleExpand = () => {
    setIsExpanded(true);
    // Mark all current broadcasts as seen
    const allIds = new Set(broadcasts.map(b => b._id));
    setSeenBroadcastIds(allIds);
    setUnreadCount(0);
  };

  const handleReaction = async (broadcastId, emoji) => {
    try {
      if (!sessionId) {
        console.error("[REACTION] Session ID not available");
        return;
      }

      if (!userId) {
        console.error("[REACTION] User ID not available");
        return;
      }

      // Find the broadcast to check if user has already reacted
      const broadcast = broadcasts.find(b => b._id === broadcastId);
      const userAlreadyReacted = broadcast?.reactions?.some(
        (r) => r.userId === userId && r.emoji === emoji
      ) || false;

      console.log("[REACTION] Clicked reaction:", { 
        broadcastId, 
        emoji, 
        userId, 
        userName,
        userAlreadyReacted,
        currentReactions: broadcast?.reactions || []
      });

      // Track optimistic update based on whether user has already reacted
      setPendingReactions((prev) => ({
        ...prev,
        [broadcastId]: {
          ...(prev[broadcastId] || {}),
          [emoji]: !userAlreadyReacted, // Will be added if not reacted, removed if already reacted
        },
      }));

      // Send request to backend (socket will confirm)
      try {
        await api.post(`/api/sessions/${sessionId}/broadcasts/${broadcastId}/react`, { emoji });
        console.log("[REACTION] API call successful for:", { broadcastId, emoji });
        // Note: Don't clear pending reactions here - let socket event confirm it
        // The socket listener (onReactionUpdate in ParticipantSession) will update broadcasts state
        // Then we'll use useEffect to clear pendingReactions once it's reflected in broadcasts
      } catch (innerError) {
        console.error("Failed to send reaction to server:", innerError);
        // On error, revert the optimistic update
        setPendingReactions((prev) => {
          const updated = { ...prev };
          delete updated[broadcastId];
          return updated;
        });
      }
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  // Helper function to get merged broadcast with pending reactions
  const getBroadcastWithPendingReactions = (broadcast) => {
    if (!pendingReactions[broadcast._id] || !userId) {
      return broadcast;
    }

    // Use userId and userName from props
    let reactions = broadcast.reactions ? [...broadcast.reactions] : [];

    // Apply pending reactions
    Object.entries(pendingReactions[broadcast._id]).forEach(([emoji, shouldBeAdded]) => {
      const existingIndex = reactions.findIndex(
        (r) => r.userId === userId && r.emoji === emoji
      );

      if (shouldBeAdded && existingIndex === -1) {
        // Add optimistic reaction (user is adding new reaction)
        reactions.push({
          emoji,
          userId,
          userName,
          timestamp: new Date(),
        });
      } else if (!shouldBeAdded && existingIndex !== -1) {
        // Remove optimistic reaction (user is removing existing reaction)
        reactions.splice(existingIndex, 1);
      }
    });

    return {
      ...broadcast,
      reactions,
    };
  };

  if (broadcasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-md">
      {/* Collapsed State - Notification Bell */}
      {!isExpanded && (
        <button
          onClick={handleExpand}
          className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 transform hover:scale-110"
        >
          {/* Bell Icon */}
          <svg
            className="w-6 h-6"
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

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}

          {/* Ripple Effect - Only show when there are new messages */}
          {unreadCount > 0 && (
            <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></span>
          )}
        </button>
      )}

      {/* Expanded State - Feed Panel */}
      {isExpanded && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full sm:w-96 max-h-[500px] flex flex-col animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Announcements
              </h3>
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                {broadcasts.length}
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Broadcasts List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {broadcasts.map((broadcast, index) => (
              <div
                key={broadcast._id || index}
                className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const hasUrls = broadcast.urls && broadcast.urls.length > 0;
                      return (
                        <>
                          <div
                            className={`p-1.5 rounded-lg ${
                              hasUrls
                                ? "bg-blue-100 dark:bg-blue-900/30"
                                : "bg-gray-200 dark:bg-gray-600"
                            }`}
                          >
                            {hasUrls ? (
                              <svg
                                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4 text-gray-600 dark:text-gray-400"
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
                            )}
                          </div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            From Host
                            {hasUrls && (
                              <span className="ml-1 text-blue-600 dark:text-blue-400">
                                • {broadcast.urls.length} {broadcast.urls.length === 1 ? "link" : "links"}
                              </span>
                            )}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {broadcast._id && (
                      <ReactionTrigger
                        onReact={(emoji) => handleReaction(broadcast._id, emoji)}
                      />
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatTimestamp(broadcast.timestamp || broadcast.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap mb-3">
                  {renderMessageWithLinks(broadcast.message)}
                </div>
                
                {/* Rich URL Preview Cards */}
                {broadcast.urlMetadata && broadcast.urls && broadcast.urls.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {broadcast.urls.map((url, idx) => (
                      <URLPreviewCard
                        key={idx}
                        url={url}
                        metadata={broadcast.urlMetadata[url]}
                        compact={broadcast.urls.length > 2}
                      />
                    ))}
                  </div>
                )}

                {/* File Attachments */}
                {broadcast.files && broadcast.files.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      📎 {broadcast.files.length} {broadcast.files.length === 1 ? "Attachment" : "Attachments"}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {broadcast.files.map((file, idx) => (
                        <FilePreviewCard
                          key={idx}
                          file={file}
                          compact={false}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Reactions Section - Show only non-zero reactions */}
                {broadcast._id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <ReactionPicker
                      broadcast={getBroadcastWithPendingReactions(broadcast)}
                      onReact={(emoji) => handleReaction(broadcast._id, emoji)}
                      currentUserId={userId}
                      compact={false}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Messages from your host • Stay updated
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastFeed;
