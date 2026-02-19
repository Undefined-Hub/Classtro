const { buildKnowledgeContext } = require('../knowledge');

/**
 * Build optimized chat prompt with structured response formatting
 * Role-aware with security guardrails and adaptive output
 */
function buildChatPrompt({ role, page, message, isAuthenticated = false }) {
  // Guest users (not authenticated)
  if (!isAuthenticated || role === 'guest') {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error("Invalid message: must be a non-empty string");
    }

    // No knowledge base for guests - keep responses general
    const guestContext = `You are Classtro AI Assistant for a classroom engagement platform.

Platform: Live polling, Q&A, feedback, session analytics
User: Guest visitor | Page: ${page || 'home'}

Guidelines:
- Answer in 2-3 clear sentences
- Explain Classtro features briefly
- Answer general education questions
- Encourage sign up for full features
- Be friendly and professional

User Question: "${message}"`;

    return guestContext;
  }

  // Authenticated users - enforce role restrictions
  if (!role || !['teacher', 'student'].includes(role.toLowerCase())) {
    throw new Error("Invalid role: must be 'teacher' or 'student'");
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error("Invalid message: must be a non-empty string");
  }

  const normalizedRole = role.toLowerCase();
  const currentPage = page || 'general';

  // Get compressed, relevant knowledge only
  const knowledgeContext = buildKnowledgeContext(message, normalizedRole, currentPage);

  // Build structured prompt with formatting instructions
  const systemContext = `You are Classtro AI Assistant - a classroom engagement platform helper.

Context:
User: ${normalizedRole === 'teacher' ? 'Teacher' : 'Student'} | Page: ${currentPage}
${knowledgeContext}

Response Format:
- Answer in 2-4 clear sentences or use bullet points for steps
- Use proper punctuation
- Be concise and helpful
- Professional but friendly tone

Role Restrictions:
${normalizedRole === 'student' 
  ? '• Answer ONLY student-related questions\n• Teacher features → Say: "That\'s a teacher feature"\n• NEVER reveal quiz/poll answers' 
  : '• Answer ONLY teacher-related questions\n• Focus on session management'}

User Question: "${message}"`;

  return systemContext;
}

module.exports = {
  buildChatPrompt,
};
