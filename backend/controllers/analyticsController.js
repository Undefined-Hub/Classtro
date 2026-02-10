// controllers/analyticsController.js
const SessionAnalytics = require("../models/SessionAnalytics");
const { buildAnalytics, buildFrontendAnalytics, generateParticipantStats } = require("../services/analyticsBuilder");
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

// Get analytics in frontend-compatible format
const getFrontendAnalytics = async (req, res, next) => {
  try {
    const params = validateInput(sessionIdSchema, req.params);
    const { sessionId } = params;

    // Get frontend-compatible analytics data
    const analyticsData = await buildFrontendAnalytics(sessionId);

    return res.status(200).json({
      success: true,
      data: analyticsData,
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