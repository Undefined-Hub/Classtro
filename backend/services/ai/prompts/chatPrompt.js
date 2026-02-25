const { buildKnowledgeContext } = require('../knowledge');

/**
 * Build structured chat prompt with knowledge injection and formatting rules
 * Enforces context-driven answers and structured responses
 */
function buildChatPrompt({ role, page, message, isAuthenticated = false }) {
  // Input validation
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error("Invalid message: must be a non-empty string");
  }

  const normalizedRole = (isAuthenticated && role) ? role.toLowerCase() : 'guest';
  const currentPage = page || 'general';

  // Get relevant knowledge from knowledge base
  const knowledgeContext = buildKnowledgeContext(message, normalizedRole, currentPage);

  // Build prompt with clear CONTEXT section
  let prompt = `You are an AI assistant for Classtro, a classroom engagement platform.

IMPORTANT RULES:
- Only answer using the provided CONTEXT below.
- If the answer is not found in CONTEXT, say: "I couldn't find that information in Classtro's knowledge base."
- Structure responses clearly with headings and bullet points when needed.
- Keep simple answers short (1-2 sentences).
- Be professional and helpful.

FORMATTING GUIDELINES:
• For definitions → short paragraph
• For feature questions → heading + bullet points
• For how-to questions → step-by-step numbered list
• For explanations → headings with subpoints

`;

  // Add CONTEXT section if knowledge exists
  if (knowledgeContext && knowledgeContext.trim().length > 0) {
    prompt += `CONTEXT:\n${knowledgeContext}\n\n`;
  } else {
    prompt += `CONTEXT:\nClasstro is a live classroom engagement platform with features like:\n• Live Sessions with session codes\n• Anonymous Q&A\n• Real-time Polls and Quizzes\n• Session Feedback\n• Analytics Dashboard\n\n`;
  }

  // Add role-specific restrictions
  if (normalizedRole === 'student') {
    prompt += `ROLE RESTRICTION:\nYou are helping a STUDENT. Do NOT explain teacher-only features. If asked about teacher features, say "That's a teacher-only feature."\n\n`;
  } else if (normalizedRole === 'teacher') {
    prompt += `ROLE RESTRICTION:\nYou are helping a TEACHER. Focus on session management and teaching tools.\n\n`;
  } else {
    prompt += `NOTE:\nUser is a guest. Encourage them to sign up for full features.\n\n`;
  }

  // Add user question at the end
  prompt += `USER QUESTION:\n${message}`;

  return prompt;
}

module.exports = {
  buildChatPrompt,
};
