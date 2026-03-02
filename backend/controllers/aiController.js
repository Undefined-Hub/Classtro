const { generateAIResponse, checkAIHealth } = require('../services/ai/core');
const { buildChatPrompt } = require('../services/ai/prompts/chatPrompt');
const { getMemory, storeMemory, extractSummary, getUserIdentifier } = require('../services/ai/memoryManager');
const { isFollowUpQuestion } = require('../services/ai/followUpDetector');
const { detectIntent } = require('../services/ai/intentDetector');

// chatbot controller
const handleChatRequest = async (req, res, next) => {
  try {
    const { message, role, page, isAuthenticated } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const isUserAuthenticated = !!req.user || !!isAuthenticated;
    const effectiveRole = isUserAuthenticated ? role : 'guest';

    if (!effectiveRole) {
      return res.status(400).json({
        success: false,
        error: 'User role is required',
      });
    }

    // Check intent first to determine if we need memory
    const intent = detectIntent(message);
    let previousContext = null;

    // For GENERAL mode only: check for follow-up questions and retrieve memory
    if (intent === "GENERAL") {
      const userId = getUserIdentifier(req);
      
      if (isFollowUpQuestion(message)) {
        previousContext = getMemory(userId);
        if (previousContext) {
          console.log(`[MEMORY] Retrieved context for ${userId}`);
        }
      }
    }

    const { prompt, intent: detectedIntent, maxTokens } = buildChatPrompt({
      role: effectiveRole,
      page: page || 'general',
      message,
      isAuthenticated: isUserAuthenticated,
      previousContext,
    });

    console.log(`[AI MODE] ${detectedIntent} | maxTokens: ${maxTokens}${previousContext ? ' | with-context' : ''}`);

    const aiResponse = await generateAIResponse(prompt, {
      temperature: 0.3,
      maxTokens,
    });

    // For GENERAL mode: extract summary and store memory
    let finalResponse = aiResponse;
    if (detectedIntent === "GENERAL") {
      const userId = getUserIdentifier(req);
      const { summary, cleanResponse } = extractSummary(aiResponse);
      
      storeMemory(userId, message, summary);
      finalResponse = cleanResponse;
      
      console.log(`[MEMORY] Stored summary for ${userId}`);
    }

    res.status(200).json({
      success: true,
      data: {
        message: finalResponse,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Chat Request Error:', error);
    next(error);
  }
};

const handleInsightsRequest = async (req, res, next) => {
  res.status(501).json({
    success: false,
    message: 'Insights feature coming soon',
  });
};

const handleHealthCheck = async (req, res, next) => {
  try {
    const isHealthy = await checkAIHealth();

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      service: 'AI Service',
      status: isHealthy ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI Health Check Error:', error);
    res.status(503).json({
      success: false,
      service: 'AI Service',
      status: 'unavailable',
      error: error.message,
    });
  }
};

module.exports = {
  handleChatRequest,
  handleInsightsRequest,
  handleHealthCheck,
};
