const express = require("express");
const router = express.Router();
const broadcastController = require("../controllers/broadcastController");
const authenticateJWT = require("../middlewares/authenticateJWT");

// All broadcast routes require authentication
router.use(authenticateJWT);

// Add a broadcast to a session
router.post("/:sessionId/broadcasts", broadcastController.addBroadcast);

// Get all broadcasts for a session
router.get("/:sessionId/broadcasts", broadcastController.getBroadcasts);

// Delete a specific broadcast
router.delete(
  "/:sessionId/broadcasts/:broadcastId",
  broadcastController.deleteBroadcast,
);

module.exports = router;
