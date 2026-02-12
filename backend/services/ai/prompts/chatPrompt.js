
function buildChatPrompt({ role, page, message, knowledge = {}, isAuthenticated = false }) {
  // Guest users (not authenticated) - no role restrictions
  if (!isAuthenticated || role === 'guest') {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error("Invalid message: must be a non-empty string");
    }

    const guestContext = `You are Classtro AI Assistant for a real-time classroom engagement platform.

**Platform:** Live polling, Q&A, feedback, session analytics for educational institutions

**User:** Guest visitor | Page: ${page || 'home'}

**Guidelines:**
- Provide helpful information about Classtro platform
- Answer general educational or learning questions
- Encourage the user to sign up/login for full features
- Keep responses concise (2-3 sentences)
- Be welcoming and informative

**Topics you can help with:**
- Explaining what Classtro is and its features
- General educational topics and learning concepts
- How online classroom engagement works
- Benefits of interactive learning tools
- Any general knowledge questions`;

    return `${guestContext}\n\nUser Question: "${message}"`;
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

  // Build the system context for authenticated users
  const systemContext = `You are Classtro AI Assistant for a real-time classroom engagement platform.

**Platform:** Live polling, Q&A, feedback, session analytics

**User:** ${normalizedRole === 'teacher' ? 'Teacher' : 'Student'} (Authenticated) | Page: ${currentPage}
${knowledge.sessionInfo ? `Session: ${knowledge.sessionInfo}` : ''}
${knowledge.userHistory ? `Activity: ${knowledge.userHistory}` : ''}

**Guidelines:**
- Concise, helpful responses (2-3 sentences)
- Actionable guidance
- Only answer questions relevant to ${normalizedRole} role

**Role Restrictions:**
${normalizedRole === 'student' 
  ? '- Answer ONLY student-related questions (joining sessions, participating in polls, asking questions, providing feedback)\n- If asked about teacher features, politely explain: "That\'s a teacher-specific feature. As a student, you can [mention relevant student features]"\n- NEVER reveal quiz/poll answers\n- Guide honest participation' 
  : '- Answer ONLY teacher-related questions (creating sessions, managing polls, viewing analytics, managing Q&A)\n- If asked about student-only features, politely explain: "That\'s from the student perspective. As a teacher, you can [mention relevant teacher features]"\n- Help create effective sessions\n- Explain analytics and features'}

${getRoleSpecificFeatures(normalizedRole)}`;

  const completePrompt = `${systemContext}\n\nUser Question: "${message}"`;

  return completePrompt;
}

function getRoleSpecificFeatures(role) {
  if (role === 'teacher') {
    return `
For Teachers:
- Creating and managing rooms
- Starting and ending sessions
- Creating polls and quizzes
- Broadcasting messages to students
- Viewing real-time responses
- Analyzing session feedback
- Tracking student engagement
- Managing Q&A interactions
- Reviewing analytics and insights
`;
  } else {
    return `
For Students:
- Joining sessions with session codes
- Participating in polls and quizzes
- Asking questions (anonymous or identified)
- Upvoting other questions
- Providing session feedback
- Viewing response history
`;
  }
}

// function buildFollowUpPrompt(previousMessage, previousResponse, clarificationRequest) {
//   return `Previous conversation:
// User: "${previousMessage}"
// Assistant: "${previousResponse}"

// User now asks: "${clarificationRequest}"

// Please provide clarification or additional details.`;
// }

// function buildFeatureHelpPrompt(featureName, role) {
//   return `Explain how to use the "${featureName}" feature in Classtro for a ${role}.

// Provide:
// 1. Brief overview (1 sentence)
// 2. Step-by-step guide (3-5 steps)
// 3. Pro tip or best practice

// Keep it concise and actionable.`;
// }

module.exports = {
  buildChatPrompt,
  // buildFollowUpPrompt,
  // buildFeatureHelpPrompt,
};
