const { buildKnowledgeContext } = require('../knowledge');

/**
 * Build optimized chat prompt with minimal knowledge injection
 * Role-aware with security guardrails
 */
function buildChatPrompt({ role, page, message, isAuthenticated = false }) {
  // Guest users (not authenticated)
  if (!isAuthenticated || role === 'guest') {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error("Invalid message: must be a non-empty string");
    }

    // No knowledge base for guests - keep responses general
    const guestContext = `You are Classtro AI Assistant for a real-time classroom engagement platform.

**Platform:** Live polling, Q&A, feedback, session analytics for educational institutions

**User:** Guest visitor | Page: ${page || 'home'}

**Response Style:**
- Short & precise: 2-3 sentences max
- Conversational & friendly tone
- Easy to understand
- Engaging & helpful

**Guidelines:**
- Explain Classtro features briefly
- Answer general education questions
- Encourage sign up for full features
- Be welcoming

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

  // Build minimal, focused system prompt
  const systemContext = `You are Classtro AI Assistant - a real-time classroom engagement platform.

**User:** ${normalizedRole === 'teacher' ? 'Teacher' : 'Student'} | Page: ${currentPage}

**Response Rules:**
- Maximum 2-3 sentences
- Concise, actionable advice
- Match user's ${normalizedRole} role only
${knowledgeContext}

**Role Restrictions:**
${normalizedRole === 'student' 
  ? '- Answer ONLY student questions (joining sessions, polls, Q&A, feedback)\n- If asked about teacher features: "That\'s a teacher feature. As a student, you can join sessions and participate."\n- NEVER reveal quiz/poll answers\n- Guide honest participation' 
  : '- Answer ONLY teacher questions (creating sessions, managing rooms, polls, analytics)\n- If asked about student features: "That\'s from student view. As a teacher, you manage sessions and view analytics."\n- Help create engaging sessions'}

User Question: "${message}"`;

  return systemContext;
}

module.exports = {
  buildChatPrompt,
};
