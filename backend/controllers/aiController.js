/**
 * AI Controller
 * 
 * Handles all AI-related HTTP requests for Classtro.
 * Orchestrates prompt building and AI response generation.
 * 
 * Architecture:
 * Request -> Controller -> Prompt Builder -> AI Core -> Response
 */

const { generateAIResponse, checkAIHealth } = require('../services/ai/core');
const { buildChatPrompt, buildFollowUpPrompt, buildFeatureHelpPrompt } = require('../services/ai/prompts/chatPrompt');
const { buildInsightsPrompt, buildComparisonPrompt, buildStudentAnalysisPrompt } = require('../services/ai/prompts/insightsPrompt');

/**
 * Handle chatbot conversation requests
 * 
 * @route POST /api/ai/chat
 * @access Private (authenticated users)
 */
const handleChatRequest = async (req, res, next) => {
  try {
    const { message, role, page, knowledge } = req.body;

    // Validate required fields
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'User role is required',
      });
    }

    // Build context-aware prompt
    const prompt = buildChatPrompt({
      role,
      page: page || 'general',
      message,
      knowledge: knowledge || {},
    });

    // Generate AI response
    const aiResponse = await generateAIResponse(prompt, {
      temperature: 0.7,
      maxTokens: 1024,
    });

    // Return formatted response
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

/**
 * Handle session insights generation requests
 * 
 * @route POST /api/ai/insights
 * @access Private (teachers only)
 */
const handleInsightsRequest = async (req, res, next) => {
  try {
    const { sessionData, focusArea } = req.body;

    // Validate session data
    if (!sessionData) {
      return res.status(400).json({
        success: false,
        error: 'Session data is required',
      });
    }

    // TODO: Once your teammate implements buildInsightsPrompt, uncomment this:
    /*
    // Build insights prompt
    const prompt = buildInsightsPrompt({
      sessionData,
      focusArea: focusArea || 'overall',
    });

    // Generate AI insights
    const aiInsights = await generateAIResponse(prompt, {
      temperature: 0.5, // Lower temperature for more factual analysis
      maxTokens: 2048,  // More tokens for detailed insights
    });

    // Return formatted insights
    res.status(200).json({
      success: true,
      data: {
        insights: aiInsights,
        sessionId: sessionData.sessionId || sessionData._id,
        generatedAt: new Date().toISOString(),
      },
    });
    */

    // Temporary response until implementation is complete
    res.status(501).json({
      success: false,
      error: 'Insights feature is under development by your teammate',
      message: 'buildInsightsPrompt implementation pending',
    });

  } catch (error) {
    console.error('Insights Request Error:', error);
    next(error);
  }
};

/**
 * Handle session comparison requests
 * 
 * @route POST /api/ai/compare-sessions
 * @access Private (teachers only)
 */
const handleSessionComparisonRequest = async (req, res, next) => {
  try {
    const { sessions, comparisonType } = req.body;

    // Validate input
    if (!sessions || !Array.isArray(sessions) || sessions.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 sessions are required for comparison',
      });
    }

    // TODO: Once your teammate implements buildComparisonPrompt, uncomment this:
    /*
    const prompt = buildComparisonPrompt(sessions, comparisonType || 'engagement');
    
    const aiComparison = await generateAIResponse(prompt, {
      temperature: 0.5,
      maxTokens: 2048,
    });

    res.status(200).json({
      success: true,
      data: {
        comparison: aiComparison,
        sessionsAnalyzed: sessions.length,
        generatedAt: new Date().toISOString(),
      },
    });
    */

    res.status(501).json({
      success: false,
      error: 'Session comparison feature is under development',
      message: 'buildComparisonPrompt implementation pending',
    });

  } catch (error) {
    console.error('Session Comparison Error:', error);
    next(error);
  }
};

/**
 * Handle feature help requests
 * 
 * @route POST /api/ai/feature-help
 * @access Private (authenticated users)
 */
const handleFeatureHelpRequest = async (req, res, next) => {
  try {
    const { featureName, role } = req.body;

    if (!featureName || !role) {
      return res.status(400).json({
        success: false,
        error: 'Feature name and user role are required',
      });
    }

    const prompt = buildFeatureHelpPrompt(featureName, role);
    
    const aiHelp = await generateAIResponse(prompt, {
      temperature: 0.6,
      maxTokens: 512,
    });

    res.status(200).json({
      success: true,
      data: {
        help: aiHelp,
        feature: featureName,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Feature Help Error:', error);
    next(error);
  }
};

/**
 * Health check for AI service
 * 
 * @route GET /api/ai/health
 * @access Public
 */
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
  handleSessionComparisonRequest,
  handleFeatureHelpRequest,
  handleHealthCheck,
};
