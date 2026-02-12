import React, { useState, useMemo } from "react";

const REACTIONS = [
  { emoji: "👍", label: "Like" },
  { emoji: "❤️", label: "Love" },
  { emoji: "🎉", label: "Celebrate" },
  { emoji: "✅", label: "Acknowledge" },
];

/**
 * ReactionPicker - Display and manage reactions on broadcasts
 * @param {Object} broadcast - The broadcast object with reactions array
 * @param {Function} onReact - Callback when user clicks a reaction
 * @param {String} currentUserId - Current user's ID
 * @param {Boolean} compact - Display in compact mode
 */
const ReactionPicker = ({ broadcast, onReact, currentUserId, compact = false }) => {
  const [showTooltip, setShowTooltip] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // Group reactions by emoji
  const reactionGroups = useMemo(() => {
    if (!broadcast.reactions || broadcast.reactions.length === 0) {
      return {};
    }

    return broadcast.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {});
  }, [broadcast.reactions]);

  // Check if current user has reacted with specific emoji
  const hasUserReacted = (emoji) => {
    if (!currentUserId || !reactionGroups[emoji]) return false;
    return reactionGroups[emoji].some((r) => r.userId === currentUserId);
  };

  // Get count for specific emoji
  const getCount = (emoji) => {
    return reactionGroups[emoji]?.length || 0;
  };

  // Get names of users who reacted with specific emoji
  const getReactors = (emoji) => {
    if (!reactionGroups[emoji]) return [];
    return reactionGroups[emoji].map((r) => r.userName);
  };

  // Handle reaction click
  const handleReactionClick = (emoji) => {
    if (onReact) {
      onReact(emoji);
    }
  };

  return (
    <div className={`flex flex-wrap items-center ${onReact ? "gap-2" : "gap-1.5"}`}>
      {REACTIONS.map(({ emoji, label }) => {
        const count = getCount(emoji);
        const isActive = hasUserReacted(emoji);
        const reactors = getReactors(emoji);

        // Only show reaction if count > 0
        if (count === 0) return null;

        return (
          <div key={emoji} className="relative">
            <button
              type="button"
              onClick={() => handleReactionClick(emoji)}
              onMouseEnter={() => setShowTooltip(emoji)}
              onMouseLeave={() => setShowTooltip(null)}
              className={`group flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-all ${
                isActive
                  ? "bg-blue-100 dark:bg-blue-900/40 border border-blue-500 dark:border-blue-400 scale-110"
                  : "bg-gray-100 dark:bg-gray-700 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:scale-105"
              } ${!onReact ? "cursor-default" : "cursor-pointer"}`}
              title={label}
            >
              <span className="text-base">{emoji}</span>
              {count > 0 && (
                <span
                  className={`text-xs font-medium ${
                    isActive
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>

            {/* Tooltip showing who reacted */}
            {showTooltip === emoji && reactors.length > 0 && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10 animate-fade-in">
                <div className="font-semibold mb-1">{label}</div>
                <div className="max-h-24 overflow-y-auto">
                  {reactors.slice(0, showAll ? reactors.length : 5).map((name, idx) => (
                    <div key={idx} className="text-gray-300 dark:text-gray-400">
                      {name}
                    </div>
                  ))}
                  {reactors.length > 5 && !showAll && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAll(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 mt-1"
                    >
                      +{reactors.length - 5} more
                    </button>
                  )}
                </div>
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReactionPicker;
