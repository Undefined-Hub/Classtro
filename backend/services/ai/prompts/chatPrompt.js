/**
 * Chatbot Prompt Builder
 * 
 * Generates context-aware prompts for the Classtro AI Chatbot Assistant.
 * The chatbot helps teachers and students navigate the platform and
 * understand features like polls, sessions, and analytics.
 * 
 * Security Rules:
 * - No quiz/poll answer leaking
 * - Role-based response filtering
 * - No unauthorized action suggestions
 */

/**
 * Build a contextualized prompt for the chatbot
 * 
 * @param {Object} params - Prompt building parameters
 * @param {string} params.role - User role: 'teacher' or 'student'
 * @param {string} params.page - Current page/context (e.g., 'dashboard', 'session', 'analytics')
 * @param {string} params.message - User's question/message
 * @param {Object} params.knowledge - Additional context (optional)
 * @param {string} params.knowledge.sessionInfo - Current session details
 * @param {string} params.knowledge.userHistory - Recent user actions
 * @returns {string} Complete prompt for AI
 */
function buildChatPrompt({ role, page, message, knowledge = {} }) {
  // Validate required parameters
  if (!role || !['teacher', 'student'].includes(role.toLowerCase())) {
    throw new Error("Invalid role: must be 'teacher' or 'student'");
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error("Invalid message: must be a non-empty string");
  }

  const normalizedRole = role.toLowerCase();
  const currentPage = page || 'general';

  // Build the system context
  const systemContext = `You are Classtro AI Assistant, a helpful guide for a real-time classroom polling and engagement platform.

**Platform Overview:**
Classtro enables interactive learning through:
- Live polling and quizzes
- Q&A sessions
- Real-time feedback
- Session analytics
- Attendance tracking

**Current User Context:**
- Role: ${normalizedRole === 'teacher' ? 'Teacher/Instructor' : 'Student/Participant'}
- Current Page: ${currentPage}
${knowledge.sessionInfo ? `- Session Info: ${knowledge.sessionInfo}` : ''}
${knowledge.userHistory ? `- Recent Activity: ${knowledge.userHistory}` : ''}

**Response Guidelines:**
1. Be concise and helpful (2-3 sentences max unless complex explanation needed)
2. Use friendly, professional tone
3. Focus on actionable guidance
4. Reference specific UI elements when relevant

**CRITICAL SECURITY RULES:**
${normalizedRole === 'student' ? `
- NEVER reveal answers to quizzes, polls, or questions
- NEVER suggest ways to cheat or bypass restrictions
- DO NOT provide teacher-only information
- Guide students to learn and participate honestly
` : `
- Help teachers create effective polls and sessions
- Explain analytics and insights
- Guide on session management
- Suggest engagement strategies
`}

**Feature-Specific Help:**
${getRoleSpecificFeatures(normalizedRole)}

**Tone:** ${normalizedRole === 'teacher' ? 'Professional and empowering' : 'Encouraging and educational'}`;

  // Build the user message with context
  const userPrompt = `User Question: "${message}"

Please provide a helpful response based on their role and current context.`;

  // Combine system context and user message
  const completePrompt = `${systemContext}

${userPrompt}`;

  return completePrompt;
}

/**
 * Get role-specific feature descriptions
 * 
 * @param {string} role - User role
 * @returns {string} Feature descriptions
 */
function getRoleSpecificFeatures(role) {
  if (role === 'teacher') {
    return `
For Teachers:
- Creating and managing sessions
- Creating polls and quizzes
- Viewing real-time responses
- Analyzing session feedback
- Tracking student engagement
- Managing Q&A interactions
- Reviewing analytics and insights
`;
  } else {
    return `
For Students:
- Joining sessions with room codes
- Participating in polls and quizzes
- Asking questions in Q&A
- Providing session feedback
- Viewing personal response history
`;
  }
}

/**
 * Build a follow-up prompt for clarification
 * 
 * @param {string} previousMessage - Previous user message
 * @param {string} previousResponse - AI's previous response
 * @param {string} clarificationRequest - User's clarification request
 * @returns {string} Follow-up prompt
 */
function buildFollowUpPrompt(previousMessage, previousResponse, clarificationRequest) {
  return `Previous conversation:
User: "${previousMessage}"
Assistant: "${previousResponse}"

User now asks: "${clarificationRequest}"

Please provide clarification or additional details.`;
}

/**
 * Build a prompt for feature-specific help
 * 
 * @param {string} featureName - Name of the feature (e.g., 'polls', 'analytics')
 * @param {string} role - User role
 * @returns {string} Feature help prompt
 */
function buildFeatureHelpPrompt(featureName, role) {
  return `Explain how to use the "${featureName}" feature in Classtro for a ${role}.

Provide:
1. Brief overview (1 sentence)
2. Step-by-step guide (3-5 steps)
3. Pro tip or best practice

Keep it concise and actionable.`;
}

module.exports = {
  buildChatPrompt,
  buildFollowUpPrompt,
  buildFeatureHelpPrompt,
};
