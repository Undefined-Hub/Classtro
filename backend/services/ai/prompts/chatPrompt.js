const { buildKnowledgeContext } = require('../knowledge');
const { detectIntent } = require('../intentDetector');
const { buildClasstroPrompt, buildGeneralPrompt } = require('../promptBuilder');

/**
 * Build chat prompt with Hybrid Mode support
 * Automatically detects intent and switches between Classtro and General modes
 * @returns {Object} { prompt: string, intent: string, maxTokens: number }
 */
function buildChatPrompt({ role, page, message, isAuthenticated = false }) {
  // Input validation
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error("Invalid message: must be a non-empty string");
  }

  const normalizedRole = (isAuthenticated && role) ? role.toLowerCase() : 'guest';
  const currentPage = page || 'general';

  // 🔍 STEP 1: Detect Intent
  const intent = detectIntent(message);
  console.log(`[HYBRID MODE] Intent detected: ${intent}`);

  // 🚀 STEP 2: Build appropriate prompt and set token limit based on intent
  let prompt;
  let maxTokens;

  if (intent === "CLASSTRO") {
    // Classtro mode: Inject knowledge base
    const knowledgeContext = buildKnowledgeContext(message, normalizedRole, currentPage);
    prompt = buildClasstroPrompt(knowledgeContext, message, normalizedRole);
    maxTokens = 180; // More tokens for knowledge-grounded responses
  } else {
    // General educational mode: Concise responses
    prompt = buildGeneralPrompt(message);
    maxTokens = 130; // Fewer tokens for concise educational answers
  }

  return { prompt, intent, maxTokens };
}

module.exports = {
  buildChatPrompt,
};
