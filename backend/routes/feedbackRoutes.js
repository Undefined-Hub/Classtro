const express = require("express");
const rateLimit = require("express-rate-limit");
const { uploadScreenshot, handleUploadError } = require("../config/multer");
const {
  getBugModules,
  createFeedback,
  getAllFeedback,
  getFeedbackStats,
  getFeedbackById,
  updateFeedbackStatus,
} = require("../controllers/feedbackController");
const { setFeedbackType, setBugType } = require("../middlewares/setFeedbackType");

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

// Get bug report modules
router.get("/bug-modules", getBugModules);

// Feedback Routes (type: feedback)
router.post(
  "/systemFeedback",
  submitLimit,
  uploadScreenshot,
  handleUploadError,
  setFeedbackType,
  createFeedback,
);

// Bug Report Routes (type: bug)
router.post(
  "/systemBug",
  submitLimit,
  uploadScreenshot,
  handleUploadError,
  setBugType,
  createFeedback,
);

// Common routes for both types
router.get("/", getAllFeedback);
router.get("/stats/overview", getFeedbackStats);
router.get("/:id", getFeedbackById);
router.patch("/:id/status", updateFeedbackStatus);

module.exports = router;
