/**
 * AI Insights Prompt Builder
 * 
 * Generates prompts for AI-powered session feedback analysis.
 * Produces analytical summaries, engagement metrics, and recommendations
 * to help teachers improve future sessions.
 * 
 * This module is designed to work with session data including:
 * - Poll results
 * - Q&A interactions
 * - Feedback responses
 * - Attendance patterns
 * - Participant engagement metrics
 */

/**
 * Build a comprehensive insights prompt from session data
 * 
 * @param {Object} params - Insights generation parameters
 * @param {Object} params.sessionData - Complete session data object
 * @param {string} params.sessionData.title - Session title
 * @param {string} params.sessionData.duration - Session duration
 * @param {number} params.sessionData.participantCount - Number of participants
 * @param {Array} params.sessionData.polls - Poll data
 * @param {Array} params.sessionData.questions - Q&A data
 * @param {Array} params.sessionData.feedback - Feedback responses
 * @param {Object} params.sessionData.attendance - Attendance metrics
 * @param {string} params.focusArea - Optional specific area to analyze
 * @returns {string} Complete prompt for AI insights generation
 */
function buildInsightsPrompt({ sessionData, focusArea = 'overall' }) {
  // TODO: Your teammate should implement the prompt building logic here
  // 
  // This function should:
  // 1. Validate sessionData object
  // 2. Extract relevant metrics (polls, Q&A, feedback, attendance)
  // 3. Build a structured prompt that asks AI to:
  //    - Analyze engagement patterns
  //    - Identify strong and weak points
  //    - Provide actionable recommendations
  //    - Highlight notable participant interactions
  //    - Suggest improvements for next session
  // 
  // Expected return: A string prompt that will be sent to generateAIResponse()
  //
  // Example structure:
  // const prompt = `Analyze this classroom session data and provide insights:
  //
  // Session: ${sessionData.title}
  // Duration: ${sessionData.duration}
  // Participants: ${sessionData.participantCount}
  //
  // Poll Results:
  // ${formatPollData(sessionData.polls)}
  //
  // Q&A Activity:
  // ${formatQAData(sessionData.questions)}
  //
  // ... etc
  //
  // Please provide:
  // 1. Engagement Summary
  // 2. Key Insights
  // 3. Recommendations
  // `;
  //
  // return prompt;

  throw new Error("buildInsightsPrompt not yet implemented - awaiting teammate's implementation");
}

/**
 * Build a prompt for comparing multiple sessions
 * 
 * @param {Array<Object>} sessions - Array of session data objects
 * @param {string} comparisonType - Type of comparison ('engagement', 'participation', 'feedback')
 * @returns {string} Comparison insights prompt
 */
function buildComparisonPrompt(sessions, comparisonType = 'engagement') {
  // TODO: Implement session comparison prompt
  // 
  // This function should compare multiple sessions and identify:
  // - Trends over time
  // - Improvement areas
  // - Consistent patterns
  // - Teaching effectiveness metrics
  //
  // Your teammate can implement this after buildInsightsPrompt() is done

  throw new Error("buildComparisonPrompt not yet implemented - awaiting teammate's implementation");
}

/**
 * Build a prompt for identifying at-risk or highly engaged students
 * 
 * @param {Array<Object>} participantData - Participant engagement data
 * @param {string} analysisType - 'at-risk' or 'highly-engaged'
 * @returns {string} Student analysis prompt
 */
function buildStudentAnalysisPrompt(participantData, analysisType = 'at-risk') {
  // TODO: Implement student-level analysis prompt
  //
  // This function should help identify:
  // - Students who need additional support (at-risk)
  // - Students who are highly engaged (for recognition/leadership)
  // - Participation patterns across sessions
  // - Personalized recommendations per student
  //
  // Your teammate can implement this for advanced analytics

  throw new Error("buildStudentAnalysisPrompt not yet implemented - awaiting teammate's implementation");
}

/**
 * Helper function to format poll data for AI analysis
 * (Your teammate should implement this)
 */
function formatPollData(polls) {
  // TODO: Format poll results into readable text for AI
  return "";
}

/**
 * Helper function to format Q&A data for AI analysis
 * (Your teammate should implement this)
 */
function formatQAData(questions) {
  // TODO: Format Q&A interactions into readable text for AI
  return "";
}

/**
 * Helper function to format feedback data for AI analysis
 * (Your teammate should implement this)
 */
function formatFeedbackData(feedback) {
  // TODO: Format feedback responses into readable text for AI
  return "";
}

/**
 * Helper function to format attendance data for AI analysis
 * (Your teammate should implement this)
 */
function formatAttendanceData(attendance) {
  // TODO: Format attendance metrics into readable text for AI
  return "";
}

module.exports = {
  buildInsightsPrompt,
  buildComparisonPrompt,
  buildStudentAnalysisPrompt,
};
