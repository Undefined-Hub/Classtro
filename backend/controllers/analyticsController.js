// controllers/analyticsController.js
const SessionAnalytics = require("../models/SessionAnalytics");
const { buildAnalytics, buildFrontendAnalytics, formatStoredAnalytics, generateParticipantStats, generateFeedbackStats } = require("../services/analyticsBuilder");
const {validateInput} = require("../utils/validateInput");
const {
  generateAnalyticsSchema,
  sessionIdSchema,
} = require("../schemas/analyticsSchemas");

// Generate analytics for a session
const generateAnalytics = async (req, res, next) => {
  try {
    const params = validateInput(sessionIdSchema, req.params);
    const body = validateInput(generateAnalyticsSchema, req.body);
    
    const { sessionId } = params;
    const { sections = {} } = body;

    // Set default sections if not provided
    const defaultSections = {
      participants: true,
      timeline: true,
      polls: true,
      qna: true,
      attendance: true,
      feedback: true,
      ai: false,
      ...sections,
    };

    // Build analytics object
    const analytics = await buildAnalytics(sessionId, defaultSections);

    // Save or overwrite existing analytics
    await SessionAnalytics.findOneAndUpdate(
      { sessionId },
      analytics,
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Analytics generated successfully",
      generated: true,
    });
  } catch (error) {
    console.error("Generate analytics error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.message,
      });
    }
    next(error);
  }
};

// Get analytics for a session
const getAnalytics = async (req, res, next) => {
  try {
    const params = validateInput(sessionIdSchema, req.params);
    const { sessionId } = params;

    const analytics = await SessionAnalytics.findOne({ sessionId })
      .populate("sessionId", "title startAt endAt")
      .populate("roomId", "title subject");

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: "Analytics not generated yet",
      });
    }

    // Refresh feedback section to include any new submissions
    const latestFeedback = await generateFeedbackStats(sessionId);
    analytics.sections.feedback = latestFeedback;

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.message,
      });
    }
    next(error);
  }
};

// Delete analytics (for regeneration)
const deleteAnalytics = async (req, res, next) => {
  try {
    const params = validateInput(sessionIdSchema, req.params);
    const { sessionId } = params;

    const deleted = await SessionAnalytics.findOneAndDelete({ sessionId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Analytics not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Analytics deleted successfully",
    });
  } catch (error) {
    console.error("Delete analytics error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.message,
      });
    }
    next(error);
  }
};

// Test endpoint - Get participant stats only (for development/testing)
const getParticipantStatsTest = async (req, res, next) => {
  try {
    const params = validateInput(sessionIdSchema, req.params);
    const { sessionId } = params;

    const participantStats = await generateParticipantStats(sessionId);

    return res.status(200).json({
      success: true,
      data: participantStats,
    });
  } catch (error) {
    console.error("Get participant stats test error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.message,
      });
    }
    next(error);
  }
};

// Get analytics in frontend-compatible format (cache-first approach)
const getFrontendAnalytics = async (req, res, next) => {
  try {
    const params = validateInput(sessionIdSchema, req.params);
    const { sessionId } = params;

    // Check if analytics are already generated and cached
    const cachedAnalytics = await SessionAnalytics.findOne({ sessionId })
      .populate("sessionId", "title startAt endAt")
      .populate("roomId", "name");

    if (cachedAnalytics) {
      // Analytics exist - format from cached sections
      console.log("📊 Serving analytics from cache for session:", sessionId);
      
      // Refresh feedback section to include any new submissions
      const latestFeedback = await generateFeedbackStats(sessionId);
      cachedAnalytics.sections.feedback = latestFeedback;
      
      const analyticsData = await formatStoredAnalytics(cachedAnalytics);
      
      return res.status(200).json({
        success: true,
        generated: true,
        fromCache: true,
        generatedAt: cachedAnalytics.generatedAt,
        data: analyticsData,
      });
    }

    // Analytics not generated yet - return not-generated state
    console.log("⚠️ Analytics not generated yet for session:", sessionId);
    return res.status(200).json({
      success: true,
      generated: false,
      message: "Analytics have not been generated yet. Please generate analytics first.",
      data: null,
    });
    
  } catch (error) {
    console.error("Get frontend analytics error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.message,
      });
    }
    next(error);
  }
};

module.exports = {
  generateAnalytics,
  getAnalytics,
  getFrontendAnalytics,
  deleteAnalytics,
  getParticipantStatsTest,
};