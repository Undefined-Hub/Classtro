const { buildKnowledgeContext } = require("../knowledge");
const { detectIntent } = require("../intentDetector");
const { buildClasstroPrompt, buildGeneralPrompt } = require("../promptBuilder");

// Build chat prompt with Hybrid Mode - detects intent and returns { prompt, intent, maxTokens }
function buildChatPrompt({
  role,
  page,
  message,
  isAuthenticated = false,
  previousContext = null,
}) {
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    throw new Error("Invalid message: must be a non-empty string");
  }

  const normalizedRole = isAuthenticated && role ? role.toLowerCase() : "guest";
  const currentPage = page || "general";

  const intent = detectIntent(message);
  console.log(`[HYBRID MODE] Intent detected: ${intent}`);

  let prompt;
  let maxTokens;

  if (intent === "CLASSTRO") {
    const knowledgeContext = buildKnowledgeContext(
      message,
      normalizedRole,
      currentPage,
    );
    prompt = buildClasstroPrompt(knowledgeContext, message, normalizedRole);
    maxTokens = 180;
  } else {
    prompt = buildGeneralPrompt(message, previousContext);
    maxTokens = 130;
  }

  return { prompt, intent, maxTokens };
}

module.exports = {
  buildChatPrompt,
};
