/**
 * Prompt Builder for Hybrid AI Mode
 * Builds different prompts based on intent (Classtro vs General)
 */

/**
 * Build Classtro-specific prompt with knowledge injection
 * @param {string} knowledgeContext - Filtered knowledge from knowledge base
 * @param {string} question - User's question
 * @param {string} role - User role (teacher/student/guest)
 * @returns {string} Structured prompt with CONTEXT
 */
function buildClasstroPrompt(knowledgeContext, question, role = 'guest') {
  let prompt = `You are an AI assistant for Classtro, a classroom engagement platform.

IMPORTANT RULES:
- Only answer using the provided CONTEXT below.
- If the answer is not found in CONTEXT, say: "I couldn't find that information in Classtro's knowledge base."
- Structure responses clearly with headings and bullet points when needed.
- Keep simple answers short (1-2 sentences).
- Be professional and helpful.

FORMATTING RULES:
- Use headings (##) for main topics
- Use bullet points where helpful
- Keep simple answers short
- Avoid unnecessary verbosity

`;

  // Add CONTEXT section
  if (knowledgeContext && knowledgeContext.trim().length > 0) {
    prompt += `CONTEXT:\n${knowledgeContext}\n\n`;
  } else {
    // Fallback basic context
    prompt += `CONTEXT:\nClasstro is a live classroom engagement platform with:\n• Live Sessions with session codes\n• Anonymous Q&A\n• Real-time Polls and Quizzes\n• Session Feedback\n• Analytics Dashboard\n\n`;
  }

  // Add role-specific restrictions
  if (role === 'student') {
    prompt += `ROLE RESTRICTION:\nYou are helping a STUDENT. Do NOT explain teacher-only features. If asked about teacher features, say "That's a teacher-only feature."\n\n`;
  } else if (role === 'teacher') {
    prompt += `ROLE RESTRICTION:\nYou are helping a TEACHER. Focus on session management and teaching tools.\n\n`;
  } else {
    prompt += `NOTE:\nUser is a guest. Encourage them to sign up for full features.\n\n`;
  }

  prompt += `USER QUESTION:\n${question}`;

  return prompt;
}

/**
 * Build general educational prompt (no knowledge restrictions)
 * Optimized for concise, structured answers
 * @param {string} question - User's question
 * @returns {string} Educational AI prompt
 */
function buildGeneralPrompt(question) {
  const prompt = `You are an educational AI assistant inside Classtro.

Answer clearly and concisely.

Response Rules:
- Start with a short 1–2 sentence summary.
- Use a heading (## Topic Name).
- Maximum 4 bullet points.
- Each bullet point: 1 short sentence only.
- No long paragraphs.
- No deep theory unless specifically asked.
- Keep total response under 120–150 words.
- Be clear and beginner-friendly.

If the question is simple, answer in 3–5 lines only.

USER QUESTION:
${question}`;

  return prompt;
}

module.exports = {
  buildClasstroPrompt,
  buildGeneralPrompt,
};
