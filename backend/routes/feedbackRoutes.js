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

// Routes
router.post(
  "/",
  submitLimit,
  uploadScreenshot,
  handleUploadError,
  createFeedback,
);
router.get("/", getAllFeedback);
router.get("/stats/overview", getFeedbackStats);
router.get("/:id", getFeedbackById);
router.patch("/:id/status", updateFeedbackStatus);

module.exports = router;
