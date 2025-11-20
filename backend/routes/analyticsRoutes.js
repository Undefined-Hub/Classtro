// routes/analyticsRoutes.js
const express = require("express");
const {
  generateAnalytics,
  getAnalytics,
  deleteAnalytics,
} = require("../controllers/analyticsController");
const validateInput = require("../utils/validateInput");
const {
  generateAnalyticsSchema,
  sessionIdSchema,
} = require("../schemas/analyticsSchemas");

const router = express.Router();

// Generate analytics for a session
router.post(
  "/generate/:sessionId",
  validateInput(sessionIdSchema, "params"),
  validateInput(generateAnalyticsSchema, "body"),
  generateAnalytics
);

// Get analytics for a session
router.get(
  "/:sessionId",
  validateInput(sessionIdSchema, "params"),
  getAnalytics
);

// Delete analytics (for regeneration)
router.delete(
  "/:sessionId",
  validateInput(sessionIdSchema, "params"),
  deleteAnalytics
);

module.exports = router;