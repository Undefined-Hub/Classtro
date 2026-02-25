const { generateAIResponse, checkAIHealth } = require('../services/ai/core');
const { buildChatPrompt } = require('../services/ai/prompts/chatPrompt');
// const { buildInsightsPrompt } = require('../services/ai/prompts/insightsPrompt'); // TODO: Use when implementing insights

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

    // Check authentication from middleware (req.user) or request body
    const isUserAuthenticated = !!req.user || !!isAuthenticated;

    // Determine effective role: guest if not authenticated, otherwise use provided role
    const effectiveRole = isUserAuthenticated ? role : 'guest';

    if (!effectiveRole) {
      return res.status(400).json({
        success: false,
        error: 'User role is required',
      });
    }

    // Build optimized prompt with minimal knowledge injection
    const prompt = buildChatPrompt({
      role: effectiveRole,
      page: page || 'general',
      message,
      isAuthenticated: isUserAuthenticated,
    });

    // Call AI service with optimized config for gemini-2.5-flash-lite
    const aiResponse = await generateAIResponse(prompt, {
      temperature: 0.3,
      maxTokens: 200, // Optimized for structured responses
    });

    // Return AI response
    res.status(200).json({
      success: true,
      data: {
        message: aiResponse,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Chat Request Error:', error);
    next(error);
  }
};

// Session Insights - TODO: Implement later
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
