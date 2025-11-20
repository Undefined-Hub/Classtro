const express = require("express");
const {
  submitSessionFeedback,
  getSessionFeedback,
} = require("../controllers/sessionFeedbackController");
const authenticateJWT = require("../middlewares/authenticateJWT");

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// POST /api/sessions/:sessionId/sessionFeedback - Submit feedback for a session
router.post("/:sessionId/sessionFeedback", submitSessionFeedback);

// GET /api/sessions/:sessionId/sessionFeedback - Get all feedback for a session (host only)
router.get("/:sessionId/sessionFeedback", getSessionFeedback);

module.exports = router;
