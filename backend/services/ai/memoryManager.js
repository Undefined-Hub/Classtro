// Lightweight memory store for GENERAL mode conversations
// Stores only last exchange per user (authenticated only)

const memoryStore = new Map();
const MAX_MEMORY_AGE_MS = 10 * 60 * 1000; // 10 minutes

// Generate session ID from IP and user agent for unauthenticated users
function generateSessionId(req) {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const userAgent = req.get("user-agent") || "unknown";
  return `session_${Buffer.from(ip + userAgent)
    .toString("base64")
    .slice(0, 20)}`;
}

// Get user identifier (userId for auth, sessionId for guests)
function getUserIdentifier(req) {
  if (req.user) {
    return `user_${req.user._id || req.user.id}`;
  }
  return generateSessionId(req);
}

// Store last exchange for a user
function storeMemory(userId, userMessage, assistantSummary) {
  if (!userId) return;

  memoryStore.set(userId, {
    lastUserMessage: userMessage,
    lastAssistantSummary: assistantSummary,
    timestamp: Date.now(),
  });
}

// Retrieve last exchange for a user
function getMemory(userId) {
  if (!userId) return null;

  const memory = memoryStore.get(userId);
  if (!memory) return null;

  // Check if memory is too old
  if (Date.now() - memory.timestamp > MAX_MEMORY_AGE_MS) {
    memoryStore.delete(userId);
    return null;
  }

  return {
    lastUserMessage: memory.lastUserMessage,
    lastAssistantSummary: memory.lastAssistantSummary,
  };
}

// Clear memory for a user
function clearMemory(userId) {
  if (userId) {
    memoryStore.delete(userId);
  }
}

// Extract summary from AI response
function extractSummary(aiResponse) {
  if (!aiResponse || typeof aiResponse !== "string") {
    return { summary: "AI response", cleanResponse: aiResponse };
  }

  // Try multiple patterns to match [SUMMARY: ...]
  const patterns = [
    /\[SUMMARY:\s*(.+?)\]\s*$/is, // At end with optional whitespace
    /\[SUMMARY:\s*(.+?)\]/is, // Anywhere in text
    /\nSUMMARY:\s*(.+?)(?:\n|$)/is, // Plain SUMMARY: format
  ];

  for (const pattern of patterns) {
    const match = aiResponse.match(pattern);
    if (match) {
      const summary = match[1].trim();
      // Remove the entire summary block from response
      const cleanResponse = aiResponse
        .replace(/\[SUMMARY:\s*.+?\]\s*$/is, "")
        .replace(/\[SUMMARY:\s*.+?\]/is, "")
        .replace(/\nSUMMARY:\s*.+?(?:\n|$)/is, "\n")
        .trim();

      console.log("[MEMORY] Extracted summary:", summary);
      return { summary, cleanResponse };
    }
  }

  // Fallback: generate simple summary from first line
  const lines = aiResponse.split("\n").filter((line) => line.trim());
  const firstLine = lines[0]?.trim() || "AI response";
  const summary =
    firstLine.length > 60 ? firstLine.substring(0, 57) + "..." : firstLine;

  console.log("[MEMORY] Fallback summary:", summary);
  return { summary, cleanResponse: aiResponse };
}

// Cleanup old memories periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [userId, memory] of memoryStore.entries()) {
      if (now - memory.timestamp > MAX_MEMORY_AGE_MS) {
        memoryStore.delete(userId);
      }
    }
  },
  5 * 60 * 1000,
); // Run every 5 minutes

module.exports = {
  storeMemory,
  getMemory,
  clearMemory,
  extractSummary,
  getUserIdentifier,
};
