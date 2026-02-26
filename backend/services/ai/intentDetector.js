/**
 * Intent Detection Layer for Hybrid AI Mode
 * Determines if user question is Classtro-related or general educational
 */

/**
 * Detect user intent from message
 * @param {string} message - User's question
 * @returns {string} "CLASSTRO" | "GENERAL"
 */
function detectIntent(message) {
  if (!message || typeof message !== 'string') {
    return "GENERAL";
  }

  const lower = message.toLowerCase();

  // Classtro-specific keywords
  const classtroKeywords = [
    "classtro",
    "session",
    "poll",
    "qna",
    "q&a",
    "room",
    "feedback",
    "attendance",
    "anonymous",
    "teacher",
    "student",
    "join session",
    "start session",
    "session code",
    "room code",
    "create poll",
    "ask question",
    "upvote",
    "live session",
    "classroom",
    "host",
    "participant",
    "engagement",
    "analytics",
    "dashboard",
    "quiz",
    "survey",
    "rating",
    "emoji feedback"
  ];

  // Check if any Classtro keyword exists
  const isClasstro = classtroKeywords.some(keyword => lower.includes(keyword));

  return isClasstro ? "CLASSTRO" : "GENERAL";
}

module.exports = {
  detectIntent,
};
