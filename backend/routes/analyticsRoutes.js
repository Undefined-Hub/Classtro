// routes/analyticsRoutes.js
const express = require("express");
const {
  generateAnalytics,
  getAnalytics,
  getFrontendAnalytics,
  deleteAnalytics,
  getParticipantStatsTest,
} = require("../controllers/analyticsController");

const router = express.Router();

// Generate analytics for a session
router.post("/generate/:sessionId", generateAnalytics);

// Get analytics for a session
router.get("/:sessionId", getAnalytics);

// Get analytics in frontend-compatible format
router.get("/frontend/:sessionId", getFrontendAnalytics);

// Delete analytics (for regeneration)
router.delete("/:sessionId", deleteAnalytics);

// Test endpoint - Get participant stats only
router.get("/test/participants/:sessionId", getParticipantStatsTest);

module.exports = router;
