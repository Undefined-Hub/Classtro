// Build Classtro-specific prompt with knowledge injection
function buildClasstroPrompt(knowledgeContext, question, role = "guest") {
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
  if (role === "student") {
    prompt += `ROLE RESTRICTION:\nYou are helping a STUDENT. Do NOT explain teacher-only features. If asked about teacher features, say "That's a teacher-only feature."\n\n`;
  } else if (role === "teacher") {
    prompt += `ROLE RESTRICTION:\nYou are helping a TEACHER. Focus on session management and teaching tools.\n\n`;
  } else {
    prompt += `NOTE:\nUser is a guest. Encourage them to sign up for full features.\n\n`;
  }

  prompt += `USER QUESTION:\n${question}`;

  return prompt;
}

// Build general educational prompt - concise responses (max 4 bullets, 120-150 words)
// Supports optional conversational memory for follow-up questions
function buildGeneralPrompt(question, previousContext = null) {
  let prompt = `You are an educational AI assistant inside Classtro.`;

  // Add previous context if available (for follow-up questions)
  if (
    previousContext &&
    previousContext.lastUserMessage &&
    previousContext.lastAssistantSummary
  ) {
    prompt += `

Previous Context:
User: ${previousContext.lastUserMessage}
Assistant Summary: ${previousContext.lastAssistantSummary}

Use the above context to answer intelligently if relevant.`;
  }

  prompt += `

Current Question:
${question}

Response Rules:
- Start with 1–2 line summary
- Use heading (##)
- Max 4 bullet points
- Each bullet: short sentence
- Total under 130 words
- Be clear and beginner-friendly
- Avoid long essays

IMPORTANT: End your response with a one-line summary in this format:
[SUMMARY: brief description of what you explained]

Example:
[SUMMARY: Explained the difference between var and let in JavaScript]`;

  return prompt;
}

module.exports = {
  buildClasstroPrompt,
  buildGeneralPrompt,
};
