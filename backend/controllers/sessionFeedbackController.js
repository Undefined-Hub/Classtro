const SessionFeedback = require("../models/SessionFeedback");
const Session = require("../models/Session");
const { validateInput } = require("../utils/validateInput");
const {
  submitSessionFeedbackSchema,
  sessionIdParamSchema,
} = require("../schemas/sessionFeedbackSchemas");

// Submit session feedback
const submitSessionFeedback = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    console.log("Session feedback submission attempt:", {
      sessionId,
      userId,
      body: req.body,
    });

    // Validate session ID
    validateInput(sessionIdParamSchema, { sessionId });

    // Convert rating to number if it's a string (from FormData)
    const bodyData = { ...req.body };
    if (bodyData.rating && typeof bodyData.rating === "string") {
      bodyData.rating = parseInt(bodyData.rating, 10);
    }

    // Validate feedback data
    const validatedData = validateInput(submitSessionFeedbackSchema, bodyData);

    // Check if session exists
    const session = await Session.findById(sessionId)
      .select("isActive roomId startAt endAt participantCount totalParticipants teacherId")
      .lean();

    if (!session) {
      console.log("Session not found:", sessionId);
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    console.log("Session found:", {
      isActive: session.isActive,
      participantCount: session.participantCount,
      totalParticipants: session.totalParticipants,
    });

    // Check if session has ended (isActive should be false)
    if (session.isActive !== false) {
      console.log("Session still active, isActive:", session.isActive);
      return res.status(400).json({
        success: false,
        message: "Feedback can only be submitted for ended sessions",
        currentStatus: session.isActive ? "active" : "unknown",
      });
    }

    // Note: Your Session model doesn't have participants array
    // So we'll skip participant verification for now
    // This means any authenticated user can submit feedback
    // You may want to add participant tracking later

    // Check for duplicate feedback
    const existingFeedback = await SessionFeedback.findOne({
      sessionId,
      userId,
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted feedback for this session",
      });
    }

    // Create feedback
    const feedback = await SessionFeedback.create({
      sessionId,
      roomId: session.roomId,
      userId,
      rating: validatedData.rating,
      description: validatedData.description || "",
      submittedAt: new Date(),
    });

    console.log(`Session feedback submitted by user ${userId} for session ${sessionId}`);

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: {
        feedbackId: feedback._id,
        rating: feedback.rating,
        submittedAt: feedback.submittedAt,
      },
    });
  } catch (err) {
    console.error("Error submitting session feedback:", err);

    // Handle duplicate key error (if compound unique index catches it)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted feedback for this session",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
      error: err.message,
    });
  }
};

// Get all feedback for a session
const getSessionFeedback = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Validate session ID
    validateInput(sessionIdParamSchema, { sessionId });

    // Check if session exists
    const session = await Session.findById(sessionId).select("roomId teacherId");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Check if requesting user is the host of the session
    if (session.teacherId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the session host can view feedback",
      });
    }

    // Get all feedback for the session
    const feedback = await SessionFeedback.find({ sessionId })
      .populate("userId", "name email")
      .select("userId rating description submittedAt")
      .sort({ submittedAt: -1 })
      .lean();

    // Calculate statistics
    const totalFeedback = feedback.length;
    const averageRating =
      totalFeedback > 0
        ? (
            feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
          ).toFixed(2)
        : 0;

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedback.forEach((f) => {
      ratingDistribution[f.rating]++;
    });

    res.status(200).json({
      success: true,
      data: {
        feedback,
        statistics: {
          totalFeedback,
          averageRating: parseFloat(averageRating),
          ratingDistribution,
        },
      },
    });
  } catch (err) {
    console.error("Error fetching session feedback:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
      error: err.message,
    });
  }
};

module.exports = {
  submitSessionFeedback,
  getSessionFeedback,
};
