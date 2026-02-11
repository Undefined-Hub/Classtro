/**
 * AI Service Module
 * 
 * Central export point for all AI-related functionality in Classtro.
 * This provides a clean interface for importing AI capabilities throughout the application.
 * 
 * Usage Examples:
 * 
 * // In a controller:
 * const { generateAIResponse } = require('../services/ai');
 * 
 * // For chat:
 * const { buildChatPrompt } = require('../services/ai');
 * 
 * // For insights:
 * const { buildInsightsPrompt } = require('../services/ai');
 */

// Core AI functionality
const { generateAIResponse, checkAIHealth } = require('./core');

// Chatbot prompts
const {
  buildChatPrompt,
  buildFollowUpPrompt,
  buildFeatureHelpPrompt,
} = require('./prompts/chatPrompt');

// Insights prompts
const {
  buildInsightsPrompt,
  buildComparisonPrompt,
  buildStudentAnalysisPrompt,
} = require('./prompts/insightsPrompt');

module.exports = {
  // Core
  generateAIResponse,
  checkAIHealth,
  
  // Chat
  buildChatPrompt,
  buildFollowUpPrompt,
  buildFeatureHelpPrompt,
  
  // Insights
  buildInsightsPrompt,
  buildComparisonPrompt,
  buildStudentAnalysisPrompt,
};

