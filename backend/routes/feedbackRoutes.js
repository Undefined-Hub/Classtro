const express = require("express");
const rateLimit = require("express-rate-limit");
const { uploadScreenshot, handleUploadError } = require("../config/multer");
const {
  createFeedback,
  getAllFeedback,
  getFeedbackStats,
  getFeedbackById,
  updateFeedbackStatus,
} = require("../controllers/feedbackController");
const {
  submitSessionFeedback,
  getSessionFeedback,
} = require("../controllers/sessionFeedbackController");
const { setFeedbackType, setBugType } = require("../middlewares/setFeedbackType");
const authenticateJWT = require("../middlewares/authenticateJWT");

const router = express.Router();

// Rate limiting for feedback submissions
const submitLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 reports per IP per window
  message: {
    error: "Too many reports submitted. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// System Feedback Routes (type: feedback)
router.post(
  "/systemFeedback",
  submitLimit,
  uploadScreenshot,
  handleUploadError,
  setFeedbackType,
  createFeedback,
);

// System Bug Report Routes (type: bug)
router.post(
  "/systemBug",
  submitLimit,
  uploadScreenshot,
  handleUploadError,
  setBugType,
  createFeedback,
);

// Session Feedback Routes
router.post("/:sessionId/sessionFeedback", authenticateJWT, submitSessionFeedback);
router.get("/:sessionId/sessionFeedback", authenticateJWT, getSessionFeedback);

// Common routes for system feedback/bugs
router.get("/", getAllFeedback);
router.get("/stats/overview", getFeedbackStats);
router.get("/:id", getFeedbackById);
router.patch("/:id/status", updateFeedbackStatus);

module.exports = router;
