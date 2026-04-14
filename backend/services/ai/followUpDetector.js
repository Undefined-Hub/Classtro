// Detect if a question is a follow-up to previous conversation

const FOLLOW_UP_KEYWORDS = [
  "which",
  "better",
  "that",
  "this",
  "these",
  "those",
  "why",
  "how about",
  "what about",
  "more",
  "explain further",
  "explain more",
  "tell me more",
  "elaborate",
  "clarify",
  "difference",
  "compare",
  "between",
  "example",
  "instead",
  "also",
  "too",
  "as well",
];

function isFollowUpQuestion(message) {
  if (!message || typeof message !== "string") {
    return false;
  }

  const lower = message.toLowerCase();

  // Check for follow-up keywords
  const hasFollowUpKeyword = FOLLOW_UP_KEYWORDS.some((keyword) =>
    lower.includes(keyword),
  );

  // Check if message is very short (often follow-ups)
  const isShortQuestion = message.trim().split(/\s+/).length <= 5;

  // Check if starts with follow-up patterns
  const followUpPatterns = [
    /^(which|what about|how about|why|and|but|so|or)/i,
    /^(can you|could you|please)/i,
  ];

  const startsWithFollowUp = followUpPatterns.some((pattern) =>
    pattern.test(message.trim()),
  );

  return hasFollowUpKeyword || (isShortQuestion && startsWithFollowUp);
}

module.exports = {
  isFollowUpQuestion,
};
