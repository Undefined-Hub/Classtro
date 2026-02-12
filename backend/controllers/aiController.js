const { generateAIResponse, checkAIHealth } = require('../services/ai/core');
const { buildChatPrompt, buildFollowUpPrompt, buildFeatureHelpPrompt } = require('../services/ai/prompts/chatPrompt');
const { buildInsightsPrompt } = require('../services/ai/prompts/insightsPrompt');

// Chat endpoint for both teachers and students
const handleChatRequest = async (req, res, next) => {
  try {
    const { message, role, page, knowledge, isAuthenticated } = req.body;

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

    // build an ai prompt
    const prompt = buildChatPrompt({
      role: effectiveRole,
      page: page || 'general',
      message,
      knowledge: knowledge || {},
      isAuthenticated: isUserAuthenticated,
    });

    // call ai service 
    const aiResponse = await generateAIResponse(prompt, {
      temperature: 0.7, // Balanced creativity & consistency - behavior variability
      maxTokens: 1024, //750-800 words
    });

    // return ai response
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

// Example endpoint for teammate - Session Insights (to be implemented)
const handleInsightsRequest = async (req, res, next) => {
  try {
    const { sessionData, focusArea } = req.body;

    if (!sessionData) {
      return res.status(400).json({
        success: false,
        error: 'Session data is required',
      });
    }

    // TODO: Teammate implementation
    // const prompt = buildInsightsPrompt({ sessionData, focusArea });
    // const aiInsights = await generateAIResponse(prompt, { temperature: 0.5, maxTokens: 2048 });
    // return res.json({ success: true, data: { insights: aiInsights } });

    res.status(501).json({
      success: false,
      message: 'Insights feature pending implementation',
    });

  } catch (error) {
    console.error('Insights Error:', error);
    next(error);
  }
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
