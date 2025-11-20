// controllers/analyticsController.js
const SessionAnalytics = require("../models/SessionAnalytics");
const { buildAnalytics } = require("../services/analyticsBuilder");

// Generate analytics for a session
const generateAnalytics = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sections = {} } = req.body;

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
    return res.status(500).json({
      success: false,
      message: "Failed to generate analytics",
      error: error.message,
    });
  }
};

// Get analytics for a session
const getAnalytics = async (req, res) => {
  try {
    const { sessionId } = req.params;

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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
};

// Delete analytics (for regeneration)
const deleteAnalytics = async (req, res) => {
  try {
    const { sessionId } = req.params;

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
    return res.status(500).json({
      success: false,
      message: "Failed to delete analytics",
      error: error.message,
    });
  }
};

module.exports = {
  generateAnalytics,
  getAnalytics,
  deleteAnalytics,
};